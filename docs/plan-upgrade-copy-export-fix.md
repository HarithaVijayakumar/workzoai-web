# Plan upgrade copy export fix

The build fails because `components/premium/UpgradeModal.tsx` imports:

```ts
getWorkZoPlanUpgradeCopy
```

but the latest `lib/workzoPlanLimits.ts` replacement removed that export.

Run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\fix-plan-upgrade-copy-export.ps1
npm run build
```

This adds the missing export back without changing your Product Hunt pre-Stripe flow.
