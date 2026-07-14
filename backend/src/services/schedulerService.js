import { config } from "../config.js";
import { getAdmin, getDb } from "../firebase.js";
import { checkAllWebsites } from "./websiteService.js";

const SYSTEM_COLLECTION = "system";
const STATUS_DOC = "status";

function logSummary(results) {
  const total = results.length;
  const changed = results.filter((result) => result.changed).length;
  const failed = results.filter((result) => result.error).length;

  console.log(
    `[watchli-scheduler] Completed automatic check run. total=${total} changed=${changed} failed=${failed}`
  );
}

async function saveSchedulerStatus(data) {
  try {
    const db = getDb();
    const admin = getAdmin();

    await db.collection(SYSTEM_COLLECTION).doc(STATUS_DOC).set(
      {
        scheduler: {
          ...data,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }
      },
      { merge: true }
    );
  } catch (error) {
    console.error("[watchli-scheduler] Could not save scheduler status.", error);
  }
}

async function runScheduledChecks(trigger) {
  console.log(`[watchli-scheduler] Starting automatic checks via ${trigger}.`);
  await saveSchedulerStatus({
    running: true,
    trigger,
    lastStartedAt: new Date().toISOString(),
    lastError: ""
  });

  try {
    const results = await checkAllWebsites();
    logSummary(results);
    await saveSchedulerStatus({
      running: false,
      trigger,
      lastCompletedAt: new Date().toISOString(),
      lastRunTotal: results.length,
      lastRunChanged: results.filter((result) => result.changed).length,
      lastRunFailed: results.filter((result) => result.error).length,
      lastError: ""
    });
  } catch (error) {
    console.error("[watchli-scheduler] Automatic checks failed.", error);
    await saveSchedulerStatus({
      running: false,
      trigger,
      lastCompletedAt: new Date().toISOString(),
      lastError: error?.message || "Automatic checks failed."
    });
  }
}

export function startScheduler() {
  if (!config.schedulerEnabled) {
    console.log("[watchli-scheduler] Automatic scheduler disabled.");
    return null;
  }

  const intervalMinutes = Math.max(1, config.schedulerIntervalMinutes);
  const intervalMs = intervalMinutes * 60 * 1000;

  console.log(
    `[watchli-scheduler] Automatic scheduler enabled. interval=${intervalMinutes} minute(s)`
  );

  if (config.schedulerRunOnStart) {
    // Run asynchronously so startup is not blocked.
    void runScheduledChecks("startup");
  }

  return setInterval(() => {
    void runScheduledChecks("interval");
  }, intervalMs);
}
