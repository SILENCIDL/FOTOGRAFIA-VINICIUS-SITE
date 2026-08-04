/**
 * Serve um arquivo do acervo.
 *
 * Este endpoint é a porta real do cofre: a página /galeria/<id> só monta as
 * tags <img>, quem entrega o pixel é aqui. Antes, a regra era só
 * "é público OU é admin" — e isso deixava o dono da galeria numa escolha
 * ruim, sem saída boa:
 *
 *   - foto privada  -> o cliente acertava a senha e mesmo assim via imagem
 *                      quebrada (401), porque o cookie da galeria tinha path
 *                      /galeria/<id> e nunca chegava aqui;
 *   - foto pública  -> qualquer um com o UUID do arquivo baixava, sem senha
 *                      nenhuma. A senha da galeria virava enfeite.
 *
 * Agora existe o terceiro caso, que é o que o negócio precisa: o portador de
 * um token válido PARA A GALERIA DAQUELE ARQUIVO passa. Token de outra
 * galeria não serve — a checagem é contra o sessionId do próprio arquivo.
 */
import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { files } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { getSession, requireAuth } from '../../../lib/auth';
import { hasGalleryAccess } from '../../../lib/galleryAuth';
import { readStoredFile } from '../../../lib/storage';

export const GET: APIRoute = async (context) => {
  const id = context.params.id;
  if (!id) return new Response('Not found', { status: 404 });

  const file = await db.query.files.findFirst({ where: eq(files.id, id) });
  if (!file) return new Response('Not found', { status: 404 });

  let autorizado = file.isPublic;

  // 1) admin/editor logado vê tudo
  if (!autorizado) {
    const session = await getSession(context.cookies);
    try {
      requireAuth(session, ['admin', 'editor']);
      autorizado = true;
    } catch {
      /* não é admin — segue para a checagem de galeria */
    }
  }

  // 2) cliente portando token da galeria à qual este arquivo pertence
  if (!autorizado && file.sessionId) {
    autorizado = await hasGalleryAccess(context.cookies, file.sessionId);
  }

  if (!autorizado) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const { buffer, mimeType } = await readStoredFile(file.storageKey);
    return new Response(buffer, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `inline; filename="${encodeURIComponent(file.originalName)}"`,
        // foto de cliente não pode ficar em cache compartilhado de CDN/proxy
        'Cache-Control': file.isPublic ? 'public, max-age=3600' : 'private, no-store',
        // não deixar o navegador adivinhar o tipo de um arquivo enviado:
        // fecha a porta de HTML disfarçado de imagem
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
};
