const VARIANTS = {
  primary:
    'bg-accent text-accent-contrast hover:brightness-110 active:brightness-95 shadow-[0_1px_2px_rgb(0_0_0/0.15)]',
  secondary: 'bg-surface-2 text-text border border-border hover:border-border-strong',
  ghost: 'text-text hover:bg-surface-2',
};

const SIZES = {
  sm: 'h-8 px-3 text-[13px] gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
};

/**
 * Botão do sistema. Com `href`, vira link (externo abre em nova aba).
 */
export function Button({
  variant = 'secondary',
  size = 'md',
  href,
  external,
  className = '',
  children,
  ...props
}) {
  const classes = `inline-flex items-center justify-center rounded-sm font-medium whitespace-nowrap transition-[filter,background-color,border-color] duration-150 disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${className}`;

  if (href) {
    return (
      <a
        href={href}
        className={classes}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        {...props}
      >
        {children}
      </a>
    );
  }
  return (
    <button type="button" className={classes} {...props}>
      {children}
    </button>
  );
}
