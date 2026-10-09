import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

/**
 * Testes e2e de fumaça (§15). Rodam contra o build de produção
 * (`vite preview`), com as funções de /api servidas pelo plugin local.
 */
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 45_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  // O 3D da página inicial usa WebGL por software nos testes: poucos workers evitam saturar a CPU.
  workers: 2,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    launchOptions: {
      // WebGL por software, para o 3D rodar também em máquinas sem GPU (CI).
      args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
    },
  },
  webServer: {
    command: `npm run build && npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/pt`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
  projects: [
    {
      name: 'desktop',
      testIgnore: /mobile\.spec/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'mobile',
      testMatch: /mobile\.spec/,
      use: { ...devices['Pixel 7'], viewport: { width: 375, height: 812 } },
    },
  ],
});
