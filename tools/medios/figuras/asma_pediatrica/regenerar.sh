#!/usr/bin/env bash
# Rehace todas las imágenes del algoritmo de asma en niños (asma_pediatrica)
# desde sus fuentes HTML. Uso (desde la raíz del repo):
#   bash tools/medios/figuras/asma_pediatrica/regenerar.sh
set -euo pipefail
H=tools/medios/figuras/asma_pediatrica
D=data/imagenes/algoritmo/asma_pediatrica
PY=${PY:-$HOME/.cache/galgo-venv/bin/python}
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$D"

png() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1.png" >/dev/null
        "$PY" -c "from PIL import Image; Image.open('$TMP/$1.png').convert('RGB').quantize(colors=256, method=Image.Quantize.MEDIANCUT).save('$2', optimize=True)"; echo "$2"; }
gif() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1" --cuadros "$3" >/dev/null
        "$PY" tools/medios/armar_gif.py "$TMP/$1" "$2" --ms "$4" --pausa "$5" --colores 128 | tail -1; }

# Animación: técnica del inhalador con cámara.
gif tecnica "$D/asma_inhalador_camara.gif" 104 100 1500
# Fichas fijas.
png gravedad "$D/asma_gravedad_crisis.png"
png crisis "$D/asma_crisis_tratamiento.png"
png escalones5 "$D/asma_escalones_menor5.png"
png escalones611 "$D/asma_escalones_6_11.png"
png plan "$D/asma_plan_crisis_casa.png"
