import { siteConfig } from '../site.config.js';

/**
 * @typedef {{ pt: string, en: string }} Localized
 */

/**
 * Perfil do autor. Alimenta o app Sobre, o Terminal e o prompt do assistente.
 * Fontes: currículo (PT/EN) e README do perfil no GitHub.
 */
export const profile = {
  name: siteConfig.author.name,
  role: {
    pt: 'Estudante de Engenharia de Software · Full stack: Java e Spring Boot, React e Vite',
    en: 'Software Engineering Student · Full stack: Java and Spring Boot, React and Vite',
  },
  /** Etiqueta curta do topo da página inicial. */
  tagline: {
    pt: 'Full stack',
    en: 'Full stack',
  },
  /** Resumo de uma frase (cartão do Sobre na página inicial). */
  summary: {
    pt: 'Estudante de Engenharia de Software na PUC Minas e dev full stack, com preferência pelo back-end. No back, Java e Spring Boot: APIs REST, login com controle de acesso (Spring Security) e dados em SQL. No front, React e Vite.',
    en: 'Software Engineering student at PUC Minas and full stack dev, with a preference for the back end. On the back end, Java and Spring Boot: REST APIs, login with role-based access (Spring Security) and SQL data. On the front end, React and Vite.',
  },
  location: {
    pt: 'Belo Horizonte, MG',
    en: 'Belo Horizonte, MG, Brazil',
  },
  bio: {
    pt: 'Estudante do 2º período de Engenharia de Software na PUC Minas e desenvolvedor full stack, com preferência pelo back-end com Java e Spring Boot; no front-end, trabalho com React e Vite. Fixo o que aprendo construindo projetos: aplicações web com login e controle de acesso por perfil (Spring Security), APIs REST integradas a serviços externos, uma aplicação que processa os dados abertos do TSE e o WaveHub, um app de rádios ao vivo publicado na nuvem. Estou em busca de um estágio em desenvolvimento para contribuir em projetos reais e evoluir em boas práticas, testes e bancos de dados.',
    en: "Second-semester Software Engineering student at PUC Minas and full stack developer, with a preference for back-end development with Java and Spring Boot; on the front end, I work with React and Vite. I learn by building: web applications with login and role-based access control (Spring Security), REST APIs integrated with external services, an application that processes open data from Brazil's Superior Electoral Court (TSE), and WaveHub, a live radio app deployed to the cloud. I'm looking for a software development internship to contribute to real-world projects and grow in best practices, testing, and databases.",
  },
  education: {
    pt: 'Bacharelado em Engenharia de Software na PUC Minas (Campus Coração Eucarístico), fev/2026 – dez/2029 (previsão). Extracurricular: oficina Dev_Labs, com projetos em Spring Boot e web scraping com Python (Scrapy).',
    en: "Bachelor's in Software Engineering at PUC Minas (Coração Eucarístico Campus), Feb 2026 – Dec 2029 (expected). Extracurricular: Dev_Labs workshop, with Spring Boot projects and web scraping in Python (Scrapy).",
  },
  /** Formação em duas linhas curtas (cartão de status da página inicial). */
  educationShort: {
    pt: 'Engenharia de Software · PUC Minas',
    en: 'Software Engineering · PUC Minas',
  },
  educationPeriod: {
    pt: '2º período · conclusão prevista em dez/2029',
    en: '2nd semester · expected graduation Dec 2029',
  },
  interests: {
    pt: 'Desenvolvimento full stack: back-end com Java e Spring Boot (minha preferência), autenticação e autorização, APIs REST e integração com serviços externos, arquitetura em camadas, bancos de dados SQL e NoSQL e front-end com React e Vite.',
    en: 'Full stack development: back end with Java and Spring Boot (my preference), authentication and authorization, REST APIs and integration with external services, layered architecture, SQL and NoSQL databases, and front end with React and Vite.',
  },
  goals: {
    pt: 'Conseguir um estágio em desenvolvimento, construir uma base sólida e evoluir com projetos reais, com atenção a boas práticas, testes e bancos de dados.',
    en: 'Land a software development internship, build a solid foundation and grow through real-world projects, with attention to best practices, testing, and databases.',
  },
  /** Foco de estudo atual (do README do GitHub, com o front-end pedido pelo autor). */
  focus: [
    { pt: 'Back-end com Java e Spring Boot', en: 'Back-end with Java and Spring Boot' },
    { pt: 'Front-end com React e Vite', en: 'Front-end with React and Vite' },
    {
      pt: 'Modelagem e consultas em bancos de dados',
      en: 'Database modeling and queries',
    },
    {
      pt: 'Boas práticas de código e versionamento com Git',
      en: 'Clean code practices and version control with Git',
    },
  ],
  /**
   * Fora do código (contado pelo autor). Os três também estão no quarto 3D da
   * página inicial: o boneco do Luffy, a raquete com as bolinhas e o quadro do Galo.
   */
  hobbies: [
    {
      id: 'one-piece',
      label: { pt: 'Série favorita', en: 'Favorite series' },
      name: { pt: 'One Piece', en: 'One Piece' },
      text: {
        pt: 'Não é por acaso que o boneco do Luffy está na mesa da página inicial.',
        en: "It's no accident that a Luffy figure sits on the desk on the home page.",
      },
      tint: ['#f0605a', '#b42a2f'],
    },
    {
      id: 'tennis',
      label: { pt: 'Esporte', en: 'Sport' },
      name: { pt: 'Tênis', en: 'Tennis' },
      text: {
        pt: 'Fora da tela, eu jogo tênis. Por isso a raquete e as bolinhas no chão do quarto.',
        en: "Away from the screen, I play tennis. That's why there's a racket and balls on the floor of the room.",
      },
      tint: ['#c8dc3c', '#6f9a1c'],
    },
    {
      id: 'galo',
      label: { pt: 'Time do coração', en: 'Football club' },
      name: { pt: 'Atlético Mineiro', en: 'Atlético Mineiro' },
      text: {
        pt: 'Atleticano: é do Galo o escudo no quadro azul da parede.',
        en: "I'm an Atlético fan: that's the Galo crest in the blue frame on the wall.",
      },
      tint: ['#4a4a4a', '#111111'],
    },
  ],
  /** Aparece como selo no app Sobre. */
  openToWork: true,
  photo: '/images/profile.jpg',
  email: siteConfig.social.email,
  whatsapp: siteConfig.social.whatsapp,
  links: {
    github: siteConfig.social.github,
    linkedin: siteConfig.social.linkedin,
  },
  resume: {
    pt: '/cv/cv-pt.pdf',
    en: '/cv/cv-en.pdf',
  },
  /** Nome sugerido ao baixar o PDF. */
  resumeFileName: {
    pt: 'Curriculo_Leonardo_Martins_Macedo.pdf',
    en: 'Resume_Leonardo_Martins_Macedo.pdf',
  },
  resumePreview: {
    pt: '/cv/cv-pt.png',
    en: '/cv/cv-en.png',
  },
};
