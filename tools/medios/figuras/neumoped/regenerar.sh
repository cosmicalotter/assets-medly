#!/usr/bin/env bash
# Rehace todas las imágenes del algoritmo de neumonía y bronquiolitis (neumoped)
# desde sus fuentes HTML. Uso (desde la raíz del repo):
#   bash tools/medios/figuras/neumoped/regenerar.sh
set -euo pipefail
H=tools/medios/figuras/neumoped
D=data/imagenes/algoritmo/neumoped
PY=${PY:-$HOME/.cache/galgo-venv/bin/python}
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

png() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1.png" >/dev/null
        "$PY" -c "from PIL import Image; Image.open('$TMP/$1.png').convert('RGB').quantize(colors=256, method=Image.Quantize.MEDIANCUT).save('$2', optimize=True)"; echo "$2"; }
gif() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1" --cuadros "$3" >/dev/null
        "$PY" tools/medios/armar_gif.py "$TMP/$1" "$2" --ms "$4" --pausa "$5" --colores 128 | tail -1; }

# Animaciones: contar la frecuencia respiratoria y el tiraje subcostal.
gif fr "$D/neumo_frecuencia_respiratoria.gif" 124 100 3000
gif tiraje "$D/neumo_tiraje_subcostal.gif" 88 90 600
# Fichas fijas.
png diferencial "$D/neumo_diferencial.png"
png espaciador "$D/neumo_salbutamol_espaciador.png"
png alarma "$D/neumo_signos_alarma.png"
png altitud "$D/neumo_saturacion_altitud.png"
png canula "$D/neumo_canula_nasal.png"
png radiografia "$D/neumo_radiografia_cuando.png"
png soporte "$D/neumo_soporte_bronquiolitis.png"
