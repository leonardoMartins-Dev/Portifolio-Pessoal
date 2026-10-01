import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { apps } from '../../lib/apps.jsx';
import { useLocalized, useReducedMotion } from '../../lib/hooks.js';
import { useOS } from '../../lib/os-store.js';
import { playSound } from '../../lib/sound.js';
import { siteConfig } from '../../site.config.js';

const BASE = 46;
const MAGNIFIED = 64;
const RANGE = 150;

/** Dock (rodapé do sistema): apps com magnificação, indicador de aberto e créditos. */
export function Dock() {
  const { t } = useTranslation();
  const mouseX = useMotionValue(Infinity);
  const dockApps = apps.filter((app) => app.inDock);

  return (
    <footer className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex h-[var(--dock-h)] flex-col items-center justify-end gap-1 pb-1.5">
      <nav aria-label={t('dock.label')} className="pointer-events-auto">
        <ul
          onMouseMove={(event) => mouseX.set(event.clientX)}
          onMouseLeave={() => mouseX.set(Infinity)}
          className="flex h-[62px] items-end gap-1.5 rounded-lg px-2 pb-2 shadow-window glass"
        >
          {dockApps.map((app) => (
            <DockItem key={app.id} app={app} mouseX={mouseX} />
          ))}
        </ul>
      </nav>
      <p className="pointer-events-auto rounded-full px-2.5 py-0.5 text-[10px] text-muted glass">
        {t('dock.credits', { year: new Date().getFullYear(), name: siteConfig.author.name })}
      </p>
    </footer>
  );
}

function DockItem({ app, mouseX }) {
  const { t } = useTranslation();
  const l = useLocalized();
  const ref = useRef(null);
  const reduced = useReducedMotion();
  const isOpen = useOS((state) => state.windows.some((win) => win.appId === app.id));
  const openApp = useOS((state) => state.openApp);

  const distance = useTransform(mouseX, (x) => {
    const box = ref.current?.getBoundingClientRect() ?? { left: 0, width: 0 };
    return x - box.left - box.width / 2;
  });
  const target = useTransform(distance, [-RANGE, 0, RANGE], [BASE, MAGNIFIED, BASE]);
  const size = useSpring(target, { mass: 0.1, stiffness: 200, damping: 15 });
  const Icon = app.icon;
  const title = l(app.title);

  return (
    <li className="relative flex flex-col items-center">
      <motion.button
        ref={ref}
        type="button"
        data-dock-app={app.id}
        aria-label={isOpen ? `${title}, ${t('dock.open')}` : title}
        onClick={() => {
          playSound('click');
          openApp(app.id);
        }}
        style={reduced ? { width: BASE, height: BASE } : { width: size, height: size }}
        className="group relative grid place-items-center rounded-[28%] text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.35),0_2px_6px_rgb(0_0_0/0.25)] focus-visible:outline-offset-4"
      >
        <span
          aria-hidden
          className="absolute inset-0 rounded-[inherit]"
          style={{ background: `linear-gradient(145deg, ${app.tint[0]}, ${app.tint[1]})` }}
        />
        <Icon aria-hidden className="relative size-[48%] drop-shadow-[0_1px_1px_rgb(0_0_0/0.3)]" />
        <span
          role="tooltip"
          className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 rounded-[8px] px-2 py-1 text-xs whitespace-nowrap text-text opacity-0 shadow-window glass transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
        >
          {title}
        </span>
      </motion.button>
      <span
        aria-hidden
        className={`absolute -bottom-1.5 size-1 rounded-full bg-text transition-opacity ${isOpen ? 'opacity-80' : 'opacity-0'}`}
      />
    </li>
  );
}
