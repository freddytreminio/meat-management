import { useEffect, useState } from 'react';

type Status = 'checking' | 'ok' | 'error';

export function Diagnostics() {
  const [api, setApi] = useState<Status>('checking');
  const [db, setDb] = useState<Status>('checking');
  const [checking, setChecking] = useState(false);
  async function check() {
    setChecking(true);
    const probe = async (path: string): Promise<Status> => {
      try {
        const response = await fetch(`/api${path}`, {
          signal: AbortSignal.timeout(8000),
          cache: 'no-store',
        });
        const body: unknown = await response.json();
        return response.ok &&
          typeof body === 'object' &&
          body !== null &&
          'status' in body &&
          body.status === 'ok'
          ? 'ok'
          : 'error';
      } catch {
        return 'error';
      }
    };
    const [apiStatus, dbStatus] = await Promise.all([
      probe('/health'),
      probe('/health/db'),
    ]);
    setApi(apiStatus);
    setDb(dbStatus);
    setChecking(false);
  }
  useEffect(() => {
    void check();
  }, []);
  const label = (status: Status) =>
    ({ checking: 'Comprobando…', ok: 'Operativo', error: 'Sin conexión' })[
      status
    ];
  return (
    <div className="diagnostics">
      <section className="intro">
        <p className="eyebrow">ENTORNO DE DESARROLLO</p>
        <h1>
          Una base sólida
          <br />
          para lo que viene.
        </h1>
        <p className="description">
          Estado del entorno de desarrollo. Una conexión de extremo a extremo
          entre la interfaz, la API y PostgreSQL.
        </p>
      </section>
      <section className="services" aria-label="Estado de los servicios">
        <article>
          <span className="number">01 / INTERFAZ</span>
          <h2>React</h2>
          <p>Vite + TypeScript</p>
          <strong className="status ok">Operativo</strong>
        </article>
        <article>
          <span className="number">02 / API</span>
          <h2>Hono</h2>
          <p>Runtime local de Workers</p>
          <strong
            className={`status ${api}`}
            data-testid="api-status"
            role="status"
          >
            {label(api)}
          </strong>
        </article>
        <article>
          <span className="number">03 / DATOS</span>
          <h2>PostgreSQL</h2>
          <p>Consulta real mediante Drizzle</p>
          <strong
            className={`status ${db}`}
            data-testid="db-status"
            role="status"
          >
            {label(db)}
          </strong>
        </article>
      </section>
      <div className="actions">
        <p>La comprobación de datos verifica también la migración inicial.</p>
        <button onClick={() => void check()} disabled={checking}>
          {checking ? 'Comprobando…' : 'Comprobar conexión ↗'}
        </button>
      </div>
    </div>
  );
}
