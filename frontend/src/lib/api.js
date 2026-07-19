import { auth } from "./firebase";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

async function request(path, options = {}) {
  const token = auth.currentUser ? await auth.currentUser.getIdToken() : "";
  const response = await fetch(`${BACKEND_URL}${path}`, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
      ...options.headers
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const contentType = response.headers.get("content-type") || "";
  const raw = await response.text();
  let payload = {};

  if (raw) {
    if (contentType.includes("application/json")) {
      try {
        payload = JSON.parse(raw);
      } catch (_error) {
        payload = {};
      }
    } else {
      try {
        payload = JSON.parse(raw);
      } catch (_error) {
        payload = {
          error: raw.slice(0, 180)
        };
      }
    }
  }

  if (!response.ok) {
    throw new Error(payload.error || response.statusText || "Request failed");
  }

  return payload;
}

async function post(path, body) {
  return request(path, {
    method: "POST",
    body
  });
}

export function checkSite(websiteId, userId) {
  return post("/api/check-site", { websiteId, userId });
}

export function createWebsite(url) {
  return post("/api/websites", { url });
}

export function inspectWebsite(url) {
  return post("/api/inspect-website", { url });
}

export function deleteWebsite(websiteId) {
  return request(`/api/websites/${websiteId}`, {
    method: "DELETE"
  });
}

export function deleteAccount(confirmation) {
  return request("/api/account", {
    method: "DELETE",
    body: { confirmation }
  });
}

export function updateNotificationPreferences(preferences) {
  return request("/api/account/notification-preferences", {
    method: "PATCH",
    body: preferences
  });
}

export function sendTestEmail(email) {
  return post("/api/send-test-email", { email });
}

export function createCheckoutSession() {
  return post("/api/billing/checkout-session", {});
}

export function createBillingPortalSession() {
  return post("/api/billing/portal-session", {});
}

export function syncWebsites() {
  return post("/api/sync-websites", {});
}

export async function fetchMyWebsites() {
  return request("/api/my-websites");
}

export async function fetchWebsiteSnapshots(websiteId) {
  const payload = await request(`/api/website-snapshots/${websiteId}`);
  return payload.snapshots || [];
}
