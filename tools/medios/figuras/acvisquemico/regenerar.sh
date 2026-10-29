#!/usr/bin/env bash
# Rehace las imágenes creadas del algoritmo de ACV isquémico desde sus fuentes HTML y las fotos
# originales de fuentes/. Uso (desde la raíz del repo):
#   bash tools/medios/figuras/acvisquemico/regenerar.sh
# Los GIF de ventanas de reperfusión y de trombectomía esquemática (ventanas.html, trombectomia.html)
# son anteriores a este script y no se rehacen aquí.
set -euo pipefail
H=tools/medios/figuras/acvisquemico
D=data/imagenes/algoritmo/acvisquemico
PY=${PY:-$HOME/.cache/galgo-venv/bin/python}
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

png() { node tools/medios/capturar.js "$H/$1.html" "$2" >/dev/null; echo "$2"; }
jpg() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1.png" >/dev/null
        "$PY" -c "from PIL import Image; Image.open('$TMP/$1.png').convert('RGB').save('$2', quality=88, subsampling=0, optimize=True)"; echo "$2"; }
gif() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1" --cuadros "$3" >/dev/null
        "$PY" tools/medios/armar_gif.py "$TMP/$1" "$2" --ms "$4" --pausa 2500 --colores "$5" | tail -1; }

# Imágenes reales rotuladas
jpg tc_angiotc_real "$D/acvisquemico_tc_angiotc_real.jpg"
jpg establecido_real "$D/acvisquemico_infarto_establecido_real.jpg"
gif aspects_real "$D/acvisquemico_aspects_real.gif" 56 330 256
jpg pc_aspects_real "$D/acvisquemico_pc_aspects_real.jpg"
jpg lvo_real "$D/acvisquemico_lvo_angiotc_real.jpg"
jpg perfusion_real "$D/acvisquemico_perfusion_dwi_flair_real.jpg"
jpg trombectomia_real "$D/acvisquemico_trombectomia_real.jpg"
jpg angioedema_real "$D/acvisquemico_angioedema_real.jpg"
jpg edema_maligno_real "$D/acvisquemico_edema_maligno_real.jpg"
# Esquemas propios
png incapacitante "$D/acvisquemico_deficit_incapacitante.png"
png tnk "$D/acvisquemico_tenecteplasa_peso.png"
png metas_pa "$D/acvisquemico_metas_pa.png"
png relativas "$D/acvisquemico_contraindicaciones_relativas.png"
