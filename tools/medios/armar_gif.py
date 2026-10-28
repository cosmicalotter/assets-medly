#!/usr/bin/env python3
"""Monta los cuadros de capturar.js en un GIF que se pueda servir a un móvil.

  python3 tools/medios/armar_gif.py cuadros/ data/imagenes/algoritmo/sepsis/sepsis_llenado_capilar.gif
  python3 tools/medios/armar_gif.py cuadros/ salida.gif --ms 120 --pausa 1500 --ancho 720

Una sola paleta para todos los cuadros (sin parpadeo de colores), bucle
infinito y el último cuadro sostenido para que se lea la conclusión. Avisa si
pasa de 2 MB: la app lo descarga con datos móviles, en mitad de una guardia.

Necesita Pillow, que viene con galgo (`~/.cache/galgo-venv/bin/python`).
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from PIL import Image

LIMITE = 2 * 1024 * 1024


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("cuadros", type=Path, help="carpeta con cuadro_000.png, cuadro_001.png…")
    ap.add_argument("destino", type=Path, help="archivo .gif")
    ap.add_argument("--ms", type=int, default=120, help="duración de cada cuadro (120)")
    ap.add_argument("--pausa", type=int, default=1500, help="cuánto se sostiene el último cuadro (1500)")
    ap.add_argument("--ancho", type=int, default=720, help="ancho final en píxeles (720)")
    ap.add_argument("--colores", type=int, default=128, help="tamaño de la paleta (128)")
    args = ap.parse_args()

    rutas = sorted(args.cuadros.glob("cuadro_*.png"))
    if len(rutas) < 2:
        sys.exit(f"hacen falta al menos dos cuadros en {args.cuadros}")

    cuadros = []
    for ruta in rutas:
        img = Image.open(ruta).convert("RGB")
        if img.width != args.ancho:
            img = img.resize((args.ancho, round(img.height * args.ancho / img.width)), Image.LANCZOS)
        cuadros.append(img)

    # La paleta sale de una muestra de todos los cuadros, no sólo del primero; el
    # último entra siempre, porque suele ser el cuadro del resultado.
    elegidos = cuadros[:: max(1, len(cuadros) // 3)][:3] + [cuadros[-1]] if len(cuadros) > 4 else cuadros
    muestra = Image.new("RGB", (cuadros[0].width, cuadros[0].height * len(elegidos)))
    for i, img in enumerate(elegidos):
        muestra.paste(img, (0, i * img.height))
    paleta = muestra.quantize(colors=args.colores, method=Image.Quantize.MEDIANCUT)
    indexados = [img.quantize(palette=paleta, dither=Image.Dither.NONE) for img in cuadros]

    duraciones = [args.ms] * (len(indexados) - 1) + [args.pausa]
    args.destino.parent.mkdir(parents=True, exist_ok=True)
    indexados[0].save(
        args.destino, save_all=True, append_images=indexados[1:],
        duration=duraciones, loop=0, optimize=True, disposal=1,
    )
    peso = args.destino.stat().st_size
    # Pillow funde los cuadros idénticos seguidos y suma su duración.
    with Image.open(args.destino) as gif:
        n = gif.n_frames
    print(f"{args.destino}: {n} cuadros · {indexados[0].width}×{indexados[0].height} · {peso / 1024:.0f} KB")
    if peso > LIMITE:
        print("  pesa más de 2 MB: baja --ancho, --colores o el número de cuadros", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
