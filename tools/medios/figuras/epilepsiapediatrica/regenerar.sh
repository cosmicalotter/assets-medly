#!/usr/bin/env bash
# Rehace todas las imágenes del algoritmo de epilepsia pediátrica desde sus
# fuentes HTML. Uso (desde la raíz del repo):
#   bash tools/medios/figuras/epilepsiapediatrica/regenerar.sh
set -euo pipefail
H=tools/medios/figuras/epilepsiapediatrica
D=data/imagenes/algoritmo/epilepsiapediatrica
PY=${PY:-$HOME/.cache/galgo-venv/bin/python}
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

png() { node tools/medios/capturar.js "$H/$1.html" "$2" >/dev/null; echo "$2"; }
jpg() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1.png" >/dev/null
        "$PY" -c "from PIL import Image; Image.open('$TMP/$1.png').convert('RGB').save('$2', quality=88, subsampling=0, optimize=True)"; echo "$2"; }
gif() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1" --cuadros "$3" >/dev/null
        "$PY" tools/medios/armar_gif.py "$TMP/$1" "$2" --ms "$4" --pausa 2500 --colores "$5" | tail -1; }

# Recorridos animados sobre imágenes reales.
gif midazolam_real "$D/epilepsia_midazolam_bucal_real.gif" 70 330 256
gif fenitoina_real "$D/epilepsia_fenitoina_real.gif" 60 330 128
gif qt_largo_real "$D/epilepsia_qt_largo_real.gif" 60 330 128
# Trazados y fotos reales, fijos.
jpg eeg_no_convulsivo_real "$D/epilepsia_eeg_no_convulsivo_real.jpg"
jpg ausencia_real "$D/epilepsia_eeg_ausencia_real.jpg"
jpg hipsarritmia_real "$D/epilepsia_eeg_hipsarritmia_real.jpg"
jpg seguridad_real "$D/epilepsia_seguridad_real.jpg"
# Ficha propia: plan de emergencia y dosis de midazolam bucal por edad.
png plan_emergencia_dosis "$D/epilepsia_plan_emergencia_dosis.png"
