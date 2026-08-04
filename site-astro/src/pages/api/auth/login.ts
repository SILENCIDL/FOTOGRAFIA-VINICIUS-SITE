import type { APIRoute } from 'astro';
import { authenticateUser, createSession, verificarSegundoFator } from '../../../lib/auth';
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

    const segundoFator = await verificarSegundoFator(parsed.data.email, parsed.data.totp);

    if (segundoFator === 'FALTA_CODIGO') {
      // `code` avisa a tela para revelar o campo do código em vez de acusar
      // credencial errada — quem acertou e-mail e senha não deve ser mandado
      // de volta ao começo sem entender o motivo
      await logAction(context, 'LOGIN_TOTP_REQUERIDO', `user:${user.id}`, user.id);
      return jsonResponse(
        { success: false, code: 'TOTP_REQUERIDO', error: 'Digite o código do aplicativo autenticador.' },
        401
      );
    }

    if (segundoFator === 'CODIGO_INVALIDO') {
      await logAction(context, 'LOGIN_TOTP_FALHOU', `user:${user.id}`, user.id);
      return errorResponse('Código inválido.', 401);
    }

    await createSession(context.cookies, user);
    await logAction(context, 'LOGIN_SUCCESS', `user:${user.id}`, user.id);

    return jsonResponse({ success: true, user: { email: user.email, role: user.role } });
  } catch (err) {
    console.error('Login error:', err);
    return errorResponse('Erro interno.', 500);
  }
};
