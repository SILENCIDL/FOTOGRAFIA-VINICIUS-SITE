#!/usr/bin/env python3
"""
Correção 2 — fazer o site funcionar COM o CSP forte, em vez de enfraquecê-lo.

O CSP atual (`script-src 'self' ...`, sem 'unsafe-inline') bloqueia:
  a) todo <script> escrito dentro do HTML   -> galerias inteiras somem no deploy
  b) todo onclick=/onerror= inline          -> botões de venda e fallbacks mortos

Este script resolve os dois sem afrouxar a política:
  a) extrai cada <script> inline para assets/js/pagina-<nome>.js
  b) troca os handlers inline por data-action / data-onerror,
     tratados por delegação de eventos em assets/js/acoes.js

Idempotente.
"""
import os, re, glob

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
JS = os.path.join(RAIZ, "assets", "js")
relatorio = []


def prefixo(arq):
    """'../' para arquivos em pages/, '' para a raiz."""
    return "" if os.path.dirname(arq) == RAIZ else "../"


# ══════════════════════════════════════════════════════════════════════
# a) extrair <script> inline para arquivo externo
# ══════════════════════════════════════════════════════════════════════
def extrair_scripts(arq, txt):
    nome = os.path.splitext(os.path.basename(arq))[0]
    padrao = re.compile(
        r'<script(?![^>]*\bsrc=)(?![^>]*ld\+json)[^>]*>(.*?)</script>', re.S)

    blocos = padrao.findall(txt)
    uteis = [b for b in blocos if b.strip()]
    if not uteis:
        return txt

    destino = os.path.join(JS, "pagina-%s.js" % nome)
    cabecalho = (
        "/* Extraído de %s.html para funcionar com o CSP (script-src 'self').\n"
        "   Não voltar a colocar este código dentro do HTML. */\n\n"
        % nome)
    with open(destino, "w", encoding="utf-8") as f:
        f.write(cabecalho + "\n\n".join(b.strip() for b in uteis) + "\n")

    # remove os blocos e injeta a tag externa uma única vez
    novo = padrao.sub(lambda m: "" if m.group(1).strip() else m.group(0), txt)
    tag = '<script src="%sassets/js/pagina-%s.js" defer></script>' % (prefixo(arq), nome)
    if tag not in novo:
        novo = novo.replace("</body>", "  " + tag + "\n</body>", 1)

    relatorio.append((os.path.basename(arq),
                      "script inline -> assets/js/pagina-%s.js (%d caracteres)"
                      % (nome, sum(len(b) for b in uteis))))
    return novo


# ══════════════════════════════════════════════════════════════════════
# b) handlers inline -> data-attributes
# ══════════════════════════════════════════════════════════════════════
def esc(s):
    return s.replace("&", "&amp;").replace('"', "&quot;")


def converter_onclick(txt):
    n = [0]

    def sub(m):
        corpo = m.group(1)
        c = corpo.replace("&quot;", '"').strip()
        attrs = []

        # app.openWhatsapp('mensagem')
        mm = re.search(r"app\.openWhatsapp\(\s*(['\"])(.*?)\1\s*\)", c, re.S)
        if mm:
            attrs = ['data-action="whatsapp"', 'data-msg="%s"' % esc(mm.group(2))]
        elif "app.openWhatsapp()" in c:
            attrs = ['data-action="whatsapp"']

        # app.scrollToSection('id')
        if not attrs:
            mm = re.search(r"app\.scrollToSection\(\s*(['\"])(.*?)\1\s*\)", c)
            if mm:
                attrs = ['data-action="scroll"', 'data-target="%s"' % esc(mm.group(2))]

        # app.showSection('id')
        if not attrs:
            mm = re.search(r"app\.showSection\(\s*(['\"])(.*?)\1\s*\)", c)
            if mm:
                attrs = ['data-action="section"', 'data-target="%s"' % esc(mm.group(2))]

        # app.openGallery('tema')
        if not attrs:
            mm = re.search(r"app\.openGallery\(\s*(['\"])(.*?)\1\s*\)", c)
            if mm:
                attrs = ['data-action="galeria"', 'data-target="%s"' % esc(mm.group(2))]

        # app.showSubGallery('tipo')
        if not attrs:
            mm = re.search(r"app\.showSubGallery\(\s*(['\"])(.*?)\1\s*\)", c)
            if mm:
                attrs = ['data-action="subgaleria"', 'data-target="%s"' % esc(mm.group(2))]

        # app.openStreet() / app.openOlhar() / app.openPrices() ...
        if not attrs:
            mm = re.search(r"app\.(openStreet|openOlhar|openPrices|openTestimonials|openBlog)\(\)", c)
            if mm:
                attrs = ['data-action="%s"' % {
                    "openStreet": "rua", "openOlhar": "olhar", "openPrices": "valores",
                    "openTestimonials": "depoimentos", "openBlog": "blog"}[mm.group(1)]]

        # document.getElementById('x').scrollIntoView(...)
        if not attrs:
            mm = re.search(r"document\.getElementById\(\s*(['\"])(.*?)\1\s*\)\.scrollIntoView", c)
            if mm:
                attrs = ['data-action="rolar-ate"', 'data-target="%s"' % esc(mm.group(2))]

        # app.closeMobileMenu() sozinho
        if not attrs and "app.closeMobileMenu()" in c:
            attrs = ['data-action="fechar-menu"']

        if not attrs:
            return m.group(0)                      # não reconhecido: preserva

        if "closeMobileMenu" in c and 'data-action="fechar-menu"' not in attrs:
            attrs.append("data-fechar-menu")

        n[0] += 1
        return " ".join(attrs)

    txt = re.sub(r'onclick="([^"]*)"', sub, txt)
    return txt, n[0]


def converter_onerror(txt):
    n = [0]

    def sub(m):
        c = m.group(1)
        # this.style.display='none'
        if re.fullmatch(r"\s*this\.style\.display\s*=\s*'none'\s*;?\s*", c):
            n[0] += 1
            return 'data-onerror="ocultar"'
        # this.onerror=null; this.src='URL'
        mm = re.search(r"this\.src\s*=\s*'([^']+)'", c)
        if mm:
            n[0] += 1
            return 'data-onerror-src="%s"' % esc(mm.group(1))
        # this.closest('.x').style.display='none'
        mm = re.search(r"this\.closest\(\\?'([^'\\]+)\\?'\)\.style\.display", c)
        if mm:
            n[0] += 1
            return 'data-onerror="ocultar-pai" data-onerror-sel="%s"' % esc(mm.group(1))
        return m.group(0)

    txt = re.sub(r'onerror="([^"]*)"', sub, txt)
    return txt, n[0]


# ══════════════════════════════════════════════════════════════════════
def processar(arq):
    original = open(arq, encoding="utf-8").read()
    txt = original

    txt, n1 = converter_onclick(txt)
    txt, n2 = converter_onerror(txt)
    if n1 or n2:
        relatorio.append((os.path.basename(arq),
                          "%d onclick + %d onerror -> data-attributes" % (n1, n2)))

    txt = extrair_scripts(arq, txt)

    # garante que acoes.js seja carregado (delegação de eventos)
    tag = '<script src="%sassets/js/acoes.js" defer></script>' % prefixo(arq)
    if "assets/js/acoes.js" not in txt:
        txt = txt.replace("</body>", "  " + tag + "\n</body>", 1)
        relatorio.append((os.path.basename(arq), "+ acoes.js"))

    if txt != original:
        with open(arq, "w", encoding="utf-8") as f:
            f.write(txt)


for a in [os.path.join(RAIZ, "index.html")] + sorted(glob.glob(os.path.join(RAIZ, "pages", "*.html"))):
    if os.path.basename(a) == "indexa.html":
        continue                                   # versão antiga, será removida
    processar(a)

for arquivo, o_que in relatorio:
    print("  %-42s %s" % (arquivo, o_que))
print("\n%d alteração(ões)." % len(relatorio))
