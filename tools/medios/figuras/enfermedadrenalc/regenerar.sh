#!/usr/bin/env bash
# Rehace las imágenes del algoritmo de enfermedad renal crónica desde sus HTML y las fotos
# originales de fuentes/. Uso (desde la raíz del repo):
#   bash tools/medios/figuras/enfermedadrenalc/regenerar.sh
set -euo pipefail
H=tools/medios/figuras/enfermedadrenalc
D=data/imagenes/algoritmo/enfermedadrenalc
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

# Fotos reales (Wikimedia Commons, CC BY / CC BY-SA) rotuladas
jpg ecografia "$D/enfermedadrenalc_ecografia_real.jpg"
jpg cilindro "$D/enfermedadrenalc_cilindro_eritrocitario_real.jpg"
jpg ecg "$D/enfermedadrenalc_ecg_hiperpotasemia_real.jpg"
jpg tofo "$D/enfermedadrenalc_tofo_real.jpg"
# Esquemas propios
png mapa_riesgo "$D/enfermedadrenalc_mapa_riesgo.png"
png frecuencia "$D/enfermedadrenalc_frecuencia_controles.png"
png kfre "$D/enfermedadrenalc_kfre_umbrales.png"
png finerenona "$D/enfermedadrenalc_finerenona_potasio.png"
gif caida "$D/enfermedadrenalc_caida_tfge.gif" 30 260 3500 128
gif dias "$D/enfermedadrenalc_dias_enfermedad.gif" 30 380 3500 128
