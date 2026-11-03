#!/usr/bin/env bash
# Rehace todas las imágenes del algoritmo de desnutrición aguda desde sus fuentes
# HTML. Uso (desde la raíz del repo):
#   bash tools/medios/figuras/desnutricion_aguda/regenerar.sh
set -euo pipefail
H=tools/medios/figuras/desnutricion_aguda
D=data/imagenes/algoritmo/desnutricion_aguda
PY=${PY:-$HOME/.cache/galgo-venv/bin/python}
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$D"

png() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1.png" >/dev/null
        "$PY" -c "from PIL import Image; Image.open('$TMP/$1.png').convert('RGB').quantize(colors=256, method=Image.Quantize.MEDIANCUT).save('$2', optimize=True)"; echo "$2"; }
gif() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1" --cuadros "$3" >/dev/null
        "$PY" tools/medios/armar_gif.py "$TMP/$1" "$2" --ms "$4" --pausa "$5" --colores 128 | tail -1; }

# Animaciones.
gif pb "$D/dnt_perimetro_brazo.gif" 39 110 1800
gif tss "$D/dnt_tss.gif" 48 110 1800
# Fichas fijas.
png edema "$D/dnt_edema_grados.png"
png clasificacion "$D/dnt_clasificacion.png"
png fenotipos "$D/dnt_marasmo_kwashiorkor.png"
png apetito "$D/dnt_prueba_apetito.png"
png fases "$D/dnt_fases.png"
png hidratacion "$D/dnt_hidratacion.png"
png realimentacion "$D/dnt_realimentacion.png"
png ftlc "$D/dnt_ftlc_esquema.png"
