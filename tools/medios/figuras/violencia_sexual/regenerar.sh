#!/usr/bin/env bash
# Rehace las imágenes del algoritmo de violencia sexual desde sus HTML. Uso (desde la raíz del repo):
#   bash tools/medios/figuras/violencia_sexual/regenerar.sh
set -euo pipefail
H=tools/medios/figuras/violencia_sexual
D=data/imagenes/algoritmo/violencia_sexual
PY=${PY:-$HOME/.cache/galgo-venv/bin/python}
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$D"
png() { node tools/medios/capturar.js "$H/$1.html" "$2" >/dev/null; echo "$2"; }
gif() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1" --cuadros "$3" >/dev/null
        "$PY" tools/medios/armar_gif.py "$TMP/$1" "$2" --ms "$4" --pausa "$5" --colores "$6" | tail -1; }
# Esquemas propios (sin personas ni anatomía)
png seguimiento "$D/vs_seguimiento.png"
png ruta "$D/vs_ruta.png"
gif ventanas "$D/vs_plazos.gif" 32 300 3500 96
