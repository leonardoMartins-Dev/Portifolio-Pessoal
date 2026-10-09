import { BriefcaseBusiness, FolderGit2 } from 'lucide-react';
import { lazy } from 'react';
import { useTranslation } from 'react-i18next';
import { skillName, skills } from '../../content/skills.js';
import { useLocale } from '../../lib/hooks.js';
import { LazyScene, SectionTitle } from './parts.jsx';

// O mesmo globo do app Skills (e o three.js) só baixa quando a seção chega perto.
const SkillsGlobe = lazy(() => import('../apps/SkillsGlobe.jsx'));

const iconSkills = skills
  .filter((group) => group.layout === 'icons')
  .flatMap((group) => group.items)
  .filter((item) => item.icon);

/** Sem WebGL: as mesmas skills numa grade de ícones. */
function SkillGrid() {
  const locale = useLocale();
  return (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))] gap-3 self-center">
      {iconSkills.map((item) => {
        const file = item.themed ? `${item.icon}-light` : item.icon;
        return (
          <li
            key={item.icon}
            className="flex flex-col items-center gap-2 text-center text-xs font-medium"
          >
            <img
              src={`/skills/${file}.svg`}
              alt=""
              width={48}
              height={48}
              className="size-12"
              loading="lazy"
            />
            {skillName(item, locale)}
          </li>
        );
      })}
    </ul>
  );
}

/** Skills: o globo 3D no lugar da grade de projetos, com atalhos para os apps do sistema. */
export function SkillsSection({ rootRef, webgl, onEnter }) {
  const { t } = useTranslation();

  return (
    <section
      id="skills"
      aria-labelledby="skills-title"
      className="relative bg-land-bg px-5 py-20 sm:px-8 lg:py-28"
    >
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.45fr)] lg:items-center">
        <div>
          <SectionTitle id="skills-title" tag={t('landing.skills.tag')}>
            {t('landing.skills.title')}
          </SectionTitle>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-land-muted sm:text-base">
            {t('landing.skills.lead')}
          </p>
          <div className="mt-8 rounded-2xl border border-land-line bg-land-surface p-5">
            <p className="font-display text-lg font-bold tracking-tight">
              {t('landing.skills.more')}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onEnter('projects')}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-accent px-4 text-sm font-semibold text-white transition-[filter] hover:brightness-110"
              >
                <FolderGit2 aria-hidden className="size-4" />
                {t('landing.skills.projects')}
              </button>
              <button
                type="button"
                onClick={() => onEnter('experience')}
                className="inline-flex h-10 items-center gap-2 rounded-full border border-land-line px-4 text-sm font-semibold transition-colors hover:bg-land-line"
              >
                <BriefcaseBusiness aria-hidden className="size-4" />
                {t('landing.skills.experience')}
              </button>
            </div>
          </div>
        </div>

        <LazyScene
          rootRef={rootRef}
          enabled={webgl}
          fallback={<SkillGrid />}
          className="isolate flex h-[min(70svh,600px)] min-h-[420px] flex-col"
        >
          {() => <SkillsGlobe />}
        </LazyScene>
      </div>
    </section>
  );
}
