import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { sessions } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { galleryAccessSchema } from '../../../lib/validation';
import { verifyPassword } from '../../../lib/crypto';
import { errorResponse, jsonResponse, getClientIp, logAction } from '../../../lib/api';
import { rateLimitByIp } from '../../../lib/rateLimit';

export const POST: APIRoute = async (context) => {
  const ip = getClientIp(context);
  const limit = rateLimitByIp(ip, 'gallery_access', 10, 15 * 60 * 1000); // 10 tentativas / 15min
  if (!limit.allowed) {
    return errorResponse('Muitas tentativas. Tente novamente mais tarde.', 429);
  }

  try {
    const body = await context.request.json();
    const parsed = galleryAccessSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message, 422);
    }

    const { sessionId, password } = parsed.data;

    const sessionRow = await db.query.sessions.findFirst({
      where: eq(sessions.id, sessionId),
    });

    if (!sessionRow) {
      return errorResponse('Galeria não encontrada.', 404);
    }

    if (sessionRow.expiresAt && new Date(sessionRow.expiresAt) < new Date()) {
      return errorResponse('Esta galeria expirou.', 410);
    }

    if (!sessionRow.passwordHash) {
      return errorResponse('Galeria sem senha definida.', 403);
    }

    const valid = await verifyPassword(password, sessionRow.passwordHash);
    if (!valid) {
      await logAction(context, 'GALLERY_ACCESS_DENIED', `session:${sessionId}`);
      return errorResponse('Senha incorreta.', 401);
    }

    context.cookies.set(`gallery_${sessionId}`, '1', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: `/galeria/${sessionId}`,
      maxAge: 60 * 60 * 24, // 24h
    });

    await logAction(context, 'GALLERY_ACCESS_GRANTED', `session:${sessionId}`);

    return jsonResponse({ success: true });
  } catch (err) {
    console.error('Gallery access error:', err);
    return errorResponse('Erro interno.', 500);
  }
};
