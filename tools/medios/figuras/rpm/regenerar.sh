#!/usr/bin/env bash
# Rehace las imágenes del algoritmo de RPM desde sus HTML. Uso (desde la raíz del repo):
#   bash tools/medios/figuras/rpm/regenerar.sh
set -euo pipefail
H=tools/medios/figuras/rpm
D=data/imagenes/algoritmo/rpm
PY=${PY:-$HOME/.cache/galgo-venv/bin/python}
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$D"

jpg() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1.png" --escala 2 >/dev/null
        "$PY" -c "from PIL import Image; Image.open('$TMP/$1.png').convert('RGB').save('$2', quality=${3:-88}, subsampling=0, optimize=True)"; echo "$2"; }
png() { node tools/medios/capturar.js "$H/$1.html" "$2" --escala 2 >/dev/null; echo "$2"; }
gif() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1" --cuadros "$3" >/dev/null
        "$PY" tools/medios/armar_gif.py "$TMP/$1" "$2" --ms "$4" --pausa "$5" --colores "$6" | tail -1; }

# Esquemas propios (PNG)
png semanas "$D/rpm_semanas.png"
png rescate "$D/rpm_rescate.png"
# Fotos reales con licencia libre (fuentes/), recortadas y rotuladas
jpg foto_especulo "$D/rpm_especulo_real.jpg"
jpg foto_fiebre "$D/rpm_fiebre_real.jpg"
jpg foto_amniocentesis "$D/rpm_amniocentesis_real.jpg"
jpg foto_termometro "$D/rpm_termometro_real.jpg"
jpg foto_corticoide "$D/rpm_corticoide_real.jpg"
jpg foto_ctg_monitor "$D/rpm_ctg_monitor_real.jpg"
jpg foto_ctg_trazo "$D/rpm_ctg_real.jpg"
jpg foto_gentamicina "$D/rpm_gentamicina_real.jpg"
jpg foto_egb "$D/rpm_egb_real.jpg" 82
jpg foto_penicilina "$D/rpm_penicilina_real.jpg"
jpg foto_magnesio "$D/rpm_magnesio_real.jpg"
# Recorrido animado sobre la foto real de la cristalización
gif helecho_recorrido "$D/rpm_helecho.gif" 64 330 2600 256
