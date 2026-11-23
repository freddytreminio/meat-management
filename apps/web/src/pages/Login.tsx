import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { ArrowUpRight, ShieldCheck } from 'lucide-react';
import { auth } from '../lib/auth';

const schema = z.object({
  email: z.email('Escribe un correo válido.'),
  password: z.string().min(1, 'Escribe tu contraseña.'),
});
export function Login() {
  const [error, setError] = useState('');
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
  });
  const navigate = useNavigate();
  const cache = useQueryClient();
  return (
    <div className="login-shell">
      <section className="login-story">
        <a className="brand" href="/">
          MM<span className="brand-dot">.</span>
        </a>
        <div>
          <p className="eyebrow">MEAT MANAGEMENT</p>
          <h1>
            Todo comienza
            <br />
            con un buen
            <br />
            control.
          </h1>
          <p>
            Un espacio para administrar los accesos
            <br />y preparar el trabajo de tu equipo.
          </p>
        </div>
        <span className="login-note">
          <ShieldCheck size={16} /> Acceso privado · Entorno local
        </span>
      </section>
      <section className="login-form">
        <div className="login-form-inner">
          <p className="eyebrow">BIENVENIDO DE NUEVO</p>
          <h2>Inicia sesión</h2>
          <p className="muted">
            Ingresa con la cuenta creada por tu administrador.
          </p>
          <form
            onSubmit={form.handleSubmit(async (values) => {
              setError('');
              try {
                const result = await auth.signIn.email({
                  ...values,
                  rememberMe: false,
                });
                if (result.error) {
                  setError(
                    result.error.status === 429
                      ? 'Demasiados intentos. Espera un minuto.'
                      : 'Revisa tus credenciales y que tu cuenta esté activa.',
                  );
                  return;
                }
                await cache.invalidateQueries({ queryKey: ['me'] });
                navigate('/', { replace: true });
              } catch {
                setError('No hay conexión con el servidor. Intenta de nuevo.');
              }
            })}
          >
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              placeholder="tu@correo.com"
              {...form.register('email')}
            />
            {form.formState.errors.email && (
              <small className="field-error">
                {form.formState.errors.email.message}
              </small>
            )}
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              {...form.register('password')}
            />
            {form.formState.errors.password && (
              <small className="field-error">
                {form.formState.errors.password.message}
              </small>
            )}
            {error && (
              <p className="notice error" role="alert">
                {error}
              </p>
            )}
            <button className="full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                'Ingresando…'
              ) : (
                <>
                  Ingresar <ArrowUpRight size={16} />
                </>
              )}
            </button>
          </form>
          <p className="login-help">
            ¿No tienes acceso? Solicita una cuenta al administrador.
          </p>
        </div>
        <footer>Meat Management · Administración de accesos</footer>
      </section>
    </div>
  );
}
