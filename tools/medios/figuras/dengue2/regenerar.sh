#!/usr/bin/env bash
# Rehace las imágenes del algoritmo de dengue desde sus HTML y las fotos originales de fuentes/.
# Uso (desde la raíz del repo):
#   bash tools/medios/figuras/dengue2/regenerar.sh
set -euo pipefail
H=tools/medios/figuras/dengue2
D=data/imagenes/algoritmo/dengue2
PY=${PY:-$HOME/.cache/galgo-venv/bin/python}
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$D"

jpg() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1.png" >/dev/null
        "$PY" -c "from PIL import Image; Image.open('$TMP/$1.png').convert('RGB').save('$2', quality=88, subsampling=0, optimize=True)"; echo "$2"; }
png() { node tools/medios/capturar.js "$H/$1.html" "$2" >/dev/null; echo "$2"; }
gif() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1" --cuadros "$3" >/dev/null
        "$PY" tools/medios/armar_gif.py "$TMP/$1" "$2" --ms "$4" --pausa "$5" --colores "$6" | tail -1; }

# Fotos de Commons rotuladas (CDC, dominio público; Ranjan Premaratna, CC BY-SA 4.0)
jpg torniquete "$D/dengue_torniquete_real.jpg"
jpg exantema_temprano "$D/dengue_exantema_temprano_real.jpg"
jpg exantema_recuperacion "$D/dengue_exantema_recuperacion_real.jpg"
# Animación propia: la escalera de líquidos con signos de alarma, paso a paso
gif liquidos_b2 "$D/dengue_liquidos_b2.gif" 5 2600 4000 128
# Esquemas propios (PNG)
png curso "$D/dengue_curso.png"
png grupos "$D/dengue_grupos.png"
png presion "$D/dengue_presion_pulso.png"
png liquidos_choque "$D/dengue_liquidos_choque.png"
