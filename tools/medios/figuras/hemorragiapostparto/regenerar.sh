#!/usr/bin/env bash
# Rehace las imágenes del algoritmo de hemorragia posparto desde sus HTML. Uso (desde la raíz del repo):
#   bash tools/medios/figuras/hemorragiapostparto/regenerar.sh
set -euo pipefail
H=tools/medios/figuras/hemorragiapostparto
D=data/imagenes/algoritmo/hemorragiapostparto
PY=${PY:-$HOME/.cache/galgo-venv/bin/python}
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$D"

jpg() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1.png" >/dev/null
        "$PY" -c "from PIL import Image; Image.open('$TMP/$1.png').convert('RGB').save('$2', quality=${3:-88}, subsampling=0, optimize=True)"; echo "$2"; }
png() { node tools/medios/capturar.js "$H/$1.html" "$2" >/dev/null; echo "$2"; }
gif() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1" --cuadros "$3" >/dev/null
        "$PY" tools/medios/armar_gif.py "$TMP/$1" "$2" --ms "$4" --pausa "$5" --colores "$6" | tail -1; }

# Esquemas propios (PNG)
png codigo_rojo_1_20 "$D/hpp_codigo_rojo_1_20.png"
png codigo_rojo_20_60 "$D/hpp_codigo_rojo_20_60.png"
png codigo_rojo_60 "$D/hpp_codigo_rojo_60.png"
png indice_choque "$D/hpp_indice_choque.png"
png cuatro_t "$D/hpp_cuatro_t.png"
# Animación propia
gif codigo_rojo "$D/hpp_codigo_rojo.gif" 60 180 3500 128
# Fotos reales con licencia libre (fuentes/), rotuladas
jpg foto_traje "$D/hpp_traje_antichoque_real.jpg" 82
jpg foto_inversion "$D/hpp_inversion_uterina_real.jpg" 82
