import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  BrowserRouter,
  Link,
  NavLink,
  Navigate,
  Outlet,
  Route,
  Routes,
  useNavigate,
} from 'react-router-dom';
import {
  Activity,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  UserRound,
  Users as UsersIcon,
} from 'lucide-react';
import { api, ApiError, type Me } from './lib/api';
import { auth } from './lib/auth';
import { Login } from './pages/Login';
import { Users } from './pages/Users';
import { Audit } from './pages/Audit';
import { Account } from './pages/Account';
import { Diagnostics } from './pages/Diagnostics';
import './styles.css';
import './admin.css';

const client = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: true } },
});
function Protected({ admin = false }: { admin?: boolean }) {
  const cache = useQueryClient();
  const me = useQuery({
    queryKey: ['me'],
    queryFn: () => api<Me>('/me'),
    refetchInterval: 60000,
  });
  useEffect(() => {
    const expired = () => {
      void cache.invalidateQueries({ queryKey: ['me'] });
    };
    window.addEventListener('session-expired', expired);
    return () => window.removeEventListener('session-expired', expired);
  }, [cache]);
  if (me.isPending)
    return (
      <main>
        <p role="status">Comprobando sesión…</p>
      </main>
    );
  if (me.error instanceof ApiError && me.error.status === 401)
    return <Navigate to="/login" replace />;
  if (me.isError)
    return (
      <main>
        <p role="alert">No pudimos comprobar tu sesión.</p>
        <button onClick={() => void me.refetch()}>Reintentar</button>
      </main>
    );
  if (admin && me.data?.user.role !== 'admin')
    return <Navigate to="/" replace />;
  return <Outlet />;
}
function Shell() {
  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => api<Me>('/me'),
  });
  const cache = useQueryClient();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <Link className="brand" to="/">
          MM<span className="brand-dot">.</span>
        </Link>
        <p className="sidebar-label">ESPACIO DE TRABAJO</p>
        <nav aria-label="Navegación principal">
          <NavLink to="/" end>
            <LayoutDashboard size={18} /> Resumen
          </NavLink>
          {me?.user.role === 'admin' && (
            <>
              <NavLink to="/usuarios">
                <UsersIcon size={18} /> Usuarios
              </NavLink>
              <NavLink to="/actividad">
                <Activity size={18} /> Actividad
              </NavLink>
            </>
          )}
          <NavLink to="/cuenta">
            <UserRound size={18} /> Mi cuenta
          </NavLink>
        </nav>
        <div className="sidebar-footer">
          <ShieldCheck size={17} />
          <span>
            Acceso controlado
            <br />
            <small>Entorno local · Fase 02</small>
          </span>
        </div>
      </aside>
      <div className="admin-content">
        <header className="topbar">
          <span className="environment">Entorno local</span>
          <div className="identity">
            <span>
              <strong>{me?.user.name}</strong>
              <small>
                {me?.user.role === 'admin' ? 'Administrador' : 'Usuario'}
              </small>
            </span>
            <button
              className="icon-button"
              aria-label="Cerrar sesión"
              disabled={signingOut}
              onClick={async () => {
                setSigningOut(true);
                setLogoutError('');
                try {
                  const result = await auth.signOut();
                  if (result.error) throw new Error('logout');
                  cache.clear();
                  navigate('/login', { replace: true });
                } catch {
                  setLogoutError(
                    'No se pudo cerrar la sesión. Intenta de nuevo.',
                  );
                } finally {
                  setSigningOut(false);
                }
              }}
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>
        <main className="content-main">
          {logoutError && (
            <p className="notice error" role="alert">
              {logoutError}
            </p>
          )}
          <Outlet />
        </main>
        <footer className="content-footer">
          Meat Management · Administración local
        </footer>
      </div>
    </div>
  );
}
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={client}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<Protected />}>
            <Route element={<Shell />}>
              <Route index element={<Diagnostics />} />
              <Route path="cuenta" element={<Account />} />
              <Route element={<Protected admin />}>
                <Route path="usuarios" element={<Users />} />
                <Route path="actividad" element={<Audit />} />
              </Route>
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
