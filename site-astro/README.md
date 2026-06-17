# Protótipo Astro — Vinícius Rafael Fotografia

Base da migração para Astro com **navbar e footer componentizados** (um arquivo cada,
reutilizado em todas as páginas) e a **home** já montada como exemplo.

## Como rodar

```
cd site-astro
npm install
npm run dev          # abre em http://localhost:4321
```

## Antes de rodar: copiar os arquivos estáticos

O Astro serve a pasta `public/` como raiz. Copie para dentro de `site-astro/public/`:

- `assets/css/`  →  `site-astro/public/assets/css/`
- `assets/js/`   →  `site-astro/public/assets/js/`
- `assets/img/`  →  `site-astro/public/assets/img/`

Assim os caminhos `/assets/...` usados nos componentes continuam funcionando.

## O que já está pronto

- `src/components/Navbar.astro` — menu (desktop + mobile) a partir de uma lista de links.
- `src/components/Footer.astro` — rodapé com ano automático.
- `src/layouts/BaseLayout.astro` — `<head>`, fontes, CSS, scripts e os `<slot>`.
- `src/pages/index.astro` — home com hero + portfólio (grid gerado por dados).

## Próximos passos

1. Copiar as seções restantes do `index.html` para `index.astro` (marcado no arquivo).
2. Criar `src/pages/portfolio.astro`, `paisagem.astro`, `aventura.astro`, `rua.astro`,
   `olhar.astro`, `casamentos.astro` usando o mesmo `BaseLayout` — aqui o design de
   `paisagem.html` se unifica com o resto.
3. Trocar `<img>` por `<Image />` de `astro:assets` para otimização automática (webp/avif).
4. `npm run build` → publicar a pasta `dist/` na Netlify/Vercel.

Detalhes completos em `../PLANO_EXECUCAO.md`.
