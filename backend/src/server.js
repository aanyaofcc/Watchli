import express from "express";
import cors from "cors";
import { config } from "./config.js";
import { router } from "./routes.js";
import { handleStripeWebhook } from "./services/billingService.js";
import { startScheduler } from "./services/schedulerService.js";

const app = express();

app.use(
  cors({
    origin: true
  })
);
app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), async (request, response) => {
  try {
    const rawBody = request.body.toString("utf8");
    const signatureHeader = request.headers["stripe-signature"] || "";
    const result = await handleStripeWebhook({
      rawBody,
      signatureHeader
    });

    return response.json(result);
  } catch (error) {
    return response.status(400).json({ error: error.message });
  }
});
app.use(express.json({ limit: "1mb" }));
app.use(router);

app.listen(config.port, () => {
  console.log(`Watchli backend listening on http://localhost:${config.port}`);
  startScheduler();
});
