#!/usr/bin/env bash
# Rehace las imágenes del algoritmo de infección de vías urinarias del adulto desde sus HTML.
# Uso (desde la raíz del repo): bash tools/medios/figuras/ituadulto/regenerar.sh
set -euo pipefail
H=tools/medios/figuras/ituadulto
D=data/imagenes/algoritmo/ituadulto
PY=${PY:-$HOME/.cache/galgo-venv/bin/python}
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$D"

jpg() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1.png" >/dev/null
        "$PY" -c "from PIL import Image; Image.open('$TMP/$1.png').convert('RGB').save('$2', quality=${3:-88}, subsampling=0, optimize=True)"; echo "$2"; }
png() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1.png" >/dev/null
        "$PY" -c "from PIL import Image; Image.open('$TMP/$1.png').convert('P', palette=Image.ADAPTIVE, colors=256).save('$2', optimize=True)"; echo "$2"; }
gif() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1" --cuadros "$3" >/dev/null
        "$PY" tools/medios/armar_gif.py "$TMP/$1" "$2" --ms "$4" --pausa "$5" --colores "$6" | tail -1; }

# Esquemas propios (PNG)
png clasificacion "$D/itu_clasificacion.png"
png bacteriuria "$D/itu_bacteriuria.png"
png sensibilidad "$D/itu_sensibilidad.png"
png tfg "$D/itu_tfg.png"
png duracion "$D/itu_duracion.png"
png prevencion "$D/itu_prevencion.png"
# Animación propia
gif fosfomicina "$D/itu_fosfomicina.gif" 25 560 3000 128
# Fotos reales con licencia libre (fuentes/), recortadas y rotuladas
jpg foto_tira "$D/itu_tira_real.jpg"
jpg foto_urocultivo "$D/itu_urocultivo_real.jpg"
jpg foto_sonda "$D/itu_sonda_real.jpg" 72
jpg foto_hidronefrosis "$D/itu_hidronefrosis_real.jpg" 80
