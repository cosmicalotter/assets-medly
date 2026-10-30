#!/usr/bin/env bash
# Rehace las imágenes del algoritmo de asma del adulto desde sus HTML y las fotos
# originales de fuentes/. Uso (desde la raíz del repo):
#   bash tools/medios/figuras/asmaadultos/regenerar.sh
set -euo pipefail
H=tools/medios/figuras/asmaadultos
D=data/imagenes/algoritmo/asmaadultos
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

# Imágenes reales (PMC, CC BY 4.0) rotuladas
jpg flujo_volumen "$D/asma_flujo_volumen_real.jpg"
jpg rx_neumomediastino "$D/asma_neumomediastino_real.jpg"
jpg rx_hiperinsuflacion "$D/asma_hiperinsuflacion_real.jpg"
# Esquemas propios
png pef "$D/asma_variabilidad_pef.png"
png gravedad "$D/asma_gravedad_crisis.png"
png bajar "$D/asma_bajar_escalon.png"
png plan "$D/asma_plan_accion.png"
gif escalones "$D/asma_via1_escalones.gif" 4 1400 3500 128
gif tecnica "$D/asma_inhalador_camara.gif" 72 100 1500 128
