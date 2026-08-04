# Deploy em VPS Próprio — Vinícius Rafael Fotografia

Este guia assume um servidor Linux (Ubuntu 22.04/24.04 LTS) com Docker e Docker Compose instalados.

## 1. Requisitos no servidor

```bash
# Instalar Docker (se não tiver)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Instalar Docker Compose (se necessário)
sudo apt update && sudo apt install -y docker-compose-plugin
```

## 2. Preparar variáveis de ambiente

Copie `.env.example` para `.env` e preencha com valores fortes:

```bash
cp .env.example .env
nano .env
```

**Mínimo obrigatório:**

```env
NODE_ENV=production
DATABASE_URL=postgres://vinicius:SUBSTITUA_SENHA_FORTE@postgres:5432/vinicius_site
JWT_SECRET=gerado_com:_openssl_rand_-base64_48
APP_ENCRYPTION_KEY=gerado_com:_openssl_rand_-base64_48
PUBLIC_SITE_URL=https://SEU-DOMINIO.com.br
```

> Gere segredos fortes com: `openssl rand -base64 48`

## 3. Subir banco e aplicação

```bash
# No diretório site-astro/
docker compose up -d --build
```

Isso sobe:
- PostgreSQL 16 (persistente em volume Docker)
- Aplicação Astro SSR na porta 3000 (localhost apenas)

## 4. Rodar migrations

```bash
docker compose exec app npx drizzle-kit migrate
```

## 5. Criar primeiro usuário admin

```bash
docker compose exec app node scripts/seed-admin.mjs seu@email.com "SENHA_FORTE_12+_CARACTERES"
```

## 6. Configurar Nginx como reverse proxy + SSL

Instale o Nginx e Certbot:

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

Crie `/etc/nginx/sites-available/vinicius`:

```nginx
server {
    listen 80;
    server_name SEU-DOMINIO.com.br www.SEU-DOMINIO.com.br;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    client_max_body_size 100M;
}
```

Ative e gere certificado SSL:

```bash
sudo ln -s /etc/nginx/sites-available/vinicius /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d SEU-DOMINIO.com.br -d www.SEU-DOMINIO.com.br
```

## 7. Headers de segurança

O `netlify.toml`/`vercel.json` da raiz não se aplicam no VPS. Adicione no Nginx:

```nginx
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
```

CSP já é aplicada pela aplicação quando `NODE_ENV=production` (ver `BaseLayout`).

## 8. Backup do banco

Adicione ao crontab do servidor (`crontab -e`):

```cron
0 3 * * * docker compose exec -T postgres pg_dump -U vinicius vinicius_site > /backups/vinicius_$(date +\%Y\%m\%d_\%H\%M\%S).sql
```

Também configure backup do volume de uploads (`./uploads`).

## 9. Atualizações

```bash
cd /caminho/do/site-astro
git pull
npm ci --omit=dev
docker compose up -d --build
```

## 10. Comandos úteis

```bash
# Ver logs
docker compose logs -f app

# Acessar banco
docker compose exec postgres psql -U vinicius -d vinicius_site

# Parar tudo
docker compose down

# Parar e remover volumes (CUIDADO: apaga dados)
docker compose down -v
```
