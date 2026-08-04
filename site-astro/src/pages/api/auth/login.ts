import type { APIRoute } from 'astro';
import { authenticateUser, createSession } from '../../../lib/auth';
import { loginSchema } from '../../../lib/validation';
import { rateLimitByIp } from '../../../lib/rateLimit';
import { errorResponse, getClientIp, jsonResponse, logAction } from '../../../lib/api';

export const POST: APIRoute = async (context) => {
  const ip = getClientIp(context);
  const limit = rateLimitByIp(ip, 'login', 5, 5 * 60 * 1000); // 5 tentativas / 5min
  if (!limit.allowed) {
    return errorResponse('Muitas tentativas. Tente novamente mais tarde.', 429);
  }

  try {
    const body = await context.request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message, 422);
    }

    const user = await authenticateUser(parsed.data.email, parsed.data.password);
    if (!user) {
      await logAction(context, 'LOGIN_FAILED', `email:${parsed.data.email}`);
      return errorResponse('E-mail ou senha inválidos.', 401);
    }

    await createSession(context.cookies, user);
    await logAction(context, 'LOGIN_SUCCESS', `user:${user.id}`, user.id);

    return jsonResponse({ success: true, user: { email: user.email, role: user.role } });
  } catch (err) {
    console.error('Login error:', err);
    return errorResponse('Erro interno.', 500);
  }
};
