import { Resend } from "resend";
import { config } from "../config.js";

const resend = config.resendApiKey ? new Resend(config.resendApiKey) : null;
const dashboardUrl = `${config.appUrl.replace(/\/+$/, "")}/dashboard`;

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

export async function sendChangeEmail({ email, url, checkedAt, diffSummary }) {
  if (!resend || !config.emailFrom) {
    throw new Error("Email service is not configured.");
  }

  const priceChange = diffSummary?.priceChange;
  const isPriceAlert = Boolean(priceChange?.changed && priceChange?.currentPrice);
  const emailTitle = isPriceAlert ? "A watched product price changed" : "A watched page just changed";
  const emailEyebrow = isPriceAlert ? "Price change detected" : "Change detected";
  const emailIntro = isPriceAlert
    ? "Watchli spotted a likely product price update on one of the pages you're tracking."
    : "Watchli detected a content update on one of the pages you're monitoring.";
  const priceCard = priceChange?.changed
    ? `
      <div style="margin-bottom:16px;border-radius:22px;border:1px solid rgba(126,231,255,0.18);background:rgba(126,231,255,0.06);padding:18px 20px;">
        <p style="margin:0 0 10px;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#8ed9ff;">Price signal</p>
        <p style="margin:0;font-size:16px;line-height:1.7;color:#ffffff;">${priceChange.label}</p>
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
        <p style="margin:0 0 18px;font-size:16px;line-height:1.7;color:#ffffff;word-break:break-word;">${url}</p>
        <p style="margin:0 0 10px;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#8ed9ff;">Checked at</p>
        <p style="margin:0;font-size:16px;line-height:1.7;color:#ffffff;">${checkedAt}</p>
      </div>
      <p style="margin:22px 0 0;font-size:15px;line-height:1.8;color:#bfd2e8;">
        Log in to your dashboard to review the latest snapshot and decide whether the update matters to you.
      </p>
    `,
    buttonLabel: "Open dashboard",
    buttonHref: dashboardUrl,
    footer:
      "You're receiving this because you asked Watchli to monitor this page for changes. If this alert looks unexpected, review the website list in your dashboard."
  });

  return resend.emails.send({
    from: buildFromAddress(),
    to: email,
    subject: isPriceAlert ? "Watchli detected a product price change" : "Watchli detected a page change",
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

  return resend.emails.send({
    from: buildFromAddress(),
    to: email,
    subject: "Watchli email test",
    html,
    text: `Your Watchli alerts are ready.

This is a test email confirming that your notification setup is working.

View your dashboard:
${dashboardUrl}`
  });
}
