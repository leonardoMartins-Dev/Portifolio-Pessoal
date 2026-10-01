import { describe, expect, it } from 'vitest';
import { experiences } from '../../src/content/experiences.js';
import { profile } from '../../src/content/profile.js';
import { projects } from '../../src/content/projects.js';
import { skills } from '../../src/content/skills.js';
import i18n from '../../src/i18n/index.js';
import { APP_META } from '../../src/lib/apps-meta.js';
import {
  complete,
  findApp,
  parseCommand,
  resolveCommand,
  runCommand,
} from '../../src/lib/terminal.js';
import { siteConfig } from '../../src/site.config.js';

const ctx = {
  t: i18n.getFixedT('pt'),
  locale: 'pt',
  l: (value) => value?.pt ?? '',
  content: { profile, projects, experiences, skills },
  apps: APP_META,
  site: siteConfig,
  theme: 'dark',
  uptimeMinutes: 3,
  resolution: '1440x900',
};

describe('parser do Terminal', () => {
  it('separa comando e argumentos', () => {
    expect(parseCommand('  open   projects ')).toEqual({
      name: 'open',
      args: ['projects'],
      rest: 'projects',
    });
    expect(parseCommand('ask Ele sabe React?')).toMatchObject({
      name: 'ask',
      rest: 'Ele sabe React?',
    });
    expect(parseCommand('   ')).toEqual({ name: '', args: [], rest: '' });
  });

  it('resolve aliases em PT/EN, com ou sem acento', () => {
    expect(resolveCommand('ajuda')).toBe('help');
    expect(resolveCommand('PROJETOS')).toBe('projects');
    expect(resolveCommand('experiências')).toBe('experience');
    expect(resolveCommand('curriculo')).toBe('resume');
    expect(resolveCommand('limpar')).toBe('clear');
    expect(resolveCommand('rm')).toBeNull();
  });

  it('encontra apps pelo id ou pelo nome traduzido', () => {
    expect(findApp('projects', APP_META)?.id).toBe('projects');
    expect(findApp('Projetos', APP_META)?.id).toBe('projects');
    expect(findApp('sobre este sistema', APP_META)?.id).toBe('system');
    expect(findApp('nada', APP_META)).toBeNull();
  });
});

describe('comandos do Terminal', () => {
  it('help lista todos os comandos', () => {
    const { lines } = runCommand('help', ctx);
    const text = lines.map((line) => line.text).join('\n');
    for (const name of ['about', 'projects', 'open <app>', 'lang <pt|en>', 'neofetch', 'clear']) {
      expect(text).toContain(name);
    }
  });

  it('open abre o app pedido', () => {
    expect(runCommand('open projetos', ctx).effects).toEqual([{ type: 'open', appId: 'projects' }]);
    expect(runCommand('abrir contact', ctx).effects).toEqual([{ type: 'open', appId: 'contact' }]);
  });

  it('open sem app mostra o uso; app inexistente mostra erro', () => {
    expect(runCommand('open', ctx).lines[0].kind).toBe('error');
    expect(runCommand('open xyz', ctx).lines[0].text).toContain('xyz');
  });

  it('lang e theme validam o argumento', () => {
    expect(runCommand('lang en', ctx).effects).toEqual([{ type: 'lang', locale: 'en' }]);
    expect(runCommand('lang fr', ctx).effects).toEqual([]);
    expect(runCommand('tema light', ctx).effects).toEqual([{ type: 'theme', theme: 'light' }]);
  });

  it('ask envia a pergunta ao assistente', () => {
    expect(runCommand('ask Quais projetos?', ctx).effects).toEqual([
      { type: 'ask', question: 'Quais projetos?' },
    ]);
  });

  it('projects lista os projetos em ordem crescente', () => {
    const { lines } = runCommand('projetos', ctx);
    expect(lines.map((line) => line.text.includes(projects[0].name)).filter(Boolean)).toHaveLength(
      1,
    );
    expect(lines).toHaveLength(projects.length);
  });

  it('contact mostra os canais com links', () => {
    const { lines } = runCommand('contato', ctx);
    expect(lines.some((line) => line.href === `mailto:${profile.email}`)).toBe(true);
  });

  it('whoami e neofetch usam o perfil', () => {
    expect(runCommand('whoami', ctx).lines[0].text).toContain(profile.name);
    const neofetch = runCommand('neofetch', ctx)
      .lines.map((line) => line.text)
      .join('\n');
    expect(neofetch).toContain(siteConfig.system.name);
    expect(neofetch).toContain('1440x900');
  });

  it('clear limpa a tela; comando desconhecido mostra erro', () => {
    expect(runCommand('clear', ctx).effects).toEqual([{ type: 'clear' }]);
    expect(runCommand('sudo rm', ctx).lines[0].kind).toBe('error');
  });
});

describe('autocompletar (Tab)', () => {
  it('completa comandos e argumentos', () => {
    expect(complete('neo', APP_META)).toEqual({ value: 'neofetch ' });
    expect(complete('open proj', APP_META)).toEqual({ value: 'open projects ' });
    expect(complete('lang e', APP_META)).toEqual({ value: 'lang en ' });
  });

  it('mostra os candidatos quando há vários', () => {
    expect(complete('c', APP_META).candidates).toEqual(
      expect.arrayContaining(['contact', 'clear']),
    );
  });
});
