import { getDb } from "../firebase.js";

const USERS_COLLECTION = "users";

export const DEFAULT_NOTIFICATION_PREFERENCES = {
  paused: false,
  priceIncrease: true,
  priceDecrease: true,
  outOfStock: true
};

function normalizeBoolean(value, fallback) {
  return typeof value === "boolean" ? value : fallback;
}

export function normalizeNotificationPreferences(value = {}) {
  return {
    paused: normalizeBoolean(value.paused, DEFAULT_NOTIFICATION_PREFERENCES.paused),
    priceIncrease: normalizeBoolean(
      value.priceIncrease,
      DEFAULT_NOTIFICATION_PREFERENCES.priceIncrease
    ),
    priceDecrease: normalizeBoolean(
      value.priceDecrease,
      DEFAULT_NOTIFICATION_PREFERENCES.priceDecrease
    ),
    outOfStock: normalizeBoolean(
      value.outOfStock,
      DEFAULT_NOTIFICATION_PREFERENCES.outOfStock
    )
  };
}

export async function getUserNotificationPreferences(userId) {
  const db = getDb();
  const snapshot = await db.collection(USERS_COLLECTION).doc(userId).get();
  return normalizeNotificationPreferences(snapshot.data()?.notificationPreferences || {});
}

export async function updateUserNotificationPreferences(userId, preferences) {
  const db = getDb();
  const normalizedPreferences = normalizeNotificationPreferences(preferences);

  await db.collection(USERS_COLLECTION).doc(userId).set(
    {
      notificationPreferences: normalizedPreferences
    },
    { merge: true }
  );

  return normalizedPreferences;
}
