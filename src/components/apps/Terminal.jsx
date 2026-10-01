import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { experiences } from '../../content/experiences.js';
import { profile } from '../../content/profile.js';
import { projects } from '../../content/projects.js';
import { skills } from '../../content/skills.js';
import { assistantChat } from '../../lib/ai/chat.js';
import { APP_META } from '../../lib/apps-meta.js';
import { useLocale, useLocalized } from '../../lib/hooks.js';
import { navigateToApp, switchLocale } from '../../lib/os-bridge.js';
import { useOS } from '../../lib/os-store.js';
import { complete, normalize, runCommand } from '../../lib/terminal.js';
import { useResolvedTheme } from '../../lib/theme.js';
import { siteConfig } from '../../site.config.js';

const STARTED_AT = Date.now();
const CONTENT = { profile, projects, experiences, skills };
const KIND_CLASSES = {
  text: 'text-[#d7dae3]',
  muted: 'text-[#8b90a0]',
  accent: 'text-[#9aa5ff] font-semibold',
  error: 'text-[#ff7a8a]',
  echo: 'text-[#d7dae3]',
  link: 'text-[#8fd1ff]',
};

/** Terminal: homenagem ao portfólio-terminal do professor (§10.10). */
export default function Terminal() {
  const { t } = useTranslation();
  const locale = useLocale();
  const l = useLocalized();
  const theme = useResolvedTheme();
  const prompt = `${normalize(siteConfig.author.firstName)}@${normalize(siteConfig.system.name)} ~ %`;

  const [lines, setLines] = useState(() => [
    {
      kind: 'accent',
      text: t('terminal.welcome', {
        system: siteConfig.system.name,
        version: siteConfig.system.version,
      }),
    },
    { kind: 'muted', text: t('terminal.tribute', { professor: siteConfig.professor.name }) },
  ]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef(null);
  const endRef = useRef(null);

  const ctx = useMemo(
    () => ({ t, locale, l, content: CONTENT, apps: APP_META, site: siteConfig, theme }),
    [t, locale, l, theme],
  );

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [lines]);

  function applyEffects(effects) {
    for (const effect of effects) {
      if (effect.type === 'open') navigateToApp(effect.appId);
      if (effect.type === 'lang') switchLocale(effect.locale);
      if (effect.type === 'theme') useOS.getState().setTheme(effect.theme);
      if (effect.type === 'ask') {
        assistantChat.sendMessage({ text: effect.question });
        navigateToApp('assistant');
      }
    }
  }

  function execute(raw) {
    const result = runCommand(raw, {
      ...ctx,
      uptimeMinutes: Math.max(1, Math.round((Date.now() - STARTED_AT) / 60_000)),
      resolution: `${window.innerWidth}x${window.innerHeight}`,
    });
    const echo = { kind: 'echo', text: `${prompt} ${raw}` };
    if (result.effects.some((effect) => effect.type === 'clear')) {
      setLines([]);
    } else {
      setLines((current) => [...current, echo, ...result.lines]);
    }
    if (raw.trim()) setHistory((current) => [...current, raw]);
    setHistoryIndex(-1);
    applyEffects(result.effects);
  }

  function onKeyDown(event) {
    if (event.key === 'ArrowUp' && history.length) {
      event.preventDefault();
      const index = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(index);
      setInput(history[index]);
    } else if (event.key === 'ArrowDown' && historyIndex !== -1) {
      event.preventDefault();
      const index = historyIndex + 1;
      if (index >= history.length) {
        setHistoryIndex(-1);
        setInput('');
      } else {
        setHistoryIndex(index);
        setInput(history[index]);
      }
    } else if (event.key === 'Tab') {
      event.preventDefault();
      const result = complete(input, APP_META);
      if (result.value) setInput(result.value);
      else if (result.candidates.length) {
        setLines((current) => [
          ...current,
          { kind: 'echo', text: `${prompt} ${input}` },
          { kind: 'muted', text: result.candidates.join('   ') },
        ]);
      }
    } else if (event.key === 'l' && event.ctrlKey) {
      event.preventDefault();
      setLines([]);
    }
  }

  return (
    <div
      className="flex h-full flex-col bg-[#0d0f14] font-mono text-[13px] leading-relaxed"
      onClick={() => window.getSelection()?.isCollapsed && inputRef.current?.focus()}
    >
      <div role="log" aria-live="polite" className="scroll-area flex-1 overflow-y-auto px-4 pt-3">
        {lines.map((entry, index) => (
          <div
            key={index}
            className={`break-words whitespace-pre-wrap ${KIND_CLASSES[entry.kind]}`}
          >
            {entry.href ? (
              <a
                href={entry.href}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {entry.text}
              </a>
            ) : (
              entry.text || ' '
            )}
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          execute(input);
          setInput('');
        }}
        className="flex items-center gap-2 px-4 pt-1 pb-3"
      >
        <span aria-hidden className="shrink-0 text-[#7c8cff]">
          {prompt}
        </span>
        <label htmlFor="terminal-input" className="sr-only">
          {t('terminal.inputLabel')}
        </label>
        <input
          ref={inputRef}
          id="terminal-input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={onKeyDown}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          autoFocus
          className="min-w-0 flex-1 bg-transparent text-[#e8eaf0] caret-[#9aa5ff] outline-none"
        />
      </form>
    </div>
  );
}
