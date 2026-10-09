import { siteConfig } from '../src/site.config.js';

/**
 * GitHub (app GitHub (Stats)). Funciona sem configuração: perfil,
 * repositórios, commits e buscas vêm da API REST pública (60 requisições/h e
 * 10 buscas/min por IP) e as contribuições, das páginas públicas do perfil
 * (uma por ano, desde a criação da conta). Com `GITHUB_TOKEN` (token
 * fine-grained só com acesso público) o limite sobe para 5.000/h, as
 * contribuições vêm da API GraphQL oficial (com as páginas de reserva) e as
 * linguagens são somadas por bytes de código, em vez da linguagem principal
 * de cada repositório.
 *
 * O PushEvent da API de eventos não traz mais a lista de commits, então os
 * commits são buscados nos repositórios com push mais recente.
 *
 * As estatísticas extras (sequências, por ano, horários, linguagens) seguem
 * o comando "stats" do portfólio do prof. João Paulo Aramuni
 * (github.com/joaopauloaramuni/joaopauloaramuni-portfolio, licença MIT).
 */
const API = 'https://api.github.com';
const CACHE_MS = 30 * 60 * 1000;
const TIMEOUT_MS = 8000;
const RECENT_REPOS = 6;
const REPOS_WITH_COMMITS = 4;
const RECENT_COMMITS = 6;
// Horários dos commits: os últimos 12 meses em trimestres, até 100 commits de cada.
const COMMIT_HOUR_PARTS = 4;
// Contribuições: no máximo tantos anos para trás (uma página ou um alias por ano).
const MAX_YEARS = 15;
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

// Períodos do dia (horas de início e fim, inclusive), para os horários dos commits.
export const DAY_PERIODS = [
  { id: 'night', from: 0, to: 5 },
  { id: 'morning', from: 6, to: 11 },
  { id: 'afternoon', from: 12, to: 17 },
  { id: 'evening', from: 18, to: 23 },
];

/* Datas 'YYYY-MM-DD' (meio-dia UTC: nenhum fuso muda o dia). */

export function addDays(date, days) {
  const next = new Date(`${date}T12:00:00Z`);
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString().slice(0, 10);
}

/** 0 = domingo … 6 = sábado. */
const weekdayOf = (date) => new Date(`${date}T12:00:00Z`).getUTCDay();

/** Divide [from, to] em `parts` intervalos de dias seguidos. */
export function splitDays(from, to, parts) {
  const total =
    Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / 864e5) + 1;
  const size = Math.ceil(total / parts);
  const ranges = [];
  for (let start = 0; start < total; start += size) {
    ranges.push({
      from: addDays(from, start),
      to: addDays(from, Math.min(start + size, total) - 1),
    });
  }
  return ranges;
}

/** "https://github.com/leonardoMartins-Dev" → "leonardoMartins-Dev". */
export function githubLogin(url = siteConfig.social.github) {
  if (!url) return null;
  return new URL(url).pathname.split('/').find(Boolean) ?? null;
}

/** Perfil público: nome, foto, bio e seguidores. */
export function normalizeProfile(user) {
  if (!user?.login) return null;
  return {
    name: user.name?.trim() || user.login,
    avatarUrl: user.avatar_url ?? null,
    bio: user.bio?.trim() || null,
    location: user.location?.trim() || null,
    company: user.company?.trim() || null,
    followers: user.followers ?? 0,
    following: user.following ?? 0,
    createdAt: user.created_at?.slice(0, 10) ?? null,
  };
}

/** Repositórios do autor, sem forks nem o repositório do README do perfil. */
export function normalizeRepos(list, login) {
  const own = (Array.isArray(list) ? list : [])
    .filter((repo) => !repo.fork && repo.name.toLowerCase() !== login.toLowerCase())
    .sort((a, b) => (b.pushed_at ?? '').localeCompare(a.pushed_at ?? ''));

  return {
    repoCount: own.length,
    stars: own.reduce((sum, repo) => sum + (repo.stargazers_count ?? 0), 0),
    forks: own.reduce((sum, repo) => sum + (repo.forks_count ?? 0), 0),
    firstCreatedAt:
      own
        .map((repo) => repo.created_at ?? '')
        .filter(Boolean)
        .sort()[0] ?? null,
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

function graphqlDays(collection) {
  return (collection?.contributionCalendar?.weeks ?? [])
    .flatMap((week) => week.contributionDays ?? [])
    .map((day) => ({
      date: day.date,
      count: day.contributionCount ?? 0,
      level: LEVELS[day.contributionLevel] ?? 0,
    }));
}

/** Gráfico vindo da GraphQL (`contributionsCollection.contributionCalendar`). */
export function normalizeGraphqlCalendar(json) {
  const collection = json?.data?.user?.contributionsCollection;
  return collection ? toCalendar(graphqlDays(collection)) : null;
}

const NO_STREAK = { length: 0, start: null, end: null };

/**
 * Contribuições de todos os anos → total, dias ativos, melhor dia,
 * sequências (atual e maior), totais por ano e por dia da semana.
 * `today` corta os dias futuros que a página do ano atual traz zerados.
 */
export function summarizeContributions(days, today) {
  const counts = new Map();
  for (const day of days) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(day.date ?? '') && day.date <= today) {
      counts.set(day.date, day.count ?? 0);
    }
  }
  const sorted = [...counts].sort(([a], [b]) => a.localeCompare(b));
  if (!sorted.length) return null;

  let total = 0;
  let activeDays = 0;
  let firstDate = null;
  let bestDay = null;
  let run = null;
  let longestStreak = NO_STREAK;
  const years = new Map();
  const weekdays = new Array(7).fill(0);

  for (const [date, count] of sorted) {
    const year = Number(date.slice(0, 4));
    years.set(year, (years.get(year) ?? 0) + count);
    weekdays[weekdayOf(date)] += count;
    total += count;
    if (count <= 0) {
      run = null;
      continue;
    }
    activeDays += 1;
    firstDate ??= date;
    if (!bestDay || count > bestDay.count) bestDay = { date, count };
    // Só emenda com o dia anterior se ele for mesmo o dia anterior.
    run =
      run && addDays(run.end, 1) === date
        ? { ...run, end: date, length: run.length + 1 }
        : { start: date, end: date, length: 1 };
    if (run.length > longestStreak.length) longestStreak = run;
  }

  // Sequência atual: termina hoje ou ontem (hoje ainda pode ganhar contribuições).
  let currentStreak = NO_STREAK;
  const end = counts.get(today) > 0 ? today : addDays(today, -1);
  if (counts.get(end) > 0) {
    let start = end;
    while (counts.get(addDays(start, -1)) > 0) start = addDays(start, -1);
    const length = Math.round((Date.parse(end) - Date.parse(start)) / 864e5) + 1;
    currentStreak = { length, start, end };
  }

  const firstYear = Number(sorted[0][0].slice(0, 4));
  const lastYear = Number(today.slice(0, 4));
  const yearList = [];
  for (let year = firstYear; year <= lastYear; year += 1) {
    yearList.push({ year, total: years.get(year) ?? 0 });
  }

  return {
    total,
    activeDays,
    firstDate,
    bestDay,
    currentStreak,
    longestStreak,
    years: yearList,
    weekdays,
  };
}

/**
 * Horários dos commits. A busca devolve no máximo 100 commits por chamada,
 * então cada trimestre entra com uma amostra que vale (total do trimestre /
 * tamanho da amostra): nenhum trimestre pesa mais do que pesou de verdade.
 * A hora é a do relógio de quem fez o commit (a data vem com o fuso do autor).
 */
export function commitHours(samples) {
  const hours = new Array(24).fill(0);
  let sampled = 0;
  let total = 0;

  for (const { total: rangeTotal, dates } of samples) {
    total += rangeTotal;
    const valid = dates.filter((date) => /^\d{4}-\d{2}-\d{2}T\d{2}/.test(date ?? ''));
    if (!valid.length) continue;
    const weight = rangeTotal / valid.length;
    for (const date of valid) {
      hours[Number(date.slice(11, 13)) % 24] += weight;
      sampled += 1;
    }
  }

  const sum = hours.reduce((acc, value) => acc + value, 0);
  if (!sum) return null;
  const percent = (value) => (value / sum) * 100;
  return {
    sampled,
    total,
    peakHour: hours.indexOf(Math.max(...hours)),
    hours: hours.map(percent),
    periods: DAY_PERIODS.map(({ id, from, to }) => ({
      id,
      percent: percent(hours.slice(from, to + 1).reduce((acc, value) => acc + value, 0)),
    })),
  };
}

/** Soma mapas { linguagem: valor } (um por repositório) em itens com porcentagem. */
export function sumLanguages(maps, unit, colors = {}) {
  const totals = new Map();
  for (const map of maps) {
    for (const [name, value] of Object.entries(map)) {
      totals.set(name, (totals.get(name) ?? 0) + value);
    }
  }
  const total = [...totals.values()].reduce((sum, value) => sum + value, 0);
  if (!total) return null;
  return {
    unit,
    total,
    repos: maps.length,
    items: [...totals]
      .map(([name, value]) => ({
        name,
        color: colors[name] ?? LANGUAGE_COLORS[name] ?? null,
        value,
        percent: (value / total) * 100,
      }))
      .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name)),
  };
}

/** Sem token: conta a linguagem principal de cada repositório (já veio na lista). */
export function languagesFromRepos(repos) {
  return sumLanguages(
    repos.map((repo) => (repo.language ? { [repo.language.name]: 1 } : {})),
    'repos',
  );
}

/** Com token: bytes de cada linguagem em cada repositório público (GraphQL). */
export function languagesFromGraphql(nodes) {
  const colors = {};
  const maps = nodes.map((repo) =>
    Object.fromEntries(
      (repo.languages?.edges ?? []).map((edge) => {
        if (edge.node.color) colors[edge.node.name] = edge.node.color;
        return [edge.node.name, edge.size];
      }),
    ),
  );
  return sumLanguages(maps, 'bytes', colors);
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

const getJson = (url, token) => request(url, { token }).then((response) => response.json());

/** GraphQL responde 200 até com erro: só vale se não veio "errors". */
async function graphql(query, variables, token) {
  const json = await request(`${API}/graphql`, {
    token,
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  }).then((response) => response.json());
  if (json.errors?.length || !json.data) throw new Error('GitHub: erro na GraphQL');
  return json.data;
}

const CALENDAR_FIELDS = `contributionCalendar {
  weeks { contributionDays { date contributionCount contributionLevel } }
}`;

const CALENDAR_QUERY = `query($login: String!) {
  user(login: $login) { contributionsCollection { ${CALENDAR_FIELDS} } }
}`;

async function fetchCalendar(login, token) {
  if (token) {
    const calendar = await graphql(CALENDAR_QUERY, { login }, token)
      .then((data) => normalizeGraphqlCalendar({ data }))
      .catch(() => null);
    if (calendar) return calendar;
  }
  // A página do perfil não usa o token: é pública e não conta no limite da API.
  const response = await request(`https://github.com/users/${login}/contributions`, {
    accept: 'text/html',
  });
  return parseContributionsHtml(await response.text());
}

/** Todos os dias com contribuição, de `firstYear` até o ano atual. */
async function fetchContributionHistory(login, token, firstYear, today) {
  const lastYear = Number(today.slice(0, 4));
  const years = [];
  for (let year = Math.max(firstYear, lastYear - MAX_YEARS + 1); year <= lastYear; year += 1) {
    years.push(year);
  }

  if (token) {
    // Um alias por ano numa consulta só (a coleção aceita no máximo um ano por vez).
    const query = `query($login: String!) { user(login: $login) { ${years
      .map(
        (year) =>
          `y${year}: contributionsCollection(from: "${year}-01-01T00:00:00Z", to: "${year}-12-31T23:59:59Z") { ${CALENDAR_FIELDS} }`,
      )
      .join('\n')} } }`;
    const days = await graphql(query, { login }, token)
      .then((data) => years.flatMap((year) => graphqlDays(data.user?.[`y${year}`])))
      .catch(() => null);
    if (days?.length) return days;
  }
  const pages = await Promise.all(
    years.map((year) =>
      request(
        `https://github.com/users/${login}/contributions?from=${year}-01-01&to=${year}-12-31`,
        {
          accept: 'text/html',
        },
      )
        .then((response) => response.text())
        .then((html) => parseContributionsHtml(html)?.days ?? []),
    ),
  );
  return pages.flat();
}

/** PRs e issues abertos pelo autor (total) e os horários dos commits dos últimos 12 meses. */
async function fetchSearches(login, token, today) {
  const count = (query) =>
    getJson(
      `${API}/search/issues?q=${encodeURIComponent(`author:${login} ${query}`)}&per_page=1`,
      token,
    ).then((json) => json.total_count ?? 0);
  const ranges = splitDays(addDays(today, -364), today, COMMIT_HOUR_PARTS);
  const [pullRequests, issues, samples] = await Promise.all([
    count('type:pr').catch(() => null),
    count('type:issue').catch(() => null),
    Promise.all(
      ranges.map(({ from, to }) =>
        getJson(
          `${API}/search/commits?q=${encodeURIComponent(`author:${login} author-date:${from}..${to}`)}&per_page=100`,
          token,
        ).then((json) => ({
          total: json.total_count ?? 0,
          dates: (json.items ?? []).map((item) => item.commit?.author?.date),
        })),
      ),
    ).catch(() => null),
  ]);
  return {
    pullRequests,
    issues,
    // A soma dos trimestres é o total de commits dos últimos 12 meses.
    commitsLastYear: samples ? samples.reduce((sum, sample) => sum + sample.total, 0) : null,
    commitHours: samples ? commitHours(samples) : null,
  };
}

const LANGUAGES_QUERY = `query($login: String!, $cursor: String) {
  user(login: $login) {
    repositories(first: 100, after: $cursor, ownerAffiliations: OWNER, isFork: false, privacy: PUBLIC) {
      pageInfo { hasNextPage endCursor }
      nodes { name languages(first: 30, orderBy: { field: SIZE, direction: DESC }) {
        edges { size node { name color } }
      } }
    }
  }
}`;

async function fetchLanguageBytes(login, token) {
  const nodes = [];
  let cursor = null;
  for (let page = 0; page < 10; page += 1) {
    const { repositories } = (await graphql(LANGUAGES_QUERY, { login, cursor }, token)).user;
    nodes.push(...repositories.nodes);
    if (!repositories.pageInfo.hasNextPage) break;
    cursor = repositories.pageInfo.endCursor;
  }
  // O repositório do README do perfil não entra (como na lista de repositórios).
  return languagesFromGraphql(
    nodes.filter((repo) => repo.name.toLowerCase() !== login.toLowerCase()),
  );
}

/** Resumo para o app GitHub (Stats). Cada parte extra é opcional: sem ela, vem `null`. */
export async function getGithubSummary(env = process.env) {
  const login = githubLogin();
  if (!login) return { status: 'unconfigured' };
  if (cache && cache.expiresAt > Date.now()) return cache.value;

  const token = env.GITHUB_TOKEN || null;
  const today = new Date().toISOString().slice(0, 10);
  try {
    const [reposJson, user, calendar] = await Promise.all([
      getJson(`${API}/users/${login}/repos?type=owner&sort=pushed&per_page=100`, token),
      getJson(`${API}/users/${login}`, token).catch(() => null),
      // Sem o gráfico, o app ainda mostra repositórios e commits.
      fetchCalendar(login, token).catch(() => null),
    ]);
    const { repos, repoCount, stars, forks, firstCreatedAt } = normalizeRepos(reposJson, login);
    const profile = normalizeProfile(user);
    const firstYear = Number((profile?.createdAt ?? firstCreatedAt ?? today).slice(0, 4));

    const [commitLists, history, searches, languageBytes] = await Promise.all([
      Promise.all(
        repos.slice(0, REPOS_WITH_COMMITS).map((repo) =>
          getJson(
            `${API}/repos/${login}/${encodeURIComponent(repo.name)}/commits?author=${login}&per_page=5`,
            token,
          )
            .then((list) => normalizeCommits(repo.name, list))
            // Repositório vazio responde 409: fica sem commits, sem derrubar o resto.
            .catch(() => []),
        ),
      ),
      fetchContributionHistory(login, token, firstYear, today).catch(() => null),
      fetchSearches(login, token, today),
      token ? fetchLanguageBytes(login, token).catch(() => null) : null,
    ]);
    const commits = commitLists
      .flat()
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, RECENT_COMMITS);

    const value = {
      status: 'ok',
      login,
      profileUrl: `https://github.com/${login}`,
      profile,
      repoCount,
      stars,
      forks,
      repos: repos.slice(0, RECENT_REPOS),
      commits,
      calendar,
      contributions: history ? summarizeContributions(history, today) : null,
      pullRequests: searches.pullRequests,
      issues: searches.issues,
      commitsLastYear: searches.commitsLastYear,
      commitHours: searches.commitHours,
      languages: languageBytes ?? languagesFromRepos(repos),
    };
    cache = { value, expiresAt: Date.now() + CACHE_MS };
    return value;
  } catch {
    // Limite da API ou rede: o último resumo bom vale mais que um erro.
    return cache?.value ?? { status: 'error' };
  }
}
