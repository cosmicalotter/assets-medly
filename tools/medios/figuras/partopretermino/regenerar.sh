#!/usr/bin/env bash
# Rehace las imágenes del algoritmo de parto pretérmino desde sus HTML. Uso (desde la raíz del repo):
#   bash tools/medios/figuras/partopretermino/regenerar.sh
set -euo pipefail
H=tools/medios/figuras/partopretermino
D=data/imagenes/algoritmo/partopretermino
PY=${PY:-$HOME/.cache/galgo-venv/bin/python}
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$D"

jpg() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1.png" --escala 2 >/dev/null
        "$PY" -c "from PIL import Image; Image.open('$TMP/$1.png').convert('RGB').save('$2', quality=${3:-88}, subsampling=0, optimize=True)"; echo "$2"; }
png() { node tools/medios/capturar.js "$H/$1.html" "$2" --escala 2 >/dev/null; echo "$2"; }
gif() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1" --cuadros "$3" >/dev/null
        "$PY" tools/medios/armar_gif.py "$TMP/$1" "$2" --ms "$4" --pausa "$5" --colores "$6" | tail -1; }

# Esquemas propios (PNG)
png cortes_cervix "$D/ppt_cortes_cervix.png"
png nifedipino "$D/ppt_nifedipino.png"
png magnesio "$D/ppt_magnesio.png"
png ventana_magnesio "$D/ppt_ventana_magnesio.png"
# Fotos reales con licencia libre (fuentes/), recortadas y rotuladas
jpg foto_especulo "$D/ppt_especulo_real.jpg"
jpg foto_helecho "$D/ppt_helecho_real.jpg" 80
jpg foto_progesterona "$D/ppt_progesterona_real.jpg"
jpg foto_dexametasona "$D/ppt_dexametasona_real.jpg"
jpg foto_egb "$D/ppt_egb_real.jpg" 82
# Recorrido animado sobre la ecografía real
gif cervix_recorrido "$D/ppt_cervicometria.gif" 64 330 2600 256
