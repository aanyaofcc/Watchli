# Watchli MVP

Watchli is a simple SaaS MVP for monitoring webpages and sending email alerts when they change.

## Stack

- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js + Express
- Auth/Database: Firebase Authentication + Firestore
- Email: Resend

## Project Structure

- `frontend` - React app for landing page, auth, and dashboard
- `backend` - Express API for page checks and email notifications

## Frontend Environment Variables

Create `frontend/.env` from `frontend/.env.example`:

```bash
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_BACKEND_URL=http://localhost:8787
```

## Backend Environment Variables

Create `backend/.env` from `backend/.env.example`:

```bash
PORT=8787
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
RESEND_API_KEY=
EMAIL_FROM=
APP_URL=http://localhost:5173
STRIPE_SECRET_KEY=
STRIPE_PRICE_ID_PRO_MONTHLY=
STRIPE_WEBHOOK_SECRET=
SCHEDULER_ENABLED=false
SCHEDULER_INTERVAL_MINUTES=1440
SCHEDULER_RUN_ON_START=false
CRON_SECRET=
```

`FIREBASE_PRIVATE_KEY` should keep newline characters escaped as `\n` in `.env`.

## Firebase Setup Notes

1. Create a Firebase project.
2. Enable Authentication with Email/Password.
3. Create a Firestore database in production or test mode.
4. Add a web app in Firebase and copy its config values into `frontend/.env`.
5. Create a service account in Firebase Project Settings > Service Accounts.
6. Put the service account values into `backend/.env`.
7. Recommended Firestore collections:
   - `users/{userId}`
   - `websites/{websiteId}`
8. Publish the included `firestore.rules` file in Firebase Console or with the Firebase CLI.

## Install Dependencies

From the project root:

```bash
npm install
```

## Run Frontend

```bash
npm run dev:frontend
```

The frontend runs on `http://localhost:5173`.

## Run Backend

In a second terminal:

```bash
npm run dev:backend
```

The backend runs on `http://localhost:8787`.

## Stripe Pro Billing Setup

Watchli Pro is now priced at `$7/month`.

To enable the upgrade flow:

1. Create a recurring monthly product in Stripe priced at `$7.00`.
2. Copy the Stripe price ID into `STRIPE_PRICE_ID_PRO_MONTHLY`.
3. Copy your Stripe secret key into `STRIPE_SECRET_KEY`.
4. Add a webhook endpoint in Stripe pointing to:
   - local: `http://localhost:8787/api/stripe/webhook`
   - production: `https://your-backend-domain/api/stripe/webhook`
5. Subscribe the webhook to at least:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
6. Copy the webhook signing secret into `STRIPE_WEBHOOK_SECRET`.

When Stripe sends a successful checkout event, Watchli updates the user document to `plan: "pro"` automatically.

## Automatic Scheduled Checks

Watchli can now run automatic checks inside the backend process.

Recommended local settings in `backend/.env`:

```bash
SCHEDULER_ENABLED=true
SCHEDULER_INTERVAL_MINUTES=1440
SCHEDULER_RUN_ON_START=true
```

- `SCHEDULER_ENABLED=true` turns on automatic checks
- `SCHEDULER_INTERVAL_MINUTES=1440` runs checks every 24 hours
- `SCHEDULER_RUN_ON_START=true` runs one pass when the backend boots

You can still trigger checks from an external cron service with:

```bash
curl -X POST http://localhost:8787/api/check-all \
  -H "x-cron-secret: your-secret"
```

If you set `CRON_SECRET`, external calls to `/api/check-all` must include that header.

## Test the MVP

### 1. Sign up and log in

- Open the frontend.
- Create an account with email and password.
- Log in to access the dashboard.

### 2. Add a website

- Paste a full URL like `https://example.com`.
- Submit the form.
- Confirm the website appears in the dashboard list.

### 3. Check a website manually

- Click `Check Now` on a website card.
- The backend fetches the page, extracts readable text, hashes it, and updates Firestore.

### 4. Test change detection

- Add a page that you expect to change, or temporarily edit a test page you control.
- Click `Check Now` once to save the first snapshot.
- Change the page content.
- Click `Check Now` again.
- The website status should update to `Changed`.

### 5. Test email notifications

- Make sure `RESEND_API_KEY` and `EMAIL_FROM` are set.
- Use the dashboard once a change is detected, or call the test email endpoint:

```bash
curl -X POST http://localhost:8787/api/send-test-email \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"your-email@example.com\"}"
```

## Cron-Ready Endpoint

`POST /api/check-all` is included for external cron, Cloud Scheduler, GitHub Actions, or another job runner. The backend can also run its own automatic interval-based scheduler.

## Notes

- Free/Pro plan structure is now wired in with backend-enforced website limits.
- Free users can watch up to 5 websites. Pro is a placeholder tier with higher limits, UI locks, and an upgrade CTA ready for Stripe.
- A first Stripe-backed Pro upgrade flow is included with checkout session creation, billing portal session creation, and webhook-driven plan updates.
- Website creation and deletion now flow through the backend so plan limits are enforced server-side.
- Publish the updated `firestore.rules` file so users cannot promote themselves from `free` to `pro` or bypass limits with direct Firestore writes.
- SMS and browser extension support are intentionally not included in this MVP.
- No AI services are used.
- URLs are normalized before storing so duplicate watches like `https://example.com` and `https://example.com/` are treated as the same page.
- Snapshots are truncated before storage to reduce the chance of hitting Firestore document size limits on large pages.
