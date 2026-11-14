#!/usr/bin/env bash
# Rehace las imágenes del algoritmo de tuberculosis desde sus HTML y las fotos originales de fuentes/.
# Uso (desde la raíz del repo):
#   bash tools/medios/figuras/tuberculosis/regenerar.sh
set -euo pipefail
H=tools/medios/figuras/tuberculosis
D=data/imagenes/algoritmo/tuberculosis
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
jpg foto_bacilos "$D/tb_baciloscopia_real.jpg"
jpg foto_rx_tb "$D/tb_rx_cavitaria_real.jpg" 84
jpg foto_cultivo "$D/tb_cultivo_real.jpg"
jpg foto_miliar "$D/tb_miliar_rx_real.jpg" 84
jpg foto_tac "$D/tb_tac_real.jpg" 84
jpg foto_adenitis "$D/tb_adenitis_real.jpg" 84
jpg foto_exantema "$D/tb_exantema_real.jpg"
jpg foto_ictericia "$D/tb_ictericia_real.jpg"
jpg foto_qt "$D/tb_qt_largo_real.jpg" 84
jpg foto_rx_compara "$D/tb_rx_latente_real.jpg" 84
# GIF sobre la foto real de la PPD
gif ppd_gif "$D/tb_ppd.gif" 9 1000 2600 128
# Esquemas propios
png duraciones "$D/tb_duraciones.png"
png tar "$D/tb_tar_vih.png"
png corto_largo "$D/tb_mdr_corto_largo.png"
png grupos "$D/tb_mdr_grupos.png"
png contactos "$D/tb_contactos.png"
png menor5 "$D/tb_contacto_menor5.png"
png latente "$D/tb_latente_esquemas.png"
png controles "$D/tb_controles.png"
png egreso "$D/tb_egreso.png"
png hepato "$D/tb_hepatotoxicidad.png"
png molecular "$D/tb_molecular.png"
png muestras_nino "$D/tb_muestras_nino.png"
png tabletas_nino "$D/tb_tabletas_nino.png"
# GIF de flujo y animaciones
gif fases "$D/tb_fases.gif" 40 200 3000 128
gif reintro "$D/tb_reintroduccion.gif" 30 230 3000 96
gif granuloma "$D/tb_granuloma.gif" 64 130 2600 128
