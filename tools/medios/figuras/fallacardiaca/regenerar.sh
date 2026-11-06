#!/usr/bin/env bash
# Rehace las imágenes del algoritmo de insuficiencia cardíaca desde sus HTML y las fotos
# originales de fuentes/. Uso (desde la raíz del repo):
#   bash tools/medios/figuras/fallacardiaca/regenerar.sh
set -euo pipefail
H=tools/medios/figuras/fallacardiaca
D=data/imagenes/algoritmo/fallacardiaca
PY=${PY:-$HOME/.cache/galgo-venv/bin/python}
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$D"

jpg() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1.png" >/dev/null
        "$PY" -c "from PIL import Image; Image.open('$TMP/$1.png').convert('RGB').save('$2', quality=${3:-88}, subsampling=0, optimize=True)"; echo "$2"; }
png() { node tools/medios/capturar.js "$H/$1.html" "$2" >/dev/null; echo "$2"; }
gif() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1" --cuadros "$3" >/dev/null
        "$PY" tools/medios/armar_gif.py "$TMP/$1" "$2" --ms "$4" --pausa "$5" --colores "$6" | tail -1; }

# Fotos e imagen diagnóstica de Commons, rotuladas en español
jpg rx "$D/fallacardiaca_rx_congestion_real.jpg"
jpg edema "$D/fallacardiaca_edema_fovea_real.jpg"
jpg yugular "$D/fallacardiaca_yugular_real.jpg"
jpg eco "$D/fallacardiaca_eco_dilatada_real.jpg"
jpg ecg_bri "$D/fallacardiaca_ecg_bri_real.jpg" 80
jpg ecg_fa "$D/fallacardiaca_ecg_fa_real.jpg"
# Esquemas propios
png peptidos "$D/fallacardiaca_ntprobnp_edad.png"
gif titulacion "$D/fallacardiaca_titulacion.gif" 24 120 2600 128
