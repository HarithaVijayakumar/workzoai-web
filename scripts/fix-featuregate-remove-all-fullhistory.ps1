# WorkZo AI - remove all FeatureGate fullHistory references
# Run from project root: C:\Projects\workzo-web

$ErrorActionPreference = "Stop"

$path = "components\gates\FeatureGate.tsx"

if (!(Test-Path $path)) {
  throw "Missing $path"
}

$content = Get-Content $path -Raw
$original = $content

$content = $content.Replace(
  'if (feature === "dashboard") return limits.fullHistory;',
  'if (feature === "dashboard") return limits.interviewHistory || limits.advancedReports;'
)

$content = $content.Replace(
  'if (feature === "history") return limits.fullHistory;',
  'if (feature === "history") return limits.interviewHistory || limits.advancedReports;'
)

# Safety replacement for any remaining fullHistory usage in this file.
$content = $content.Replace(
  "limits.fullHistory",
  "(limits.interviewHistory || limits.advancedReports)"
)

Set-Content -Path $path -Value $content -NoNewline

Write-Host "Patched: $path" -ForegroundColor Green
Write-Host ""
Write-Host "Remaining fullHistory references:" -ForegroundColor Cyan
$remaining = Select-String -Path $path -Pattern "fullHistory"
if ($remaining) {
  $remaining | ForEach-Object { Write-Host "$($_.LineNumber): $($_.Line.Trim())" -ForegroundColor Yellow }
} else {
  Write-Host "None" -ForegroundColor Green
}

Write-Host ""
Write-Host "Now run:" -ForegroundColor Cyan
Write-Host "npm run build"
