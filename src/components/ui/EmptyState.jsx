/** Estado vazio/indisponível amigável, usado quando uma integração não está configurada. */
export function EmptyState({ icon: Icon, title, children, className = '' }) {
  return (
    <div
      role="status"
      className={`flex flex-col items-center justify-center gap-3 px-6 py-10 text-center ${className}`}
    >
      {Icon && (
        <span className="grid size-12 place-items-center rounded-md bg-surface-2 text-muted">
          <Icon aria-hidden className="size-6" />
        </span>
      )}
      <p className="max-w-sm text-sm font-medium text-text">{title}</p>
      {children && (
        <div className="flex flex-col items-center gap-3 text-sm text-muted">{children}</div>
      )}
    </div>
  );
}
