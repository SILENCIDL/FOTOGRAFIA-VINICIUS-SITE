import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from 'crypto';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

function getKey(): Buffer {
  const secret = process.env.APP_ENCRYPTION_KEY;
  if (!secret || secret.length < 32) {
    throw new Error(
      'APP_ENCRYPTION_KEY não configurada ou muito curta (mínimo 32 caracteres).'
    );
  }
  return scryptSync(secret, 'vinicius-site-salt', 32);
}

export function encrypt(text: string): string {
  const key = getKey();
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const result = Buffer.concat([iv, authTag, encrypted]);
  return result.toString('base64');
}

export function decrypt(encryptedBase64: string): string {
  const key = getKey();
  const data = Buffer.from(encryptedBase64, 'base64');
  const iv = data.subarray(0, 16);
  const authTag = data.subarray(16, 32);
  const encrypted = data.subarray(32);
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}

/**
 * Pseudônimo do IP para o log de auditoria.
 *
 * Antes usava bcrypt, que sorteia um salt novo a cada chamada: o mesmo IP
 * saía com hash diferente toda vez. O log ficava sem serventia justamente no
 * que ele existe para responder — "foram 300 tentativas da mesma origem ou de
 * 300 origens?" — e ainda gastava o custo de um KDF por requisição.
 *
 * HMAC com chave fixa do servidor dá o inverso: mesmo IP, mesmo valor, então
 * dá para correlacionar; e sem a chave ninguém reverte o IP a partir do log
 * (o espaço de IPv4 é pequeno demais para um hash sem chave aguentar).
 */
export function hashIp(ip: string): string {
  const secret = process.env.APP_ENCRYPTION_KEY;
  if (!secret) return 'unknown';
  return createHmac('sha256', secret).update(ip).digest('hex').slice(0, 32);
}

export function secureCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
