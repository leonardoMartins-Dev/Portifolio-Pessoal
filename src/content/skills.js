/**
 * @typedef {object} Skill
 * @property {string|{pt: string, en: string}} name
 * @property {string} [icon] arquivo em public/skills/: `{icon}.svg` ou, com `themed`, `{icon}-light.svg` e `{icon}-dark.svg`
 * @property {boolean} [themed] o ícone tem uma versão para cada tema
 * @property {boolean} [learning] em estudo
 * @property {{pt: string, en: string}} [note] complemento curto (ex.: nível do idioma)
 *
 * @typedef {object} SkillGroup
 * @property {string} id
 * @property {{pt: string, en: string}} title
 * @property {'code'|'frameworks'|'databases'|'tools'|'concepts'|'languages'} icon
 * @property {'icons'|'chips'|'list'} layout grade de ícones, chips de texto ou lista com complemento
 * @property {Skill[]} items
 */

// Fontes: currículo e seção "Stack e Ferramentas" do README do GitHub.
// Ícones no estilo do skillicons.dev (MIT); Thymeleaf, Scrapy e Spring Security foram
// desenhados no mesmo formato a partir do Simple Icons.
/** @type {SkillGroup[]} */
export const skills = [
  {
    id: 'programming',
    title: { pt: 'Linguagens', en: 'Programming languages' },
    icon: 'code',
    layout: 'icons',
    items: [
      { name: 'Java', icon: 'java', themed: true },
      { name: 'Python', icon: 'python', themed: true },
      { name: 'JavaScript', icon: 'javascript' },
      { name: 'HTML', icon: 'html' },
      { name: 'CSS', icon: 'css' },
    ],
  },
  {
    id: 'frameworks',
    title: { pt: 'Frameworks e bibliotecas', en: 'Frameworks and libraries' },
    icon: 'frameworks',
    layout: 'icons',
    items: [
      { name: 'Spring Boot', icon: 'spring', themed: true },
      { name: 'Spring Security', icon: 'spring-security', themed: true },
      { name: 'Thymeleaf', icon: 'thymeleaf', themed: true },
      { name: 'Bootstrap', icon: 'bootstrap' },
      { name: 'Scrapy', icon: 'scrapy', themed: true },
    ],
  },
  {
    id: 'databases',
    title: { pt: 'Bancos de dados', en: 'Databases' },
    icon: 'databases',
    layout: 'icons',
    items: [
      { name: 'PostgreSQL', icon: 'postgresql', themed: true },
      { name: 'Supabase', icon: 'supabase', themed: true },
      { name: 'SQLite', icon: 'sqlite', learning: true },
      { name: 'MongoDB', icon: 'mongodb', learning: true },
    ],
  },
  {
    id: 'tools',
    title: { pt: 'Ferramentas', en: 'Tools' },
    icon: 'tools',
    layout: 'icons',
    items: [
      { name: 'Git', icon: 'git' },
      { name: 'GitHub', icon: 'github', themed: true },
      { name: 'Maven', icon: 'maven', themed: true },
      { name: 'Postman', icon: 'postman' },
      { name: 'IntelliJ IDEA', icon: 'intellij', themed: true },
      { name: 'VS Code', icon: 'vscode', themed: true },
    ],
  },
  {
    id: 'concepts',
    title: { pt: 'Conceitos', en: 'Concepts' },
    icon: 'concepts',
    layout: 'chips',
    items: [
      { name: { pt: 'Orientação a Objetos', en: 'Object-oriented programming' } },
      { name: { pt: 'Arquitetura em camadas (MVC)', en: 'Layered architecture (MVC)' } },
      { name: { pt: 'Autenticação e autorização', en: 'Authentication and authorization' } },
      { name: { pt: 'APIs REST', en: 'REST APIs' } },
      { name: 'Web scraping' },
    ],
  },
  {
    id: 'languages',
    title: { pt: 'Idiomas', en: 'Languages' },
    icon: 'languages',
    layout: 'list',
    items: [
      { name: { pt: 'Português', en: 'Portuguese' }, note: { pt: 'Nativo', en: 'Native' } },
      {
        name: { pt: 'Inglês', en: 'English' },
        note: {
          pt: 'Intermediário (leitura técnica avançada)',
          en: 'Intermediate (advanced technical reading)',
        },
      },
    ],
  },
];

/** Nome da skill no idioma atual (nomes próprios, como "Java", não são traduzidos). */
export function skillName(skill, locale) {
  return typeof skill.name === 'string' ? skill.name : skill.name[locale];
}
