#!/usr/bin/env bash
# Rehace las imágenes del algoritmo de hemorragia digestiva alta desde sus HTML y las fotos
# originales de fuentes/. Uso (desde la raíz del repo):
#   bash tools/medios/figuras/hvda/regenerar.sh
set -euo pipefail
H=tools/medios/figuras/hvda
D=data/imagenes/algoritmo/hvda
PY=${PY:-$HOME/.cache/galgo-venv/bin/python}
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$D"

png() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1.png" >/dev/null
        "$PY" -c "from PIL import Image; Image.open('$TMP/$1.png').convert('P', palette=Image.ADAPTIVE, colors=256).save('$2', optimize=True)"; echo "$2"; }
jpg() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1.png" >/dev/null
        "$PY" -c "from PIL import Image; Image.open('$TMP/$1.png').convert('RGB').save('$2', quality=86, subsampling=0, optimize=True)"; echo "$2"; }
gif() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1" --cuadros "$3" >/dev/null
        "$PY" tools/medios/armar_gif.py "$TMP/$1" "$2" --ms "$4" --pausa "$5" --colores "$6" | tail -1; }

# Fotos reales (Wikimedia Commons: CC0, dominio público, CC BY-SA) rotuladas
jpg melenas "$D/hvda_melenas_real.jpg"
jpg ulcera_iia "$D/hvda_ulcera_vaso_visible_real.jpg"
jpg ulcera_chorro "$D/hvda_ulcera_chorro_real.jpg"
jpg varices_sangrado "$D/hvda_varice_sangrado_real.jpg"
jpg post_ligadura "$D/hvda_esofago_post_ligadura_real.jpg"
jpg mallory_weiss "$D/hvda_mallory_weiss_real.jpg"
jpg dieulafoy "$D/hvda_dieulafoy_real.jpg"
jpg gave "$D/hvda_ectasia_antral_real.jpg"
# Esquemas propios
png gbs "$D/hvda_glasgow_blatchford.png"
png varices_dias "$D/hvda_varices_primera_semana.png"
gif reloj "$D/hvda_reloj_endoscopia.gif" 30 220 3500 96
