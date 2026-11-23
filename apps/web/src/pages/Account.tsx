import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { auth } from '../lib/auth';
import type { Me } from '../lib/api';
export function Account() {
  const me = useQueryClient().getQueryData<Me>(['me']);
  const [current, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  return (
    <section className="page-section">
      <div className="page-heading">
        <div>
          <p className="eyebrow">TU ACCESO</p>
          <h1>Mi cuenta</h1>
          <p className="muted">
            {me?.user.name} · {me?.user.email}
          </p>
        </div>
      </div>
      <div className="account-grid">
        <section className="panel">
          <h2>Cambiar contraseña</h2>
          <p className="muted">
            Utiliza al menos 12 caracteres. Las demás sesiones se cerrarán.
          </p>
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              setMessage('');
              if (password !== confirmation) {
                setError(true);
                setMessage('Las contraseñas nuevas no coinciden.');
                return;
              }
              setBusy(true);
              try {
                const result = await auth.changePassword({
                  currentPassword: current,
                  newPassword: password,
                  revokeOtherSessions: true,
                });
                setError(!!result.error);
                setMessage(
                  result.error
                    ? 'No se pudo cambiar la contraseña. Revisa tu contraseña actual.'
                    : 'Contraseña actualizada correctamente.',
                );
                if (!result.error) {
                  setCurrent('');
                  setPassword('');
                  setConfirmation('');
                }
              } catch {
                setError(true);
                setMessage('No hay conexión con el servidor.');
              } finally {
                setBusy(false);
              }
            }}
          >
            <label htmlFor="current-password">Contraseña actual</label>
            <input
              id="current-password"
              type="password"
              required
              autoComplete="current-password"
              value={current}
              onChange={(event) => setCurrent(event.target.value)}
            />
            <label htmlFor="next-password">Nueva contraseña</label>
            <input
              id="next-password"
              type="password"
              required
              minLength={12}
              maxLength={128}
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <label htmlFor="confirm-password">Confirmar nueva contraseña</label>
            <input
              id="confirm-password"
              type="password"
              required
              minLength={12}
              maxLength={128}
              autoComplete="new-password"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
            />
            {message && (
              <p className={`notice ${error ? 'error' : ''}`} role="status">
                {message}
              </p>
            )}
            <button disabled={busy}>
              {busy ? 'Actualizando…' : 'Actualizar contraseña'}
            </button>
          </form>
        </section>
        <section className="panel session-panel">
          <h2>Sesión actual</h2>
          <p className="muted">
            Tu sesión vence el{' '}
            {me && new Date(me.session.expiresAt).toLocaleString('es-SV')}.
          </p>
          <span className="pill">
            {me?.user.role === 'admin' ? 'Administrador' : 'Usuario'}
          </span>
          <p className="muted small">
            El rol Usuario puede acceder a su cuenta y al diagnóstico. La
            administración de usuarios y la actividad están reservadas al
            administrador.
          </p>
        </section>
      </div>
    </section>
  );
}
