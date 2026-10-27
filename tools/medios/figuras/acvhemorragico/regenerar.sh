#!/usr/bin/env bash
# Rehace todas las imágenes creadas del algoritmo de ACV hemorrágico desde sus fuentes
# HTML y las fotos originales de fuentes/. Uso (desde la raíz del repo):
#   bash tools/medios/figuras/acvhemorragico/regenerar.sh
set -euo pipefail
H=tools/medios/figuras/acvhemorragico
D=data/imagenes/algoritmo/acvhemorragico
PY=${PY:-$HOME/.cache/galgo-venv/bin/python}
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

jpg() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1.png" >/dev/null
        "$PY" -c "from PIL import Image; Image.open('$TMP/$1.png').convert('RGB').save('$2', quality=88, subsampling=0, optimize=True)"; echo "$2"; }
gif() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1" --cuadros "$3" >/dev/null
        "$PY" tools/medios/armar_gif.py "$TMP/$1" "$2" --ms "$4" --pausa 2500 --colores "$5" | tail -1; }

gif abc2_real "$D/acvhemorragico_abc2_real.gif" 60 330 256
gif meta_pa "$D/acvhemorragico_meta_presion.gif" 31 300 128
jpg localizacion_real "$D/acvhemorragico_localizacion_real.jpg"
jpg mav_real "$D/acvhemorragico_mav_real.jpg"
jpg amiloide_real "$D/acvhemorragico_amiloide_real.jpg"
jpg cavernoma_real "$D/acvhemorragico_cavernoma_real.jpg"
jpg expansion_real "$D/acvhemorragico_expansion_real.jpg"
jpg aspiracion_real "$D/acvhemorragico_aspiracion_real.jpg"
jpg talamica_real "$D/acvhemorragico_talamica_real.jpg"
jpg fosa_real "$D/acvhemorragico_fosa_real.jpg"
# Último cuadro del GIF de ABC/2, fijo, para las calculadoras de volumen y escala ICH.
"$PY" -c "from PIL import Image; im=Image.open('$D/acvhemorragico_abc2_real.gif'); im.seek(im.n_frames-1); im.convert('RGB').save('$D/acvhemorragico_abc2_real.jpg', quality=86, optimize=True)"; echo "$D/acvhemorragico_abc2_real.jpg"
