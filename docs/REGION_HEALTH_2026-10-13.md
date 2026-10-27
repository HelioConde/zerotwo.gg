# ZeroTwo — stability and regional health

\`ZeroTwo Cross-Region Health\` checks BR1, NA1, EUW1, KR with one requested match per known public Riot ID, plus an invalid region that must return 400. The script never logs PUUID, Riot keys or full responses; a JSON report is kept in Actions for 14 days.

A scheduled daily run alerts the repository maintainers through GitHub Actions failures if a region becomes unavailable, the active Riot key expires, identity no longer resolves or an upstream limit is reached. Any HTTP 429 stops the remaining live queries. This is intentionally shallow, not load testing, and is not a substitute for a production API key.

Synthetic 429 regression is already covered by \`scripts/visual-qa.mjs\`: preserves the last complete 20-match result and communicates partial information. Real 429 should not be forced by deliberately exhausting Riot's quota.

\`ZeroTwo Live Account QA\` separately tests up to 100 actual matches on BR1, teammates, desktop/mobile user experience and anonymous privacy authorization checks. Do not run deep history on a frequent schedule.

Privacy account-deletion tests use a fake service-role adapter and do not create or delete actual production users. An authenticated disposable-account E2E remains a separate required check.

## 27/10/2026 — leitura de indisponibilidade Riot
O monitor anterior recebeu HTTP 503 em BR1, NA1, EUW1 e KR (`error=player`) com 400 para uma região inválida. Esses HTTP 503 são reais, mas a resposta HTTP do Edge não expunha de modo suficiente se a API Riot havia retornado 401/403 ou se houve uma falha transitória.

O monitor inclui agora `upstreamRiotStatus` e `failureType` sanitizados, sem nomes de usuário, PUUID, chaves ou payloads. Se a Riot recusar a chave com 401/403, a execução falha e interrompe novas regiões; 429 também interrompe. Uma indisponibilidade genérica continua sendo falha legítima, nunca uma aprovação fictícia.

Em caso de autenticação recusada, conferir no Riot Developer Portal a validade e a categoria da chave e a variável `RIOT_API_KEY` armazenada como segredo da Supabase Edge Function. **Não colocar a chave no GitHub, no frontend ou nos logs.** Os testes sintéticos em PR não chamam as APIs Riot. O monitor diário da `main` permanece vermelho se a integração real estiver indisponível.
