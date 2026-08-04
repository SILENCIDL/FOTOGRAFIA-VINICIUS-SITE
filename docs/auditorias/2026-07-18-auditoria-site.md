# Auditoria do site — Vinícius Rafael Fotografia

Data: 18/07/2026 · Escopo: `index.html`, `pages/`, `assets/`, `site-astro/`

O diagnóstico em uma frase: **o site tem uma identidade visual forte, mas hoje quase nenhuma foto chega ao visitante** — a maioria das galerias está quebrada por erros de caminho, e vários botões de venda não funcionam. Para um fotógrafo, isso é vitrine fechada.

---

## 1. ERROS CRÍTICOS (quebram a venda hoje)

### 1.1 Galerias de casamento estão VAZIAS
As 4 páginas `casamento-*.html` montam as fotos com caminho sem `../`:

```js
// casamento-bianca-e-donizete.html, linha 76
const basePath = "assets/img/portfolio/casamentos/Bianca & Donizete/";
// A página está em /pages/ → o navegador busca /pages/assets/... → 404 em TODAS as fotos
```
Como o `gallery.js` remove itens com erro e para após 5 falhas seguidas, o visitante vê só os títulos "O Ensaio" e "O Grande Dia" **sem nenhuma foto**. O banner do topo também não carrega (linha 42: falta `../` e há escapes `\\` inválidos no `url()`).

**Correção:** trocar para `../assets/img/...` nas 4 páginas (linhas 42 e 76 de cada uma).

### 1.2 Galerias "Rua" e "O Olhar" (páginas) também vazias
Mesmo erro: `pages/rua.html` (linhas 565 e 575) e `pages/olhar.html` (linha 556) montam `'assets/img/...'` sem `../`. O `onerror` esconde cada item → página sem fotos. **Correção:** prefixar `../`.

### 1.3 Álbum "Pamela & Juliano" sem nenhuma foto no disco
A pasta `Cerimonia/` está **vazia** e não existe `Pre Wedding/`. Tanto o álbum na home quanto `casamento-pamela-e-juliano.html` ficarão em branco mesmo após corrigir os caminhos. **Correção:** subir as fotos ou remover o álbum até tê-las.

### 1.4 "Aventura" e "Paisagem" não têm fotos reais
- `assets/img/portfolio/aventura/` e `paisagem/` contêm **apenas capa.jpg**.
- A galeria da home procura `aventura (1).jpg`…`(60).jpg` → abre vazia.
- `pages/aventura.html` usa as 4 fotos do **hero** como galeria (placeholder).
- `pages/paisagem.html` repete a **mesma capa 3×** como "galeria".

**Correção:** subir as fotos com a nomenclatura esperada, ou apontar o JS para as pastas certas.

### 1.5 O CSP do index bloqueia quase todos os botões
A meta tag CSP (linha 11 do `index.html`) tem `script-src` **sem `'unsafe-inline'`** — isso bloqueia todos os `onclick="..."` e `onerror="..."` inline. Efeito no navegador:

- Cards do portfólio (`onclick="app.openGallery(...)"`) → **não abrem**.
- Todos os CTAs "Solicitar orçamento" e o botão flutuante de WhatsApp → **mortos**.
- Os fallbacks `onerror` das imagens → não executam.

(O formulário de contato funciona porque usa `addEventListener` em arquivo externo.)

**Correção recomendada:** remover os handlers inline e usar delegação de eventos no `main.js` (ex.: `data-action="whatsapp"`), mantendo o CSP forte. Correção rápida (menos segura): adicionar `'unsafe-inline'` ao `script-src`. Obs.: o mesmo CSP está em `netlify.toml`/`vercel.json` — se publicar lá, quebraria também os scripts inline de todas as subpáginas.

### 1.6 DOIS números de WhatsApp diferentes
- `main.js` + JSON-LD: **5512981771665**
- Fallback dos rodapés (`pages/*.html`): **5512997194600**

Nas 4 páginas de casamento o `main.js` não é carregado → o rodapé usa **sempre o segundo número**. Se ele estiver errado, leads de casamento (seu ticket mais alto) vão para o número errado. **Correção:** confirmar o número certo e unificar.

### 1.7 Menu mobile morto nas subpáginas
- `portfolio.html` e `casamentos.html`: carregam só `main.js`; o `app.init()` chama `initHeroSlideshow()` (que vive em `slideshow.js`, não carregado) → **ReferenceError** interrompe o init antes de `initMobileMenu()`. Hambúrguer não abre.
- `casamento-*.html`: têm o botão hambúrguer, mas **nenhum JS de menu** é carregado.

**Correção:** proteger o init (`if (typeof initHeroSlideshow === 'function')`) ou carregar os módulos; nas páginas de casamento, incluir o script do menu.

### 1.8 Página de VALORES inacessível
`#prices-view` (R$ 800 / R$ 1.500 / Personalizado) existe no `index.html`, mas `app.openPrices()` **nunca é chamado por nenhum link**. O visitante não tem como chegar aos preços. **Correção:** adicionar "Investimento" na navbar/menu mobile/rodapé.

### 1.9 Depoimentos placeholder publicados
A seção "O que dizem" mostra 3 cards com o texto *"Depoimento do cliente 1 — adicione aqui o texto real"*. Isso **destrói a confiança** na hora. **Correção:** pedir 3 depoimentos reais (WhatsApp resolve em um dia) ou ocultar a seção até tê-los.

### 1.10 Outros quebrados
- `portfolio.html` linha 66: hero com `url('assets/img/portfolio/capa.jpg')` sem `../` → fundo preto.
- Carrossel do `portfolio.html` **não inclui a categoria Aventura** (a página existe).
- E-mail dos rodapés: `contato@fotop.com.br` — domínio placeholder do template, provavelmente inválido.
- `pages/indexa.html`: versão antiga da home ainda publicada (design/valores antigos) → conteúdo duplicado e risco de alguém cair nela. Excluir.
- Botões "voltar" da SPA não usam histórico: o **botão Voltar do navegador sai do site** em vez de fechar a galeria.

---

## 2. PERFORMANCE (o maior freio invisível)

| Fato | Medição |
|---|---|
| Peso total de `assets/img` | **893 MB** |
| Arquivos acima de 2 MB | **175** |
| Hero da home (com `preload` + eager) | `hero(1).jpg` = **14,5 MB**, 5568×3712 (direto da câmera) |
| Capa de Aventura | 14,5 MB (mesmo arquivo do hero, duplicado) |
| Versões .webp geradas | **0** |

Um visitante 4G baixa ~15 MB antes de ver a primeira dobra — muitos desistem antes disso. O script `scripts/optimize-images.mjs` já existe e **nunca foi rodado**.

**Plano de imagens (maior ganho por hora investida):**
1. Redimensionar tudo para máx. **2560px** no lado maior, qualidade ~80 → foto típica cai de 8–14 MB para 300–600 KB (site inteiro: de 893 MB para ~50–70 MB).
2. Rodar o `optimize-images.mjs` (gera .webp) e servir via `<picture>` ou trocar direto para .webp.
3. Adicionar `width`/`height` nos `<img>` (elimina layout shift) e `srcset` no hero.
4. Publicação: GitHub Pages tem limite prático de ~1 GB por repositório — você está no limite. Com as fotos otimizadas o problema some; alternativa: hospedar imagens no Cloudinary (grátis até 25 GB, redimensiona sozinho).

**Outros pesos removíveis:**
- **Chart.js** é carregado na home mas `#skillsChart` não existe em nenhuma página → remover a tag (linha 26).
- **Tailwind Play CDN** (`cdn.tailwindcss.com`) é para protótipos: compila no navegador a cada visita. Trocar por build estático do Tailwind (ou pelas classes já existentes no seu CSS próprio).
- Font Awesome completo para ~6 ícones → usar SVGs inline (você já faz isso em vários lugares).

---

## 3. SEO (fotógrafo vive de ser encontrado)

1. **Placeholders `SEU-DOMINIO`** ainda ativos em: JSON-LD do index, `robots.txt` e `sitemap.xml` → Google recebe URLs inválidas. Trocar pelo domínio real.
2. **Sem `og:image`** — quando alguém compartilha seu site no WhatsApp (seu principal canal!), **não aparece foto nenhuma** no preview. Para fotógrafo é imperdoável: defina uma imagem forte de 1200×630.
3. **Sem favicon** em nenhuma página, sem canonical, sem `theme-color`.
4. **`alt=""` em todas as fotos das galerias** (19+ ocorrências + geradas via JS). Google Imagens é tráfego gratuito para fotógrafo: alt descritivo tipo `"Casamento na Serra da Mantiqueira — cerimônia ao pôr do sol, São Bento do Sapucaí"`.
5. Pastas com espaço e `&` nas URLs (`Bianca & Donizete/Pre Wedding/(1).jpg`) funcionam, mas geram links frágeis. Padrão recomendado: `bianca-donizete/cerimonia/01.jpg`.
6. Títulos de página OK; faltam meta descriptions nas páginas de casamento.

---

## 4. ARQUITETURA — três sites em um

Hoje existem **3 versões concorrentes**: a SPA do `index.html`, as páginas estáticas em `pages/` e o projeto `site-astro/` (que já refaz tudo com rotas de verdade + área de cliente + admin). Isso dobra o trabalho e gera as inconsistências acima (fontes diferentes em `paisagem.html`, números de WhatsApp divergentes, galerias duplicadas com comportamentos diferentes).

**Recomendação:** eleger o **Astro** como destino final (resolve SPA/histórico/SEO e conecta com a galeria privada de clientes — que, aliás, cumpre a promessa "galeria online privada" do seu passo 3). Enquanto isso, corrigir apenas os bugs críticos do site estático.

**Segurança no `site-astro/` (importante):**
- Existe `.env` com `JWT_SECRET`, `APP_ENCRYPTION_KEY` e `DATABASE_URL` e **não há `.gitignore`** na pasta. Se isso for para o GitHub, suas credenciais vazam. Criar `.gitignore` com `.env`, `dist/`, `node_modules/` **e trocar os segredos** se o repositório já for público.

---

## 5. MELHORIAS PARA VENDER COM OLHAR ÚNICO

Ordenadas por impacto:

1. **Prova social real** — 3 depoimentos verdadeiros com nome + tipo de serviço (e, ideal, foto do casal). É o item nº 1 de conversão para casamento.
2. **Valores acessíveis** — linkar a página de preços. Quem vê "a partir de R$ 800" se qualifica sozinho e chega no WhatsApp mais pronto pra fechar.
3. **Cada casamento como história, não como pasta de fotos** — abrir com 1 parágrafo: local, estação, um detalhe que só você viu ("a neblina subiu exatamente na hora dos votos"). Depois uma frase do casal. Isso transforma galeria em narrativa — e é exatamente o "olhar único" que você quer vender.
4. **og:image + favicon** — todo link seu compartilhado no WhatsApp deve carregar uma foto sua de impacto.
5. **Curadoria sobre volume** — 138 fotos em "Rua" dilui. 25–35 fotos fortíssimas por galeria vendem mais que 100 medianas. Você é o curador do próprio olhar.
6. **Legendas técnicas como assinatura visual** — você já usa DM Mono como "voz técnica" (coordenadas no hero). Estenda: no lightbox, uma linha discreta `PEDRA DO BAÚ · 05H52 · 24mm` reforça o posicionamento "quem conhece a Serra por dentro".
7. **Instagram vivo na home** — uma faixa com as 6 últimas fotos do @viniciusrafaelgs (mesmo estática, atualizada por você) conecta o site ao canal onde você posta toda semana.
8. **CTA por contexto** — na galeria de casamento, o botão flutuante deveria dizer "Quero isso no meu casamento" (mensagem pré-preenchida citando o álbum visto), não o genérico "Solicitar orçamento".
9. **Seção "Gestão de Redes Sociais"** destoa do portfólio artístico — considere uma página própria com exemplos de feeds, deixando a home 100% fotografia.
10. **História no botão Voltar** — usar `history.pushState` na SPA (ou concluir a migração Astro) para o Voltar do navegador funcionar como o visitante espera.

---

## 6. PLANO DE AÇÃO SUGERIDO

| Ordem | Ação | Esforço | Impacto |
|---|---|---|---|
| 1 | Corrigir caminhos `../` (casamentos, rua, olhar, portfolio hero) | 30 min | Fotos voltam a existir |
| 2 | Unificar número de WhatsApp + e-mail real | 15 min | Leads no lugar certo |
| 3 | Resolver CSP (delegação de eventos ou `'unsafe-inline'`) | 1–2 h | Botões de venda funcionam |
| 4 | Redimensionar/otimizar imagens + rodar `optimize-images.mjs` | 2 h | Site 10× mais rápido |
| 5 | Depoimentos reais + link para Valores | 1 dia (depende dos clientes) | Conversão |
| 6 | og:image, favicon, domínio real no SEO, alts descritivos | 2 h | Compartilhamento + Google |
| 7 | Subir fotos de Aventura/Paisagem/Pamela ou ocultar seções | — | Sem galerias vazias |
| 8 | `.gitignore` + rotação de segredos no site-astro | 30 min | Segurança |
| 9 | Excluir `indexa.html`, consolidar rumo ao Astro | contínuo | Manutenção sã |
