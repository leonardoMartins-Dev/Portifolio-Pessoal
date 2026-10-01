import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import { apiDevServer } from './server/vite-api-plugin.js';
import { seo } from './server/vite-seo-plugin.js';

export default defineConfig(({ mode }) => {
  // As funções de /api leem process.env (como na Vercel). Em dev, carregamos
  // o .env.local aqui. Só variáveis VITE_ chegam ao navegador.
  const env = loadEnv(mode, process.cwd(), '');
  for (const [key, value] of Object.entries(env)) process.env[key] ??= value;

  // URL pública: VITE_SITE_URL ou, no build da Vercel, o domínio de produção do projeto.
  const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const siteUrl = env.VITE_SITE_URL || (vercelUrl ? `https://${vercelUrl}` : undefined);

  return {
    plugins: [react(), tailwindcss(), apiDevServer(), seo({ siteUrl })],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    test: {
      environment: 'jsdom',
      include: ['tests/unit/**/*.test.{js,jsx}'],
      setupFiles: ['tests/setup.js'],
    },
  };
});
