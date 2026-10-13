# ZeroTwo — Design System e Quality Gate (13/10/2026)

## Identidade visual
O ZeroTwo prioriza uma história cinematográfica, com imagens à direita e blocos de texto protegidos por gradientes à esquerda. Não esticar ilustrações, não incorporar texto às imagens e não esconder conteúdo atrás de arte. Manter a identidade rosa, ciano e azul sobre superfícies escuras.

## Tokens de interface
- \`--zt-surface\` (#101621): fundo; \`--zt-raised\` (#18202e): card; \`--zt-border\`: borda de cards.
- \`--zt-text\` (#f7f9ff): texto primário; \`--zt-muted\` (#bfccdf): texto secundário.
- \`--zt-accent\` (#ff6698): destaque; \`--zt-focus\` (#8bdeff): foco visível; \`--zt-radius\` (14px): cantos.
- Fonte funcional system-ui; escala sugerida 12/14/16/20/28/40/56 px; espaçamento 4/8/12/16/24/32/48 px.
- Controles com alvo de pelo menos 44 px, corpo descritivo mínimo de 14 px e contraste adequado contra fundo.

## Componentes e navegação
- Pesquisa é um formulário com landmark search: Enter envia; validação expõe erro e \`aria-invalid\`.
- Cabeçalho global tem label acessível e link de salto antes da navegação.
- Login dialog tem Escape, ciclo de Tab dentro da janela e retorno do foco ao controle anterior.
- Perfil preserva atalhos Histórias/Partidas/Campeões/DNA; opções de leitura usam \`aria-pressed\` e capítulos usam foco e rolagem compensada por barra sticky.
- Preferências de movimento reduzido respeitadas.

## Image to Code
Traduzir referências visuais e assets presentes em \`src/lib/visualAssets.ts\` em componentes HTML/React e CSS. Manter img com proporção original, posição focal, contraste com gradientes e conteúdo DOM legível. Testar carregamento real (200 + naturalWidth), alinhamento das ilustrações, captions e ausência de overflow horizontal, também no mobile. CSS final: \`src/design-foundations-2026-10-13.css\` aplicado após os demais.

## Testes automatizados
\`scripts/visual-qa.mjs\` usa **Playwright API** no GitHub Actions, não o executável Playwright CLI. Possui fixture **sintética** para testes desktop/laptop/mobile, screenshots, imagens, modos de leitura e expansão 20→100. Esta rodada acrescenta testes de Enter, erro acessível, foco e Escape do login. Evidências no artifact \`zerotwo-visual-qa\` do workflow \`ZeroTwo Visual QA\`.

Não considerar os testes sintéticos como comprovação de funcionamento da API Riot nem aprovação visual automática. Revisar capturas geradas e as pendências em \`docs/QUALITY_GATE_2026-10-09.md\`, incluindo o deploy Supabase e histórico real de 100 partidas.
