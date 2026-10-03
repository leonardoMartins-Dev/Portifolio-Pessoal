/**
 * Controle segmentado (grupo de rádio): uma opção marcada por vez.
 * Rotule o grupo com `labelledBy` (id de um título visível) ou `label` (aria-label).
 */
export function Segmented({ labelledBy, label, value, onChange, options }) {
  return (
    <div
      role="radiogroup"
      aria-labelledby={labelledBy}
      aria-label={label}
      className="inline-flex w-fit gap-1 rounded-sm border border-border bg-surface-2 p-1"
    >
      {options.map((option) => {
        const Icon = option.icon;
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            lang={option.lang}
            onClick={() => onChange(option.value)}
            className={`flex min-h-9 items-center gap-1.5 rounded-[7px] px-3 text-sm transition-colors ${
              selected
                ? 'bg-surface font-medium text-text shadow-[0_1px_2px_rgb(0_0_0/0.12)]'
                : 'text-muted hover:text-text'
            }`}
          >
            {Icon && <Icon aria-hidden className="size-4" />}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
