import { connectDatabase } from '@meat/db';
import { createUserSchema } from '../src/auth/validation';
import { createManagedUser } from '../src/modules/administration/service';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
const data = createUserSchema.parse({
  name: 'Administrador local',
  email: process.env.BOOTSTRAP_ADMIN_EMAIL,
  password: process.env.BOOTSTRAP_ADMIN_PASSWORD,
  role: 'admin',
});
const connection = await connectDatabase(process.env.DATABASE_URL);
try {
  const created = await createManagedUser(connection.db, data, null, true);
  console.log(
    created
      ? 'Administrador inicial creado.'
      : 'Inicialización omitida: ya existen usuarios. No se modificaron contraseñas.',
  );
} finally {
  await connection.close();
}
