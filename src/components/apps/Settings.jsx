import { Check, Monitor, Moon, RotateCcw, Sun } from 'lucide-react';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { LOCALES } from '../../i18n/locales.js';
import { useLocale } from '../../lib/hooks.js';
import { returnToLanding, switchLocale } from '../../lib/os-bridge.js';
import { useOS } from '../../lib/os-store.js';
import { WALLPAPERS } from '../../lib/wallpapers.js';
import { AppScroll, SectionTitle } from '../ui/AppSection.jsx';
import { Button } from '../ui/Button.jsx';
import { Segmented } from '../ui/Segmented.jsx';

/** Ajustes: idioma, tema, papel de parede, movimento, sons e voltar à página inicial (§10.11). */
export default function Settings() {
  const { t } = useTranslation();
  const locale = useLocale();
  const theme = useOS((state) => state.theme);
  const wallpaper = useOS((state) => state.wallpaper);
  const sound = useOS((state) => state.sound);
  const reducedMotion = useOS((state) => state.reducedMotion);
  const { setTheme, setWallpaper, setSound, setReducedMotion } = useOS.getState();

  return (
    <AppScroll>
      <div className="flex flex-col gap-7">
        <Group id="settings-language" title={t('settings.language')}>
          <Segmented
            labelledBy="settings-language"
            value={locale}
            onChange={switchLocale}
            options={LOCALES.map((value) => ({
              value,
              label: t(`languages.endonyms.${value}`),
              lang: value,
            }))}
          />
        </Group>

        <Group id="settings-theme" title={t('settings.theme')}>
          <Segmented
            labelledBy="settings-theme"
            value={theme}
            onChange={setTheme}
            options={[
              { value: 'light', label: t('theme.light'), icon: Sun },
              { value: 'dark', label: t('theme.dark'), icon: Moon },
              { value: 'system', label: t('theme.system'), icon: Monitor },
            ]}
          />
        </Group>

        <Group id="settings-wallpaper" title={t('settings.wallpaper')}>
          <div
            role="radiogroup"
            aria-labelledby="settings-wallpaper"
            className="grid grid-cols-2 gap-3 sm:grid-cols-4"
          >
            {WALLPAPERS.map((item) => {
              const selected = item.id === wallpaper;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setWallpaper(item.id)}
                  className="group flex flex-col gap-1.5 text-left"
                >
                  <span
                    className={`relative aspect-[16/10] w-full overflow-hidden rounded-sm border-2 bg-cover bg-center ${
                      selected
                        ? 'border-accent'
                        : 'border-transparent group-hover:border-border-strong'
                    }`}
                    style={{ backgroundImage: `url(${item.src})`, backgroundColor: item.base }}
                  >
                    {selected && (
                      <Check
                        aria-hidden
                        className="absolute right-1.5 bottom-1.5 size-5 rounded-full bg-accent p-0.5 text-accent-contrast"
                      />
                    )}
                  </span>
                  <span className="text-xs">{t(`settings.wallpapers.${item.id}`)}</span>
                </button>
              );
            })}
          </div>
        </Group>

        <Group id="settings-motion" title={t('settings.motion')}>
          <Toggle
            label={t('settings.reduceMotion')}
            hint={t('settings.reduceMotionHint')}
            checked={reducedMotion}
            onChange={setReducedMotion}
          />
          <Toggle
            label={t('settings.sound')}
            hint={t('settings.soundHint')}
            checked={sound}
            onChange={setSound}
          />
        </Group>

        <Group id="settings-intro" title={t('settings.intro')}>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-surface-2 p-3.5">
            <p className="text-sm text-muted">{t('settings.replayIntroHint')}</p>
            <Button size="sm" onClick={returnToLanding}>
              <RotateCcw aria-hidden className="size-3.5" />
              {t('settings.replayIntro')}
            </Button>
          </div>
        </Group>
      </div>
    </AppScroll>
  );
}

function Group({ id, title, children }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <SectionTitle id={id}>{title}</SectionTitle>
      {children}
    </section>
  );
}

function Toggle({ label, hint, checked, onChange }) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border border-border bg-surface-2 p-3.5">
      <span>
        <span id={`${id}-label`} className="block text-sm font-medium">
          {label}
        </span>
        <span id={`${id}-hint`} className="block text-xs text-muted">
          {hint}
        </span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-label`}
        aria-describedby={`${id}-hint`}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${checked ? 'bg-accent' : 'bg-border-strong'}`}
      >
        <span
          aria-hidden
          className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : ''}`}
        />
      </button>
    </div>
  );
}
