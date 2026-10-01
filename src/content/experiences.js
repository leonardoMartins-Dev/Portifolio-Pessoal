/**
 * @typedef {'job'|'internship'|'freelance'|'open-source'|'event'|'research'|'volunteer'} ExperienceType
 *
 * @typedef {object} Experience
 * @property {string} id
 * @property {string} organization
 * @property {{pt: string, en: string}} role
 * @property {ExperienceType} type
 * @property {string} start 'YYYY-MM'
 * @property {string|null} end 'YYYY-MM' ou null (atual)
 * @property {{pt: string, en: string}} [location]
 * @property {{pt: string, en: string}} description
 * @property {string} [url]
 * @property {string[]} [technologies]
 */

export const EXPERIENCE_TYPES = [
  'job',
  'internship',
  'freelance',
  'open-source',
  'event',
  'research',
  'volunteer',
];

// TODO(conteúdo): substituir as 2 experiências de exemplo pelas reais.
/** @type {Experience[]} */
export const experiences = [
  {
    id: 'exemplo-estagio',
    organization: 'Organização de exemplo',
    role: { pt: 'Cargo (a preencher)', en: 'Role (to be filled in)' },
    type: 'internship',
    start: '2025-08',
    end: null,
    description: {
      pt: 'Descrição da experiência (a preencher).',
      en: 'Experience description (to be filled in).',
    },
  },
  {
    id: 'exemplo-evento',
    organization: 'Evento de exemplo',
    role: { pt: 'Participação (a preencher)', en: 'Participation (to be filled in)' },
    type: 'event',
    start: '2025-05',
    end: '2025-05',
    description: {
      pt: 'Descrição da experiência (a preencher).',
      en: 'Experience description (to be filled in).',
    },
  },
];
