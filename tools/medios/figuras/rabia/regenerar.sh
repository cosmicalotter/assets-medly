#!/usr/bin/env bash
# Rehace las imágenes del algoritmo de exposición rábica y rabia desde sus HTML. Uso (desde la raíz del repo):
#   bash tools/medios/figuras/rabia/regenerar.sh
set -euo pipefail
H=tools/medios/figuras/rabia
D=data/imagenes/algoritmo/rabia
PY=${PY:-$HOME/.cache/galgo-venv/bin/python}
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$D"

jpg() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1.png" >/dev/null
        "$PY" -c "from PIL import Image; Image.open('$TMP/$1.png').convert('RGB').save('$2', quality=${3:-86}, subsampling=0, optimize=True)"; echo "$2"; }
png() { node tools/medios/capturar.js "$H/$1.html" "$2" >/dev/null; echo "$2"; }

# Esquemas y gráficos propios (PNG)
png clasificacion "$D/rabia_clasificacion.png"
png esquemas "$D/rabia_esquemas.png"
png riesgo_sitio "$D/rabia_riesgo_sitio.png"
png curso "$D/rabia_curso.png"
png preexposicion "$D/rabia_preexposicion.png"
# Animación propia: los 10 días de observación
node tools/medios/capturar.js "$H/observacion.html" "$TMP/observacion" --cuadros 48 >/dev/null
"$PY" tools/medios/armar_gif.py "$TMP/observacion" "$D/rabia_observacion.gif" --ms 200 --pausa 3500 --colores 128 | tail -1
# Fotos reales con licencia libre (fuentes/), recortadas y rotuladas
jpg foto_murcielago "$D/rabia_murcielago_real.jpg"
jpg foto_perro "$D/rabia_perro_real.jpg"
jpg foto_mano "$D/rabia_mordedura_mano_real.jpg"
jpg foto_negri "$D/rabia_negri_real.jpg"
node tools/medios/solapes.js "$H"/*.html
