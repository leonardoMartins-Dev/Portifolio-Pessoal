import js from '@eslint/js';
import prettier from 'eslint-config-prettier/flat';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';

export default defineConfig([
  globalIgnores([
    'dist',
    'coverage',
    'playwright-report',
    'test-results',
    'scripts/figma/plugin/code.js',
  ]),
  {
    files: ['**/*.{js,jsx,mjs}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrors: 'none' }],
    },
  },
  {
    // Código que roda no Node: funções da Vercel, scripts, configs e testes.
    files: ['api/**', 'server/**', 'scripts/**', '*.config.js', 'tests/**'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
  {
    // Plugin do Figma: roda no ambiente de plugins, com `figma` e os dados da captura.
    files: ['scripts/figma/plugin-main.js'],
    languageOptions: { sourceType: 'script', globals: { figma: 'readonly', DATA: 'readonly' } },
  },
  // Desliga regras de estilo que conflitam com o Prettier (deve vir por último).
  prettier,
]);
