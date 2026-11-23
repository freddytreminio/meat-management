type Context = {
  request: Request;
  env: { API?: { fetch(request: Request): Promise<Response> } };
};

export async function onRequest({ request, env }: Context): Promise<Response> {
  if (!env.API)
    return Response.json(
      { error: 'La API no está configurada para este entorno.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  const url = new URL(request.url);
  // Conserva las rutas existentes del diagnóstico de Vite.
  url.pathname = url.pathname.replace(/^\/api\/health(?=\/|$)/, '/health');
  try {
    return await env.API.fetch(new Request(url, request));
  } catch {
    return Response.json(
      { error: 'La API no está disponible. Intenta de nuevo.' },
      { status: 502, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
