import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { contacts } from '../../../db/schema';
import { contactSchema } from '../../../lib/validation';
import { rateLimitByIp } from '../../../lib/rateLimit';
import { errorResponse, getClientIp, jsonResponse, logAction } from '../../../lib/api';
import { hashIp } from '../../../lib/crypto';

export const POST: APIRoute = async (context) => {
  const ip = getClientIp(context);
  const limit = rateLimitByIp(ip, 'contact', 10, 60 * 60 * 1000); // 10 envios / hora
  if (!limit.allowed) {
    return errorResponse('Muitas mensagens enviadas. Tente novamente mais tarde.', 429);
  }

  try {
    const body = await context.request.json();
    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message, 422);
    }

    const { consent: _consent, ...data } = parsed.data;

    await db.insert(contacts).values({
      ...data,
      ipHash: hashIp(ip),
    });

    await logAction(context, 'CONTACT_CREATED', `email:${data.email}`);

    return jsonResponse({ success: true, message: 'Mensagem enviada com sucesso.' });
  } catch (err) {
    console.error('Contact error:', err);
    return errorResponse('Erro interno.', 500);
  }
};

export const GET: APIRoute = async (context) => {
  const { getSession, requireAuth } = await import('../../../lib/auth');
  const session = await getSession(context.cookies);
  try {
    requireAuth(session, ['admin', 'editor']);
  } catch {
    return errorResponse('Não autorizado.', 401);
  }

  try {
    const rows = await db.query.contacts.findMany({
      orderBy: (contacts, { desc }) => [desc(contacts.createdAt)],
      limit: 200,
    });
    return jsonResponse({ success: true, data: rows });
  } catch (err) {
    console.error('Contact list error:', err);
    return errorResponse('Erro interno.', 500);
  }
};
