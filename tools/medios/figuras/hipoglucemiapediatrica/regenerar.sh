#!/usr/bin/env bash
# Rehace todas las imágenes del algoritmo de hipoglucemia neonatal y pediátrica
# desde sus fuentes HTML. Uso (desde la raíz del repo):
#   bash tools/medios/figuras/hipoglucemiapediatrica/regenerar.sh
set -euo pipefail
H=tools/medios/figuras/hipoglucemiapediatrica
D=data/imagenes/algoritmo/hipoglucemiapediatrica
PY=${PY:-$HOME/.cache/galgo-venv/bin/python}
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$D"

png() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1.png" >/dev/null
        "$PY" -c "from PIL import Image; Image.open('$TMP/$1.png').convert('RGB').quantize(colors=256, method=Image.Quantize.MEDIANCUT).save('$2', optimize=True)"; echo "$2"; }
gif() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1" --cuadros "$3" >/dev/null
        "$PY" tools/medios/armar_gif.py "$TMP/$1" "$2" --ms "$4" --pausa "$5" --colores 128 | tail -1; }

# Animaciones.
gif gel "$D/hipo_gel_bucal.gif" 48 110 1500
gif escalera "$D/hipo_escalera_iv.gif" 30 110 2200
# Fichas fijas.
png transicion "$D/hipo_transicion.png"
png calor "$D/hipo_calor.png"
png umbrales "$D/hipo_umbrales.png"
png whipple "$D/hipo_whipple.png"
png muestra_critica "$D/hipo_muestra_critica.png"
png niveles_diabetes "$D/hipo_niveles_diabetes.png"
png glucagon "$D/hipo_glucagon.png"
png regla_15 "$D/hipo_regla_15.png"
png ayuno "$D/hipo_ayuno.png"
