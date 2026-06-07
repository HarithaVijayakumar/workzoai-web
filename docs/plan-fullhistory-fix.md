# Plan fullHistory fix

The build fails because `FeatureGate.tsx` expects:

```ts
limits.fullHistory
```

This script adds `fullHistory` back to:

```txt
lib/workzoPlanLimits.ts
```

Run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\fix-plan-fullhistory.ps1
npm run build
```
