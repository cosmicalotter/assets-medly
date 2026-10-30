#!/usr/bin/env bash
# Rehace las imágenes del algoritmo de lesión renal aguda desde sus HTML y las fotos
# originales de fuentes/.
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
jpg() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1.png" >/dev/null
        "$PY" -c "from PIL import Image; Image.open('$TMP/$1.png').convert('RGB').save('$2', quality=88, subsampling=0, optimize=True)"; echo "$2"; }
gif() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1" --cuadros "$3" >/dev/null
        "$PY" tools/medios/armar_gif.py "$TMP/$1" "$2" --ms "$4" --pausa "$5" --colores "$6" | tail -1; }

# Fotos reales (PMC, CC BY) rotuladas
jpg sed_hialino "$D/aki_cilindro_hialino_real.jpg"
jpg sed_granulosos "$D/aki_cilindros_granulosos_real.jpg"
jpg sed_epitelial "$D/aki_cilindro_epitelial_real.jpg"
jpg sed_hematico "$D/aki_cilindro_hematico_real.jpg"
jpg sed_dismorficos "$D/aki_hematies_dismorficos_real.jpg"
jpg sed_leucocitario "$D/aki_cilindro_leucocitario_real.jpg"
jpg eco_normal "$D/aki_eco_rinon_normal_real.jpg"
jpg eco_hidronefrosis "$D/aki_eco_hidronefrosis_real.jpg"
jpg eco_vejiga "$D/aki_eco_vejiga_real.jpg"
# Esquemas propios
png creatinina_basal "$D/aki_creatinina_basal.png"
png estadio_cub "$D/aki_estadio_cub.png"
png proteccion_estadio "$D/aki_proteccion_estadio.png"
png trr_modalidad "$D/aki_trr_modalidad.png"
png kamps "$D/aki_kamps.png"
gif fst "$D/aki_prueba_furosemida.gif" 48 200 3500 128
gif diureticos "$D/aki_escalada_diureticos.gif" 5 2800 3500 128
