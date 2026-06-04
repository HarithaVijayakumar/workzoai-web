import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

function LegalShell({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#050b14] px-5 py-8 text-white">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          Back to WorkZo AI
        </Link>
        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-400/10 text-blue-200">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-200">{eyebrow}</p>
              <h1 className="mt-1 text-3xl font-black sm:text-4xl">{title}</h1>
            </div>
          </div>
          <div className="mt-7 space-y-6 text-sm leading-7 text-slate-300">{children}</div>
        </section>
      </div>
    </main>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-black text-white">{title}</h2>
      <div className="mt-2 space-y-2">{children}</div>
    </section>
  );
}

export const metadata = { title: "Terms of Use | WorkZo AI" };

export default function TermsPage() {
  return (
    <LegalShell eyebrow="Legal" title="Terms of Use">
      <p className="text-slate-400">Last updated: June 2, 2026</p>

      <Block title="1. Acceptance">
        <p>By using WorkZo AI, you agree to these Terms. If you do not agree, do not use the product.</p>
      </Block>

      <Block title="2. Beta product">
        <p>WorkZo AI is currently a beta product. Features may change, improve, break, be removed, or be temporarily unavailable during development.</p>
      </Block>

      <Block title="3. User responsibility">
        <p>You are responsible for the information you upload, paste, generate, save, or share. You should review all AI-generated content before relying on it.</p>
      </Block>

      <Block title="4. No employment guarantee">
        <p>WorkZo AI provides interview practice, career preparation, and AI-generated feedback. We do not guarantee interviews, job offers, employment, salary outcomes, recruiter responses, visa outcomes, or career success.</p>
      </Block>

      <Block title="5. AI output">
        <p>AI-generated feedback may be incomplete, inaccurate, or unsuitable for your situation. You should independently verify important suggestions, especially for legal, immigration, financial, employment, or professional decisions.</p>
      </Block>

      <Block title="6. Subscriptions and payments">
        <p>Premium features may be introduced later. Pricing, access rules, refund terms, and subscription details will be shown before purchase when payment features are enabled.</p>
      </Block>

      <Block title="7. Prohibited use">
        <p>You may not use WorkZo AI to:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Upload unlawful, harmful, or abusive content.</li>
          <li>Misrepresent credentials, employment history, or qualifications.</li>
          <li>Attempt to reverse engineer, attack, overload, or misuse the service.</li>
          <li>Use generated content for fraud, impersonation, or deceptive hiring practices.</li>
        </ul>
      </Block>

      <Block title="8. Limitation of liability">
        <p>To the fullest extent permitted by law, WorkZo AI is provided “as is” without warranties. We are not liable for indirect, incidental, consequential, or employment-related damages arising from use of the product.</p>
      </Block>

      <Block title="9. Contact">
        <p>For terms questions, contact: <a className="text-blue-300 hover:text-blue-200" href="mailto:support@workzoai.com">support@workzoai.com</a></p>
      </Block>
    </LegalShell>
  );
}
