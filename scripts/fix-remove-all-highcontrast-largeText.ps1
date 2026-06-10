# WorkZo AI - remove all missing highContrast/largeText references
# Run from project root: C:\Projects\workzo-web

$ErrorActionPreference = "Stop"

$path = "app\interview\page.tsx"

if (!(Test-Path $path)) {
  throw "Missing $path"
}

$content = Get-Content $path -Raw

# Replace any template ternary using missing largeText/highContrast.
$content = $content -replace '\$\{largeText\s*\?\s*"[^"]*"\s*:\s*""\}', ''
$content = $content -replace '\$\{highContrast\s*\?\s*"[^"]*"\s*:\s*""\}', ''

# Replace any normal TS ternary using missing largeText/highContrast.
$content = $content -replace 'largeText\s*\?\s*"[^"]*"\s*:\s*""', '""'
$content = $content -replace 'highContrast\s*\?\s*"[^"]*"\s*:\s*""', '""'

# Remove accidentally inserted dead consts from earlier patch.
$content = $content.Replace('  const largeText = false;
  const highContrast = false;

', '')

Set-Content -Path $path -Value $content -NoNewline

Write-Host "Patched: $path" -ForegroundColor Green
Write-Host ""
Write-Host "Remaining references:" -ForegroundColor Cyan
$remaining = Select-String -Path $path -Pattern "largeText|highContrast"
if ($remaining) {
  $remaining | ForEach-Object {
    Write-Host "$($_.LineNumber): $($_.Line.Trim())" -ForegroundColor Yellow
  }
} else {
  Write-Host "None" -ForegroundColor Green
}

Write-Host ""
Write-Host "Now run:" -ForegroundColor Cyan
Write-Host "npm run build"
