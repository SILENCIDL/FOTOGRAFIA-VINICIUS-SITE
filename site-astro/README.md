# Vinícius Rafael Fotografia — Astro SSR

Site com área administrativa, banco de dados PostgreSQL e galerias privadas.

## Stack

- **Astro** em modo SSR (`output: 'server'`)
- **PostgreSQL** via Drizzle ORM
- **bcrypt** + **jose** para autenticação
- **AES-256-GCM** para campos sensíveis
- Docker + Docker Compose para deploy em VPS

## Como rodar localmente

### 1. Banco de dados

Você pode usar Docker para subir um PostgreSQL local:

```bash
cd site-astro
cp .env.example .env
# ajuste DATABASE_URL se necessário

docker run -d \
  --name vinicius_postgres_local \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=vinicius_site \
  -p 127.0.0.1:5432:5432 \
  -v postgres_local:/var/lib/postgresql/data \
  postgres:16-alpine
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Rodar migrations

```bash
npx drizzle-kit migrate
```

### 4. Criar usuário admin

```bash
node scripts/seed-admin.mjs seu@email.com "senha_forte_12+_caracteres"
```

### 5. Iniciar servidor de desenvolvimento

```bash
npm run dev
```

Acesse `http://localhost:4321` e `http://localhost:4321/admin/login`.

## Deploy em VPS

Veja o passo a passo completo em [`DEPLOY.md`](./DEPLOY.md).

## Estrutura de segurança

Leia [`SECURITY.md`](./SECURITY.md).

## Funcionalidades

- [x] Formulário de contato com rate limit
- [x] Área administrativa protegida
- [x] Cadastro de clientes
- [x] Criação de sessões/galerias privadas
- [x] Upload de arquivos com controle de acesso
- [x] Galeria privada por senha
- [x] Logs de auditoria
- [ ] 2FA para admin
- [ ] Política de privacidade e termos de uso
- [ ] Endpoint LGPD (exportar/deletar dados)
