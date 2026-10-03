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
    pt: 'Estudante de Engenharia de Software · Back-end com Java e Spring Boot',
    en: 'Software Engineering Student · Back-end with Java and Spring Boot',
  },
  location: {
    pt: 'Belo Horizonte, MG',
    en: 'Belo Horizonte, MG, Brazil',
  },
  bio: {
    pt: 'Estudante do 2º período de Engenharia de Software na PUC Minas, com foco em back-end com Java e Spring Boot. Fixo o que aprendo construindo projetos: aplicações web com login e controle de acesso por perfil (Spring Security), APIs REST integradas a serviços externos, uma aplicação que processa os dados abertos do TSE e o WaveHub, um app de rádios ao vivo publicado na nuvem. Estou em busca de um estágio para contribuir em projetos reais e evoluir em boas práticas, testes e bancos de dados.',
    en: "Second-semester Software Engineering student at PUC Minas, focused on back-end development with Java and Spring Boot. I learn by building: web applications with login and role-based access control (Spring Security), REST APIs integrated with external services, an application that processes open data from Brazil's Superior Electoral Court (TSE), and WaveHub, a live radio app deployed to the cloud. I'm looking for an internship to contribute to real-world projects and grow in best practices, testing, and databases.",
  },
  education: {
    pt: 'Bacharelado em Engenharia de Software na PUC Minas (Campus Coração Eucarístico), fev/2026 – dez/2029 (previsão). Extracurricular: oficina Dev_Labs, com projetos em Spring Boot e web scraping com Python (Scrapy).',
    en: "Bachelor's in Software Engineering at PUC Minas (Coração Eucarístico Campus), Feb 2026 – Dec 2029 (expected). Extracurricular: Dev_Labs workshop, with Spring Boot projects and web scraping in Python (Scrapy).",
  },
  interests: {
    pt: 'Back-end com Java e Spring Boot, autenticação e autorização, APIs REST e integração com serviços externos, arquitetura em camadas e bancos de dados SQL e NoSQL.',
    en: 'Back-end with Java and Spring Boot, authentication and authorization, REST APIs and integration with external services, layered architecture, and SQL and NoSQL databases.',
  },
  goals: {
    pt: 'Conseguir um estágio em desenvolvimento back-end, construir uma base sólida e evoluir com projetos reais, com atenção a boas práticas, testes e bancos de dados.',
    en: 'Land a back-end development internship, build a solid foundation and grow through real-world projects, with attention to best practices, testing, and databases.',
  },
  /** Foco de estudo atual (do README do GitHub). */
  focus: [
    { pt: 'Back-end com Java e Spring Boot', en: 'Back-end with Java and Spring Boot' },
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
   * Fora do código (contado pelo autor). Os três também estão na mesa 3D da
   * intro: o boneco do Luffy, a raquete com a bolinha e o quadro do Galo.
   */
  hobbies: [
    {
      id: 'one-piece',
      label: { pt: 'Série favorita', en: 'Favorite series' },
      name: { pt: 'One Piece', en: 'One Piece' },
      text: {
        pt: 'Não é por acaso que o boneco do Luffy está na mesa da intro.',
        en: "It's no accident that a Luffy figure sits on the desk in the intro.",
      },
      tint: ['#f0605a', '#b42a2f'],
    },
    {
      id: 'tennis',
      label: { pt: 'Esporte', en: 'Sport' },
      name: { pt: 'Tênis', en: 'Tennis' },
      text: {
        pt: 'Fora da tela, eu jogo tênis. Por isso a raquete e a bolinha em cima da mesa.',
        en: "Away from the screen, I play tennis. That's why there's a racket and a ball on the desk.",
      },
      tint: ['#c8dc3c', '#6f9a1c'],
    },
    {
      id: 'galo',
      label: { pt: 'Time do coração', en: 'Football club' },
      name: { pt: 'Atlético Mineiro', en: 'Atlético Mineiro' },
      text: {
        pt: 'Atleticano: é do Galo o escudo emoldurado na parede da intro.',
        en: "I'm an Atlético fan: that's the Galo crest framed on the wall in the intro.",
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
