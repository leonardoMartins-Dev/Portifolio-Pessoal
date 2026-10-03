import { siteConfig } from '../src/site.config.js';

/**
 * GitHub (app GitHub). Funciona sem configuração: repositórios e commits
 * vêm da API REST pública (60 requisições/h por IP) e o gráfico de
 * contribuições, da página pública do perfil. Com `GITHUB_TOKEN` (token
 * fine-grained só com acesso público) o limite sobe para 5.000/h e o
 * gráfico vem da API GraphQL oficial, com a página pública de reserva.
 *
 * O PushEvent da API de eventos não traz mais a lista de commits, então os
 * commits são buscados nos repositórios com push mais recente.
 */
const API = 'https://api.github.com';
const CACHE_MS = 30 * 60 * 1000;
const TIMEOUT_MS = 8000;
const RECENT_REPOS = 6;
const REPOS_WITH_COMMITS = 4;
const RECENT_COMMITS = 6;
let cache = null; // { value, expiresAt }

// Cores das linguagens no GitHub (linguist), para o ponto colorido dos repositórios.
const LANGUAGE_COLORS = {
  C: '#555555',
  'C#': '#178600',
  'C++': '#f34b7d',
  CSS: '#663399',
  Dart: '#00B4AB',
  Go: '#00ADD8',
  HTML: '#e34c26',
  Java: '#b07219',
  JavaScript: '#f1e05a',
  'Jupyter Notebook': '#DA5B0B',
  Kotlin: '#A97BFF',
  PHP: '#4F5D95',
  Python: '#3572A5',
  Shell: '#89e051',
  TypeScript: '#3178c6',
};

const LEVELS = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4,
};

/** "https://github.com/leonardoMartins-Dev" → "leonardoMartins-Dev". */
export function githubLogin(url = siteConfig.social.github) {
  if (!url) return null;
  return new URL(url).pathname.split('/').find(Boolean) ?? null;
}

/** Repositórios do autor, sem forks nem o repositório do README do perfil. */
export function normalizeRepos(list, login) {
  const own = (Array.isArray(list) ? list : [])
    .filter((repo) => !repo.fork && repo.name.toLowerCase() !== login.toLowerCase())
    .sort((a, b) => (b.pushed_at ?? '').localeCompare(a.pushed_at ?? ''));

  return {
    repoCount: own.length,
    repos: own.map((repo) => ({
      name: repo.name,
      description: repo.description?.trim() || null,
      language: repo.language
        ? { name: repo.language, color: LANGUAGE_COLORS[repo.language] ?? null }
        : null,
      stars: repo.stargazers_count ?? 0,
      url: repo.html_url,
      pushedAt: repo.pushed_at,
    })),
  };
}

/** Commits de um repositório: só a primeira linha da mensagem, sem merges. */
export function normalizeCommits(repo, list) {
  return (Array.isArray(list) ? list : [])
    .filter((item) => (item.parents?.length ?? 1) <= 1)
    .map((item) => ({
      sha: item.sha?.slice(0, 7) ?? '',
      message: item.commit?.message?.split('\n')[0].trim() ?? '',
      repo,
      url: item.html_url,
      date: item.commit?.author?.date ?? item.commit?.committer?.date ?? '',
    }))
    .filter((commit) => commit.message && commit.date);
}

function toCalendar(days) {
  const sorted = days
    .filter((day) => /^\d{4}-\d{2}-\d{2}$/.test(day.date))
    .sort((a, b) => a.date.localeCompare(b.date));
  if (!sorted.length) return null;
  return { total: sorted.reduce((sum, day) => sum + day.count, 0), days: sorted };
}

/**
 * Gráfico da página pública (github.com/users/{login}/contributions): cada
 * dia é um <td data-date data-level id> e a contagem está no <tool-tip>
 * ligado a ele ("3 contributions on…", "No contributions on…").
 */
export function parseContributionsHtml(html) {
  const counts = new Map();
  for (const [, id, text] of html.matchAll(
    /<tool-tip\b[^>]*\bfor="([^"]+)"[^>]*>([^<]*)<\/tool-tip>/g,
  )) {
    const match = text.trim().match(/^([\d,]+) contributions?\b/);
    counts.set(id, match ? Number(match[1].replaceAll(',', '')) : 0);
  }

  const days = [];
  for (const [, attributes] of html.matchAll(/<td\b([^>]*\bdata-date="[^"]*"[^>]*)>/g)) {
    const attribute = (name) => attributes.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1];
    const level = Number(attribute('data-level'));
    days.push({
      date: attribute('data-date'),
      count: counts.get(attribute('id')) ?? 0,
      level: level >= 0 && level <= 4 ? level : 0,
    });
  }
  return toCalendar(days);
}

/** Gráfico vindo da GraphQL (`contributionsCollection.contributionCalendar`). */
export function normalizeGraphqlCalendar(json) {
  const calendar = json?.data?.user?.contributionsCollection?.contributionCalendar;
  if (!calendar) return null;
  return toCalendar(
    (calendar.weeks ?? [])
      .flatMap((week) => week.contributionDays ?? [])
      .map((day) => ({
        date: day.date,
        count: day.contributionCount ?? 0,
        level: LEVELS[day.contributionLevel] ?? 0,
      })),
  );
}

async function request(url, { token, accept = 'application/vnd.github+json', ...init } = {}) {
  const response = await fetch(url, {
    ...init,
    headers: {
      accept,
      'user-agent': 'portifolio',
      'x-github-api-version': '2022-11-28',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`GitHub: HTTP ${response.status} em ${url}`);
  return response;
}

const CALENDAR_QUERY = `query($login: String!) {
  user(login: $login) {
    contributionsCollection {
      contributionCalendar {
        weeks { contributionDays { date contributionCount contributionLevel } }
      }
    }
  }
}`;

async function fetchCalendar(login, token) {
  if (token) {
    const calendar = await request(`${API}/graphql`, {
      token,
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: CALENDAR_QUERY, variables: { login } }),
    })
      .then((response) => response.json())
      .then(normalizeGraphqlCalendar)
      .catch(() => null);
    if (calendar) return calendar;
  }
  // A página do perfil não usa o token: é pública e não conta no limite da API.
  const response = await request(`https://github.com/users/${login}/contributions`, {
    accept: 'text/html',
  });
  return parseContributionsHtml(await response.text());
}

/** Resumo para o app GitHub: repositórios recentes, últimos commits e gráfico. */
export async function getGithubSummary(env = process.env) {
  const login = githubLogin();
  if (!login) return { status: 'unconfigured' };
  if (cache && cache.expiresAt > Date.now()) return cache.value;

  const token = env.GITHUB_TOKEN || null;
  try {
    const [reposJson, calendar] = await Promise.all([
      request(`${API}/users/${login}/repos?type=owner&sort=pushed&per_page=100`, { token }).then(
        (response) => response.json(),
      ),
      // Sem o gráfico, o app ainda mostra repositórios e commits.
      fetchCalendar(login, token).catch(() => null),
    ]);
    const { repos, repoCount } = normalizeRepos(reposJson, login);

    const commitLists = await Promise.all(
      repos.slice(0, REPOS_WITH_COMMITS).map((repo) =>
        request(
          `${API}/repos/${login}/${encodeURIComponent(repo.name)}/commits?author=${login}&per_page=5`,
          { token },
        )
          .then((response) => response.json())
          .then((list) => normalizeCommits(repo.name, list))
          // Repositório vazio responde 409: fica sem commits, sem derrubar o resto.
          .catch(() => []),
      ),
    );
    const commits = commitLists
      .flat()
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, RECENT_COMMITS);

    const value = {
      status: 'ok',
      login,
      profileUrl: `https://github.com/${login}`,
      repoCount,
      repos: repos.slice(0, RECENT_REPOS),
      commits,
      calendar,
    };
    cache = { value, expiresAt: Date.now() + CACHE_MS };
    return value;
  } catch {
    // Limite da API ou rede: o último resumo bom vale mais que um erro.
    return cache?.value ?? { status: 'error' };
  }
}
