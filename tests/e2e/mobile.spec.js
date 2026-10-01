import { expect, test } from '@playwright/test';
import { expectNoHorizontalScroll, skipIntro } from './helpers.js';

test('celular (375px): abre um app em tela cheia e volta', async ({ page }) => {
  await skipIntro(page);
  await expect(page.getByRole('heading', { name: 'Leonardo Martins Macedo' })).toBeVisible();
  await expectNoHorizontalScroll(page);

  await page.locator('[data-mobile-dock-app="projects"]').click();
  const app = page.getByRole('dialog', { name: 'Projetos' });
  await expect(app).toBeVisible();
  await expect(page).toHaveURL(/\/pt\/projects$/);
  await expectNoHorizontalScroll(page);

  await app.getByRole('button', { name: 'Voltar' }).click();
  await expect(app).toBeHidden();
  await expect(page).toHaveURL(/\/pt$/);
});

test('celular: o Voltar do navegador fecha o app', async ({ page }) => {
  await skipIntro(page);
  await page.getByRole('button', { name: 'Skills' }).click();
  await expect(page.getByRole('dialog', { name: 'Skills' })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('dialog', { name: 'Skills' })).toBeHidden();
});
