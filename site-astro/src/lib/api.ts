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

export function getClientIp(context: APIContext): string {
  const forwarded = context.request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
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
