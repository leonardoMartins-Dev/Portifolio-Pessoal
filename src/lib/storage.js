/**
 * Acesso seguro ao localStorage/sessionStorage: em aba anônima, com
 * cookies bloqueados ou em prévias, o acesso pode lançar exceção.
 */
function safe(getStorage) {
  return {
    getItem(key) {
      try {
        return getStorage()?.getItem(key) ?? null;
      } catch {
        return null;
      }
    },
    setItem(key, value) {
      try {
        getStorage()?.setItem(key, value);
      } catch {
        // Sem armazenamento: a preferência vale só nesta visita.
      }
    },
    removeItem(key) {
      try {
        getStorage()?.removeItem(key);
      } catch {
        // idem
      }
    },
  };
}

export const local = safe(() => globalThis.localStorage);
export const session = safe(() => globalThis.sessionStorage);

export const KEYS = {
  prefs: 'portifolio:prefs',
  introSeen: 'portifolio:intro-seen',
};
