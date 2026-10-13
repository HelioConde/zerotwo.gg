# ZeroTwo — Quality Gate atualizado em 13/10/2026

## Comprovações verificadas
- [x] Deploy de funções Riot bem-sucedido: [GitHub Actions 38401606492](https://github.com/HelioConde/zerotwo.gg/actions/runs/38401606492).
- [x] Live Account QA 100 partidas reais: [GitHub Actions 38402003161](https://github.com/HelioConde/zerotwo.gg/actions/runs/38402003161).
- [x] `AlchemyFlames#BR1` retornou HTTP 200 para perfil, maestria, rank e colegas; 100/100 partidas com `pending=0` e `rateLimited=false`.
- [x] Navegação, capítulos, alternância de idioma e ausência de overflow passaram em desktop/mobile; sem erros JS no teste real validado.
- [x] Pages e Playwright sintético aprovados.
- [x] Tratamento de HTTP 429 com fixture; mantém 20 partidas já carregadas e informa como tentar novamente.
- [x] Conversão automatizada das 61 artes finais para WebP no build (~133 MB originais → ~19 MB variantes).

## Central de Privacidade
- [x] Opção explícita para eventos opcionais de produto, desativada por padrão; ao desligar, o buffer de eventos é descartado.
- [x] Limpeza de registros locais com prefixo `zt_` sem apagar a sessão Supabase.
- [x] Edge Function `privacy-manage` aceita somente JWT validado e extrai user_id via `auth.getUser(token)`. Remove apenas `riot_life_snapshots` daquele usuário.
- [ ] Teste de exclusão **autenticada** com conta e snapshots de teste. Não apagar os dados de contas existentes para testar.
- [ ] O recurso não exclui conta, outros registros da aplicação ou caches técnicos: requer política/processo separado.
- [ ] Confirmar canal de comunicação privado para pedidos LGPD.

## Aprovação Riot
- [ ] Verificar no [Riot Developer Portal](https://developer.riotgames.com/) se a chave de produção deste produto foi realmente aprovada. Dev/personal keys NÃO são permitidas para um site público.
- [ ] Rotacionar qualquer chave de desenvolvimento anteriormente divulgada e confirmar que a chave atual é só backend.
- [ ] Testar 429 real e amostra parcial de modo controlado, sem estressar a API.

## QA e evidências adicionais
- Pipeline `ZeroTwo Visual QA`: fixtures, teclado e agora preferências de privacidade.
- Pipeline `ZeroTwo Live Account QA`: perfil, 100 partidas, colegas, browser desktop/mobile, recusa de exclusão sem autenticação.
- O gate global exige todas as aprovações externas; não é uma certificação Riot.

## Histórico anterior, mantido para referência
# ZeroTwo — Quality Gate (2026-10-09)

## Scope delivered in GitHub (main)

- Default public Riot lookup requests **20** matches, with an explicit button to expand the observed sample to **100**.
- Loading, insufficient data, rank/mastery API errors, and incomplete match history are distinguished rather than reported as an unranked player.
- Cached completed match records are reused and writes are executed per batch concurrently; uncached Riot calls are fetched in batches of three.
- Public teammate calls cap retries on HTTP 429, no longer recurse indefinitely, preserve more candidates from each batch, and report missing data separately from "no teammate".
- Public Riot ID search stays usable even when an authenticated account has not completed onboarding.
- Dedicated responsive UX for the extended-history control.
- GitHub Actions visual QA screenshots use **synthetic fixture data** (not live Riot) for 1440 × 900 and 390 × 844 and test
