import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
const names: Record<string, string> = {
  'auth.login': 'Inicio de sesión',
  'auth.logout': 'Cierre de sesión',
  'auth.login_failed': 'Intento de acceso fallido',
  'auth.password_changed': 'Contraseña actualizada',
  'user.bootstrap': 'Administrador inicial creado',
  'user.created': 'Usuario creado',
  'user.updated': 'Usuario actualizado',
  'user.disabled': 'Acceso desactivado',
  'user.enabled': 'Acceso reactivado',
  'user.role_changed': 'Rol modificado',
  'session.revoked_all': 'Sesiones cerradas',
};
export function Audit() {
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ['audit', page],
    queryFn: () =>
      api<{
        events: {
          id: string;
          action: string;
          actorId: string | null;
          actorName: string | null;
          targetId: string | null;
          createdAt: string;
        }[];
        total: number;
      }>(`/admin/audit?page=${page}`),
  });
  return (
    <section className="page-section">
      <div className="page-heading">
        <div>
          <p className="eyebrow">ADMINISTRACIÓN / HISTORIAL</p>
          <h1>Actividad</h1>
          <p className="muted">
            Registro de accesos y cambios administrativos.
          </p>
        </div>
        <button className="secondary" onClick={() => void query.refetch()}>
          Actualizar
        </button>
      </div>
      {query.isPending ? (
        <p role="status">Cargando actividad…</p>
      ) : query.isError ? (
        <p className="notice error" role="alert">
          {query.error.message}
        </p>
      ) : (
        <>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Acción</th>
                  <th>Realizada por</th>
                  <th>Referencia</th>
                </tr>
              </thead>
              <tbody>
                {query.data.events.map((event) => (
                  <tr key={event.id}>
                    <td>{new Date(event.createdAt).toLocaleString('es-SV')}</td>
                    <td>{names[event.action] ?? event.action}</td>
                    <td>
                      {event.actorName ??
                        (event.actorId ? 'Usuario' : 'Sistema')}
                    </td>
                    <td>
                      <code title={event.targetId ?? ''}>
                        {event.targetId?.slice(0, 8) ?? '—'}
                      </code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!query.data.events.length && (
              <p className="empty">Todavía no hay actividad.</p>
            )}
          </div>
          <div className="pagination">
            <button
              className="secondary"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Anterior
            </button>
            <span>
              Página {page} de {Math.max(1, Math.ceil(query.data.total / 20))}
            </span>
            <button
              className="secondary"
              disabled={page * 20 >= query.data.total}
              onClick={() => setPage(page + 1)}
            >
              Siguiente
            </button>
          </div>
        </>
      )}
    </section>
  );
}
