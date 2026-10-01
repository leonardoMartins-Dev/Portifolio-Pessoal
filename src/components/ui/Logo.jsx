import { siteConfig } from '../../site.config.js';

/**
 * Monograma do autor (provisório — TODO(conteúdo): trocar pela logo definitiva).
 * Usa currentColor para seguir o tema.
 */
export function Logo({ className = 'size-5', title }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <rect
        x="1.5"
        y="1.5"
        width="29"
        height="29"
        rx="9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
      />
      <text
        x="16"
        y="21"
        textAnchor="middle"
        fontFamily="Geist Variable, ui-sans-serif, system-ui, sans-serif"
        fontSize="13"
        fontWeight="650"
        letterSpacing="-0.5"
        fill="currentColor"
      >
        {siteConfig.author.initials}
      </text>
    </svg>
  );
}
