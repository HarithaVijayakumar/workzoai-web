import { ShieldCheck, Sparkles } from "lucide-react";

type BetaPrivacyNoticeProps = {
  compact?: boolean;
  className?: string;
};

export default function BetaPrivacyNotice({
  compact = false,
  className = "",
}: BetaPrivacyNoticeProps) {
  return (
    <div
      className={`rounded-2xl border border-cyan-300/20 bg-cyan-400/8 p-4 text-cyan-50 ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-cyan-400/12">
          {compact ? <ShieldCheck className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
        </div>
        <div>
          <p className="font-black">Beta notice</p>
          <p className="mt-1 text-sm leading-6 text-cyan-100/85">
            WorkZo AI is in beta. Interview feedback, CV insights, and recruiter scoring may be incomplete or imperfect.
            Please review outputs before using them for real applications.
          </p>
          {!compact && (
            <p className="mt-2 text-sm leading-6 text-cyan-100/85">
              Privacy: your CV/JD stays in this setup unless you choose to submit feedback. Avoid uploading highly sensitive personal data.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
