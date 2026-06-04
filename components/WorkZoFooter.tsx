import Link from "next/link";

export default function WorkZoFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#050b14] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-slate-300">© WorkZo AI · Beta</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">Interview preparation support. WorkZo AI does not guarantee interviews, job offers, or employment outcomes.</p>
        </div>

        <div className="flex flex-wrap gap-4">
          <Link href="/legal/privacy" className="hover:text-white">Privacy</Link>
          <Link href="/legal/terms" className="hover:text-white">Terms</Link>
          <Link href="/legal/disclaimer" className="hover:text-white">Disclaimer</Link>
          <Link href="/contact" className="hover:text-white">Contact</Link>
          <Link href="/changelog" className="hover:text-white">Changelog</Link>
          <a href="mailto:support@workzoai.com" className="hover:text-white">support@workzoai.com</a>
        </div>
      </div>
    </footer>
  );
}
