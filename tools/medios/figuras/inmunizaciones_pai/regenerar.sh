#!/usr/bin/env bash
# Rehace las imágenes del algoritmo de vacunación según el PAI 2026. Uso (desde la raíz del repo):
#   bash tools/medios/figuras/inmunizaciones_pai/regenerar.sh
set -euo pipefail
H=tools/medios/figuras/inmunizaciones_pai
D=data/imagenes/algoritmo/inmunizaciones_pai
PY=${PY:-$HOME/.cache/galgo-venv/bin/python}
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$D"
png() { node tools/medios/capturar.js "$H/$1.html" "$2" >/dev/null; echo "$2"; }
gif() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1" --cuadros "$3" >/dev/null
        "$PY" tools/medios/armar_gif.py "$TMP/$1" "$2" --ms "$4" --pausa "$5" --colores "$6" | tail -1; }
# Esquemas propios
png esquema "$D/pai_esquema_infantil.png"
gif esquema "$D/pai_esquema_edades.gif" 27 900 2500 128
png gestantes "$D/pai_gestantes_semanas.png"
png td "$D/pai_td_mef.png"
# Foto de Commons recortada, con título y crédito (CC BY 2.0)
"$PY" -c "from PIL import Image; Image.open('$H/fuentes/commons_bcg_cicatriz.jpg').crop((200,300,840,960)).save('$H/fuentes/commons_bcg_cicatriz_recorte.jpg', quality=92, subsampling=0)"
python3 tools/medios/franja_credito.py "$H/fuentes/commons_bcg_cicatriz_recorte.jpg" "$D/pai_revision_antecedente.jpg" \
  "Imagen: CDC Global, Wikimedia Commons, CC BY 2.0. Recortada por Empirica." \
  --titulo "Revisar el antecedente vacunal" --subtitulo "Un equipo de salud revisa en casa las cicatrices de vacunas de un niño"
