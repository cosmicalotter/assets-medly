#!/usr/bin/env bash
# Rehace las imágenes del algoritmo de parto y distocias desde sus HTML. Uso (desde la raíz del repo):
#   bash tools/medios/figuras/parto/regenerar.sh
set -euo pipefail
H=tools/medios/figuras/parto
D=data/imagenes/algoritmo/parto
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
png fases "$D/parto_fases.png"
png guia_cuidados "$D/parto_guia_cuidados.png"
png oxitocina "$D/parto_oxitocina.png"
png reanimacion "$D/parto_reanimacion.png"
png expulsivo_tiempos "$D/parto_expulsivo_tiempos.png"
png alumbramiento "$D/parto_alumbramiento.png"
# Animaciones propias
gif auscultacion "$D/parto_auscultacion.gif" 40 220 3000 128
png hombros_exito "$D/parto_hombros_exito.png"
# Fotos y figuras reales con licencia libre (fuentes/), traducidas y rotuladas
jpg foto_auscultacion "$D/parto_auscultacion_real.jpg"
jpg foto_monitoria "$D/parto_monitoria_real.jpg" 78
jpg foto_placenta "$D/parto_placenta_real.jpg" 74
jpg foto_descenso_rm "$D/parto_descenso_rm_real.jpg"
