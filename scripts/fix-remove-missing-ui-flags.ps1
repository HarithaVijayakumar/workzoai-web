# WorkZo AI - remove missing largeText/highContrast references
# Run from project root: C:\Projects\workzo-web

$ErrorActionPreference = "Stop"

$path = "app\interview\page.tsx"

if (!(Test-Path $path)) {
  throw "Missing $path"
}

$content = Get-Content $path -Raw

# Replace missing variables directly in JSX template expressions.
$content = $content.Replace('${largeText ? " text-lg" : ""}', '${false ? " text-lg" : ""}')
$content = $content.Replace('${highContrast ? " contrast-125" : ""}', '${false ? " contrast-125" : ""}')
$content = $content.Replace('${highContrast ? " high-contrast" : ""}', '${false ? " high-contrast" : ""}')
$content = $content.Replace('${highContrast ? " bg-black" : ""}', '${false ? " bg-black" : ""}')

# Generic cleanup for remaining occurrences in className strings.
$content = $content.Replace('largeText ? " text-lg" : ""', 'false ? " text-lg" : ""')
$content = $content.Replace('highContrast ? " contrast-125" : ""', 'false ? " contrast-125" : ""')
$content = $content.Replace('highContrast ? " high-contrast" : ""', 'false ? " high-contrast" : ""')
$content = $content.Replace('highContrast ? " bg-black" : ""', 'false ? " bg-black" : ""')

# If previous script inserted these in the wrong place, remove harmless duplicate consts.
# Do not remove if you manually added real accessibility state elsewhere.
$content = $content.Replace('  const largeText = false;
  const highContrast = false;

', '')

Set-Content -Path $path -Value $content -NoNewline

Write-Host "Patched missing UI flag references in: $path" -ForegroundColor Green
Write-Host ""
Write-Host "Remaining references:" -ForegroundColor Cyan
Select-String -Path $path -Pattern "largeText|highContrast" | ForEach-Object {
  Write-Host "$($_.LineNumber): $($_.Line.Trim())"
}

Write-Host ""
Write-Host "Now run:" -ForegroundColor Cyan
Write-Host "npm run build"
