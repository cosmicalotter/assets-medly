#!/usr/bin/env bash
# Rehace las imágenes del algoritmo de sepsis neonatal desde sus HTML y las fotos de fuentes/.
# Uso (desde la raíz del repo):
#   bash tools/medios/figuras/sepsisneonatal/regenerar.sh
set -euo pipefail
H=tools/medios/figuras/sepsisneonatal
D=data/imagenes/algoritmo/sepsisneonatal
PY=${PY:-$HOME/.cache/galgo-venv/bin/python}
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$D"

jpg() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1.png" >/dev/null
        "$PY" -c "from PIL import Image; Image.open('$TMP/$1.png').convert('RGB').save('$2', quality=${3:-86}, subsampling=0, optimize=True)"; echo "$2"; }
gif() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1" --cuadros "$3" >/dev/null
        "$PY" tools/medios/armar_gif.py "$TMP/$1" "$2" --ms "$4" --pausa "$5" --colores "$6" | tail -1; }

# Fotos e imágenes reales (Commons), rotuladas en español
jpg foto_puncion "$D/sn_puncion_lumbar.jpg"
jpg foto_ventilador "$D/sn_prematuro_ventilado.jpg"
jpg foto_gram "$D/sn_gram_egb_ecoli.jpg"
jpg foto_egb_agar "$D/sn_egb_agar.jpg"
jpg foto_audicion "$D/sn_audiologia.jpg"
# Esquemas de decisión y gráficos de datos
jpg marco_nice "$D/sn_marco_decision.jpg"
jpg prematuro "$D/sn_prematuro_riesgo.jpg"
jpg cobertura "$D/sn_ampicilina_gentamicina.jpg"
jpg lr_hemograma "$D/sn_hemograma_lr.jpg"
jpg germenes "$D/sn_germenes.jpg"
# GIF sobre fotos reales, de flujo y de fisiología
gif frascos "$D/sn_hemocultivo.gif" 30 200 3000 128
gif vigilancia "$D/sn_observacion.gif" 40 180 3000 96
gif revision "$D/sn_revision_36_48.gif" 40 200 3000 96
gif infeccion "$D/sn_como_llega.gif" 40 140 2600 64
