#!/usr/bin/env bash
# Rehace las imágenes del potasio de «Líquidos y electrolitos en pediatría» (data/Pediatria/deshidratacion.json).
# Uso (desde la raíz): bash tools/medios/figuras/potasio/regenerar.sh
set -euo pipefail
H=tools/medios/figuras/potasio
D=data/imagenes/algoritmo/deshidratacion
PY=${PY:-$HOME/.cache/galgo-venv/bin/python}
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$D"
jpg() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1.png" >/dev/null
        "$PY" -c "from PIL import Image; Image.open('$TMP/$1.png').convert('RGB').save('$2', quality=${3:-86}, subsampling=0, optimize=True)"; echo "$2"; }
png() { node tools/medios/capturar.js "$H/$1.html" "$2" >/dev/null; echo "$2"; }
gif() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1" --cuadros "$3" >/dev/null
        "$PY" tools/medios/armar_gif.py "$TMP/$1" "$2" --ms "$4" --pausa "$5" --colores "$6" | tail -1; }
# Curvas animadas propias (ECG) y GIF de flujo
gif ecg_hipo "$D/potasio_ecg_hipo.gif" 30 280 3500 64
gif ecg_hiper "$D/potasio_ecg_hiper.gif" 30 280 3500 64
gif hiperk_tiempos "$D/potasio_tiempos.gif" 30 260 4000 128
# Esquemas de decisión propios
png hipok_renal "$D/potasio_renal.png"
png hiperk_causas "$D/potasio_hiperk_causas.png"
# Fotos reales con licencia libre (fuentes/), rotuladas en español
jpg foto_kcl "$D/potasio_kcl.jpg"
jpg foto_hemolisis "$D/potasio_hemolisis.jpg"
jpg foto_salbutamol "$D/potasio_salbutamol.jpg"
