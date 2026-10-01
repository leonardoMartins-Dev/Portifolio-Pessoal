import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Suspense } from 'react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import Contact from '../../src/components/apps/Contact.jsx';
import Projects from '../../src/components/apps/Projects.jsx';
import { projects } from '../../src/content/projects.js';
import { apps } from '../../src/lib/apps.jsx';

function renderWithRouter(ui, path = '/pt/projects') {
  return render(<MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>);
}

describe('app Projetos', () => {
  it('mostra a timeline em ordem crescente de data', () => {
    renderWithRouter(<Projects />);
    const timeline = screen.getByRole('list', { name: 'Linha do tempo' });
    const names = within(timeline)
      .getAllByRole('heading', { level: 4 })
      .map((heading) => heading.textContent);
    const expected = [...projects].sort((a, b) => a.date.localeCompare(b.date)).map((p) => p.name);
    expect(names).toEqual(expected);
  });

  it('filtra por tecnologia', async () => {
    renderWithRouter(<Projects />);
    await userEvent.click(screen.getByRole('button', { name: 'Tech C' }));
    const timeline = screen.getByRole('list', { name: 'Linha do tempo' });
    const names = within(timeline)
      .getAllByRole('heading', { level: 4 })
      .map((h) => h.textContent);
    expect(names).toEqual(
      projects.filter((p) => p.technologies.includes('Tech C')).map((p) => p.name),
    );
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
  // Música, Atividade, Currículo e Assistente dependem de rede (fetch) e são cobertos no e2e.
  const offline = apps.filter(
    (app) => !['music', 'activity', 'resume', 'assistant'].includes(app.id),
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
