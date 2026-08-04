import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { files } from '../../../db/schema';
import { getSession, requireAuth } from '../../../lib/auth';
import { errorResponse, jsonResponse, logAction } from '../../../lib/api';
import { saveFile, getMaxFileSize, isAllowedMimeType } from '../../../lib/storage';

export const POST: APIRoute = async (context) => {
  const session = await getSession(context.cookies);
  try {
    requireAuth(session, ['admin', 'editor']);
  } catch {
    return errorResponse('Não autorizado.', 401);
  }

  try {
    const formData = await context.request.formData();
    const sessionId = formData.get('sessionId') as string;
    const file = formData.get('file') as File | null;

    if (!sessionId || !file) {
      return errorResponse('sessionId e file são obrigatórios.', 422);
    }

    if (!isAllowedMimeType(file.type)) {
      return errorResponse(`Tipo de arquivo não permitido: ${file.type}`, 415);
    }

    if (file.size > getMaxFileSize()) {
      return errorResponse('Arquivo excede o tamanho máximo permitido.', 413);
    }

    const stored = await saveFile(file);

    const [record] = await db
      .insert(files)
      .values({
        sessionId,
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
    const message = err instanceof Error ? err.message : 'Erro interno.';
    return errorResponse(message, 500);
  }
};
