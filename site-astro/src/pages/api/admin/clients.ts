import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { clients } from '../../../db/schema';
import { clientSchema } from '../../../lib/validation';
import { getSession, requireAuth } from '../../../lib/auth';
import { encrypt } from '../../../lib/crypto';
import { errorResponse, jsonResponse, logAction } from '../../../lib/api';

export const POST: APIRoute = async (context) => {
  const session = await getSession(context.cookies);
  try {
    requireAuth(session, ['admin', 'editor']);
  } catch {
    return errorResponse('Não autorizado.', 401);
  }

  try {
    const body = await context.request.json();
    const parsed = clientSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message, 422);
    }

    const { notes, ...data } = parsed.data;

    const [client] = await db
      .insert(clients)
      .values({
        ...data,
        notes: notes ? encrypt(notes) : null,
      })
      .returning();

    await logAction(context, 'CLIENT_CREATED', `client:${client.id}`, session!.id);

    return jsonResponse({ success: true, data: client });
  } catch (err) {
    console.error('Client create error:', err);
    return errorResponse('Erro interno.', 500);
  }
};
