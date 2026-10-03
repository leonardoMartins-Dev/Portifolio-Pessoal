import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  BOOK_TITLES,
  DESK_SHORTCUTS,
  SHORTCUT_APPS,
} from '../../src/components/intro/desk-objects.js';
import { isAppId } from '../../src/lib/apps-meta.js';

const MODELS_DIR = 'public/models';
const HDRI_DIR = 'public/hdri';
// Orçamento da intro: o que a primeira visita baixa (todos os modelos + a HDRI de um tema).
const ASSETS_BUDGET_BYTES = 3 * 1024 * 1024;

function sizes(dir, extension) {
  return readdirSync(dir)
    .filter((name) => name.endsWith(extension))
    .map((name) => statSync(join(dir, name)).size);
}

describe('mesa 3D da intro', () => {
  it('todo objeto clicável abre um app que existe', () => {
    for (const appId of Object.values(DESK_SHORTCUTS)) expect(isAppId(appId)).toBe(true);
  });

  it('os atalhos acessíveis cobrem cada app uma vez', () => {
    expect(new Set(SHORTCUT_APPS).size).toBe(SHORTCUT_APPS.length);
    expect([...SHORTCUT_APPS].sort()).toEqual([...new Set(Object.values(DESK_SHORTCUTS))].sort());
  });

  it('as lombadas dos livros vêm das skills', () => {
    expect(BOOK_TITLES).toHaveLength(4);
    for (const title of BOOK_TITLES) expect(title.trim()).not.toBe('');
  });

  it('modelos + uma HDRI cabem no orçamento de ~3 MB', () => {
    const models = sizes(MODELS_DIR, '.glb');
    const hdris = sizes(HDRI_DIR, '.hdr');
    expect(models.length).toBeGreaterThan(0);
    expect(hdris).toHaveLength(2);
    const total = models.reduce((sum, size) => sum + size, 0) + Math.max(...hdris);
    expect(total).toBeLessThanOrEqual(ASSETS_BUDGET_BYTES);
  });
});
