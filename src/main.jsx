import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import App from './App.jsx';
import './i18n/index.js';
import { decideInitialPhase } from './lib/boot.js';
import { useOS } from './lib/os-store.js';
import { siteConfig } from './site.config.js';
import './styles/globals.css';

// A cor de destaque vem do site.config.js — um único lugar para trocar.
document.documentElement.style.setProperty('--accent', siteConfig.accentColor);

// Decide antes do primeiro render se a página inicial aparece (evita piscar o desktop).
useOS.getState().setPhase(decideInitialPhase({ pathname: location.pathname }));

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
