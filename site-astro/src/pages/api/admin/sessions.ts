import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { sessions } from '../../../db/schema';
import { getSession, requireAuth } from '../../../lib/auth';
import { sessionSchema } from '../../../lib/validation';
import { hashPassword } from '../../../lib/crypto';
import { errorResponse, jsonResponse, logAction } from '../../../lib/api';
import { eq } from 'drizzle-orm';

export const POST: APIRoute = async (context) => {
  const session = await getSession(context.cookies);
  try {
    requireAuth(session, ['admin', 'editor']);
  } catch {
    return errorResponse('Não autorizado.', 401);
  }

  try {
    const body = await context.request.json();
    const parsed = sessionSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message, 422);
    }

    const { galleryPassword, expiresAt, date, ...data } = parsed.data;

    const [record] = await db
      .insert(sessions)
      .values({
        ...data,
        date: date || null,
        passwordHash: galleryPassword ? await hashPassword(galleryPassword) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      })
      .returning();

    await logAction(context, 'SESSION_CREATED', `session:${record.id}`, session!.id);

    return jsonResponse({ success: true, data: record });
  } catch (err) {
    console.error('Session create error:', err);
    return errorResponse('Erro interno.', 500);
  }
};

export const GET: APIRoute = async (context) => {
  const session = await getSession(context.cookies);
  try {
    requireAuth(session, ['admin', 'editor']);
  } catch {
    return errorResponse('Não autorizado.', 401);
  }

  const url = new URL(context.request.url);
  const clientId = url.searchParams.get('clientId');

  try {
    const rows = await db.query.sessions.findMany({
      where: clientId ? eq(sessions.clientId, clientId) : undefined,
      orderBy: (sessions, { desc }) => [desc(sessions.createdAt)],
      limit: 200,
    });
    return jsonResponse({ success: true, data: rows });
  } catch (err) {
    console.error('Session list error:', err);
    return errorResponse('Erro interno.', 500);
  }
};
