import { expect, test } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import {
  adminEmail,
  adminPassword,
  loginApi,
  loginPage,
  origin,
} from './helpers';

test('protected routes, closed registration and origin validation', async ({
  request,
}) => {
  expect((await request.get('/api/me')).status()).toBe(401);
  expect((await request.get('/api/admin/users')).status()).toBe(401);
  expect((await request.get('/api/admin/audit')).status()).toBe(401);
  expect(
    (
      await request.post('/api/auth/sign-up/email', {
        headers: origin,
        data: {},
      })
    ).status(),
  ).toBe(404);
  expect(
    (
      await request.post('/api/auth/sign-in/email', {
        headers: { Origin: 'https://untrusted.example' },
        data: {},
      })
    ).status(),
  ).toBe(403);
  expect((await request.post('/api/admin/users', { data: {} })).status()).toBe(
    403,
  );
  await loginApi(request);
  const me = await (await request.get('/api/me')).json();
  expect(me.user.role).toBe('admin');
  expect(
    (
      await request.patch(`/api/admin/users/${me.user.id}`, {
        headers: origin,
        data: { name: me.user.name, role: 'user', disabled: false },
      })
    ).status(),
  ).toBe(409);
  expect(
    (
      await request.post('/api/admin/users', {
        headers: origin,
        data: {
          name: 'Invalid',
          email: 'invalid@example.test',
          role: 'owner',
          password: 'short',
        },
      })
    ).status(),
  ).toBe(400);
});

test('administration changes roles, blocks access, revokes sessions and records audit', async ({
  request,
  playwright,
}) => {
  await loginApi(request);
  const email = `phase2-${randomUUID()}@example.test`;
  const password = `Local-${randomUUID()}`;
  const response = await request.post('/api/admin/users', {
    headers: origin,
    data: { name: 'Prueba de permisos', email, password, role: 'user' },
  });
  expect(response.status(), await response.text()).toBe(201);
  const user = await response.json();
  const regular = await playwright.request.newContext({
    baseURL: 'http://localhost:5173',
  });
  try {
    expect(
      (
        await request.post('/api/admin/users', {
          headers: origin,
          data: { name: 'Duplicado', email, password, role: 'user' },
        })
      ).status(),
    ).toBe(409);
    await loginApi(regular, email, password);
    expect((await regular.get('/api/admin/users')).status()).toBe(403);
    expect((await regular.get('/api/admin/audit')).status()).toBe(403);
    expect(
      (
        await regular.post('/api/admin/users', {
          headers: origin,
          data: {
            name: 'Escalacion',
            email: 'escalation@example.test',
            password,
            role: 'admin',
          },
        })
      ).status(),
    ).toBe(403);
    expect(
      (
        await regular.post('/api/auth/update-user', {
          headers: origin,
          data: { role: 'admin' },
        })
      ).status(),
    ).toBe(404);
    expect(
      (
        await regular.post('/api/auth/admin/set-role', {
          headers: origin,
          data: { userId: user.id, role: 'admin' },
        })
      ).status(),
    ).toBe(404);
    for (const role of ['admin', 'user']) {
      expect(
        (
          await request.patch(`/api/admin/users/${user.id}`, {
            headers: origin,
            data: { name: 'Prueba de permisos', role, disabled: false },
          })
        ).status(),
      ).toBe(200);
      expect((await regular.get('/api/me')).status()).toBe(401);
      await loginApi(regular, email, password);
      expect((await (await regular.get('/api/me')).json()).user.role).toBe(
        role,
      );
    }
    expect(
      (
        await request.patch(`/api/admin/users/${user.id}`, {
          headers: origin,
          data: { name: 'Prueba de permisos', role: 'user', disabled: true },
        })
      ).status(),
    ).toBe(200);
    expect((await regular.get('/api/me')).status()).toBe(401);
    expect(
      (
        await regular.post('/api/auth/sign-in/email', {
          headers: origin,
          data: { email, password },
        })
      ).status(),
    ).toBe(403);
    expect(
      (
        await request.patch(`/api/admin/users/${user.id}`, {
          headers: origin,
          data: { name: 'Prueba de permisos', role: 'user', disabled: false },
        })
      ).status(),
    ).toBe(200);
    await loginApi(regular, email, password);
    expect(
      (
        await request.post(`/api/admin/users/${user.id}/revoke-sessions`, {
          headers: origin,
        })
      ).status(),
    ).toBe(200);
    expect((await regular.get('/api/me')).status()).toBe(401);
    const events = await (await request.get('/api/admin/audit')).json();
    expect(
      events.events.some(
        (event: { action: string; targetId: string }) =>
          event.action === 'session.revoked_all' && event.targetId === user.id,
      ),
    ).toBe(true);
    expect(JSON.stringify(events)).not.toContain(password);
  } finally {
    await request.patch(`/api/admin/users/${user.id}`, {
      headers: origin,
      data: {
        name: 'Prueba de permisos (finalizada)',
        role: 'user',
        disabled: true,
      },
    });
    await regular.dispose();
  }
});

test('login, HttpOnly cookie, session persistence, admin interface and logout', async ({
  page,
}) => {
  await page.goto('/usuarios');
  await expect(page).toHaveURL(/\/login$/);
  await page.screenshot({ path: 'test-results/login.png', fullPage: true });
  await loginPage(page);
  const cookies = await page.context().cookies();
  const cookie = cookies.find((item) => item.name.includes('session_token'));
  expect(cookie?.httpOnly).toBe(true);
  expect(cookie?.sameSite).toBe('Lax');
  expect(await page.evaluate(() => document.cookie)).not.toContain(
    'session_token',
  );
  await page.reload();
  await expect(page.getByRole('navigation')).toBeVisible();
  await page.getByRole('link', { name: 'Usuarios', exact: true }).click();
  await expect(page.getByRole('cell', { name: adminEmail })).toBeVisible();
  await page.getByRole('button', { name: 'Crear usuario' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Cancelar' }).click();
  await page.screenshot({
    path: 'test-results/users-desktop.png',
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: 'test-results/users-mobile.png',
    fullPage: true,
  });
  await page
    .getByRole('button', { name: 'Cerrar sesión', exact: true })
    .click();
  await expect(page).toHaveURL(/\/login$/);
  expect((await page.request.get('/api/me')).status()).toBe(401);
  await page.goto('/usuarios');
  await expect(page).toHaveURL(/\/login$/);
});

test('password change invalidates other sessions and the old password', async ({
  request,
  playwright,
}) => {
  await loginApi(request);
  const email = `password-${randomUUID()}@example.test`;
  const password = `Before-${randomUUID()}`;
  const nextPassword = `After-${randomUUID()}`;
  const created = await request.post('/api/admin/users', {
    headers: origin,
    data: { name: 'Prueba de contraseña', email, password, role: 'user' },
  });
  expect(created.status()).toBe(201);
  const user = await created.json();
  const first = await playwright.request.newContext({
    baseURL: 'http://localhost:5173',
  });
  const second = await playwright.request.newContext({
    baseURL: 'http://localhost:5173',
  });
  try {
    await loginApi(first, email, password);
    await loginApi(second, email, password);
    const changed = await first.post('/api/auth/change-password', {
      headers: origin,
      data: {
        currentPassword: password,
        newPassword: nextPassword,
        revokeOtherSessions: true,
      },
    });
    expect(changed.status(), await changed.text()).toBe(200);
    expect((await second.get('/api/me')).status()).toBe(401);
    expect(
      (
        await second.post('/api/auth/sign-in/email', {
          headers: origin,
          data: { email, password },
        })
      ).status(),
    ).toBe(401);
    await loginApi(second, email, nextPassword);
  } finally {
    await request.patch(`/api/admin/users/${user.id}`, {
      headers: origin,
      data: {
        name: 'Prueba de contraseña (finalizada)',
        role: 'user',
        disabled: true,
      },
    });
    await first.dispose();
    await second.dispose();
  }
  expect(adminPassword.length).toBeGreaterThanOrEqual(12);
});
