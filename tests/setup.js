import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll } from 'vitest';
import i18n from '../src/i18n/index.js';

// O jsdom não implementa matchMedia: simulamos "nenhuma media query bate".
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent: () => false,
  });
}

// Nem scrollIntoView (usado no Terminal, no chat e na timeline).
if (typeof Element !== 'undefined' && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

beforeAll(async () => {
  await i18n.changeLanguage('pt');
});

// Desmonta o que foi renderizado entre um teste e outro.
afterEach(() => {
  cleanup();
});
