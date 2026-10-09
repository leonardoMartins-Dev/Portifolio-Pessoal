import { Suspense, useRef } from 'react';
import { ErrorBoundary } from '../os/ErrorBoundary.jsx';
import { useInView } from './hooks.js';

/**
 * Monta uma cena 3D só quando ela chega perto da tela (o three.js e a cena
 * baixam nessa hora) e avisa quando ela está visível, para pausar fora dela.
 * Sem WebGL (ou se a cena quebrar), mostra `fallback`.
 */
export function LazyScene({ rootRef, enabled = true, className = '', fallback = false, children }) {
  const ref = useRef(null);
  const near = useInView(ref, { rootRef, rootMargin: '400px 0px', once: true });
  const visible = useInView(ref, { rootRef });
  return (
    <div ref={ref} className={className}>
      {enabled
        ? near && (
            <ErrorBoundary fallback={fallback}>
              <Suspense fallback={null}>{children(visible)}</Suspense>
            </ErrorBoundary>
          )
        : fallback}
    </div>
  );
}

/** Título de seção no estilo da página: etiqueta inclinada sobre o título grande. */
export function SectionTitle({ id, tag, children, className = '' }) {
  return (
    <div className={className}>
      <span
        aria-hidden
        className="relative z-10 ml-1 inline-block -rotate-[4deg] bg-land-tag px-2.5 py-1 font-display text-sm font-extrabold tracking-[0.08em] text-white uppercase shadow-sm sm:text-base"
      >
        {tag}
      </span>
      <h2
        id={id}
        className="-mt-1.5 font-display text-[clamp(2.75rem,6.5vw,4.75rem)] leading-[0.95] font-extrabold tracking-tight text-land-ink"
      >
        {children}
      </h2>
    </div>
  );
}
