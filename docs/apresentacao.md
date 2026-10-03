# Roteiro da apresentação (2–3 minutos)

> Para o Prof. João Paulo Aramuni e a turma de DIAW. Abra o site publicado em `/pt`, com o tema escuro e a janela do navegador em tela cheia. Tenha o celular (ou o modo responsivo do navegador) à mão.

## 1. A ideia (20s)

"Em vez de uma página com seções, meu portfólio é a **minha mesa de trabalho**. O notebook abre um sistema operacional que eu mesmo construí, e cada seção é um app."

→ Mostre a mesa: passe o mouse nos livros ("as tecnologias que eu uso"), no currículo, no boneco do Luffy, na raquete e no quadro do Galo ("coisas de que eu gosto — clicar neles leva ao Sobre"). Clique na luminária (liga/desliga). Depois passe o mouse no notebook (a tampa levanta) e **clique**.

## 2. A intro 3D (20s)

Enquanto a tampa abre, a tela liga e a câmera entra:

- "A cena é híbrida: mesa, luminária e planta são modelos gratuitos do Poly Haven, comprimidos; o notebook, os livros, o celular, o boneco do Luffy e a raquete eu fiz em código, com React Three Fiber. A luz vem de uma foto 360° de uma sala de verdade, e a sequência é uma timeline do GSAP."
- "Repare na luz da tela se espalhando pelo teclado. A câmera para exatamente quando a tela cobre a janela, em qualquer proporção, e a tela já mostra a **tela de bloqueio** — por isso a troca para o HTML não tem corte."
- Na tela de bloqueio: "sem senha, é só entrar". Aperte qualquer tecla.

## 3. O sistema (40s)

- **Cabeçalho, rodapé e conteúdo:** barra de menu em cima, dock embaixo, janelas no meio.
- Abra **Projetos** pelo dock: "timeline com tecnologias, GitHub e mídia; abre pelos mais recentes, e em **Mais antigos** fica do mais antigo ao mais recente, como pede o enunciado". Clique em Mais antigos e filtre por uma tecnologia. "O WaveHub está no Render, no plano gratuito, que dorme sem uso: no momento em que o app abriu, o site já mandou uma chamada para acordar o servidor, então a demo carrega rápido no clique."
- Abra **Certificados**: "cada curso que eu concluo entra aqui, com o PDF e o link de verificação do QR code".
- Abra **Experiências** e arraste a janela; maximize com clique duplo no título; minimize para o dock.
- Troque **PT → EN** na barra de menu: "o app continua aberto e a URL muda de `/pt/projects` para `/en/projects`".

## 4. O assistente de IA (40s)

Pressione **⌘K / Ctrl K** e pergunte: _"Quais são os principais projetos dele?"_

- "Ele responde em streaming, usando só os dados do site — o prompt é gerado do mesmo conteúdo dos apps, então ele não inventa."
- "E ele **age**: repare que abriu o app Projetos sozinho. As ferramentas rodam no navegador; as chaves ficam no servidor, numa Vercel Function, com limite de uso no Upstash."

## 5. Contato, Terminal e dados ao vivo (30s)

- **Contato:** envie o formulário vazio para mostrar a validação traduzida. "Envia dois e-mails pelo EmailJS: um para mim e uma confirmação para quem escreveu."
- **Terminal:** digite `neofetch` e `open projetos`. "É uma homenagem ao seu portfólio-terminal, professor."
- **Música / Atividade / GitHub:** "o que estou ouvindo no Spotify, minhas horas programando no WakaTime e, no app GitHub, o gráfico de contribuições e os últimos commits — tudo ao vivo."

## 6. Celular e qualidade (20s)

- Mostre a versão mobile: grade de apps, dock, app em tela cheia e o Voltar.
- "Tem testes de unidade e e2e com Playwright rodando no GitHub Actions a cada push, e o deploy é automático na Vercel."

## Encerramento (10s)

"Logo → **Desligar**": a câmera recua, o notebook fecha e a mesa volta. "Obrigado!"

---

**Plano B:** se a internet ou a GPU falharem, use "Pular intro" (vai direto à tela de bloqueio) e os prints do README.
