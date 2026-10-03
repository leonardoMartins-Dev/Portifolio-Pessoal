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

// Fonte: currículo.
/** @type {Experience[]} */
export const experiences = [
  {
    id: 'tropeiro-tia-bete',
    organization: 'Restaurante Tropeiro da Tia Bete',
    role: {
      pt: 'Auxiliar Administrativo e Operacional',
      en: 'Administrative and Operations Assistant',
    },
    type: 'job',
    start: '2026-01',
    end: null,
    location: { pt: 'Belo Horizonte, MG', en: 'Belo Horizonte, MG, Brazil' },
    description: {
      pt: 'Criei e gerencio os canais de delivery do restaurante nas plataformas iFood e 99Food. Também cuido das redes sociais do estabelecimento e opero o caixa, organizando o fluxo de atendimento ao cliente.',
      en: "Set up and manage the restaurant's delivery channels on the iFood and 99Food platforms. I also run the restaurant's social media and operate the cash register, organizing the customer service flow.",
    },
  },
];
