#!/usr/bin/env bash
# Rehace todas las imágenes creadas del algoritmo de patología biliar desde sus
# fuentes HTML. Uso (desde la raíz del repo): bash tools/medios/figuras/biliar/regenerar.sh
set -euo pipefail
H=tools/medios/figuras/biliar
D=data/imagenes/algoritmo/biliar
C=data/calculadoras/imagenes
PY=${PY:-$HOME/.cache/galgo-venv/bin/python}
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

png() { node tools/medios/capturar.js "$H/$1.html" "$2" >/dev/null; echo "$2"; }
jpg() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1.png" >/dev/null
        "$PY" -c "from PIL import Image; Image.open('$TMP/$1.png').convert('RGB').save('$2', quality=88, subsampling=0, optimize=True)"; echo "$2"; }
gif() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1" --cuadros "$3" >/dev/null
        "$PY" tools/medios/armar_gif.py "$TMP/$1" "$2" --ms "$4" --pausa 2500 --colores "$5" | tail -1; }

png flujo_colecistitis "$D/biliar_flujo_colecistitis.png"
png flujo_colangitis "$D/biliar_flujo_colangitis.png"
png criterios_colecistitis "$C/tokyocolecistitis.png"
png criterios_colangitis "$C/tokyocolangitis.png"
png riesgo_coledocolitiasis "$C/riesgo_coledocolitiasis.png"
jpg drenaje_real "$D/biliar_drenaje_real.jpg"
jpg coledoco_eco_real "$D/biliar_coledoco_eco_real.jpg"
gif murphy_real "$D/biliar_murphy_real.gif" 66 330 256
gif eco_real "$D/biliar_eco_real.gif" 70 330 256
gif cvs_real "$D/biliar_cvs_real.gif" 42 500 112
gif cpre_real "$D/biliar_cpre_real.gif" 60 330 128
gif colangiorm_coledocolitiasis "$D/biliar_colangiorm_recorrido.gif" 72 300 128
node tools/medios/capturar.js "$H/wses_flujo_es.html" "$TMP/wses.png" --ancho 1280 --alto 1137 --escala 1 >/dev/null
"$PY" -c "from PIL import Image; Image.open('$TMP/wses.png').convert('RGB').quantize(colors=128, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).save('$D/biliar_wses_flujo_colecistitis_es.png', optimize=True)"
echo "$D/biliar_wses_flujo_colecistitis_es.png"
# Fotos de Commons: título arriba y crédito abajo, siempre sobre el original.
F=$H/fuentes
python3 tools/medios/franja_credito.py "$F/eco_cerevisae_rotulos_es.jpg" "$D/biliar_eco_colecistitis_real.jpg" \
  "Imagen: Cerevisae, Wikimedia Commons, CC BY-SA 4.0. Rótulos traducidos por Empirica." \
  --titulo "Ecografía: colecistitis aguda" --subtitulo "Pared de 5,8 mm y cálculo con sombra acústica"
python3 tools/medios/franja_credito.py "$F/tc_colecistitis_heilman.jpg" "$D/biliar_tc_colecistitis.jpg" \
  "Imagen: James Heilman, MD, Wikimedia Commons, CC BY-SA 4.0." \
  --titulo "TC: colecistitis aguda" --subtitulo "Vesícula distendida y grasa vecina inflamada"
python3 tools/medios/franja_credito.py "$F/colangiorm_hellerhoff.jpg" "$D/biliar_colangiorm_coledocolitiasis.jpg" \
  "Imagen: Hellerhoff, Wikimedia Commons, CC BY-SA 3.0." \
  --titulo "Colangio-RM: coledocolitiasis" --subtitulo "Cálculos en la vesícula y en el colédoco distal"
