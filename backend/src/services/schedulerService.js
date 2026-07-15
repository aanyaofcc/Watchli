import { config } from "../config.js";
import { getAdmin, getDb } from "../firebase.js";
import { checkAllWebsites } from "./websiteService.js";

const SYSTEM_COLLECTION = "system";
const STATUS_DOC = "status";
let activeRunPromise = null;

function getSummary(results) {
  return {
    total: results.length,
    changed: results.filter((result) => result.changed).length,
    failed: results.filter((result) => result.error).length
  };
}

function logSummary(results) {
  const { total, changed, failed } = getSummary(results);

  console.log(
    `[watchli-scheduler] Completed automatic check run. total=${total} changed=${changed} failed=${failed}`
  );
}

async function getSchedulerStatus() {
  try {
    const db = getDb();
    const snapshot = await db.collection(SYSTEM_COLLECTION).doc(STATUS_DOC).get();
    return snapshot.data()?.scheduler || null;
  } catch (_error) {
    return null;
  }
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
  if (activeRunPromise) {
    console.log(`[watchli-scheduler] Skipping ${trigger} run because another run is still active.`);
    await saveSchedulerStatus({
      running: true,
      lastSkippedAt: new Date().toISOString(),
      lastSkipReason: "A previous automatic check run is still in progress."
    });
    return activeRunPromise;
  }

  console.log(`[watchli-scheduler] Starting automatic checks via ${trigger}.`);
  const startedAt = new Date();
  const runPromise = (async () => {
    const previousStatus = await getSchedulerStatus();
    await saveSchedulerStatus({
      enabled: true,
      running: true,
      trigger,
      lastTrigger: trigger,
      lastStartedAt: startedAt.toISOString(),
      lastError: "",
      lastRunSucceeded: false,
      lastSkipReason: ""
    });

    try {
      const results = await checkAllWebsites();
      const summary = getSummary(results);
      const finishedAt = new Date();
      logSummary(results);
      await saveSchedulerStatus({
        enabled: true,
        running: false,
        trigger,
        lastTrigger: trigger,
        lastCompletedAt: finishedAt.toISOString(),
        lastDurationMs: finishedAt.getTime() - startedAt.getTime(),
        lastRunTotal: summary.total,
        lastRunChanged: summary.changed,
        lastRunFailed: summary.failed,
        lastRunSucceeded: true,
        consecutiveFailures: 0,
        lastError: ""
      });

      return results;
    } catch (error) {
      const finishedAt = new Date();
      console.error("[watchli-scheduler] Automatic checks failed.", error);
      await saveSchedulerStatus({
        enabled: true,
        running: false,
        trigger,
        lastTrigger: trigger,
        lastCompletedAt: finishedAt.toISOString(),
        lastDurationMs: finishedAt.getTime() - startedAt.getTime(),
        lastRunSucceeded: false,
        consecutiveFailures: (previousStatus?.consecutiveFailures || 0) + 1,
        lastError: error?.message || "Automatic checks failed."
      });
      throw error;
    } finally {
      activeRunPromise = null;
    }
  })();

  activeRunPromise = runPromise;
  return runPromise;
}

export function startScheduler() {
  if (!config.schedulerEnabled) {
    console.log("[watchli-scheduler] Automatic scheduler disabled.");
    void saveSchedulerStatus({
      enabled: false,
      running: false
    });
    return null;
  }

  const intervalMinutes = Math.max(1, config.schedulerIntervalMinutes);
  const intervalMs = intervalMinutes * 60 * 1000;

  console.log(
    `[watchli-scheduler] Automatic scheduler enabled. interval=${intervalMinutes} minute(s)`
  );
  void saveSchedulerStatus({
    enabled: true,
    running: false,
    intervalMinutes,
    nextRunAt: new Date(Date.now() + intervalMs).toISOString(),
    lastError: ""
  });

  if (config.schedulerRunOnStart) {
    // Run asynchronously so startup is not blocked.
    void runScheduledChecks("startup");
  }

  return setInterval(() => {
    void saveSchedulerStatus({
      enabled: true,
      nextRunAt: new Date(Date.now() + intervalMs).toISOString()
    });
    void runScheduledChecks("interval");
  }, intervalMs);
}
