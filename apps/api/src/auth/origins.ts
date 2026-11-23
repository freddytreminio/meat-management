export type OriginConfig = { AUTH_ORIGIN?: string; APP_ENV?: string };

export function authOrigins(config: OriginConfig) {
  const production = config.APP_ENV === 'production';
  if (production && !config.AUTH_ORIGIN)
    throw new Error('AUTH_ORIGIN is required in production');
  const origin = config.AUTH_ORIGIN ?? 'http://localhost:5173';
  const url = new URL(origin);
  if (
    url.origin !== origin ||
    url.username ||
    url.password ||
    !['http:', 'https:'].includes(url.protocol)
  )
    throw new Error('AUTH_ORIGIN must be an exact HTTP origin');
  if (production && url.protocol !== 'https:')
    throw new Error('Production authentication requires HTTPS');
  const local =
    !production && ['localhost', '127.0.0.1'].includes(url.hostname);
  return {
    origin,
    trusted: local
      ? [...new Set([origin, 'http://localhost:5173', 'http://127.0.0.1:5173'])]
      : [origin],
  };
}
