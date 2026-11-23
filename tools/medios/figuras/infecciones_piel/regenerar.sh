#!/usr/bin/env bash
# Rehace las imágenes del algoritmo de infecciones de piel y tejidos blandos desde sus HTML y las fotos de fuentes/.
# Uso (desde la raíz del repo):
#   bash tools/medios/figuras/infecciones_piel/regenerar.sh
set -euo pipefail
H=tools/medios/figuras/infecciones_piel
D=data/imagenes/algoritmo/infecciones_piel
PY=${PY:-$HOME/.cache/galgo-venv/bin/python}
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$D"

jpg() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1.png" >/dev/null
        "$PY" -c "from PIL import Image; Image.open('$TMP/$1.png').convert('RGB').save('$2', quality=${3:-86}, subsampling=0, optimize=True)"; echo "$2"; }
png() { node tools/medios/capturar.js "$H/$1.html" "$2" >/dev/null; echo "$2"; }
gif() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1" --cuadros "$3" >/dev/null
        "$PY" tools/medios/armar_gif.py "$TMP/$1" "$2" --ms "$4" --pausa "$5" --colores "$6" | tail -1; }

# Fotos e imágenes diagnósticas reales (Commons), recortadas y rotuladas en español
for par in impetigo_costras:impetigo_costras impetigo_ampolloso:impetigo_ampolloso impetigo_extenso:impetigo_extenso \
           impetigo_pie:impetigo_pie forunculo:forunculo carbunco:carbunco absceso:absceso absceso_drenar:absceso_drenar \
           eco_absceso:eco_absceso celulitis_pie:celulitis erisipela:erisipela celulitis_marca:celulitis_marca \
           celulitis_edema:celulitis_edema tina:tina_interdigital estasis:dermatitis_estasis fascitis_temprana:fascitis_temprana \
           fascitis_avanzada:fascitis_avanzada desbridamiento:desbridamiento gas_rx:gas_rx vibrio:vibrio fournier:fournier \
           pie_diabetico:pie_diabetico gangrena_pie:gangrena_pie mordedura_mano:mordedura_mano linfangitis:linfangitis \
           pilonidal:absceso_pilonidal hidradenitis:hidradenitis erisipela_recurrente:erisipela_recurrente piomiositis_rm:piomiositis_rm; do
  jpg "foto_${par%%:*}" "$D/ipt_${par##*:}_real.jpg" 80
done
# Esquemas de decisión
png gravedad_celulitis "$D/ipt_gravedad_celulitis.png"
png absceso_antibiotico "$D/ipt_absceso_antibiotico.png"
png iwgdf_grados "$D/ipt_iwgdf_grados.png"
png mordedura_antibiotico "$D/ipt_mordedura_antibiotico.png"
# GIF sobre la foto real, GIF de flujo y animaciones de fisiología
gif borde_marcado "$D/ipt_borde_marcado.gif" 60 120 3000 255
gif flujo_necrosante "$D/ipt_necrosante_horas.gif" 60 130 3200 64
gif capas "$D/ipt_capas.gif" 70 110 2600 96
gif necrosis "$D/ipt_necrosis_fascia.gif" 60 120 3000 96
