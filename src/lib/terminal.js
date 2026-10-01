import { formatMonth, formatPeriod } from './format.js';
import { sortExperiencesDescending, sortProjectsAscending } from './timeline.js';

/** Comandos do Terminal, com aliases em português (§10.10). */
export const COMMANDS = [
  { name: 'help', aliases: ['ajuda'] },
  { name: 'about', aliases: ['sobre'] },
  { name: 'projects', aliases: ['projetos'] },
  { name: 'experience', aliases: ['experiencias', 'experiências'] },
  { name: 'skills', aliases: ['habilidades'] },
  { name: 'contact', aliases: ['contato'] },
  { name: 'resume', aliases: ['curriculo', 'currículo'] },
  { name: 'open', aliases: ['abrir'], usage: 'open <app>' },
  { name: 'lang', aliases: ['idioma'], usage: 'lang <pt|en>' },
  { name: 'theme', aliases: ['tema'], usage: 'theme <light|dark>' },
  { name: 'ask', aliases: ['perguntar'], usage: 'ask <pergunta>' },
  { name: 'whoami', aliases: [] },
  { name: 'neofetch', aliases: [] },
  { name: 'clear', aliases: ['limpar', 'cls'] },
];

const NAMES = COMMANDS.flatMap((command) => [command.name, ...command.aliases]);

/** Remove acentos e espaços, em minúsculas: "Experiências" → "experiencias". */
export function normalize(text) {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '').toLowerCase();
}

/** "open  projects" → { name: 'open', args: ['projects'], rest: 'projects' } */
export function parseCommand(input) {
  const trimmed = input.trim();
  if (!trimmed) return { name: '', args: [], rest: '' };
  const [first, ...args] = trimmed.split(/\s+/);
  return { name: first.toLowerCase(), args, rest: trimmed.slice(first.length).trim() };
}

/** Nome canônico de um comando (ou alias), ou null. */
export function resolveCommand(name) {
  const key = normalize(name);
  return (
    COMMANDS.find((command) =>
      [command.name, ...command.aliases].some((alias) => normalize(alias) === key),
    )?.name ?? null
  );
}

/** Encontra um app pelo id ou pelo nome em qualquer idioma ("projetos" → projects). */
export function findApp(query, apps) {
  const key = normalize(query);
  return (
    apps.find(
      (app) =>
        normalize(app.id) === key ||
        normalize(app.title.pt) === key ||
        normalize(app.title.en) === key,
    ) ?? null
  );
}

/**
 * Autocompletar com Tab. Devolve `{ value }` quando há um único candidato
 * ou `{ candidates }` quando há vários.
 */
export function complete(input, apps) {
  const { name } = parseCommand(input);
  const hasArgument = /\s/.test(input.trimStart());

  let options;
  let prefix;
  let base = '';
  if (!hasArgument) {
    options = NAMES;
    prefix = input.trim().toLowerCase();
  } else {
    const command = resolveCommand(name);
    const argumentOptions = {
      open: apps.map((app) => app.id),
      lang: ['pt', 'en'],
      theme: ['light', 'dark'],
    }[command];
    if (!argumentOptions) return { candidates: [] };
    options = argumentOptions;
    prefix = input.trimStart().slice(name.length).trim().toLowerCase();
    base = `${name} `;
  }

  const candidates = [...new Set(options.filter((option) => option.startsWith(prefix)))];
  if (candidates.length === 1) return { value: `${base}${candidates[0]} ` };
  return { candidates };
}

const line = (text, kind = 'text', extra = {}) => ({ text, kind, ...extra });

/**
 * Executa um comando. Puro: devolve as linhas de saída e os efeitos
 * (abrir app, trocar idioma/tema, perguntar ao assistente, limpar) que o
 * componente aplica.
 */
export function runCommand(input, ctx) {
  const { t, locale, l, content, apps } = ctx;
  const { name, args, rest } = parseCommand(input);
  if (!name) return { lines: [], effects: [] };

  const command = resolveCommand(name);
  const usage = (cmd) =>
    line(t('terminal.usage', { usage: COMMANDS.find((c) => c.name === cmd).usage }), 'error');

  switch (command) {
    case 'help':
      return {
        lines: [
          line(t('terminal.helpTitle'), 'accent'),
          ...COMMANDS.map((cmd) => {
            const label = (cmd.usage ?? cmd.name).padEnd(20);
            const aliases = cmd.aliases.length ? `  (${cmd.aliases.join(', ')})` : '';
            return line(`  ${label}${t(`terminal.commands.${cmd.name}`)}${aliases}`);
          }),
        ],
        effects: [],
      };

    case 'about': {
      const { profile } = content;
      return {
        lines: [
          line(profile.name, 'accent'),
          line(`${l(profile.role)} · ${l(profile.location)}`, 'muted'),
          line(''),
          line(l(profile.bio)),
        ],
        effects: [],
      };
    }

    case 'projects':
      return {
        lines: sortProjectsAscending(content.projects).map((project) =>
          line(
            `${formatMonth(project.date, locale).padEnd(10)} ${project.name} — ${project.technologies.join(', ')}`,
          ),
        ),
        effects: [],
      };

    case 'experience':
      return {
        lines: sortExperiencesDescending(content.experiences).map((experience) =>
          line(
            `${formatPeriod(experience.start, experience.end, locale, t('experience.present'))} · ${l(experience.role)} @ ${experience.organization} (${t(`experience.types.${experience.type}`)})`,
          ),
        ),
        effects: [],
      };

    case 'skills':
      return {
        lines: content.skills.map((group) =>
          line(`${l(group.title)}: ${group.items.map((item) => item.name).join(', ')}`),
        ),
        effects: [],
      };

    case 'contact': {
      const { profile } = content;
      return {
        lines: [
          line(`${t('terminal.contactLines.email')}     ${profile.email}`, 'link', {
            href: `mailto:${profile.email}`,
          }),
          line(`${t('terminal.contactLines.whatsapp')}  wa.me/${profile.whatsapp}`, 'link', {
            href: `https://wa.me/${profile.whatsapp}`,
          }),
          line(`${t('terminal.contactLines.linkedin')}  ${profile.links.linkedin}`, 'link', {
            href: profile.links.linkedin,
          }),
          line(`${t('terminal.contactLines.github')}    ${profile.links.github}`, 'link', {
            href: profile.links.github,
          }),
        ],
        effects: [],
      };
    }

    case 'resume': {
      const app = apps.find((candidate) => candidate.id === 'resume');
      return {
        lines: [line(t('terminal.opening', { app: l(app.title) }), 'muted')],
        effects: [{ type: 'open', appId: 'resume' }],
      };
    }

    case 'open': {
      if (!args.length) return { lines: [usage('open')], effects: [] };
      const app = findApp(rest, apps);
      if (!app) {
        return {
          lines: [
            line(
              t('terminal.unknownApp', { name: rest, apps: apps.map((a) => a.id).join(', ') }),
              'error',
            ),
          ],
          effects: [],
        };
      }
      return {
        lines: [line(t('terminal.opening', { app: l(app.title) }), 'muted')],
        effects: [{ type: 'open', appId: app.id }],
      };
    }

    case 'lang': {
      const target = args[0]?.toLowerCase();
      if (target !== 'pt' && target !== 'en') return { lines: [usage('lang')], effects: [] };
      return {
        lines: [line(t('terminal.langChanged', { language: target }), 'muted')],
        effects: [{ type: 'lang', locale: target }],
      };
    }

    case 'theme': {
      const target = args[0]?.toLowerCase();
      if (target !== 'light' && target !== 'dark') return { lines: [usage('theme')], effects: [] };
      return {
        lines: [line(t('terminal.themeChanged', { theme: target }), 'muted')],
        effects: [{ type: 'theme', theme: target }],
      };
    }

    case 'ask':
      if (!rest) return { lines: [usage('ask')], effects: [] };
      return {
        lines: [line(t('terminal.asking'), 'muted')],
        effects: [{ type: 'ask', question: rest }],
      };

    case 'whoami':
      return {
        lines: [line(`${content.profile.name} — ${l(content.profile.role)}`)],
        effects: [],
      };

    case 'neofetch':
      return { lines: neofetch(ctx), effects: [] };

    case 'clear':
      return { lines: [], effects: [{ type: 'clear' }] };

    default:
      return {
        lines: [line(t('terminal.notFound', { name }), 'error')],
        effects: [],
      };
  }
}

function neofetch({ t, locale, content, apps, site, theme, uptimeMinutes, resolution }) {
  const user = normalize(site.author.firstName);
  const host = normalize(site.system.name);
  const title = `${user}@${host}`;
  const art = [
    '  ╭────────────╮ ',
    '  │            │ ',
    `  │     ${site.author.initials.padEnd(2)}     │ `,
    '  │            │ ',
    '  ╰────────────╯ ',
    '                 ',
    '                 ',
    '                 ',
    '                 ',
    '                 ',
  ];
  const info = [
    title,
    '─'.repeat(title.length),
    `${t('terminal.neofetch.os')}: ${site.system.name} ${site.system.version}`,
    `${t('terminal.neofetch.host')}: ${content.profile.name}`,
    `${t('terminal.neofetch.shell')}: ${host}-sh`,
    `${t('terminal.neofetch.locale')}: ${locale}`,
    `${t('terminal.neofetch.theme')}: ${theme}`,
    `${t('terminal.neofetch.apps')}: ${apps.length}`,
    `${t('terminal.neofetch.uptime')}: ${t('terminal.uptime', { minutes: uptimeMinutes })}`,
    `${t('terminal.neofetch.resolution')}: ${resolution}`,
  ];
  return info.map((text, index) =>
    line(`${art[index] ?? ''.padEnd(17)}${text}`, index === 0 ? 'accent' : 'text'),
  );
}
