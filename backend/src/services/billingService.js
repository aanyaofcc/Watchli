import crypto from "crypto";
import { config } from "../config.js";
import { getDb } from "../firebase.js";
import { PLAN_DEFINITIONS } from "./planService.js";

const STRIPE_API_BASE_URL = "https://api.stripe.com/v1";

function ensureStripeConfigured() {
  if (!config.stripeSecretKey || !config.stripeProPriceId) {
    throw new Error(
      "Stripe billing is not configured. Set STRIPE_SECRET_KEY and STRIPE_PRICE_ID_PRO_MONTHLY in backend/.env."
    );
  }
}

async function stripeRequest(path, body, method = "POST") {
  ensureStripeConfigured();

  const response = await fetch(`${STRIPE_API_BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${config.stripeSecretKey}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: method === "GET" || method === "DELETE" ? undefined : new URLSearchParams(body)
  });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error?.message || "Stripe request failed.");
  }

  return payload;
}

export async function cancelUserSubscriptionForDeletion(userData = {}) {
  if (!config.stripeSecretKey || !config.stripeProPriceId) {
    return;
  }

  if (!userData.stripeSubscriptionId) {
    return;
  }

  await stripeRequest(`/subscriptions/${userData.stripeSubscriptionId}`, {}, "DELETE");
}

async function updateUserBilling(userId, data) {
  const db = getDb();

  await db.collection("users").doc(userId).set(data, { merge: true });
}

async function findUserByStripeCustomerId(stripeCustomerId) {
  if (!stripeCustomerId) {
    return null;
  }

  const db = getDb();
  const snapshot = await db
    .collection("users")
    .where("stripeCustomerId", "==", stripeCustomerId)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  return snapshot.docs[0];
}

function buildAbsoluteUrl(pathname) {
  return `${config.appUrl.replace(/\/+$/, "")}${pathname}`;
}

export async function createCheckoutSession({ userId, email }) {
  const session = await stripeRequest("/checkout/sessions", {
    mode: "subscription",
    "line_items[0][price]": config.stripeProPriceId,
    "line_items[0][quantity]": "1",
    success_url: buildAbsoluteUrl("/upgrade?checkout=success"),
    cancel_url: buildAbsoluteUrl("/upgrade?checkout=cancelled"),
    customer_email: email,
    client_reference_id: userId,
    "metadata[userId]": userId,
    "metadata[plan]": PLAN_DEFINITIONS.pro.id,
    allow_promotion_codes: "true"
  });

  return {
    url: session.url,
    sessionId: session.id
  };
}

export async function createBillingPortalSession({ userId }) {
  const db = getDb();
  const userSnapshot = await db.collection("users").doc(userId).get();
  const userData = userSnapshot.data() || {};

  if (!userData.stripeCustomerId) {
    throw new Error("No Stripe customer found for this account yet.");
  }

  const session = await stripeRequest("/billing_portal/sessions", {
    customer: userData.stripeCustomerId,
    return_url: buildAbsoluteUrl("/dashboard")
  });

  return {
    url: session.url
  };
}

function parseStripeSignature(header = "") {
  const entries = header.split(",").map((part) => part.trim());
  const values = {};

  entries.forEach((entry) => {
    const [key, value] = entry.split("=");
    if (key && value) {
      values[key] = value;
    }
  });

  return values;
}

function verifyWebhookSignature(rawBody, signatureHeader) {
  if (!config.stripeWebhookSecret) {
    throw new Error("Stripe webhook secret is not configured.");
  }

  const { t: timestamp, v1: expectedSignature } = parseStripeSignature(signatureHeader);

  if (!timestamp || !expectedSignature) {
    throw new Error("Invalid Stripe signature header.");
  }

  const payload = `${timestamp}.${rawBody}`;
  const computedSignature = crypto
    .createHmac("sha256", config.stripeWebhookSecret)
    .update(payload, "utf8")
    .digest("hex");

  if (computedSignature.length !== expectedSignature.length) {
    throw new Error("Invalid Stripe webhook signature.");
  }

  const isValid = crypto.timingSafeEqual(
    Buffer.from(computedSignature, "utf8"),
    Buffer.from(expectedSignature, "utf8")
  );

  if (!isValid) {
    throw new Error("Invalid Stripe webhook signature.");
  }
}

async function setUserPlanFromSubscription({
  userId,
  stripeCustomerId,
  stripeSubscriptionId,
  active
}) {
  if (!userId) {
    return;
  }

  await updateUserBilling(userId, {
    plan: active ? PLAN_DEFINITIONS.pro.id : PLAN_DEFINITIONS.free.id,
    stripeCustomerId: stripeCustomerId || "",
    stripeSubscriptionId: stripeSubscriptionId || "",
    billingStatus: active ? "active" : "inactive"
  });
}

export async function handleStripeWebhook({ rawBody, signatureHeader }) {
  verifyWebhookSignature(rawBody, signatureHeader);

  const event = JSON.parse(rawBody);

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      await setUserPlanFromSubscription({
        userId: session.metadata?.userId || session.client_reference_id,
        stripeCustomerId: session.customer,
        stripeSubscriptionId: session.subscription,
        active: true
      });
      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      const userDocument = await findUserByStripeCustomerId(subscription.customer);

      if (userDocument) {
        const active = ["active", "trialing"].includes(subscription.status);
        await setUserPlanFromSubscription({
          userId: userDocument.id,
          stripeCustomerId: subscription.customer,
          stripeSubscriptionId: subscription.id,
          active
        });
      }
      break;
    }

    default:
      break;
  }

  return {
    received: true
  };
}
