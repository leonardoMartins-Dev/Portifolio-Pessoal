import { skills } from '../../content/skills.js';

/**
 * Objetos clicáveis da mesa 3D e o app que cada um abre (dados puros,
 * testáveis). O clique abre o notebook e, depois da tela de bloqueio, o app.
 */
export const DESK_SHORTCUTS = {
  phone: 'contact',
  books: 'skills',
  resume: 'resume',
  figure: 'about',
  racket: 'about',
  frame: 'about',
};

/** Atalhos acessíveis pelo teclado: um botão por app, sem repetir. */
export const SHORTCUT_APPS = [...new Set(Object.values(DESK_SHORTCUTS))];

/** Títulos das lombadas: a primeira skill de cada grupo com ícone (linguagens, frameworks, bancos). */
export const BOOK_TITLES = skills
  .filter((group) => group.layout === 'icons')
  .flatMap((group) => group.items.slice(0, group.id === 'programming' ? 2 : 1))
  .map((item) => (typeof item.name === 'string' ? item.name : item.name.en))
  .slice(0, 4);
