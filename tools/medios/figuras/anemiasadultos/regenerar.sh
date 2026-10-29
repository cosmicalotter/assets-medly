#!/usr/bin/env bash
# Rehace las imágenes del algoritmo de anemia del adulto desde sus HTML y las fotos
# originales de fuentes/. Uso (desde la raíz del repo):
#   bash tools/medios/figuras/anemiasadultos/regenerar.sh
set -euo pipefail
H=tools/medios/figuras/anemiasadultos
D=data/imagenes/algoritmo/anemiasadultos
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

# Fotos reales (PMC, CC BY 4.0) rotuladas
jpg coiloniquia "$D/anemiasadultos_coiloniquia_real.jpg"
jpg frotis_ferropenia "$D/anemiasadultos_frotis_ferropenia_real.jpg"
jpg neutrofilos "$D/anemiasadultos_neutrofilos_hipersegmentados_real.jpg"
jpg glositis "$D/anemiasadultos_glositis_atrofica_real.jpg"
jpg esquistocitos "$D/anemiasadultos_esquistocitos_real.jpg"
# Esquemas propios
png altitud "$D/anemiasadultos_altitud_tabaco.png"
png ferritina "$D/anemiasadultos_ferritina_cortes.png"
gif respuesta_hierro "$D/anemiasadultos_respuesta_hierro.gif" 48 200 3500 128
gif pauta_b12 "$D/anemiasadultos_pauta_b12.gif" 12 900 3500 128
