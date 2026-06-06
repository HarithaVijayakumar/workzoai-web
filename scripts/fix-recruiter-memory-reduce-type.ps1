# WorkZo AI - Fix mergeRecruiterMemoryV2 reduce typing
# Run from project root:
#   C:\Projects\workzo-web
#
# Fixes:
# Type error: Type 'unknown' is not assignable to type 'RecruiterMemoryV2'
# in app/lib/workzoRecruiterIntelligenceV2.ts

$ErrorActionPreference = "Stop"

$paths = @(
  "app\lib\workzoRecruiterIntelligenceV2.ts",
  "lib\workzoRecruiterIntelligenceV2.ts"
)

$changed = @()

foreach ($path in $paths) {
  if (!(Test-Path $path)) {
    Write-Host "Skipped missing file: $path" -ForegroundColor Yellow
    continue
  }

  $content = Get-Content $path -Raw
  $original = $content

  $content = $content.Replace(
    "return memories.reduce((merged, item) => {",
    "return memories.reduce<RecruiterMemoryV2>((merged, item) => {"
  )

  # If it already has the fix, avoid duplicate generic.
  $content = $content.Replace(
    "return memories.reduce<RecruiterMemoryV2><RecruiterMemoryV2>((merged, item) => {",
    "return memories.reduce<RecruiterMemoryV2>((merged, item) => {"
  )

  if ($content -ne $original) {
    Set-Content -Path $path -Value $content -NoNewline
    $changed += $path
    Write-Host "Patched: $path" -ForegroundColor Green
  } else {
    Write-Host "No change needed: $path" -ForegroundColor Cyan
  }
}

Write-Host ""
Write-Host "Verify patched line:" -ForegroundColor Cyan
foreach ($path in $paths) {
  if (Test-Path $path) {
    Select-String -Path $path -Pattern "reduce<RecruiterMemoryV2>" | ForEach-Object {
      Write-Host "$($_.Path):$($_.LineNumber): $($_.Line.Trim())"
    }
  }
}

Write-Host ""
Write-Host "Now run:" -ForegroundColor Cyan
Write-Host "npm run build"
