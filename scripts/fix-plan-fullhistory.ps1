# WorkZo AI - restore fullHistory plan limit
# Run from project root: C:\Projects\workzo-web

$ErrorActionPreference = "Stop"

$path = "lib\workzoPlanLimits.ts"

if (!(Test-Path $path)) {
  throw "Missing $path"
}

$content = Get-Content $path -Raw

# Add fullHistory to the WorkZoPlanLimits type if missing.
if ($content -notmatch "fullHistory: boolean;") {
  $content = $content.Replace(
    "interviewHistory: boolean;",
    "interviewHistory: boolean;`n  fullHistory: boolean;"
  )
}

# Add fullHistory to free plan if missing.
if ($content -notmatch "fullHistory: false") {
  $content = $content.Replace(
    "interviewHistory: false,",
    "interviewHistory: false,`n    fullHistory: false,"
  )
}

# Add fullHistory to premium plan if missing.
if ($content -notmatch "fullHistory: true") {
  $content = $content.Replace(
    "interviewHistory: true,",
    "interviewHistory: true,`n    fullHistory: true,"
  )
}

Set-Content -Path $path -Value $content -NoNewline

Write-Host "Patched $path" -ForegroundColor Green
Select-String -Path $path -Pattern "fullHistory"

Write-Host ""
Write-Host "Now run:" -ForegroundColor Cyan
Write-Host "npm run build"
