#!/usr/bin/env bash
# Rehace las imágenes del algoritmo de cefalea en el adulto desde sus HTML y las fotos
# originales de fuentes/. Uso (desde la raíz del repo):
#   bash tools/medios/figuras/cefaleassecundarias/regenerar.sh
set -euo pipefail
H=tools/medios/figuras/cefaleassecundarias
D=data/imagenes/algoritmo/cefaleassecundarias
PY=${PY:-$HOME/.cache/galgo-venv/bin/python}
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$D"

jpg() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1.png" >/dev/null
        "$PY" -c "from PIL import Image; Image.open('$TMP/$1.png').convert('RGB').save('$2', quality=88, subsampling=0, optimize=True)"; echo "$2"; }
gif() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1" --cuadros "$3" >/dev/null
        "$PY" tools/medios/armar_gif.py "$TMP/$1" "$2" --ms "$4" --pausa "$5" --colores "$6" | tail -1; }

# Imágenes reales (PMC, CC BY) rotuladas
jpg hsa "$D/cefalea_hsa_tc_real.jpg"
jpg papiledema "$D/cefalea_papiledema_real.jpg"
jpg racimos "$D/cefalea_racimos_signos_real.jpg"
jpg arteritis "$D/cefalea_arteritis_temporal_real.jpg"
jpg tvc "$D/cefalea_trombosis_venosa_real.jpg"
# Animación propia
gif bloqueo "$D/cefalea_bloqueo_occipital.gif" 8 1300 3000 128
