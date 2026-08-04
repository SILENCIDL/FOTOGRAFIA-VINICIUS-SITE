/**
 * Middleware: duas garantias que não podem depender de ninguém lembrar.
 *
 * 1. PORTA DO ADMIN FECHADA POR PADRÃO
 *    Antes, cada página e cada rota de /admin chamava requireAuth por conta
 *    própria. Hoje todas chamam — conferi uma a uma. Mas isso é uma
 *    propriedade que se perde em silêncio: basta alguém criar uma rota nova e
 *    esquecer a linha, e ela nasce pública sem nada avisar. Aqui a regra é
 *    invertida: tudo sob /admin e /api/admin exige sessão ANTES de a rota
 *    rodar. A checagem de cada rota continua onde está — as duas juntas são
 *    de propósito, uma é rede da outra.
 *
 * 2. HEADERS DE SEGURANÇA EM TODA RESPOSTA
 *    O app Astro serve as próprias respostas e não tinha header nenhum. Estes
 *    aqui são os que a <meta> não consegue dar: frame-ancestors (a <meta> é
 *    ignorada), HSTS, nosniff, Referrer-Policy e Permissions-Policy.
 */
import { defineMiddleware } from 'astro:middleware';
import { getSession, requireAuth } from './lib/auth';

const PROTEGIDO = [/^\/admin(\/|$)/, /^\/api\/admin(\/|$)/];
const LIVRE = [/^\/admin\/login\/?$/];

// Mesma política do site estático (scripts/aplicar-csp-nas-paginas.py).
// 'unsafe-inline' aparece só em style-src: o CSS do projeto usa style="" nas
// tags. Em script-src NÃO existe — por isso nenhum <script> pode voltar para
// dentro do HTML (ver public/assets/js/*.js).
const CSP = [
  "default-src 'self'",
  "script-src 'self' https://cdnjs.cloudflare.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
  // unsplash é a foto de reserva quando a imagem local não existe (ver
  // docs/guia-de-imagens.md); host nomeado em vez de 'https:' solto
  "img-src 'self' data: blob: https://images.unsplash.com",
  "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com",
  "connect-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
].join('; ');

const HEADERS: Record<string, string> = {
  'Content-Security-Policy': CSP,
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
};

function exigeSessao(pathname: string): boolean {
  if (LIVRE.some((r) => r.test(pathname))) return false;
  return PROTEGIDO.some((r) => r.test(pathname));
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  if (exigeSessao(pathname)) {
    const session = await getSession(context.cookies);
    let ok = true;
    try {
      requireAuth(session, ['admin', 'editor']);
    } catch {
      ok = false;
    }
    if (!ok) {
      // API responde em JSON; página manda para o login
      return pathname.startsWith('/api/')
        ? new Response(JSON.stringify({ success: false, error: 'Não autorizado.' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json', ...HEADERS },
          })
        : context.redirect('/admin/login');
    }
  }

  const response = await next();

  for (const [nome, valor] of Object.entries(HEADERS)) {
    response.headers.set(nome, valor);
  }

  // HSTS só faz sentido sob HTTPS, e ligá-lo em localhost prende o navegador
  // do desenvolvedor em https://localhost por um ano.
  if (context.url.protocol === 'https:') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  // painel e galeria de cliente não podem ficar em cache de proxy
  if (pathname.startsWith('/admin') || pathname.startsWith('/galeria')) {
    response.headers.set('Cache-Control', 'private, no-store');
  }

  return response;
});
