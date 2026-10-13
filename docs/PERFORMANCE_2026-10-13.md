# ZeroTwo — monitoramento de desempenho (13/10/2026)

## Dois tipos diferentes de verificação

**Bundle budgets (bloqueia deploy):** depois do Vite build e da remoção dos PNGs redundantes, o Pages usa \`npm run audit:bundle\` para conferir \`dist/\`: JavaScript até 1,20 MB, CSS até 0,70 MB, WebP até 30 MB, todos os arquivos até 42 MB (tamanhos descompactados). Se os limites forem ultrapassados, o build falha e impede regressões grandes.

**Lighthouse (observa e avisa):** \`.github/workflows/performance-audit.yml\` mede a homepage *publicada* após sucesso do Pages; também pode rodar manualmente. O job coleta versões simuladas de celular e desktop e salva HTML, JSON e resumo na aba Actions. Pontuações abaixo de 90 geram avisos, sem bloquear a publicação até definirmos uma linha de base confiável.

O relatório inclui Performance, Acessibilidade, Boas Práticas, SEO, LCP, CLS e TBT, além de oportunidades de otimização. Essas são medições de laboratório, não p75 de usuários reais. **O Lighthouse não mede INP de campo**. Core Web Vitals reais dependem de dados suficientes de visitantes (por exemplo CrUX), não devem ser inventados.

## Pendências
- Conferir repetidas execuções e priorizar gargalos realmente recorrentes (especialmente CSS e JS).
- Medir Core Web Vitals de campo quando houver tráfego suficiente, sem coleta opcional sem consentimento.
- Validar exclusão de snapshots autenticada apenas com conta descartável.
- Confirmar autorização de produção no Riot Developer Portal, separada do sucesso técnico da API.
