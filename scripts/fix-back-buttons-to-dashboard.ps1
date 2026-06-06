# WorkZo AI - Back buttons to Dashboard fixer
# Run from your project root:
#   C:\Projects\workzo-web
#
# This updates feature-page back links so users return to /dashboard,
# not /onboarding.
#
# It intentionally skips:
# - app/onboarding
# - app/pricing
# - app/login
# - app/page.tsx landing page
# - app/api

$ErrorActionPreference = "Stop"

$root = Get-Location
Write-Host "Running from: $root" -ForegroundColor Cyan

$files = Get-ChildItem -Path "app" -Recurse -Include *.tsx,*.ts |
  Where-Object {
    $_.FullName -notmatch "\\app\\onboarding\\" -and
    $_.FullName -notmatch "\\app\\pricing\\" -and
    $_.FullName -notmatch "\\app\\login\\" -and
    $_.FullName -notmatch "\\app\\api\\" -and
    $_.FullName -notmatch "\\app\\page\.tsx$"
  }

$changed = @()

foreach ($file in $files) {
  $original = Get-Content $file.FullName -Raw
  $updated = $original

  # Direct JSX links
  $updated = $updated -replace 'href="/onboarding"', 'href="/dashboard"'
  $updated = $updated -replace "href='/onboarding'", "href='/dashboard'"

  # Router navigation
  $updated = $updated -replace 'router\.push\("/onboarding"\)', 'router.push("/dashboard")'
  $updated = $updated -replace "router\.push\('/onboarding'\)", "router.push('/dashboard')"

  # Window navigation
  $updated = $updated -replace 'window\.location\.href\s*=\s*"/onboarding"', 'window.location.href = "/dashboard"'
  $updated = $updated -replace "window\.location\.href\s*=\s*'/onboarding'", "window.location.href = '/dashboard'"

  # Link label cleanup
  $updated = $updated -replace "Back to setup", "Back to Dashboard"
  $updated = $updated -replace "Back to onboarding", "Back to Dashboard"
  $updated = $updated -replace "Back to Onboarding", "Back to Dashboard"
  $updated = $updated -replace "Back home", "Back to Dashboard"

  if ($updated -ne $original) {
    Set-Content -Path $file.FullName -Value $updated -NoNewline
    $changed += $file.FullName
  }
}

Write-Host ""
Write-Host "Changed files:" -ForegroundColor Green
if ($changed.Count -eq 0) {
  Write-Host "No files changed. No /onboarding back links found in feature pages." -ForegroundColor Yellow
} else {
  $changed | ForEach-Object { Write-Host " - $_" }
}

Write-Host ""
Write-Host "Checking remaining /onboarding references..." -ForegroundColor Cyan
$remaining = Get-ChildItem -Path "app" -Recurse -Include *.tsx,*.ts |
  Select-String -Pattern "/onboarding" |
  Where-Object {
    $_.Path -notmatch "\\app\\onboarding\\" -and
    $_.Path -notmatch "\\app\\pricing\\" -and
    $_.Path -notmatch "\\app\\login\\" -and
    $_.Path -notmatch "\\app\\page\.tsx$" -and
    $_.Path -notmatch "\\app\\api\\"
  }

if ($remaining) {
  Write-Host "Remaining /onboarding references outside allowed flow:" -ForegroundColor Yellow
  $remaining | ForEach-Object {
    Write-Host "$($_.Path):$($_.LineNumber): $($_.Line.Trim())"
  }
  Write-Host ""
  Write-Host "Review these manually before committing." -ForegroundColor Yellow
} else {
  Write-Host "No unsafe /onboarding references found." -ForegroundColor Green
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. npm run build"
Write-Host "2. Test feature pages back buttons"
Write-Host "3. git status --short"
Write-Host "4. commit through PR branch"
