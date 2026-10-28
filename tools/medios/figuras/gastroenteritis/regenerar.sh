#!/usr/bin/env bash
# Rehace todas las imágenes del algoritmo de enfermedad diarreica aguda
# (gastroenteritis_aguda_aiepi) desde sus fuentes HTML. Uso (desde la raíz del repo):
#   bash tools/medios/figuras/gastroenteritis/regenerar.sh
set -euo pipefail
H=tools/medios/figuras/gastroenteritis
D=data/imagenes/algoritmo/gastroenteritis_aguda_aiepi
PY=${PY:-$HOME/.cache/galgo-venv/bin/python}
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

png() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1.png" >/dev/null
        "$PY" -c "from PIL import Image; Image.open('$TMP/$1.png').convert('RGB').quantize(colors=256, method=Image.Quantize.MEDIANCUT).save('$2', optimize=True)"; echo "$2"; }
gif() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1" --cuadros "$3" >/dev/null
        "$PY" tools/medios/armar_gif.py "$TMP/$1" "$2" --ms "$4" --pausa "$5" --colores 128 | tail -1; }

# Animaciones: la técnica del pliegue y los tiempos del plan C.
gif pliegue "$D/eda_pliegue_cutaneo.gif" 138 100 2000
gif plan_c "$D/eda_plan_c_tiempos.gif" 64 120 3000
# Fichas fijas.
png signos_deshidratacion "$D/eda_signos_deshidratacion.png"
png plan_a "$D/eda_plan_a_liquidos.png"
png plan_b "$D/eda_plan_b_sro.png"
png ondansetron "$D/eda_ondansetron_dosis.png"
png mejoria "$D/eda_disenteria_mejoria.png"
png alarma "$D/eda_signos_alarma.png"
