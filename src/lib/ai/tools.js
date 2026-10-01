import { z } from 'zod';
import { projects } from '../../content/projects.js';
import { LOCALES } from '../../i18n/locales.js';
import { APP_IDS } from '../apps-meta.js';

const projectIds = projects.map((project) => project.id);

/**
 * Ferramentas do assistente. São declaradas no servidor SEM `execute`:
 * o modelo pede a ação e quem executa é o navegador (client-tools.js).
 */
export const assistantTools = {
  openApp: {
    description: 'Abre (ou foca) um app do sistema para o visitante.',
    inputSchema: z.object({ appId: z.enum(APP_IDS).describe('ID do app') }),
  },
  showProject: {
    description: 'Abre o app Projetos rolado até um projeto específico, destacando-o.',
    inputSchema: z.object({
      projectId: (projectIds.length ? z.enum(projectIds) : z.string()).describe('ID do projeto'),
    }),
  },
  setLanguage: {
    description: 'Troca o idioma da interface. Use só quando o visitante pedir.',
    inputSchema: z.object({ locale: z.enum(LOCALES) }),
  },
  setTheme: {
    description: 'Troca o tema da interface. Use só quando o visitante pedir.',
    inputSchema: z.object({ theme: z.enum(['light', 'dark']) }),
  },
};
