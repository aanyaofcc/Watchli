import { Link } from "react-router-dom";
import { Eye } from "lucide-react";

function LegalShell({ eyebrow, title, lastUpdated, children }) {
  return (
    <div className="tech-shell min-h-screen text-slate-100">
      <div className="aurora-orb left-[-80px] top-20 h-64 w-64 bg-cyan-400/20" />
      <div className="aurora-orb right-[-70px] top-32 h-72 w-72 bg-blue-500/20" />

      <header className="relative z-10 border-b border-white/10 bg-slate-950/55 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10">
              <Eye className="h-5 w-5 text-cyan-300" />
            </div>
            <div>
              <p className="display-font text-lg font-bold text-white">Watchli</p>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Legal</p>
            </div>
          </Link>
          <Link
            to="/"
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
          >
            Back to home
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-5xl px-6 py-12">
        <div className="glass-panel rounded-[32px] p-8 md:p-10">
          <p className="text-sm uppercase tracking-[0.18em] text-cyan-300">{eyebrow}</p>
          <h1 className="display-font mt-4 text-4xl font-semibold text-white md:text-5xl">
            {title}
          </h1>
          <p className="mt-4 text-sm text-slate-400">Last updated: {lastUpdated}</p>

          <div className="mt-8 space-y-8 text-sm leading-7 text-slate-300">{children}</div>
        </div>
      </main>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section>
      <h2 className="display-font text-2xl font-semibold text-white">{title}</h2>
      <div className="mt-3 space-y-4">{children}</div>
    </section>
  );
}

export function PrivacyPolicyPage() {
  return (
    <LegalShell eyebrow="Privacy" title="Privacy Policy" lastUpdated="July 11, 2026">
      <Section title="Overview">
        <p>
          Watchli helps users monitor webpages for content and price changes. This Privacy
          Policy explains what information we collect, how we use it, and the choices you
          have when using Watchli.
        </p>
      </Section>

      <Section title="Information We Collect">
        <p>
          We collect account information such as your email address when you create an
          account. We also store the webpage URLs you choose to monitor, snapshots of page
          text used for change detection, pricing signals extracted from those pages, and
          timestamps related to checks and alerts.
        </p>
      </Section>

      <Section title="How We Use Information">
        <p>
          We use your information to authenticate your account, monitor webpages you add,
          detect changes, send email notifications, manage plan limits, and improve the
          reliability of the service.
        </p>
      </Section>

      <Section title="Third-Party Services">
        <p>
          Watchli relies on third-party providers such as Firebase for authentication and
          data storage, Resend for email delivery, Stripe for billing, Railway for backend
          hosting, and Vercel for frontend hosting. These providers may process data as
          needed to operate their services.
        </p>
      </Section>

      <Section title="Data Retention">
        <p>
          We keep account information, watched URLs, and saved snapshots for as long as
          your account remains active or as needed to provide the service. You can delete
          watched websites from your dashboard, and you may request account deletion by
          contacting Watchli support.
        </p>
      </Section>

      <Section title="Your Choices">
        <p>
          You can update or remove watched websites at any time. You may stop using the
          service whenever you choose. If you would like your account data removed, contact
          the Watchli team using the support method listed on the site.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          If you have questions about this Privacy Policy, contact Watchli at{" "}
          <a className="text-cyan-200 hover:text-cyan-100" href="mailto:contactwatchli@gmail.com">
            contactwatchli@gmail.com
          </a>
          .
        </p>
      </Section>
    </LegalShell>
  );
}

export function TermsOfServicePage() {
  return (
    <LegalShell eyebrow="Terms" title="Terms of Service" lastUpdated="July 11, 2026">
      <Section title="Acceptance of Terms">
        <p>
          By using Watchli, you agree to these Terms of Service. If you do not agree, do
          not use the service.
        </p>
      </Section>

      <Section title="Service Description">
        <p>
          Watchli allows users to monitor webpages, save snapshots, detect content and
          price changes, and receive notifications. We may update, improve, or limit parts
          of the service over time.
        </p>
      </Section>

      <Section title="Account Responsibilities">
        <p>
          You are responsible for maintaining the security of your account and for all
          activity that occurs under it. You agree to provide accurate information and to
          use Watchli lawfully.
        </p>
      </Section>

      <Section title="Acceptable Use">
        <p>
          You agree not to misuse Watchli, interfere with its operation, attempt
          unauthorized access, or use the service in a way that violates applicable law or
          the rights of others.
        </p>
      </Section>

      <Section title="Billing and Plans">
        <p>
          Paid plans, if offered, are billed through Stripe. Plan limits, features, and
          pricing may change in the future. If you subscribe to a paid plan, you authorize
          recurring charges according to the selected billing terms until you cancel.
        </p>
      </Section>

      <Section title="No Guarantee of Availability or Accuracy">
        <p>
          Watchli aims to provide reliable monitoring, but we do not guarantee that all
          webpages can be checked successfully at all times or that every change will be
          detected perfectly.
        </p>
      </Section>

      <Section title="Limitation of Liability">
        <p>
          To the fullest extent allowed by law, Watchli is provided on an as-is basis
          without warranties, and Watchli will not be liable for indirect, incidental, or
          consequential damages arising from use of the service.
        </p>
      </Section>

      <Section title="Termination">
        <p>
          We may suspend or terminate access to Watchli if these terms are violated or if
          the service must be modified or discontinued. You may stop using the service at
          any time.
        </p>
      </Section>

      <Section title="Changes to These Terms">
        <p>
          We may update these Terms of Service from time to time. Continued use of Watchli
          after updates means you accept the revised terms.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          Questions about these terms can be sent to{" "}
          <a className="text-cyan-200 hover:text-cyan-100" href="mailto:contactwatchli@gmail.com">
            contactwatchli@gmail.com
          </a>
          .
        </p>
      </Section>
    </LegalShell>
  );
}
