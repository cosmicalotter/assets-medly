#!/usr/bin/env bash
# Rehace las imágenes del algoritmo de diabetes tipo 2 desde sus HTML y las fotos
# originales de fuentes/. Uso (desde la raíz del repo):
#   bash tools/medios/figuras/diabetesm2/regenerar.sh
set -euo pipefail
H=tools/medios/figuras/diabetesm2
D=data/imagenes/algoritmo/diabetesm2
PY=${PY:-$HOME/.cache/galgo-venv/bin/python}
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$D"

png() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1.png" >/dev/null
        "$PY" -c "from PIL import Image; Image.open('$TMP/$1.png').convert('P', palette=Image.ADAPTIVE, colors=256).save('$2', optimize=True)"; echo "$2"; }
jpg() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1.png" >/dev/null
        "$PY" -c "from PIL import Image; Image.open('$TMP/$1.png').convert('RGB').save('$2', quality=88, subsampling=0, optimize=True)"; echo "$2"; }
gif() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1" --cuadros "$3" >/dev/null
        "$PY" tools/medios/armar_gif.py "$TMP/$1" "$2" --ms "$4" --pausa "$5" --colores "$6" | tail -1; }

# Fotos reales (Wikimedia Commons, CC BY / CC BY-SA) rotuladas
jpg acantosis "$D/diabetesm2_acantosis_real.jpg"
jpg retina "$D/diabetesm2_retinopatia_real.jpg"
jpg monofilamento "$D/diabetesm2_monofilamento_real.jpg"
jpg ulcera "$D/diabetesm2_ulcera_pie_real.jpg"
# Esquemas propios
png rangos "$D/diabetesm2_rangos_diagnosticos.png"
png peso "$D/diabetesm2_peso_farmacos.png"
gif titulacion "$D/diabetesm2_titulacion_basal.gif" 31 260 3500 128
gif hipoglucemia "$D/diabetesm2_hipoglucemia.gif" 20 420 3500 128
