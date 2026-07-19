import { getAdmin, getDb } from "../firebase.js";
import { getUserPlanSummary } from "./planService.js";
import { createDiffSummary } from "../utils/diffSummary.js";
import { extractPageText, extractProductSignals, hashText } from "../utils/pageContent.js";
import { normalizeWebsiteUrl } from "../utils/url.js";
import { sendChangeEmail } from "./emailService.js";
import { getUserNotificationPreferences } from "./userSettingsService.js";

const WEBSITES_COLLECTION = "websites";
const USERS_COLLECTION = "users";
const MAX_SNAPSHOT_LENGTH = 50000;
const SNAPSHOTS_COLLECTION = "snapshots";
const SYSTEM_COLLECTION = "system";
const STATUS_DOC = "status";

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

function serializeScheduler(data) {
  if (!data) {
    return null;
  }

  return {
    ...data,
    updatedAt: serializeTimestamp(data.updatedAt)
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

function shouldSendEmailForPriceChange(priceChange, preferences) {
  if (preferences?.paused) {
    return false;
  }

  if (!priceChange?.changed) {
    return false;
  }

  if (priceChange.type === "updated") {
    if (priceChange.direction === "up") {
      return Boolean(preferences?.priceIncrease);
    }

    if (priceChange.direction === "down") {
      return Boolean(preferences?.priceDecrease);
    }

    return false;
  }

  return (
    (priceChange.type === "sold_out" || priceChange.type === "unavailable") &&
    Boolean(preferences?.outOfStock)
  );
}

function describeCheckFailure(error) {
  const message = error?.message || "Website check failed.";
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("timed out") || lowerMessage.includes("timeout")) {
    return "This website took too long to respond. It may be slow, temporarily unavailable, or blocking automated checks.";
  }

  if (
    lowerMessage.includes("403") ||
    lowerMessage.includes("401") ||
    lowerMessage.includes("429")
  ) {
    return "This website appears to be blocking automated checks right now. Try again later or use a different product page if possible.";
  }

  if (lowerMessage.includes("404")) {
    return "This product page could not be found. The listing may have moved or been removed.";
  }

  if (lowerMessage.includes("empty page")) {
    return "Watchli received an empty or incomplete page, so it could not extract product details from this check.";
  }

  if (lowerMessage.includes("fetch failed") || lowerMessage.includes("network")) {
    return "Watchli could not reach this website right now. Check the URL and try again in a moment.";
  }

  return message;
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
  priceData,
  errorMessage = ""
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
    productTitle: priceData?.productTitle || "",
    availabilityStatus: priceData?.availabilityStatus || "unknown",
    availabilityLabel: priceData?.availabilityLabel || "",
    available: priceData?.available ?? null,
    errorMessage
  };

  await Promise.all([
    getWebsiteSnapshotRef(db, websiteId, snapshotId).set(snapshotData),
    getUserWebsiteSnapshotRef(db, userId, websiteId, snapshotId).set(snapshotData)
  ]);
}

async function sleep(ms) {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function fetchHtml(url) {
  const attempts = [
    {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
      Referer: "https://www.google.com/"
    },
    {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.8",
      "Cache-Control": "no-cache",
      Pragma: "no-cache"
    }
  ];
  let lastError = null;

  for (let index = 0; index < attempts.length; index += 1) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(15000),
        headers: attempts[index]
      });

      if (!response.ok) {
        throw new Error(`Website returned ${response.status} ${response.statusText}`.trim());
      }

      const html = await response.text();

      if (!html || html.trim().length < 80) {
        throw new Error("Website returned an empty page.");
      }

      return html;
    } catch (error) {
      lastError = error;

      if (index < attempts.length - 1) {
        await sleep(900 * (index + 1));
      }
    }
  }

  throw lastError || new Error("Website check failed.");
}

export async function inspectWebsiteUrl({ url }) {
  const normalizedUrl = normalizeWebsiteUrl(url);

  try {
    const html = await fetchHtml(normalizedUrl);
    const readableText = extractPageText(html).slice(0, 1200);
    const priceData = extractProductSignals(html);

    return {
      ok: true,
      url: normalizedUrl,
      fetchedAt: new Date().toISOString(),
      productSignals: priceData,
      pagePreview: readableText,
      summary: priceData.primaryPrice
        ? `Detected ${priceData.primaryPrice} from ${priceData.primaryPriceSource || "page content"}.`
        : "No reliable price was detected on this product page."
    };
  } catch (error) {
    return {
      ok: false,
      url: normalizedUrl,
      fetchedAt: new Date().toISOString(),
      error: describeCheckFailure(error)
    };
  }
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
    latestAvailabilityStatus: "unknown",
    latestAvailabilityLabel: "",
    previousAvailabilityStatus: "unknown",
    previousAvailabilityLabel: "",
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
  const notificationPreferences = await getUserNotificationPreferences(userId);

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
          latestAvailabilityStatus: priceData.availabilityStatus,
          latestAvailabilityLabel: priceData.availabilityLabel,
          previousAvailabilityStatus: "unknown",
          previousAvailabilityLabel: "",
          lastDiffSummary: null,
          lastErrorMessage: ""
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
      detectedPrices: website.latestDetectedPrices || [],
      availabilityStatus: website.latestAvailabilityStatus || "unknown",
      availabilityLabel: website.latestAvailabilityLabel || ""
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
    const shouldSendEmail = shouldSendEmailForPriceChange(
      diffSummary.priceChange,
      notificationPreferences
    );

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
          latestAvailabilityStatus: priceData.availabilityStatus,
          latestAvailabilityLabel: priceData.availabilityLabel,
          previousAvailabilityStatus: website.latestAvailabilityStatus || "unknown",
          previousAvailabilityLabel: website.latestAvailabilityLabel || "",
          lastDiffSummary: diffSummary,
          lastErrorMessage: ""
        }
      });

      if (user?.email && shouldSendEmail) {
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
          ? shouldSendEmail
            ? `${diffSummary.priceChange.label}. Notification sent.`
            : `${diffSummary.priceChange.label}.`
          : shouldSendEmail
            ? "Change detected and notification sent."
            : "Change detected."
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
        latestAvailabilityStatus: priceData.availabilityStatus,
        latestAvailabilityLabel: priceData.availabilityLabel,
        lastDiffSummary: diffSummary,
        lastErrorMessage: ""
      }
    });

    return {
      changed: false,
      message: hasReliablePrice && priceData.primaryPrice
        ? `Price unchanged at ${priceData.primaryPrice}.`
        : "No change detected."
    };
  } catch (error) {
    const errorMessage = describeCheckFailure(error);

    await saveSnapshotRecord({
      db,
      websiteId,
      userId,
      status: "error",
      snapshotHash: "",
      snapshotText: "",
      checkedAt: adminDb.firestore.FieldValue.serverTimestamp(),
      diffSummary: null,
      priceData: null,
      errorMessage
    });

    await updateWebsiteRecords({
      db,
      websiteId,
      userId,
      data: {
        status: "Error",
        lastChecked: adminDb.firestore.FieldValue.serverTimestamp(),
        lastErrorMessage: errorMessage
      }
    });

    throw new Error(errorMessage);
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
  const statusSnapshot = await db.collection(SYSTEM_COLLECTION).doc(STATUS_DOC).get();
  const websites = snapshot.docs
    .map((document) => serializeWebsite(document.id, document.data()))
    .sort((left, right) => {
      const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
      const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
      return rightTime - leftTime;
    });
  const account = await getUserPlanSummary(userId, snapshot.size);
  const scheduler = serializeScheduler(statusSnapshot.data()?.scheduler || null);

  return {
    websites,
    account,
    scheduler
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

  const snapshot = await websiteRef
    .collection(SNAPSHOTS_COLLECTION)
    .orderBy("checkedAt", "desc")
    .limit(limit)
    .get();

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
