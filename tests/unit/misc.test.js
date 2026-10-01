import { describe, expect, it } from 'vitest';
import { experiences } from '../../src/content/experiences.js';
import { profile } from '../../src/content/profile.js';
import { projects } from '../../src/content/projects.js';
import { detectLocale } from '../../src/i18n/locales.js';
import { APP_IDS, APP_META, MAX_MOBILE_DOCK_APPS, isAppId } from '../../src/lib/apps-meta.js';
import { decideInitialPhase } from '../../src/lib/boot.js';
import { formatPhone } from '../../src/lib/email.js';
import { formatMonth, formatPeriod, splitDuration } from '../../src/lib/format.js';
import { localizedPath } from '../../src/lib/os-bridge.js';

const YEAR_MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

describe('registro de apps', () => {
  it('tem os 12 apps da especificação, com IDs únicos', () => {
    expect(APP_IDS).toEqual([
      'about',
      'projects',
      'experience',
      'skills',
      'resume',
      'contact',
      'music',
      'activity',
      'assistant',
      'terminal',
      'settings',
      'system',
    ]);
  });

  it('título e descrição nos dois idiomas; tamanho padrão ≥ mínimo', () => {
    for (const app of APP_META) {
      expect(app.title.pt && app.title.en, app.id).toBeTruthy();
      expect(app.description.pt && app.description.en, app.id).toBeTruthy();
      expect(app.defaultSize.w).toBeGreaterThanOrEqual(app.minSize.w);
      expect(app.defaultSize.h).toBeGreaterThanOrEqual(app.minSize.h);
    }
  });

  it(`no máximo ${MAX_MOBILE_DOCK_APPS} apps no dock do celular`, () => {
    expect(APP_META.filter((app) => app.inMobileDock).length).toBeLessThanOrEqual(
      MAX_MOBILE_DOCK_APPS,
    );
  });

  it('valida IDs vindos da URL', () => {
    expect(isAppId('projects')).toBe(true);
    expect(isAppId('projetos')).toBe(false);
  });
});

describe('conteúdo', () => {
  it('projetos e experiências têm IDs únicos e datas YYYY-MM', () => {
    for (const list of [projects, experiences]) {
      const ids = list.map((item) => item.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
    for (const project of projects) expect(project.date).toMatch(YEAR_MONTH);
    for (const experience of experiences) {
      expect(experience.start).toMatch(YEAR_MONTH);
      if (experience.end) expect(experience.end >= experience.start).toBe(true);
    }
  });

  it('WhatsApp só com dígitos e DDI', () => {
    expect(profile.whatsapp).toMatch(/^\d{12,15}$/);
    expect(formatPhone(profile.whatsapp)).toBe('+55 (31) 98745-1563');
  });
});

describe('formatação', () => {
  it('mês e período nos dois idiomas', () => {
    expect(formatMonth('2024-03', 'pt')).toBe('mar 2024');
    expect(formatMonth('2024-03', 'en')).toBe('Mar 2024');
    expect(formatPeriod('2024-03', null, 'pt', 'atual')).toBe('mar 2024 – atual');
    expect(formatPeriod('2024-03', null, 'en', 'Present')).toBe('Mar 2024 – Present');
    expect(formatPeriod('2025-05', '2025-05', 'pt', 'atual')).toBe('mai 2025');
  });

  it('duração em horas e minutos', () => {
    expect(splitDuration(3 * 3600 + 25 * 60)).toEqual({ hours: 3, minutes: 25 });
  });
});

describe('rotas e idioma', () => {
  it('troca o idioma mantendo o app e a busca', () => {
    expect(localizedPath('/pt/projects', '?project=x', 'en')).toBe('/en/projects?project=x');
    expect(localizedPath('/en', '', 'pt')).toBe('/pt');
  });

  it('detecta o idioma do navegador (padrão pt)', () => {
    expect(detectLocale(['en-US', 'pt-BR'])).toBe('en');
    expect(detectLocale(['pt-PT'])).toBe('pt');
    expect(detectLocale(['fr-FR'])).toBe('pt');
  });

  it('decide quando pular a intro (§8.3)', () => {
    const base = { introSeen: false, reducedMotion: false, supportsIntro: () => true };
    expect(decideInitialPhase({ ...base, pathname: '/pt' })).toBe('intro');
    expect(decideInitialPhase({ ...base, pathname: '/en/projects' })).toBe('desktop');
    expect(decideInitialPhase({ ...base, pathname: '/projects' })).toBe('desktop');
    expect(decideInitialPhase({ ...base, pathname: '/pt', introSeen: true })).toBe('boot');
    expect(decideInitialPhase({ ...base, pathname: '/pt', reducedMotion: true })).toBe('boot');
    expect(decideInitialPhase({ ...base, pathname: '/pt', supportsIntro: () => false })).toBe(
      'boot',
    );
  });
});
