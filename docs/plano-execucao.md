# Plano de Execução — Pipeline de Imagens + Migração para Astro

Dois planos passo a passo. Faça o **Parte A (imagens)** primeiro: dá ganho imediato e
funciona com o site atual. A **Parte B (Astro)** é o passo estrutural — e quando você
chegar nela, o Astro passa a otimizar imagens sozinho (a Parte A vira opcional).

Pré-requisito comum: ter o **Node.js** instalado (`node -v` deve responder). Se não tiver,
baixe em nodejs.org (versão LTS).

---

# PARTE A — Pipeline de otimização de imagens

Objetivo: transformar os JPGs pesados em `.webp` (60–80% menores) sem quebrar nada.
Os originais continuam no lugar; o `.webp` é gerado ao lado.

### Passo 1 — Instalar a ferramenta
Na raiz do projeto:
```
npm init -y           (só se ainda não houver package.json)
npm i -D sharp
```

### Passo 2 — Rodar o script (já está pronto no repositório)
O arquivo `scripts/optimize-images.mjs` já existe. Rode:
```
node scripts/optimize-images.mjs
```
Ele percorre `assets/img/`, cria um `.webp` ao lado de cada `.jpg/.png` e mostra
quanto espaço economizou. Rodar de novo só processa o que for novo.

> Quer versões responsivas (tamanhos diferentes por tela)? Abra o script e preencha
> `const WIDTHS = [480, 960, 1600];`. Ele gera `nome-480.webp`, `nome-960.webp`, etc.

### Passo 3 — Fazer o site usar o .webp (com fallback)

**3a. Galerias dinâmicas** (`assets/js/gallery.js`) — onde a maioria das fotos é carregada.
Troque a função `_makeItem` para tentar `.webp`, cair para `.jpg` e só então remover:

```javascript
function _makeItem(src, gridRef) {
  const item = document.createElement('div');
  item.className = 'masonry-item overflow-hidden rounded-sm shadow-2xl loading-skeleton min-h-[150px] md:min-h-[200px] reveal';

  const webp = src.replace(/\.(jpe?g|png)$/i, '.webp');
  const img = document.createElement('img');
  img.src       = webp;          // tenta o webp primeiro
  img.dataset.jpg = src;         // guarda o original
  img.alt       = '';
  img.decoding  = 'async';
  img.loading   = 'lazy';
  img.className = 'w-full h-auto object-cover transition-all duration-700 opacity-0 cursor-pointer';

  img.onload  = () => { img.classList.replace('opacity-0', 'opacity-100'); item.classList.remove('loading-skeleton'); };
  img.onerror = function () {
    if (this.src.endsWith('.webp')) { this.src = this.dataset.jpg; }  // cai para o jpg
    else { item.remove(); }                                          // jpg também falhou
  };
  img.addEventListener('click', () => lightbox.open(img, gridRef));

  item.appendChild(img);
  return item;
}
```

**3b. Imagens fixas** (hero, capas) — use `<picture>` para servir webp com fallback jpg.
Exemplo para uma capa de categoria:
```html
<picture>
  <source srcset="assets/img/portfolio/paisagem/capa.webp" type="image/webp">
  <img src="assets/img/portfolio/paisagem/capa.jpg" alt="Paisagem"
       onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2070&auto=format&fit=crop'"
       class="w-full h-full object-cover">
</picture>
```
O navegador usa o `.webp` se existir; senão, o `.jpg`; senão, o fallback da web.

### Passo 4 — Conferir e publicar
Abra o site localmente, veja se as imagens carregam, e suba:
```
git add -A
git commit -m "otimizacao de imagens (webp + fallback)"
git push origin main
```

**Resultado esperado:** páginas muito mais leves, especialmente no celular.

---

# PARTE B — Migração para Astro (com navbar/footer componentizados)

Objetivo: navbar e footer viram **um arquivo só** cada, reutilizado em todas as páginas;
o Astro otimiza imagens nativamente e envia HTML puro (rápido). Migração **incremental**.

> Sugestão: faça isso numa branch separada (`git checkout -b astro`) para não mexer no
> site atual enquanto testa.

### Passo 1 — Criar o projeto Astro
```
npm create astro@latest -- --template minimal
```
Aponte para uma pasta nova (ex.: `site-astro/`) ou para a raiz. Depois:
```
npx astro add tailwind
```

### Passo 2 — Estrutura de pastas
```
src/
  layouts/   BaseLayout.astro
  components/ Navbar.astro  Footer.astro
  pages/     index.astro  portfolio.astro  paisagem.astro ...
  styles/    (mova aqui os CSS de assets/css)
public/
  assets/img/   (mova as imagens para cá)
```
No Astro, tudo em `public/` é servido como está — os caminhos `assets/img/...` continuam valendo.

### Passo 3 — Componente Navbar (`src/components/Navbar.astro`)
Extraia a navbar do `index.html` para um arquivo só:
```astro
---
const links = [
  { href: '/portfolio', label: 'Portfólio' },
  { href: '/#servicos', label: 'Serviços' },
  { href: '/#sobre',    label: 'Sobre' },
  { href: '/#contato',  label: 'Contato', cta: true },
];
---
<nav id="navbar" class="fixed w-full z-50 transition-all duration-500 py-5">
  <div class="max-w-7xl mx-auto px-5 md:px-8 flex justify-between items-center">
    <a href="/" class="fotop-logo z-50">Vinícius Rafael</a>
    <div class="hidden md:flex items-center space-x-10">
      {links.map(l => (
        <a href={l.href} class={l.cta ? 'nav-cta-fotop' : 'nav-link-fotop'}>{l.label}</a>
      ))}
    </div>
    <button id="mobile-menu-btn" class="md:hidden z-50 p-2" aria-label="Abrir menu">
      <i class="fas fa-bars text-xl" style="color:#f0ede6;"></i>
    </button>
  </div>
</nav>
```

### Passo 4 — Componente Footer (`src/components/Footer.astro`)
Mesma ideia: cole o `<footer>` atual do `index.html` aqui dentro. Uma mudança aqui
passa a refletir em **todas** as páginas.

### Passo 5 — Layout base (`src/layouts/BaseLayout.astro`)
Junta `<head>`, navbar, conteúdo e footer:
```astro
---
import Navbar from '../components/Navbar.astro';
import Footer from '../components/Footer.astro';
const { title = 'Vinícius Rafael | Fotografia', description = '' } = Astro.props;
---
<!DOCTYPE html>
<html lang="pt-BR" class="scroll-smooth">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{title}</title>
  <meta name="description" content={description} />
  <!-- fontes, CSS, etc. -->
</head>
<body class="antialiased" style="background-color:#0d0d0b; color:#f0ede6;">
  <Navbar />
  <slot />        <!-- aqui entra o conteúdo de cada página -->
  <Footer />
</body>
</html>
```

### Passo 6 — Migrar uma página de exemplo (`src/pages/index.astro`)
```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---
<BaseLayout title="Vinícius Rafael | Fotografia · Serra da Mantiqueira"
            description="Fotografia que respira altitude...">
  <!-- cole aqui o conteúdo de #main-view do index.html atual -->
</BaseLayout>
```
Repita para `portfolio`, `paisagem`, `aventura`, `rua`, `olhar`, casamentos — cada uma
some a navbar/footer duplicados e passa a usar o `BaseLayout`. Aqui você também **unifica
o design da `paisagem.html`** (Eixo "consistência"), já que todas herdam o mesmo layout.

### Passo 7 — Otimização de imagem nativa do Astro
Onde quiser otimização automática (webp/avif + responsivo), troque `<img>` por `<Image>`:
```astro
---
import { Image } from 'astro:assets';
import capa from '../assets/img/portfolio/paisagem/capa.jpg';
---
<Image src={capa} alt="Paisagem" widths={[480, 960, 1600]} />
```
Isso substitui a Parte A para essas imagens — o Astro gera os tamanhos e formatos sozinho.

### Passo 8 — Testar e publicar
```
npm run dev      # vê o site em localhost
npm run build    # gera a pasta dist/ pronta para publicar
```
Publique a pasta `dist/` na **Netlify** ou **Vercel** (os arquivos `netlify.toml` /
`vercel.json` que já criamos aplicam os headers de segurança automaticamente).

---

## Como os dois planos se encaixam

- **Curto prazo:** Parte A entrega imagens leves no site atual, sem mudar nada de arquitetura.
- **Médio prazo:** Parte B remove a duplicação, unifica o design e passa a otimizar imagens
  sozinha — momento em que o script da Parte A deixa de ser necessário.
- Fazer A agora **não desperdiça** trabalho: os `.webp` continuam úteis e o aprendizado
  de `<picture>`/fallback se aplica igual.

## Ordem recomendada
1. Parte A (1–2 horas) → ganho de performance imediato.
2. SEO técnico + depoimentos reais (do roadmap) → enquanto decide a migração.
3. Parte B numa branch → migrar `index` primeiro, validar, depois as demais páginas.
