#!/usr/bin/env python3
"""
Gera as versões web das fotos SEM tocar nos originais.

  assets/img/...          originais (arquivo mestre, nunca alterado)
  assets/img-web/...      versões para o site: JPG 2560px + WebP

É retomável: rode quantas vezes quiser, ele pula o que já foi feito.

Uso:
    python3 scripts/otimizar-fotos.py            # processa tudo
    python3 scripts/otimizar-fotos.py --tempo 40 # para após 40 segundos
    python3 scripts/otimizar-fotos.py --status   # só mostra o progresso
"""
import os, sys, time, argparse
from multiprocessing import Pool
from PIL import Image, ImageOps

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORIG = os.path.join(RAIZ, "assets", "img")
WEB  = os.path.join(RAIZ, "assets", "img-web")

LADO_MAX = 2560      # px no lado maior
Q_JPG    = 82
Q_WEBP   = 80
EXTS     = (".jpg", ".jpeg", ".png")

Image.MAX_IMAGE_PIXELS = None


def listar():
    """Todos os originais, ignorando a pasta _backup."""
    itens = []
    for pasta, dirs, arqs in os.walk(ORIG):
        dirs[:] = [d for d in dirs if d != "_backup"]
        for a in arqs:
            if a.lower().endswith(EXTS):
                itens.append(os.path.join(pasta, a))
    return sorted(itens)


def destinos(origem):
    rel = os.path.relpath(origem, ORIG)
    base = os.path.join(WEB, rel)
    raiz, _ = os.path.splitext(base)
    return raiz + ".jpg", raiz + ".webp"


def pronto(origem):
    j, w = destinos(origem)
    return os.path.exists(j) and os.path.exists(w)


def processar(origem):
    saida_jpg, saida_webp = destinos(origem)
    os.makedirs(os.path.dirname(saida_jpg), exist_ok=True)

    with Image.open(origem) as im:
        # decodifica já reduzido (só JPEG) — é o que torna o processo rápido
        im.draft("RGB", (LADO_MAX, LADO_MAX))
        im = ImageOps.exif_transpose(im)          # respeita a rotação da câmera
        if im.mode not in ("RGB", "L"):
            im = im.convert("RGB")
        im.thumbnail((LADO_MAX, LADO_MAX), Image.LANCZOS)
        im.save(saida_jpg, "JPEG", quality=Q_JPG, optimize=True, progressive=True)
        im.save(saida_webp, "WEBP", quality=Q_WEBP, method=4)

    return os.path.getsize(origem), os.path.getsize(saida_jpg) + os.path.getsize(saida_webp)


def tentar(origem):
    """Wrapper para o Pool: nunca levanta exceção."""
    try:
        return processar(origem)
    except Exception as e:
        print("  ! erro em %s: %s" % (os.path.relpath(origem, RAIZ), e))
        return (0, 0)


def mb(n):
    return n / 1048576


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--tempo", type=float, default=0, help="segundos de execução (0 = sem limite)")
    ap.add_argument("--status", action="store_true")
    args = ap.parse_args()

    fotos = listar()
    feitas = [f for f in fotos if pronto(f)]

    if args.status:
        peso_o = sum(os.path.getsize(f) for f in fotos)
        peso_w = sum(
            os.path.getsize(p)
            for pasta, _, arqs in os.walk(WEB) if os.path.isdir(WEB)
            for p in (os.path.join(pasta, a) for a in arqs)
        ) if os.path.isdir(WEB) else 0
        print("%d/%d fotos prontas" % (len(feitas), len(fotos)))
        print("originais: %.0f MB   ->   web: %.0f MB" % (mb(peso_o), mb(peso_w)))
        return

    pendentes = [f for f in fotos if not pronto(f)]
    if not pendentes:
        print("Tudo pronto: %d fotos." % len(fotos))
        return

    t0 = time.time()
    antes = depois = 0
    n = 0

    # 4 processos: o gargalo é leitura/escrita em disco, então vale
    # ter mais workers que núcleos para sobrepor I/O com compressão.
    with Pool(4) as pool:
        for a, d in pool.imap_unordered(tentar, pendentes, chunksize=1):
            antes += a
            depois += d
            n += 1
            if args.tempo and time.time() - t0 > args.tempo:
                pool.terminate()
                break

    print("%d processadas nesta rodada (%.0f MB -> %.0f MB)" % (n, mb(antes), mb(depois)))
    print("progresso: %d/%d" % (len(feitas) + n, len(fotos)))


if __name__ == "__main__":
    main()
