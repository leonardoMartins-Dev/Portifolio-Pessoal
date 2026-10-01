import { siteConfig } from '../site.config.js';

/**
 * @typedef {object} Project
 * @property {string} id
 * @property {string} name
 * @property {string} date 'YYYY-MM' — define a ordem da timeline (crescente)
 * @property {{pt: string, en: string}} description
 * @property {{pt: string, en: string}} [details]
 * @property {string[]} technologies
 * @property {string} repoUrl
 * @property {string} [demoUrl]
 * @property {{type: 'gif'|'image'|'video', src: string, poster?: string, alt: {pt: string, en: string}}} media
 * @property {boolean} [featured]
 */

const placeholderMedia = {
  type: 'image',
  src: '/projects/placeholder.svg',
  alt: { pt: 'Imagem de exemplo', en: 'Placeholder image' },
};

// TODO(conteúdo): substituir os 3 projetos de exemplo pelos projetos reais.
// As datas diferentes servem só para demonstrar a timeline.
/** @type {Project[]} */
export const projects = [
  {
    id: 'exemplo-1',
    name: 'Projeto de exemplo 1',
    date: '2025-03',
    description: {
      pt: 'Descrição do projeto (a preencher).',
      en: 'Project description (to be filled in).',
    },
    technologies: ['Tech A', 'Tech B'],
    repoUrl: siteConfig.social.github,
    media: placeholderMedia,
  },
  {
    id: 'exemplo-2',
    name: 'Projeto de exemplo 2',
    date: '2025-09',
    description: {
      pt: 'Descrição do projeto (a preencher).',
      en: 'Project description (to be filled in).',
    },
    technologies: ['Tech B', 'Tech C'],
    repoUrl: siteConfig.social.github,
    media: placeholderMedia,
  },
  {
    id: 'exemplo-3',
    name: 'Projeto de exemplo 3',
    date: '2026-04',
    description: {
      pt: 'Descrição do projeto (a preencher).',
      en: 'Project description (to be filled in).',
    },
    details: {
      pt: 'Detalhes do projeto: desafios, decisões e aprendizados (a preencher).',
      en: 'Project details: challenges, decisions and lessons (to be filled in).',
    },
    technologies: ['Tech A', 'Tech C'],
    repoUrl: siteConfig.social.github,
    media: placeholderMedia,
    featured: true,
  },
];
