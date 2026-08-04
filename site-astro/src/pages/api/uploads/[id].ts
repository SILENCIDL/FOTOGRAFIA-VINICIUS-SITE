import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { files } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { getSession, requireAuth } from '../../../lib/auth';
import { readStoredFile } from '../../../lib/storage';

export const GET: APIRoute = async (context) => {
  const session = await getSession(context.cookies);
  const adminSession = session ? (() => {
    try {
      requireAuth(session, ['admin', 'editor']);
      return true;
    } catch {
      return false;
    }
  })() : false;

  const id = context.params.id;
  if (!id) return new Response('Not found', { status: 404 });

  const file = await db.query.files.findFirst({ where: eq(files.id, id) });
  if (!file) return new Response('Not found', { status: 404 });

  // Arquivos não-públicos só admin pode ver
  if (!file.isPublic && !adminSession) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const { buffer, mimeType } = await readStoredFile(file.storageKey);
    return new Response(buffer, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `inline; filename="${encodeURIComponent(file.originalName)}"`,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
};
