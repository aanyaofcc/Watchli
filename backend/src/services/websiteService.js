import { getAdmin, getDb } from "../firebase.js";
import { getUserPlanSummary } from "./planService.js";
import { createDiffSummary } from "../utils/diffSummary.js";
import { extractPageText, extractProductSignals, hashText } from "../utils/pageContent.js";
import { normalizeWebsiteUrl } from "../utils/url.js";
import { sendChangeEmail } from "./emailService.js";

const WEBSITES_COLLECTION = "websites";
const USERS_COLLECTION = "users";
const MAX_SNAPSHOT_LENGTH = 50000;
const SNAPSHOTS_COLLECTION = "snapshots";

function serializeTimestamp(value) {
  if (!value) {
    return null;
  }

  if (typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }

  return value;
}

function serializeWebsite(id, data) {
  return {
    id,
    ...data,
    createdAt: serializeTimestamp(data.createdAt),
    lastChecked: serializeTimestamp(data.lastChecked),
    lastChanged: serializeTimestamp(data.lastChanged)
  };
}

function serializeSnapshot(id, data) {
  return {
    id,
    ...data,
    checkedAt: serializeTimestamp(data.checkedAt)
  };
}

function getUserWebsiteRef(db, userId, websiteId) {
  return db.collection(USERS_COLLECTION).doc(userId).collection("websites").doc(websiteId);
}

function getWebsiteSnapshotRef(db, websiteId, snapshotId) {
  return db.collection(WEBSITES_COLLECTION).doc(websiteId).collection(SNAPSHOTS_COLLECTION).doc(snapshotId);
}

function getUserWebsiteSnapshotRef(db, userId, websiteId, snapshotId) {
  return getUserWebsiteRef(db, userId, websiteId).collection(SNAPSHOTS_COLLECTION).doc(snapshotId);
}

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

async function updateWebsiteRecords({ db, websiteId, userId, data }) {
  const websiteRef = db.collection(WEBSITES_COLLECTION).doc(websiteId);
  const userWebsiteRef = getUserWebsiteRef(db, userId, websiteId);

  await Promise.all([websiteRef.set(data, { merge: true }), userWebsiteRef.set(data, { merge: true })]);
}

async function saveSnapshotRecord({
  db,
  websiteId,
  userId,
  status,
  snapshotHash,
  snapshotText,
  checkedAt,
  diffSummary,
  priceData
}) {
  const snapshotId = db.collection(WEBSITES_COLLECTION).doc().id;
  const snapshotData = {
    websiteId,
    userId,
    status,
    snapshotHash,
    snapshotText,
    checkedAt,
    diffSummary: diffSummary || null,
    detectedPrices: priceData?.detectedPrices || diffSummary?.currentPrices || [],
    primaryPrice: priceData?.primaryPrice || "",
    primaryPriceValue: priceData?.primaryPriceValue ?? null,
    primaryPriceCurrency: priceData?.primaryPriceCurrency || "",
    primaryPriceSource: priceData?.primaryPriceSource || "",
    primaryPriceConfidence: priceData?.primaryPriceConfidence || 0,
    productTitle: priceData?.productTitle || ""
  };

  await Promise.all([
    getWebsiteSnapshotRef(db, websiteId, snapshotId).set(snapshotData),
    getUserWebsiteSnapshotRef(db, userId, websiteId, snapshotId).set(snapshotData)
  ]);
}

async function fetchHtml(url) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(15000),
    headers: {
      "User-Agent": "WatchliBot/1.0 (+https://watchli.local)"
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch page: ${response.status}`);
  }

  return response.text();
}

export async function createWebsiteForUser({ userId, url }) {
  const db = getDb();
  const adminDb = getAdmin();
  const normalizedUrl = normalizeWebsiteUrl(url);
  const existingWebsitesSnapshot = await db
    .collection(WEBSITES_COLLECTION)
    .where("userId", "==", userId)
    .get();
  const websites = existingWebsitesSnapshot.docs.map((document) => ({
    id: document.id,
    ...document.data()
  }));
  const duplicateWebsite = websites.find(
    (website) => normalizeWebsiteUrl(website.normalizedUrl || website.url) === normalizedUrl
  );

  if (duplicateWebsite) {
    throw new Error("That website is already being watched.");
  }

  const planSummary = await getUserPlanSummary(userId, websites.length);

  if (planSummary.websiteCount >= planSummary.websiteLimit) {
    throw new Error(
      `${planSummary.planLabel} allows up to ${planSummary.websiteLimit} websites. Upgrade to Pro to watch more pages.`
    );
  }

  const websiteRef = db.collection(WEBSITES_COLLECTION).doc();
  const now = adminDb.firestore.FieldValue.serverTimestamp();
  const websiteData = {
    userId,
    url: normalizedUrl,
    normalizedUrl,
    status: "Watching",
    lastChecked: null,
    lastChanged: null,
    createdAt: now,
    latestSnapshotHash: "",
    latestSnapshotText: "",
    previousSnapshotHash: "",
    previousSnapshotText: "",
    latestProductTitle: "",
    latestDetectedPrices: [],
    previousDetectedPrices: [],
    latestPrimaryPrice: "",
    previousPrimaryPrice: "",
    latestPrimaryPriceValue: null,
    previousPrimaryPriceValue: null,
    latestPrimaryPriceCurrency: "",
    latestPrimaryPriceSource: "",
    latestPrimaryPriceConfidence: 0,
    lastDiffSummary: null
  };
  const batch = db.batch();

  batch.set(websiteRef, websiteData);
  batch.set(getUserWebsiteRef(db, userId, websiteRef.id), websiteData);
  await batch.commit();

  return {
    website: serializeWebsite(websiteRef.id, {
      ...websiteData,
      createdAt: new Date().toISOString()
    }),
    account: await getUserPlanSummary(userId, websites.length + 1)
  };
}

export async function deleteWebsiteForUser({ websiteId, userId }) {
  const db = getDb();
  const websiteRef = db.collection(WEBSITES_COLLECTION).doc(websiteId);
  const websiteSnapshot = await websiteRef.get();

  if (!websiteSnapshot.exists) {
    throw new Error("Website not found.");
  }

  if (websiteSnapshot.data().userId !== userId) {
    throw new Error("You do not have access to this website.");
  }

  await Promise.all([
    deleteCollectionDocuments(websiteRef.collection(SNAPSHOTS_COLLECTION)),
    deleteCollectionDocuments(getUserWebsiteRef(db, userId, websiteId).collection(SNAPSHOTS_COLLECTION))
  ]);

  const batch = db.batch();
  batch.delete(websiteRef);
  batch.delete(getUserWebsiteRef(db, userId, websiteId));
  await batch.commit();

  return {
    success: true,
    account: await getUserPlanSummary(userId)
  };
}

export async function checkWebsite({ websiteId, userId }) {
  const db = getDb();
  const adminDb = getAdmin();
  const websiteRef = db.collection(WEBSITES_COLLECTION).doc(websiteId);
  const websiteSnap = await websiteRef.get();

  if (!websiteSnap.exists) {
    throw new Error("Website not found.");
  }

  const website = websiteSnap.data();
  const normalizedUrl = normalizeWebsiteUrl(website.normalizedUrl || website.url);

  if (website.userId !== userId) {
    throw new Error("You do not have access to this website.");
  }

  const userSnap = await db.collection(USERS_COLLECTION).doc(userId).get();
  const user = userSnap.data();

  try {
    const html = await fetchHtml(normalizedUrl);
    const readableText = extractPageText(html).slice(0, MAX_SNAPSHOT_LENGTH);
    const priceData = extractProductSignals(html);
    const snapshotHash = hashText(readableText);
    const now = adminDb.firestore.FieldValue.serverTimestamp();
    const currentIsoTime = new Date().toISOString();

    if (!website.latestSnapshotHash) {
      await saveSnapshotRecord({
        db,
        websiteId,
        userId,
        status: "initial",
        snapshotHash,
        snapshotText: readableText,
        checkedAt: now,
        diffSummary: null,
        priceData
      });

      await updateWebsiteRecords({
        db,
        websiteId,
        userId,
        data: {
          url: normalizedUrl,
          normalizedUrl,
          status: "Watching",
          lastChecked: now,
          latestSnapshotHash: snapshotHash,
          latestSnapshotText: readableText,
          previousSnapshotHash: "",
          previousSnapshotText: "",
          latestProductTitle: priceData.productTitle || "",
          latestDetectedPrices: priceData.detectedPrices,
          previousDetectedPrices: [],
          latestPrimaryPrice: priceData.primaryPrice,
          previousPrimaryPrice: "",
          latestPrimaryPriceValue: priceData.primaryPriceValue,
          previousPrimaryPriceValue: null,
          latestPrimaryPriceCurrency: priceData.primaryPriceCurrency,
          latestPrimaryPriceSource: priceData.primaryPriceSource,
          latestPrimaryPriceConfidence: priceData.primaryPriceConfidence,
          lastDiffSummary: null
        }
      });

      return {
        changed: false,
        message: priceData.primaryPrice
          ? `Initial price snapshot saved at ${priceData.primaryPrice}.`
          : "Initial snapshot saved."
      };
    }

    const previousPriceData = {
      productTitle: website.latestProductTitle || "",
      priceDetected: Boolean(website.latestPrimaryPrice),
      primaryPrice: website.latestPrimaryPrice || "",
      primaryPriceValue: website.latestPrimaryPriceValue ?? null,
      primaryPriceCurrency: website.latestPrimaryPriceCurrency || "",
      primaryPriceSource: website.latestPrimaryPriceSource || "",
      primaryPriceConfidence: website.latestPrimaryPriceConfidence || 0,
      detectedPrices: website.latestDetectedPrices || []
    };
    const diffSummary = createDiffSummary(
      website.latestSnapshotText || "",
      readableText,
      previousPriceData,
      priceData
    );
    const contentChanged = website.latestSnapshotHash !== snapshotHash;
    const hasReliablePrice =
      (previousPriceData.primaryPriceConfidence || 0) >= 75 ||
      (priceData.primaryPriceConfidence || 0) >= 75;
    const priceChanged = Boolean(diffSummary.priceChange?.changed);
    const shouldAlert = hasReliablePrice ? priceChanged : contentChanged;

    if (shouldAlert) {
      await saveSnapshotRecord({
        db,
        websiteId,
        userId,
        status: "changed",
        snapshotHash,
        snapshotText: readableText,
        checkedAt: now,
        diffSummary,
        priceData
      });

      await updateWebsiteRecords({
        db,
        websiteId,
        userId,
        data: {
          url: normalizedUrl,
          normalizedUrl,
          status: "Changed",
          lastChecked: now,
          lastChanged: now,
          latestSnapshotHash: snapshotHash,
          latestSnapshotText: readableText,
          previousSnapshotHash: website.latestSnapshotHash || "",
          previousSnapshotText: website.latestSnapshotText || "",
          latestProductTitle: priceData.productTitle || website.latestProductTitle || "",
          latestDetectedPrices: priceData.detectedPrices,
          previousDetectedPrices: website.latestDetectedPrices || [],
          latestPrimaryPrice: priceData.primaryPrice,
          previousPrimaryPrice: website.latestPrimaryPrice || "",
          latestPrimaryPriceValue: priceData.primaryPriceValue,
          previousPrimaryPriceValue: website.latestPrimaryPriceValue ?? null,
          latestPrimaryPriceCurrency: priceData.primaryPriceCurrency,
          latestPrimaryPriceSource: priceData.primaryPriceSource,
          latestPrimaryPriceConfidence: priceData.primaryPriceConfidence,
          lastDiffSummary: diffSummary
        }
      });

      if (user?.email) {
        await sendChangeEmail({
          email: user.email,
          url: normalizedUrl,
          checkedAt: currentIsoTime,
          diffSummary
        });
      }

      return {
        changed: true,
        message: priceChanged && diffSummary.priceChange?.label
          ? `${diffSummary.priceChange.label}. Notification sent.`
          : "Change detected and notification sent."
      };
    }

    await saveSnapshotRecord({
      db,
      websiteId,
      userId,
      status: "unchanged",
      snapshotHash,
      snapshotText: readableText,
      checkedAt: now,
      diffSummary,
      priceData
    });

    await updateWebsiteRecords({
      db,
      websiteId,
      userId,
      data: {
        url: normalizedUrl,
        normalizedUrl,
        status: "Watching",
        lastChecked: now,
        latestSnapshotHash: snapshotHash,
        latestSnapshotText: readableText,
        latestProductTitle: priceData.productTitle || website.latestProductTitle || "",
        latestDetectedPrices: priceData.detectedPrices,
        latestPrimaryPrice: priceData.primaryPrice,
        latestPrimaryPriceValue: priceData.primaryPriceValue,
        latestPrimaryPriceCurrency: priceData.primaryPriceCurrency,
        latestPrimaryPriceSource: priceData.primaryPriceSource,
        latestPrimaryPriceConfidence: priceData.primaryPriceConfidence,
        lastDiffSummary: diffSummary
      }
    });

    return {
      changed: false,
      message: hasReliablePrice && priceData.primaryPrice
        ? `Price unchanged at ${priceData.primaryPrice}.`
        : "No change detected."
    };
  } catch (error) {
    await saveSnapshotRecord({
      db,
      websiteId,
      userId,
      status: "error",
      snapshotHash: "",
      snapshotText: "",
      checkedAt: adminDb.firestore.FieldValue.serverTimestamp(),
      diffSummary: null,
      priceData: null
    });

    await updateWebsiteRecords({
      db,
      websiteId,
      userId,
      data: {
        status: "Error",
        lastChecked: adminDb.firestore.FieldValue.serverTimestamp()
      }
    });

    throw new Error(error.message || "Website check failed.");
  }
}

export async function syncUserWebsites(userId) {
  const db = getDb();
  const snapshot = await db
    .collection(WEBSITES_COLLECTION)
    .where("userId", "==", userId)
    .get();

  await Promise.all(
    snapshot.docs.map((document) =>
      getUserWebsiteRef(db, userId, document.id).set(document.data(), { merge: true })
    )
  );

  return snapshot.size;
}

export async function listUserWebsites(userId) {
  const db = getDb();
  const snapshot = await db
    .collection(WEBSITES_COLLECTION)
    .where("userId", "==", userId)
    .get();
  const websites = snapshot.docs
    .map((document) => serializeWebsite(document.id, document.data()))
    .sort((left, right) => {
      const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
      const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
      return rightTime - leftTime;
    });
  const account = await getUserPlanSummary(userId, snapshot.size);

  return {
    websites,
    account
  };
}

export async function listWebsiteSnapshots({ websiteId, userId, limit = 10 }) {
  const db = getDb();
  const websiteRef = db.collection(WEBSITES_COLLECTION).doc(websiteId);
  const websiteSnap = await websiteRef.get();

  if (!websiteSnap.exists) {
    throw new Error("Website not found.");
  }

  const website = websiteSnap.data();

  if (website.userId !== userId) {
    throw new Error("You do not have access to this website.");
  }

  const snapshot = await websiteRef.collection(SNAPSHOTS_COLLECTION).limit(limit).get();

  return snapshot.docs
    .map((document) => serializeSnapshot(document.id, document.data()))
    .sort((left, right) => {
      const leftTime = left.checkedAt ? new Date(left.checkedAt).getTime() : 0;
      const rightTime = right.checkedAt ? new Date(right.checkedAt).getTime() : 0;
      return rightTime - leftTime;
    });
}

export async function checkAllWebsites() {
  const db = getDb();
  const snapshot = await db.collection(WEBSITES_COLLECTION).get();
  const results = [];

  for (const document of snapshot.docs) {
    try {
      const result = await checkWebsite({
        websiteId: document.id,
        userId: document.data().userId
      });
      results.push({
        websiteId: document.id,
        url: document.data().normalizedUrl || document.data().url,
        ...result
      });
    } catch (error) {
      results.push({
        websiteId: document.id,
        url: document.data().normalizedUrl || document.data().url,
        changed: false,
        error: error.message
      });
    }
  }

  return results;
}
