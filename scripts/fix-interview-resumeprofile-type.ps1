# WorkZo AI - fix InterviewSetup resumeProfile TypeScript error
# Run from project root: C:\Projects\workzo-web

$ErrorActionPreference = "Stop"

$path = "app\interview\page.tsx"

if (!(Test-Path $path)) {
  throw "Missing $path"
}

$content = Get-Content $path -Raw

if ($content -notmatch "resumeProfile\?\s*:") {
  $content = $content.Replace(
'  jobDescription?: string;
};',
'  jobDescription?: string;
  resumeProfile?: {
    basics?: {
      name?: string;
    };
  };
};'
  )

  Set-Content -Path $path -Value $content -NoNewline
  Write-Host "Patched InterviewSetup resumeProfile type." -ForegroundColor Green
} else {
  Write-Host "resumeProfile type already exists. No change needed." -ForegroundColor Cyan
}

Select-String -Path $path -Pattern "type InterviewSetup|resumeProfile|candidateName" | Select-Object -First 20 | ForEach-Object {
  Write-Host "$($_.LineNumber): $($_.Line.Trim())"
}

Write-Host ""
Write-Host "Now run:" -ForegroundColor Cyan
Write-Host "npm run build"
