# fullHistory both-path fix

Run from project root:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\fix-plan-fullhistory-both-paths.ps1
npm run build
```

This patches both:

```txt
lib/workzoPlanLimits.ts
app/lib/workzoPlanLimits.ts
```
