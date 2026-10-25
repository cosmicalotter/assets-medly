#!/usr/bin/env python3
"""Añade debajo de una imagen una franja blanca con su crédito (autor y
licencia), para que la atribución viaje dentro de la imagen y el pie del nodo
(`media[].descripcion`) no tenga que repetirla.

  python3 tools/medios/franja_credito.py original.jpg salida.jpg \\
      "Imagen: Autor, Wikimedia Commons, CC BY-SA 4.0. Editada por Empirica."

Se parte siempre del original (guardado en tools/medios/figuras/<carpeta>/
fuentes/), nunca de una salida anterior, para no apilar franjas.
"""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

FUENTE = "/usr/share/fonts/opentype/inter/Inter-Regular.otf"


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("entrada", type=Path)
    ap.add_argument("salida", type=Path)
    ap.add_argument("credito")
    args = ap.parse_args()

    img = Image.open(args.entrada).convert("RGB")
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
