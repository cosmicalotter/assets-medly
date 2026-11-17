#!/usr/bin/env bash
# Rehace las imágenes del algoritmo de trauma desde sus HTML y las fotos de fuentes/.
# Uso (desde la raíz del repo):
#   bash tools/medios/figuras/trauma_inicial/regenerar.sh
set -euo pipefail
H=tools/medios/figuras/trauma_inicial
D=data/imagenes/algoritmo/trauma_inicial
PY=${PY:-$HOME/.cache/galgo-venv/bin/python}
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$D"

jpg() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1.png" >/dev/null
        "$PY" -c "from PIL import Image; Image.open('$TMP/$1.png').convert('RGB').save('$2', quality=${3:-86}, subsampling=0, optimize=True)"; echo "$2"; }
png() { node tools/medios/capturar.js "$H/$1.html" "$2" >/dev/null; echo "$2"; }
gif() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1" --cuadros "$3" >/dev/null
        "$PY" tools/medios/armar_gif.py "$TMP/$1" "$2" --ms "$4" --pausa "$5" --colores "$6" | tail -1; }

# Fotos e imágenes diagnósticas reales (Commons), rotuladas en español
jpg foto_sala "$D/tra_sala_trauma_real.jpg"
jpg foto_torniquete "$D/tra_torniquete_real.jpg"
jpg foto_canulas "$D/tra_canulas_real.jpg"
jpg foto_lma "$D/tra_mascara_laringea_real.jpg"
jpg foto_crico "$D/tra_cricotiroidotomia_material_real.jpg"
jpg foto_b "$D/tra_tension_hemotorax_real.jpg"
jpg foto_sello "$D/tra_aposito_valvula_real.jpg"
jpg foto_drenaje "$D/tra_drenaje_toracico_real.jpg"
jpg foto_pericardio "$D/tra_liquido_pericardico_real.jpg"
jpg foto_fajero "$D/tra_fajero_improvisado_real.jpg"
jpg foto_tubo "$D/tra_tubo_torax_real.jpg"
jpg foto_contusion "$D/tra_contusion_pulmonar_real.jpg"
jpg foto_aorta "$D/tra_mediastino_ancho_real.jpg"
jpg foto_diafragma "$D/tra_ruptura_diafragma_real.jpg"
jpg foto_bazo "$D/tra_ruptura_bazo_real.jpg"
jpg foto_collar "$D/tra_collar_cervical_real.jpg"
jpg foto_thomas "$D/tra_ferula_traccion_real.jpg"
# GIF sobre la imagen real
gif fast "$D/tra_fast_morison.gif" 32 110 2600 128
# GIF de flujo y de fisiología
gif xabcde "$D/tra_xabcde.gif" 40 130 3200 48
gif tension "$D/tra_neumotorax_tension.gif" 40 120 1800 64
gif taponamiento "$D/tra_taponamiento.gif" 40 120 1800 64
# Esquemas y gráficos propios
png txa "$D/tra_acido_tranexamico.png"
png metas "$D/tra_metas_presion.png"
png respuesta "$D/tra_respuesta_reanimacion.png"
png fuentes_sangrado "$D/tra_fuentes_sangrado.png"
png paro "$D/tra_paro_traumatico.png"
png adjuntos "$D/tra_adjuntos_primaria.png"
png penetrante "$D/tra_herida_penetrante.png"
png via_aerea "$D/tra_plan_via_aerea.png"
