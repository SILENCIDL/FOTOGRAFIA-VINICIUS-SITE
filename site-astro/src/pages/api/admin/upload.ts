import type { APIRoute } from 'astro';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '../../../db';
import { files, sessions } from '../../../db/schema';
import { getSession, requireAuth } from '../../../lib/auth';
import { errorResponse, jsonResponse, getClientIp, logAction } from '../../../lib/api';
import { rateLimitByIp } from '../../../lib/rateLimit';
import { saveFile, getMaxFileSize } from '../../../lib/storage';

const uploadSchema = z.object({
  sessionId: z.string().uuid('sessionId inválido.'),
});

export const POST: APIRoute = async (context) => {
  const session = await getSession(context.cookies);
  try {
    requireAuth(session, ['admin', 'editor']);
  } catch {
    return errorResponse('Não autorizado.', 401);
  }

  // conta comprometida não deve conseguir encher o disco em minutos
  const limit = rateLimitByIp(getClientIp(context), 'upload', 120, 60 * 60 * 1000);
  if (!limit.allowed) {
    return errorResponse('Muitos envios. Tente novamente mais tarde.', 429);
  }

  try {
    const formData = await context.request.formData();
    const file = formData.get('file');

    const parsed = uploadSchema.safeParse({ sessionId: formData.get('sessionId') });
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message, 422);
    }
    if (!(file instanceof File) || file.size === 0) {
      return errorResponse('Envie um arquivo.', 422);
    }
    if (file.size > getMaxFileSize()) {
      return errorResponse('Arquivo excede o tamanho máximo permitido.', 413);
    }

    // sem isto, um sessionId inexistente estoura a chave estrangeira e a
    // mensagem do Postgres ia embrulhada na resposta
    const alvo = await db.query.sessions.findFirst({
      where: eq(sessions.id, parsed.data.sessionId),
    });
    if (!alvo) {
      return errorResponse('Sessão não encontrada.', 404);
    }

    // saveFile confere os bytes reais e recusa o que não for imagem/PDF
    const stored = await saveFile(file);

    const [record] = await db
      .insert(files)
      .values({
        sessionId: parsed.data.sessionId,
        originalName: stored.originalName,
        storageKey: stored.storageKey,
        mimeType: stored.mimeType,
        sizeBytes: stored.sizeBytes,
        isPublic: false,
      })
      .returning();

    await logAction(context, 'FILE_UPLOADED', `file:${record.id}`, session!.id);

    return jsonResponse({ success: true, data: record });
  } catch (err) {
    console.error('Upload error:', err);
    // Recusa por tipo ou tamanho é informação útil e segura de devolver. Já um
    // erro inesperado carrega caminho de disco e mensagem do Postgres — isso
    // fica no log do servidor, não na resposta ao cliente.
    const conhecido =
      err instanceof Error &&
      (err.message.startsWith('Arquivo ') || err.message.startsWith('Tipo de arquivo '));
    return conhecido
      ? errorResponse((err as Error).message, 415)
      : errorResponse('Erro interno.', 500);
  }
};
