import { z } from 'zod';

export const passwordSchema = z
  .string()
  .min(12, 'Usa al menos 12 caracteres.')
  .max(128);
export const createUserSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    email: z.email().trim().toLowerCase().max(254),
    password: passwordSchema,
    role: z.enum(['admin', 'user']),
  })
  .strict();
export const updateUserSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    role: z.enum(['admin', 'user']),
    disabled: z.boolean(),
  })
  .strict();
