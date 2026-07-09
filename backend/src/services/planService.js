import { getDb } from "../firebase.js";

export const PLAN_DEFINITIONS = {
  free: {
    id: "free",
    label: "Free",
    websiteLimit: 5,
    checkFrequency: "Daily checks",
    premium: false,
    priceMonthly: 0
  },
  pro: {
    id: "pro",
    label: "Pro",
    websiteLimit: 100,
    checkFrequency: "Priority checks",
    premium: true,
    priceMonthly: 7
  }
};

function normalizePlanId(planId) {
  if (planId && PLAN_DEFINITIONS[planId]) {
    return planId;
  }

  return "free";
}

export async function getUserPlanSummary(userId, websiteCount = null) {
  const db = getDb();
  const userSnapshot = await db.collection("users").doc(userId).get();
  const userData = userSnapshot.data() || {};
  const planId = normalizePlanId(userData.plan);
  const plan = PLAN_DEFINITIONS[planId];
  let resolvedWebsiteCount = websiteCount;

  if (resolvedWebsiteCount === null) {
    const websitesSnapshot = await db
      .collection("websites")
      .where("userId", "==", userId)
      .get();
    resolvedWebsiteCount = websitesSnapshot.size;
  }

  return {
    plan: plan.id,
    planLabel: `${plan.label} plan`,
    websiteLimit: plan.websiteLimit,
    websiteCount: resolvedWebsiteCount,
    websiteSlotsRemaining: Math.max(plan.websiteLimit - resolvedWebsiteCount, 0),
    checkFrequency: plan.checkFrequency,
    priceMonthly: plan.priceMonthly,
    premium: plan.premium,
    upgradeAvailable: !plan.premium
  };
}
