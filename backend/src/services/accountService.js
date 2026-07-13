import { getAdminAuth, getDb } from "../firebase.js";
import { cancelUserSubscriptionForDeletion } from "./billingService.js";

const USERS_COLLECTION = "users";
const WEBSITES_COLLECTION = "websites";
const SNAPSHOTS_COLLECTION = "snapshots";

async function deleteCollectionDocuments(collectionRef) {
  const snapshot = await collectionRef.get();

  if (snapshot.empty) {
    return;
  }

  const batch = collectionRef.firestore.batch();

  snapshot.docs.forEach((document) => {
    batch.delete(document.ref);
  });

  await batch.commit();
}

async function deleteWebsiteSnapshots({ db, userId, websiteId }) {
  await Promise.all([
    deleteCollectionDocuments(
      db.collection(WEBSITES_COLLECTION).doc(websiteId).collection(SNAPSHOTS_COLLECTION)
    ),
    deleteCollectionDocuments(
      db.collection(USERS_COLLECTION).doc(userId).collection("websites").doc(websiteId).collection(SNAPSHOTS_COLLECTION)
    )
  ]);
}

export async function deleteAccountForUser({ userId, email }) {
  const db = getDb();
  const adminAuth = getAdminAuth();
  const userRef = db.collection(USERS_COLLECTION).doc(userId);
  const userSnapshot = await userRef.get();
  const userData = userSnapshot.data() || {};
  const websitesSnapshot = await db
    .collection(WEBSITES_COLLECTION)
    .where("userId", "==", userId)
    .get();

  await cancelUserSubscriptionForDeletion(userData);

  for (const websiteDocument of websitesSnapshot.docs) {
    await deleteWebsiteSnapshots({
      db,
      userId,
      websiteId: websiteDocument.id
    });
  }

  const batch = db.batch();

  websitesSnapshot.docs.forEach((websiteDocument) => {
    batch.delete(websiteDocument.ref);
    batch.delete(userRef.collection("websites").doc(websiteDocument.id));
  });

  batch.delete(userRef);
  await batch.commit();
  await adminAuth.deleteUser(userId);

  return {
    success: true,
    deletedWebsiteCount: websitesSnapshot.size,
    deletedEmail: email || userData.email || ""
  };
}
