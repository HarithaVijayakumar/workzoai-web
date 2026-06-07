# CV stale preview + language opening fix

Replace:
- app/onboarding/page.tsx
- lib/workzoResumeParser.ts
- app/interview/page.tsx

Fixes:
- Clears previous CV preview before reading a new uploaded CV.
- Reduces stale/clumsy extraction flashing while parsing.
- Removes founder-specific personal fallback data from onboarding/parser.
- First interview question now uses selected language instead of default English.

Test:
1. Upload a CV.
2. Immediately upload a second CV.
3. Old profile should not remain visible as if it belongs to the new CV.
4. Select German/Dutch/French/Portuguese/Spanish and start interview.
5. First question should be localized.
