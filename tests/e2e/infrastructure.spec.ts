import { expect, test } from '@playwright/test';
import { loginPage } from './helpers';

test('React reaches Hono and the migrated PostgreSQL database', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await loginPage(page);
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'Una base sólida',
  );
  await expect(page.getByTestId('api-status')).toHaveText('Operativo');
  await expect(page.getByTestId('db-status')).toHaveText('Operativo');
  await page.getByRole('button', { name: 'Comprobar conexión' }).click();
  await expect(page.getByTestId('db-status')).toHaveText('Operativo');
  await expect(
    page.getByRole('button', { name: 'Comprobar conexión' }),
  ).toBeEnabled();
  expect(errors).toEqual([]);
  await page.screenshot({ path: 'test-results/desktop.png', fullPage: true });
});

test('mobile diagnostics fit within the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await loginPage(page);
  await expect(page.getByTestId('db-status')).toHaveText('Operativo');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: 'test-results/mobile.png', fullPage: true });
});
