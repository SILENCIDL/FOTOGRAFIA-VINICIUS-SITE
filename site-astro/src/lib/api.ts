import type { APIContext } from 'astro';
import { db } from '../db';
import { auditLogs } from '../db/schema';
import { hashIp } from './crypto';

export function jsonResponse(data: unknown, status = 200, headers?: HeadersInit): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

export function errorResponse(message: string, status = 400): Response {
  return jsonResponse({ success: false, error: message }, status);
}

/**
 * IP de quem chamou — base do rate limit.
 *
 * `x-forwarded-for` é um header, ou seja: texto que o próprio cliente escreve.
 * Confiar nele sem condição significa que trocar uma linha da requisição a
 * cada tentativa dá tentativas infinitas, e o limite de 10 senhas por 15
 * minutos da galeria vira zero. Por isso só lemos o header quando o site
 * declara estar atrás de um proxy que reescreve esse valor (Netlify, Vercel,
 * nginx). Sem TRUST_PROXY, vale só o endereço real da conexão, que não dá
 * para forjar.
 */
export function getClientIp(context: APIContext): string {
  if (process.env.TRUST_PROXY === 'true') {
    const forwarded = context.request.headers.get('x-forwarded-for');
    // o primeiro da lista é o cliente; os demais são os proxies do caminho
    if (forwarded) return forwarded.split(',')[0].trim();
  }
  return context.clientAddress || 'unknown';
}

export async function logAction(
  context: APIContext,
  action: string,
  resource: string,
  userId?: string
): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      userId,
      action,
      resource,
      ipHash: hashIp(getClientIp(context)),
    });
  } catch {
    // falha silenciosa: não quebrar requisição por falha de log
  }
}
