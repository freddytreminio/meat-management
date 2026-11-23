import { integer, pgTable, timestamp } from 'drizzle-orm/pg-core';
export * from './auth';

// Únicamente un marcador técnico; no representa una entidad comercial.
export const infrastructureProbe = pgTable('infrastructure_probe', {
  id: integer('id').primaryKey(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});
