#!/usr/bin/env bash
# Rehace las imágenes del algoritmo de tromboembolismo pulmonar desde sus HTML y las fotos
# originales de fuentes/. Uso (desde la raíz del repo):
#   bash tools/medios/figuras/tep/regenerar.sh
set -euo pipefail
H=tools/medios/figuras/tep
D=data/imagenes/algoritmo/tep
PY=${PY:-$HOME/.cache/galgo-venv/bin/python}
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$D"

jpg() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1.png" >/dev/null
        "$PY" -c "from PIL import Image; Image.open('$TMP/$1.png').convert('RGB').save('$2', quality=${3:-86}, subsampling=0, optimize=True)"; echo "$2"; }
png() { node tools/medios/capturar.js "$H/$1.html" "$2" >/dev/null; echo "$2"; }
gif() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1" --cuadros "$3" >/dev/null
        "$PY" tools/medios/armar_gif.py "$TMP/$1" "$2" --ms "$4" --pausa "$5" --colores "$6" | tail -1; }

# Angio-TC, ECG, radiografías, gammagrafía, Doppler y fotos de Commons, rotulados en español
jpg vd_tc "$D/tep_vd_tc_real.jpg"
jpg reflujo "$D/tep_reflujo_real.jpg"
jpg ecg_tep "$D/tep_ecg_s1q3t3_real.jpg" 80
jpg hampton "$D/tep_hampton_real.jpg"
jpg vq "$D/tep_vq_real.jpg"
jpg tvp "$D/tep_tvp_doppler_real.jpg"
jpg filtro "$D/tep_filtro_vci_real.jpg"
jpg angiografia "$D/tep_angiografia_real.jpg"
jpg ecmo "$D/tep_ecmo_real.jpg"
# Recorrido por una angio-TC real con un émbolo en silla de montar
gif silla_recorrido "$D/tep_angiotc_silla.gif" 60 330 2600 256
# Esquemas propios de datos
gif years "$D/tep_years.gif" 48 200 3200 128
gif categorias "$D/tep_categorias.gif" 40 200 3200 128
png fases "$D/tep_fases.png"
png alteplasa "$D/tep_alteplasa.png"
# Animaciones propias de fisiología
gif trombo_viaje "$D/tep_trombo_viaje.gif" 72 110 2400 128
gif mcconnell "$D/tep_mcconnell.gif" 80 90 600 64
gif espiral_vd "$D/tep_espiral_vd.gif" 72 110 2600 128
