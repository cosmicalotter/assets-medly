#!/usr/bin/env bash
# Rehace las imágenes del algoritmo de falla de medro desde sus HTML y las fotos de fuentes/.
# Uso (desde la raíz del repo):
#   bash tools/medios/figuras/falla_medro/regenerar.sh
set -euo pipefail
H=tools/medios/figuras/falla_medro
D=data/imagenes/algoritmo/falla_medro
PY=${PY:-$HOME/.cache/galgo-venv/bin/python}
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$D"

jpg() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1.png" >/dev/null
        "$PY" -c "from PIL import Image; Image.open('$TMP/$1.png').convert('RGB').save('$2', quality=${3:-86}, subsampling=0, optimize=True)"; echo "$2"; }
gif() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1" --cuadros "$3" >/dev/null
        "$PY" tools/medios/armar_gif.py "$TMP/$1" "$2" --ms "$4" --pausa "$5" --colores "$6" | tail -1; }
franja() { python3 tools/medios/franja_credito.py "$H/fuentes/$1" "$D/$2" "$3" --titulo "$4" --subtitulo "$5"; }

# Fotos reales (Commons), rotuladas en español
jpg foto_talla "$D/medro_talla.jpg"
jpg foto_sns "$D/medro_suplemento_al_pecho.jpg"
jpg foto_sonda "$D/medro_sonda.jpg"
# Fotos de escena con título y crédito
franja commons_Newborn_breastfeeding_in_the_NICU.jpg medro_observar_toma.jpg "Foto: Czechpeas, Wikimedia Commons, CC BY-SA 4.0. Editada por Empirica." "Observar una toma" "Recién nacido al pecho durante una toma"
franja commons_Baby_milk_bottle_Moscow.jpg medro_tetero.jpg "Foto: Vyacheslav Argenberg, Wikimedia Commons, CC BY 4.0. Editada por Empirica." "La toma con tetero" "Ver cómo succiona y cómo se le ofrece"
"$PY" -c "from PIL import Image; Image.open('$H/fuentes/commons_Child-Messy-8207.jpg').crop((0, 300, 1400, 1350)).save('$TMP/comer_solo.jpg', quality=92)"
python3 tools/medios/franja_credito.py "$TMP/comer_solo.jpg" "$D/medro_comer_solo.jpg" "Foto: Loadmaster (David R. Tribble), Wikimedia Commons, CC BY-SA 3.0. Recortada por Empirica." --titulo "Comer solo y ensuciarse" --subtitulo "Es parte de aprender a comer"
# Esquemas de decisión
jpg clasificacion "$D/medro_clasificacion.jpg"
jpg factores "$D/medro_factores.jpg"
jpg remision "$D/medro_remision.jpg"
# GIF sobre una foto real, de flujo, y animaciones de curvas
gif foto_pesar "$D/medro_pesar_graficar.gif" 40 200 3000 128
gif frecuencia "$D/medro_frecuencia_peso.gif" 40 200 3000 96
gif perdida_neonatal "$D/medro_perdida_neonatal.gif" 40 160 2600 64
gif velocidad "$D/medro_velocidad.gif" 40 170 2600 64
gif centiles "$D/medro_cruza_centiles.gif" 40 170 2600 64
