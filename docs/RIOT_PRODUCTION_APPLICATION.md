# ZeroTwo.gg — Riot Production API Application Draft

Status: **working prototype / not yet submitted**

Public prototype: https://helioconde.github.io/zerotwo.gg/

## Product summary

**ZeroTwo.gg is a League of Legends player-history, post-game analytics and Looking For Group platform.**

For League of Legends, a visitor can search a Riot ID and view permitted recent match information, official ranked data, champion mastery and transformative post-game analysis called **Gaming DNA**.

Gaming DNA does not create an alternative skill rank, MMR or ELO. It organizes historical match data into understandable, context-aware patterns. Ranked, Normal, ARAM and Arena are analyzed separately so that metrics are only compared when they make sense for that game mode.

A visitor does **not** need to create a ZeroTwo account to use the public League player lookup.

Account creation is optional and is requested only when a player wants to claim a Riot ID as their Player 01 identity and use **Find Your 02**, ZeroTwo's Looking For Group experience.

Players explicitly choose what they want to play — Ranked, Normal, ARAM, Arena or any supported mode. This intent is used as a matching signal.

After two users express mutual interest, **02 Sync** creates a post-match learning loop using permitted historical match data and voluntary user feedback to understand whether the pair actually enjoys playing together.

## Core player benefit

ZeroTwo has three layers:

1. **Player information**
   - Riot ID lookup
   - recent match history
   - official Riot ranked information
   - champion mastery
   - recent champion performance
   - game-mode distribution

2. **Transformative post-game analysis**
   - Gaming DNA
   - separate context by game mode
   - human-readable explanations
   - no unofficial MMR/ELO
   - no prescriptive live-game decisions

3. **Looking For Group**
   - Find Your 02
   - player-selected game-mode intent
   - server, availability, intent and gameplay signals
   - mutual interest before a connection
   - 02 Sync after players play together

## User flow

### Public League flow

1. Visitor opens ZeroTwo.gg.
2. Visitor enters Riot ID in the format `GameName#TagLine`.
3. ZeroTwo uses Account-V1 to resolve the player to PUUID.
4. ZeroTwo retrieves permitted League data through Riot APIs.
5. Visitor sees player information immediately without creating an account.
6. Visitor may inspect:
   - official Ranked Solo/Duo and Flex
   - recent modes
   - recent champion performance
   - champion mastery
   - Gaming DNA by mode
   - recent matches and match details
7. Visitor may leave without creating an account.

### Find Your 02 flow

1. Visitor chooses what they want to play:
   - Ranked
   - Normal
   - ARAM
   - Arena
   - Any
2. Visitor chooses "Use as Player 01".
3. ZeroTwo requests account creation/sign-in.
4. Riot ID and selected server are preserved through the authentication flow.
5. ZeroTwo saves the player's Player 01 identity.
6. The selected game-mode intent is preserved.
7. Find Your 02 searches discoverable users.
8. Matching signals currently include:
   - same Riot platform/server
   - selected game mode
   - availability
   - stated intent
   - compatible League role signals when applicable
   - Gaming DNA availability
9. Both players must express interest before ZeroTwo creates a connection.

### 02 Sync flow

1. Mutual interest creates a ZeroTwo connection.
2. Players are asked to play together.
3. ZeroTwo checks permitted post-game match history.
4. Shared-match signals may be summarized after matches are complete.
5. Players may voluntarily answer whether they would play together again.
6. This information may improve future recommendations.

## Riot APIs currently used

- Account-V1
- Summoner-V4
- Match-V5
- League-V4
- Champion-Mastery-V4

Static League content is resolved through Riot Data Dragon where appropriate.

## Planned Riot integrations

### League of Legends

Potential future use:
- additional permitted Challenges data
- richer post-game explanations
- deeper historical trend views

### Current production scope

The current Production API application is intentionally scoped to **League of Legends only**. Experimental VALORANT work is disabled in the public product and is not part of this production request.

## Game integrity

ZeroTwo does not and will not:

- provide cheating functionality;
- expose hidden opponent information;
- provide live tactical prescriptions;
- dictate in-game decisions;
- calculate or display an unofficial MMR or ELO;
- replace Riot's official ranked ladder;
- provide scouting features designed to gain a competitive advantage before a match;
- analyze deliberately hidden players;
- expose custom League match history publicly when opt-in is required;
- simulate League of Legends gameplay.

Gaming DNA is descriptive post-game analysis. It is intended to help players understand their own recent patterns and find other players who may want a compatible play experience.

## Context-aware analysis

ZeroTwo intentionally avoids treating every League mode as if it were Ranked Summoner's Rift.

Examples:

- CS/min and lane-position signals are used only where those metrics are meaningful.
- ARAM contributes its own recent champion, KDA, damage and frequency patterns.
- Arena is treated as a separate context.
- A player who mainly wants ARAM is not required to have Ranked data in order to use Find Your 02.

This prevents misleading comparisons and keeps the analysis aligned with the experience the player actually wants.

## Public match history safeguards

- Riot ID is the player-facing identifier.
- PUUID remains server-side and is not exposed in the public ZeroTwo UI.
- Queue/context is checked before analysis.
- Queue 0/custom matches are excluded from the public profile response.
- Historical metrics are used after matches, not as live-game assistance.

## Security

- Riot API keys are stored only as Supabase Edge Function secrets.
- Riot API keys are never shipped to the browser.
- Supabase service-role credentials remain server-side.
- Browser code uses only the Supabase publishable key.
- HTTPS is used for the deployed application and API traffic.
- Riot and match responses are normalized before being returned to the browser.
- Public endpoints do not return PUUID.
- Match data is cached server-side to reduce unnecessary Riot API traffic.
- Client diagnostics redact or block token/password/authorization/secret/PUUID/API-key fields.
- Client diagnostic page paths do not store query strings.

## Data minimization

Public League lookup is query-based and does not automatically create a ZeroTwo profile.

A ZeroTwo account is created only when the user chooses to continue into Player 01 / Find Your 02.

Public lookup history used for "what changed since your last visit" is stored locally in the visitor's browser and is not required for account creation.

## Monetization direction

ZeroTwo currently focuses on the free prototype.

If monetization is introduced:

- a free tier will remain available;
- paid content will be transformative;
- ZeroTwo will not charge for unfair competitive advantages;
- ZeroTwo will not offer betting or gambling;
- ZeroTwo will not sell unofficial ranking/MMR;
- monetization will be updated in the Riot Developer Portal product description before release.

Potential transformative paid features may include deeper historical trend analysis, additional post-game insights and advanced personal analytics, subject to Riot approval and applicable policy.

## Product scope

The submitted product experience is League of Legends only. The public site, authenticated Riot Life and data-processing paths presented for review use League APIs and League data only.

## Legal attribution

The product displays Riot's required independent-product disclaimer in the public site footer.

## Prototype functionality currently testable

- public Riot ID lookup;
- account resolution;
- Summoner level;
- official ranked data;
- champion mastery;
- recent match history;
- match-mode filtering;
- match details;
- recent champion performance;
- multimode Gaming DNA;
- local "changes since last visit";
- shareable player profile URL;
- Player 01 account flow;
- mode-aware Find Your 02;
- LAB candidates for controlled matching tests;
- mutual-interest flow;
- 02 Sync interface;
- voluntary post-play feedback;
- internal diagnostic logging.

## Production request rationale

The working prototype currently uses a Development API key during development. ZeroTwo requires a Production API key before opening the product for public player consumption at scale.

Production access is needed to:

- keep the public League lookup reliably available;
- operate within appropriate Riot rate limits;
- support the Riot Life experience for a broader League audience;
- continue validating post-game history, trends and player-facing explanations at production scale.

## Suggested short application description

> ZeroTwo.gg is a League of Legends Riot Life experience that turns permitted Riot data into a readable player history. Visitors can search a Riot ID to explore recent matches, official ranked data, champion mastery, mode-aware trends, sessions, recurring co-players and post-game comparisons. Ranked, Normal, ARAM and Arena are kept in their proper contexts, and ZeroTwo does not create an alternative MMR/ELO. Players may optionally create a ZeroTwo account to preserve their Riot Life and use social/LFG features. ZeroTwo does not provide live competitive information, hidden opponent information, cheating functionality or prescriptive in-game decisions.

## Submission checklist

Before submitting:

- [ ] Verify the latest public deployment is stable.
- [ ] Test public Riot ID lookup in at least BR1, NA1 and EUW1.
- [ ] Verify Development API key has not been exposed in frontend bundles.
- [ ] Capture screenshots/video of the complete public lookup flow.
- [ ] Capture screenshots/video of Player 01 -> Find 02 -> Match -> 02 Sync.
- [ ] Confirm the Riot legal boilerplate is readily visible.
- [ ] Confirm custom match history is not publicly displayed.
- [ ] Confirm Gaming DNA does not display unofficial MMR/ELO.
- [ ] Confirm the Developer Portal product metadata matches the current ZeroTwo flow.
- [ ] Submit the Production API key application.
