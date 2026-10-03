/**
 * @typedef {object} Certificate
 * @property {string} id
 * @property {string} name nome como está no certificado (não se traduz)
 * @property {string} issuer quem emitiu
 * @property {string} date 'YYYY-MM-DD' — o app mostra do mais recente ao mais antigo
 * @property {number} [hours] carga horária
 * @property {{pt: string, en: string}} description
 * @property {{pt: string, en: string}[]} [topics]
 * @property {string} [file] PDF em public/certificates/
 * @property {string} [image] prévia em public/certificates/ (sem ela, o card mostra um ícone)
 * @property {string} [credentialUrl] página pública de verificação (o QR code do certificado)
 */

/**
 * Certificados do autor. Para adicionar um novo:
 * 1. coloque o PDF em public/certificates/ (e, se quiser, uma prévia .webp ou .png);
 * 2. acrescente um item nesta lista. A ordem não importa: o app ordena pela data.
 */
/** @type {Certificate[]} */
export const certificates = [
  {
    id: 'gemini-academy-2026',
    name: 'Gemini Academy para Universitários 2026',
    issuer: 'Google for Education',
    date: '2026-10-02',
    hours: 2,
    description: {
      pt: 'Princípios básicos e estratégias para o uso educacional do Gemini, a IA do Google.',
      en: "Basic principles and strategies for using Gemini, Google's AI, in education.",
    },
    topics: [
      { pt: 'Gemini', en: 'Gemini' },
      { pt: 'IA generativa', en: 'Generative AI' },
      { pt: 'IA na educação', en: 'AI in education' },
    ],
    file: '/certificates/gemini-academy-2026.pdf',
    image: '/certificates/gemini-academy-2026.webp',
    credentialUrl: 'https://cert.ninja/ykfn26bycvnxc67i',
  },
];
