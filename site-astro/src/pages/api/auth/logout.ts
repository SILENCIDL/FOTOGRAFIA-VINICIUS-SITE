import type { APIRoute } from 'astro';
import { destroySession, getSession } from '../../../lib/auth';
import { jsonResponse, logAction } from '../../../lib/api';

export const POST: APIRoute = async (context) => {
  const session = await getSession(context.cookies);
  destroySession(context.cookies);
  if (session) {
    await logAction(context, 'LOGOUT', `user:${session.id}`, session.id);
  }
  return jsonResponse({ success: true });
};
