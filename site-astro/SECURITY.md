# Segurança — Vinícius Rafael Fotografia

> Arquitetura: Astro SSR + PostgreSQL + armazenamento de arquivos fora da pasta pública.

Este documento descreve o que **está implementado**. O que ainda é intenção
está marcado como *planejado* — a versão anterior misturava as duas coisas, e
foi assim que a restrição de MIME type ficou anos "documentada" sem funcionar.

## 1. Autenticação e autorização

- Senhas com **bcrypt** (custo 12).
- Sessão em **JWT** (HS256, com emissor/público/expiração de 24h), em cookie
  `HttpOnly` + `Secure` + `SameSite=Strict`.
- Papéis: `admin`, `editor`, `viewer`.
- **2FA (TOTP)** implementado em `src/lib/totp.ts` — sem dependência externa,
  conferido contra os vetores oficiais da RFC 6238 (`npm run test:2fa`).
  Cadastro em `/admin/seguranca`. O segredo fica **criptografado** no banco.
  8 códigos de recuperação de uso único, guardados como hash.
  Só passa a ser exigido depois de confirmado — cadastro pela metade não
  tranca o dono para fora.
- **`src/middleware.ts` fecha `/admin/*` e `/api/admin/*` por padrão**, antes
  de a rota rodar. Cada rota continua com o próprio `requireAuth`: as duas
  camadas são de propósito. Sem o middleware, uma rota nova criada sem a
  checagem nasceria pública em silêncio.

## 2. Galeria privada do cliente

- Acesso por senha própria da sessão (bcrypt), separada da conta de admin.
- Acertar a senha emite um **token assinado** (`src/lib/galleryAuth.ts`),
  válido para **uma** galeria e com prazo. Não é um cookie com "1" dentro —
  esse era o furo: cookie o visitante escreve à mão.
- `/api/uploads/[id]` confere se o portador tem token **da galeria daquele
  arquivo**. Token de outra galeria não abre.
- `audience` do token de galeria é diferente da do token de admin, então um
  nunca vira o outro.
- Rate limit de 10 tentativas de senha por 15 min.
- Verificado em `npm run test:galeria`.

## 3. Proteção da aplicação

| Ameaça | Mitigação |
|---|---|
| SQL Injection | Drizzle ORM, queries parametrizadas. |
| XSS | Astro escapa HTML por padrão; CSP com `script-src 'self'` — **nenhum script inline**, todos em `public/assets/js/`. |
| Clickjacking | `frame-ancestors 'none'` + `X-Frame-Options: DENY`, aplicados como header pelo middleware (em `<meta>` o navegador ignora). |
| CSRF | Cookies `SameSite=Strict` na sessão de admin. |
| Força bruta | Rate limit por IP em login, contato, galeria, upload e 2FA. `x-forwarded-for` só é lido com `TRUST_PROXY=true` — senão o próprio cliente escolhe o próprio IP e escapa do limite. |
| Upload malicioso | Tipo determinado pelos **bytes reais** (assinatura), não pelo `Content-Type` declarado. Nome e extensão gerados por nós. `nosniff` na entrega. |
| Travessia de caminho | `storageKey` conferida contra formato fixo antes de virar caminho no disco. |
| Vazamento por mensagem de erro | Erro inesperado vira "Erro interno."; o detalhe fica no log do servidor. |

## 4. Banco de dados

- Campos sensíveis (`clients.notes`, `users.totp_secret`) com **AES-256-GCM**.
- IP do log de auditoria pseudonimizado com **HMAC-SHA256** — mesmo IP, mesmo
  valor, o que permite correlacionar; sem a chave, não reverte.
- Chaves estrangeiras e índices para integridade.
- *Planejado*: criptografia at-rest no volume e backup diário.

## 5. Armazenamento de arquivos

- Salvos fora da pasta pública (`./uploads`).
- Servidos só por `/api/uploads/[id]`, que autoriza por admin **ou** token da
  galeria. `Cache-Control: private, no-store` no que não é público, para não
  ficar em cache de CDN.

## 6. Conformidade LGPD

- Consentimento explícito no formulário de contato.
- Log de auditoria (`audit_logs`) nas ações sensíveis.
- *Planejado*: exportação/exclusão de dados do titular; política de
  privacidade e termos de uso.

## 7. Variáveis de ambiente críticas

Ver `.env.example` para a lista completa e o efeito de trocar cada uma.

```env
DATABASE_URL=
JWT_SECRET=            # mínimo 48 caracteres — assina sessão de admin E galeria
APP_ENCRYPTION_KEY=    # mínimo 48 caracteres — notas de cliente e segredo TOTP
TRUST_PROXY=true       # SOMENTE atrás de Netlify/Vercel/nginx
NODE_ENV=production
```

## 8. Comandos

```bash
npm test                 # galeria + upload + 2FA, sem precisar de banco

openssl rand -base64 48  # gerar segredo forte

docker compose exec app npx drizzle-kit migrate
docker compose exec app node scripts/seed-admin.mjs email@exemplo.com "senha_forte"
```

## 9. O que ainda não foi verificado

Os testes acima rodam sem banco e cobrem a lógica de autorização, do upload e
do TOTP. **O fluxo completo contra um Postgres de verdade — login com 2FA,
senha de galeria, foto entregue ao cliente — nunca foi executado**, porque o
banco ainda não existe em lugar nenhum. Antes de publicar, subir o
`docker-compose.yml`, rodar as migrations e percorrer o caminho inteiro à mão.
