# Roteiro da apresentação (2–3 minutos)

> Para o Prof. João Paulo Aramuni e a turma de DIAW. Abra o site publicado em `/pt`, com o tema escuro e a janela do navegador em tela cheia. Tenha o celular (ou o modo responsivo do navegador) à mão.

## 1. A ideia (20s)

"Em vez de uma página com seções, meu portfólio é um **notebook**. Cada seção é um app de um sistema operacional que eu mesmo construí."

→ Mostre o notebook fechado. Passe o mouse (a tampa levanta) e **clique**.

## 2. A intro 3D (20s)

Enquanto a tampa abre, a tela liga e a câmera entra:

- "O notebook é feito em código — React Three Fiber, sem Blender. A sequência é uma timeline do GSAP."
- "A câmera para exatamente quando a tela cobre a janela, em qualquer proporção. O papel de parede da tela é o mesmo do sistema, então a troca para o HTML é contínua."

## 3. O sistema (40s)

- **Cabeçalho, rodapé e conteúdo:** barra de menu em cima, dock embaixo, janelas no meio.
- Abra **Projetos** pelo dock: "timeline do mais antigo ao mais recente, com tecnologias, GitHub e mídia". Filtre por uma tecnologia.
- Abra **Experiências** e arraste a janela; maximize com clique duplo no título; minimize para o dock.
- Troque **PT → EN** na barra de menu: "o app continua aberto e a URL muda de `/pt/projects` para `/en/projects`".

## 4. O assistente de IA (40s)

Pressione **⌘K / Ctrl K** e pergunte: _"Quais são os principais projetos dele?"_

- "Ele responde em streaming, usando só os dados do site — o prompt é gerado do mesmo conteúdo dos apps, então ele não inventa."
- "E ele **age**: repare que abriu o app Projetos sozinho. As ferramentas rodam no navegador; as chaves ficam no servidor, numa Vercel Function, com limite de uso no Upstash."

## 5. Contato, Terminal e dados ao vivo (30s)

- **Contato:** envie o formulário vazio para mostrar a validação traduzida. "Envia dois e-mails pelo EmailJS: um para mim e uma confirmação para quem escreveu."
- **Terminal:** digite `neofetch` e `open projetos`. "É uma homenagem ao seu portfólio-terminal, professor."
- **Música / Atividade:** "o que estou ouvindo no Spotify e minhas horas programando no WakaTime, ao vivo."

## 6. Celular e qualidade (20s)

- Mostre a versão mobile: grade de apps, dock, app em tela cheia e o Voltar.
- "Tem testes de unidade e e2e com Playwright rodando no GitHub Actions a cada push, e o deploy é automático na Vercel."

## Encerramento (10s)

"Logo → **Desligar**": a câmera recua e o notebook fecha. "Obrigado!"

---

**Plano B:** se a internet ou a GPU falharem, use "Pular intro" (o sistema abre direto) e os prints do README.
