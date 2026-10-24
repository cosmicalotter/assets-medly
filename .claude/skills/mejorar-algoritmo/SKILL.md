---
name: mejorar-algoritmo
description: Lleva un algoritmo de data/Adultos o data/Pediatria a la Norma Empirica v2 desde su guía de práctica clínica — amplía el contenido que falta, conecta calculadoras, añade imágenes y GIF, aclara el lenguaje y llena los nodos de criterios, perlas, alertas y dosis — y lo entrega en un PR para revisión médica. Usar cuando se pida mejorar, actualizar, completar, enriquecer o pasar a la norma nueva un algoritmo.
argument-hint: "<algoritmo> [--guia RUTA_O_URL] [--sin-pausas]"
---

# Mejorar un algoritmo

Una sesión, un algoritmo, una rama, un PR. Lee primero `NORMA.md` (en esta
carpeta): es la definición de terminado.

Argumentos: `$ARGUMENTS`. El algoritmo puede venir como `sepsis`,
`sepsis.json` o `Adultos/sepsis.json`. Con `--sin-pausas` no se espera la
aprobación del plan del paso 2 (se deja escrito en el PR).

## 0. Línea base

```bash
galgo validar -a <algoritmo> --ejemplos 0 > "$SCRATCH/antes_validar.txt"
galgo auditar --listar -a <algoritmo>      > "$SCRATCH/antes_auditar.txt"
python3 tools/norma.py <algoritmo>          > "$SCRATCH/antes_norma.txt"
```

(`$SCRATCH` es el scratchpad de la sesión.) Si `galgo` no existe, el hook de
inicio no pudo instalarlo: dilo y sigue sólo con `tools/norma.py`.

Lee el algoritmo entero antes de tocar nada: todos los nodos, sus ramas y sus
referencias.

## 1. La guía

1. Identifica la guía del algoritmo (`version`, `referencias`).
2. Comprueba si hay una versión más nueva de esa guía o de la sociedad de
   referencia (búsqueda web). Si la hay, **para y pregunta** si se actualiza a
   la nueva: cambia la base de todo lo demás.
3. Consigue el PDF, por este orden: lo que diga `--guia`; la carpeta
   `guias-praxis/<carpeta_evidencia>/` si ese repositorio está en la sesión;
   descargar el PDF oficial al scratchpad. Si no hay forma de leer la guía,
   **no se escribe contenido clínico nuevo**: sólo se hace lo que no lo
   necesita (lenguaje, enlaces, calculadoras que ya existen, estructura) y
   se dice en el PR.
4. Léela con `Read` (parámetro `pages`) por las secciones que tocan al
   algoritmo. Los PDF no se copian nunca dentro de `assets-medly`.

## 2. Mapa de brechas (antes de editar)

Escribe `$SCRATCH/plan_<algoritmo>.md` con:

- la silueta actual y la propuesta (secciones, nodos nuevos, nodos que se
  parten), respetando los ids existentes;
- los huecos de la lista «Lo que no puede faltar» de `NORMA.md`, cada uno
  con la página de la guía donde está el dato;
- por los cinco frentes: contenido nuevo, calculadoras (conectar / crear),
  imágenes y GIF (qué, dónde y de qué origen), textos que se reescriben,
  conexiones (checklist, alertas, perlas, grado, enlaces);
- las faltas que listan `tools/norma.py` y `galgo auditar`.

Enseña un resumen corto y **espera la aprobación** (salvo `--sin-pausas`).

## 3. Editar

Orden de trabajo, nodo a nodo:

1. **Estructura**: secciones, nodos nuevos colgados de los que ya existen,
   `pie_nodo` en cada decisión, rótulos en cada opción.
2. **Contenido**: cada cifra, dosis, umbral o criterio nuevo lleva su
   referencia con cita literal (`texto`, 12-30 palabras) y `paginas`. Si
   `imagen_evidencia` todavía no existe, `TODO_EVIDENCIA: <qué recortar>`.
3. **Lenguaje**: reescribe lo confuso según `NORMA.md` §4. Aquí sí se
   reescribe `texto` (a diferencia de `galgo expandir`): el diff del PR es
   la revisión.
4. **Conexiones**: `checklist`, `alertas`, `nota_adicional`, `evidencia`,
   `farmacos` con `por_kg`, `tabla`, `chips`, `discrepancias` (sin `cronometros` por ahora; sin repetir lo que ya muestra una imagen).
5. **Calculadoras**: las que ya existen en `data/calculadoras` se conectan
   **por URL completa**
   (`https://raw.githubusercontent.com/cosmicalotter/assets-medly/main/data/calculadoras/<archivo>.json`).
   Si falta una que la guía usa, skill `crear-calculadora`.
   `ramificar: true` sólo si los `match_opcion_index` de la escala
   corresponden a las opciones de **ese** nodo; si no, `false`.
6. **Imágenes y GIF**: skill `imagenes-clinicas`.
7. **Enlaces a otros algoritmos**: por URL raw completa
   (`…/main/data/Adultos/<archivo>.json`), con `nodo_objetivo` si se entra
   por un paso concreto. Un `TODO_LINK_` a un algoritmo que ya existe se
   resuelve; a uno que no existe se deja y se anota en el PR.

El hook `PostToolUse` corre `tools/norma.py --hook` tras cada escritura y
devuelve lo que rompe en la app (ramas a la nada, calculadoras sin URL,
imágenes que no están). Arréglalo en el momento.

## 4. Evidencia

```bash
galgo resolver -a <algoritmo> --reclamar --aplicar --salida "$SCRATCH/salida"
galgo resolver -a <algoritmo> --pdf <guía.pdf> --gemini nunca --aplicar --salida "$SCRATCH/salida"
```

El primero conecta recortes que ya están en disco; el segundo ancla las citas
literales en el PDF y recorta, sin modelo. Lo que no ancle se queda como
`TODO_EVIDENCIA` y va a la lista de pendientes del PR.

## 5. Verificar

1. `galgo validar -a <algoritmo> --nivel error`: ningún error de estructura
   o esquema que no estuviera en la línea base.
2. `python3 tools/norma.py <algoritmo>` ≥ 80 y `galgo auditar --listar -a
   <algoritmo>` ≥ 85. Si no llega, la lista «qué le falta» dice por dónde.
3. Lanza **en paralelo** los subagentes `revisor-clinico` y
   `revisor-legibilidad` con la ruta del algoritmo, la del PDF y el plan.
   Corrige lo que encuentren; lo que no se corrija, al PR con el motivo.

## 6. Entregar

- Commits pequeños con sentido (estructura, contenido, medios, calculadoras).
- Push a la rama de la sesión y PR contra `main` con:
  - la tabla **antes / después** de las tres medidas;
  - qué cambió por cada uno de los cinco frentes;
  - **decisiones para el revisor médico**: toda conducta, dosis o umbral
    nuevo o cambiado, con la página de la guía;
  - pendientes (`TODO_*`) y créditos de imágenes de terceros.
- **No se hace merge.** `main` es producción: la app lee de ahí en cuanto
  entra. El merge lo hace el médico que revisa.
