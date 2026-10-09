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

- [ ] GitHub Pages deploy **success** after latest commit; verify actual served commit/build.
- [ ] GitHub Actions **ZeroTwo Visual QA** success with screenshots reviewed (home, fixture 20/100 both viewports).
- [ ] Supabase workflow deploy succeeded (both functions) on project `bieihhaobdztjyoweewa`, or equivalent manual deploy verified.
- [ ] Live lookup AlchemyFlames#BR1: rank, mastery and recent matches with non-empty data where Riot provides them.
- [ ] Live extended history: no duplicate fetches, correct pending/rateLimited status, no timeout.
- [ ] Rate-limit test: HTTP 429 shows retry guidance, not "no history"/"no teammates".
- [ ] Manual mobile/desktop audit and keyboard-navigation audit.
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

**Gate status:** source-level checks passed; real deployment, live Riot data, screenshots and build result still need independent confirmation. Do not claim 9.5/10 until the checklist is complete.
