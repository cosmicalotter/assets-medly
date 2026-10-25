#!/usr/bin/env python3
"""Añade debajo de una imagen una franja blanca con su crédito (autor y
licencia), para que la atribución viaje dentro de la imagen y el pie del nodo
(`media[].descripcion`) no tenga que repetirla. Con --titulo pone además
arriba la cabecera de las figuras de Empirica (título, subtítulo y marca):
toda imagen lleva su título escrito.

  python3 tools/medios/franja_credito.py original.jpg salida.jpg \\
      "Imagen: Autor, Wikimedia Commons, CC BY-SA 4.0. Editada por Empirica." \\
      --titulo "Ecografía: colecistitis aguda" --subtitulo "Pared engrosada y cálculo"

Se parte siempre del original (guardado en tools/medios/figuras/<carpeta>/
fuentes/), nunca de una salida anterior, para no apilar franjas.
"""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

FUENTE = "/usr/share/fonts/opentype/inter/Inter-Regular.otf"
NEGRITA = "/usr/share/fonts/opentype/inter/Inter-Bold.otf"
TINTA, SUAVE, TEAL = (31, 42, 55), (107, 114, 128), (24, 185, 169)


def cabecera(ancho: int, titulo: str, subtitulo: str | None) -> Image.Image:
    """La cabecera de base.js (título 24 px, subtítulo 13 px y marca 12 px en
    un lienzo de 720) a la escala de la imagen."""
    k = ancho / 720
    f_tit = ImageFont.truetype(NEGRITA, round(24 * k))
    f_sub = ImageFont.truetype(FUENTE, round(13 * k))
    f_marca = ImageFont.truetype(NEGRITA, round(12 * k))
    pad = round(18 * k)
    alto = pad + round(30 * k) + (round(19 * k) if subtitulo else 0) + round(12 * k)
    cab = Image.new("RGB", (ancho, alto), "white")
    d = ImageDraw.Draw(cab)
    d.text((pad, pad), titulo, fill=TINTA, font=f_tit)
    if subtitulo:
        d.text((pad, pad + round(32 * k)), subtitulo, fill=SUAVE, font=f_sub)
    marca, x = "EMPIRICA", ancho - pad
    espacio = 1.2 * k
    ancho_marca = sum(d.textlength(c, font=f_marca) for c in marca) + espacio * (len(marca) - 1)
    x -= ancho_marca
    for c in marca:
        d.text((x, pad + round(6 * k)), c, fill=TEAL, font=f_marca)
        x += d.textlength(c, font=f_marca) + espacio
    return cab


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("entrada", type=Path)
    ap.add_argument("salida", type=Path)
    ap.add_argument("credito")
    ap.add_argument("--titulo")
    ap.add_argument("--subtitulo")
    args = ap.parse_args()

    img = Image.open(args.entrada).convert("RGB")
    if args.titulo:
        cab = cabecera(img.width, args.titulo, args.subtitulo)
        con = Image.new("RGB", (img.width, cab.height + img.height), "white")
        con.paste(cab, (0, 0))
        con.paste(img, (0, cab.height))
        img = con
    tam = max(12, round(img.width / 62))
    letra = ImageFont.truetype(FUENTE, tam)
    alto = round(tam * 2.1)
    lienzo = Image.new("RGB", (img.width, img.height + alto), "white")
    lienzo.paste(img, (0, 0))
    dibujo = ImageDraw.Draw(lienzo)
    texto = args.credito
    # Si no cabe, se acorta por la derecha antes que bajar de tamaño.
    while dibujo.textlength(texto, font=letra) > img.width - 2 * tam and len(texto) > 10:
        texto = texto[:-2].rstrip() + "…"
    dibujo.text((tam, img.height + (alto - tam) / 2 - 1), texto, fill=(107, 114, 128), font=letra)
    if args.salida.suffix.lower() in (".jpg", ".jpeg"):
        lienzo.save(args.salida, quality=88, optimize=True)
    else:
        lienzo.save(args.salida, optimize=True)
    print(f"{args.salida}: {lienzo.width}×{lienzo.height}")


if __name__ == "__main__":
    main()
