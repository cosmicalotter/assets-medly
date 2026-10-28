#!/usr/bin/env python3
"""Colores saturados de una imagen (flechas, rótulos), en hex, para colorear
el texto de información (`media[].info`) con el tono exacto: `{#11B1ED:flecha azul}`.

  python3 tools/medios/colores_imagen.py data/imagenes/algoritmo/<carpeta>/<imagen>
  python3 tools/medios/colores_imagen.py <imagen> --caja 0.5 0.15 1 0.75   # x0 y0 x1 y1, en fracción

Agrupa los píxeles saturados por tono y da la mediana de cada grupo grande.
En un GIF mira el último cuadro.
"""
import argparse
import colorsys
from collections import defaultdict

from PIL import Image

ap = argparse.ArgumentParser()
ap.add_argument("imagen")
ap.add_argument("--caja", nargs=4, type=float, default=[0, 0.12, 1, 0.85],
                help="zona a mirar, en fracción del ancho y el alto (sin cabecera ni fuente)")
ap.add_argument("--minimo", type=int, default=150, help="píxeles mínimos por color")
args = ap.parse_args()

im = Image.open(args.imagen)
if getattr(im, "n_frames", 1) > 1:
    im.seek(im.n_frames - 1)
im = im.convert("RGB")
w, h = im.size
x0, y0, x1, y1 = args.caja
zona = im.crop((int(x0 * w), int(y0 * h), int(x1 * w), int(y1 * h)))

grupos = defaultdict(list)
for r, g, b in zona.getdata():
    tono, sat, val = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
    if sat > 0.45 and val > 0.55:
        grupos[int(tono * 24)].append((r, g, b))

for _, px in sorted(grupos.items(), key=lambda x: -len(x[1])):
    if len(px) < args.minimo:
        continue
    px.sort(key=sum)
    r, g, b = px[len(px) // 2]
    print(f"#{r:02X}{g:02X}{b:02X}  ({len(px)} px)")
