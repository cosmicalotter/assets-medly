#!/usr/bin/env python3
"""Borra rótulos, flechas o letras de una imagen real rellenando con lo que
los rodea (inpainting de OpenCV), para poder rotular encima en español.

  python3 tools/medios/borrar_rotulos.py foto.jpg salida.jpg \\
      --recorte 0,0,1600,930 --ancho 1200 \\
      --caja 1097,280,1585,338 --caja 995,290,1095,325

Las cajas van en píxeles de la imagen de entrada (antes de recortar). Con
`--rojo` además se borra todo lo rojo puro (flechas rojas sobre ecografías).
Necesita opencv-python-headless y numpy.
"""

from __future__ import annotations

import argparse

import cv2
import numpy as np


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("entrada")
    ap.add_argument("salida")
    ap.add_argument("--caja", action="append", default=[], help="x0,y0,x1,y1 a borrar (repetible)")
    ap.add_argument("--recorte", help="x0,y0,x1,y1 con el que quedarse al final")
    ap.add_argument("--ancho", type=int, help="ancho final en píxeles")
    ap.add_argument("--linea", action="append", default=[], help="x1,y1,x2,y2 de una línea guía a borrar (repetible)")
    ap.add_argument("--rojo", action="store_true", help="borrar también los trazos rojos puros")
    ap.add_argument("--margen", type=int, default=4, help="píxeles de más alrededor de cada caja")
    args = ap.parse_args()

    img = cv2.imread(args.entrada, cv2.IMREAD_COLOR)
    mascara = np.zeros(img.shape[:2], np.uint8)
    for caja in args.caja:
        x0, y0, x1, y1 = (int(v) for v in caja.split(","))
        m = args.margen
        mascara[max(0, y0 - m):y1 + m, max(0, x0 - m):x1 + m] = 255
    for linea in args.linea:
        x1, y1, x2, y2 = (int(v) for v in linea.split(","))
        cv2.line(mascara, (x1, y1), (x2, y2), 255, 2 * args.margen + 2)
    if args.rojo:
        b, g, r = (img[:, :, i].astype(int) for i in range(3))
        rojo = ((r > 150) & (g < 90) & (b < 90)).astype(np.uint8) * 255
        mascara |= cv2.dilate(rojo, np.ones((5, 5), np.uint8))
    limpia = cv2.inpaint(img, mascara, 7, cv2.INPAINT_TELEA)
    if args.recorte:
        x0, y0, x1, y1 = (int(v) for v in args.recorte.split(","))
        limpia = limpia[y0:y1, x0:x1]
    if args.ancho and limpia.shape[1] != args.ancho:
        alto = round(limpia.shape[0] * args.ancho / limpia.shape[1])
        limpia = cv2.resize(limpia, (args.ancho, alto), interpolation=cv2.INTER_AREA)
    cv2.imwrite(args.salida, limpia, [cv2.IMWRITE_JPEG_QUALITY, 88])
    print(f"{args.salida}: {limpia.shape[1]}×{limpia.shape[0]}")


if __name__ == "__main__":
    main()
