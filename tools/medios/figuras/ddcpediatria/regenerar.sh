#!/usr/bin/env bash
# Rehace las imágenes del algoritmo de displasia del desarrollo de la cadera desde sus HTML
# y las imágenes originales de fuentes/. Uso (desde la raíz del repo):
#   bash tools/medios/figuras/ddcpediatria/regenerar.sh
set -euo pipefail
H=tools/medios/figuras/ddcpediatria
D=data/imagenes/algoritmo/ddcpediatria
PY=${PY:-$HOME/.cache/galgo-venv/bin/python}
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$D"

png() { node tools/medios/capturar.js "$H/$1.html" "$2" >/dev/null; echo "$2"; }
jpg() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1.png" >/dev/null
        "$PY" -c "from PIL import Image; Image.open('$TMP/$1.png').convert('RGB').save('$2', quality=${3:-86}, subsampling=0, optimize=True)"; echo "$2"; }
gif() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1" --cuadros "$3" >/dev/null
        "$PY" tools/medios/armar_gif.py "$TMP/$1" "$2" --ms "$4" --pausa "$5" --colores "$6" | tail -1; }

# Esquema propio animado
gif edades "$D/ddc_edades.gif" 30 300 4000 64
# Imágenes de Commons, traducidas
png foto_espectro "$D/ddc_espectro.png"
jpg foto_eco "$D/ddc_ecografia.jpg"
