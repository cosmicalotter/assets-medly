#!/usr/bin/env bash
# Rehace las ilustraciones propias del algoritmo de lesión renal aguda desde sus HTML.
# Uso (desde la raíz del repo):
#   bash tools/medios/figuras/aki/regenerar.sh
set -euo pipefail
H=tools/medios/figuras/aki
D=data/imagenes/algoritmo/aki
PY=${PY:-$HOME/.cache/galgo-venv/bin/python}
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$D"

png() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1.png" >/dev/null
        "$PY" -c "from PIL import Image; Image.open('$TMP/$1.png').convert('P', palette=Image.ADAPTIVE, colors=256).save('$2', optimize=True)"; echo "$2"; }
gif() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1" --cuadros "$3" >/dev/null
        "$PY" tools/medios/armar_gif.py "$TMP/$1" "$2" --ms "$4" --pausa "$5" --colores "$6" | tail -1; }

png creatinina_basal "$D/aki_creatinina_basal.png"
png estadio_cub "$D/aki_estadio_cub.png"
png sedimento_nta "$D/aki_sedimento_necrosis_tubular.png"
png sedimento_glomerular "$D/aki_sedimento_glomerular.png"
png hidronefrosis "$D/aki_ecografia_obstruccion.png"
png proteccion_estadio "$D/aki_proteccion_estadio.png"
png trr_modalidad "$D/aki_trr_modalidad.png"
png kamps "$D/aki_kamps.png"
gif fst "$D/aki_prueba_furosemida.gif" 48 200 3500 128
gif diureticos "$D/aki_escalada_diureticos.gif" 5 2800 3500 128
