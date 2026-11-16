#!/usr/bin/env bash
# Rehace las imágenes del algoritmo de trastornos hipertensivos del embarazo desde sus HTML y las fotos de fuentes/.
# Uso (desde la raíz del repo):
#   bash tools/medios/figuras/trastornos_hipertensivos/regenerar.sh
set -euo pipefail
H=tools/medios/figuras/trastornos_hipertensivos
D=data/imagenes/algoritmo/trastornos_hipertensivos
PY=${PY:-$HOME/.cache/galgo-venv/bin/python}
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$D"

jpg() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1.png" >/dev/null
        "$PY" -c "from PIL import Image; Image.open('$TMP/$1.png').convert('RGB').save('$2', quality=${3:-86}, subsampling=0, optimize=True)"; echo "$2"; }
png() { node tools/medios/capturar.js "$H/$1.html" "$2" >/dev/null; echo "$2"; }
gif() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1" --cuadros "$3" >/dev/null
        "$PY" tools/medios/armar_gif.py "$TMP/$1" "$2" --ms "$4" --pausa "$5" --colores "$6" | tail -1; }

# Fotos e imágenes diagnósticas reales (Commons), rotuladas en español
jpg foto_toma_pa "$D/the_toma_presion_real.jpg"
jpg foto_tira "$D/the_tira_proteinuria_real.jpg"
jpg foto_pres "$D/the_pres_resonancia_real.jpg"
jpg foto_hematoma "$D/the_hematoma_hepatico_real.jpg"
jpg foto_edema "$D/the_edema_pulmonar_real.jpg"
jpg foto_sulfato "$D/the_sulfato_magnesio_real.jpg"
jpg foto_ctg "$D/the_monitoria_trazado_real.jpg"
jpg foto_monitor "$D/the_monitor_fetal_real.jpg"
jpg foto_doppler "$D/the_doppler_umbilical_real.jpg"
# GIF sobre la imagen real
gif foto_esquistocitos "$D/the_esquistocitos.gif" 24 110 2800 96
# GIF de fisiología y de flujo
gif espirales "$D/the_arterias_espirales.gif" 24 110 1500 64
gif crisis "$D/the_crisis_60_minutos.gif" 24 160 3000 48
gif posparto "$D/the_seguimiento_posparto.gif" 24 160 3000 48
# Esquemas y gráficos propios
png riesgo "$D/the_factores_riesgo.png"
png aspirina_calcio "$D/the_aspirina_calcio.png"
png umbrales "$D/the_umbrales_presion.png"
png clasificacion "$D/the_clasificacion.png"
png piers "$D/the_fullpiers_tabla5.png"
png magnesio "$D/the_magnesio_niveles.png"
png momento "$D/the_momento_parto.png"
png riesgo_cv "$D/the_riesgo_cardiovascular.png"
png recurrencia "$D/the_recurrencia.png"
png doppler_esquema "$D/the_doppler_patrones.png"
