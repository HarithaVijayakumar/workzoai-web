# WorkZo Back Button Fix

This fixes feature-page back buttons that send users back to onboarding.

## Run from project root

```powershell
cd C:\Projects\workzo-web
powershell -ExecutionPolicy Bypass -File .\scripts\fix-back-buttons-to-dashboard.ps1
npm run build
```

## Expected result

Feature pages should return to:

```txt
/dashboard
```

Not:

```txt
/onboarding
```

The script skips onboarding, pricing, login, landing, and API files.
