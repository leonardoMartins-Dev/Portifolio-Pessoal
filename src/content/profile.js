import { siteConfig } from '../site.config.js';

/**
 * @typedef {{ pt: string, en: string }} Localized
 */

/** Perfil do autor. Alimenta o app Sobre, o Terminal e o prompt do assistente. */
export const profile = {
  name: siteConfig.author.name,
  // TODO(conteúdo): confirmar o cargo/título.
  role: {
    pt: 'Estudante de Engenharia de Software',
    en: 'Software Engineering Student',
  },
  // TODO(conteúdo): cidade/estado.
  location: {
    pt: 'Localização (a preencher)',
    en: 'Location (to be filled in)',
  },
  // TODO(conteúdo): apresentação curta.
  bio: {
    pt: 'Apresentação curta (a preencher).',
    en: 'Short introduction (to be filled in).',
  },
  // TODO(conteúdo): formação (curso, instituição, período).
  education: {
    pt: 'Formação (a preencher).',
    en: 'Education (to be filled in).',
  },
  // TODO(conteúdo): interesses e área de atuação.
  interests: {
    pt: 'Interesses e área de atuação (a preencher).',
    en: 'Interests and focus area (to be filled in).',
  },
  // TODO(conteúdo): objetivos profissionais.
  goals: {
    pt: 'Objetivos profissionais (a preencher).',
    en: 'Career goals (to be filled in).',
  },
  // TODO(conteúdo): adicionar a foto em public/images/profile.jpg.
  photo: '/images/profile.jpg',
  email: siteConfig.social.email,
  whatsapp: siteConfig.social.whatsapp,
  links: {
    github: siteConfig.social.github,
    linkedin: siteConfig.social.linkedin,
  },
  // TODO(conteúdo): adicionar os PDFs em public/cv/ (e, opcional, a prévia PNG da 1ª página).
  resume: {
    pt: '/cv/cv-pt.pdf',
    en: '/cv/cv-en.pdf',
  },
  resumePreview: {
    pt: '/cv/cv-pt.png',
    en: '/cv/cv-en.png',
  },
};
