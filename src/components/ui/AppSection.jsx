/** Layout padrão do conteúdo de um app: área rolável com respiro. */
export function AppScroll({ children, className = '' }) {
  return (
    <div className={`scroll-area h-full overflow-y-auto ${className}`}>
      <div className="mx-auto w-full max-w-3xl px-5 py-6 sm:px-7">{children}</div>
    </div>
  );
}

/** Título de seção dentro de um app. */
export function SectionTitle({ children, id, className = '' }) {
  return (
    <h3
      id={id}
      className={`text-[11px] font-semibold tracking-[0.08em] text-muted uppercase ${className}`}
    >
      {children}
    </h3>
  );
}
