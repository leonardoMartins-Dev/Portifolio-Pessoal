import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LockScreen } from '../../src/components/os/LockScreen.jsx';
import { profile } from '../../src/content/profile.js';
import { useOS } from '../../src/lib/os-store.js';

// A disponibilidade da IA (GET /api/chat) é simulada.
const availability = vi.hoisted(() => ({ value: false }));
vi.mock('../../src/lib/ai/availability.js', () => ({
  fetchAssistantAvailability: () => Promise.resolve(availability.value),
}));

function renderLockScreen() {
  const onUnlock = vi.fn();
  render(<LockScreen onUnlock={onUnlock} />);
  return onUnlock;
}

beforeEach(() => {
  availability.value = false;
  useOS.setState({ phase: 'lock', pendingApp: null, lockedFromDesktop: false });
});

describe('tela de bloqueio', () => {
  it('mostra relógio, foto, nome e cargo, com o foco em "Entrar"', () => {
    renderLockScreen();
    expect(screen.getByRole('dialog', { name: 'Tela de bloqueio do Portifólio' })).toBeTruthy();
    expect(screen.getByText(profile.name)).toBeTruthy();
    expect(screen.getByText(profile.role.pt)).toBeTruthy();
    expect(document.querySelector('time')).toBeTruthy();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Entrar' }));
  });

  it('qualquer tecla entra; Tab só navega', async () => {
    const onUnlock = renderLockScreen();
    await userEvent.keyboard('{Tab}');
    expect(onUnlock).not.toHaveBeenCalled();
    await userEvent.keyboard('a');
    expect(onUnlock).toHaveBeenCalledTimes(1);
  });

  it('Enter no botão entra uma vez só', async () => {
    const onUnlock = renderLockScreen();
    await userEvent.keyboard('{Enter}');
    expect(onUnlock).toHaveBeenCalledTimes(1);
  });

  it('com um atalho da mesa pendente, o botão diz qual app vai abrir', () => {
    useOS.setState({ pendingApp: 'contact' });
    renderLockScreen();
    expect(screen.getByRole('button', { name: 'Entrar e abrir Contato' })).toBeTruthy();
  });

  it('sem IA configurada, não mostra a notificação do assistente', async () => {
    renderLockScreen();
    await Promise.resolve();
    expect(screen.queryByText(/Pergunte qualquer coisa/)).toBeNull();
  });

  it('com IA, a notificação entra direto no assistente', async () => {
    availability.value = true;
    const onUnlock = renderLockScreen();
    await userEvent.click(await screen.findByRole('button', { name: /Pergunte qualquer coisa/ }));
    expect(useOS.getState().pendingApp).toBe('assistant');
    expect(onUnlock).toHaveBeenCalledTimes(1);
  });
});
