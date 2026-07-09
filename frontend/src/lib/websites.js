import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  writeBatch
} from "firebase/firestore";
import { db } from "./firebase";
import { normalizeWebsiteUrl } from "./url";

export function subscribeToWebsites(userId, callback, onError) {
  const websitesQuery = query(collection(db, "users", userId, "websites"));

  return onSnapshot(
    websitesQuery,
    (snapshot) => {
      const items = snapshot.docs
        .map((document) => ({
          id: document.id,
          ...document.data()
        }))
        .sort((left, right) => {
          const leftTime = left.createdAt?.toMillis?.() || 0;
          const rightTime = right.createdAt?.toMillis?.() || 0;
          return rightTime - leftTime;
        });

      callback(items);
    },
    (error) => {
      onError?.(error);
    }
  );
}

export async function createWebsite(userId, url) {
  const normalizedUrl = normalizeWebsiteUrl(url);
  const websiteId = doc(collection(db, "websites")).id;
  const websiteData = {
    userId,
    url: normalizedUrl,
    normalizedUrl,
    status: "Watching",
    lastChecked: null,
    lastChanged: null,
    createdAt: serverTimestamp(),
    latestSnapshotHash: "",
    latestSnapshotText: "",
    previousSnapshotHash: "",
    previousSnapshotText: "",
    lastDiffSummary: null
  };
  const batch = writeBatch(db);

  batch.set(doc(db, "websites", websiteId), websiteData);
  batch.set(doc(db, "users", userId, "websites", websiteId), websiteData);
  await batch.commit();

  return {
    id: websiteId,
    ...websiteData
  };
}

export async function removeWebsite(userId, id) {
  const batch = writeBatch(db);

  batch.delete(doc(db, "websites", id));
  batch.delete(doc(db, "users", userId, "websites", id));

  return batch.commit();
}

export async function upsertMirroredWebsite(userId, website) {
  return setDoc(doc(db, "users", userId, "websites", website.id), website, {
    merge: true
  });
}
