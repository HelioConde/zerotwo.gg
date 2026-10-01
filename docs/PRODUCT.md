# ZeroTwo.gg — Product Vision

## Tese
**Your Riot life, interpreted.**

ZeroTwo transforma dados permitidos da Riot em uma experiência narrativa e pessoal. O produto deve fazer o jogador descobrir algo interessante sobre si mesmo antes de pedir cadastro, assinatura ou interação social.

## North Star

**Riot ID / RSO → descoberta pessoal → exploração → retorno para ver o que mudou.**

A primeira recompensa não é um match com outra pessoa. É uma informação pessoal que gere curiosidade: uma sessão incomum, uma mudança de foco, um personagem que voltou, uma evolução observável ou uma partida que merece ser lembrada.

## Roadmap vivo

1. **Riot Passport** — identidade Riot resumida sem reduzir o jogador a rank.
2. **Session Lab** — reconstruir sessões e comparar começo/fim usando evidência observável.
3. **Personal Meta** — destacar o que funcionou para o próprio jogador dentro da amostra.
4. **Match Story** — transformar uma partida em narrativa baseada somente em dados presentes.
5. **Time Machine** — snapshots entre visitas + comparação de períodos reais.
6. **My Riot Patch** — cruzar patch oficial com campeões, agentes e itens realmente usados.
7. **Champion / Agent Career** — linha do tempo por personagem.
8. **Returning Player** — mostrar o que mudou desde a última atividade observada.
9. **Riot Challenges Arcade** — miniexperiências e quizzes gerados pelo próprio histórico.
10. **Riot Universe Dashboard** — uma Home para múltiplos jogos Riot conectados.
11. **Riot Wrapped permanente** — retrospectivas que não dependem do fim do ano.
12. **Share Cards** — histórias e descobertas exportáveis/compartilháveis.

## O que não é mais a definição do produto

Find Your 02, 02 Sync, matching e relacionamento podem permanecer como experimentos opcionais. Eles não devem determinar a Home, a marca ou a arquitetura principal.

## Regras de evidência

- Evidência antes de afirmação.
- Correlação não é causalidade.
- Comparações devem mostrar tamanho da amostra.
- Não criar MMR/ELO alternativo.
- Não chamar uma tendência curta de verdade permanente.
- Não inventar timeline que a API não forneceu.
- Impacto de patch só aparece quando houver fonte oficial estruturada.
- VALORANT continua opt-in e limitado aos dados aprovados.
- Sem scouting proibido ou vantagem injusta em tempo real.
- IA pode resumir e explicar; métricas determinísticas calculam.

## Estado da implementação — Riot Life v0

Implementado no perfil público de League:
- Riot Passport;
- Session Lab;
- Personal Meta;
- Time Machine da amostra;
- snapshots locais para Time Machine entre visitas;
- Match Story da última partida;
- espaço preparado para My Riot Patch, sem dados inventados.

Próximas fontes:
1. patch data oficial/estruturado;
2. snapshots persistentes no backend para usuários autenticados;
3. Champion Career;
4. Riot Universe com outras integrações autorizadas.
