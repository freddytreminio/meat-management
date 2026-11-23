import { describe, expect, it } from 'vitest';
import { authOrigins } from './origins';

describe('authentication origins by environment', () => {
  it('continues allowing the existing local browser addresses in development', () => {
    expect(authOrigins({}).trusted).toContain('http://127.0.0.1:5173');
  });
  it('trusts only the configured HTTPS origin in production', () => {
    expect(
      authOrigins({
        APP_ENV: 'production',
        AUTH_ORIGIN: 'https://meat-management.pages.dev',
      }).trusted,
    ).toEqual(['https://meat-management.pages.dev']);
  });
  it('fails closed for missing or insecure production origins', () => {
    expect(() => authOrigins({ APP_ENV: 'production' })).toThrow();
    expect(() =>
      authOrigins({
        APP_ENV: 'production',
        AUTH_ORIGIN: 'http://localhost:5173',
      }),
    ).toThrow();
    expect(() =>
      authOrigins({
        APP_ENV: 'production',
        AUTH_ORIGIN: 'https://meat-management.pages.dev/path',
      }),
    ).toThrow();
  });
});
