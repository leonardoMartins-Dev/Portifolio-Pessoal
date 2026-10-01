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
npm run screenshots   # prints do README + imagem OG (com o dev rodando)
```

Antes de dar algo por pronto: `lint`, `format:check`, `test`, `build` e `test:e2e` passando.

## Arquitetura em uma linha por pasta

- `src/content/` — dados do autor (PT/EN). Única fonte para apps, Terminal e prompt do assistente.
- `src/lib/apps-meta.js` — registro dos apps (dados puros, lido também no servidor); `apps.jsx` adiciona ícones e componentes lazy.
- `src/lib/os-store.js` — Zustand: fase (intro/boot/desktop/off), janelas, foco, preferências (persistidas).
- `src/lib/os-bridge.js` — navegação fora do React (assistente, Terminal). **A URL é o comando**: `/{locale}/{appId}` abre o app.
- `src/components/os/` — shell desktop (`DesktopShell`, `useUrlSync`) e mobile (`MobileShell`).
- `src/components/intro/` — notebook 3D (R3F + GSAP), carregado sob demanda.
- `api/*.js` — Vercel Functions (handlers Web `GET`/`POST`). `server/` — código só do servidor.

## Convenções

- Código e identificadores em inglês. Comentários, README e commits em português (Conventional Commits).
- Nenhum texto de UI fixo: mensagens em `src/i18n/messages/{pt,en}.json` (teste de paridade exige as mesmas chaves e variáveis). Conteúdo usa objetos `{ pt, en }`.
- Dados do autor só em `src/site.config.js` e `src/content/`. Nunca invente dados pessoais: placeholders com `TODO(conteúdo)`.
- Texto na cor de destaque usa `text-accent-ink` (contraste AA); `bg-accent` para fundos.
- Lint segue as regras do React Compiler: nada de `setState` síncrono em efeito, nem mutar props/retornos de hooks (refs passados como prop terminam em `Ref`).

## Regras

- Segredos só no servidor (`api/`, `server/`). Nunca `VITE_` em chave secreta. Nunca commitar `.env*` (exceto `.env.example`).
- Toda integração sem variável configurada degrada com elegância (estado vazio), sem quebrar o build.
- Sem marcas de terceiros (Apple, macOS etc.) na identidade do sistema.
- Dependências enxutas: justifique cada nova e atualize a tabela de dependências do README.
- Acessibilidade e `prefers-reduced-motion` sempre.
- Mantenha este arquivo atualizado quando surgir uma convenção nova.

## Notas da stack (conferidas em out/2026)

- **AI SDK 7**: exige Node 22+; `instructions` (não `system`); resposta com `createUIMessageStreamResponse({ stream: toUIMessageStream({ stream: result.stream }) })`; no cliente, `Chat` + `useChat({ chat })`, `addToolOutput`, `sendAutomaticallyWhen`. Docs no pacote: `node_modules/ai/docs/`.
- **OpenAI**: `gpt-6-luna` é modelo de raciocínio — sem `temperature`; usamos `reasoningEffort: 'none'` para os tokens de raciocínio não comerem o limite de 500.
- **React Router 8** em modo declarativo (`BrowserRouter`, `Routes`). Docs no pacote: `node_modules/react-router/docs/`.
- **Vite 8 (Rolldown)**: opção de chunks é `codeSplitting` (não `manualChunks`). Variáveis do servidor em dev vêm do `loadEnv` no `vite.config.js`.
- **Tailwind 4**: configuração no CSS (`src/styles/globals.css`, `@theme`), tema por `data-theme` no `<html>`.
- **Testes**: o jsdom não tem `matchMedia` nem `scrollIntoView` (stubs em `tests/setup.js`). O e2e usa WebGL por software (SwiftShader) e 2 workers.
