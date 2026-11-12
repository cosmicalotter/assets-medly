#!/usr/bin/env bash
# Rehace las imágenes de «Líquidos y electrolitos en pediatría» (data/Pediatria/deshidratacion.json). Uso (desde la raíz):
#   bash tools/medios/figuras/liquidos/regenerar.sh
set -euo pipefail
H=tools/medios/figuras/liquidos
D=data/imagenes/algoritmo/deshidratacion
PY=${PY:-$HOME/.cache/galgo-venv/bin/python}
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$D"
jpg() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1.png" >/dev/null
        "$PY" -c "from PIL import Image; Image.open('$TMP/$1.png').convert('RGB').save('$2', quality=${3:-88}, subsampling=0, optimize=True)"; echo "$2"; }
png() { node tools/medios/capturar.js "$H/$1.html" "$2" >/dev/null; echo "$2"; }
gif() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1" --cuadros "$3" >/dev/null
        "$PY" tools/medios/armar_gif.py "$TMP/$1" "$2" --ms "$4" --pausa "$5" --colores "$6" | tail -1; }
# Fotos reales con licencia libre (fuentes/), rotuladas en español
gif ringer_bolsa "$D/liquidos_ringer_bolsa.gif" 8 2700 4500 256
gif pliegue "$D/liquidos_pliegue.gif" 3 3000 4500 256
jpg foto_fototerapia "$D/liquidos_fototerapia.jpg"
jpg foto_incubadora "$D/liquidos_incubadora.jpg"
jpg foto_prematuro "$D/liquidos_prematuro.jpg"
jpg foto_sro "$D/liquidos_sro.jpg" 78
jpg foto_bomba "$D/liquidos_bomba.jpg"
# Gráficos de datos propios
gif holliday "$D/liquidos_holliday.gif" 24 420 3500 128
png composicion "$D/liquidos_composicion.png"
png neo_volumen "$D/liquidos_neo_volumen.png"
png glucosa "$D/liquidos_glucosa.png"
png fases_iv "$D/liquidos_fases_iv.png"
png neo_peso "$D/liquidos_neo_peso.png"
png neo_hipona "$D/liquidos_neo_hipona.png"
