# Vinícius Rafael · Fotografia

Site institucional e portfólio de **Vinícius Rafael**, fotógrafo em São Bento do
Sapucaí — paisagem, esportes e eventos na Serra da Mantiqueira.

Domínio previsto: `viniciusrafael.fot.br`

---

## Como rodar

O site é HTML/CSS/JS estático. Não precisa de build para trabalhar nele — mas
**abrir o `index.html` direto no navegador (`file://`) quebra as galerias**, porque
o JS carrega as fotos por caminho relativo. Sempre suba um servidor local:

```bash
npx --yes serve -l 4173 .
# depois abra http://localhost:4173
```

(O VS Code já tem isso pronto em `.claude/launch.json`.)

## Estrutura

```
.
├── index.html            # home
├── pages/                # portfólio, categorias e ensaios de casamento
├── assets/
│   ├── css/              # reset → variables → base → components → sections → animations
│   ├── js/               # main.js + um pagina-*.js por página de galeria
│   ├── img/              # ORIGINAIS das fotos (pesadas)
│   └── img-web/          # versões otimizadas — é daqui que o site serve
├── scripts/              # utilitários de manutenção (otimização de imagem, correções em lote)
├── site-astro/           # protótipo Astro: área de cliente, admin e API (ainda não publicado)
├── docs/                 # documentação do projeto e auditorias
├── netlify.toml          # redirects + headers de segurança (Netlify)
├── vercel.json           # o mesmo, para Vercel
├── robots.txt / sitemap.xml
└── .nojekyll             # impede o Jekyll do GitHub Pages de processar o site
```

### As duas versões do site

| | O que é | Estado |
|---|---|---|
| **Raiz** (`index.html`, `pages/`) | Site estático publicado hoje | Em produção |
| **`site-astro/`** | Reescrita em Astro com galeria privada por cliente, login admin e banco (Postgres + Drizzle) | Protótipo, não publicado |

A migração para o Astro está descrita em [`docs/plano-execucao.md`](docs/plano-execucao.md).

## Imagens

Foto nova **não vai direto pro site**: ela entra em `assets/img/` (original) e
precisa gerar a versão de `assets/img-web/`, que é o que as páginas realmente
carregam. O caminho exato de cada categoria está em
[`docs/guia-de-imagens.md`](docs/guia-de-imagens.md).

```bash
python scripts/otimizar-fotos.py      # gera as versões web a partir dos originais
```

## Deploy

O site é servido a partir da **raiz** do repositório — por isso os arquivos HTML
ficam aqui em cima e não numa pasta `src/`. Os `redirects` do `netlify.toml` e do
`vercel.json` apontam para `/pages/...` contando com isso.

- **GitHub Pages**: publica direto da branch `main`.
- **Netlify / Vercel**: além dos redirects, aplicam os headers de segurança (CSP,
  HSTS, X-Frame-Options). O GitHub Pages **não** suporta headers customizados —
  para ter a proteção da auditoria, o site precisa sair do Pages.

## Documentação

| Documento | Para quê |
|---|---|
| [`docs/mapa-do-projeto.md`](docs/mapa-do-projeto.md) | Visão geral das tecnologias e de onde cada coisa roda |
| [`docs/plano-execucao.md`](docs/plano-execucao.md) | Pipeline de imagens + migração para Astro, passo a passo |
| [`docs/roadmap-expansao.md`](docs/roadmap-expansao.md) | O que dá pra expandir, por prioridade |
| [`docs/guia-de-imagens.md`](docs/guia-de-imagens.md) | Onde salvar cada foto |
| [`docs/auditorias/`](docs/auditorias/) | Auditorias de segurança e de site, em ordem cronológica |

## Convenções

- **Nada de acento ou espaço em nome de arquivo ou pasta novos.** Quebra deploy,
  URL e script. (As pastas de casamento em `assets/img/` ainda têm espaço e `&`
  por serem legado — não crie mais.)
- Um `pagina-<nome>.js` por página de galeria; a lógica comum fica em `main.js`
  e `gallery.js`.
- Backups, `.zip` e `.tar.gz` **não entram no repositório** — ficam em
  `Documentos/_backups-fotografia-vinicius/`.
