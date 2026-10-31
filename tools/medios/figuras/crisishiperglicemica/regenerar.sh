#!/usr/bin/env bash
# Rehace las imágenes del algoritmo de crisis hiperglucémicas desde sus HTML y las fotos
# originales de fuentes/. Uso (desde la raíz del repo):
#   bash tools/medios/figuras/crisishiperglicemica/regenerar.sh
set -euo pipefail
H=tools/medios/figuras/crisishiperglicemica
D=data/imagenes/algoritmo/crisishiperglicemica
PY=${PY:-$HOME/.cache/galgo-venv/bin/python}
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$D"

jpg() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1.png" >/dev/null
        "$PY" -c "from PIL import Image; Image.open('$TMP/$1.png').convert('RGB').save('$2', quality=88, subsampling=0, optimize=True)"; echo "$2"; }
gif() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1" --cuadros "$3" >/dev/null
        "$PY" tools/medios/armar_gif.py "$TMP/$1" "$2" --ms "$4" --pausa "$5" --colores "$6" | tail -1; }

# ECG y TC reales (PMC, CC BY) rotulados
jpg hiperk "$D/chh_ecg_hiperpotasemia_real.jpg"
jpg hipok "$D/chh_ecg_hipopotasemia_real.jpg"
jpg edema "$D/chh_edema_cerebral_tc_real.jpg"
# Animación propia: curso de glucosa y cetonas
gif curvas "$D/chh_glucosa_antes_que_cetosis.gif" 4 2600 3500 128
