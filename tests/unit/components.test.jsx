import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Suspense } from 'react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import About from '../../src/components/apps/About.jsx';
import Certificates from '../../src/components/apps/Certificates.jsx';
import Contact from '../../src/components/apps/Contact.jsx';
import GitHub from '../../src/components/apps/GitHub.jsx';
import Projects from '../../src/components/apps/Projects.jsx';
import { certificates } from '../../src/content/certificates.js';
import { profile } from '../../src/content/profile.js';
import { projects } from '../../src/content/projects.js';
import { apps } from '../../src/lib/apps.jsx';
import { sortProjects } from '../../src/lib/timeline.js';

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

describe('app GitHub', () => {
  it('mostra os números, o gráfico, os repositórios e os commits', async () => {
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
          repoCount: 7,
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
        }),
      ),
    );
    renderWithRouter(<GitHub />, '/pt/github');

    expect(await screen.findByRole('heading', { name: 'Programando em público' })).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledWith('/api/github', expect.anything());
    expect(
      screen.getByRole('img', { name: 'Gráfico de contribuições: 4 no último ano' }),
    ).toBeTruthy();
    expect(screen.getByTitle('4 contribuições em 30 de set.')).toBeTruthy();
    expect(screen.getByTitle('Nenhuma contribuição em 20 de set.')).toBeTruthy();
    expect(screen.getByText('Repositórios próprios').nextElementSibling.textContent).toBe('7');
    expect(screen.getByRole('link', { name: /^WaveHub/ }).getAttribute('href')).toBe(
      'https://github.com/leonardoMartins-Dev/WaveHub',
    );
    expect(screen.getByText('feat: player único no rodapé')).toBeTruthy();
    expect(screen.getByText('2 estrelas')).toBeTruthy();
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
