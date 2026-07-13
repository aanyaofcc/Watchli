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

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || "Request failed");
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
