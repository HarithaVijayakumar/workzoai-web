# FeatureGate fullHistory fix

The build fails because:

```ts
limits.fullHistory
```

does not exist on `WorkZoPlanLimits`.

This script replaces it with:

```ts
limits.interviewHistory || limits.advancedReports
```

Run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\fix-featuregate-fullhistory.ps1
npm run build
```
