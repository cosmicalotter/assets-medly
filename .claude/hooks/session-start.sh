#!/bin/bash
# Deja `galgo` listo en las sesiones de Claude Code en la nube.
#
# galgo vive en su propio repositorio (cosmicalotter/galgo-empirica) y la
# fuente de verdad del contrato en praxis/docs. Los dos tienen que estar
# añadidos al entorno junto a assets-medly; si falta alguno, la sesión
# arranca igual y lo dice.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

ASSETS="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
PADRE="$(dirname "$ASSETS")"
VENV="$HOME/.cache/galgo-venv"

# La versión nueva primero; la copia vieja de praxis sólo si no hay otra.
GALGO=""
for candidato in "$PADRE/galgo-empirica" "$HOME/galgo-empirica" "$PADRE/praxis/tools/generador_algoritmos"; do
  if [ -f "$candidato/pyproject.toml" ]; then
    GALGO="$candidato"
    break
  fi
done

if [ -z "$GALGO" ]; then
  echo "galgo no está en la sesión: añade cosmicalotter/galgo-empirica al entorno para poder validar." >&2
  exit 0
fi

if [ ! -x "$VENV/bin/python" ]; then
  python3 -m venv "$VENV"
fi
"$VENV/bin/pip" install --quiet --disable-pip-version-check -e "$GALGO"

if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
  {
    echo "export PATH=\"$VENV/bin:\$PATH\""
    echo "export GALGO_ASSETS=\"$ASSETS\""
    if [ -f "$PADRE/praxis/docs/algoritmo.schema.json" ]; then
      echo "export GALGO_ESQUEMA=\"$PADRE/praxis/docs/algoritmo.schema.json\""
    fi
  } >> "$CLAUDE_ENV_FILE"
fi

echo "galgo $("$VENV/bin/galgo" --version | awk '{print $2}') listo desde $GALGO"
