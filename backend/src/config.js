import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: Number(process.env.PORT || 8787),
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
  firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  firebasePrivateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  resendApiKey: process.env.RESEND_API_KEY,
  emailFrom: process.env.EMAIL_FROM,
  appUrl: process.env.APP_URL || "http://localhost:5173",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || "",
  stripeProPriceId: process.env.STRIPE_PRICE_ID_PRO_MONTHLY || "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
  schedulerEnabled: process.env.SCHEDULER_ENABLED === "true",
  schedulerIntervalMinutes: Number(process.env.SCHEDULER_INTERVAL_MINUTES || 1440),
  schedulerRunOnStart: process.env.SCHEDULER_RUN_ON_START === "true",
  cronSecret: process.env.CRON_SECRET || ""
};
