# Guia de Imagens — onde colocar cada foto

Este guia diz **exatamente onde salvar cada imagem** dentro de `assets/img/`.
Todas as imagens do site têm um **fallback da web** (Unsplash): se o arquivo local
não existir, o site mostra uma foto temporária no lugar — então o layout nunca quebra.
Assim que você colocar a foto real no caminho certo, ela substitui a temporária automaticamente.

> Os nomes (inclusive espaços, parênteses e maiúsculas) precisam bater exatamente.
> Use sempre `.jpg`.

---

## 1. Home (página inicial)

| Onde aparece | Pasta | Arquivos |
|---|---|---|
| Slideshow do topo (hero) | `assets/img/hero/` | `hero(1).jpg`, `hero(2).jpg`, `hero(3).jpg`, `hero(4).jpg` |
| Foto "Sobre" (o fotógrafo) | `assets/img/sobre/` | `vinicius.jpg` |

## 2. Capas das categorias do portfólio

Cada categoria tem uma imagem de capa:

| Categoria | Arquivo |
|---|---|
| Aventura | `assets/img/portfolio/aventura/capa.jpg` |
| Paisagem | `assets/img/portfolio/paisagem/capa.jpg` |
| Rua | `assets/img/portfolio/rua/capa.jpg` |
| Olhar | `assets/img/portfolio/olhar/capa.jpg` |
| Casamentos (capa geral) | usa a capa do Bianca & Donizete |

## 3. Galerias (fotos numeradas)

O site carrega automaticamente as fotos numeradas dentro de cada pasta.
Use o padrão de nome indicado:

| Categoria | Pasta | Padrão dos nomes |
|---|---|---|
| Aventura | `assets/img/portfolio/aventura/` | `aventura (1).jpg`, `aventura (2).jpg`, … |
| Paisagem | `assets/img/portfolio/paisagem/` | `paisagem (1).jpg`, `paisagem (2).jpg`, … |
| Rua (galeria) | `assets/img/portfolio/rua/galeria/` | `1.jpg`, `2.jpg`, … até `138.jpg` |
| Olhar (registros) | `assets/img/portfolio/olhar/registros/` | `1.jpg`, `2.jpg`, … até `31.jpg` |

## 4. Casamentos (álbuns individuais)

Cada casal tem uma capa e duas subpastas (quando houver as duas etapas):

| Casal | Pasta base | Capa | Subpastas |
|---|---|---|---|
| Bianca & Donizete | `assets/img/portfolio/casamentos/Bianca & Donizete/` | `capa.jpg` | `Pre Wedding/(1).jpg…`, `Cerimonia/(1).jpg…` |
| Miellem & Aleft | `assets/img/portfolio/casamentos/Miellem & Aleft/` | `capa.jpg` | `Pre Wedding/`, `Cerimonia/` |
| Pamela & Juliano | `assets/img/portfolio/casamentos/Pamela & Juliano/` | `capa.jpg` | `Cerimonia/` |
| Patricia & Marcos | `assets/img/portfolio/casamentos/Patricia & Marcos/` | `capa.jpg` | `Pre Wedding/`, `Cerimonia/` |

As fotos dentro de `Pre Wedding/` e `Cerimonia/` seguem o padrão `(1).jpg`, `(2).jpg`, …

## 5. Slides de fundo (hero das páginas Olhar e Rua)

| Página | Pasta | Arquivos |
|---|---|---|
| Olhar | `assets/img/olhar/slides/` | `slide (1).jpg` … `slide (4).jpg` |
| Rua | `assets/img/rua/slides/` | `slide (1).jpg` … `slide (4).jpg` |

> A pasta `assets/img/rua/slides/` ainda **não existe** — crie-a e coloque os 4 slides.

## 6. Outras imagens avulsas

| Onde | Arquivo |
|---|---|
| Separador "montanhas" (Olhar) | `assets/img/portfolio/olhar/montanhas.jpg` |
| Fundo da citação (Rua) | `assets/img/portfolio/rua/citacao-bg-1.jpg` |

---

## Pastas que hoje estão SEM fotos reais (só com fallback da web)

Coloque as fotos reais aqui quando tiver — hoje o site mostra imagens temporárias da web:

- `assets/img/hero/` (4 fotos do topo da home)
- `assets/img/sobre/vinicius.jpg`
- `assets/img/portfolio/aventura/` (capa + galeria)
- `assets/img/portfolio/paisagem/` (capa + galeria)
- `assets/img/portfolio/rua/` (capa, citação e galeria)
- `assets/img/rua/slides/` (criar a pasta)
- Capas de `Pamela & Juliano` e `Patricia & Marcos` (confirmar)

As pastas de **Bianca & Donizete** e **Olhar** já têm fotos reais.
