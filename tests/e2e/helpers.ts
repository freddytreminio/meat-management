import { readFileSync } from 'node:fs';
import { expect, type APIRequestContext, type Page } from '@playwright/test';

const env = Object.fromEntries(
  readFileSync(new URL('../../.env', import.meta.url), 'utf8')
    .split(/\r?\n/)
    .filter((line) => line.includes('=') && !line.startsWith('#'))
    .map((line) => {
      const at = line.indexOf('=');
      return [line.slice(0, at), line.slice(at + 1)];
    }),
);
export const adminEmail = env.BOOTSTRAP_ADMIN_EMAIL!;
export const adminPassword =
  process.env.TEST_ADMIN_PASSWORD ?? env.BOOTSTRAP_ADMIN_PASSWORD!;
export const origin = { Origin: 'http://localhost:5173' };
export async function loginApi(
  request: APIRequestContext,
  email = adminEmail,
  password = adminPassword,
) {
  const response = await request.post('/api/auth/sign-in/email', {
    headers: origin,
    data: { email, password },
  });
  expect(response.status(), await response.text()).toBe(200);
}
export async function loginPage(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Correo electrónico', { exact: true }).fill(adminEmail);
  await page.getByLabel('Contraseña', { exact: true }).fill(adminPassword);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(
    page.getByRole('navigation', { name: 'Navegación principal' }),
  ).toBeVisible();
}
