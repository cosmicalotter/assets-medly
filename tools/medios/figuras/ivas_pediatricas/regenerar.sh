#!/usr/bin/env bash
# Rehace todas las imágenes del algoritmo de infecciones respiratorias altas en
# niños (ivas_pediatricas) desde sus fuentes HTML. Uso (desde la raíz del repo):
#   bash tools/medios/figuras/ivas_pediatricas/regenerar.sh
set -euo pipefail
H=tools/medios/figuras/ivas_pediatricas
D=data/imagenes/algoritmo/ivas_pediatricas
PY=${PY:-$HOME/.cache/galgo-venv/bin/python}
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$D"

png() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1.png" >/dev/null
        "$PY" -c "from PIL import Image; Image.open('$TMP/$1.png').convert('RGB').quantize(colors=256, method=Image.Quantize.MEDIANCUT).save('$2', optimize=True)"; echo "$2"; }
gif() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1" --cuadros "$3" >/dev/null
        "$PY" tools/medios/armar_gif.py "$TMP/$1" "$2" --ms "$4" --pausa "$5" --colores 128 | tail -1; }

# Animación: de la membrana timpánica normal a la OMA abombada.
gif otoscopia "$D/ivas_otoscopia_oma.gif" 40 90 1800
# Fichas fijas.
png oma_efusion "$D/ivas_oma_vs_efusion.png"
png oma_antibiotico "$D/ivas_oma_antibiotico.png"
png amoxicilina "$D/ivas_amoxicilina.png"
png patrones "$D/ivas_rinosinusitis_patrones.png"
png chandler "$D/ivas_chandler.png"
png absceso "$D/ivas_absceso_periamigdalino.png"
png cuello "$D/ivas_espacios_cuello.png"
png centor "$D/ivas_centor_mcisaac.png"
