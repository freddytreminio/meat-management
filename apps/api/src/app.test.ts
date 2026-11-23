import { describe, expect, it, vi } from 'vitest';
import { createApp } from './app';

describe('health API', () => {
  it('checks liveness without opening a database connection', async () => {
    const probe = vi.fn();
    const response = await createApp(probe).request('/health');
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      status: 'ok',
      service: 'meat-management-api',
    });
    expect(probe).not.toHaveBeenCalled();
  });
  it('passes the environment connection to the database probe', async () => {
    const result = {
      status: 'ok' as const,
      database: 'connected' as const,
      migration: 'applied' as const,
    };
    const probe = vi.fn().mockResolvedValue(result);
    const response = await createApp(probe).request(
      '/health/db',
      {},
      { DATABASE_URL: 'postgresql://local/test' },
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(result);
    expect(probe).toHaveBeenCalledWith('postgresql://local/test');
  });
  it('reports database failures without leaking internal information', async () => {
    const response = await createApp(async () => {
      throw new Error('secret password');
    }).request('/health/db', {}, { DATABASE_URL: 'local' });
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      status: 'error',
      database: 'unavailable',
    });
  });
  it('fails readiness when configuration is absent', async () => {
    const response = await createApp().request(
      '/health/db',
      {},
      { DATABASE_URL: '' },
    );
    expect(response.status).toBe(503);
  });
  it('returns a JSON 404 for unknown routes', async () => {
    const response = await createApp().request('/products');
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'not_found' });
  });
});
