#!/usr/bin/env bash
# Rehace las imágenes del algoritmo de síndrome coronario agudo desde sus HTML y las fotos
# originales de fuentes/. Uso (desde la raíz del repo):
#   bash tools/medios/figuras/sindromecoronario/regenerar.sh
set -euo pipefail
H=tools/medios/figuras/sindromecoronario
D=data/imagenes/algoritmo/sindromecoronario
PY=${PY:-$HOME/.cache/galgo-venv/bin/python}
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$D"

jpg() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1.png" >/dev/null
        "$PY" -c "from PIL import Image; Image.open('$TMP/$1.png').convert('RGB').save('$2', quality=${3:-88}, subsampling=0, optimize=True)"; echo "$2"; }
png() { node tools/medios/capturar.js "$H/$1.html" "$2" >/dev/null; echo "$2"; }
gif() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1" --cuadros "$3" >/dev/null
        "$PY" tools/medios/armar_gif.py "$TMP/$1" "$2" --ms "$4" --pausa "$5" --colores "$6" | tail -1; }

# ECG, angiografías, TC y fotos de Commons, rotulados en español
jpg ecg_inferior "$D/sindromecoronario_ecg_inferior_real.jpg" 70
jpg coronaria_icp "$D/sindromecoronario_icp_real.jpg"
jpg introductor "$D/sindromecoronario_introductor_real.jpg"
jpg hemodinamia "$D/sindromecoronario_hemodinamia_real.jpg"
jpg diseccion "$D/sindromecoronario_diseccion_real.jpg"
jpg takotsubo "$D/sindromecoronario_takotsubo_real.jpg"
jpg bloqueo_av "$D/sindromecoronario_bloqueo_av_real.jpg" 82
jpg pericarditis "$D/sindromecoronario_pericarditis_real.jpg" 82
jpg coronaria_lesion "$D/sindromecoronario_estenosis_real.jpg"
jpg ecmo "$D/sindromecoronario_ecmo_real.jpg"
jpg edema_pulmonar "$D/sindromecoronario_edema_pulmonar_real.jpg"
jpg ecg_fa "$D/sindromecoronario_ecg_fa_real.jpg"
# Recorrido por un ECG real de IAMCEST anterior
gif ecg_recorrido "$D/sindromecoronario_ecg_recorrido.gif" 60 330 2600 256
# Esquemas propios
png tiempos "$D/sindromecoronario_tiempos.png"
png estrategia "$D/sindromecoronario_estrategia.png"
png algoritmo_0h1h "$D/sindromecoronario_algoritmo_0h1h.png"
png tapd "$D/sindromecoronario_antiagregacion.png"
png ldl "$D/sindromecoronario_ldl.png"
gif farmacoinvasiva "$D/sindromecoronario_farmacoinvasiva.gif" 30 220 3000 128
