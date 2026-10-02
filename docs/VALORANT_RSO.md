# ZeroTwo.gg — VALORANT via Riot Sign On (RSO)

Status: **frontend + backend rich-data foundation implemented and Supabase schema/function deployed; player activation still depends on Riot Production/RSO credentials and the browser feature flag**

## Why VALORANT is different from League

VALORANT player-specific stats cannot use ZeroTwo's public League lookup flow.

Riot requires player opt-in for VALORANT applications that display player stats, match history, LFG data or similar player-specific information. The opt-in is performed with Riot Sign On (RSO).

Because of that:

- League can continue to support public Riot-ID lookup where permitted.
- VALORANT must be linked by the player through Riot Sign On.
- ZeroTwo must not display VALORANT stats for arbitrary Riot IDs.
- ZeroTwo must not implement scouting of opponents before a match.
- RSO is available only to approved Production-level applications.

Official policy/reference:
- https://developer.riotgames.com/docs/valorant
- https://developer.riotgames.com/apis

## Implemented architecture

### Frontend

`src/features/valorant/ValorantConnect.tsx`

The Player 01 dashboard contains the VALORANT integration.

With `VITE_VALORANT_RSO_ENABLED` disabled, the UI shows that RSO is prepared but awaiting Riot production access.

With the flag enabled:

1. Player selects VALORANT shard.
2. Player clicks `Conectar Riot`.
3. Browser requests `valorant-rso-start`.
4. Edge Function returns Riot's authorization URL.
5. Player authenticates and explicitly opts in with Riot.
6. Riot redirects to `valorant-rso-callback`.
7. Callback links the Riot account to the authenticated ZeroTwo user.
8. Browser returns to ZeroTwo.
9. `valorant-profile` loads permitted recent VALORANT data.

### Database

Migration:

`supabase/migrations/20260927_valorant_rso.sql`

Tables:

- `riot_rso_states`
  - short-lived OAuth state;
  - user ID;
  - VALORANT shard;
  - expiration;
  - no browser RLS policies.

- `valorant_accounts`
  - ZeroTwo user ID;
  - PUUID, server-side only;
  - Riot game name and tag line;
  - shard;
  - explicit sharing/opt-in state;
  - linked timestamp;
  - no browser RLS policies.

The browser never queries these tables directly.

### Edge Functions

`valorant-rso-start`
- requires an authenticated ZeroTwo session;
- creates a short-lived state record;
- returns Riot's RSO authorization URL;
- does not expose client secret.

`valorant-rso-callback`
- validates OAuth state and expiry;
- exchanges the authorization code server-side;
- retrieves the authenticated Riot Account through `/riot/account/v1/accounts/me`;
- saves the link/opt-in;
- intentionally does **not** persist Riot access or refresh tokens;
- returns the player to ZeroTwo.

`valorant-profile`
- requires an authenticated ZeroTwo session;
- only loads the current user's linked/opted-in VALORANT account;
- uses the server-side Riot Production API key;
- uses VAL-MATCH-V1:
  - `/val/match/v1/matchlists/by-puuid/{puuid}`
  - `/val/match/v1/matches/{matchId}`
- uses VAL-CONTENT-V1 for agent names;
- normalizes recent matches;
- never returns PUUID to the browser.

`valorant-unlink`
- lets the current user revoke the ZeroTwo link;
- deletes the server-side VALORANT account association.

## Required Riot access

Riot's current VALORANT policy says Personal Key applications are not supported and all player-specific applications require opt-in via RSO.

Before activation, ZeroTwo needs:

1. Riot Production application approval.
2. RSO client provisioned by Riot.
3. Approved redirect URL.
4. Production Riot API key.

## Required Supabase Edge secrets

Set these only as Edge Function secrets:

```text
RIOT_RSO_CLIENT_ID=
RIOT_RSO_CLIENT_SECRET=
RIOT_RSO_REDIRECT_URI=https://bieihhaobdztjyoweewa.supabase.co/functions/v1/valorant-rso-callback
RIOT_API_KEY=
APP_URL=https://helioconde.github.io/zerotwo.gg/
```

Do not place these values in Vite/browser environment variables.

## Frontend activation flag

The only browser-safe flag is:

```text
VITE_VALORANT_RSO_ENABLED=true
```

Do not enable it until the migration and all VALORANT Edge Functions are deployed and the Riot RSO redirect is approved.

## Suggested deployment sequence

From a Supabase CLI environment connected to project `bieihhaobdztjyoweewa`:

```bash
supabase link --project-ref bieihhaobdztjyoweewa
supabase db push

supabase functions deploy valorant-rso-start
supabase functions deploy valorant-rso-callback --no-verify-jwt
supabase functions deploy valorant-profile
supabase functions deploy valorant-unlink
```

Why callback uses `--no-verify-jwt`:
Riot calls the OAuth callback directly and therefore cannot send a Supabase user JWT. Security is provided by the one-time, short-lived OAuth `state` stored server-side.

The other three functions should continue to require authenticated Supabase users.

## Riot endpoints used

RSO:
- `GET https://auth.riotgames.com/authorize`
- `POST https://auth.riotgames.com/token`
- `GET https://{americas|europe|asia}.api.riotgames.com/riot/account/v1/accounts/me`

VALORANT API:
- `GET /val/content/v1/contents`
- `GET /val/match/v1/matchlists/by-puuid/{puuid}`
- `GET /val/match/v1/matches/{matchId}`

## Shards supported by the current frontend

- BR
- LATAM
- NA
- EU
- KR
- AP

## Privacy decisions

- No arbitrary public VALORANT player lookup.
- No opponent scouting.
- No live tactical data.
- No unofficial MMR/ELO.
- No PUUID in the browser response.
- No Riot access/refresh tokens stored by ZeroTwo in this initial implementation.
- User can unlink VALORANT from Player 01.
- Match analysis is post-game only.

## Rich Riot Life foundation added

The linked VALORANT flow is now prepared to grow similarly to League Riot Life while keeping VALORANT-specific metrics and access rules.

Server-side additions:

- protected `valorant_match_cache` for immutable completed-match payloads;
- protected `valorant_user_matches` relation that accumulates authorized history across visits;
- up to 100 accumulated matches can be returned when the account has observed enough history over time;
- VAL-CONTENT-V1 resolves agent, map and equipment names when available;
- normalized post-match metrics now include:
  - agent, map, queue and result;
  - K/D/A and K/D;
  - score per round / ACS-style score;
  - round damage / ADR;
  - head/body/leg hits and headshot rate;
  - first kills and first deaths;
  - 2K/3K/4K/ace rounds;
  - plants and defuses;
  - loadout value and round spend;
  - weapon usage by round;
  - ability casts;
  - rounds won/lost and round differential.

Frontend additions:

- `src/features/valorant/ValorantLifeExperience.tsx`;
- 20 VALORANT-specific Riot Life chapters;
- recent-vs-previous trend comparisons;
- session grouping;
- evidence rows that trace narrative metrics back to matches.

No PUUID is returned to the browser. Player identities from other participants are not used for public scouting; teammate/opponent context is reduced to agent composition where useful.

## Remaining activation blocker

The technical foundation is deployed. Public activation should remain disabled until Riot has provisioned the approved Production/RSO credentials and redirect for the application.

The browser-safe switch remains:

```text
VITE_VALORANT_RSO_ENABLED=true
```

Only enable it after the Riot credentials/secrets are confirmed in the production environment.

