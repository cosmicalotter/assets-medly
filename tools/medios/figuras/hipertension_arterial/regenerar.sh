#!/usr/bin/env bash
# Rehace las imágenes del algoritmo de hipertensión arterial desde sus HTML. Uso (desde la raíz del repo):
#   bash tools/medios/figuras/hipertension_arterial/regenerar.sh
set -euo pipefail
H=tools/medios/figuras/hipertension_arterial
D=data/imagenes/algoritmo/hipertension_arterial
PY=${PY:-$HOME/.cache/galgo-venv/bin/python}
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$D"

jpg() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1.png" >/dev/null
        "$PY" -c "from PIL import Image; Image.open('$TMP/$1.png').convert('RGB').save('$2', quality=${3:-88}, subsampling=0, optimize=True)"; echo "$2"; }
png() { node tools/medios/capturar.js "$H/$1.html" "$2" >/dev/null; echo "$2"; }
gif() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1" --cuadros "$3" >/dev/null
        "$PY" tools/medios/armar_gif.py "$TMP/$1" "$2" --ms "$4" --pausa "$5" --colores "$6" | tail -1; }

# Esquemas propios (PNG)
png umbrales "$D/hta_umbrales_metodo.png"
png metas "$D/hta_metas.png"
png riesgo "$D/hta_riesgo_cv.png"
png emergencias "$D/hta_emergencias_metas.png"
# Animación propia
gif escalones "$D/hta_escalones.gif" 48 200 3000 128
# Fotos reales con licencia libre (fuentes/), rotuladas
jpg foto_tensiometro "$D/hta_tensiometro_real.jpg" 84
jpg foto_retina "$D/hta_retinopatia_real.jpg" 84
jpg foto_ecg_hvi "$D/hta_ecg_hvi_real.jpg" 70
