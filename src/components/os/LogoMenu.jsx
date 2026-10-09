import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { navigateToApp, returnToLanding } from '../../lib/os-bridge.js';
import { useOS } from '../../lib/os-store.js';
import { Logo } from '../ui/Logo.jsx';

/** Menu do logo: Sobre este sistema, Ajustes, Página inicial, Bloquear e Desligar (volta ao quarto 3D). */
export function LogoMenu() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const menuId = useId();

  const items = [
    { label: t('menu.aboutSystem'), action: () => navigateToApp('system') },
    { label: t('menu.settings'), action: () => navigateToApp('settings') },
    { separator: true },
    { label: t('menu.replayIntro'), action: returnToLanding },
    { label: t('menu.lock'), action: () => useOS.getState().lock() },
    { label: t('menu.shutdown'), action: () => useOS.getState().setPhase('intro', 'shutdown') },
  ];

  useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector('[role="menuitem"]')?.focus();
    function onPointerDown(event) {
      if (!menuRef.current?.contains(event.target) && !buttonRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  function onMenuKeyDown(event) {
    const entries = [...menuRef.current.querySelectorAll('[role="menuitem"]')];
    const index = entries.indexOf(document.activeElement);
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      entries[(index + 1) % entries.length].focus();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      entries[(index - 1 + entries.length) % entries.length].focus();
    } else if (event.key === 'Escape') {
      // Fecha só o menu, não a janela em foco.
      event.preventDefault();
      setOpen(false);
      buttonRef.current?.focus();
    } else if (event.key === 'Tab') {
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-label={t('menu.logo')}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((value) => !value)}
        className="grid h-6 w-8 place-items-center rounded-[7px] hover:bg-border aria-expanded:bg-border"
      >
        <Logo className="size-[18px]" />
      </button>
      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label={t('menu.logo')}
          onKeyDown={onMenuKeyDown}
          className="absolute top-8 left-0 z-50 w-56 rounded-md p-1.5 shadow-window-focused glass"
        >
          {items.map((item, index) =>
            item.separator ? (
              <div key={index} role="separator" className="my-1 h-px bg-border" />
            ) : (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                tabIndex={-1}
                onClick={() => {
                  setOpen(false);
                  item.action();
                }}
                className="flex w-full items-center rounded-[8px] px-2.5 py-1.5 text-left text-[13px] hover:bg-accent hover:text-accent-contrast focus:bg-accent focus:text-accent-contrast focus:outline-none"
              >
                {item.label}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}
