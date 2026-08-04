/**
 * Cadastro e desligamento do segundo fator da própria conta.
 *
 * São três passos, e a ordem importa: o 2FA só passa a ser EXIGIDO depois que
 * a pessoa provar que o aplicativo dela está gerando o código certo. Ligar
 * antes disso é a receita para se trancar para fora do próprio painel.
 *
 *   POST {acao:'iniciar'}                  -> devolve segredo + URI do QR
 *   POST {acao:'confirmar', codigo, segredo} -> liga e devolve os códigos de recuperação
 *   POST {acao:'desligar', senha}          -> desliga (pede a senha de novo)
 */
import type { APIRoute } from 'astro';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '../../../db';
import { users } from '../../../db/schema';
import { getSession, requireAuth } from '../../../lib/auth';
import { encrypt, hashPassword, verifyPassword } from '../../../lib/crypto';
import { gerarSegredo, verificarCodigo, uriDeCadastro, gerarCodigosDeRecuperacao } from '../../../lib/totp';
import { errorResponse, jsonResponse, getClientIp, logAction } from '../../../lib/api';
import { rateLimitByIp } from '../../../lib/rateLimit';

const schema = z.discriminatedUnion('acao', [
  z.object({ acao: z.literal('iniciar') }),
  z.object({
    acao: z.literal('confirmar'),
    segredo: z.string().min(16).max(64),
    codigo: z.string().length(6),
  }),
  z.object({ acao: z.literal('desligar'), senha: z.string().min(8).max(128) }),
]);

export const POST: APIRoute = async (context) => {
  const session = await getSession(context.cookies);
  try {
    requireAuth(session, ['admin', 'editor']);
  } catch {
    return errorResponse('Não autorizado.', 401);
  }

  const limit = rateLimitByIp(getClientIp(context), '2fa', 20, 15 * 60 * 1000);
  if (!limit.allowed) {
    return errorResponse('Muitas tentativas. Tente novamente mais tarde.', 429);
  }

  try {
    const parsed = schema.safeParse(await context.request.json());
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message, 422);
    }

    const user = await db.query.users.findFirst({ where: eq(users.id, session!.id) });
    if (!user) return errorResponse('Usuário não encontrado.', 404);

    if (parsed.data.acao === 'iniciar') {
      // ainda NÃO grava nada: o segredo só entra no banco depois de
      // confirmado. Ele volta para a tela e volta junto no passo seguinte.
      const segredo = gerarSegredo();
      return jsonResponse({
        success: true,
        segredo,
        uri: uriDeCadastro(segredo, user.email),
      });
    }

    if (parsed.data.acao === 'confirmar') {
      if (!verificarCodigo(parsed.data.segredo, parsed.data.codigo)) {
        return errorResponse('Código não confere. Verifique a hora do celular e tente de novo.', 400);
      }

      const recuperacao = gerarCodigosDeRecuperacao();
      const hashes = await Promise.all(recuperacao.map((c) => hashPassword(c)));

      await db
        .update(users)
        .set({
          totpSecret: encrypt(parsed.data.segredo),
          totpEnabledAt: new Date(),
          totpRecoveryCodes: JSON.stringify(hashes),
        })
        .where(eq(users.id, user.id));

      await logAction(context, 'TOTP_ATIVADO', `user:${user.id}`, user.id);

      // única vez em que os códigos aparecem em texto — depois só existe o hash
      return jsonResponse({ success: true, codigosDeRecuperacao: recuperacao });
    }

    // desligar: exige a senha de novo, para que uma sessão esquecida aberta
    // num computador emprestado não consiga remover a proteção
    if (!(await verifyPassword(parsed.data.senha, user.passwordHash))) {
      await logAction(context, 'TOTP_DESATIVAR_NEGADO', `user:${user.id}`, user.id);
      return errorResponse('Senha incorreta.', 401);
    }

    await db
      .update(users)
      .set({ totpSecret: null, totpEnabledAt: null, totpRecoveryCodes: null })
      .where(eq(users.id, user.id));

    await logAction(context, 'TOTP_DESATIVADO', `user:${user.id}`, user.id);
    return jsonResponse({ success: true });
  } catch (err) {
    console.error('2FA error:', err);
    return errorResponse('Erro interno.', 500);
  }
};
