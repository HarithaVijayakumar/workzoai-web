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

export const metadata = { title: "Disclaimer | WorkZo AI" };

export default function DisclaimerPage() {
  return (
    <LegalShell eyebrow="Important" title="WorkZo AI Disclaimer">
      <Block title="Interview preparation only">
        <p>WorkZo AI is designed to help users practice interviews, improve answers, and understand recruiter-style feedback. It is not a hiring agency, recruiter, employer, immigration advisor, legal advisor, or financial advisor.</p>
      </Block>

      <Block title="No guaranteed outcomes">
        <p>WorkZo AI does not guarantee:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Job interviews</li>
          <li>Job offers</li>
          <li>Employment</li>
          <li>Salary increases</li>
          <li>Recruiter responses</li>
          <li>Visa, work permit, or immigration outcomes</li>
          <li>Career outcomes</li>
        </ul>
      </Block>

      <Block title="AI-generated content">
        <p>AI feedback may be incomplete or incorrect. Users should independently verify AI-generated suggestions before using them in job applications, interviews, legal processes, or professional decisions.</p>
      </Block>

      <Block title="User responsibility">
        <p>You are responsible for ensuring that your CV, interview answers, claims, metrics, and experience are truthful and accurate.</p>
      </Block>

      <Block title="Contact">
        <p>For questions, contact: <a className="text-blue-300 hover:text-blue-200" href="mailto:support@workzoai.com">support@workzoai.com</a></p>
      </Block>
    </LegalShell>
  );
}
