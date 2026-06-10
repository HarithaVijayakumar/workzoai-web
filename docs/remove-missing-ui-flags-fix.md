# Remove missing UI flags fix

Fixes:

```txt
Cannot find name 'largeText'
Cannot find name 'highContrast'
```

Run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\fix-remove-missing-ui-flags.ps1
npm run build
```
