#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Aplica a mesma Content-Security-Policy em TODAS as páginas HTML.

Contexto: o `corrigir-2-csp.py` preparou o site para rodar com CSP forte
(tirou script inline e handler inline), mas a política só tinha sido colocada
no index.html. As 11 páginas de `pages/` ficaram sem nenhuma.

Enquanto o site estiver no GitHub Pages, a CSP em <meta> é a única forma de
ter política — Pages não deixa mandar header HTTP. Quando o site migrar para
Netlify/Vercel, o header do netlify.toml/vercel.json passa a valer e a meta
vira reforço redundante (inofensiva, e ainda protege quem abrir o arquivo
local).

IMPORTANTE — o que <meta> NÃO consegue fazer, em nenhuma hipótese:
  - `frame-ancestors` (impedir que embutam o site num iframe): o navegador
    ignora quando vem em meta. Por isso não está aqui — só no header.
  - `Strict-Transport-Security`, `X-Content-Type-Options`, `Referrer-Policy`,
    `Permissions-Policy`: são headers HTTP, não existem como meta.
Essas quatro só passam a valer com a migração.

Idempotente: rodar de novo atualiza a política em vez de duplicar.
"""
import io
import os
import glob
import re

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Hosts conferidos um a um contra o que as páginas realmente carregam.
# cdn.jsdelivr.net saiu: constava na política antiga e não é usado em lugar
# nenhum — permissão sobrando é superfície de ataque de graça.
CSP = "; ".join([
    "default-src 'self'",
    "script-src 'self' https://cdn.tailwindcss.com https://cdnjs.cloudflare.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
    "img-src 'self' data: blob: https:",
    "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com",
    "connect-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
])

TAG = '    <meta http-equiv="Content-Security-Policy" content="%s">' % CSP

# casa a meta CSP existente, com qualquer conteúdo, para poder substituir
EXISTENTE = re.compile(
    r'[ \t]*<meta\s+http-equiv=["\']Content-Security-Policy["\'][^>]*>',
    re.I)


def paginas():
    return ([os.path.join(RAIZ, "index.html")] +
            sorted(glob.glob(os.path.join(RAIZ, "pages", "*.html"))))


def aplicar(caminho):
    txt = io.open(caminho, encoding="utf-8").read()

    if EXISTENTE.search(txt):
        novo = EXISTENTE.sub(TAG, txt, count=1)
        acao = "atualizada"
    else:
        # logo depois do <meta charset>, antes de qualquer recurso externo:
        # a política precisa ser lida antes de o navegador buscar algo.
        m = re.search(r'[ \t]*<meta\s+charset=[^>]*>', txt, re.I)
        if not m:
            return "SEM <meta charset> — pulado"
        novo = txt[:m.end()] + "\n" + TAG + txt[m.end():]
        acao = "adicionada"

    if novo == txt:
        return "já estava igual"
    io.open(caminho, "w", encoding="utf-8", newline="\n").write(novo)
    return acao


if __name__ == "__main__":
    for p in paginas():
        rel = os.path.relpath(p, RAIZ).replace("\\", "/")
        print("%-45s %s" % (rel, aplicar(p)))
