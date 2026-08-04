# Plano de Segurança — Vinícius Rafael Fotografia

> Arquitetura: Astro SSR + PostgreSQL + armazenamento de arquivos em VPS próprio.

## 1. Autenticação e autorização

- Senhas hash com **bcrypt** (custo 12).
- Sessões via **JWT** em cookies `HttpOnly`, `Secure`, `SameSite=Strict`.
- Roles: `admin`, `editor`, `viewer`.
- 2FA (TOTP) preparado no schema, implementado na Fase 3.

## 2. Proteção da aplicação

| Ameaça | Mitigação |
|--------|-----------|
| SQL Injection | Drizzle ORM com queries parametrizadas. |
| XSS | Astro escapa HTML por padrão; CSP ativa. |
| CSRF | Cookies `SameSite=Strict`. |
| Força bruta | Rate limit por IP (login, contato, galeria). |
| Upload malicioso | Restrição de MIME type, tamanho máximo, renomeação de arquivo. |
| Exposição de dados | Nunca retornar hashes/senhas; galerias privadas por senha. |

## 3. Banco de dados

- PostgreSQL com criptografia at-rest (via container/VPS).
- Campos sensíveis (`clients.notes`) criptografados com **AES-256-GCM**.
- Índices e foreign keys para integridade.
- Backups diários recomendados.

## 4. Armazenamento de arquivos

- Arquivos salvos fora da pasta pública (`./uploads`).
- Acesso apenas via endpoint autenticado (`/api/uploads/[id]`).
- Galerias privadas exigem senha (hash Argon2/bcrypt).

## 5. Infraestrutura

- Docker Compose para isolar app e banco.
- Nginx reverse proxy + Certbot (SSL/TLS).
- Headers de segurança: CSP, HSTS, X-Frame-Options, etc.
- Variáveis sensíveis apenas em `.env` no servidor.

## 6. Conformidade LGPD

- Consentimento explícito no formulário de contato.
- Logs de auditoria (`audit_logs`) para ações sensíveis.
- Endpoint para exportação/exclusão de dados do titular (Fase 3).
- Política de privacidade e termos de uso (Fase 3).

## 7. Variáveis de ambiente críticas

```env
DATABASE_URL=
JWT_SECRET=              # mínimo 48 caracteres
APP_ENCRYPTION_KEY=    # mínimo 48 caracteres
NODE_ENV=production
```

## 8. Comandos de segurança

```bash
# Gerar segredos fortes
openssl rand -base64 48

# Rodar migrations
docker compose exec app npx drizzle-kit migrate

# Criar admin
docker compose exec app node scripts/seed-admin.mjs email@exemplo.com "senha_forte"
```
