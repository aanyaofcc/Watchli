import { config } from "../config.js";
import { checkAllWebsites } from "./websiteService.js";

function logSummary(results) {
  const total = results.length;
  const changed = results.filter((result) => result.changed).length;
  const failed = results.filter((result) => result.error).length;

  console.log(
    `[watchli-scheduler] Completed automatic check run. total=${total} changed=${changed} failed=${failed}`
  );
}

async function runScheduledChecks(trigger) {
  console.log(`[watchli-scheduler] Starting automatic checks via ${trigger}.`);

  try {
    const results = await checkAllWebsites();
    logSummary(results);
  } catch (error) {
    console.error("[watchli-scheduler] Automatic checks failed.", error);
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
