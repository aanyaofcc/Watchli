import { config } from "./config.js";
import { getAdminAuth } from "./firebase.js";
import express from "express";
import {
  checkAllWebsites,
  checkWebsite,
  createWebsiteForUser,
  deleteWebsiteForUser,
  inspectWebsiteUrl,
  listWebsiteSnapshots,
  listUserWebsites,
  syncUserWebsites
} from "./services/websiteService.js";
import { sendFeedbackEmail, sendTestEmail } from "./services/emailService.js";
import {
  createBillingPortalSession,
  createCheckoutSession,
  getBillingStatus
} from "./services/billingService.js";
import { deleteAccountForUser } from "./services/accountService.js";
import { updateUserNotificationPreferences } from "./services/userSettingsService.js";

export const router = express.Router();
const rateLimitStore = new Map();

function createRateLimiter({ keyPrefix, windowMs, maxRequests }) {
  return (request, response, next) => {
    const identity =
      request.authUser?.uid ||
      request.ip ||
      request.headers["x-forwarded-for"] ||
      "unknown";
    const key = `${keyPrefix}:${identity}`;
    const now = Date.now();
    const entry = rateLimitStore.get(key);

    if (!entry || now > entry.resetAt) {
      rateLimitStore.set(key, {
        count: 1,
        resetAt: now + windowMs
      });
      return next();
    }

    if (entry.count >= maxRequests) {
      return response.status(429).json({
        error: "Too many requests. Please wait a moment and try again."
      });
    }

    entry.count += 1;
    return next();
  };
}

const checkSiteRateLimit = createRateLimiter({
  keyPrefix: "check-site",
  windowMs: 60 * 1000,
  maxRequests: 20
});

const checkAllRateLimit = createRateLimiter({
  keyPrefix: "check-all",
  windowMs: 60 * 1000,
  maxRequests: 5
});

const sendEmailRateLimit = createRateLimiter({
  keyPrefix: "send-test-email",
  windowMs: 15 * 60 * 1000,
  maxRequests: 3
});

const sendFeedbackRateLimit = createRateLimiter({
  keyPrefix: "send-feedback",
  windowMs: 60 * 60 * 1000,
  maxRequests: 4
});

const createWebsiteRateLimit = createRateLimiter({
  keyPrefix: "create-website",
  windowMs: 60 * 1000,
  maxRequests: 15
});

const inspectWebsiteRateLimit = createRateLimiter({
  keyPrefix: "inspect-website",
  windowMs: 60 * 1000,
  maxRequests: 12
});

const billingRateLimit = createRateLimiter({
  keyPrefix: "billing",
  windowMs: 60 * 1000,
  maxRequests: 10
});

const deleteAccountRateLimit = createRateLimiter({
  keyPrefix: "delete-account",
  windowMs: 15 * 60 * 1000,
  maxRequests: 3
});

const notificationSettingsRateLimit = createRateLimiter({
  keyPrefix: "notification-settings",
  windowMs: 60 * 1000,
  maxRequests: 10
});

async function requireAuth(request, response, next) {
  try {
    const header = request.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";

    if (!token) {
      return response.status(401).json({ error: "Authentication required." });
    }

    const decodedToken = await getAdminAuth().verifyIdToken(token);
    request.authUser = decodedToken;
    return next();
  } catch (error) {
    console.error("Firebase auth verification failed:", error?.message || error);
    return response.status(401).json({ error: "Invalid authentication token." });
  }
}

function requireCronSecret(request, response, next) {
  if (!config.cronSecret) {
    return next();
  }

  const headerSecret = request.headers["x-cron-secret"];

  if (headerSecret !== config.cronSecret) {
    return response.status(401).json({ error: "Invalid cron secret." });
  }

  return next();
}

router.get("/api/health", (_request, response) => {
  response.json({ ok: true });
});

router.post("/api/billing/checkout-session", requireAuth, billingRateLimit, async (request, response) => {
  try {
    const result = await createCheckoutSession({
      userId: request.authUser.uid,
      email: request.authUser.email || ""
    });

    return response.json(result);
  } catch (error) {
    return response.status(400).json({ error: error.message });
  }
});

router.post("/api/billing/portal-session", requireAuth, billingRateLimit, async (request, response) => {
  try {
    const result = await createBillingPortalSession({
      userId: request.authUser.uid
    });

    return response.json(result);
  } catch (error) {
    return response.status(400).json({ error: error.message });
  }
});

router.get("/api/billing/status", requireAuth, async (request, response) => {
  try {
    const result = await getBillingStatus({
      userId: request.authUser.uid
    });

    return response.json(result);
  } catch (error) {
    return response.status(400).json({ error: error.message || "Could not load billing status." });
  }
});

router.post("/api/websites", requireAuth, createWebsiteRateLimit, async (request, response) => {
  try {
    const { url } = request.body;

    if (!url) {
      return response.status(400).json({ error: "url is required." });
    }

    const result = await createWebsiteForUser({
      userId: request.authUser.uid,
      url
    });

    return response.status(201).json(result);
  } catch (error) {
    return response.status(400).json({ error: error.message });
  }
});

router.post("/api/inspect-website", requireAuth, inspectWebsiteRateLimit, async (request, response) => {
  try {
    const { url } = request.body;

    if (!url) {
      return response.status(400).json({ error: "url is required." });
    }

    const result = await inspectWebsiteUrl({ url });
    return response.json(result);
  } catch (error) {
    return response.status(400).json({ error: error.message || "Could not inspect this website." });
  }
});

router.post("/api/check-site", requireAuth, checkSiteRateLimit, async (request, response) => {
  try {
    const { websiteId, userId } = request.body;

    if (!websiteId || !userId) {
      return response.status(400).json({ error: "websiteId and userId are required." });
    }

    if (request.authUser.uid !== userId) {
      return response.status(403).json({ error: "You can only check your own websites." });
    }

    const result = await checkWebsite({ websiteId, userId });
    return response.json(result);
  } catch (error) {
    return response.status(500).json({ error: error.message });
  }
});

router.post("/api/check-all", requireCronSecret, checkAllRateLimit, async (_request, response) => {
  try {
    const results = await checkAllWebsites();
    return response.json({
      message: "Completed checks.",
      results
    });
  } catch (error) {
    return response.status(500).json({ error: error.message });
  }
});

router.post("/api/send-test-email", requireAuth, sendEmailRateLimit, async (request, response) => {
  try {
    const { email } = request.body;

    if (!email) {
      return response.status(400).json({ error: "email is required." });
    }

    if (request.authUser.email && request.authUser.email !== email) {
      return response.status(403).json({ error: "You can only send a test email to your own account email." });
    }

    await sendTestEmail(email);
    return response.json({ message: "Test email sent successfully." });
  } catch (error) {
    return response.status(500).json({ error: error.message });
  }
});

router.post("/api/send-feedback", sendFeedbackRateLimit, async (request, response) => {
  try {
    const { name, email, message, website = "" } = request.body || {};

    if (website) {
      return response.status(400).json({ error: "Invalid submission." });
    }

    if (!email || !message) {
      return response.status(400).json({ error: "Email and message are required." });
    }

    const trimmedName = String(name || "").trim().slice(0, 80);
    const trimmedEmail = String(email || "").trim().slice(0, 180);
    const trimmedMessage = String(message || "").trim().slice(0, 2500);
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(trimmedEmail)) {
      return response.status(400).json({ error: "Enter a valid email address." });
    }

    if (trimmedMessage.length < 8) {
      return response.status(400).json({ error: "Please add a little more detail to your message." });
    }

    await sendFeedbackEmail({
      name: trimmedName,
      email: trimmedEmail,
      message: trimmedMessage
    });

    return response.json({ message: "Feedback sent successfully." });
  } catch (error) {
    return response.status(500).json({ error: error.message || "Could not send feedback." });
  }
});

router.post("/api/sync-websites", requireAuth, async (request, response) => {
  try {
    const count = await syncUserWebsites(request.authUser.uid);
    return response.json({
      message: "Website sync completed.",
      count
    });
  } catch (error) {
    return response.status(500).json({ error: error.message });
  }
});

router.get("/api/my-websites", requireAuth, async (request, response) => {
  try {
    const result = await listUserWebsites(request.authUser.uid);
    return response.json(result);
  } catch (error) {
    return response.status(500).json({ error: error.message });
  }
});

router.delete("/api/account", requireAuth, deleteAccountRateLimit, async (request, response) => {
  try {
    const { confirmation } = request.body || {};
    const expectedConfirmation = request.authUser.email || request.authUser.uid;

    if (!confirmation || confirmation.trim() !== expectedConfirmation) {
      return response.status(400).json({
        error: request.authUser.email
          ? "Type your account email exactly to confirm account deletion."
          : "Confirmation did not match this account."
      });
    }

    const result = await deleteAccountForUser({
      userId: request.authUser.uid,
      email: request.authUser.email || ""
    });

    return response.json(result);
  } catch (error) {
    return response.status(400).json({ error: error.message || "Could not delete account." });
  }
});

router.patch(
  "/api/account/notification-preferences",
  requireAuth,
  notificationSettingsRateLimit,
  async (request, response) => {
    try {
      const preferences = await updateUserNotificationPreferences(
        request.authUser.uid,
        request.body || {}
      );

      return response.json({
        message: "Notification preferences updated.",
        notificationPreferences: preferences
      });
    } catch (error) {
      return response.status(400).json({
        error: error.message || "Could not update notification preferences."
      });
    }
  }
);

router.delete("/api/websites/:websiteId", requireAuth, async (request, response) => {
  try {
    const result = await deleteWebsiteForUser({
      websiteId: request.params.websiteId,
      userId: request.authUser.uid
    });

    return response.json(result);
  } catch (error) {
    return response.status(400).json({ error: error.message });
  }
});

router.get("/api/website-snapshots/:websiteId", requireAuth, async (request, response) => {
  try {
    const snapshots = await listWebsiteSnapshots({
      websiteId: request.params.websiteId,
      userId: request.authUser.uid
    });

    return response.json({ snapshots });
  } catch (error) {
    return response.status(500).json({ error: error.message });
  }
});
