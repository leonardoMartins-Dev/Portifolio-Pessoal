import { CodeXml, Languages, Server, Wrench } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { skills } from '../../content/skills.js';
import { useLocalized } from '../../lib/hooks.js';
import { AppScroll } from '../ui/AppSection.jsx';

const GROUP_ICONS = { frontend: CodeXml, backend: Server, tools: Wrench, languages: Languages };

/** Skills em grupos, com nível discreto (sem barras de "90%") (§10.4). */
export default function Skills() {
  const { t } = useTranslation();
  const l = useLocalized();

  return (
    <AppScroll>
      <h3 className="text-xl font-semibold tracking-tight">{t('skills.heading')}</h3>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {skills.map((group) => {
          const Icon = GROUP_ICONS[group.icon] ?? CodeXml;
          return (
            <section
              key={group.id}
              aria-labelledby={`skills-${group.id}`}
              className="rounded-md border border-border bg-surface-2 p-4"
            >
              <h4
                id={`skills-${group.id}`}
                className="flex items-center gap-2 text-sm font-semibold"
              >
                <span className="grid size-7 place-items-center rounded-[8px] bg-accent-soft text-accent-ink">
                  <Icon aria-hidden className="size-4" />
                </span>
                {l(group.title)}
              </h4>
              <ul className="mt-3 flex flex-col gap-2">
                {group.items.map((item) => (
                  <li key={item.name} className="flex items-center justify-between gap-3 text-sm">
                    <span>{item.name}</span>
                    {item.level && (
                      <Level level={item.level} label={t('skills.level', { level: item.level })} />
                    )}
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </AppScroll>
  );
}

function Level({ level, label }) {
  return (
    <span className="flex gap-1" role="img" aria-label={label}>
      {[1, 2, 3, 4, 5].map((step) => (
        <span
          key={step}
          className={`size-1.5 rounded-full ${step <= level ? 'bg-accent' : 'bg-border-strong'}`}
        />
      ))}
    </span>
  );
}
