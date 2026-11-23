export type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  disabled: boolean;
  createdAt: string;
};
export type Me = {
  user: Pick<User, 'id' | 'name' | 'email' | 'role'>;
  session: { id: string; expiresAt: string };
  permissions: string[];
};
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    signal: options?.signal ?? AbortSignal.timeout(15000),
  });
  const result = await response.json();
  if (!response.ok) {
    if (response.status === 401 && path !== '/me')
      window.dispatchEvent(new Event('session-expired'));
    throw new ApiError(
      response.status,
      result.error ?? 'No se pudo completar la solicitud.',
    );
  }
  return result as T;
}
