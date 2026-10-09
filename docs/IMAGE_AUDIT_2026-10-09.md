# ZeroTwo — revisão visual e inventário de imagens (09/10/2026)

## Objetivo
Preservar o caráter cinematográfico do ZeroTwo sem comprometer leitura, navegação e desempenho. O inventário abrange **todas as imagens do repositório** e distingue material publicável de intermediários de produção.

## Levantamento inicial
- **939 imagens** no repositório antes da reorganização, somando aproximadamente **338,6 MB**.
- **734 PNGs** em `public/assets/zerotwo/output-v2`: recortes e fragmentos produzidos durante processamento de artes.
- **115 arquivos de revisão** em `public/assets/zerotwo/review` (95 PNGs + 20 JSONs): máscaras, regiões e capturas para inspeção.
- Esses dois conjuntos são **849 arquivos (~205,4 MB)**, não referenciados pelo frontend ativo.
- As artes finais, os ícones SVG e as três novas imagens WebP continuam publicadas.

### Organização após auditoria

| Local | Tipo | Publicado pelo Vite? |
|---|---|---|
| `public/assets/zerotwo/` | Artes finais, cenários, ícones e referências exigidas pelos SVGs | Sim |
| `public/empty-state.webp` | Estado sem dados | Sim |
| `public/connection-error.webp` | Falha temporária de consulta | Sim |
| `public/match-story-background.webp` | Cartão de compartilhamento 9:16 | Sim |
| `design-archive/zerotwo/output-v2/` | 734 recortes de produção | Não |
| `design-archive/zerotwo/review/` | 95 PNGs de debug e 20 JSONs | Não |

O arquivo original não é descartado: continua versionado no mesmo GitHub, mas fora de `public` para não inflar o pacote de publicação. O histórico Git também o preserva.

## Auditoria visual — desktop (1440 × 900) e celular (390 × 844)

**Fontes:** capturas `desktop-home`, `mobile-home`, `*-profile-fixture-100` e capítulos do workflow `ZeroTwo Visual QA`. As capturas de perfil usam **dados sintéticos** para testar a interface; não são prova de que a API Riot esteja disponível.

### Problemas encontrados
1. A home apresenta uma hero cinematográfica clara, mas **as artes das seções 02 e 03 ficam visualmente apagadas** por overlays muito fortes e opacidade baixa.
2. As screenshots de página inteira eram tiradas **sem percorrer as imagens `loading=lazy`**, fazendo os blocos de baixo parecerem vazios embora houvesse arte cadastrada.
3. Capítulos analíticos alternavam entre muita imagem e seções quase sem contraste; o gradiente cobria detalhes nas artes da direita.
4. Alguns textos descritivos ficavam excessivamente pequenos nas superfícies escuras.
5. Os nomes de arte estavam distribuídos em vários componentes e alguns caminhos usavam o prefixo GitHub Pages fixo.

### Mudanças aplicadas
- Nova camada final de CSS (`src/visual-media-2026-10-09.css`) com composições mais claras nas imagens da **home 01/02/03**, gradientes conservadores sobre texto e enquadramento específico para mobile.
- Maior contraste dos detalhes do lado direito nos capítulos `riotDeepChapter`, `riotChapterGroup`, maestria e contexto, sem eliminar o sombreado necessário à leitura.
- Tipografia secundária revisada para tamanho e contraste melhores.
- Rotas de assets centralizadas em `src/lib/visualAssets.ts`, respeitando `import.meta.env.BASE_URL`.
- QA visual atualizado para **percorrer e decodificar as quatro artes da home antes das capturas**, preservando o lazy loading real.
- Auditoria automática `npm run audit:images`: verifica imagens críticas, referências estáticas, assinaturas WebP e separação do arquivo histórico, com bloqueio do build em caso de referência quebrada.

## Próxima etapa recomendada: compressão de artes finais

Ainda existem PNGs originais grandes nas artes finais (frequentemente acima de 2 MB). O próximo ganho será produzir variantes WebP/AVIF dos **arquivos finais realmente usados**, preservando os PNGs originais no acervo e atualizando os caminhos somente após validar a qualidade. Não converter os 734 fragmentos arquivados indiscriminadamente e não substituir o material final por imagens genéricas.

### Diretrizes permanentes
- Evitar backgrounds diferentes concorrendo na mesma seção (imagem DOM + outra imagem CSS).
- Hero: destaque visual à direita/laterais, área de texto protegida por gradiente.
- Histórias e métricas: imagem decorativa, nunca competindo com números e dados.
- Mobile: preservar área artística no topo e gradiente robusto na metade inferior.
- Imagens abaixo da dobra: `loading="lazy"` e `decoding="async"` sempre que possível.
- Nunca mover, eliminar ou renomear um asset referenciado sem atualizar todos os consumidores e passar pela auditoria.
- Capturas da QA precisam representar imagens carregadas, não placeholders causados por `loading=lazy`.

## Gates de publicação
1. `npm run audit:images`
2. `npm run typecheck`
3. `npm run build`
4. Visual QA desktop / laptop / mobile com checagem de imagens reais e captura de perfil
5. Publicação do GitHub Pages após os jobs passarem
