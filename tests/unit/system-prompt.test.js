import { describe, expect, it } from 'vitest';
import { certificates } from '../../src/content/certificates.js';
import { experiences } from '../../src/content/experiences.js';
import { profile } from '../../src/content/profile.js';
import { projects } from '../../src/content/projects.js';
import { buildSystemPrompt } from '../../src/lib/ai/system-prompt.js';
import { assistantTools } from '../../src/lib/ai/tools.js';
import { APP_IDS } from '../../src/lib/apps-meta.js';

describe('prompt de sistema do assistente', () => {
  const prompt = buildSystemPrompt({ locale: 'pt' });

  it('contém todos os projetos', () => {
    for (const project of projects) {
      expect(prompt).toContain(project.id);
      expect(prompt).toContain(project.name);
    }
  });

  it('contém todas as experiências e o perfil', () => {
    for (const experience of experiences) expect(prompt).toContain(experience.organization);
    expect(prompt).toContain(profile.name);
    expect(prompt).toContain(profile.email);
  });

  it('contém os certificados', () => {
    for (const certificate of certificates) expect(prompt).toContain(certificate.name);
  });

  it('contém os hobbies do autor', () => {
    for (const hobby of profile.hobbies) expect(prompt).toContain(hobby.name.pt);
  });

  it('contém todos os apps', () => {
    for (const id of APP_IDS) expect(prompt).toContain(`- ${id} —`);
  });

  it('tem as regras principais', () => {
    expect(prompt).toContain('Nunca invente');
    expect(prompt).toContain('terceira pessoa');
    expect(prompt).toContain('<dados>');
    expect(prompt).toContain('<sistema>');
  });

  it('não contém variáveis de ambiente nem segredos', () => {
    for (const name of [
      'GOOGLE_GENERATIVE',
      'GEMINI_',
      'UPSTASH',
      'SPOTIFY_',
      'WAKATIME_',
      'GITHUB_TOKEN',
      'process.env',
      'AIza',
    ]) {
      expect(prompt).not.toContain(name);
    }
  });

  it('fica abaixo de ~6 mil tokens (≈ 4 caracteres por token)', () => {
    expect(prompt.length / 4).toBeLessThan(6000);
  });

  it('usa o idioma pedido como padrão para casos ambíguos', () => {
    expect(buildSystemPrompt({ locale: 'en' })).toContain('se for ambíguo, use inglês');
  });
});

describe('ferramentas do assistente', () => {
  it('são as quatro da especificação, todas sem execute (rodam no cliente)', () => {
    expect(Object.keys(assistantTools).sort()).toEqual(
      ['openApp', 'setLanguage', 'setTheme', 'showProject'].sort(),
    );
    for (const tool of Object.values(assistantTools)) expect(tool.execute).toBeUndefined();
  });

  it('openApp só aceita apps registrados', () => {
    const schema = assistantTools.openApp.inputSchema;
    expect(schema.safeParse({ appId: 'projects' }).success).toBe(true);
    expect(schema.safeParse({ appId: 'hack' }).success).toBe(false);
  });
});
