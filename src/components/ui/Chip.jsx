/** Chip de tecnologia (estático) ou de filtro (com `onClick` e `pressed`). */
export function Chip({ children, pressed, onClick, className = '' }) {
  const base = 'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium';

  if (!onClick) {
    return (
      <span className={`${base} border border-border bg-surface-2 text-muted ${className}`}>
        {children}
      </span>
    );
  }
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`${base} min-h-8 border transition-colors ${
        pressed
          ? 'border-transparent bg-accent text-accent-contrast'
          : 'border-border bg-surface-2 text-muted hover:text-text'
      } ${className}`}
    >
      {children}
    </button>
  );
}
