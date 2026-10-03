# Intro na mesa de trabalho + tela de bloqueio

Data: 2026-10-02 · Status: aprovado pelo autor e implementado · Substitui o "estado inicial" da §8 do PROJETO.md.

## Objetivo

A intro atual (notebook solto num fundo vazio) é básica. Ela passa a ser uma **mesa de trabalho** com objetos que contam quem é o autor, e o sistema ganha uma **tela de bloqueio** sem senha entre a intro e o desktop.

## 1. A cena

- **Ambiente:** canto de quarto (parede, janela, mesa de madeira). Tema escuro = noite (céu estrelado na janela, luminária acesa). Tema claro = dia (luz pela janela).
- **Estilo híbrido:** modelos realistas do Poly Haven (CC0) no que fica feio em código; código no que é simples.

| Objeto | Origem | Clique |
|---|---|---|
| Notebook (atual, materiais melhores, LED pulsando) | código | abre o sistema |
| Luminária articulada (`desk_lamp_arm_01`) | Poly Haven | liga/desliga a luz |
| Mesa (`wooden_table_02`) | Poly Haven | — |
| Planta (`potted_plant_02`) | Poly Haven | — |
| Livros com as tecnologias na lombada | código | Skills |
| Currículo em papel (`cv-pt.png` / `cv-en.png`) | código | Currículo |
| Celular (vibra com notificação de vez em quando) | código | Contato |
| Caneca com vapor | código | — |
| Boneco do Luffy Gear 5 (vinil cabeção, inspirado no estilo Funko, sem a marca) | código | balança a cabeça → Sobre |
| Raquete de tênis com bolinha | código | a bolinha quica → Sobre |
| Quadro do Atlético Mineiro na parede (escudo da Wikimedia; moldura em código) | código | Sobre |

- **Movimento:** fade de entrada + travelling lento até a mesa; paralaxe do mouse; hover destaca o objeto e mostra um rótulo; clique no notebook abre a tampa, a luz da tela se espalha pela mesa e a câmera entra na tela.
- **Aviso:** "Clique no notebook para abrir", no mesmo lugar de hoje, mais o LED pulsando.
- **Acessibilidade:** os atalhos dos objetos também existem como botões focáveis (visualmente escondidos). Movimento reduzido não roda a cena.
- **Peso:** modelos em `public/models/` até ~3 MB (meshopt + texturas WebP; ficaram em ~1,5 MB). No celular: resolução menor, sombras menores, sem a planta e com menos vapor.

## 2. Tela de bloqueio

- Papel de parede atual desfocado e escurecido; relógio e data grandes no idioma atual; foto, nome e cargo; "Clique ou aperte qualquer tecla para entrar" (sem senha).
- Card de notificação do assistente ("Oi! Pergunte qualquer coisa sobre o Leonardo"): clicou, entra com o assistente aberto. Só aparece se a IA estiver configurada (`GET /api/chat`).
- Seletor de idioma num canto.
- Ao entrar: relógio e foto sobem e somem; o desfoque se desfaz; o desktop aparece.
- Celular: layout de tela de bloqueio de celular (relógio no topo, notificação, "Toque para entrar").
- Antes da câmera chegar, a tela 3D desenha a mesma tela de bloqueio (sem corte na troca).

| Situação | Caminho |
|---|---|
| Primeira visita | mesa 3D → tela de bloqueio → desktop |
| Clicou num objeto | mesa 3D → tela de bloqueio ("Entrar e abrir Contato") → desktop com o app |
| "Pular intro" | tela de bloqueio → desktop |
| Movimento reduzido / sem WebGL | tela de bloqueio (sem animações) → desktop |
| Recarregou na mesma sessão | boot curto → desktop |
| Link direto (`/pt/projects`) | direto no app |
| "Bloquear" no menu do logo | tela de bloqueio por cima; janelas continuam abertas |
| Ligar depois de "Desligar" | tela de bloqueio → desktop |

## 3. Arquitetura

- Fase nova `lock` no store. O shell (desktop ou celular) fica montado **por baixo** da tela de bloqueio (com `inert`), o que permite o desfoque sumindo e o "Bloquear" sem perder janelas.
- Store: `pendingApp` (app ou `assistant` a abrir depois de entrar) e `unlock()`.
- `decideInitialPhase`: deep link → `desktop`; intro já vista → `boot`; sem 3D → `lock`; senão → `intro`.
- `src/components/intro/desk-objects.js`: dados puros (objeto → rótulo + app). `desk/`: um componente por objeto. `Scene.jsx` só compõe câmera, luzes e objetos.
- `src/components/os/LockScreen.jsx`: tela de bloqueio (desktop e celular).
- Sombras: uma luz com sombra; o mapa só é recalculado quando algo se mexe. A luz da tela é um spot largo saindo do centro dela, com intensidade ligada ao brilho (a `RectAreaLight` foi descartada: a tabela dela somava ~315 KB ao chunk).
- Sem dependência nova no site: modelos comprimidos uma vez com `@gltf-transform/cli` via `npx` (`npm run models`); o decodificador meshopt já vem com o three/drei.

## 4. Falhas

- Modelo ou chunk 3D não carregou → `ErrorBoundary` pula para a tela de bloqueio.
- Escudo ou foto não carregou → quadro neutro; foto vira as iniciais.
- IA sem chave → sem card de notificação.

## 5. Testes

- Unitários: `decideInitialPhase`; `lock`/`unlock`/`pendingApp` no store; atalhos apontam para apps existentes; `LockScreen` (Enter entra, notificação condicional, rótulo "Entrar e abrir…"); paridade de i18n; orçamento de peso de `public/models/`.
- E2E: `skipIntro` passa pela tela de bloqueio; "Pular → bloqueio → desktop"; "Bloquear pelo menu mantém as janelas".

## 6. Direitos

Escudo do Atlético e personagem Luffy são de terceiros, usados só como decoração da cena num portfólio pessoal sem fins comerciais. A regra "sem marcas de terceiros" continua valendo para a identidade do sistema.

## 7. Revisão visual (02/10/2026, tarde)

O autor achou a primeira versão funcional, mas feia: estilos misturados (modelos realistas com objetos de cor chapada e uma janela de desenho), luz fria brigando com a quente e o boneco feito de esferas. Decisões dele: **direção realista** e o **Luffy clássico igual à foto de referência** (Funko Pop). Mudanças:

- Iluminação por HDRI (Poly Haven, 512×256) e pós-processamento leve (bloom, vinheta, tone mapping neutro).
- Janela com persiana em uma parede com vão: de dia o sol entra só pelas lâminas e projeta listras na mesa; à noite, luzes da rua desfocadas.
- Objetos de código refeitos com materiais realistas; luminária recolorida para preto; madeira dessaturada.
- Luffy modelado em código (`desk/Luffy.jsx`) e comparado lado a lado com a foto. A geração por IA (Higgsfield, imagem → 3D) foi autorizada, mas o CLI recusou o modelo (`Unsupported validation rules`).
- Celular (tela em pé): câmera mais alta, mostrando notebook, Luffy e vizinhos.
