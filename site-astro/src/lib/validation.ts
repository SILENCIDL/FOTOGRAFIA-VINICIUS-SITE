import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido.').max(255),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres.').max(128),
});

export const contactSchema = z.object({
  name: z.string().min(2, 'Nome muito curto.').max(150),
  email: z.string().email('E-mail inválido.').max(255),
  phone: z.string().max(50).optional().or(z.literal('')),
  message: z.string().min(10, 'Mensagem muito curta.').max(5000),
  consent: z.literal('on', {
    errorMap: () => ({ message: 'Você deve aceitar a política de privacidade.' }),
  }),
});

export const clientSchema = z.object({
  name: z.string().min(2).max(200),
  email: z.string().email().max(255).optional().or(z.literal('')),
  phone: z.string().max(50).optional().or(z.literal('')),
  notes: z.string().max(10000).optional().or(z.literal('')),
});

export const sessionSchema = z.object({
  clientId: z.string().uuid(),
  title: z.string().min(2).max(200),
  date: z.string().date().optional().or(z.literal('')),
  type: z.string().max(100).optional().or(z.literal('')),
  status: z.enum(['pending', 'done', 'delivered', 'archived']).default('pending'),
  galleryPassword: z.string().min(6).max(128).optional().or(z.literal('')),
  expiresAt: z.string().datetime().optional().or(z.literal('')),
});

export const galleryAccessSchema = z.object({
  sessionId: z.string().uuid(),
  password: z.string().min(1),
});
