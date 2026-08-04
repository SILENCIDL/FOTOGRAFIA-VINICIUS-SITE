import { SignJWT, jwtVerify } from 'jose';
import type { AstroCookies } from 'astro';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import { users, type User } from '../db/schema';
import { hashPassword, verifyPassword, decrypt } from './crypto';
import { verificarCodigo } from './totp';

const SESSION_COOKIE = '__session';
const JWT_ALG = 'HS256';

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET não configurado ou muito curto (mínimo 32 caracteres).');
  }
  return new TextEncoder().encode(secret);
}

export type SessionUser = Pick<User, 'id' | 'email' | 'role'>;

export async function createUser(
  email: string,
  password: string,
  role: User['role'] = 'editor'
): Promise<User> {
  const passwordHash = await hashPassword(password);
  const [user] = await db
    .insert(users)
    .values({ email: email.toLowerCase().trim(), passwordHash, role })
    .returning();
  return user;
}

export async function authenticateUser(
  email: string,
  password: string
): Promise<SessionUser | null> {
  const user = await db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase().trim()),
  });
  if (!user) return null;
  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return null;
  return { id: user.id, email: user.email, role: user.role };
}

export type ResultadoSegundoFator = 'DISPENSADO' | 'OK' | 'FALTA_CODIGO' | 'CODIGO_INVALIDO';

/**
 * Segundo fator, depois de a senha já ter sido conferida.
 *
 * Aceita o código do aplicativo ou um código de recuperação — e o de
 * recuperação é queimado no uso, para que um papel fotografado não vire
 * chave permanente.
 */
export async function verificarSegundoFator(
  email: string,
  codigo?: string
): Promise<ResultadoSegundoFator> {
  const user = await db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase().trim()),
  });

  // 2FA só vale depois de confirmado; cadastro pela metade não tranca ninguém
  if (!user || !user.totpEnabledAt || !user.totpSecret) return 'DISPENSADO';
  if (!codigo) return 'FALTA_CODIGO';

  const segredo = decrypt(user.totpSecret);
  if (verificarCodigo(segredo, codigo)) return 'OK';

  // não bateu como TOTP: pode ser código de recuperação
  const hashes: string[] = user.totpRecoveryCodes ? JSON.parse(user.totpRecoveryCodes) : [];
  for (const hash of hashes) {
    if (await verifyPassword(codigo.trim().toUpperCase(), hash)) {
      const restantes = hashes.filter((h) => h !== hash);
      await db
        .update(users)
        .set({ totpRecoveryCodes: JSON.stringify(restantes) })
        .where(eq(users.id, user.id));
      return 'OK';
    }
  }

  return 'CODIGO_INVALIDO';
}

export async function createSession(cookies: AstroCookies, user: SessionUser): Promise<void> {
  const token = await new SignJWT({ sub: user.id, email: user.email, role: user.role })
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuedAt()
    .setIssuer('vinicius-rafael-site')
    .setAudience('vinicius-rafael-site')
    .setExpirationTime('24h')
    .sign(getSecret());

  cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24, // 24h
  });
}

export async function getSession(cookies: AstroCookies): Promise<SessionUser | null> {
  const token = cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: [JWT_ALG],
      issuer: 'vinicius-rafael-site',
      audience: 'vinicius-rafael-site',
    });
    return {
      id: payload.sub as string,
      email: payload.email as string,
      role: payload.role as User['role'],
    };
  } catch {
    return null;
  }
}

export function destroySession(cookies: AstroCookies): void {
  cookies.delete(SESSION_COOKIE, { path: '/' });
}

export function requireAuth(session: SessionUser | null, allowedRoles?: User['role'][]): SessionUser {
  if (!session) {
    throw new Error('UNAUTHORIZED');
  }
  if (allowedRoles && !allowedRoles.includes(session.role)) {
    throw new Error('FORBIDDEN');
  }
  return session;
}
