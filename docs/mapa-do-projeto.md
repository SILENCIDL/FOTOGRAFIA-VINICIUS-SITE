# Mapa do Projeto — Vinícius Rafael Fotografia

## 1. Visão geral das tecnologias

| Camada | Tecnologia | Onde roda |
|--------|------------|-----------|
| Site estático (atual) | HTML5 + CSS3 + JavaScript | Navegador do usuário |
| Estilos | CSS customizado + Tailwind CSS (via CDN) | Navegador |
| Animações | GSAP + JavaScript vanilla | Navegador |
| Aplicação futura | Astro SSR + Node.js | Servidor (VPS) |
| Banco de dados | PostgreSQL | Servidor (Docker/VPS) |
| ORM | Drizzle ORM | Servidor Node.js |
| Autenticação | JWT (jose) + bcryptjs | Servidor Node.js |
| Deploy | Docker + Docker Compose + Nginx | VPS próprio |

---

## 2. Estrutura de diretórios

```
FOTOGRAFIA-VINICIUS-SITE/
├── assets/                    # Recursos estáticos do site atual
│   ├── css/                   # Folhas de estilo
│   ├── img/                   # Imagens organizadas por seção
│   └── js/                    # Scripts JavaScript
├── pages/                     # Páginas HTML internas (exceto index)
├── scripts/                   # Scripts de automação (Node.js)
├── site-astro/                # Nova aplicação Astro SSR
│   ├── src/
│   │   ├── components/        # Componentes Astro reutilizáveis
│   │   ├── db/                # Schema e conexão PostgreSQL
│   │   ├── layouts/           # Layouts de página
│   │   ├── lib/               # Utilitários de segurança
│   │   └── pages/             # Páginas e rotas de API
│   ├── drizzle/               # Migrations do banco
│   ├── scripts/               # Scripts administrativos
│   ├── Dockerfile             # Build da aplicação
│   ├── docker-compose.yml     # Orquestração app + banco
│   ├── DEPLOY.md              # Guia de deploy VPS
│   └── SECURITY.md            # Plano de segurança
├── index.html                 # Página inicial
├── netlify.toml               # Configuração Netlify
├── vercel.json                # Configuração Vercel
└── robots.txt / sitemap.xml   # SEO
```

---

## 3. Funcionalidade por arquivo — Site estático atual

### HTML (`*.html`)

| Arquivo | Função |
|---------|--------|
| `index.html` | Página inicial: hero, portfólio, sobre, serviços, contato. |
| `pages/casamentos.html` | Listagem dos álbuns de casamento. |
| `pages/casamento-*.html` | Página individual de cada álbum de casamento. |
| `pages/olhar.html` | Página do projeto autoral "O Olhar". |
| `pages/portfolio.html` | Página de portfólio com categorias. |
| `pages/rua.html` | Galeria de fotografia de rua. |

### CSS (`assets/css/`)

| Arquivo | Função |
|---------|--------|
| `reset.css` | Reset de estilos padrão dos navegadores. |
| `variables.css` | Variáveis CSS: cores, fontes, espaçamentos. |
| `base.css` | Estilos base do corpo, tipografia e utilitários. |
| `components.css` | Componentes reutilizáveis: botões, cards, formulários. |
| `sections.css` | Estilos específicos de cada seção do site. |
| `animations.css` | Animações e transições CSS. |
| `site.css` | Arquivo principal que importa os demais CSS. |

### JavaScript (`assets/js/`)

| Arquivo | Função |
|---------|--------|
| `main.js` | JavaScript principal: menu mobile, scroll, navegação SPA. |
| `gallery.js` | Construção e comportamento das galerias de imagens. |
| `lightbox.js` | Lightbox para visualização ampliada de fotos. |
| `slideshow.js` | Slides/carrosséis automáticos (hero, olhar, rua). |
| `animations.js` | Animações de entrada e scroll reveal. |
| `tailwind-config.js` | Configuração customizada do Tailwind CSS. |

### Imagens (`assets/img/`)

| Pasta | Conteúdo |
|-------|----------|
| `hero/` | Imagens de fundo do banner principal. |
| `sobre/` | Foto do fotógrafo Vinícius. |
| `olhar/slides/` | Slides do projeto "O Olhar". |
| `rua/slides/` | Slides da seção Rua. |
| `portfolio/casamentos/` | Capas e álbuns de casamento. |
| `portfolio/aventura/` | Capa da categoria Aventura (galeria interna da home). |
| `portfolio/rua/` | Capa e galeria da categoria Rua. |
| `portfolio/olhar/` | Capa e registros do projeto Olhar. |
| `_backup/capas_erradas/` | Backup das imagens incorretas substituídas. |

### Scripts (`scripts/`)

| Arquivo | Função |
|---------|--------|
| `optimize-images.mjs` | Converte JPG/PNG para WEBP e gera versões responsivas. |

---

## 4. Funcionalidade por arquivo — Nova aplicação Astro (`site-astro/`)

### Configuração

| Arquivo | Função |
|---------|--------|
| `astro.config.mjs` | Configuração do Astro em modo SSR com adapter Node.js. |
| `tailwind.config.mjs` | Tema customizado do Tailwind CSS. |
| `package.json` | Dependências e scripts do projeto. |
| `drizzle.config.ts` | Configuração do Drizzle Kit para migrations. |
| `.env.example` | Modelo das variáveis de ambiente. |
| `Dockerfile` | Build multi-stage da aplicação para produção. |
| `docker-compose.yml` | Sobe PostgreSQL + app Astro em containers. |

### Banco de dados (`src/db/`)

| Arquivo | Função |
|---------|--------|
| `schema.ts` | Define as tabelas: users, contacts, clients, sessions, files, audit_logs. |
| `index.ts` | Conexão com PostgreSQL usando node-postgres + Drizzle. |

### Segurança (`src/lib/`)

| Arquivo | Função |
|---------|--------|
| `auth.ts` | Login, criação/verificação de sessões JWT em cookies seguros. |
| `crypto.ts` | Hash de senhas (bcrypt), criptografia AES-256-GCM, hash de IP. |
| `rateLimit.ts` | Rate limit por IP para evitar abuso. |
| `validation.ts` | Schemas Zod para validação de formulários. |
| `storage.ts` | Leitura/escrita de arquivos no filesystem privado. |
| `api.ts` | Helpers para respostas JSON, logs de auditoria e obtenção de IP. |

### Páginas públicas (`src/pages/`)

| Arquivo | Função |
|---------|--------|
| `index.astro` | Home do site (protótipo). |
| `galeria/[id].astro` | Galeria privada acessível por senha. |

### Área administrativa (`src/pages/admin/`)

| Arquivo | Função |
|---------|--------|
| `login.astro` | Tela de login da área administrativa. |
| `index.astro` | Dashboard com contadores. |
| `contacts.astro` | Lista de mensagens de contato recebidas. |
| `clients.astro` | Cadastro e listagem de clientes. |
| `sessions.astro` | Criação de sessões/galerias privadas. |
| `sessions/[id].astro` | Detalhe de uma sessão com upload de arquivos. |

### Rotas de API (`src/pages/api/`)

| Arquivo | Função |
|---------|--------|
| `auth/login.ts` | Endpoint POST de autenticação. |
| `auth/logout.ts` | Endpoint POST de logout. |
| `contacts/index.ts` | Recebe mensagens de contato (POST) e lista (GET). |
| `admin/clients.ts` | CRUD de clientes. |
| `admin/sessions.ts` | CRUD de sessões/galerias. |
| `admin/upload.ts` | Upload de arquivos para galerias privadas. |
| `uploads/[id].ts` | Serve arquivos com controle de acesso. |
| `gallery/access.ts` | Valida senha de galeria e libera acesso. |

### Componentes (`src/components/`)

| Arquivo | Função |
|---------|--------|
| `Navbar.astro` | Menu de navegação desktop/mobile. |
| `Footer.astro` | Rodapé do site. |
| `BaseLayout.astro` | Layout base com head, CSS, scripts e segurança (CSP). |

### Scripts utilitários (`scripts/`)

| Arquivo | Função |
|---------|--------|
| `seed-admin.mjs` | Cria o primeiro usuário administrador no banco. |

### Migrations (`drizzle/`)

| Arquivo | Função |
|---------|--------|
| `0000_init.sql` | Cria as tabelas iniciais do banco de dados. |

---

## 5. Fluxo de execução

### Site estático atual

1. Usuário acessa `index.html`.
2. Navegador carrega CSS (`assets/css/site.css`) e JS (`assets/js/*.js`).
3. Imagens são carregadas sob demanda conforme o scroll.
4. Formulários e interações são processados no frontend.

### Nova aplicação Astro (futuro)

1. Usuário acessa o domínio.
2. Nginx repassa a requisição para o container Astro na porta 3000.
3. Astro SSR renderiza a página no servidor.
4. Se necessário, a página consulta o PostgreSQL via Drizzle ORM.
5. O HTML renderizado é enviado ao navegador.
6. Rotas `/api/*` processam ações: login, contato, upload, etc.
7. Arquivos privados só são servidos após autenticação.

---

## 6. Arquivos de configuração e documentação

| Arquivo | Função |
|---------|--------|
| `README.md` | Descrição geral do projeto. |
| `PLANO_EXECUCAO.md` | Plano de otimização de imagens e migração Astro. |
| `ROADMAP_EXPANSAO.md` | Roadmap de funcionalidades futuras. |
| `AUDITORIA_SEGURANCA_VINICIUS.md` | Auditoria de segurança realizada. |
| `GUIA_DE_IMAGENS.md` | Guia de organização das imagens. |
| `SECURITY.md` (em site-astro/) | Plano de segurança da aplicação. |
| `DEPLOY.md` (em site-astro/) | Instruções de deploy em VPS. |
| `netlify.toml` | Headers e redirects para Netlify. |
| `vercel.json` | Headers e redirects para Vercel. |
| `robots.txt` | Orientações para crawlers. |
| `sitemap.xml` | Mapa do site para SEO. |

---

## 7. Resumo das linguagens e onde executam

| Linguagem | Arquivos | Onde executa |
|-----------|----------|--------------|
| HTML | `*.html`, `*.astro` | Navegador (renderizado pelo servidor no Astro) |
| CSS | `assets/css/*.css`, Tailwind | Navegador |
| JavaScript | `assets/js/*.js` | Navegador |
| TypeScript/JavaScript | `site-astro/src/**/*.ts`, `*.mjs` | Servidor Node.js |
| SQL | `site-astro/drizzle/*.sql` | Servidor PostgreSQL |
| YAML/TOML/JSON | `docker-compose.yml`, `netlify.toml`, `vercel.json`, `package.json` | Servidores de deploy e ambiente local |
