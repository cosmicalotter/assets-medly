#!/usr/bin/env bash
# Rehace las imágenes del algoritmo de VIH desde sus HTML y las fotos originales de fuentes/.
# Uso (desde la raíz del repo):
#   bash tools/medios/figuras/vih/regenerar.sh
set -euo pipefail
H=tools/medios/figuras/vih
D=data/imagenes/algoritmo/vih
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
jpg foto_tridot "$D/vih_prueba_rapida_real.jpg"
jpg foto_wb "$D/vih_western_blot_real.jpg"
jpg foto_cripto "$D/vih_criptococo_real.jpg"
jpg foto_kaposi "$D/vih_kaposi_real.jpg"
jpg foto_candida "$D/vih_candidiasis_real.jpg"
jpg foto_prep "$D/vih_prep_tableta_real.jpg"
jpg foto_condones "$D/vih_condones_real.jpg"
jpg foto_dexa "$D/vih_densitometria_real.jpg"
# GIF sobre la micrografía real
gif gemacion "$D/vih_gemacion.gif" 18 160 3000 64
# Esquemas propios
png riesgo "$D/vih_riesgo_exposicion.png"
png escenarios "$D/vih_escenarios_diagnostico.png"
png parto "$D/vih_via_parto.png"
png rn "$D/vih_posparto.png"
png cd4 "$D/vih_profilaxis_cd4.png"
png esquemas "$D/vih_esquemas_inicio.png"
png tb_tar "$D/vih_tb_tar.png"
png toxicidad "$D/vih_toxicidad.png"
png estatinas "$D/vih_estatinas.png"
png prep_211 "$D/vih_prep_211.png"
png prep_controles "$D/vih_prep_controles.png"
png paquete "$D/vih_paquete_avanzada.png"
png examenes "$D/vih_examenes.png"
# GIF de flujo y animaciones de fisiología
gif pep_linea "$D/vih_pep_linea.gif" 48 200 3200 128
gif cv_linea "$D/vih_carga_viral.gif" 48 200 3200 128
gif ciclo "$D/vih_ciclo.gif" 60 160 2600 128
gif historia "$D/vih_historia_natural.gif" 60 110 3200 128
