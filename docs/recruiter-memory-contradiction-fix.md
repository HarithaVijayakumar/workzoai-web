# Recruiter memory + contradiction fix

Replace:
- lib/workzoRecruiterIntelligenceV2.ts
- app/interview/page.tsx

Fixes:
- Recruiter intelligence now reconstructs memory from full candidate transcript.
- Contradiction detection compares current answer against prior claims.
- Recruiter response now returns `shouldOverride` and `spokenReply`, matching the interview page checks.
- Interview page passes transcript into the memory engine.
- Contradiction reply asks the candidate to clarify the exact inconsistent claim.

Test:
1. Say: "I managed a team of 50 people."
2. Later say: "Actually I worked completely alone."
Expected: recruiter pauses and asks you to clarify the inconsistency.
