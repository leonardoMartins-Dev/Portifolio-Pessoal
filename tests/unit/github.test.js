import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { activeDays, monthLabels, toWeeks } from '../../src/lib/contributions.js';
import { formatDayMonth, formatMonthName, formatRelative } from '../../src/lib/format.js';
import {
  githubLogin,
  normalizeCommits,
  normalizeGraphqlCalendar,
  normalizeRepos,
  parseContributionsHtml,
} from '../../server/github.js';

const LOGIN = 'leonardoMartins-Dev';

const repo = (name, pushedAt, extra = {}) => ({
  name,
  fork: false,
  description: `Descrição de ${name}`,
  language: 'Java',
  stargazers_count: 1,
  html_url: `https://github.com/${LOGIN}/${name}`,
  pushed_at: pushedAt,
  ...extra,
});

const commit = (sha, message, date, parents = 1) => ({
  sha,
  html_url: `https://github.com/${LOGIN}/x/commit/${sha}`,
  commit: { message, author: { date } },
  parents: Array.from({ length: parents }, () => ({})),
});

// Trecho no formato da página github.com/users/{login}/contributions.
const CONTRIBUTIONS_HTML = `
<table><tbody><tr>
  <td tabindex="0" data-ix="0" data-date="2026-09-27" id="contribution-day-component-0-0" data-level="0" role="gridcell" class="ContributionCalendar-day"></td>
  <td tabindex="0" data-ix="0" data-date="2026-09-28" id="contribution-day-component-1-0" data-level="4" role="gridcell" class="ContributionCalendar-day"></td>
  <td data-level="1" data-date="2026-09-29" id="contribution-day-component-2-0" class="ContributionCalendar-day"></td>
</tr></tbody></table>
<tool-tip id="t1" for="contribution-day-component-0-0" popover="manual">No contributions on September 27th.</tool-tip>
<tool-tip id="t2" for="contribution-day-component-1-0" popover="manual">1,204 contributions on September 28th.</tool-tip>
<tool-tip id="t3" for="contribution-day-component-2-0" popover="manual">1 contribution on September 29th.</tool-tip>
`;

describe('GitHub no servidor', () => {
  it('tira o login da URL do perfil', () => {
    expect(githubLogin('https://github.com/leonardoMartins-Dev')).toBe(LOGIN);
    expect(githubLogin('https://github.com/leonardoMartins-Dev/')).toBe(LOGIN);
    expect(githubLogin('')).toBeNull();
  });

  it('repositórios: sem forks nem o README do perfil, do push mais recente ao mais antigo', () => {
    const { repos, repoCount } = normalizeRepos(
      [
        repo('Antigo', '2026-08-01T00:00:00Z', { description: '  ', language: null }),
        repo('fork', '2026-09-30T00:00:00Z', { fork: true }),
        repo(LOGIN.toLowerCase(), '2026-09-30T00:00:00Z'),
        repo('WaveHub', '2026-09-29T00:00:00Z', { language: 'Rust' }),
      ],
      LOGIN,
    );
    expect(repoCount).toBe(2);
    expect(repos.map((r) => r.name)).toEqual(['WaveHub', 'Antigo']);
    expect(repos[0]).toEqual({
      name: 'WaveHub',
      description: 'Descrição de WaveHub',
      language: { name: 'Rust', color: null },
      stars: 1,
      url: `https://github.com/${LOGIN}/WaveHub`,
      pushedAt: '2026-09-29T00:00:00Z',
    });
    expect(repos[1]).toMatchObject({ description: null, language: null });
    expect(normalizeRepos({ message: 'API rate limit exceeded' }, LOGIN).repos).toEqual([]);
  });

  it('commits: primeira linha da mensagem, sem merges', () => {
    const commits = normalizeCommits('WaveHub', [
      commit('abcdef1234', 'feat: player único\n\ndetalhes', '2026-09-29T10:00:00Z'),
      commit('merge12345', 'Merge pull request #1', '2026-09-29T11:00:00Z', 2),
      commit('vazio12345', '', '2026-09-29T12:00:00Z'),
    ]);
    expect(commits).toEqual([
      {
        sha: 'abcdef1',
        message: 'feat: player único',
        repo: 'WaveHub',
        url: `https://github.com/${LOGIN}/x/commit/abcdef1234`,
        date: '2026-09-29T10:00:00Z',
      },
    ]);
    expect(normalizeCommits('x', null)).toEqual([]);
  });

  it('lê o gráfico da página pública (contagens e níveis)', () => {
    expect(parseContributionsHtml(CONTRIBUTIONS_HTML)).toEqual({
      total: 1205,
      days: [
        { date: '2026-09-27', count: 0, level: 0 },
        { date: '2026-09-28', count: 1204, level: 4 },
        { date: '2026-09-29', count: 1, level: 1 },
      ],
    });
    expect(parseContributionsHtml('<html>mudou tudo</html>')).toBeNull();
  });

  it('lê o gráfico da GraphQL', () => {
    const json = {
      data: {
        user: {
          contributionsCollection: {
            contributionCalendar: {
              weeks: [
                {
                  contributionDays: [
                    {
                      date: '2026-09-28',
                      contributionCount: 3,
                      contributionLevel: 'SECOND_QUARTILE',
                    },
                    { date: '2026-09-27', contributionCount: 0, contributionLevel: 'NONE' },
                  ],
                },
              ],
            },
          },
        },
      },
    };
    expect(normalizeGraphqlCalendar(json)).toEqual({
      total: 3,
      days: [
        { date: '2026-09-27', count: 0, level: 0 },
        { date: '2026-09-28', count: 3, level: 2 },
      ],
    });
    expect(normalizeGraphqlCalendar({ errors: [{ message: 'Bad credentials' }] })).toBeNull();
  });
});

describe('resumo do GitHub (API simulada)', () => {
  let getGithubSummary;

  beforeEach(async () => {
    // O módulo guarda o resumo em cache: cada teste começa do zero.
    vi.resetModules();
    ({ getGithubSummary } = await import('../../server/github.js'));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function stubGithub({ repos = true, calendar = true } = {}) {
    const fetchMock = vi.fn(async (url) => {
      const href = String(url);
      if (href.includes('/contributions')) {
        return calendar
          ? new Response(CONTRIBUTIONS_HTML)
          : new Response('indisponível', { status: 503 });
      }
      if (href.includes('/repos?')) {
        return repos
          ? Response.json([
              repo('WaveHub', '2026-09-29T00:00:00Z'),
              repo('Vazio', '2026-09-28T00:00:00Z'),
            ])
          : Response.json({ message: 'API rate limit exceeded' }, { status: 403 });
      }
      if (href.includes('/WaveHub/commits')) {
        return Response.json([commit('abc1234', 'feat: rádios', '2026-09-29T10:00:00Z')]);
      }
      // Repositório vazio: o GitHub responde 409.
      return Response.json({ message: 'Git Repository is empty.' }, { status: 409 });
    });
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
  }

  it('junta repositórios, commits e gráfico; repositório vazio não derruba nada', async () => {
    const fetchMock = stubGithub();
    const summary = await getGithubSummary({});
    expect(summary).toMatchObject({
      status: 'ok',
      login: LOGIN,
      profileUrl: `https://github.com/${LOGIN}`,
      repoCount: 2,
      calendar: { total: 1205 },
    });
    expect(summary.commits).toEqual([expect.objectContaining({ sha: 'abc1234', repo: 'WaveHub' })]);
    // Sem token: nada de Authorization, e só a página pública para o gráfico.
    for (const [, init] of fetchMock.mock.calls) {
      expect(init.headers.authorization).toBeUndefined();
    }
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes('/graphql'))).toBe(false);
  });

  it('sem o gráfico, ainda mostra repositórios e commits', async () => {
    stubGithub({ calendar: false });
    const summary = await getGithubSummary({});
    expect(summary.status).toBe('ok');
    expect(summary.calendar).toBeNull();
    expect(summary.repos).toHaveLength(2);
  });

  it('limite da API sem cache anterior responde "error"', async () => {
    stubGithub({ repos: false });
    expect(await getGithubSummary({})).toEqual({ status: 'error' });
  });

  it('com GITHUB_TOKEN, autentica a REST e usa a GraphQL (com a página pública de reserva)', async () => {
    const fetchMock = stubGithub();
    const summary = await getGithubSummary({ GITHUB_TOKEN: 'token-de-teste' });
    const graphqlCall = fetchMock.mock.calls.find(([url]) => String(url).includes('/graphql'));
    expect(graphqlCall[1].headers.authorization).toBe('Bearer token-de-teste');
    // A GraphQL simulada não devolve o gráfico: vale a página pública.
    expect(summary.calendar.total).toBe(1205);
    const pageCall = fetchMock.mock.calls.find(([url]) => String(url).includes('/contributions'));
    expect(pageCall[1].headers.authorization).toBeUndefined();
  });
});

describe('gráfico de contribuições', () => {
  const day = (date, count = 0) => ({ date, count, level: count ? 1 : 0 });

  it('organiza os dias em semanas de domingo a sábado', () => {
    // 2026-09-30 é uma quarta-feira.
    const weeks = toWeeks([day('2026-09-30', 2), day('2026-10-01'), day('2026-10-04', 1)]);
    expect(weeks).toHaveLength(2);
    expect(weeks[0].map((d) => d?.date ?? null)).toEqual([
      null,
      null,
      null,
      '2026-09-30',
      '2026-10-01',
      null,
      null,
    ]);
    expect(weeks[1][0].date).toBe('2026-10-04');
    expect(toWeeks([])).toEqual([]);
  });

  it('põe o nome do mês na semana em que ele começa', () => {
    const days = [];
    for (let time = Date.UTC(2026, 7, 2); time <= Date.UTC(2026, 9, 3); time += 86_400_000) {
      days.push(day(new Date(time).toISOString().slice(0, 10)));
    }
    const labels = monthLabels(toWeeks(days));
    // Agosto ganha a primeira coluna; setembro e outubro, a semana do dia 1º.
    expect(labels.map((label) => label.month)).toEqual(['2026-08', '2026-09', '2026-10']);
    expect(labels[0].column).toBe(0);
  });

  it('conta os dias ativos nos últimos 30 dias do gráfico', () => {
    const days = [
      day('2026-08-01', 5),
      day('2026-09-10', 1),
      day('2026-09-11'),
      day('2026-10-03', 2),
    ];
    expect(activeDays(days, 30)).toBe(2);
    expect(activeDays([], 30)).toBe(0);
  });

  it('formata datas do app nos dois idiomas', () => {
    const now = new Date('2026-10-03T12:00:00Z');
    expect(formatRelative('2026-10-02T12:00:00Z', 'pt', now)).toBe('ontem');
    expect(formatRelative('2026-09-30T12:00:00Z', 'en', now)).toBe('3 days ago');
    expect(formatRelative('2026-10-03T11:59:30Z', 'pt', now)).toBe('agora');
    expect(formatMonthName('2026-09', 'pt')).toBe('set');
    expect(formatMonthName('2026-09', 'en')).toBe('Sep');
    expect(formatDayMonth('2026-09-14', 'en')).toBe('Sep 14');
  });
});
