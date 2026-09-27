# ZeroTwo.gg

> **You're 01. Find your 02.**

ZeroTwo.gg é uma plataforma de compatibilidade gamer, inicialmente focada em **League of Legends**, que usa perfil + sinais reais das partidas para encontrar um duo e, depois do match, aprender se a dupla realmente funciona.

**Produto:** 01 → Find Your 02 → jogar juntos → 02 Sync → algoritmo aprende → próximas recomendações melhoram.

A visão expandida está em [docs/PRODUCT.md](docs/PRODUCT.md).

---

## North Star de UX

### Resultado primeiro. Explicação depois.

O usuário não entra no ZeroTwo para configurar um sistema. Ele entra para **encontrar alguém compatível para jogar**.

O primeiro uso deve levar ao primeiro candidato com o mínimo possível de decisões:

**Landing → Google → Riot ID → processamento automático → primeiro 02**

### Regras de UX

- Nenhum clique deve existir apenas para fazer o sistema continuar.
- Se o próximo passo puder ser inferido, o ZeroTwo executa automaticamente.
- O primeiro resultado vem antes das configurações avançadas.
- Gaming DNA é recompensa e enriquecimento, não bloqueio.
- Detalhes técnicos aparecem sob demanda.
- Uma tela deve ter uma ação principal evidente.
- Dados com baixa amostra devem comunicar incerteza.
- Não apresentar heurísticas como precisão estatística.
- Perfil avançado é preenchido progressivamente depois do primeiro valor.

### Evento de ativação

**First 02:** primeiro candidato personalizado exibido ao usuário.

Meta inicial de produto: chegar ao First 02 na primeira sessão e reduzir continuamente o tempo e as ações necessárias para isso.

---

## Jornada alvo

### Novo usuário

1. Landing: **Encontrar meu 02**
2. Autenticação: **Continuar com Google**
3. Riot ID: informar `Nome#TAG`
4. ZeroTwo automaticamente:
   - localiza o jogador;
   - consulta dados Riot;
   - procura partidas válidas;
   - inicia/atualiza Gaming DNA;
   - procura candidatos com os sinais disponíveis.
5. Resultado: **Encontramos seu 02**
6. Decisões humanas:
   - **Tenho interesse**
   - **Mostrar outro 02**
   - **Por que combinamos?**
7. Após match: 02 Sync acompanha a dupla.

O usuário não deve precisar clicar separadamente em “Atualizar Riot”, “Analisar partidas” ou “Atualizar busca” durante o primeiro uso.

### Usuário recorrente

A Central deixa de ser checklist de configuração e passa a mostrar acontecimentos:

- seu 02 / matches;
- mudanças no Gaming DNA;
- novas partidas analisadas;
- evolução do 02 Sync;
- novos candidatos relevantes.

---

## Estado atual

### Feito — infraestrutura e produto

- [x] React + TypeScript + Vite.
- [x] Deploy automático no GitHub Pages.
- [x] Supabase Auth.
- [x] Login com Google.
- [x] Perfil ZeroTwo persistido no Supabase.
- [x] Riot ID informado como `Nome#TAG`; Riot não é usado como login.
- [x] Edge Function segura para Account-V1 + Summoner-V4.
- [x] Riot API key somente no backend.
- [x] Cache server-side inicial para consultas Riot.
- [x] Persistência de Riot ID, PUUID, servidor e Summoner Level.
- [x] Match-V5 integrado para análise de partidas.
- [x] Filtro de partidas válidas de Summoner's Rift.
- [x] Gaming DNA com métricas observáveis.
- [x] Confiança do DNA baseada no tamanho da amostra.
- [x] Explicações/evidências para a leitura do DNA.
- [x] Find Your 02 v1 com compatibilidade explicável.
- [x] Pool LAB com jogadores sintéticos para testes.
- [x] Interesse e match reais preparados para usuários UUID.
- [x] LAB Match para candidatos sintéticos.
- [x] Estrutura inicial de 02 Sync.
- [x] Player Client responsivo com Central, Find 02, DNA e Sync.

### Feito — validações reais

- [x] Riot ID real localizado pela API.
- [x] Summoner Level real carregado.
- [x] Partida válida de Summoner's Rift analisada.
- [x] Posição e campeão obtidos de partida real.
- [x] Gaming DNA inicial gerado com dados reais.
- [x] Find Your 02 retornando candidatos LAB.
- [x] Match LAB funcionando.

---

## Problemas UX encontrados

- [ ] Primeiro valor exige cliques demais.
- [ ] Central expõe funcionamento interno antes do resultado.
- [ ] Excesso de informação simultânea aumenta carga cognitiva.
- [ ] Ações operacionais como “Analisar partidas” e “Atualizar busca” exigem trabalho do usuário.
- [ ] Gaming DNA funciona visualmente como portão para Find 02.
- [ ] Configuração de perfil acontece cedo demais.
- [ ] Resultado do 02 compete visualmente com módulos técnicos.
- [ ] Scores heurísticos como `70/100` podem aparentar precisão maior do que a evidência permite.
- [ ] Estados como STANDBY, READY, 03/04 e telemetria têm peso excessivo para usuários novos.
- [ ] Detalhes do DNA são mostrados antes de o usuário demonstrar interesse neles.
- [ ] Alguns estados do frontend ainda podem ficar inconsistentes após atualização/deploy/cache.
- [ ] LAB Match ainda precisa ficar totalmente persistente e independente de localStorage.

---

# Plano de melhoria UX

## P0 — Retenção e First 02

Objetivo: **encurtar drasticamente o caminho até o primeiro candidato.**

- [ ] Redesenhar primeira viewport da landing em torno de **Encontrar seu 02**.
- [ ] Um único CTA dominante: **Encontrar meu 02**.
- [ ] Simplificar autenticação inicial; Google como caminho principal.
- [ ] Remover Riot como opção de login.
- [ ] Após login, pedir somente Riot ID quando ainda não existir.
- [ ] Remover nickname/preferências obrigatórias antes do primeiro resultado quando não forem tecnicamente necessárias.
- [ ] Criar pipeline automático após Riot ID:
  - [ ] localizar Riot ID;
  - [ ] atualizar dados do jogador;
  - [ ] analisar partidas;
  - [ ] atualizar DNA;
  - [ ] procurar 02.
- [ ] Criar tela única de processamento com progresso automático.
- [ ] Não bloquear Find 02 por baixa amostra de DNA.
- [ ] Usar perfil/Riot/sinais disponíveis enquanto DNA amadurece.
- [ ] Resultado do candidato deve substituir o dashboard como primeira recompensa.
- [ ] CTA principal do resultado: **Tenho interesse**.
- [ ] CTA secundário: **Mostrar outro 02**.
- [ ] Explicação: **Por que combinamos?** recolhida por padrão.
- [ ] Remover botões operacionais do critical path.
- [ ] Corrigir estados 03/04, READY/STANDBY e singular/plural.
- [ ] Persistir LAB Match no backend para testes consistentes.

### Critério de conclusão P0

Um usuário novo consegue ir de login + Riot ID até um candidato sem navegar manualmente por Central, Gaming DNA ou Find 02.

---

## P1 — Progressive disclosure e clareza

Objetivo: manter profundidade sem sobrecarregar o primeiro uso.

- [ ] Transformar Gaming DNA em descoberta secundária: **Veja o que descobrimos sobre seu jogo**.
- [ ] Exibir resumo do DNA primeiro.
- [ ] Colocar métricas avançadas em **Ver detalhes**.
- [ ] Colocar evidências em **Por que chegamos nisso?**.
- [ ] Trocar scores heurísticos públicos por faixas compreensíveis até existir calibração suficiente:
  - compatibilidade forte;
  - compatibilidade possível;
  - poucos sinais disponíveis.
- [ ] Mostrar quantidade de sinais usados.
- [ ] Comunicar DNA de baixa amostra como **Ainda estamos conhecendo seu jogo**.
- [ ] Progressive profiling: pedir horário, intenção e preferências quando elas puderem melhorar um resultado já apresentado.
- [ ] Redesenhar Central para usuário recorrente.
- [ ] Reduzir quantidade de HUD/status técnico visível simultaneamente.
- [ ] Tornar a navegação mobile orientada às tarefas principais.
- [ ] Criar empty states que levem diretamente à próxima ação útil.

---

## P1 — Find Your 02 v2

- [ ] Corrigir complementaridade de posições.
- [ ] Usar Gaming DNA quando disponível sem torná-lo obrigatório.
- [ ] Separar claramente sinais fortes, fracos e ausentes.
- [ ] Não tratar mesmo servidor como evidência de sinergia comportamental; é filtro/compatibilidade operacional.
- [ ] Adicionar preferências progressivamente.
- [ ] Adicionar controle **Pausar busca / Estou procurando 02**.
- [ ] Melhorar tratamento de candidatos esgotados/ignorados.
- [ ] LAB fallback também quando candidatos reais forem filtrados e o resultado final ficar vazio.

---

## P2 — 02 Sync real

Objetivo: validar o diferencial central do ZeroTwo.

- [ ] Detectar partidas contendo os PUUIDs de 01 e 02.
- [ ] Identificar partidas realmente jogadas juntos.
- [ ] Registrar histórico compartilhado.
- [ ] Calcular vitórias/derrotas juntos.
- [ ] Definir métricas de dupla.
- [ ] Definir confiança mínima antes de interpretar sinergia.
- [ ] Evitar conclusões com amostra insuficiente.
- [ ] Atualizar Sync automaticamente.
- [ ] Mostrar mudança da hipótese inicial após partidas reais.
- [ ] Alimentar futuras recomendações com resultados observados.

---

## P2 — Qualidade do Gaming DNA

- [ ] Corrigir/validar cache de `lol_match_cache`.
- [ ] Registrar erros de cache em vez de falhar silenciosamente.
- [ ] Tratar rate limits Riot com retry/backoff apropriado.
- [ ] Diferenciar 404 de falhas temporárias.
- [ ] Invalidar snapshots antigos gerados por algoritmos incompatíveis.
- [ ] Adicionar versão do algoritmo ao snapshot.
- [ ] Normalizar métricas por posição quando houver amostra suficiente.
- [ ] Estudar normalização por champion/rank/patch sem criar falsa precisão.
- [ ] Melhorar tratamento de zero deaths no KDA.
- [ ] Atualização incremental em vez de reprocessamento desnecessário.

---

## P2 — Retenção

- [ ] Depois de novas partidas: **Seu Gaming DNA mudou**.
- [ ] Depois de match: **Jogue com seu 02 para começar o Sync**.
- [ ] Depois de partida conjunta: **02 Sync atualizado**.
- [ ] Recomendações novas quando o DNA mudar significativamente.
- [ ] 02 Streak.
- [ ] Evolução do jogador.
- [ ] Descobertas contextuais.
- [ ] ZeroTwo Wrapped futuro.

---

## Analytics obrigatório

Antes de otimizar retenção, medir o funil real.

Eventos mínimos:

- [ ] `landing_view`
- [ ] `find_02_cta_clicked`
- [ ] `auth_started`
- [ ] `auth_completed`
- [ ] `riot_id_started`
- [ ] `riot_id_submitted`
- [ ] `riot_player_found`
- [ ] `dna_started`
- [ ] `dna_ready`
- [ ] `first_02_shown`
- [ ] `candidate_details_opened`
- [ ] `candidate_skipped`
- [ ] `candidate_interested`
- [ ] `02_match_created`
- [ ] `sync_opened`
- [ ] `first_shared_match_found`

Métricas principais:

- **Activation rate:** % que chega a `first_02_shown`.
- **Time to First 02:** tempo entre entrada/login e primeiro candidato.
- **Actions to First 02:** ações conscientes até primeiro candidato.
- Drop-off por etapa.
- Riot ID success rate.
- First 02 → interesse.
- Interesse → match.
- Match → retorno.
- Match → primeira partida conjunta.
- D1 / D7 / D30 retention.

Não assumir metas como benchmarks de mercado. Criar baseline com usuários reais e melhorar por experimento.

---

## Experimentos UX

Depois da instrumentação:

- [ ] Landing atual vs. hero focado somente em **Encontre seu 02**.
- [ ] Cadastro antes do Riot ID vs. Riot ID antes do cadastro, se tecnicamente/politicamente viável.
- [ ] Score numérico vs. compatibilidade qualitativa.
- [ ] Resultado direto vs. Central após onboarding.
- [ ] DNA resumido vs. DNA completo.
- [ ] Uma recomendação por vez vs. grid de candidatos.
- [ ] CTA **Tenho interesse** vs. **Quero jogar com este 02**.

Alterar uma hipótese relevante por experimento e medir ativação + retenção, não apenas CTR.

---

## Roadmap de execução

### Agora

**P0 UX → First 02 automático → analytics → medir funil.**

### Depois

**Progressive disclosure → Find 02 v2 → 02 Sync real.**

### Em seguida

**DNA avançado → aprendizado de dupla → retenção → VALORANT.**

Não aumentar a quantidade de funcionalidades visíveis antes de validar que novos usuários chegam rapidamente ao First 02.

---

## Segurança

- Riot API key somente no backend.
- Supabase service role somente no backend.
- Publishable key pode ser usado pelo cliente conforme políticas/RLS.
- Nunca persistir tokens OAuth em logs.
- Dados LAB devem permanecer separados de dados reais.
- Não representar jogadores sintéticos como pessoas reais.

---

## Desenvolvimento

```bash
npm install
npm run dev
npm run build
```

Pushes em `main` disparam o workflow de GitHub Pages.

## Disclaimer

ZeroTwo.gg é independente e não é endossado pela Riot Games. League of Legends, VALORANT e Riot Games são marcas de seus respectivos proprietários.
