/**
 * Metadados dos apps — dados puros, sem React, para poderem ser lidos
 * também no servidor (prompt do assistente, sitemap). Os ícones e
 * componentes ficam em `apps.jsx`.
 *
 * A ordem do array é a ordem do dock.
 */
export const APP_META = [
  {
    id: 'about',
    title: { pt: 'Sobre', en: 'About' },
    description: {
      pt: 'Quem é o autor: foto, apresentação, formação, interesses e objetivos.',
      en: 'Who the author is: photo, introduction, education, interests and goals.',
    },
    tint: ['#7c8cff', '#4f5bd5'],
    defaultSize: { w: 720, h: 540 },
    minSize: { w: 380, h: 320 },
    inDock: true,
    inMobileDock: true,
  },
  {
    id: 'projects',
    title: { pt: 'Projetos', en: 'Projects' },
    description: {
      pt: 'Linha do tempo dos projetos, do mais recente ao mais antigo (ou ao contrário), com tecnologias, GitHub e demonstração.',
      en: 'Project timeline, newest to oldest (or the other way around), with technologies, GitHub and demo.',
    },
    tint: ['#f6a86b', '#e0644a'],
    defaultSize: { w: 880, h: 620 },
    minSize: { w: 420, h: 360 },
    inDock: true,
    inMobileDock: true,
  },
  {
    id: 'experience',
    title: { pt: 'Experiências', en: 'Experience' },
    description: {
      pt: 'Experiências: organização, cargo, tipo, período e descrição.',
      en: 'Experience: organization, role, type, period and description.',
    },
    tint: ['#5fd3b0', '#1f9c87'],
    defaultSize: { w: 760, h: 560 },
    minSize: { w: 400, h: 340 },
    inDock: true,
    inMobileDock: false,
  },
  {
    id: 'skills',
    title: { pt: 'Skills', en: 'Skills' },
    description: {
      pt: 'Habilidades agrupadas: linguagens, frameworks, bancos de dados, ferramentas, conceitos e idiomas.',
      en: 'Grouped skills: programming languages, frameworks, databases, tools, concepts and languages.',
    },
    tint: ['#f7d36b', '#e3a72f'],
    defaultSize: { w: 680, h: 520 },
    minSize: { w: 360, h: 320 },
    inDock: true,
    inMobileDock: false,
  },
  {
    id: 'certificates',
    title: { pt: 'Certificados', en: 'Certificates' },
    description: {
      pt: 'Cursos e certificados concluídos, do mais recente ao mais antigo, com PDF e link de verificação.',
      en: 'Completed courses and certificates, newest first, with PDF and verification link.',
    },
    tint: ['#ff8a7a', '#d6404e'],
    defaultSize: { w: 760, h: 560 },
    minSize: { w: 380, h: 360 },
    inDock: true,
    inMobileDock: false,
  },
  {
    id: 'resume',
    title: { pt: 'Currículo', en: 'Résumé' },
    description: {
      pt: 'Currículo em PDF no idioma atual, com download em PT e EN.',
      en: 'Résumé PDF in the current language, downloadable in PT and EN.',
    },
    tint: ['#c9cdd6', '#8a90a0'],
    defaultSize: { w: 820, h: 680 },
    minSize: { w: 420, h: 400 },
    inDock: true,
    inMobileDock: false,
  },
  {
    id: 'contact',
    title: { pt: 'Contato', en: 'Contact' },
    description: {
      pt: 'E-mail, WhatsApp, LinkedIn, GitHub e um formulário que envia mensagem por e-mail.',
      en: 'Email, WhatsApp, LinkedIn, GitHub and a form that sends a message by email.',
    },
    tint: ['#6fc3ff', '#2f86e0'],
    defaultSize: { w: 680, h: 620 },
    minSize: { w: 360, h: 420 },
    inDock: true,
    inMobileDock: true,
  },
  {
    id: 'music',
    title: { pt: 'Música', en: 'Music' },
    description: {
      pt: 'O que o autor está ouvindo agora no Spotify, faixas recentes e mais ouvidas.',
      en: 'What the author is listening to on Spotify now, recent and top tracks.',
    },
    tint: ['#ff8fb1', '#e2457a'],
    defaultSize: { w: 560, h: 640 },
    minSize: { w: 340, h: 420 },
    inDock: true,
    inMobileDock: false,
  },
  {
    id: 'activity',
    title: { pt: 'Atividade', en: 'Activity' },
    description: {
      pt: 'Horas programando na última semana e linguagens mais usadas (WakaTime).',
      en: 'Hours coding in the last week and most used languages (WakaTime).',
    },
    tint: ['#a6e06b', '#58b23a'],
    defaultSize: { w: 680, h: 540 },
    minSize: { w: 360, h: 360 },
    inDock: true,
    inMobileDock: false,
  },
  {
    id: 'github',
    title: { pt: 'GitHub', en: 'GitHub' },
    description: {
      pt: 'GitHub ao vivo: gráfico de contribuições do último ano, repositórios recentes e últimos commits.',
      en: 'Live GitHub: contribution graph for the last year, recent repositories and latest commits.',
    },
    tint: ['#4cc38a', '#1f7a4d'],
    defaultSize: { w: 760, h: 640 },
    minSize: { w: 380, h: 380 },
    inDock: true,
    inMobileDock: false,
  },
  {
    id: 'assistant',
    title: { pt: 'Assistente', en: 'Assistant' },
    description: {
      pt: 'Assistente de IA que responde sobre o autor e o sistema e abre apps.',
      en: 'AI assistant that answers about the author and the system and opens apps.',
    },
    tint: ['#b48cff', '#7a4fe0'],
    defaultSize: { w: 540, h: 660 },
    minSize: { w: 340, h: 420 },
    inDock: true,
    inMobileDock: true,
  },
  {
    id: 'terminal',
    title: { pt: 'Terminal', en: 'Terminal' },
    description: {
      pt: 'Terminal com comandos (help, about, projects, open, lang, ask…). Homenagem ao portfólio do professor.',
      en: "Terminal with commands (help, about, projects, open, lang, ask…). A tribute to the professor's portfolio.",
    },
    tint: ['#4a4f5c', '#1d2027'],
    defaultSize: { w: 720, h: 460 },
    minSize: { w: 380, h: 260 },
    inDock: true,
    inMobileDock: false,
  },
  {
    id: 'settings',
    title: { pt: 'Ajustes', en: 'Settings' },
    description: {
      pt: 'Idioma, tema, papel de parede, reduzir movimento, sons e rever a intro.',
      en: 'Language, theme, wallpaper, reduce motion, sounds and replay the intro.',
    },
    tint: ['#9aa3b5', '#5d6577'],
    defaultSize: { w: 620, h: 560 },
    minSize: { w: 360, h: 360 },
    inDock: true,
    inMobileDock: false,
  },
  {
    id: 'system',
    title: { pt: 'Sobre este sistema', en: 'About this system' },
    description: {
      pt: 'Nome e versão do sistema, tecnologias usadas, créditos e repositório.',
      en: 'System name and version, technologies used, credits and repository.',
    },
    tint: ['#7c8cff', '#2d3346'],
    defaultSize: { w: 540, h: 560 },
    minSize: { w: 340, h: 360 },
    // Abre pelo menu do logo, não pelo dock.
    inDock: false,
    inMobileDock: false,
  },
];

export const APP_IDS = APP_META.map((app) => app.id);

export const MAX_MOBILE_DOCK_APPS = 4;

export function isAppId(value) {
  return APP_IDS.includes(value);
}

export function getAppMeta(id) {
  const meta = APP_META.find((app) => app.id === id);
  if (!meta) throw new Error(`App não registrado: ${id}`);
  return meta;
}
