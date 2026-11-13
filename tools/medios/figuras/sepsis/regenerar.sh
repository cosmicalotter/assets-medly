#!/usr/bin/env bash
# Rehace las imágenes del algoritmo de sepsis desde sus HTML y las fotos originales de fuentes/.
# Uso (desde la raíz del repo):
#   bash tools/medios/figuras/sepsis/regenerar.sh
set -euo pipefail
H=tools/medios/figuras/sepsis
D=data/imagenes/algoritmo/sepsis
PY=${PY:-$HOME/.cache/galgo-venv/bin/python}
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$D"

jpg() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1.png" >/dev/null
        "$PY" -c "from PIL import Image; Image.open('$TMP/$1.png').convert('RGB').save('$2', quality=${3:-88}, subsampling=0, optimize=True)"; echo "$2"; }
png() { node tools/medios/capturar.js "$H/$1.html" "$2" >/dev/null; echo "$2"; }
gif() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1" --cuadros "$3" >/dev/null
        "$PY" tools/medios/armar_gif.py "$TMP/$1" "$2" --ms "$4" --pausa "$5" --colores "$6" | tail -1; }

# Fotos e imágenes diagnósticas reales (Commons y PMC), rotuladas en español
jpg foto_llenado "$D/sepsis_llenado_capilar_real.jpg"
jpg foto_hemocultivos "$D/sepsis_hemocultivos_real.jpg"
jpg foto_ringer "$D/sepsis_lactato_ringer_real.jpg"
jpg foto_isquemia "$D/sepsis_isquemia_digital_real.jpg" 84
jpg foto_eco "$D/sepsis_ecocardiograma_real.jpg" 84
jpg foto_focos "$D/sepsis_focos_real.jpg" 84
jpg foto_absceso "$D/sepsis_absceso_drenaje_real.jpg" 84
jpg foto_fascitis "$D/sepsis_fascitis_real.jpg" 84
jpg foto_gram "$D/sepsis_gram_real.jpg" 84
jpg foto_antibiograma "$D/sepsis_antibiograma_real.jpg" 84
jpg foto_oximetro "$D/sepsis_oximetro_real.jpg"
jpg foto_alto_flujo "$D/sepsis_alto_flujo_real.jpg"
jpg foto_sdra "$D/sepsis_sdra_rx_real.jpg" 84
jpg foto_ecmo "$D/sepsis_ecmo_real.jpg" 84
jpg foto_trr "$D/sepsis_trr_real.jpg" 84
# GIF sobre la foto real del llenado capilar
gif llenado_gif "$D/sepsis_llenado_capilar.gif" 40 160 2600 160
# Esquemas propios
png tiempo_antibiotico "$D/sepsis_tiempo_antibiotico.png"
png infeccion_choque "$D/sepsis_infeccion_choque.png"
png spo2_metas "$D/sepsis_spo2_metas.png"
png postsepsis "$D/sepsis_postsepsis.png"
# GIF de flujo y animaciones de fisiología
gif primeras_horas "$D/sepsis_primeras_horas.gif" 40 200 3000 128
gif escalera "$D/sepsis_escalera_vasopresores.gif" 30 200 3000 128
gif autorregulacion "$D/sepsis_autorregulacion.gif" 48 130 2400 128
gif frank_starling "$D/sepsis_frank_starling.gif" 48 130 2600 128
gif infusion_pk "$D/sepsis_infusion_prolongada.gif" 48 120 3000 128
gif lactato "$D/sepsis_lactato.gif" 4 1400 3000 128
