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
npm run screenshots   # prints do README + imagem OG (com o dev rodando; GPU=1 usa a placa de vídeo)
npm run models        # baixa e prepara os modelos 3D e as HDRIs da intro (Poly Haven → public/models/, public/hdri/)
```

Antes de dar algo por pronto: `lint`, `format:check`, `test`, `build` e `test:e2e` passando.

## Arquitetura em uma linha por pasta

- `src/content/` — dados do autor (PT/EN): perfil, projetos, experiências, skills e certificados (arquivos em `public/certificates/`). Única fonte para apps, Terminal e prompt do assistente.
- `src/lib/apps-meta.js` — registro dos apps (dados puros, lido também no servidor); `apps.jsx` adiciona ícones e componentes lazy.
- `src/lib/os-store.js` — Zustand: fase (intro/boot/lock/desktop/off), janelas, foco, app pendente do desbloqueio, preferências (persistidas).
- `src/lib/os-bridge.js` — navegação fora do React (assistente, Terminal). **A URL é o comando**: `/{locale}/{appId}` abre o app.
- `src/components/os/` — shell desktop (`DesktopShell`, `useUrlSync`), mobile (`MobileShell`) e `LockScreen` (o shell fica montado por baixo, com `inert`).
- `src/components/intro/` — mesa 3D (R3F + GSAP), carregada sob demanda: `desk/` tem um arquivo por objeto, `desk/layout.js` as posições e `desk-objects.js` os atalhos objeto → app. Modelos e HDRIs do Poly Haven em `public/models/` e `public/hdri/` (orçamento de 3 MB para modelos + uma HDRI, com teste). Direção visual **realista**: material e luz de verdade em tudo, paleta quente; o Luffy fica em `desk/Luffy.jsx` (medidas em larguras de cabeça).
- `api/*.js` — Vercel Functions (handlers Web `GET`/`POST`): `chat`, `spotify`, `wakatime`, `github`. `server/` — código só do servidor.

## Convenções

- Código e identificadores em inglês. Comentários, README e commits em português (Conventional Commits).
- Nenhum texto de UI fixo: mensagens em `src/i18n/messages/{pt,en}.json` (teste de paridade exige as mesmas chaves e variáveis). Conteúdo usa objetos `{ pt, en }`.
- Dados do autor só em `src/site.config.js` e `src/content/`. Nunca invente dados pessoais: placeholders com `TODO(conteúdo)`.
- Texto na cor de destaque usa `text-accent-ink` (contraste AA); `bg-accent` para fundos.
- Projetos: a lista em `src/content/projects.js` fica em ordem cronológica (desempata projetos do mesmo mês). O app abre do mais recente e inverte com "Mais antigos" (a ordem do enunciado); `sortProjects` em `src/lib/timeline.js`.
- Demo em hospedagem que dorme (plano gratuito): `wakeUrl` no projeto (`src/content/projects.js`); o app Projetos acorda o servidor ao abrir (`src/lib/wake.js`).
- Dentro de janela, layout que depende da largura usa container query (`@container` + `@md:`), não breakpoint da tela: a janela é redimensionável.
- Ícones de skills ficam em `public/skills/` no formato do skillicons.dev (bloco 256×256, `rx=60`): `{icon}.svg`, ou `{icon}-light.svg` + `{icon}-dark.svg` com `themed: true` em `src/content/skills.js`.
- Lint segue as regras do React Compiler: nada de `setState` síncrono em efeito, nem mutar props/retornos de hooks (refs passados como prop terminam em `Ref`).

## Regras

- Segredos só no servidor (`api/`, `server/`). Nunca `VITE_` em chave secreta. Nunca commitar `.env*` (exceto `.env.example`).
- Toda integração sem variável configurada degrada com elegância (estado vazio), sem quebrar o build.
- Sem marcas de terceiros (Apple, macOS etc.) na identidade do sistema. Exceção decidida pelo autor: a decoração pessoal da mesa 3D (escudo do Atlético, boneco do Luffy).
- Dependências enxutas: justifique cada nova e atualize a tabela de dependências do README.
- Acessibilidade e `prefers-reduced-motion` sempre.
- Mantenha este arquivo atualizado quando surgir uma convenção nova.

## Notas da stack (conferidas em out/2026)

- **AI SDK 7**: exige Node 22+; `instructions` (não `system`); resposta com `createUIMessageStreamResponse({ stream: toUIMessageStream({ stream: result.stream }) })`; no cliente, `Chat` + `useChat({ chat })`, `addToolOutput`, `sendAutomaticallyWhen`. Docs no pacote: `node_modules/ai/docs/`.
- **Gemini** (`@ai-sdk/google`, plano gratuito): chave em `GOOGLE_GENERATIVE_AI_API_KEY`, modelo padrão `gemini-3.5-flash-lite`. O raciocínio conta no limite de 500 tokens: `thinkingLevel: 'minimal'` (Flash 3.7+ só aceita a partir de `low`); nos Gemini 3+ a temperatura fica no padrão. As ferramentas rodam no navegador, então a `thoughtSignature` vai e volta em `callProviderMetadata` — o validador do chat não pode descartá-la (há teste).
- **React Router 8** em modo declarativo (`BrowserRouter`, `Routes`). Docs no pacote: `node_modules/react-router/docs/`.
- **Vite 8 (Rolldown)**: opção de chunks é `codeSplitting` (não `manualChunks`). Variáveis do servidor em dev vêm do `loadEnv` no `vite.config.js`.
- **Tailwind 4**: configuração no CSS (`src/styles/globals.css`, `@theme`), tema por `data-theme` no `<html>`.
- **Testes**: o jsdom não tem `matchMedia` nem `scrollIntoView` (stubs em `tests/setup.js`). O e2e usa WebGL por software (SwiftShader) e 2 workers; a mesa 3D é lenta assim, então só os testes da intro passam por ela (`skipIntro` + `test.slow()`) e os demais entram com `enterSystem` (sessão já vista) ou deep link.
- **three r186 / R3F 9**: `PCFSoftShadowMap` foi removido — use `shadows="percentage"` no `Canvas`. Evite `RectAreaLight` (a tabela dela soma ~315 KB ao chunk). O mapa de sombra não atualiza sozinho: quem anima chama `useInvalidateShadows()` (`desk/shadows.js`). `useGLTF` sem Draco (o decodificador viria de CDN); meshopt já vem no pacote.
- **Pós-processamento**: o `EffectComposer` desliga o tone mapping do renderer, então o `ToneMapping` (modo `NEUTRAL`, que mantém as cores da tela de bloqueio) fica por último. Bloom com `luminanceThreshold={1}` (só o que passa de 1). Não use `N8AO` (~80 KB gzip).
- **React Compiler × three**: preparar modelos (`useModel(url, prepare)`) com funções declaradas fora do componente; mudar material/objeto retornado de hook só dentro de `useFrame` via `ref.current`, nunca por atribuição direta ao valor do hook.
