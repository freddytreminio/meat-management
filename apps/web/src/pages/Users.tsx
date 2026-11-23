import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Search, X } from 'lucide-react';
import { api, type Me, type User } from '../lib/api';

const schema = z.object({
  name: z.string().trim().min(2, 'Escribe al menos 2 caracteres.').max(100),
  email: z.email('Escribe un correo válido.'),
  password: z.string().min(12, 'Usa al menos 12 caracteres.').max(128),
  role: z.enum(['admin', 'user']),
});
export function Users() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [editing, setEditing] = useState<User | 'new' | null>(null);
  const [message, setMessage] = useState('');
  const cache = useQueryClient();
  const me = cache.getQueryData<Me>(['me']);
  const users = useQuery({
    queryKey: ['users', page, search],
    queryFn: () =>
      api<{ users: User[]; total: number }>(
        `/admin/users?page=${page}&search=${encodeURIComponent(search)}`,
      ),
  });
  const mutate = useMutation({
    mutationFn: ({
      path,
      method,
      body,
    }: {
      path: string;
      method: string;
      body?: unknown;
    }) =>
      api(path, {
        method,
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
    onSuccess: async () => {
      setEditing(null);
      setMessage('Cambios guardados correctamente.');
      await cache.invalidateQueries({ queryKey: ['users'] });
      await cache.invalidateQueries({ queryKey: ['me'] });
      await cache.invalidateQueries({ queryKey: ['audit'] });
    },
    onError: (error: Error) => setMessage(error.message),
  });
  const total = users.data?.total ?? 0;
  return (
    <section className="page-section">
      <div className="page-heading">
        <div>
          <p className="eyebrow">ADMINISTRACIÓN / ACCESOS</p>
          <h1>Usuarios</h1>
          <p className="muted">
            Gestiona quién puede entrar y qué puede administrar.
          </p>
        </div>
        <button
          onClick={() => {
            setMessage('');
            mutate.reset();
            setEditing('new');
          }}
        >
          <Plus size={16} /> Crear usuario
        </button>
      </div>
      <div className="toolbar">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setSearch(searchInput);
            setPage(1);
          }}
        >
          <Search size={16} />
          <input
            aria-label="Buscar usuarios"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Buscar por nombre o correo"
            maxLength={100}
          />
          <button className="secondary">Buscar</button>
        </form>
        <span className="muted">
          {total} {total === 1 ? 'usuario' : 'usuarios'}
        </span>
      </div>
      {message && (
        <p className="notice" role="status">
          {message}
        </p>
      )}
      {users.isPending ? (
        <p role="status">Cargando usuarios…</p>
      ) : users.isError ? (
        <p className="notice error" role="alert">
          {users.error.message}
        </p>
      ) : (
        <>
          <div className="table-wrap">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.data.users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <strong>{user.name}</strong>
                      <span className="cell-detail">{user.email}</span>
                    </td>
                    <td>
                      <span className="pill">
                        {user.role === 'admin' ? 'Administrador' : 'Usuario'}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`status ${user.disabled ? 'error' : 'ok'}`}
                      >
                        {user.disabled ? 'Desactivado' : 'Activo'}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="secondary"
                          onClick={() => {
                            setMessage('');
                            mutate.reset();
                            setEditing(user);
                          }}
                        >
                          Editar
                        </button>
                        <button
                          className="text-button"
                          disabled={mutate.isPending}
                          onClick={() => {
                            if (
                              window.confirm(
                                user.id === me?.user.id
                                  ? 'Esto cerrará también tu sesión actual. ¿Continuar?'
                                  : `¿Cerrar todas las sesiones de ${user.name}?`,
                              )
                            )
                              mutate.mutate({
                                path: `/admin/users/${user.id}/revoke-sessions`,
                                method: 'POST',
                              });
                          }}
                        >
                          Cerrar sesiones
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!users.data.users.length && (
              <p className="empty">No se encontraron usuarios.</p>
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
              Página {page} de {Math.max(1, Math.ceil(total / 10))}
            </span>
            <button
              className="secondary"
              disabled={page * 10 >= total}
              onClick={() => setPage(page + 1)}
            >
              Siguiente
            </button>
          </div>
        </>
      )}
      {editing && (
        <UserEditor
          key={editing === 'new' ? 'new' : editing.id}
          user={editing}
          self={editing !== 'new' && editing.id === me?.user.id}
          pending={mutate.isPending}
          error={mutate.isError ? mutate.error.message : ''}
          close={() => setEditing(null)}
          save={(body) =>
            mutate.mutate({
              path:
                editing === 'new'
                  ? '/admin/users'
                  : `/admin/users/${editing.id}`,
              method: editing === 'new' ? 'POST' : 'PATCH',
              body,
            })
          }
        />
      )}
    </section>
  );
}
function UserEditor({
  user,
  self,
  pending,
  error,
  close,
  save,
}: {
  user: User | 'new';
  self: boolean;
  pending: boolean;
  error: string;
  close: () => void;
  save: (data: unknown) => void;
}) {
  const isNew = user === 'new';
  const [name, setName] = useState(isNew ? '' : user.name);
  const [role, setRole] = useState(isNew ? 'user' : user.role);
  const [disabled, setDisabled] = useState(isNew ? false : user.disabled);
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'user' },
  });
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  return (
    <div>
      <dialog
        ref={dialog}
        onCancel={close}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="editor-title"
      >
        <div className="modal-heading">
          <h2 id="editor-title">
            {isNew ? 'Crear usuario' : 'Editar usuario'}
          </h2>
          <button
            className="icon-button"
            aria-label="Cerrar formulario"
            onClick={close}
          >
            <X size={20} />
          </button>
        </div>
        {isNew ? (
          <form onSubmit={form.handleSubmit(save)}>
            <label htmlFor="new-name">Nombre</label>
            <input id="new-name" autoFocus {...form.register('name')} />
            {form.formState.errors.name && (
              <small className="field-error">
                {form.formState.errors.name.message}
              </small>
            )}
            <label htmlFor="new-email">Correo electrónico</label>
            <input
              id="new-email"
              type="email"
              autoComplete="off"
              {...form.register('email')}
            />
            {form.formState.errors.email && (
              <small className="field-error">
                {form.formState.errors.email.message}
              </small>
            )}
            <label htmlFor="new-password">Contraseña inicial</label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              {...form.register('password')}
            />
            {form.formState.errors.password && (
              <small className="field-error">
                {form.formState.errors.password.message}
              </small>
            )}
            <label htmlFor="new-role">Rol</label>
            <select id="new-role" {...form.register('role')}>
              <option value="user">Usuario</option>
              <option value="admin">Administrador</option>
            </select>
            <p className="muted small">
              El usuario podrá cambiar su contraseña desde Mi cuenta.
            </p>
            {error && (
              <p className="notice error" role="alert">
                {error}
              </p>
            )}
            <div className="modal-actions">
              <button type="button" className="secondary" onClick={close}>
                Cancelar
              </button>
              <button disabled={pending}>
                {pending ? 'Guardando…' : 'Guardar usuario'}
              </button>
            </div>
          </form>
        ) : (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              save({ name, role, disabled });
            }}
          >
            <label htmlFor="edit-name">Nombre</label>
            <input
              id="edit-name"
              autoFocus
              required
              minLength={2}
              maxLength={100}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <label htmlFor="edit-role">Rol</label>
            <select
              id="edit-role"
              disabled={self}
              value={role}
              onChange={(event) => setRole(event.target.value)}
            >
              <option value="user">Usuario</option>
              <option value="admin">Administrador</option>
            </select>
            <label className="checkbox-label">
              <input
                type="checkbox"
                disabled={self}
                checked={disabled}
                onChange={(event) => setDisabled(event.target.checked)}
              />{' '}
              Desactivar acceso
            </label>
            <p className="muted small">
              Cambiar el rol o desactivar la cuenta cierra sus sesiones. Tu
              propio acceso de administrador está protegido.
            </p>
            {error && (
              <p className="notice error" role="alert">
                {error}
              </p>
            )}
            <div className="modal-actions">
              <button type="button" className="secondary" onClick={close}>
                Cancelar
              </button>
              <button disabled={pending}>
                {pending ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        )}
      </dialog>
    </div>
  );
}
