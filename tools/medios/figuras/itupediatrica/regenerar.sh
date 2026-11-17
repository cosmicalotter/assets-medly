#!/usr/bin/env bash
# Rehace las imágenes del algoritmo de ITU en niños desde sus HTML y las fotos de fuentes/.
# Uso (desde la raíz del repo):
#   bash tools/medios/figuras/itupediatrica/regenerar.sh
set -euo pipefail
H=tools/medios/figuras/itupediatrica
D=data/imagenes/algoritmo/itupediatrica
PY=${PY:-$HOME/.cache/galgo-venv/bin/python}
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$D"

jpg() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1.png" >/dev/null
        "$PY" -c "from PIL import Image; Image.open('$TMP/$1.png').convert('RGB').save('$2', quality=${3:-86}, subsampling=0, optimize=True)"; echo "$2"; }
gif() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1" --cuadros "$3" >/dev/null
        "$PY" tools/medios/armar_gif.py "$TMP/$1" "$2" --ms "$4" --pausa "$5" --colores "$6" | tail -1; }
franja() { python3 tools/medios/franja_credito.py "$H/fuentes/$1" "$D/$2" "$3" --titulo "$4" --subtitulo "$5"; }

# Fotos e imágenes diagnósticas reales (Commons), rotuladas en español
jpg foto_bolsa_sonda "$D/itu_bolsa_sonda.jpg"
jpg foto_tira_sedimento "$D/itu_tira_sedimento.jpg"
jpg foto_cultivo "$D/itu_urocultivo.jpg"
jpg foto_hidronefrosis "$D/itu_hidronefrosis.jpg" 84
jpg foto_tc_pielo "$D/itu_tc_pielonefritis.jpg" 84
# Foto de escena con título y crédito
franja commons_Urine_sample_for_Culture_and_Sensitivity.jpg itu_frasco_esteril.jpg "Foto: Ajay Kumar Chaurasiya, Wikimedia Commons, CC BY-SA 4.0. Editada por Empirica." "El frasco del chorro medio" "Frasco estéril con tapa, para el análisis y el cultivo"
# Esquemas de decisión y gráfico de datos
jpg esquema_edad "$D/itu_segun_edad.jpg"
jpg esquema_lactante "$D/itu_lactante_menor_2_meses.jpg"
jpg esquema_cadenas "$D/itu_cadenas_tratamiento.jpg"
jpg cicatrices "$D/itu_cicatrices.jpg"
# GIF sobre una imagen real, de flujo y animaciones de fisiología
gif cum_reflujo "$D/itu_cum_reflujo.gif" 40 220 3000 128
gif linea_tiempo "$D/itu_evolucion.gif" 40 200 3000 128
gif nitritos "$D/itu_nitritos.gif" 48 180 2600 96
gif grados_rvu "$D/itu_grados_reflujo.gif" 60 160 1600 96
