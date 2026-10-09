import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Landing from '../../src/components/landing/Landing.jsx';
import {
  MONITOR,
  osScreenPose,
  roomFrame,
} from '../../src/components/landing/three/room/layout.js';
import { profile } from '../../src/content/profile.js';
import { coverDistance, visibleSize } from '../../src/lib/camera-fit.js';

// O jsdom não tem WebGL: a página inicial aparece sem o 3D (com os substitutos).
beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe('página inicial', () => {
  it('mostra o essencial para recrutadores: nome, status, seções e currículo', () => {
    render(<Landing onDone={() => {}} />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('Leonardo');
    expect(screen.getAllByText('Disponível para estágio').length).toBeGreaterThan(0);
    for (const name of ['Sobre', 'Skills', 'Contato']) {
      expect(screen.getByRole('link', { name }).getAttribute('href')).toMatch(/^#/);
    }
    screen.getByRole('heading', { name: 'Vamos trabalhar juntos!' });
    expect(screen.getByRole('link', { name: 'Currículo' }).getAttribute('href')).toBe(
      profile.resume.pt,
    );
    expect(screen.getByRole('link', { name: 'Versão em inglês' }).getAttribute('href')).toBe(
      profile.resume.en,
    );
    // Sem WebGL, as skills aparecem numa grade no lugar do globo.
    screen.getByText('Spring Boot');
  });

  it('o botão "Clique no PC" entra no sistema (sem 3D, direto)', async () => {
    const onDone = vi.fn();
    render(<Landing onDone={onDone} />);
    await userEvent.click(screen.getByRole('button', { name: /Clique no PC/ }));
    expect(onDone).toHaveBeenCalledWith(null);
  });

  it('os atalhos abrem o app certo depois da tela de bloqueio', async () => {
    const onDone = vi.fn();
    render(<Landing onDone={onDone} />);
    await userEvent.click(screen.getByRole('button', { name: 'Ver projetos' }));
    expect(onDone).toHaveBeenCalledWith('projects');
  });
});

describe('quarto 3D', () => {
  it('a tela do monitor tem a proporção da textura da tela de bloqueio (16:10)', () => {
    expect(MONITOR.screen.w / MONITOR.screen.h).toBeCloseTo(1280 / 800);
    expect(osScreenPose().normal.length()).toBeCloseTo(1);
  });

  it('o quarto cabe na tela em computador e celular', () => {
    for (const aspect of [16 / 9, 4 / 3, 9 / 19.5]) {
      const frame = roomFrame(aspect);
      expect(frame.cy - frame.h / 2).toBeGreaterThanOrEqual(0);
      expect(frame.cy + frame.h / 2).toBeLessThanOrEqual(1);
    }
    // No computador, o quarto fica à direita do nome.
    expect(roomFrame(16 / 9).cx).toBeGreaterThan(0.5);
  });

  it('no fim do zoom, a tela cobre o viewport inteiro', () => {
    for (const aspect of [16 / 9, 4 / 3, 9 / 19.5]) {
      const distance = coverDistance({
        planeWidth: MONITOR.screen.w,
        planeHeight: MONITOR.screen.h,
        fov: 28,
        aspect,
      });
      const visible = visibleSize({ distance, fov: 28, aspect });
      expect(visible.width).toBeLessThanOrEqual(MONITOR.screen.w + 1e-9);
      expect(visible.height).toBeLessThanOrEqual(MONITOR.screen.h + 1e-9);
    }
  });
});
