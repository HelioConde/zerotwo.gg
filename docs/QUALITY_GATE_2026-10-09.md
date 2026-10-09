# ZeroTwo — Quality Gate (2026-10-09)

## Scope delivered in GitHub (main)

- Default public Riot lookup requests **20** matches, with an explicit button to expand the observed sample to **100**.
- Loading, insufficient data, rank/mastery API errors, and incomplete match history are distinguished rather than reported as an unranked player.
- Cached completed match records are reused and writes are executed per batch concurrently; uncached Riot calls are fetched in batches of three.
- Public teammate calls cap retries on HTTP 429, no longer recurse indefinitely, preserve more candidates from each batch, and report missing data separately from "no teammate".
- Public Riot ID search stays usable even when an authenticated account has not completed onboarding.
- Dedicated responsive UX for the extended-history control.
- GitHub Actions visual QA screenshots use **synthetic fixture data** (not live Riot) for 1440 × 900 and 390 × 844 and test 20 → 100 progressive loading.

## Required verification before 9.5/10 sign-off

- [x] GitHub Pages build and publish succeeded for commit `049a3b1` (GitHub Actions run 37879665451); later pushes need their own verification.
- [x] GitHub Actions **ZeroTwo Visual QA** passed for synthetic fixture, desktop/mobile (run 37879665358).
- [ ] BLOCKED: public Edge Function deployment fails because GitHub Actions secret `SUPABASE_ACCESS_TOKEN` has an invalid token format. Action 37879655882 reported `Invalid access token format. Must be like sbp_...`. It is populated but not a valid personal access token.
- [x] Live `AlchemyFlames#BR1` lookup returned HTTP 200 with 20/20 matches, 2 ranked queue entries, 5 mastery entries (run 37880138971).
- [ ] Live extended history: no duplicate fetches, correct pending/rateLimited status, no timeout.
- [ ] Rate-limit test: HTTP 429 shows retry guidance, not "no history"/"no teammates".
- [ ] Review final full chapter rendering on mobile + keyboard-navigation audit. Initial real-browser smoke succeeded on desktop and mobile, but mobile screenshot was taken during lazy chapter loading; test is being tightened.
- [ ] Secure rotation of Riot development key previously posted in a conversation; keep only in the backend.
- [ ] Confirm production API key entitlement before public operation. Development keys are not authorized for public products.

## Edge Function rollout

The repo's public frontend invokes functions on project `bieihhaobdztjyoweewa`.
The connected Supabase tool did **not** expose that project during this audit.
The existing GitHub Actions deployment workflow has now been updated to deploy
both public Edge Functions automatically on pushes affecting their source or configuration.
This depends on the repository secret `SUPABASE_ACCESS_TOKEN` being configured correctly;
without it the workflow fails explicitly and **neither** function is deployed.

If the automatic job fails, authenticate the Supabase CLI against the correct project and deploy manually:

```bash
supabase functions deploy public-lol-profile --project-ref bieihhaobdztjyoweewa
supabase functions deploy public-lol-teammates --project-ref bieihhaobdztjyoweewa
```

Keep `RIOT_API_KEY` in Edge Function secrets and never in frontend code or GitHub commits.
Check the existing public invocation/JWT configuration in the Supabase dashboard, and do not relax auth settings for unrelated functions.
Never log complete secrets.

## Evidence

- GitHub Actions: `.github/workflows/deploy.yml` and `.github/workflows/visual-qa.yml`
- Browser script: `scripts/visual-qa.mjs`
- Public profile backend: `supabase/functions/public-lol-profile/index.ts`
- Teammates backend: `supabase/functions/public-lol-teammates/index.ts`
- Frontend: `src/features/public/PublicPlayerLookup.tsx`
- UI: `src/polish-2026-10-09.css`

**Gate status:** live data, production frontend build, desktop/mobile base UI, and synthetic screenshot tests passed. Backend rollout is blocked by an invalid Supabase personal access token stored in GitHub Actions; the live endpoint returns data but lacks the newer `status.ranked`/`status.mastery` fields, confirming that the backend version remains outdated. Real 100-match expansion and full mobile chapter rendering have not been approved yet. Do not claim 9.5/10 until those checks and the Supabase deploy succeed.
