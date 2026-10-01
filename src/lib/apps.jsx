import {
  Activity,
  Bot,
  BriefcaseBusiness,
  FileText,
  FolderKanban,
  Info,
  Mail,
  Music,
  Settings,
  Sparkles,
  SquareTerminal,
  UserRound,
} from 'lucide-react';
import { lazy } from 'react';
import { APP_META } from './apps-meta.js';

const icons = {
  about: UserRound,
  projects: FolderKanban,
  experience: BriefcaseBusiness,
  skills: Sparkles,
  resume: FileText,
  contact: Mail,
  music: Music,
  activity: Activity,
  assistant: Bot,
  terminal: SquareTerminal,
  settings: Settings,
  system: Info,
};

// Cada app é carregado sob demanda, na primeira vez que abre.
const components = {
  about: lazy(() => import('../components/apps/About.jsx')),
  projects: lazy(() => import('../components/apps/Projects.jsx')),
  experience: lazy(() => import('../components/apps/Experience.jsx')),
  skills: lazy(() => import('../components/apps/Skills.jsx')),
  resume: lazy(() => import('../components/apps/Resume.jsx')),
  contact: lazy(() => import('../components/apps/Contact.jsx')),
  music: lazy(() => import('../components/apps/Music.jsx')),
  activity: lazy(() => import('../components/apps/Activity.jsx')),
  assistant: lazy(() => import('../components/apps/Assistant.jsx')),
  terminal: lazy(() => import('../components/apps/Terminal.jsx')),
  settings: lazy(() => import('../components/apps/Settings.jsx')),
  system: lazy(() => import('../components/apps/System.jsx')),
};

/**
 * Registro único dos apps. Dock, desktop, grade mobile, Terminal e
 * as ferramentas do assistente leem daqui.
 */
export const apps = APP_META.map((meta) => ({
  ...meta,
  icon: icons[meta.id],
  component: components[meta.id],
}));

export function getApp(id) {
  return apps.find((app) => app.id === id);
}
