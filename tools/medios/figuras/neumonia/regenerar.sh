#!/usr/bin/env bash
# Rehace las imágenes del algoritmo de neumonía adquirida en la comunidad desde sus HTML.
# Uso (desde la raíz del repo): bash tools/medios/figuras/neumonia/regenerar.sh
# Las fotos «limpia_*» de fuentes/ salen de las originales con tools/medios/borrar_rotulos.py
# (ver la cabecera de cada HTML).
set -euo pipefail
H=tools/medios/figuras/neumonia
D=data/imagenes/algoritmo/neumonia
PY=${PY:-$HOME/.cache/galgo-venv/bin/python}
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$D"

jpg() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1.png" >/dev/null
        "$PY" -c "from PIL import Image; Image.open('$TMP/$1.png').convert('RGB').save('$2', quality=${3:-82}, subsampling=0, optimize=True)"; echo "$2"; }
png() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1.png" >/dev/null
        "$PY" -c "from PIL import Image; Image.open('$TMP/$1.png').convert('P', palette=Image.ADAPTIVE, colors=256).save('$2', optimize=True)"; echo "$2"; }
gif() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1" --cuadros "$3" >/dev/null
        "$PY" tools/medios/armar_gif.py "$TMP/$1" "$2" --ms "$4" --pausa "$5" --colores "$6" | tail -1; }

# Gráficos propios de datos (PNG)
png curb65_mortalidad "$D/neumonia_curb65.png"
png linea_tratamiento "$D/neumonia_linea_tratamiento.png"
png recuperacion "$D/neumonia_recuperacion.png"
# Recorridos animados sobre imágenes reales (GIF)
gif rx_lobar_recorrido "$D/neumonia_rx_recorrido.gif" 72 330 2600 256
gif empiema_recorrido "$D/neumonia_empiema.gif" 60 330 2600 256
# Fotos e imágenes diagnósticas reales con licencia libre (fuentes/), recortadas y rotuladas
jpg foto_tc_vidrio "$D/neumonia_tc_vidrio_real.jpg"
jpg foto_icc "$D/neumonia_icc_real.jpg"
jpg foto_oximetro "$D/neumonia_oximetro_real.jpg"
jpg foto_gram "$D/neumonia_gram_real.jpg"
jpg foto_samr "$D/neumonia_samr_real.jpg"
jpg foto_covid "$D/neumonia_covid_real.jpg"
jpg foto_absceso "$D/neumonia_absceso_real.jpg"
