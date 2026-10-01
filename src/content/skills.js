/**
 * @typedef {object} SkillGroup
 * @property {string} id
 * @property {{pt: string, en: string}} title
 * @property {'frontend'|'backend'|'tools'|'languages'} icon
 * @property {{name: string, level?: 1|2|3|4|5}[]} items
 */

// TODO(conteúdo): preencher os grupos com as skills reais (nível 1–5 é opcional).
/** @type {SkillGroup[]} */
export const skills = [
  {
    id: 'frontend',
    title: { pt: 'Front-end', en: 'Front-end' },
    icon: 'frontend',
    items: [{ name: 'Skill de exemplo', level: 3 }],
  },
  {
    id: 'backend',
    title: { pt: 'Back-end', en: 'Back-end' },
    icon: 'backend',
    items: [{ name: 'Skill de exemplo', level: 2 }],
  },
  {
    id: 'tools',
    title: { pt: 'Ferramentas', en: 'Tools' },
    icon: 'tools',
    items: [{ name: 'Skill de exemplo' }],
  },
  {
    id: 'languages',
    title: { pt: 'Idiomas', en: 'Languages' },
    icon: 'languages',
    items: [{ name: 'Idioma de exemplo' }],
  },
];
