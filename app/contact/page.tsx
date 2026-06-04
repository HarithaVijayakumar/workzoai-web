import Link from "next/link";
import { ArrowLeft, Bug, Mail, MessageSquareText, ShieldCheck } from "lucide-react";

export const metadata = { title: "Contact | WorkZo AI" };

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#050b14] px-5 py-8 text-white">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          Back to WorkZo AI
        </Link>

        <section className="mt-8 rounded-3xl border border-white/10 bg-gradient-to-br from-blue-500/15 via-violet-500/10 to-white/[0.03] p-6 sm:p-8">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-200">Contact</p>
          <h1 className="mt-2 text-3xl font-black sm:text-5xl">Get in touch with WorkZo AI</h1>
          <p className="mt-4 max-w-2xl text-slate-300">Use this page for support, feedback, bug reports, partnership questions, or beta tester feedback.</p>
        </section>

        <section className="mt-5 grid gap-5 md:grid-cols-3">
          <a href="mailto:support@workzoai.com?subject=WorkZo%20AI%20Support" className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 transition hover:bg-white/[0.07]">
            <Mail className="h-7 w-7 text-blue-200" />
            <h2 className="mt-4 text-xl font-black">Support</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">Questions about your account, beta access, reports, or general product usage.</p>
          </a>

          <a href="mailto:support@workzoai.com?subject=WorkZo%20AI%20Bug%20Report" className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 transition hover:bg-white/[0.07]">
            <Bug className="h-7 w-7 text-amber-200" />
            <h2 className="mt-4 text-xl font-black">Report a bug</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">Share what happened, which page you were on, your device, and screenshots if possible.</p>
          </a>

          <a href="mailto:support@workzoai.com?subject=WorkZo%20AI%20Feedback" className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 transition hover:bg-white/[0.07]">
            <MessageSquareText className="h-7 w-7 text-emerald-200" />
            <h2 className="mt-4 text-xl font-black">Feedback</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">Tell us what felt realistic, confusing, useful, or missing in the interview experience.</p>
          </a>
        </section>

        <section className="mt-5 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-1 h-5 w-5 text-blue-200" />
            <div>
              <h2 className="font-black">Before sending private data</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">Please avoid sending sensitive personal documents by email unless necessary. For privacy requests, clearly mention “Privacy request” in the subject line.</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">Contact: <a className="text-blue-300 hover:text-blue-200" href="mailto:support@workzoai.com">support@workzoai.com</a></p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
