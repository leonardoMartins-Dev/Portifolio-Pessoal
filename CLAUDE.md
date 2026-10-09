# CLAUDE.md

Portfólio interativo "Portifólio" (DIAW, PUC Minas). **A fonte de verdade é [`docs/PROJETO.md`](docs/PROJETO.md)** — leia a nota de revisão no topo: a stack mudou para **React + Vite em JavaScript** (sem TypeScript, sem Next.js).

## Comandos

```bash
npm run dev           # front + funções de api/ (http://localhost:5173), lê .env.local
npm run lint          # ESLint (inclui regras do React Compiler)
npm run format        # Prettier (escreve); format:check só confere
npm test              # Vitest (tests/unit)
npm run test:e2e      # Playwright (tests/e2e; faz o build antes)
npm run build         # build de produção (dist/)
npm run screenshots   # prints do README, imagem OG e o quarto estático (public/images/room.webp); com o dev rodando, GPU=1 usa a placa de vídeo
npm run figma         # protótipo no Figma: captura as telas (com o dev rodando) e gera o plugin em scripts/figma/plugin/
```

Antes de dar algo por pronto: `lint`, `format:check`, `test`, `build` e `test:e2e` passando.

## Arquitetura em uma linha por pasta

- `src/content/` — dados do autor (PT/EN): perfil, projetos, experiências, skills e certificados (arquivos em `public/certificates/`). Única fonte para apps, Terminal e prompt do assistente.
- `src/lib/apps-meta.js` — registro dos apps (dados puros, lido também no servidor); `apps.jsx` adiciona ícones e componentes lazy.
- `src/lib/os-store.js` — Zustand: fase (intro = página inicial/boot/lock/desktop), janelas, foco, app pendente do desbloqueio, preferências (persistidas). A fase atual vai para a sessão (`rememberPhase` em `lib/boot.js`, chamado no `OS.jsx`): o F5 volta à página inicial ou ao sistema, onde o visitante estava.
- `src/lib/os-bridge.js` — navegação fora do React (assistente, Terminal) e `returnToLanding()` (volta à página inicial saindo da tela do PC: menu do logo, Ajustes e a barra de cima do celular). **A URL é o comando**: `/{locale}/{appId}` abre o app.
- `src/components/os/` — shell desktop (`DesktopShell`, `useUrlSync`), mobile (`MobileShell`) e `LockScreen` (o shell fica montado por baixo, com `inert`).
- `src/components/landing/` — página inicial (referência: david-hckh.com), carregada sob demanda: topo com o quarto 3D, Sobre (holograma), Skills (o `SkillsGlobe` do app) e Contato. Clicar no PC → zoom até a tela (que já mostra a tela de bloqueio) → `onDone(appId?)`. O 3D fica em `three/`: `Character.jsx` (o boneco do autor, feito a partir da foto: cabelo cacheado, óculos; poses `sit`/`sitWave`/`stand`/`wave`) com aparência e medidas em `character-look.js`; `room/` com um arquivo por objeto e `room/layout.js` (posições, enquadramento e a pose da tela); `RoomCanvas.jsx` (GSAP: chegada, zoom, saída do "Desligar"); `FigureCanvas.jsx` (holograma e aceno). Direção visual **"massinha"**: tudo em código, materiais foscos (`clay()` em `three/materials.js`), paleta quente, sem modelos nem HDRIs. Sem WebGL, o quarto vira `public/images/room.webp` (gerado pelo `npm run screenshots`).
- `scripts/figma/` — protótipo no Figma tirado do site: `capture.mjs` serializa cada tela e `plugin-main.js` (sem `?.`/`??`, para o ambiente de plugins) recria as camadas e os links. Tela nova: adicione em `screenList()`; link novo: em `markLinks()`.
- `api/*.js` — Vercel Functions (handlers Web `GET`/`POST`): `chat`, `spotify`, `wakatime`, `github`. `server/` — código só do servidor.

## Convenções

- Código e identificadores em inglês. Comentários, README e commits em português (Conventional Commits).
- Nenhum texto de UI fixo: mensagens em `src/i18n/messages/{pt,en}.json` (teste de paridade exige as mesmas chaves e variáveis). Conteúdo usa objetos `{ pt, en }`.
- Dados do autor só em `src/site.config.js` e `src/content/`. Nunca invente dados pessoais: placeholders com `TODO(conteúdo)`.
- Texto na cor de destaque usa `text-accent-ink` (contraste AA); `bg-accent` para fundos.
- Página inicial: cores pelos tokens `land-*` (`bg-land-bg`, `text-land-ink`, `text-land-muted`…, com versão escura) dentro de `.landing`, e títulos com `font-display` (Outfit). Cena 3D nova ou pesada dentro dela vai em `LazyScene` (monta perto da tela, pausa fora dela, tem substituto sem WebGL).
- Projetos: a lista em `src/content/projects.js` fica em ordem cronológica (desempata projetos do mesmo mês). O app abre do mais recente e inverte com "Mais antigos" (a ordem do enunciado); `sortProjects` em `src/lib/timeline.js`.
- Demo em hospedagem que dorme (plano gratuito): `wakeUrl` no projeto (`src/content/projects.js`); o app Projetos acorda o servidor ao abrir (`src/lib/wake.js`).
- Dentro de janela, layout que depende da largura usa container query (`@container` + `@md:`), não breakpoint da tela: a janela é redimensionável.
- Ícones de skills ficam em `public/skills/` no formato do skillicons.dev (bloco 256×256, `rx=60`): `{icon}.svg`, ou `{icon}-light.svg` + `{icon}-dark.svg` com `themed: true` em `src/content/skills.js`. O globo do app Skills usa o logo solto: ao criar uma skill com ícone, adicione o logo e a cor dela em `BRANDS` (`src/components/apps/SkillsGlobe.jsx`); sem isso, o globo mostra o bloco do skillicons.
- Lint segue as regras do React Compiler: nada de `setState` síncrono em efeito, nem mutar props/retornos de hooks (refs passados como prop terminam em `Ref`).

## Regras

- Segredos só no servidor (`api/`, `server/`). Nunca `VITE_` em chave secreta. Nunca commitar `.env*` (exceto `.env.example`).
- Toda integração sem variável configurada degrada com elegância (estado vazio), sem quebrar o build.
- Sem marcas de terceiros (Apple, macOS etc.) na identidade do sistema. Exceção decidida pelo autor: a decoração pessoal do quarto 3D (escudo do Atlético, boneco do Luffy).
- Dependências enxutas: justifique cada nova e atualize a tabela de dependências do README.
- Acessibilidade e `prefers-reduced-motion` sempre.
- Mantenha este arquivo atualizado quando surgir uma convenção nova.

## Notas da stack (conferidas em out/2026)

- **AI SDK 7**: exige Node 22+; `instructions` (não `system`); resposta com `createUIMessageStreamResponse({ stream: toUIMessageStream({ stream: result.stream }) })`; no cliente, `Chat` + `useChat({ chat })`, `addToolOutput`, `sendAutomaticallyWhen`. Docs no pacote: `node_modules/ai/docs/`.
- **Gemini** (`@ai-sdk/google`, plano gratuito): chave em `GOOGLE_GENERATIVE_AI_API_KEY`, modelo padrão `gemini-3.5-flash-lite`. O raciocínio conta no limite de 500 tokens: `thinkingLevel: 'minimal'` (Flash 3.7+ só aceita a partir de `low`); nos Gemini 3+ a temperatura fica no padrão. As ferramentas rodam no navegador, então a `thoughtSignature` vai e volta em `callProviderMetadata` — o validador do chat não pode descartá-la (há teste).
- **React Router 8** em modo declarativo (`BrowserRouter`, `Routes`). Docs no pacote: `node_modules/react-router/docs/`.
- **Vite 8 (Rolldown)**: opção de chunks é `codeSplitting` (não `manualChunks`). Variáveis do servidor em dev vêm do `loadEnv` no `vite.config.js`.
- **Tailwind 4**: configuração no CSS (`src/styles/globals.css`, `@theme`), tema por `data-theme` no `<html>`.
- **Testes**: o jsdom não tem `matchMedia`, `scrollIntoView` (stubs em `tests/setup.js`), `IntersectionObserver` nem WebGL — sem eles, a página inicial conta tudo como visível e usa os substitutos do 3D. O e2e usa WebGL por software (SwiftShader) e 2 workers; o quarto 3D é lento assim, então só os testes da página inicial passam por ela (`skipIntro`, que clica em "Clique no PC", + `test.slow()`) e os demais entram com `enterSystem` (sessão já vista) ou deep link.
- **three r186 / R3F 9**: `PCFSoftShadowMap` foi removido — use `shadows="percentage"` no `Canvas` e `shadow-radius` na luz para a sombra suave. Evite `RectAreaLight` (a tabela dela soma ~315 KB ao chunk). Tone mapping pelo `gl={{ toneMapping: NeutralToneMapping }}` (o R3F respeita): mantém o pastel da cena, e a tela do monitor usa `MeshBasicMaterial` com `toneMapped: false` para bater com a tela de bloqueio em HTML. Canvas com `alpha`: o fundo é o da página, e chão/parede são `shadowMaterial` (só a sombra aparece). Sem pós-processamento.
- **`PerformanceMonitor` (drei)**: `flipflops`/`onFallback` contam toda avaliação, inclusive as subidas. Use só `onDecline` com `bounds` (baixa a resolução), e meça só com a cena parada (`stage === 'idle'`).
- **Zoom até a tela**: a vista geral desloca o quarto com `camera.setViewOffset` (à direita do nome no computador, embaixo no celular); no zoom o deslocamento vai a zero e a distância final vem de `coverDistance` (a tela cobre o viewport). A tela do monitor é 16:10 como a textura (`screen-texture.js`, há teste).
- **React Compiler × three**: criar materiais/objetos com funções declaradas fora do componente; o que muda a cada quadro (planos de corte, uniforms) é alterado só dentro de `useFrame` via `ref.current` (ex.: `kitRef` em `FigureCanvas.jsx`), nunca por atribuição direta ao valor de um hook. Arquivo `.jsx` só exporta componentes (constantes e funções compartilhadas vão num `.js` ao lado, como `character-look.js`).
