#!/usr/bin/env bash
# Rehace las figuras del algoritmo de cardiotocografía desde sus HTML (todas propias).
# Uso (desde la raíz del repo):
#   bash tools/medios/figuras/cardiotocografia/regenerar.sh
set -euo pipefail
H=tools/medios/figuras/cardiotocografia
D=data/imagenes/algoritmo/cardiotocografia
PY=${PY:-$HOME/.cache/galgo-venv/bin/python}
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$D"

png() { node tools/medios/capturar.js "$H/$1.html" "$D/ctg_$1.png" >/dev/null; echo "$D/ctg_$1.png"; }

for f in escalas taquisistolia linea_base variabilidad sinusoidal aceleracion desaceleraciones \
         variable_preocupante bradicardia_9min categorias fc_materna; do
  png "$f"
done
# Animación: precoz frente a tardía
node tools/medios/capturar.js "$H/tardia_precoz.html" "$TMP/tardia" --cuadros 40 >/dev/null
"$PY" tools/medios/armar_gif.py "$TMP/tardia" "$D/ctg_tardia_precoz.gif" --ms 140 --pausa 3500 --colores 256 | tail -1
node tools/medios/solapes.js "$H"/*.html
