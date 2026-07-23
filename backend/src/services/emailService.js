import { Resend } from "resend";
import { config } from "../config.js";
import { getAdmin, getDb } from "../firebase.js";

const resend = config.resendApiKey ? new Resend(config.resendApiKey) : null;
const dashboardUrl = `${config.appUrl.replace(/\/+$/, "")}/dashboard`;
const SYSTEM_COLLECTION = "system";
const STATUS_DOC = "status";

function buildFromAddress() {
  return config.emailFrom.includes("<")
    ? config.emailFrom
    : `Watchli <${config.emailFrom}>`;
}

function buildEmailShell({ eyebrow, title, intro, bodyHtml, buttonLabel, buttonHref, footer }) {
  return `
    <div style="margin:0;background:#07111e;padding:32px 16px;font-family:Arial,sans-serif;color:#d7e7fb;">
      <div style="max-width:640px;margin:0 auto;border-radius:28px;overflow:hidden;border:1px solid rgba(190,224,255,0.12);background:linear-gradient(180deg,#0a1526 0%,#0d1c30 100%);box-shadow:0 24px 80px rgba(0,0,0,0.35);">
        <div style="padding:28px 32px 18px;border-bottom:1px solid rgba(190,224,255,0.12);background:radial-gradient(circle at top left,rgba(61,206,255,0.18),transparent 34%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01));">
          <div style="display:inline-block;padding:7px 12px;border-radius:999px;border:1px solid rgba(190,224,255,0.14);background:rgba(255,255,255,0.05);font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#8ed9ff;">
            ${eyebrow}
          </div>
          <h1 style="margin:18px 0 10px;font-size:32px;line-height:1.05;color:#ffffff;">${title}</h1>
          <p style="margin:0;font-size:16px;line-height:1.7;color:#bfd2e8;">${intro}</p>
        </div>
        <div style="padding:28px 32px;">
          ${bodyHtml}
          ${
            buttonLabel && buttonHref
              ? `<div style="margin-top:28px;">
                  <a href="${buttonHref}" style="display:inline-block;padding:14px 18px;border-radius:999px;background:linear-gradient(90deg,#7ee7ff,#8dc4ff,#84f1d5);color:#041120;font-weight:700;text-decoration:none;">
                    ${buttonLabel}
                  </a>
                </div>`
              : ""
          }
        </div>
        <div style="padding:18px 32px 28px;border-top:1px solid rgba(190,224,255,0.1);font-size:13px;line-height:1.7;color:#89a3bf;">
          ${footer}
        </div>
      </div>
    </div>
  `;
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function recordAlertActivity({ type, email, subject }) {
  try {
    const db = getDb();
    const admin = getAdmin();

    await db.collection(SYSTEM_COLLECTION).doc(STATUS_DOC).set(
      {
        scheduler: {
          lastAlertSentAt: new Date().toISOString(),
          lastAlertType: type,
          lastAlertEmail: email,
          lastAlertSubject: subject,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }
      },
      { merge: true }
    );
  } catch (error) {
    console.error("[watchli-email] Could not save alert activity.", error);
  }
}

export async function sendChangeEmail({ email, url, checkedAt, diffSummary }) {
  if (!resend || !config.emailFrom) {
    throw new Error("Email service is not configured.");
  }

  const priceChange = diffSummary?.priceChange;
  const isPriceAlert = Boolean(priceChange?.changed);
  const safeUrl = escapeHtml(url);
  const safeCheckedAt = escapeHtml(checkedAt);
  const emailTitle = isPriceAlert ? "A watched product update was detected" : "A watched page just changed";
  const emailEyebrow = isPriceAlert ? "Product update detected" : "Change detected";
  const emailIntro = isPriceAlert
    ? "Watchli spotted a meaningful product update on one of the pages you're tracking."
    : "Watchli detected a content update on one of the pages you're monitoring.";
  const priceCard = priceChange?.changed
    ? `
      <div style="margin-bottom:16px;border-radius:22px;border:1px solid rgba(126,231,255,0.18);background:rgba(126,231,255,0.06);padding:18px 20px;">
        <p style="margin:0 0 10px;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#8ed9ff;">Price signal</p>
        <p style="margin:0 0 14px;font-size:17px;line-height:1.6;color:#ffffff;font-weight:700;">${escapeHtml(priceChange.label)}</p>
        ${
          priceChange.previousPrice && priceChange.currentPrice
            ? `
              <div style="display:flex;flex-wrap:wrap;gap:12px;">
                <div style="min-width:180px;flex:1;border-radius:18px;border:1px solid rgba(190,224,255,0.1);background:rgba(255,255,255,0.04);padding:14px 16px;">
                  <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#89a3bf;">Previous price</p>
                  <p style="margin:0;font-size:20px;line-height:1.2;color:#ffffff;">${escapeHtml(priceChange.previousPrice)}</p>
                </div>
                <div style="min-width:180px;flex:1;border-radius:18px;border:1px solid rgba(126,231,255,0.18);background:rgba(126,231,255,0.08);padding:14px 16px;">
                  <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#8ed9ff;">Current price</p>
                  <p style="margin:0;font-size:20px;line-height:1.2;color:#ffffff;">${escapeHtml(priceChange.currentPrice)}</p>
                </div>
              </div>
            `
            : ""
        }
      </div>
    `
    : "";

  const html = buildEmailShell({
    eyebrow: emailEyebrow,
    title: emailTitle,
    intro: emailIntro,
    bodyHtml: `
      ${priceCard}
      <div style="border-radius:22px;border:1px solid rgba(190,224,255,0.12);background:rgba(255,255,255,0.04);padding:18px 20px;">
        <p style="margin:0 0 10px;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#8ed9ff;">Website</p>
        <p style="margin:0 0 18px;font-size:16px;line-height:1.7;color:#ffffff;word-break:break-word;">${safeUrl}</p>
        <p style="margin:0 0 10px;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#8ed9ff;">Checked at</p>
        <p style="margin:0;font-size:16px;line-height:1.7;color:#ffffff;">${safeCheckedAt}</p>
      </div>
      <p style="margin:22px 0 0;font-size:15px;line-height:1.8;color:#bfd2e8;">
        Log in to your dashboard to review the latest snapshot, compare previous and current content, and decide whether the update matters to you.
      </p>
    `,
    buttonLabel: "Open dashboard",
    buttonHref: dashboardUrl,
    footer:
      "You're receiving this because you asked Watchli to monitor this page for changes. If this alert looks unexpected, review the website list in your dashboard."
  });

  const subject = isPriceAlert
    ? `Watchli alert: ${priceChange.label || "Product update detected"}`
    : "Watchli detected a page change";

  const result = await resend.emails.send({
    from: buildFromAddress(),
    to: email,
    subject,
    html,
    text: `${isPriceAlert ? "Watchli detected a product price change." : "Watchli detected a page change."}

${priceChange?.changed ? `Price signal:\n${priceChange.label}\n\n` : ""}Website:
${url}

Checked at:
${checkedAt}

Open your dashboard:
${dashboardUrl}

You are receiving this because this page is on your Watchli watchlist.`
  });

  await recordAlertActivity({
    type: isPriceAlert ? "price_alert" : "change_alert",
    email,
    subject
  });

  return result;
}

export async function sendTestEmail(email) {
  if (!resend || !config.emailFrom) {
    throw new Error("Email service is not configured.");
  }

  const html = buildEmailShell({
    eyebrow: "Email test",
    title: "Your Watchli alerts are ready",
    intro:
      "This is a test email confirming that your notification setup is working correctly.",
    bodyHtml: `
      <div style="border-radius:22px;border:1px solid rgba(190,224,255,0.12);background:rgba(255,255,255,0.04);padding:18px 20px;">
        <p style="margin:0;font-size:15px;line-height:1.8;color:#bfd2e8;">
          When one of your tracked pages changes, Watchli will send an alert like this so you can jump back in quickly.
        </p>
      </div>
    `,
    buttonLabel: "View dashboard",
    buttonHref: dashboardUrl,
    footer:
      "If you requested this test, no further action is needed. If not, you can ignore this message."
  });

  const subject = "Watchli email test";

  const result = await resend.emails.send({
    from: buildFromAddress(),
    to: email,
    subject,
    html,
    text: `Your Watchli alerts are ready.

This is a test email confirming that your notification setup is working.

View your dashboard:
${dashboardUrl}`
  });

  await recordAlertActivity({
    type: "test_email",
    email,
    subject
  });

  return result;
}

export async function sendFeedbackEmail({ name, email, message }) {
  if (!resend || !config.emailFrom) {
    throw new Error("Email service is not configured.");
  }

  const safeName = escapeHtml(name || "Anonymous");
  const safeEmail = escapeHtml(email);
  const safeMessage = escapeHtml(message).replace(/\n/g, "<br />");
  const subject = `New Watchli feedback from ${name || email}`;

  const html = buildEmailShell({
    eyebrow: "Homepage feedback",
    title: "A new Watchli feedback message came in",
    intro: "Someone used the homepage feedback form and sent a note to the Watchli team.",
    bodyHtml: `
      <div style="display:grid;gap:14px;">
        <div style="border-radius:22px;border:1px solid rgba(190,224,255,0.12);background:rgba(255,255,255,0.04);padding:18px 20px;">
          <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#8ed9ff;">Name</p>
          <p style="margin:0;font-size:16px;line-height:1.7;color:#ffffff;">${safeName}</p>
        </div>
        <div style="border-radius:22px;border:1px solid rgba(190,224,255,0.12);background:rgba(255,255,255,0.04);padding:18px 20px;">
          <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#8ed9ff;">Email</p>
          <p style="margin:0;font-size:16px;line-height:1.7;color:#ffffff;">${safeEmail}</p>
        </div>
        <div style="border-radius:22px;border:1px solid rgba(190,224,255,0.12);background:rgba(255,255,255,0.04);padding:18px 20px;">
          <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#8ed9ff;">Message</p>
          <p style="margin:0;font-size:16px;line-height:1.8;color:#ffffff;">${safeMessage}</p>
        </div>
      </div>
    `,
    buttonLabel: "Open Watchli",
    buttonHref: config.appUrl,
    footer: "This message was sent from the public Watchli homepage feedback form."
  });

  const result = await resend.emails.send({
    from: buildFromAddress(),
    to: "contactwatchli@gmail.com",
    subject,
    html,
    text: `New Watchli feedback\n\nName: ${name || "Anonymous"}\nEmail: ${email}\n\nMessage:\n${message}`,
    replyTo: email
  });

  return result;
}
