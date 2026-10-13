# ZeroTwo — stability and regional health

\`ZeroTwo Cross-Region Health\` checks BR1, NA1, EUW1, KR with one requested match per known public Riot ID, plus an invalid region that must return 400. The script never logs PUUID, Riot keys or full responses; a JSON report is kept in Actions for 14 days.

A scheduled daily run alerts the repository maintainers through GitHub Actions failures if a region becomes unavailable, the active Riot key expires, identity no longer resolves or an upstream limit is reached. Any HTTP 429 stops the remaining live queries. This is intentionally shallow, not load testing, and is not a substitute for a production API key.

Synthetic 429 regression is already covered by \`scripts/visual-qa.mjs\`: preserves the last complete 20-match result and communicates partial information. Real 429 should not be forced by deliberately exhausting Riot's quota.

\`ZeroTwo Live Account QA\` separately tests up to 100 actual matches on BR1, teammates, desktop/mobile user experience and anonymous privacy authorization checks. Do not run deep history on a frequent schedule.

Privacy account-deletion tests use a fake service-role adapter and do not create or delete actual production users. An authenticated disposable-account E2E remains a separate required check.
