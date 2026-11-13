#!/usr/bin/env bash
# Rehace las imágenes del sodio de «Líquidos y electrolitos en pediatría» (data/Pediatria/deshidratacion.json).
# Uso (desde la raíz): bash tools/medios/figuras/sodio/regenerar.sh
set -euo pipefail
H=tools/medios/figuras/sodio
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
# Animaciones propias de fisiología y de flujo
gif hipona_celula "$D/sodio_hipona_neurona.gif" 36 260 3500 128
gif hiperna_celula "$D/sodio_hiperna_neurona.gif" 36 260 3500 128
gif adh "$D/sodio_adh_tubulo.gif" 40 300 3500 128
gif hipona_ritmo "$D/sodio_hipona_ritmo.gif" 30 260 4000 128
gif hiperna_ritmo "$D/sodio_hiperna_ritmo.gif" 30 260 4000 128
# Esquemas de decisión propios
png osmolalidad "$D/sodio_osmolalidad.png"
png volemia "$D/sodio_volemia_fena.png"
png siadh_sal "$D/sodio_siadh_perdida_sal.png"
png hiperna_causas "$D/sodio_hiperna_causas.png"
# Fotos reales con licencia libre (fuentes/), rotuladas en español
jpg foto_salina3 "$D/sodio_salina3.jpg"
jpg foto_lipemia "$D/sodio_lipemia.jpg"
jpg foto_edema "$D/sodio_edema.jpg"
jpg foto_dialisis "$D/sodio_dialisis.jpg"
