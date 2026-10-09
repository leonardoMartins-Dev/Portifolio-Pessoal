# Roteiro da apresentação (2–3 minutos)

> Para o Prof. João Paulo Aramuni e a turma de DIAW. Abra o site publicado em `/pt`, com o tema escuro e a janela do navegador em tela cheia. Tenha o celular (ou o modo responsivo do navegador) à mão.

## 1. A ideia (20s)

"Meu portfólio começa no **meu quarto**, em 3D: esse boneco sou eu, de óculos e cabelo cacheado, trabalhando no PC. Na mesa tem o Luffy, no chão a raquete e as bolinhas de tênis, e na parede o escudo do Galo. Dentro do computador tem um sistema operacional que eu mesmo construí, e cada seção é um app."

→ Passe o mouse no PC (ou no boneco): ele gira a cadeira e acena. Clique no Luffy (a cabeça balança) e numa bolinha (ela quica). Role a página rapidinho: "Para quem só quer o essencial, como um recrutador, aqui embaixo já tem o status de estágio, formação, foco, as skills no globo e o contato com o currículo". Volte ao topo e **clique no PC**.

## 2. O zoom até a tela (20s)

Enquanto a câmera passa por cima do boneco e entra na tela:

- "Tudo na cena é feito em código com React Three Fiber, no estilo massinha da referência que eu usei (o portfólio do David Heckhoff): nenhum modelo baixado. O zoom é uma timeline do GSAP."
- "A câmera para exatamente quando a tela do monitor cobre a janela, em qualquer proporção, e o monitor já mostra a **tela de bloqueio** — por isso a troca para o HTML não tem corte."
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

"Logo → **Desligar**": a câmera sai da tela, o monitor apaga e o quarto volta. "Obrigado!"

---

**Plano B:** se a GPU falhar, o botão "Clique no PC" entra direto (sem o zoom) e, sem WebGL, o quarto aparece como imagem; se a internet falhar, use os prints do README.
