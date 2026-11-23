import { describe, expect, it, vi } from 'vitest';
import { onRequest } from '../../../functions/api/[[path]]';

describe('Pages API service proxy', () => {
  it('forwards POST bodies, origin and cookies without exposing another hostname', async () => {
    const fetch = vi.fn(async (request: Request) => {
      expect(request.url).toBe(
        'https://meat-management.pages.dev/api/auth/sign-in/email',
      );
      expect(request.headers.get('Origin')).toBe(
        'https://meat-management.pages.dev',
      );
      expect(request.headers.get('Cookie')).toBe('session=example');
      expect(await request.json()).toEqual({ email: 'user@example.test' });
      return new Response('{}', {
        headers: {
          'Set-Cookie':
            'session=example; HttpOnly; Secure; SameSite=Lax; Path=/',
        },
      });
    });
    const response = await onRequest({
      request: new Request(
        'https://meat-management.pages.dev/api/auth/sign-in/email',
        {
          method: 'POST',
          headers: {
            Origin: 'https://meat-management.pages.dev',
            Cookie: 'session=example',
          },
          body: JSON.stringify({ email: 'user@example.test' }),
        },
      ),
      env: { API: { fetch } },
    });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(response.headers.get('Set-Cookie')).toContain('HttpOnly; Secure');
  });
  it('maps diagnostic paths while preserving the query string', async () => {
    const fetch = vi.fn(async (request: Request) => new Response(request.url));
    const response = await onRequest({
      request: new Request(
        'https://meat-management.pages.dev/api/health/db?probe=1',
      ),
      env: { API: { fetch } },
    });
    expect(await response.text()).toBe(
      'https://meat-management.pages.dev/health/db?probe=1',
    );
  });
  it('keeps administrative paths inside /api', async () => {
    const fetch = vi.fn(
      async (request: Request) => new Response(new URL(request.url).pathname),
    );
    expect(
      await (
        await onRequest({
          request: new Request(
            'https://meat-management.pages.dev/api/admin/users',
          ),
          env: { API: { fetch } },
        })
      ).text(),
    ).toBe('/api/admin/users');
  });
  it('returns 503 for an unbound environment instead of contacting production', async () => {
    expect(
      (
        await onRequest({
          request: new Request('https://preview.pages.dev/api/me'),
          env: {},
        })
      ).status,
    ).toBe(503);
  });
  it('returns a sanitized 502 if the Worker fails', async () => {
    const response = await onRequest({
      request: new Request('https://meat-management.pages.dev/api/me'),
      env: {
        API: {
          fetch: async () => {
            throw new Error('private details');
          },
        },
      },
    });
    expect(response.status).toBe(502);
    expect(await response.text()).not.toContain('private details');
  });
});
