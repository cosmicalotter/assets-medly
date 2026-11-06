#!/usr/bin/env bash
# Rehace las imágenes del algoritmo de síndrome nefrótico y nefrítico en niños desde sus HTML
# y las fotos originales de fuentes/. Uso (desde la raíz del repo):
#   bash tools/medios/figuras/sindrome_nefrotico/regenerar.sh
set -euo pipefail
H=tools/medios/figuras/sindrome_nefrotico
D=data/imagenes/algoritmo/sindrome_nefrotico
PY=${PY:-$HOME/.cache/galgo-venv/bin/python}
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$D"

png() { node tools/medios/capturar.js "$H/$1.html" "$2" >/dev/null; echo "$2"; }
gif() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1" --cuadros "$3" >/dev/null
        "$PY" tools/medios/armar_gif.py "$TMP/$1" "$2" --ms "$4" --pausa "$5" --colores "$6" | tail -1; }

# Esquemas propios
png albumina "$D/nefro_albumina_furosemida.png"
gif prednisolona "$D/nefro_prednisolona_semanas.gif" 26 380 3500 128
# Fotos de Commons con título y crédito (la tira se recorta antes en fuentes/)
python3 tools/medios/franja_credito.py "$H/fuentes/commons_Purpura_Schonlein_Henoch.JPG" "$D/nefro_purpura_iga.jpg" \
  "Imagen: Mnokel, Wikimedia Commons, dominio público. Editada por Empirica." \
  --titulo "Púrpura de la vasculitis IgA" --subtitulo "Petequias y púrpura en las piernas y los tobillos de un niño"
python3 "$H/marcar_tira.py"
python3 tools/medios/franja_credito.py "$H/fuentes/commons_Comp.Urine.Test.Strip_marcado.jpg" "$D/nefro_tira_reactiva.jpg" \
  "Imagen: J3D3, Wikimedia Commons, CC BY-SA 3.0. Recortada y señalada por Empirica." \
  --titulo "Tira reactiva de orina" --subtitulo "Recuadros: la casilla de proteína, positiva a la izquierda y negativa a la derecha"
png nefritico "$D/nefro_tres_nefriticos.png"
