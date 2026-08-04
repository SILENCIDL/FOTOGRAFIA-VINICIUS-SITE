# O que foi corrigido — 26/07/2026

Execução da auditoria de 18/07. Nada dela tinha sido aplicado ainda: todos os bugs
continuavam vivos. Abaixo, o que mudou e o que ainda depende de você.

---

## 1. As fotos voltaram a aparecer

As páginas em `pages/` montavam os caminhos sem `../`, então o navegador procurava
`/pages/assets/img/...` e recebia 404 em **todas** as fotos. Como o `gallery.js`
remove o item que falha e desiste após 5 erros seguidos, o visitante via os títulos
"O Ensaio" e "O Grande Dia" e mais nada.

Corrigido em 7 arquivos (4 páginas de casamento, `rua`, `olhar`, `portfolio`).
A galeria da Bianca & Donizete agora carrega as **39 fotos** que estavam no disco.

---

## 2. Os botões de venda voltaram a funcionar

Este era o bug mais caro e a auditoria ainda o subestimou.

O CSP (`script-src 'self'`, sem `'unsafe-inline'`) bloqueia duas coisas:

- **os `onclick=` inline** — 33 no index, incluindo os 10 botões "Solicitar orçamento",
  o WhatsApp flutuante e os cards do portfólio. Todos mortos.
- **os blocos `<script>` escritos dentro do HTML** — isso a auditoria não pegou. As
  páginas `rua`, `olhar`, `aventura` e as 4 de casamento constroem a galeria inteira
  num `<script>` inline. No deploy do Netlify/Vercel, **essas páginas ficariam em branco**.

A correção fácil seria adicionar `'unsafe-inline'` e desligar a proteção. Foi feito o
contrário — o site foi adaptado à política forte:

| Antes | Depois |
|---|---|
| 40 `onclick=` / `onerror=` inline | `data-action="whatsapp"`, `data-onerror="ocultar"` … |
| 8 blocos `<script>` dentro do HTML | 8 arquivos em `assets/js/pagina-*.js` |
| — | `assets/js/acoes.js` trata tudo por delegação de eventos |

O CSP continua igual, sem afrouxamento.

---

## 3. Nenhuma foto de banco de imagens no seu portfólio

Havia **32 imagens** com fallback para o Unsplash: se um arquivo seu falhasse, o site
exibia a foto de outro fotógrafo como se fosse seu trabalho — inclusive nas capas dos
álbuns de casamento e no hero.

Todos os 32 foram removidos. Quando um arquivo falta agora, o espaço simplesmente
não aparece.

---

## 4. Fotos 12× mais leves

| | Antes | Depois |
|---|---|---|
| Peso servido pelo site | 892 MB | **72 MB** |
| Hero da home | 14,5 MB | **281 KB** no celular · 1,2 MB no desktop |
| Arquivos acima de 2 MB | 175 | 0 |
| Versões WebP | 0 | 232 (prontas em `img-web/`, para usar quando quiser) |

Como funciona: `scripts/otimizar-fotos.py` gera `assets/img-web/` (2560px, JPG + WebP)
e o site aponta para lá. **Seus originais em `assets/img/` não foram tocados** — é o
seu arquivo mestre.

Rode o script de novo sempre que adicionar fotos novas; ele pula o que já está pronto:

```bash
python3 scripts/otimizar-fotos.py
python3 scripts/otimizar-fotos.py --status   # ver o progresso
```

O hero ganhou `srcset`: celular baixa 281 KB, desktop 1,2 MB. Antes era 14,5 MB para
os dois. Também removi o **Chart.js** — eram ~200 KB baixados em toda visita para um
gráfico que não existe em nenhuma página.

---

## 5. Leads indo para o número certo

Havia dois WhatsApp no site. Nas 4 páginas de casamento — seu ticket mais alto — valia
o **errado**, porque o `main.js` nem era carregado ali.

Agora existe um número só, definido em um lugar só (`assets/js/acoes.js`,
`window.CONTATO`). O `main.js` lê de lá. Para trocar, é uma linha.

O e-mail `contato@fotop.com.br` (placeholder do template, em 7 lugares) virou
`contato@viniciusrafael.fot.br`.

---

## 6. Navegação consertada

- **Menu mobile**: em `portfolio.html` e `casamentos.html` o `app.init()` chamava
  `initHeroSlideshow()`, que não estava carregado → `ReferenceError` interrompia tudo
  antes do menu. Agora cada módulo é opcional e o menu vive no `acoes.js`, que roda em
  todas as páginas — inclusive nas de casamento, que antes não tinham JS de menu nenhum.
- **Página de Valores**: existia no HTML (R$ 800 / R$ 1.500 / personalizado) mas nenhum
  link levava até ela. Adicionado "Investimento" no menu desktop e no mobile.
- **Botão Voltar do navegador**: abrir uma galeria agora empilha histórico. Voltar fecha
  a galeria em vez de sair do site.

---

## 7. Compartilhamento e Google

- **`og:image`** criado a partir do seu hero (1200×630, 224 KB). Seu link no WhatsApp
  agora abre com foto — antes vinha um retângulo vazio.
- **Favicon** próprio (monograma VR nas suas cores) em todas as 11 páginas.
- **`canonical`, `theme-color`, `og:url`, `og:locale`, Twitter Card** adicionados.
- **`SEU-DOMINIO`** trocado por `viniciusrafael.fot.br` no JSON-LD, `robots.txt` e `sitemap.xml`.
  O Google estava recebendo URL inválida.
- **Alt descritivo** nas galerias: antes `alt=""` em todas. Agora sai
  *"Casamento de Bianca & Donizete — cerimônia fotografada por Vinícius Rafael — foto 12"*.
  Google Imagens é tráfego gratuito e você estava jogando fora.

---

## 8. Galerias vazias saíram do ar

Só *Bianca & Donizete* tem fotos. Miellem, Pamela, Patrícia, Aventura e Paisagem têm
apenas `capa.jpg` — abriam vazias, o que frustra mais que não existir.

Agora cada álbum testa se a primeira foto existe antes de aparecer. **Assim que você
subir os arquivos, o card volta sozinho** — sem editar código.

Nomenclatura esperada:

| Galeria | Caminho |
|---|---|
| Casamentos | `assets/img/portfolio/casamentos/<Nome>/Cerimonia/(1).jpg`, `(2).jpg`… |
| | `assets/img/portfolio/casamentos/<Nome>/Pre Wedding/(1).jpg`… |
| Aventura | `assets/img/portfolio/aventura/aventura (1).jpg`… |
| Paisagem | `assets/img/portfolio/paisagem/paisagem (1).jpg`… |

Depois de subir, rode `python3 scripts/otimizar-fotos.py`.

---

## 9. Outros

- **Depoimentos ocultados.** Os três cards diziam *"Depoimento do cliente 1 — adicione
  aqui o texto real"*. Publicado, isso destrói a confiança na hora da decisão. A seção
  está escondida com instruções de como reativar. Peça 3 depoimentos reais no WhatsApp.
- **`pages/indexa.html`** (versão antiga da home, ainda publicada, conteúdo duplicado)
  virou redirecionamento com `noindex`.
- **`site-astro/.gitignore`** criado. O `.env` com `JWT_SECRET`, `APP_ENCRYPTION_KEY` e
  `DATABASE_URL` **não estava no Git** — mas também não estava protegido. Agora está.

---

## Verificação

```
OK   estrutura HTML das 11 páginas
OK   0 handlers inline e 0 <script> inline (o CSP forte funciona)
OK   todos os css/js/img referenciados existem
OK   WhatsApp: um número só (5512981771665)
OK   SEU-DOMINIO / fotop.com.br / número antigo: removidos
OK   todas as fotos vêm de assets/img-web (12× mais leve)
OK   og:image, favicon, canonical, theme-color presentes
OK   JSON-LD válido
OK   sintaxe de todos os 15 arquivos .js
OK   galeria Bianca & Donizete: 39 fotos resolvem
```

---

## Falta você decidir

1. **Confirmar o e-mail e o domínio.** Usei `contato@viniciusrafael.fot.br` e
   `viniciusrafael.fot.br`, que estavam no seu `indexa.html`. Se mudou, é um
   `sed` em 3 arquivos.
2. **Subir as fotos** de Aventura, Paisagem e dos 3 casamentos.
3. **3 depoimentos reais** para reativar a seção.
4. **Apagar `backups/site-vinicius-pre-reorganizacao.tar.gz`** — 916 MB no repositório.
   O GitHub Pages tem limite prático de ~1 GB.
5. **Trocar o Tailwind Play CDN** por um build estático. Hoje o navegador do visitante
   compila o CSS a cada visita — é uma ferramenta de protótipo rodando em produção.
6. **Decidir entre o site estático e o `site-astro/`.** Manter os dois dobra o trabalho
   e foi a origem de metade das inconsistências corrigidas aqui.

---

## Scripts criados

| Arquivo | Para quê |
|---|---|
| `scripts/otimizar-fotos.py` | gera `img-web/` (rode sempre que adicionar fotos) |
| `scripts/corrigir-1-caminhos-contato.py` | correção de caminhos, WhatsApp e e-mail |
| `scripts/corrigir-2-csp.py` | extrai scripts inline e converte handlers |
| `assets/js/acoes.js` | delegação de eventos, menu, galerias vazias |

Os dois `corrigir-*` já rodaram e são idempotentes — pode guardar como referência
ou apagar.
