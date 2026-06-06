# WorkZo AI - restore getWorkZoPlanUpgradeCopy export
# Run from project root: C:\Projects\workzo-web

$ErrorActionPreference = "Stop"

$path = "lib\workzoPlanLimits.ts"

if (!(Test-Path $path)) {
  throw "Missing $path"
}

$content = Get-Content $path -Raw

if ($content -notmatch "export function getWorkZoPlanUpgradeCopy") {
  $append = @'

export function getWorkZoPlanUpgradeCopy(feature?: string) {
  const normalized = String(feature || "premium").toLowerCase();

  if (normalized.includes("video") || normalized.includes("avatar") || normalized.includes("tavus")) {
    return {
      eyebrow: "AI Video Recruiter",
      title: "Unlock realistic AI video interviews",
      description:
        "Practice with AI recruiter avatars, deeper follow-ups, and a more immersive interview experience.",
      bullets: [
        "AI Video Recruiter access",
        "More realistic interview practice",
        "Full recruiter report",
        "Interview history",
      ],
      cta: "Upgrade to Premium",
    };
  }

  if (normalized.includes("cv") || normalized.includes("resume")) {
    return {
      eyebrow: "Improve CV",
      title: "Unlock CV improvement tools",
      description:
        "Turn interview feedback and job requirements into a stronger, more targeted CV.",
      bullets: [
        "Improve CV for the role",
        "Job-specific keyword guidance",
        "ATS-friendly suggestions",
        "Better interview preparation",
      ],
      cta: "Upgrade to Premium",
    };
  }

  if (normalized.includes("cover")) {
    return {
      eyebrow: "Cover Letter",
      title: "Unlock cover letter generation",
      description:
        "Create role-specific cover letters using your CV, target role, and job description.",
      bullets: [
        "Role-specific cover letters",
        "CV-aware writing",
        "Cleaner application story",
        "Faster job applications",
      ],
      cta: "Upgrade to Premium",
    };
  }

  if (normalized.includes("job")) {
    return {
      eyebrow: "Job Assist",
      title: "Unlock job preparation tools",
      description:
        "Analyze roles, prepare better answers, and connect your CV to the job more clearly.",
      bullets: [
        "Job description breakdown",
        "CV-to-role fit guidance",
        "Preparation checklist",
        "Better application focus",
      ],
      cta: "Upgrade to Premium",
    };
  }

  if (normalized.includes("result") || normalized.includes("report") || normalized.includes("trust")) {
    return {
      eyebrow: "Full Results",
      title: "Unlock the full recruiter report",
      description:
        "See trust score, weak answers, evidence requests, contradiction notes, and full interview history.",
      bullets: [
        "Full recruiter report",
        "Trust score",
        "Weak-answer detection",
        "Contradiction and evidence notes",
      ],
      cta: "Upgrade to Premium",
    };
  }

  return {
    eyebrow: "Premium",
    title: "Unlock the full WorkZo AI toolkit",
    description:
      "Get full reports, interview history, AI Video Recruiter, CV improvement, cover letters, and job preparation tools.",
    bullets: [
      "25 interviews per month",
      "Full recruiter reports",
      "AI Video Recruiter",
      "Improve CV, Cover Letter, and Job Assist",
    ],
    cta: "Upgrade to Premium",
  };
}
'@

  Add-Content -Path $path -Value $append
  Write-Host "Added getWorkZoPlanUpgradeCopy export to $path" -ForegroundColor Green
} else {
  Write-Host "getWorkZoPlanUpgradeCopy already exists in $path" -ForegroundColor Cyan
}

Select-String -Path $path -Pattern "getWorkZoPlanUpgradeCopy"

Write-Host ""
Write-Host "Now run:" -ForegroundColor Cyan
Write-Host "npm run build"
