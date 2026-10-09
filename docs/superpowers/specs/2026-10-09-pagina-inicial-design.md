# Página inicial com o quarto 3D

Data: 2026-10-09 · Status: implementado · Substitui a mesa de trabalho da §8 do PROJETO.md (e o desenho de 2026-10-02-intro-mesa-design.md). A tela de bloqueio (§8.4) continua igual.

## Objetivo

Trocar a intro da mesa por uma página inicial bem parecida com [david-hckh.com](https://david-hckh.com/), do jeito do autor: clicar no computador da cena aproxima a câmera da tela e entra no sistema operacional que já existe.

## 1. Estrutura da página

| Seção    | Conteúdo                                                                                                                                                                                                                                                                     |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Topo     | Cabeçalho fixo (logo, Sobre/Skills/Contato, PT/EN, tema e "Fale comigo"), "Disponível para estágio", nome grande com a etiqueta inclinada "Full stack" e o **quarto 3D**. Botão flutuante **"Clique no PC"** (longe do topo, vira um botão redondo "Entrar no sistema"). |
| Sobre    | Fundo azul holográfico: o boneco num pedestal, com um scanner que o "materializa" conforme a rolagem, e cartões com nome e cidade, resumo, foco atual e status (estágio, formação, baixar currículo, ver mais no sistema).                                                    |
| Skills   | O globo 3D do app Skills no lugar da grade de projetos da referência, com "Ver projetos" e "Ver experiência" (entram no sistema já no app).                                                                                                                                  |
| Contato  | "Vamos trabalhar juntos!", e-mail, GitHub, LinkedIn, WhatsApp, currículo PT/EN, atalho para o formulário do sistema e o boneco acenando entre cartas e caixas.                                                                                                                |
| Rodapé   | Ano e nome, código-fonte, voltar ao topo e PT/EN.                                                                                                                                                                                                                            |

O que entrou pensando em recrutadores (sem encher a página): status de estágio logo no topo, formação e foco num cartão, currículo a um clique em dois lugares e atalhos diretos para Projetos e Experiências.

## 2. O quarto

- **Estilo "massinha"**, como a referência: formas arredondadas, materiais foscos, paleta quente, fundo creme sem paredes visíveis (chão e parede só recebem sombra). Noite no tema escuro, com as telas iluminando a mesa.
- **Tudo em código** (sem modelos nem HDRIs): mesa branca com pés de madeira, cadeira de escritório giratória, dois monitores (um com um controller Spring no editor, outro com a tela de bloqueio), teclado, mouse, porta-lápis, caneca, prateleira com livros e cacto, mural de cortiça com dois bilhetes, tapete em faixas laranja e amarelas e uma planta grande.
- **Pedidos do autor:** o boneco do Luffy no lugar do pinguim da referência; raquete e bolinhas de tênis no chão; o escudo do Galo no quadro azul.
- **O boneco do autor:** cabeça grande, cabelo preto cacheado com volume em cima, óculos de armação fina, pele morena, sorriso, camiseta preta, jeans e tênis branco. Poses: sentado digitando, sentado acenando, em pé e acenando.

## 3. Interação

- Passar o mouse no PC: o boneco gira a cadeira para o visitante e acena; um rótulo "Clique no PC" fica sobre o monitor. Passar o mouse no boneco (ou na cadeira) também o faz virar e acenar, sem ser clicável.
- Clique no PC (ou no botão flutuante): a página volta ao topo, os textos somem, a câmera sobe num arco por cima do boneco e para quando a tela do monitor cobre a janela; a tela de bloqueio em HTML entra sem corte.
- Luffy balança a cabeça e as bolinhas quicam no clique.
- "Página inicial" (menu do logo, Ajustes e um botão na barra de cima do celular): a câmera sai da tela de volta ao quarto, com o monitor ainda ligado.
- "Desligar" (menu do logo): o mesmo caminho, mas o monitor apaga no fim; clicar de novo liga o monitor (boot) no caminho do zoom.
- F5 continua onde o visitante está: na página inicial, recarrega a página inicial; no sistema, o boot curto e o desktop. A sessão guarda a fase atual, e a página inicial fica sempre em `/{locale}` (um link de app abriria o sistema).

## 4. Acessibilidade e desempenho

- O botão flutuante é o caminho por teclado; a cena é `aria-hidden`.
- Movimento reduzido: sem animações do boneco e sem o zoom (entra direto).
- Sem WebGL ou em aparelho fraco: o quarto vira `public/images/room.webp` (gerada pelo `npm run screenshots`), a foto substitui o holograma e uma grade de ícones substitui o globo.
- O texto da página aparece antes do 3D; as cenas de baixo só montam quando chegam perto da tela e param de renderizar fora dela.
