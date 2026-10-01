const SIZES = {
  sm: { box: 'size-5 rounded-[6px]', glyph: 'size-3' },
  md: { box: 'size-11 rounded-[12px]', glyph: 'size-5' },
  lg: { box: 'size-14 rounded-[16px]', glyph: 'size-7' },
  xl: { box: 'size-16 rounded-[18px]', glyph: 'size-8' },
};

/** Ícone de app: quadrado arredondado com gradiente suave e glifo no centro. */
export function AppIcon({ app, size = 'md', className = '' }) {
  const Icon = app.icon;
  const { box, glyph } = SIZES[size];
  return (
    <span
      aria-hidden
      className={`relative inline-grid shrink-0 place-items-center text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.35),0_1px_2px_rgb(0_0_0/0.2)] ${box} ${className}`}
      style={{ background: `linear-gradient(145deg, ${app.tint[0]}, ${app.tint[1]})` }}
    >
      <Icon className={`${glyph} drop-shadow-[0_1px_1px_rgb(0_0_0/0.25)]`} strokeWidth={2} />
    </span>
  );
}
