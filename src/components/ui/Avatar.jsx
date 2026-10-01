import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { profile } from '../../content/profile.js';
import { siteConfig } from '../../site.config.js';

/** Foto do autor; sem foto publicada, mostra as iniciais. */
export function Avatar({ className = 'size-24', textClassName = 'text-2xl' }) {
  const { t } = useTranslation();
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        role="img"
        aria-label={t('about.photoAlt', { name: profile.name })}
        className={`grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-accent to-[#2b2f6b] font-semibold text-white ${className} ${textClassName}`}
      >
        {siteConfig.author.initials}
      </span>
    );
  }
  return (
    <img
      src={profile.photo}
      alt={t('about.photoAlt', { name: profile.name })}
      onError={() => setFailed(true)}
      className={`shrink-0 rounded-full object-cover ${className}`}
    />
  );
}
