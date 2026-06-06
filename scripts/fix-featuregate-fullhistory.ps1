# WorkZo AI - fix FeatureGate fullHistory reference
# Run from project root: C:\Projects\workzo-web

$ErrorActionPreference = "Stop"

$path = "components\gates\FeatureGate.tsx"

if (!(Test-Path $path)) {
  throw "Missing $path"
}

$content = Get-Content $path -Raw
$original = $content

# fullHistory no longer exists in WorkZoPlanLimits.
# Dashboard access should be based on existing plan fields.
$content = $content.Replace(
  'if (feature === "dashboard") return limits.fullHistory;',
  'if (feature === "dashboard") return limits.interviewHistory || limits.advancedReports;'
)

if ($content -ne $original) {
  Set-Content -Path $path -Value $content -NoNewline
  Write-Host "Patched: $path" -ForegroundColor Green
} else {
  Write-Host "No change made. Please check if the line differs." -ForegroundColor Yellow
}

Select-String -Path $path -Pattern "dashboard|fullHistory|interviewHistory"

Write-Host ""
Write-Host "Now run:" -ForegroundColor Cyan
Write-Host "npm run build"
