import { useEffect, useState } from 'react';

// Sem IntersectionObserver (testes no jsdom), tudo conta como visível.
const NO_OBSERVER = typeof IntersectionObserver === 'undefined';

/**
 * true enquanto o elemento aparece na área de rolagem. Com `once`, fica true
 * depois da primeira vez (para montar algo pesado só quando chega perto).
 */
export function useInView(ref, { rootRef, rootMargin = '0px', once = false } = {}) {
  const [inView, setInView] = useState(NO_OBSERVER);
  useEffect(() => {
    const element = ref.current;
    if (!element || NO_OBSERVER) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (once && !entry.isIntersecting) return;
        setInView(entry.isIntersecting);
        if (once && entry.isIntersecting) observer.disconnect();
      },
      { root: rootRef?.current ?? null, rootMargin },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, rootRef, rootMargin, once]);
  return inView;
}

/** Id da seção que ocupa o meio da tela (para destacar o item do menu). */
export function useActiveSection(ids, rootRef) {
  const [active, setActive] = useState(null);
  useEffect(() => {
    if (NO_OBSERVER) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
          else setActive((current) => (current === entry.target.id ? null : current));
        }
      },
      // Uma faixa fina no meio da tela: só uma seção cabe nela por vez.
      { root: rootRef.current, rootMargin: '-45% 0px -45% 0px' },
    );
    for (const id of ids) {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    }
    return () => observer.disconnect();
  }, [ids, rootRef]);
  return active;
}

/**
 * Rola um contêiner até o topo e resolve quando chegar (ou depois de um
 * tempo-limite, se o navegador interromper a rolagem).
 */
export function scrollToTop(element, { smooth = true } = {}) {
  return new Promise((resolve) => {
    if (!element || element.scrollTop <= 1) {
      resolve();
      return;
    }
    element.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' });
    const started = performance.now();
    function check() {
      if (element.scrollTop <= 1 || performance.now() - started > 1200) resolve();
      else requestAnimationFrame(check);
    }
    requestAnimationFrame(check);
  });
}
