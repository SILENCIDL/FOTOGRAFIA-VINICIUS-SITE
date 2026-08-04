#!/usr/bin/env python3
"""
Correção 1 — caminhos das galerias, WhatsApp e e-mail.

  * prefixa ../ nos caminhos de assets dentro de pages/ (as fotos voltam a carregar)
  * remove os escapes \\ inválidos do url() dos banners de casamento
  * unifica o WhatsApp em 5512981771665
  * troca o e-mail placeholder contato@fotop.com.br pelo real

Idempotente: rodar duas vezes não causa dano.
"""
import os, re, glob

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WA_CERTO, WA_ERRADO = "5512981771665", "5512997194600"
EMAIL_CERTO, EMAIL_ERRADO = "contato@viniciusrafael.fot.br", "contato@fotop.com.br"

mudancas = []


def salvar(caminho, antigo, novo, rotulo):
    if antigo == novo:
        return 0
    with open(caminho, "w", encoding="utf-8") as f:
        f.write(novo)
    mudancas.append((os.path.relpath(caminho, RAIZ), rotulo))
    return 1


# ── 1. caminhos dentro de pages/ ─────────────────────────────────────────────
for arq in sorted(glob.glob(os.path.join(RAIZ, "pages", "*.html"))):
    txt = original = open(arq, encoding="utf-8").read()
    n = 0

    # url('assets/...') e url("assets/...")  ->  ../assets
    txt, k = re.subn(r"""url\((['"])assets/""", r"url(\1../assets/", txt)
    n += k

    # escapes \\ inválidos dentro de url(...) — CSS não precisa deles entre aspas
    def limpa_escape(m):
        return "url(" + m.group(1) + m.group(2).replace("\\\\ ", " ") + m.group(1) + ")"
    txt, k = re.subn(r"""url\((['"])((?:[^'"\\]|\\.)*?)\1\)""", limpa_escape, txt)

    # strings JS: 'assets/... e "assets/...  ->  ../assets
    txt, k = re.subn(r"""(['"])assets/img/""", r"\1../assets/img/", txt)
    n += k

    # src="assets/..." e href="assets/..." em HTML puro
    txt, k = re.subn(r"""\b(src|href)=(['"])assets/""", r"\1=\2../assets/", txt)
    n += k

    # segurança: nunca duplicar o ../
    txt = txt.replace("../../assets/", "../assets/")

    if salvar(arq, original, txt, "caminhos ../ (%d ocorrências)" % n):
        pass


# ── 2. WhatsApp e e-mail em todo o site ──────────────────────────────────────
alvos = [os.path.join(RAIZ, "index.html")]
alvos += sorted(glob.glob(os.path.join(RAIZ, "pages", "*.html")))
alvos += sorted(glob.glob(os.path.join(RAIZ, "assets", "js", "*.js")))

for arq in alvos:
    txt = original = open(arq, encoding="utf-8").read()
    partes = []

    if WA_ERRADO in txt:
        partes.append("WhatsApp x%d" % txt.count(WA_ERRADO))
        txt = txt.replace(WA_ERRADO, WA_CERTO)

    if EMAIL_ERRADO in txt:
        partes.append("e-mail x%d" % txt.count(EMAIL_ERRADO))
        txt = txt.replace(EMAIL_ERRADO, EMAIL_CERTO)

    if partes:
        salvar(arq, original, txt, " + ".join(partes))


# ── relatório ────────────────────────────────────────────────────────────────
if mudancas:
    for arquivo, o_que in mudancas:
        print("  %-45s %s" % (arquivo, o_que))
    print("\n%d arquivo(s) alterado(s)." % len(mudancas))
else:
    print("Nada a fazer — já estava corrigido.")
