# WorkZo AI - fix missing largeText / highContrast variables
# Run from project root: C:\Projects\workzo-web

$ErrorActionPreference = "Stop"

$path = "app\interview\page.tsx"

if (!(Test-Path $path)) {
  throw "Missing $path"
}

$content = Get-Content $path -Raw

# Also keep previous resumeProfile type fix if not applied.
if ($content -notmatch "resumeProfile\?\s*:") {
  $content = $content.Replace(
'  cvText?: string;
  jobDescription?: string;
};',
'  cvText?: string;
  jobDescription?: string;
  resumeProfile?: {
    basics?: {
      name?: string;
    };
  };
};'
  )
}

if ($content -notmatch "const largeText\s*=") {
  $content = $content.Replace(
'  return (',
'  const largeText = false;
  const highContrast = false;

  return ('
  )
}

Set-Content -Path $path -Value $content -NoNewline

Write-Host "Patched: $path" -ForegroundColor Green
Select-String -Path $path -Pattern "largeText|highContrast|resumeProfile" | Select-Object -First 20 | ForEach-Object {
  Write-Host "$($_.LineNumber): $($_.Line.Trim())"
}

Write-Host ""
Write-Host "Now run:" -ForegroundColor Cyan
Write-Host "npm run build"
