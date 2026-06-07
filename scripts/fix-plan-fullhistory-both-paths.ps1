# WorkZo AI - restore fullHistory plan limit in both possible paths
# Run from project root: C:\Projects\workzo-web

$ErrorActionPreference = "Stop"

$paths = @(
  "lib\workzoPlanLimits.ts",
  "app\lib\workzoPlanLimits.ts"
)

foreach ($path in $paths) {
  if (!(Test-Path $path)) {
    Write-Host "Skipped missing file: $path" -ForegroundColor Yellow
    continue
  }

  $content = Get-Content $path -Raw
  $original = $content

  # Add fullHistory to the WorkZoPlanLimits type if missing.
  if ($content -notmatch "fullHistory\s*:\s*boolean") {
    $content = $content.Replace(
      "interviewHistory: boolean;",
      "interviewHistory: boolean;`n  fullHistory: boolean;"
    )
  }

  # Add fullHistory to free plan if missing.
  if ($content -notmatch "fullHistory\s*:\s*false") {
    $content = $content.Replace(
      "interviewHistory: false,",
      "interviewHistory: false,`n    fullHistory: false,"
    )
  }

  # Add fullHistory to premium plan if missing.
  if ($content -notmatch "fullHistory\s*:\s*true") {
    $content = $content.Replace(
      "interviewHistory: true,",
      "interviewHistory: true,`n    fullHistory: true,"
    )
  }

  if ($content -ne $original) {
    Set-Content -Path $path -Value $content -NoNewline
    Write-Host "Patched: $path" -ForegroundColor Green
  } else {
    Write-Host "Already okay: $path" -ForegroundColor Cyan
  }

  Select-String -Path $path -Pattern "fullHistory"
}

Write-Host ""
Write-Host "Now run:" -ForegroundColor Cyan
Write-Host "npm run build"
