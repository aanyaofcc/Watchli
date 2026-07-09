import admin from "firebase-admin";
import { config } from "./config.js";

function hasFirebaseConfig() {
  return Boolean(
    config.firebaseProjectId &&
      config.firebaseClientEmail &&
      config.firebasePrivateKey
  );
}

function ensureFirebase() {
  if (!hasFirebaseConfig()) {
    throw new Error(
      "Firebase Admin is not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in backend/.env."
    );
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: config.firebaseProjectId,
        clientEmail: config.firebaseClientEmail,
        privateKey: config.firebasePrivateKey
      })
    });
  }

  return admin;
}

export function getDb() {
  return ensureFirebase().firestore();
}

export function getAdminAuth() {
  return ensureFirebase().auth();
}

export function getAdmin() {
  return ensureFirebase();
}
