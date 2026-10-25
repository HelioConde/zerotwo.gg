<div align="center">

<h1>🌌 ZeroTwo.gg</h1>

<strong>Your Riot life, interpreted.</strong>

<p>Uma experiência visual para descobrir, entender e compartilhar sua história em League of Legends.</p>

<a href="https://github.com/HelioConde/zerotwo.gg"><img alt="Riot Life" src="https://img.shields.io/badge/PRODUTO-RIOT%20LIFE-4338ca?style=for-the-badge"></a>

<p><a href="docs/PRODUCT.md"><strong>Visão de produto</strong></a> · <a href="#como-executar"><strong>Desenvolvimento</strong></a> · <a href="#limites-e-escopo"><strong>Escopo atual</strong></a></p>

</div>

---

## Uma forma diferente de olhar suas partidas

**ZeroTwo.gg** explora a trajetória de um jogador a partir de dados permitidos pela Riot. A intenção é ir além de uma página de estatísticas: mostrar identidade, sessões, padrões e momentos que fazem sentido na história pessoal de cada conta.

A versão pública documentada está focada em **League of Legends**. Funcionalidades relacionadas a VALORANT e experimentos sociais podem existir no código, mas **não fazem parte do escopo público atual**.

## Como a experiência se organiza

| Área | Pergunta respondida |
| --- | --- |
| **Riot Passport** | Quem é este jogador? |
| **Riot Life** | O que define sua trajetória recente? |
| **Session Lab** | Como foi uma sessão inteira, além de uma partida isolada? |
| **Personal Meta** | O que aparece nos resultados desse jogador específico? |
| **Time Machine** | O que mudou entre períodos observados? |
| **Match Story** | Qual é a história de uma partida? |

O produto prioriza **evidência antes de narrativa**: não deve inventar resultados, atribuir causas sem base, inferir MMR oculto ou fingir um histórico que não foi fornecido.

## Experiência e princípios

1. **Primeiro valor rapidamente:** Riot ID deve levar a conteúdo útil sem excesso de telas.
2. **Progressive disclosure:** mostrar a leitura principal antes das estatísticas detalhadas.
3. **Contexto e transparência:** distinguir dado real, amostra limitada e informação demonstrativa.
4. **Compatibilidade mobile:** a experiência deve funcionar em telas pequenas.
5. **Privacidade:** não expor chaves privadas ou dados de terceiros sem permissão.

## Como executar

A aplicação utiliza **React, TypeScript e Vite**, com integrações Supabase e API Riot conforme o backend configurado.

```bash
git clone https://github.com/HelioConde/zerotwo.gg.git
cd zerotwo.gg
npm install
npm run dev
```

Para validar e compilar:

```bash
npm run typecheck
npm run build
npm run audit:seo
```

Os scripts de build também executam tarefas próprias de geração e otimização de recursos. Integrações com dados reais dependem do ambiente Supabase configurado.

## Limites e escopo

- A experiência pública atual é **LoL-first**; VALORANT não está sendo anunciado como recurso pronto.
- Dados Riot dependem de permissões, APIs, rate limit e cobertura da amostra.
- Algumas funcionalidades sociais e módulos históricos são experimentais.
- Estatísticas pessoais não demonstram causalidade nem garantem desempenho futuro.
- Lançamento e monetização precisam respeitar políticas de desenvolvedores e direitos da Riot.

## Documentação complementar

- [Direção oficial do produto](docs/PRODUCT.md)
- [Documentação extensa e decisões anteriores](docs/README_HISTORY_2026-10-25.md)

---

<div align="center"><strong>Criado por <a href="https://github.com/HelioConde">Hélio Conde</a></strong></div>
