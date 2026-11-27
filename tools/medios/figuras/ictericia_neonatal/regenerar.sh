#!/usr/bin/env bash
# Rehace las imágenes del algoritmo de ictericia neonatal desde sus HTML y las fotos de fuentes/.
# Uso (desde la raíz del repo):
#   bash tools/medios/figuras/ictericia_neonatal/regenerar.sh
set -euo pipefail
H=tools/medios/figuras/ictericia_neonatal
D=data/imagenes/algoritmo/ictericia_neonatal
PY=${PY:-$HOME/.cache/galgo-venv/bin/python}
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$D"

jpg() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1.png" >/dev/null
        "$PY" -c "from PIL import Image; Image.open('$TMP/$1.png').convert('RGB').save('$2', quality=${3:-86}, subsampling=0, optimize=True)"; echo "$2"; }
gif() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1" --cuadros "$3" >/dev/null
        "$PY" tools/medios/armar_gif.py "$TMP/$1" "$2" --ms "$4" --pausa "$5" --colores "$6" | tail -1; }

# Fotos reales (Commons), rotuladas en español
jpg foto_ictericia "$D/ict_piel_amarilla.jpg"
jpg foto_prolongada "$D/ict_prolongada.jpg"
jpg foto_atresia "$D/ict_atresia_biliar.jpg"
# Esquemas de decisión
jpg medicion "$D/ict_que_medir.jpg"
jpg umbrales "$D/ict_escalera_umbrales.jpg"
jpg escalada "$D/ict_escalada.jpg"
jpg seguimiento "$D/ict_seguimiento_alta.jpg"
# GIF sobre foto real, de flujo y de fisiología
gif foto_fototerapia "$D/ict_fototerapia.gif" 30 200 3000 128
gif flujo "$D/ict_fototerapia_rebote.gif" 40 200 3000 96
gif metabolismo "$D/ict_bilirrubina.gif" 40 160 3000 96
