#!/usr/bin/env bash
# Rehace las imágenes del algoritmo de hemorragias de la primera mitad del embarazo desde sus HTML.
# Uso (desde la raíz del repo): bash tools/medios/figuras/hemorragia_primera_mitad/regenerar.sh
# Las imágenes «limpia_*» y «rot_*» de fuentes/ salen de las originales:
#   borrar_rotulos.py (rótulos en inglés y líneas guía) y un giro de 180° (prueba de orina); ver cada HTML.
set -euo pipefail
H=tools/medios/figuras/hemorragia_primera_mitad
D=data/imagenes/algoritmo/hemorragia_primera_mitad
PY=${PY:-$HOME/.cache/galgo-venv/bin/python}
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$D"

jpg() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1.png" --escala 2 >/dev/null
        "$PY" -c "from PIL import Image; Image.open('$TMP/$1.png').convert('RGB').save('$2', quality=${3:-88}, subsampling=0, optimize=True)"; echo "$2"; }
png() { node tools/medios/capturar.js "$H/$1.html" "$2" --escala 2 >/dev/null; echo "$2"; }
gif() { node tools/medios/capturar.js "$H/$1.html" "$TMP/$1" --cuadros "$3" >/dev/null
        "$PY" tools/medios/armar_gif.py "$TMP/$1" "$2" --ms "$4" --pausa "$5" --colores "$6" --tonos "#FDE047,#86EFAC,#FCA5A5,#93C5FD" | tail -1; }

# Gráficas propias de datos (PNG)
png hcg_48h "$D/hpm_hcg_48h.png"
png mtx_hcg "$D/hpm_mtx_hcg.png"
png mola_seguimiento "$D/hpm_mola_seguimiento.png"
# Recorridos animados sobre ecografías reales (GIF)
gif blob_recorrido "$D/hpm_eco_blob.gif" 66 330 2600 256
gif saco_recorrido "$D/hpm_eco_saco.gif" 66 330 2600 256
# Fotos e imágenes diagnósticas reales con licencia libre (fuentes/), recortadas y rotuladas
jpg foto_especulo "$D/hpm_especulo_real.jpg"
jpg foto_eco_intrauterino "$D/hpm_eco_intrauterino_real.jpg"
jpg foto_eco_mola "$D/hpm_eco_mola_real.jpg"
jpg foto_eco_lcc "$D/hpm_eco_lcc_real.jpg"
jpg foto_prueba_orina "$D/hpm_prueba_orina_real.jpg"
jpg foto_progesterona "$D/hpm_progesterona_real.jpg"
jpg foto_ameu "$D/hpm_ameu_real.jpg"
jpg foto_eco_masa "$D/hpm_eco_masa_real.jpg"
jpg foto_eco_morison "$D/hpm_eco_morison_real.jpg"
jpg foto_laparoscopia "$D/hpm_laparoscopia_real.jpg"
jpg foto_mola_histologia "$D/hpm_mola_histologia_real.jpg" 76
jpg foto_anti_d "$D/hpm_anti_d_real.jpg"
jpg foto_diu "$D/hpm_diu_real.jpg"
jpg foto_tc_metastasis "$D/hpm_tc_metastasis_real.jpg"
jpg foto_heterotopico "$D/hpm_heterotopico_real.jpg"
jpg foto_no_tubarico "$D/hpm_no_tubarico_real.jpg"
