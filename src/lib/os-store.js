import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { siteConfig } from '../site.config.js';
import { getAppMeta } from './apps-meta.js';
import { KEYS, local } from './storage.js';

/** Abaixo desta largura de área útil (tablets), as janelas abrem maximizadas. */
export const TABLET_MAX_WIDTH = 1024;
const CASCADE_STEP = 28;
const CASCADE_SLOTS = 6;
const EDGE_MARGIN = 16;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

/** Mantém o retângulo dentro da área útil, respeitando o tamanho mínimo. */
export function fitRect(rect, area, minSize) {
  const w = clamp(rect.w, Math.min(minSize.w, area.w), area.w);
  const h = clamp(rect.h, Math.min(minSize.h, area.h), area.h);
  return {
    x: clamp(rect.x, 0, area.w - w),
    y: clamp(rect.y, 0, area.h - h),
    w,
    h,
  };
}

function initialRect(appId, area, cascadeIndex) {
  const { defaultSize, minSize } = getAppMeta(appId);
  const w = Math.min(defaultSize.w, area.w - EDGE_MARGIN * 2);
  const h = Math.min(defaultSize.h, area.h - EDGE_MARGIN * 2);
  const offset = (cascadeIndex % CASCADE_SLOTS) * CASCADE_STEP;
  const x = (area.w - w) / 2 - ((CASCADE_SLOTS - 1) * CASCADE_STEP) / 2 + offset;
  const y = Math.max(EDGE_MARGIN, (area.h - h) / 2 - CASCADE_STEP * 2) + offset;
  return fitRect({ x: Math.round(x), y: Math.round(y), w, h }, area, minSize);
}

/** Janela visível mais ao topo (maior z), ignorando minimizadas. */
function topmostVisible(windows, excludeId) {
  return windows
    .filter((win) => win.id !== excludeId && win.state !== 'minimized')
    .reduce((top, win) => (!top || win.z > top.z ? win : top), null);
}

const defaultPrefs = {
  theme: 'system', // 'light' | 'dark' | 'system'
  wallpaper: siteConfig.defaultWallpaper,
  sound: false,
  reducedMotion: false,
  firstVisitDone: false,
};

function osState(set, get) {
  const updateWindow = (id, patch) =>
    set((state) => ({
      windows: state.windows.map((win) => (win.id === id ? { ...win, ...patch } : win)),
    }));

  return {
    phase: 'desktop', // 'intro' | 'boot' | 'lock' | 'desktop' | 'off'
    introMode: 'open', // 'open' | 'shutdown'
    // App a abrir quando o visitante sair da tela de bloqueio (atalho da mesa 3D ou notificação).
    pendingApp: null,
    // A tela de bloqueio veio do menu "Bloquear" (com o desktop já visível)?
    lockedFromDesktop: false,
    windows: [],
    focusedId: null,
    zCounter: 0,
    openedCount: 0,
    workArea: { w: 1280, h: 720 },
    launcherOpen: false,
    ...defaultPrefs,

    setPhase: (phase, introMode = 'open') => set({ phase, introMode, lockedFromDesktop: false }),

    setPendingApp: (pendingApp) => set({ pendingApp }),

    /** "Bloquear": a tela de bloqueio cobre o desktop; as janelas continuam abertas. */
    lock: () => set({ phase: 'lock', lockedFromDesktop: true, launcherOpen: false }),

    /** Sai da tela de bloqueio e devolve o app pendente (se houver), já limpo. */
    unlock: () => {
      const { pendingApp } = get();
      set({ phase: 'desktop', pendingApp: null, lockedFromDesktop: false });
      return pendingApp;
    },

    setWorkArea: (area) =>
      set((state) => ({
        workArea: area,
        windows: state.windows.map((win) => ({
          ...win,
          ...fitRect(win, area, getAppMeta(win.appId).minSize),
        })),
      })),

    /** Abre o app; se já estiver aberto, restaura e foca (cada app é único). */
    openApp: (appId) => {
      const existing = get().windows.find((win) => win.appId === appId);
      if (existing) {
        get().focusWindow(existing.id);
        return existing.id;
      }
      const { workArea, zCounter, openedCount } = get();
      const z = zCounter + 1;
      const win = {
        id: appId,
        appId,
        ...initialRect(appId, workArea, openedCount),
        z,
        state: workArea.w < TABLET_MAX_WIDTH ? 'maximized' : 'normal',
        restoreState: 'normal',
      };
      set((state) => ({
        windows: [...state.windows, win],
        focusedId: win.id,
        zCounter: z,
        openedCount: state.openedCount + 1,
      }));
      return win.id;
    },

    focusWindow: (id) => {
      const win = get().windows.find((w) => w.id === id);
      if (!win) return;
      const z = get().zCounter + 1;
      const state = win.state === 'minimized' ? win.restoreState : win.state;
      updateWindow(id, { z, state });
      set({ focusedId: id, zCounter: z });
    },

    closeWindow: (id) =>
      set((state) => {
        const windows = state.windows.filter((win) => win.id !== id);
        const focusedId =
          state.focusedId === id ? (topmostVisible(windows)?.id ?? null) : state.focusedId;
        return { windows, focusedId };
      }),

    closeAll: () => set({ windows: [], focusedId: null }),

    minimizeWindow: (id) =>
      set((state) => {
        const win = state.windows.find((w) => w.id === id);
        if (!win || win.state === 'minimized') return {};
        const windows = state.windows.map((w) =>
          w.id === id ? { ...w, state: 'minimized', restoreState: w.state } : w,
        );
        const focusedId =
          state.focusedId === id ? (topmostVisible(windows, id)?.id ?? null) : state.focusedId;
        return { windows, focusedId };
      }),

    toggleMaximize: (id) => {
      const win = get().windows.find((w) => w.id === id);
      if (!win) return;
      updateWindow(id, { state: win.state === 'maximized' ? 'normal' : 'maximized' });
      get().focusWindow(id);
    },

    moveWindow: (id, x, y) => {
      const { workArea, windows } = get();
      const win = windows.find((w) => w.id === id);
      if (!win || win.state !== 'normal') return;
      updateWindow(id, fitRect({ ...win, x, y }, workArea, getAppMeta(win.appId).minSize));
    },

    resizeWindow: (id, rect) => {
      const { workArea, windows } = get();
      const win = windows.find((w) => w.id === id);
      if (!win || win.state !== 'normal') return;
      const { minSize } = getAppMeta(win.appId);
      const w = Math.max(rect.w, minSize.w);
      const h = Math.max(rect.h, minSize.h);
      updateWindow(id, fitRect({ x: rect.x, y: rect.y, w, h }, workArea, minSize));
    },

    openLauncher: () => set({ launcherOpen: true }),
    closeLauncher: () => set({ launcherOpen: false }),
    toggleLauncher: () => set((state) => ({ launcherOpen: !state.launcherOpen })),

    setTheme: (theme) => set({ theme }),
    setWallpaper: (wallpaper) => set({ wallpaper }),
    setSound: (sound) => set({ sound }),
    setReducedMotion: (reducedMotion) => set({ reducedMotion }),
    markFirstVisitDone: () => set({ firstVisitDone: true }),
  };
}

/**
 * Cria o store do sistema. Preferências (tema, papel de parede, sons,
 * movimento, primeira visita) persistem no localStorage.
 */
export function createOSStore({ persistPrefs = true } = {}) {
  if (!persistPrefs) return create(osState);
  return create(
    persist(osState, {
      name: KEYS.prefs,
      storage: createJSONStorage(() => local),
      partialize: (state) => ({
        theme: state.theme,
        wallpaper: state.wallpaper,
        sound: state.sound,
        reducedMotion: state.reducedMotion,
        firstVisitDone: state.firstVisitDone,
      }),
    }),
  );
}

export const useOS = createOSStore();
