import { beforeEach, describe, expect, it } from 'vitest';
import { getAppMeta } from '../../src/lib/apps-meta.js';
import { createOSStore, fitRect } from '../../src/lib/os-store.js';

let store;
const state = () => store.getState();
const win = (id) => state().windows.find((w) => w.id === id);

beforeEach(() => {
  store = createOSStore({ persistPrefs: false });
  state().setWorkArea({ w: 1440, h: 784 });
});

describe('gerenciador de janelas', () => {
  it('abre um app como janela focada, no topo', () => {
    state().openApp('about');
    expect(state().windows).toHaveLength(1);
    expect(state().focusedId).toBe('about');
    expect(win('about').state).toBe('normal');
  });

  it('cada app é único: abrir de novo só foca', () => {
    state().openApp('about');
    state().openApp('projects');
    state().openApp('about');
    expect(state().windows).toHaveLength(2);
    expect(state().focusedId).toBe('about');
    expect(win('about').z).toBeGreaterThan(win('projects').z);
  });

  it('focar traz a janela para a frente', () => {
    state().openApp('about');
    state().openApp('projects');
    state().focusWindow('about');
    expect(state().focusedId).toBe('about');
    expect(win('about').z).toBeGreaterThan(win('projects').z);
  });

  it('abre em cascata (posições diferentes)', () => {
    state().openApp('skills');
    state().openApp('settings');
    expect(win('skills').x).not.toBe(win('settings').x);
  });

  it('minimizar passa o foco para a próxima janela visível', () => {
    state().openApp('about');
    state().openApp('projects');
    state().minimizeWindow('projects');
    expect(win('projects').state).toBe('minimized');
    expect(state().focusedId).toBe('about');
  });

  it('abrir um app minimizado restaura e foca', () => {
    state().openApp('about');
    state().minimizeWindow('about');
    expect(state().focusedId).toBeNull();
    state().openApp('about');
    expect(win('about').state).toBe('normal');
    expect(state().focusedId).toBe('about');
  });

  it('maximizar e restaurar', () => {
    state().openApp('about');
    state().toggleMaximize('about');
    expect(win('about').state).toBe('maximized');
    state().toggleMaximize('about');
    expect(win('about').state).toBe('normal');
  });

  it('minimizar uma janela maximizada e restaurar volta maximizada', () => {
    state().openApp('about');
    state().toggleMaximize('about');
    state().minimizeWindow('about');
    state().focusWindow('about');
    expect(win('about').state).toBe('maximized');
  });

  it('fechar remove a janela e foca a de cima', () => {
    state().openApp('about');
    state().openApp('projects');
    state().closeWindow('projects');
    expect(win('projects')).toBeUndefined();
    expect(state().focusedId).toBe('about');
    state().closeWindow('about');
    expect(state().focusedId).toBeNull();
  });

  it('mover mantém a janela dentro da área útil', () => {
    state().openApp('about');
    state().moveWindow('about', -500, 99999);
    const { x, y, h } = win('about');
    expect(x).toBe(0);
    expect(y).toBe(784 - h);
  });

  it('redimensionar respeita o tamanho mínimo', () => {
    state().openApp('about');
    const { minSize } = getAppMeta('about');
    state().resizeWindow('about', { x: 10, y: 10, w: 50, h: 50 });
    expect(win('about').w).toBe(minSize.w);
    expect(win('about').h).toBe(minSize.h);
  });

  it('em tablets (área < 1024px) as janelas abrem maximizadas', () => {
    state().setWorkArea({ w: 900, h: 900 });
    state().openApp('projects');
    expect(win('projects').state).toBe('maximized');
  });

  it('não move janela maximizada', () => {
    state().openApp('about');
    state().toggleMaximize('about');
    const before = { ...win('about') };
    state().moveWindow('about', 5, 5);
    expect(win('about').x).toBe(before.x);
  });
});

describe('fitRect', () => {
  it('encolhe janelas maiores que a área', () => {
    const rect = fitRect({ x: 0, y: 0, w: 2000, h: 2000 }, { w: 800, h: 600 }, { w: 300, h: 200 });
    expect(rect).toEqual({ x: 0, y: 0, w: 800, h: 600 });
  });
});
