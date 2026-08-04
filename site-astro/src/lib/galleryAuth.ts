/**
 * Acesso do cliente à galeria privada.
 *
 * Antes, acertar a senha gravava o cookie `gallery_<id>` com o texto "1".
 * Isso não provava nada: qualquer pessoa com o endereço da galeria mandava
 * `Cookie: gallery_<id>=1` na mão e entrava sem senha nenhuma. httpOnly não
 * protege disso — ele impede o JavaScript de OUTRO site de ler o cookie, não
 * impede o próprio visitante de forjar a requisição.
 *
 * Agora o cookie carrega um token assinado pelo servidor. Sem a JWT_SECRET
 * não dá para fabricar um válido.
 *
 * O token é deliberadamente separado do de admin:
 *   - audience 'gallery'  -> este arquivo
 *   - audience 'vinicius-rafael-site' -> lib/auth.ts (admin)
 * Cada verificador exige a sua. Assim um token de cliente nunca vira sessão
 * de admin, nem o contrário.
 */
import { SignJWT, jwtVerify } from 'jose';
import type { AstroCookies } from 'astro';

const JWT_ALG = 'HS256';
const ISSUER = 'vinicius-rafael-site';
const AUDIENCE = 'gallery';
const MAX_AGE_S = 60 * 60 * 24; // 24h

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET não configurado ou muito curto (mínimo 32 caracteres).');
  }
  return new TextEncoder().encode(secret);
}

export function galleryCookieName(sessionId: string): string {
  return `gallery_${sessionId}`;
}

/**
 * Emite o token e grava o cookie.
 *
 * path é '/' de propósito: as fotos são servidas por /api/uploads/<id>, que
 * precisa enxergar este cookie para saber que o portador tem direito à
 * galeria. Com o path antigo ('/galeria/<id>') o cookie nunca chegava lá —
 * era por isso que o cliente destravava a galeria e mesmo assim via as fotos
 * quebradas.
 *
 * `expiresAt` da sessão, quando existir, encurta a validade: uma galeria que
 * expira amanhã não deve emitir token de 24h hoje à noite.
 */
export async function grantGalleryAccess(
  cookies: AstroCookies,
  sessionId: string,
  expiresAt?: Date | null
): Promise<void> {
  const agora = Math.floor(Date.now() / 1000);
  let exp = agora + MAX_AGE_S;
  if (expiresAt) {
    const fim = Math.floor(new Date(expiresAt).getTime() / 1000);
    if (fim < exp) exp = fim;
  }

  const token = await new SignJWT({ typ: 'gallery' })
    .setProtectedHeader({ alg: JWT_ALG })
    .setSubject(sessionId)
    .setIssuedAt(agora)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime(exp)
    .sign(getSecret());

  cookies.set(galleryCookieName(sessionId), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    // 'lax' e não 'strict': o cliente chega pelo link que o fotógrafo mandou
    // no WhatsApp. Com 'strict' o cookie não vai junto nessa primeira
    // navegação e ele veria a tela de senha de novo mesmo já tendo entrado.
    sameSite: 'lax',
    path: '/',
    maxAge: exp - agora,
  });
}

/** true se o portador do cookie tem acesso comprovado a esta galeria. */
export async function hasGalleryAccess(
  cookies: AstroCookies,
  sessionId: string
): Promise<boolean> {
  const token = cookies.get(galleryCookieName(sessionId))?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: [JWT_ALG],
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    // o token vale para UMA galeria — a que ele nomeia, e nenhuma outra
    return payload.sub === sessionId && payload.typ === 'gallery';
  } catch {
    return false;
  }
}

export function revokeGalleryAccess(cookies: AstroCookies, sessionId: string): void {
  cookies.delete(galleryCookieName(sessionId), { path: '/' });
}
