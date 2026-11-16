#!/usr/bin/env bash
# Rehace las imágenes del algoritmo de neuroinfección en niños desde sus HTML y las fotos de fuentes/.
# Uso (desde la raíz del repo):
#   bash tools/medios/figuras/neuroinfeccion/regenerar.sh
set -euo pipefail
H=tools/medios/figuras/neuroinfeccion
D=data/imagenes/algoritmo/neuroinfeccion_pediatrica
PY=${PY:-$HOME/.cache/galgo-venv/bin/python}
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$D"

jpg() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1.png" >/dev/null
        "$PY" -c "from PIL import Image; Image.open('$TMP/$1.png').convert('RGB').save('$2', quality=${3:-86}, subsampling=0, optimize=True)"; echo "$2"; }
gif() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1" --cuadros "$3" >/dev/null
        "$PY" tools/medios/armar_gif.py "$TMP/$1" "$2" --ms "$4" --pausa "$5" --colores "$6" | tail -1; }
franja() { python3 tools/medios/franja_credito.py "$H/fuentes/$1" "$D/$2" "$3" --titulo "$4" --subtitulo "$5"; }

# Fotos e imágenes diagnósticas reales (Commons), rotuladas en español
jpg foto_purpura "$D/neuro_petequias_purpura.jpg"
jpg foto_meningococcemia "$D/neuro_purpura_meningococcemia.jpg"
jpg foto_lcr "$D/neuro_lcr_claro_turbio.jpg"
jpg foto_vhs_rm "$D/neuro_rm_herpetica.jpg" 84
jpg foto_emad "$D/neuro_rm_emad.jpg" 84
jpg foto_empiema "$D/neuro_rm_empiema.jpg" 84
jpg foto_hidrocefalia "$D/neuro_tc_hidrocefalia.jpg" 84
jpg foto_tb_tc "$D/neuro_tc_tuberculosa.jpg" 84
# Fotos de escena con título y crédito (los recortes rec_*.jpg salen de los originales de Commons)
franja commons_Child_being_prepared_for_lumbar_puncture.jpg neuro_puncion_preparar.jpg "Foto: Mike Blyth, Wikimedia Commons, CC BY 3.0. Editada por Empirica." "Preparar al niño para la punción" "De lado, sostenido y tranquilo antes de puncionar"
franja commons_Puncion_lumbar.jpg neuro_puncion_tecnica.jpg "Foto: Dragondefuego1976, Wikimedia Commons, CC BY-SA 4.0. Editada por Empirica." "Punción lumbar" "Campo estéril y aguja en la línea media de la espalda"
franja rec_tc_lactante.jpg neuro_tc_lactante.jpg "Foto: S r pandeya, Wikimedia Commons, CC BY-SA 3.0. Recortada por Empirica." "La TC, con el niño estable" "Lactante en el tomógrafo"
franja commons_Child_with_chickenpox.jpg neuro_varicela.jpg "Foto: Mad Max, Wikimedia Commons, CC BY-SA 3.0. Editada por Empirica." "Varicela" "Lesiones en distintas fases en el tronco de un niño"
franja commons_Hand_foot_and_mouth_disease_on_a_child.jpg neuro_enterovirus_boca.jpg "Foto: 1006will, Wikimedia Commons, CC BY-SA 4.0. Editada por Empirica." "Enterovirus: lesiones en la boca" "Vesículas en el paladar de un niño con enfermedad de mano, pie y boca"
franja rec_audiometria.jpg neuro_audiometria.jpg "Foto: Barbara Tonetinha, Wikimedia Commons, CC BY-SA 4.0. Recortada por Empirica." "Audiometría del niño" "Cabina y audiómetro de la evaluación auditiva infantil"
franja rec_implante.jpg neuro_implante_coclear.jpg "Foto: Matt Ralph, Wikimedia Commons, CC BY 2.0. Recortada por Empirica." "Implante coclear" "El procesador externo, detrás de la oreja de una niña"
# GIF sobre fotos reales, de flujo y animaciones de fisiología
gif gram "$D/neuro_gram.gif" 32 380 2600 256
gif primera_hora "$D/neuro_primeras_horas.gif" 40 200 3000 128
gif hernia "$D/neuro_hernia_puncion.gif" 48 180 3000 128
gif vhs_dias "$D/neuro_vhs_dias.gif" 48 200 3000 128
