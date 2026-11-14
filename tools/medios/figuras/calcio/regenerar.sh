#!/usr/bin/env bash
# Rehace las imágenes del calcio, el magnesio y el cloro de «Líquidos y electrolitos en pediatría» (data/Pediatria/deshidratacion.json).
# Uso (desde la raíz): bash tools/medios/figuras/calcio/regenerar.sh
set -euo pipefail
H=tools/medios/figuras/calcio
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
# Curvas animadas propias (ECG) y fisiología de la regulación del calcio
gif ecg_hipoca "$D/calcio_ecg_hipo.gif" 30 280 3500 64
gif ecg_hiperca "$D/calcio_ecg_hiper.gif" 30 280 3500 64
gif regulacion "$D/calcio_regulacion.gif" 36 300 3500 128
# Esquemas de decisión y gráfico de datos propios
png hipoca_causas "$D/calcio_hipoca_causas.png"
png hiperca_causas "$D/calcio_hiperca_causas.png"
png hipomg "$D/calcio_hipomg.png"
png cloro_soluciones "$D/calcio_cloro.png"
# Fotos reales con licencia libre (fuentes/ y ../sodio/fuentes/), rotuladas en español
jpg foto_gluconato "$D/calcio_gluconato.jpg"
jpg foto_raquitismo "$D/calcio_raquitismo.jpg"
jpg foto_piloro "$D/calcio_piloro.jpg"
jpg foto_dialisis_ca "$D/calcio_dialisis.jpg"
jpg foto_torsades "$D/magnesio_torsades.jpg"
jpg foto_mg_bolsa "$D/magnesio_bolsa.jpg"
