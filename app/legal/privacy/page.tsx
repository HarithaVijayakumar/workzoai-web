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

export const metadata = { title: "Privacy Policy | WorkZo AI" };

export default function PrivacyPage() {
  return (
    <LegalShell eyebrow="Legal" title="Privacy Policy">
      <p className="text-slate-400">Last updated: June 2, 2026</p>

      <Block title="1. What WorkZo AI does">
        <p>WorkZo AI helps users prepare for interviews using CV content, job descriptions, interview transcripts, recruiter-style feedback, analytics, and saved session history.</p>
      </Block>

      <Block title="2. Information we may process">
        <p>Depending on how you use WorkZo AI, we may process:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Account information such as email address and authentication status.</li>
          <li>CV, resume, profile, role, company, country, and job description content you provide.</li>
          <li>Interview transcript, score, feedback, trust timeline, weakest-answer analysis, and session history.</li>
          <li>Product analytics such as pages viewed, interview started, interview completed, results viewed, recovery usage, and failure events.</li>
          <li>Technical information such as browser, device type, error logs, and approximate environment information.</li>
        </ul>
      </Block>

      <Block title="3. CV and interview data">
        <p>CV text, job descriptions, and interview transcripts are used to generate interview practice, feedback, scoring, and recruiter-style follow-up questions. Do not upload information you do not want processed for these purposes.</p>
      </Block>

      <Block title="4. Local storage">
        <p>WorkZo AI may use browser local storage to support recovery, saved interview state, founder analytics, preferences, and beta testing reliability. Clearing browser storage may remove local recovery data.</p>
      </Block>

      <Block title="5. Third-party providers">
        <p>WorkZo AI may use trusted third-party services for authentication, database storage, analytics, voice infrastructure, AI processing, error monitoring, and payments when payment features are introduced.</p>
      </Block>

      <Block title="6. Data deletion">
        <p>You can contact us to request deletion of account-related data. Some technical logs may remain for a limited time where required for security, debugging, legal, or abuse prevention purposes.</p>
      </Block>

      <Block title="7. Important disclaimer">
        <p>WorkZo AI is an interview preparation tool. It does not guarantee job interviews, employment, job offers, visa outcomes, career outcomes, recruiter decisions, or hiring results.</p>
      </Block>

      <Block title="8. Contact">
        <p>For privacy questions, contact: <a className="text-blue-300 hover:text-blue-200" href="mailto:support@workzoai.com">support@workzoai.com</a></p>
      </Block>
    </LegalShell>
  );
}
