import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Suspense } from 'react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import About from '../../src/components/apps/About.jsx';
import Activity from '../../src/components/apps/Activity.jsx';
import Certificates from '../../src/components/apps/Certificates.jsx';
import Contact from '../../src/components/apps/Contact.jsx';
import GitHub from '../../src/components/apps/GitHub.jsx';
import Projects from '../../src/components/apps/Projects.jsx';
import Skills from '../../src/components/apps/Skills.jsx';
import { certificates } from '../../src/content/certificates.js';
import { profile } from '../../src/content/profile.js';
import { projects } from '../../src/content/projects.js';
import { apps } from '../../src/lib/apps.jsx';
import { useOS } from '../../src/lib/os-store.js';
import { sortProjects } from '../../src/lib/timeline.js';

// O globo usa WebGL, que o jsdom não tem: aqui ele vira um substituto.
vi.mock('../../src/components/apps/SkillsGlobe.jsx', () => ({
  default: () => <p>globo das skills</p>,
}));

// Nenhum teste de componente vai à rede (o app Projetos acorda as demos ao abrir).
let fetchMock;
beforeEach(() => {
  fetchMock = vi.fn(() => Promise.resolve(Response.json({ status: 'unconfigured' })));
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  vi.unstubAllGlobals();
});

function renderWithRouter(ui, path = '/pt/projects') {
  return render(<MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>);
}

describe('app Projetos', () => {
  it('abre do mais recente ao mais antigo e inverte para a ordem do enunciado', async () => {
    renderWithRouter(<Projects />);
    const timeline = screen.getByRole('list', { name: 'Linha do tempo' });
    const names = () =>
      within(timeline)
        .getAllByRole('heading', { level: 4 })
        .map((heading) => heading.textContent);
    expect(names()).toEqual(sortProjects(projects).map((p) => p.name));
    expect(screen.getByText('Do mais recente ao mais antigo')).toBeTruthy();

    await userEvent.click(screen.getByRole('radio', { name: 'Mais antigos' }));
    expect(names()).toEqual(sortProjects(projects, 'oldest').map((p) => p.name));
    expect(screen.getByText('Do mais antigo ao mais recente')).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'Mais antigos' }).getAttribute('aria-checked')).toBe(
      'true',
    );
  });

  it('filtra por tecnologia', async () => {
    // Uma tecnologia que não aparece em todos os projetos, para o filtro ter efeito.
    const technology = projects
      .flatMap((p) => p.technologies)
      .find((name) => !projects.every((p) => p.technologies.includes(name)));
    renderWithRouter(<Projects />);
    await userEvent.click(screen.getByRole('button', { name: technology }));
    const timeline = screen.getByRole('list', { name: 'Linha do tempo' });
    const names = within(timeline)
      .getAllByRole('heading', { level: 4 })
      .map((h) => h.textContent);
    expect(names).toEqual(
      sortProjects(projects)
        .filter((p) => p.technologies.includes(technology))
        .map((p) => p.name),
    );
  });
});

describe('app Projetos: demos em plano gratuito', () => {
  it('acorda o servidor da demo assim que o app abre', () => {
    // Os testes acima já abriram Projetos: avança o relógio para passar o intervalo de 10 min.
    vi.setSystemTime(Date.now() + 60 * 60 * 1000);
    renderWithRouter(<Projects />);
    vi.useRealTimers();
    for (const project of projects.filter((p) => p.wakeUrl)) {
      expect(fetchMock).toHaveBeenCalledWith(
        project.wakeUrl,
        expect.objectContaining({ mode: 'no-cors' }),
      );
    }
  });
});

describe('app Sobre', () => {
  it('mostra a seção "Fora do código" com os hobbies', () => {
    renderWithRouter(<About />, '/pt/about');
    const section = screen.getByRole('region', { name: 'Fora do código' });
    for (const hobby of profile.hobbies) {
      expect(within(section).getByRole('heading', { name: hobby.name.pt })).toBeTruthy();
    }
  });
});

describe('app Certificados', () => {
  it('mostra cada certificado com emissor, data, PDF e verificação', () => {
    renderWithRouter(<Certificates />, '/pt/certificates');
    expect(screen.getByRole('heading', { name: 'Cursos e certificados' })).toBeTruthy();
    const list = screen.getByRole('list', { name: 'Cursos e certificados' });
    expect(within(list).getAllByRole('article')).toHaveLength(certificates.length);

    const gemini = screen.getByRole('article', { name: 'Gemini Academy para Universitários 2026' });
    expect(within(gemini).getByText(/Google for Education/)).toBeTruthy();
    expect(within(gemini).getByText('2 de out. de 2026').tagName).toBe('TIME');
    expect(
      within(gemini)
        .getByRole('link', { name: /Ver certificado/ })
        .getAttribute('href'),
    ).toBe('/certificates/gemini-academy-2026.pdf');
    expect(
      within(gemini)
        .getByRole('link', { name: /Baixar PDF/ })
        .hasAttribute('download'),
    ).toBe(true);
    expect(
      within(gemini)
        .getByRole('link', { name: /Verificar autenticidade/ })
        .getAttribute('href'),
    ).toBe('https://cert.ninja/ykfn26bycvnxc67i');
  });
});

describe('app GitHub (Stats)', () => {
  it('mostra perfil e números; atividade, linguagens e repositórios em abas', async () => {
    // 20 a 30 de setembro, com 4 contribuições no último dia.
    const days = Array.from({ length: 11 }, (_, index) => ({
      date: `2026-09-${20 + index}`,
      count: index === 10 ? 4 : 0,
      level: index === 10 ? 3 : 0,
    }));
    fetchMock.mockImplementation(() =>
      Promise.resolve(
        Response.json({
          status: 'ok',
          login: 'leonardoMartins-Dev',
          profileUrl: 'https://github.com/leonardoMartins-Dev',
          profile: {
            name: 'Leo',
            avatarUrl: 'https://avatars.githubusercontent.com/u/1?v=4',
            bio: 'Estudante de Engenharia de Software',
            location: null,
            followers: 3,
            following: 4,
            createdAt: '2024-11-25',
          },
          repoCount: 7,
          stars: 8,
          forks: 1,
          repos: [
            {
              name: 'WaveHub',
              description: 'Rádios ao vivo',
              language: { name: 'Java', color: '#b07219' },
              stars: 2,
              url: 'https://github.com/leonardoMartins-Dev/WaveHub',
              pushedAt: '2026-09-29T17:13:10Z',
            },
          ],
          commits: [
            {
              sha: 'abc1234',
              message: 'feat: player único no rodapé',
              repo: 'WaveHub',
              url: 'https://github.com/leonardoMartins-Dev/WaveHub/commit/abc1234',
              date: '2026-09-29T17:13:10Z',
            },
          ],
          calendar: { total: 4, days },
          contributions: {
            total: 130,
            activeDays: 24,
            firstDate: '2024-11-25',
            bestDay: { date: '2026-09-14', count: 14 },
            currentStreak: { length: 2, start: '2026-09-29', end: '2026-09-30' },
            longestStreak: { length: 3, start: '2026-09-28', end: '2026-09-30' },
            years: [
              { year: 2025, total: 1 },
              { year: 2026, total: 129 },
            ],
            weekdays: [1, 19, 13, 5, 71, 9, 12],
          },
          pullRequests: 9,
          issues: 0,
          commitsLastYear: 114,
          commitHours: {
            sampled: 112,
            total: 114,
            peakHour: 20,
            hours: Array.from({ length: 24 }, (_, hour) => (hour === 20 ? 100 : 0)),
            periods: [
              { id: 'night', percent: 0 },
              { id: 'morning', percent: 0 },
              { id: 'afternoon', percent: 0 },
              { id: 'evening', percent: 100 },
            ],
          },
          languages: {
            unit: 'repos',
            total: 3,
            repos: 3,
            items: [
              { name: 'Java', color: '#b07219', value: 2, percent: (2 / 3) * 100 },
              { name: 'Python', color: '#3572A5', value: 1, percent: (1 / 3) * 100 },
            ],
          },
        }),
      ),
    );
    renderWithRouter(<GitHub />, '/pt/github');

    expect(await screen.findByRole('heading', { name: 'Programando em público' })).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledWith('/api/github', expect.anything());
    expect(screen.getByText('Estudante de Engenharia de Software')).toBeTruthy();
    expect(screen.getByText('No GitHub desde nov 2024')).toBeTruthy();
    const stat = (label) =>
      screen.getByText(label, { selector: 'dt' }).nextElementSibling.textContent;
    expect(stat('Contribuições')).toBe('130');
    expect(stat('Commits')).toBe('114');
    expect(stat('Pull requests')).toBe('9');
    expect(stat('Estrelas')).toBe('8');
    expect(stat('Sequência atual')).toBe('2 dias');
    expect(stat('Maior sequência')).toBe('3 dias');
    expect(stat('Repositórios próprios')).toBe('7');
    expect(screen.getByText('desde 25 de nov. de 2024')).toBeTruthy();
    expect(
      screen.getByRole('img', { name: 'Gráfico de contribuições: 4 no último ano' }),
    ).toBeTruthy();
    expect(screen.getByTitle('4 contribuições em 30 de set.')).toBeTruthy();

    await userEvent.click(screen.getByRole('radio', { name: 'Atividade' }));
    expect(screen.getByRole('table', { name: 'Contribuições por ano' })).toBeTruthy();
    expect(screen.getAllByText('2026: 129 contribuições').length).toBeGreaterThan(0);
    expect(screen.getAllByText('20h–21h: 100% dos commits').length).toBeGreaterThan(0);
    expect(screen.getByText(/Estimativa a partir de 112 de 114 commits/)).toBeTruthy();

    await userEvent.click(screen.getByRole('radio', { name: 'Linguagens' }));
    expect(screen.getByText('Pela linguagem principal de 3 repositórios.')).toBeTruthy();
    expect(screen.getByText('2 repositórios · 66,7%')).toBeTruthy();

    await userEvent.click(screen.getByRole('radio', { name: 'Repositórios' }));
    expect(screen.getByRole('link', { name: /^WaveHub/ }).getAttribute('href')).toBe(
      'https://github.com/leonardoMartins-Dev/WaveHub',
    );
    expect(screen.getByText('feat: player único no rodapé')).toBeTruthy();
    expect(screen.getByText('2 estrelas')).toBeTruthy();
  });
});

describe('app Atividade (WakaTime)', () => {
  it('mostra os totais de todo o período, sem o gráfico por dia', async () => {
    fetchMock.mockImplementation(() =>
      Promise.resolve(
        Response.json({
          status: 'ok',
          totalSeconds: 45 * 3600 + 15 * 60,
          dailyAverageSeconds: 75 * 60,
          activeDays: 36,
          since: '2026-06-12',
          bestDay: { date: '2026-09-29', seconds: 4 * 3600 + 52 * 60 },
          languages: [{ name: 'Java', color: '#b07219', percent: 36, seconds: 16 * 3600 }],
        }),
      ),
    );
    renderWithRouter(<Activity />, '/pt/activity');

    expect(await screen.findByRole('heading', { name: 'Tempo total programando' })).toBeTruthy();
    const stat = (label) =>
      screen.getByText(label, { selector: 'dt' }).nextElementSibling.textContent;
    expect(stat('Total')).toBe('45 h 15 min');
    expect(stat('Média por dia ativo')).toBe('1 h 15 min');
    expect(stat('Dias com código')).toBe('36');
    expect(stat('Melhor dia')).toBe('4 h 52 min');
    expect(screen.getByText('desde 12 de jun. de 2026')).toBeTruthy();
    expect(screen.getByText('29 de set. de 2026')).toBeTruthy();
    expect(screen.queryByText(/semana|7 dias|^Por dia$/i)).toBeNull();
  });
});

describe('app Skills', () => {
  afterEach(() => useOS.setState({ skillsView: 'list' }));

  it('troca entre a lista e o globo e lembra a escolha', async () => {
    renderWithRouter(<Skills />, '/pt/skills');
    expect(screen.getByRole('radio', { name: 'Lista' }).getAttribute('aria-checked')).toBe('true');
    expect(screen.getByText('React')).toBeTruthy();
    expect(screen.getByText('Vite')).toBeTruthy();

    await userEvent.click(screen.getByRole('radio', { name: 'Globo' }));
    expect(await screen.findByText('globo das skills')).toBeTruthy();
    expect(screen.queryByText('Vite')).toBeNull();
    expect(useOS.getState().skillsView).toBe('globe');

    await userEvent.click(screen.getByRole('radio', { name: 'Lista' }));
    expect(screen.getByText('Vite')).toBeTruthy();
  });
});

describe('app Contato', () => {
  it('mostra os erros de validação traduzidos ao enviar vazio', async () => {
    renderWithRouter(<Contact />, '/pt/contact');
    await userEvent.click(screen.getByRole('button', { name: 'Enviar mensagem' }));
    expect(await screen.findByText('Informe seu nome (mínimo de 2 caracteres).')).toBeTruthy();
    expect(screen.getByText('Informe um e-mail válido.')).toBeTruthy();
    expect(screen.getByText('A mensagem precisa de pelo menos 10 caracteres.')).toBeTruthy();
    expect(screen.getByLabelText('Nome').getAttribute('aria-invalid')).toBe('true');
  });

  it('tem os canais clicáveis (e-mail, WhatsApp, LinkedIn, GitHub)', () => {
    renderWithRouter(<Contact />, '/pt/contact');
    const links = screen.getAllByRole('link').map((link) => link.getAttribute('href'));
    expect(links.some((href) => href.startsWith('mailto:'))).toBe(true);
    expect(links.some((href) => href.startsWith('https://wa.me/5531987451563?text='))).toBe(true);
    expect(links.some((href) => href.includes('linkedin.com'))).toBe(true);
    expect(links.some((href) => href.includes('github.com'))).toBe(true);
  });
});

describe('registro de apps (componentes)', () => {
  // Música, Atividade, GitHub, Currículo e Assistente dependem de rede (fetch): GitHub tem
  // teste próprio acima e os outros são cobertos no e2e.
  const offline = apps.filter(
    (app) => !['music', 'activity', 'github', 'resume', 'assistant'].includes(app.id),
  );
  it.each(offline.map((app) => [app.id, app]))(
    '%s carrega sob demanda sem quebrar',
    async (_id, app) => {
      const Component = app.component;
      renderWithRouter(
        <Suspense fallback="carregando">
          <Component appId={app.id} />
        </Suspense>,
        `/pt/${app.id}`,
      );
      await waitFor(() => expect(screen.queryByText('carregando')).toBeNull(), { timeout: 3000 });
      expect(screen.queryByText('Algo deu errado neste app.')).toBeNull();
      expect(document.body.textContent.trim().length).toBeGreaterThan(0);
    },
  );
});
