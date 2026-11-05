#!/usr/bin/env bash
# Rehace las imágenes del algoritmo de la EPOC desde sus HTML y las fotos originales de fuentes/.
# Uso (desde la raíz del repo):
#   bash tools/medios/figuras/epoc/regenerar.sh
set -euo pipefail
H=tools/medios/figuras/epoc
D=data/imagenes/algoritmo/epoc
PY=${PY:-$HOME/.cache/galgo-venv/bin/python}
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$D"

jpg() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1.png" >/dev/null
        "$PY" -c "from PIL import Image; Image.open('$TMP/$1.png').convert('RGB').save('$2', quality=88, subsampling=0, optimize=True)"; echo "$2"; }
png() { node tools/medios/capturar.js "$H/$1.html" "$2" >/dev/null; echo "$2"; }
gif() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1" --cuadros "$3" >/dev/null
        "$PY" tools/medios/armar_gif.py "$TMP/$1" "$2" --ms "$4" --pausa "$5" --colores "$6" | tail -1; }

# Fotos de Commons rotuladas (NIOSH, dominio público; James Heilman, MD, CC BY-SA 3.0 y 4.0; Tradimus, CC BY-SA 3.0)
jpg rx_lateral "$D/epoc_rx_lateral_real.jpg"
jpg espirometria "$D/epoc_espirometria_real.jpg"
jpg espaciador "$D/epoc_espaciador_real.jpg"
jpg vmni "$D/epoc_vmni_real.jpg"
# Animación propia: el escalamiento por exacerbaciones, fila por fila
gif escalamiento "$D/epoc_escalamiento.gif" 4 2600 4000 128
# Esquemas propios (PNG)
png grados_abe "$D/epoc_grados_abe.png"
png tratamiento_inicial "$D/epoc_tratamiento_inicial.png"
png eosinofilos "$D/epoc_eosinofilos.png"
png lugar_manejo "$D/epoc_lugar_manejo.png"
