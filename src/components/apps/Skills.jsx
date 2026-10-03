import { CodeXml, Database, Languages, Layers, Lightbulb, Wrench } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { skillName, skills } from '../../content/skills.js';
import { useLocale, useLocalized } from '../../lib/hooks.js';
import { AppScroll } from '../ui/AppSection.jsx';
import { Chip } from '../ui/Chip.jsx';

const GROUP_ICONS = {
  code: CodeXml,
  frameworks: Layers,
  databases: Database,
  tools: Wrench,
  concepts: Lightbulb,
  languages: Languages,
};

/** Skills em grupos: grade de ícones (como no perfil do GitHub), chips ou lista (§10.4). */
export default function Skills() {
  const { t } = useTranslation();
  const l = useLocalized();

  return (
    <AppScroll>
      <h3 className="text-xl font-semibold tracking-tight">{t('skills.heading')}</h3>
      <div className="mt-5 flex flex-col gap-7">
        {skills.map((group) => {
          const Icon = GROUP_ICONS[group.icon] ?? CodeXml;
          return (
            <section key={group.id} aria-labelledby={`skills-${group.id}`}>
              <h4
                id={`skills-${group.id}`}
                className="flex items-center gap-2 text-sm font-semibold"
              >
                <span className="grid size-7 place-items-center rounded-[8px] bg-accent-soft text-accent-ink">
                  <Icon aria-hidden className="size-4" />
                </span>
                {l(group.title)}
              </h4>
              <SkillItems group={group} />
            </section>
          );
        })}
      </div>
    </AppScroll>
  );
}

function SkillItems({ group }) {
  const { t } = useTranslation();
  const l = useLocalized();
  const locale = useLocale();

  if (group.layout === 'chips') {
    return (
      <ul className="mt-3 flex flex-wrap gap-1.5">
        {group.items.map((item) => (
          <li key={skillName(item, 'en')}>
            <Chip>{skillName(item, locale)}</Chip>
          </li>
        ))}
      </ul>
    );
  }

  if (group.layout === 'list') {
    return (
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {group.items.map((item) => (
          <li
            key={skillName(item, 'en')}
            className="rounded-md border border-border bg-surface-2 px-4 py-3"
          >
            <p className="text-sm font-medium">{skillName(item, locale)}</p>
            {item.note && <p className="text-xs text-muted">{l(item.note)}</p>}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(6.25rem,1fr))] gap-2">
      {group.items.map((item) => (
        <li
          key={skillName(item, 'en')}
          className="flex flex-col items-center gap-2 rounded-md border border-border bg-surface-2 px-2 py-3 text-center motion-safe:transition-transform motion-safe:hover:-translate-y-0.5"
        >
          <SkillIcon item={item} />
          <span className="text-xs leading-tight font-medium">{skillName(item, locale)}</span>
          {item.learning && (
            <span className="-mt-1 rounded-full bg-accent-soft px-1.5 py-px text-[10px] font-medium text-accent-ink">
              {t('skills.learning')}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

/** Ícone decorativo (o nome aparece logo abaixo). Com `themed`, troca junto com o tema. */
function SkillIcon({ item }) {
  const props = { alt: '', width: 48, height: 48, loading: 'lazy', decoding: 'async' };
  if (!item.icon) return null;
  if (!item.themed) {
    return <img src={`/skills/${item.icon}.svg`} className="size-12" {...props} />;
  }
  return (
    <>
      <img src={`/skills/${item.icon}-light.svg`} className="size-12 dark:hidden" {...props} />
      <img src={`/skills/${item.icon}-dark.svg`} className="hidden size-12 dark:block" {...props} />
    </>
  );
}
