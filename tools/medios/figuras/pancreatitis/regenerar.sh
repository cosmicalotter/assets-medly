#!/usr/bin/env bash
# Rehace las imágenes del algoritmo de pancreatitis aguda desde sus HTML.
# Uso (desde la raíz del repo): bash tools/medios/figuras/pancreatitis/regenerar.sh
set -euo pipefail
H=tools/medios/figuras/pancreatitis
D=data/imagenes/algoritmo/pancreatitis
PY=${PY:-$HOME/.cache/galgo-venv/bin/python}
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$D"

jpg() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1.png" --escala 2 >/dev/null
        "$PY" -c "from PIL import Image; Image.open('$TMP/$1.png').convert('RGB').save('$2', quality=${3:-84}, subsampling=0, optimize=True)"; echo "$2"; }
png() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1.png" --escala 2 >/dev/null
        "$PY" -c "from PIL import Image; Image.open('$TMP/$1.png').convert('P', palette=Image.ADAPTIVE, colors=256).save('$2', optimize=True)"; echo "$2"; }
gif() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1" --cuadros "$3" >/dev/null
        "$PY" tools/medios/armar_gif.py "$TMP/$1" "$2" --ms "$4" --pausa "$5" --colores "$6" | tail -1; }

# Gráficos propios de datos (PNG)
png enzimas "$D/pancreatitis_enzimas.png"
png liquidos "$D/pancreatitis_liquidos.png"
png fases_liquidos "$D/pancreatitis_fases_liquidos.png"
png colecciones "$D/pancreatitis_colecciones.png"
png destino "$D/pancreatitis_destino.png"
png biliar_decisiones "$D/pancreatitis_biliar_decisiones.png"
png nutricion "$D/pancreatitis_nutricion.png"
png trigliceridos "$D/pancreatitis_trigliceridos.png"
png atlanta_tiempo "$D/pancreatitis_atlanta_tiempo.png"
png seguimiento "$D/pancreatitis_seguimiento.png"
# Esquemas animados de flujo (GIF)
gif primeras72 "$D/pancreatitis_primeras72.gif" 30 220 3000 128
gif escalonado_gif "$D/pancreatitis_escalonado.gif" 30 220 3000 128
# Animación propia de fisiología (GIF)
gif calculo_pasa "$D/pancreatitis_calculo_pasa.gif" 72 110 2400 128
# Recorrido animado sobre TC reales (GIF)
gif tc_recorrido "$D/pancreatitis_tc_recorrido.gif" 60 330 2600 256
# Fotos e imágenes diagnósticas reales con licencia libre (fuentes/), recortadas y rotuladas
jpg eco_calculo "$D/pancreatitis_eco_calculo_real.jpg"
jpg derrame "$D/pancreatitis_derrame_real.jpg"
jpg necrosis_extensa "$D/pancreatitis_necrosis_extensa_real.jpg"
jpg necrosis_progresion "$D/pancreatitis_necrosis_progresion_real.jpg"
jpg pseudoquiste "$D/pancreatitis_pseudoquiste_real.jpg"
jpg drenaje "$D/pancreatitis_drenaje_real.jpg"
jpg necrosectomia "$D/pancreatitis_necrosectomia_real.jpg"
jpg trombosis "$D/pancreatitis_trombosis_portal_real.jpg"
jpg sonda "$D/pancreatitis_sonda_real.jpg"
