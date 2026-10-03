/**
 * @typedef {object} Project
 * @property {string} id
 * @property {string} name
 * @property {string} date 'YYYY-MM' — define a ordem da timeline (no mesmo mês, vale a ordem desta lista)
 * @property {{pt: string, en: string}} description
 * @property {{pt: string, en: string}} [details]
 * @property {string[]} technologies
 * @property {string} repoUrl
 * @property {string} [demoUrl]
 * @property {{pt: string, en: string}} [demoNote] aviso curto exibido junto do botão de demo
 * @property {string} [wakeUrl] servidor que dorme sem uso (plano gratuito): o app Projetos chama esta URL ao abrir, para a demo já estar ligada no clique
 * @property {{type: 'gif'|'image'|'video', src: string, poster?: string, alt: {pt: string, en: string}}} media
 * @property {boolean} [featured]
 */

// Em ordem cronológica (do mais antigo ao mais recente): o app abre do mais recente e inverte
// com um botão. Textos baseados no README de cada repositório;
// `featured` marca os que estão em destaque no README do perfil do GitHub.
/** @type {Project[]} */
export const projects = [
  {
    id: 'apis-rest',
    name: 'APIs REST · Clima e FIPE',
    date: '2026-08',
    description: {
      pt: 'Repositório com as APIs REST que fiz em Java e Spring Boot para aprender a consumir serviços externos. A ClimaAPI devolve o clima atual de uma cidade a partir da WeatherAPI.com, e a FipeAPI consulta marcas, modelos, anos e valores da Tabela FIPE. A ClimaAPI foi reaproveitada depois no WaveHub.',
      en: 'A repository with the REST APIs I built in Java and Spring Boot to learn how to consume external services. ClimaAPI returns the current weather for a city from WeatherAPI.com, and FipeAPI looks up makes, models, years and prices from the FIPE table, the Brazilian reference for vehicle prices. ClimaAPI was later reused in WaveHub.',
    },
    details: {
      pt: 'Cada API é um projeto Spring Boot independente, com pom.xml próprio e separado em controller e service. Os endpoints são métodos de um @RestController com @PathVariable: GET /cidade/{cidade} na ClimaAPI; GET /marcas, /modelos/{marca}, /anos/{marca}/{modelo} e /valor/{marca}/{modelo}/{ano} na FipeAPI. O service chama o serviço externo com RestTemplate e repassa o JSON, ou uma mensagem com o código de status quando a chamada falha. Na ClimaAPI, a chave da WeatherAPI fica num .env carregado pelo spring.config.import, fora do código.',
      en: 'Each API is a standalone Spring Boot project with its own pom.xml, split into controller and service. Endpoints are @RestController methods with @PathVariable: GET /cidade/{cidade} in ClimaAPI; GET /marcas, /modelos/{marca}, /anos/{marca}/{modelo} and /valor/{marca}/{modelo}/{ano} in FipeAPI. The service calls the external API with RestTemplate and passes the JSON through, or a message with the status code when the call fails. In ClimaAPI, the WeatherAPI key lives in a .env file loaded through spring.config.import, out of the code.',
    },
    technologies: ['Java', 'Spring Boot', 'Spring Web', 'Maven'],
    repoUrl: 'https://github.com/leonardoMartins-Dev/API-s-REST',
    media: {
      type: 'image',
      src: '/projects/apis-rest.webp',
      alt: {
        pt: 'Terminal com a FipeAPI rodando e as respostas em JSON de /marcas e /modelos/59',
        en: 'Terminal with FipeAPI running and the JSON responses from /marcas and /modelos/59',
      },
    },
  },
  {
    id: 'medvita',
    name: 'MedVita · Sistema Hospitalar',
    date: '2026-09',
    description: {
      pt: 'Sistema web de gestão hospitalar, trabalho prático em grupo da disciplina de Programação Modular na PUC Minas (em andamento). Pacientes, médicos e administradores entram pela mesma tela de login e cada perfil vai para a sua área: o paciente vê consultas, internações e histórico; o médico acompanha a agenda do dia, os internados e os quartos; o administrador gerencia o quadro de médicos.',
      en: "A hospital management web system, a group project for the Modular Programming course at PUC Minas (in progress). Patients, doctors and administrators sign in through the same login screen and each role lands in its own area: patients see appointments, admissions and history; doctors follow the day's schedule, admitted patients and rooms; administrators manage the medical staff.",
    },
    details: {
      pt: 'O login veio do TelasLogin: Spring Security com três perfis (cada um só abre as próprias páginas), reCAPTCHA v2 validado no servidor, senhas em BCrypt e recuperação de senha por e-mail com link válido por 15 minutos. O banco é PostgreSQL no Supabase, acessado com Spring Data JPA, e a escolha de um banco relacional foi justificada por escrito: as regras de negócio viram garantias do próprio banco. Um índice único parcial impede um médico de ter duas consultas no mesmo horário (as canceladas liberam o horário), um CHECK impede um quarto de passar da capacidade e internar e dar alta são transações. O restante do back-end (consultas, internações, quartos e histórico) já está modelado em camadas e em implementação.',
      en: 'The login came from TelasLogin: Spring Security with three roles (each one only opens its own pages), reCAPTCHA v2 validated on the server, BCrypt-hashed passwords, and email password recovery with a link valid for 15 minutes. The database is PostgreSQL on Supabase, accessed through Spring Data JPA, and the choice of a relational database was justified in writing: business rules become guarantees enforced by the database itself. A partial unique index keeps a doctor from having two appointments at the same time (cancelled ones free the slot), a CHECK keeps a room from going over capacity, and admitting and discharging a patient are transactions. The rest of the back end (appointments, admissions, rooms and history) is already modeled in layers and being implemented.',
    },
    technologies: [
      'Java',
      'Spring Boot',
      'Spring Security',
      'Spring Data JPA',
      'Thymeleaf',
      'Spring Mail',
      'PostgreSQL',
      'Supabase',
    ],
    repoUrl: 'https://github.com/leonardoMartins-Dev/Sistema_Hospitalar',
    media: {
      type: 'image',
      src: '/projects/medvita.webp',
      alt: {
        pt: 'Painel da área médica do MedVita, com consultas de hoje, pacientes internados, quartos disponíveis e atalhos',
        en: "MedVita doctor dashboard showing today's appointments, admitted patients, available rooms and shortcuts",
      },
    },
  },
  {
    id: 'telas-login',
    name: 'TelasLogin · Spring Boot',
    date: '2026-09',
    description: {
      pt: 'Módulo de autenticação completo com Spring Boot e Spring Security, pensado para ser reaproveitado em projetos novos: login, cadastro, recuperação de senha por e-mail e Google reCAPTCHA. Tem duas variantes prontas, uma com usuários em memória e outra com PostgreSQL no Supabase, e serviu de base para o login do WaveHub.',
      en: "A complete authentication module built with Spring Boot and Spring Security, designed to be reused in new projects: login, sign-up, email password recovery, and Google reCAPTCHA. It comes in two ready-made variants, one with in-memory users and one with PostgreSQL on Supabase, and it became the base for WaveHub's login.",
    },
    details: {
      pt: 'Senhas guardadas em hash BCrypt, reCAPTCHA v2 validado no servidor por um filtro próprio (RecaptchaFilter) antes de o Spring Security autenticar e dois perfis de acesso: USER vai para /home e ADMIN para /admin, área restrita ao administrador. A recuperação de senha gera um token e envia pelo Gmail (Spring Mail) um link válido por 15 minutos. Formulários com proteção CSRF, credenciais lidas de um .env com spring-dotenv e erros tratados num handler global. Na variante Supabase, os usuários ficam no PostgreSQL via Spring Data JPA e um AdminSeeder cria o administrador na primeira execução. Próxima variante planejada: front-end em React com MongoDB.',
      en: 'Passwords are stored as BCrypt hashes, reCAPTCHA v2 is validated on the server by a custom filter (RecaptchaFilter) before Spring Security authenticates, and there are two roles: USER goes to /home and ADMIN to /admin, an admin-only area. Password recovery generates a token and emails a link valid for 15 minutes through Gmail (Spring Mail). Forms are CSRF-protected, credentials are read from a .env file with spring-dotenv, and errors go through a global handler. In the Supabase variant, users are stored in PostgreSQL with Spring Data JPA, and an AdminSeeder creates the admin account on first run. Next planned variant: a React front end with MongoDB.',
    },
    technologies: [
      'Java',
      'Spring Boot',
      'Spring Security',
      'Thymeleaf',
      'Spring Mail',
      'Spring Data JPA',
      'PostgreSQL',
      'Supabase',
    ],
    repoUrl: 'https://github.com/leonardoMartins-Dev/TelasLogin-SpringBoot-',
    media: {
      type: 'image',
      src: '/projects/telas-login.webp',
      alt: {
        pt: 'Tela de login do TelasLogin, com campos de usuário e senha, reCAPTCHA e botão Entrar',
        en: 'TelasLogin sign-in screen with username and password fields, reCAPTCHA and a sign-in button',
      },
    },
    featured: true,
  },
  {
    id: 'wavehub',
    name: 'WaveHub',
    date: '2026-09',
    description: {
      pt: 'Aplicação web para ouvir rádios ao vivo do mundo inteiro. Dá para filtrar por país e estado, buscar pelo nome, salvar favoritas na própria conta e ver o clima e a hora local do lugar que está tocando. Junta três projetos anteriores (consumo da Radio Browser API, módulo de login e ClimaAPI) e está publicada na nuvem.',
      en: "A web app for listening to live radio stations from all over the world. You can filter by country and state, search by name, save favorites to your account, and see the weather and local time of the place you're listening to. It brings together three earlier projects (a Radio Browser API client, the login module, and ClimaAPI) and is deployed to the cloud.",
    },
    details: {
      pt: 'Back-end em camadas (controller, service, repository) com Spring Boot 3.3. As contas usam Spring Security com senhas em BCrypt, proteção CSRF, Google reCAPTCHA validado por um filtro próprio antes do login e recuperação de senha por e-mail com link válido por 15 minutos. Usuários e favoritas ficam no PostgreSQL do Supabase (Spring Data JPA, com Row Level Security ligado). No front, um único player no rodapé toca as rádios e a estrela de favorita é atualizada via fetch, sem recarregar a página nem parar o áudio. Buscar o clima pelo nome do estado errava o lugar, então o serviço usa as coordenadas da estação mais bem colocada; o resultado fica em cache por 10 minutos, com timeout de 3 segundos para a página nunca travar.',
      en: "Layered back end (controller, service, repository) with Spring Boot 3.3. Accounts use Spring Security with BCrypt-hashed passwords, CSRF protection, Google reCAPTCHA checked by a custom filter before login, and email password recovery with a link valid for 15 minutes. Users and favorites live in Supabase's PostgreSQL (Spring Data JPA, with Row Level Security enabled). On the front end, a single player in the footer plays the stations, and the favorite star updates via fetch without reloading the page or stopping the audio. Looking up the weather by state name often hit the wrong place, so the service uses the coordinates of the top-ranked station; results are cached for 10 minutes with a 3-second timeout so the page never hangs.",
    },
    technologies: [
      'Java',
      'Spring Boot',
      'Spring Security',
      'Spring Data JPA',
      'Thymeleaf',
      'PostgreSQL',
      'Supabase',
      'JavaScript',
    ],
    repoUrl: 'https://github.com/leonardoMartins-Dev/WaveHub',
    demoUrl: 'https://wavehub-fhec.onrender.com/login',
    wakeUrl: 'https://wavehub-fhec.onrender.com/login',
    demoNote: {
      pt: 'Plano gratuito: o servidor dorme sem uso, mas começa a acordar quando você abre Projetos. Se ainda demorar, aguarde até um minuto.',
      en: "Free plan: the server sleeps when idle, but starts waking up when you open Projects. If it's still slow, give it up to a minute.",
    },
    media: {
      type: 'image',
      src: '/projects/wavehub.webp',
      alt: {
        pt: 'Página Explorar do WaveHub com as rádios de Minas Gerais, o card de clima e o player no rodapé',
        en: 'WaveHub Explore page listing radio stations in Minas Gerais, with the weather card and the footer player',
      },
    },
    featured: true,
  },
];
