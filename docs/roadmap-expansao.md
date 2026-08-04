# Roadmap de Expansão — Site Vinícius Rafael Fotografia

Análise do estado atual e mapa de tudo que dá pra expandir, melhorar, trocar e tornar
mais atrativo. Organizado por eixos, com prioridade (🟢 agora / 🟡 próximo / 🔵 depois)
e o porquê de cada coisa.

---

## Diagnóstico atual

**Stack hoje:** site estático (HTML + CSS modular + JavaScript puro em módulos:
`slideshow`, `lightbox`, `gallery`, `animations`, `main`). Tailwind, GSAP, Chart.js,
Font Awesome e Google Fonts carregados por CDN. Sem etapa de build, sem backend.
Contato 100% via WhatsApp.

**Pontos fortes:**
- CSS já é modular e organizado (`reset`, `base`, `variables`, `components`, `sections`, `animations`).
- JS limpo, com módulos bem separados e carregamento lazy de galerias (IntersectionObserver).
- Identidade visual forte (Playfair + DM Sans/Mono, paleta terrosa) — base editorial bonita.
- Boas práticas já presentes: validação de formulário, rate limiting, fallbacks de imagem.

**Fragilidades a atacar (resumo):**
1. **Tailwind via CDN** — ótimo pra prototipar, ruim pra produção (carrega ~3 MB de JS e gera CSS no navegador). Pesa e atrasa o primeiro carregamento.
2. **Navbar e footer duplicados** em cada arquivo HTML — manutenção custosa e propensa a erro.
3. **Dois sistemas de design convivendo** — `paisagem.html` usa fontes (Montserrat/Lora) e estrutura diferentes do resto do site.
4. **Imagens não otimizadas** — JPGs grandes, sem WebP/AVIF nem `srcset` responsivo. Para um site de **fotografia**, isso é o ponto mais crítico.
5. **SEO incompleto** — sem `sitemap.xml`, `robots.txt`, dados estruturados (JSON-LD) nem Open Graph por página.

---

## Eixo 1 — Tecnologia & arquitetura

### 🟢 Sair do Tailwind CDN para um build real
Trocar `<script src="cdn.tailwindcss.com">` por Tailwind compilado (Tailwind CLI ou Vite).
Gera só o CSS usado (de MBs para ~10–30 KB) e remove JS desnecessário do navegador.
Ganho direto em velocidade e nota de performance.

### 🟡 Migrar para um gerador de site estático (recomendado: **Astro**)
Astro é praticamente feito para sites de portfólio/conteúdo:
- **Componentes reutilizáveis** — navbar e footer viram um arquivo só, incluído em todas as páginas (resolve a duplicação).
- **Zero JS por padrão** — envia HTML puro; só hidrata o que precisa de interação (galeria, lightbox).
- **Otimização de imagem nativa** (`<Image />`) — gera WebP/AVIF e `srcset` automaticamente.
- Mantém quase todo o CSS e JS atuais — migração incremental, não reescrita do zero.

Alternativa mais leve, sem framework: manter HTML puro e usar **includes via 11ty (Eleventy)**
só para deduplicar navbar/footer. Menor curva de aprendizado.

### 🟡 Componentizar navbar, footer e cards
Independente da ferramenta, transformar navbar/footer/cards de categoria em peças únicas.
Hoje uma mudança no menu exige editar ~10 arquivos.

### 🔵 TypeScript nos módulos JS
Trocar `.js` por `.ts` traz autocompletar e pega erros antes de rodar. Opcional, mas
valioso conforme o código cresce.

---

## Eixo 2 — Imagens (o coração de um site de fotografia)

### 🟢 Converter para WebP/AVIF + versões responsivas
JPGs atuais provavelmente têm 2–5 MB cada. WebP/AVIF reduz 60–80% sem perda visível.
Servir tamanhos diferentes por tela (`srcset`/`sizes`) economiza muito no celular.

### 🟢 Lazy loading + LQIP (placeholder borrado)
Já há `loading="lazy"`. Somar um placeholder borrado/baixa-resolução que carrega instantâneo
e dá sensação de site rápido e premium.

### 🟡 CDN de imagens
Cloudflare Images, imgix ou Bunny entregam a foto já redimensionada e otimizada por
dispositivo, sem você gerar versões manualmente.

### 🔵 Proteção do acervo
Marca d'água discreta opcional e desativar arrastar/baixar nas galerias públicas
(não impede print, mas reduz uso indevido).

---

## Eixo 3 — Novas páginas & funcionalidades

| Página/Recurso | Prioridade | Valor |
|---|---|---|
| **Pacotes/Preços dedicada** | 🟢 | Já existe como view escondida no `index.html` — virar página própria com SEO. Transparência converte. |
| **Depoimentos reais** | 🟢 | Os 3 cards na home estão com texto placeholder. Substituir por avaliações reais (foto, nome, tipo de serviço). |
| **Página de contato dedicada** | 🟡 | Com mapa da Mantiqueira, área de atuação, horários, além do WhatsApp. |
| **Blog / Diário de bordo** | 🟡 | Posts de trilhas, bastidores e ensaios. Forte para SEO ("fotógrafo São Bento do Sapucaí", "pré-wedding Pedra do Baú"). |
| **FAQ** | 🟡 | Reduz dúvidas repetidas no WhatsApp (prazos, deslocamento, entrega). |
| **Área do cliente / galeria privada** | 🔵 | Cada casal acessa as próprias fotos com senha — já é prometido no texto da home ("galeria online privada"). |
| **Loja de prints** | 🔵 | Vender fotos de paisagem impressas (fonte de renda passiva). |
| **Agendamento online** | 🔵 | Calendário de disponibilidade (Calendly/Cal.com) para sessões. |

---

## Eixo 4 — Conversão, marketing & SEO

### 🟢 SEO técnico
- `sitemap.xml` + `robots.txt`.
- **JSON-LD** `LocalBusiness`/`Photograph` (aparece melhor no Google, com estrelas e local).
- Meta `description` e **Open Graph** únicos por página (hoje algumas páginas repetem ou faltam).
- Revisar `alt` de todas as imagens (acessibilidade + SEO de imagem).

### 🟢 Analytics
Google Analytics 4 ou Plausible (mais leve e privado). Rastrear cliques no WhatsApp
para saber quais páginas convertem.

### 🟡 Formulário com backend de verdade
Hoje o form só monta uma mensagem de WhatsApp. Adicionar **Netlify Forms** ou **Formspree**
para também receber por e-mail e ter registro dos leads — sem precisar de servidor.

### 🟡 Feed do Instagram embutido
Puxar os posts recentes (`@viniciusrafaelgs`) direto na home — prova social e conteúdo sempre novo.

---

## Eixo 5 — Performance

- 🟢 Auto-hospedar as fontes (Google Fonts local) — remove uma ida a servidor externo e melhora privacidade.
- 🟢 Carregar **GSAP e Chart.js só onde são usados** (Chart.js parece usado só na home; não precisa em todas as páginas).
- 🟡 `defer`/`async` consistente em todos os scripts.
- 🟡 Pré-carregar só a 1ª imagem do hero (já feito no `index.html`) e replicar nas outras páginas.
- 🔵 Transformar em **PWA** (instalável no celular, funciona offline) — sensação de app.

---

## Eixo 6 — Acessibilidade & UX

- 🟢 Estados de foco visíveis (navegação por teclado) e navegação por teclado no lightbox (setas, Esc).
- 🟢 Contraste de alguns textos cinza sobre fundo escuro está no limite — revisar para WCAG AA.
- 🟡 `prefers-reduced-motion` para quem prefere menos animação (acessibilidade + conforto).
- 🟡 Microinterações sutis (já há GSAP) e indicadores de carregamento nas galerias grandes.

---

## Eixo 7 — Alcance & atratividade

- 🟡 **Site bilíngue (PT/EN)** — a Serra da Mantiqueira atrai turistas; inglês amplia o público de paisagem/aventura.
- 🟡 **Hero em vídeo** curto (loop) no lugar do slideshow — altíssimo impacto para fotografia/aventura.
- 🔵 Mapa interativo com os pontos da Mantiqueira onde você fotografa.
- 🔵 Modo "antes/depois" de edição em alguns trabalhos — mostra o valor do pós-processo.

---

## Consistência de design (dívida a quitar)

`paisagem.html` está fora do padrão (fontes e estrutura diferentes). Ao componentizar
(Eixo 1), alinhar todas as páginas ao mesmo sistema visual do `index.html`/`aventura.html`.
Resultado: o site inteiro "fala a mesma língua".

---

## Roadmap priorizado

**🟢 Agora (rápido, alto impacto):**
1. Otimizar imagens (WebP/AVIF + responsivas) — maior ganho para um site de fotos.
2. Tailwind via build (sai do CDN).
3. SEO técnico (sitemap, robots, JSON-LD, OG por página) + Analytics.
4. Depoimentos reais e página de Preços própria.

**🟡 Próximo (estrutural):**
5. Migrar para Astro (ou 11ty) e componentizar navbar/footer/cards.
6. Unificar o design da `paisagem.html`.
7. Formulário com backend (Netlify Forms/Formspree) + feed do Instagram.
8. Blog/Diário e FAQ.

**🔵 Depois (expansão):**
9. Bilíngue PT/EN, hero em vídeo, PWA.
10. Área do cliente (galerias privadas), loja de prints, agendamento online.

---

## A decisão-chave

Tudo gira em torno de uma escolha:

- **Manter "sem build"** (HTML puro): mais simples de mexer, mas a duplicação e a falta de
  otimização vão pesando conforme o site cresce.
- **Adotar Astro** (recomendado): um passo a mais de setup, mas resolve de uma vez
  componentização, otimização de imagem e performance — e é o caminho natural para
  blog, loja e área do cliente no futuro.

Para um site de fotografia que vai crescer, **Astro + pipeline de imagens** é o melhor
custo-benefício de longo prazo. Dá pra migrar incrementalmente, sem jogar nada fora.
