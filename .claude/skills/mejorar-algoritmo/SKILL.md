---
name: mejorar-algoritmo
description: Lleva un algoritmo de data/Adultos o data/Pediatria a la Norma Empirica v2 desde su guía de práctica clínica — amplía el contenido que falta, conecta calculadoras, añade imágenes y GIF, aclara el lenguaje y llena los nodos de criterios, perlas, alertas y dosis — y lo entrega en un PR para revisión médica. Usar cuando se pida mejorar, actualizar, completar, enriquecer o pasar a la norma nueva un algoritmo.
argument-hint: "<algoritmo> [--guia RUTA_O_URL] [--sin-pausas]"
---

# Mejorar un algoritmo

Una sesión, un algoritmo, una rama, un PR. Lee primero `NORMA.md` (en esta
carpeta): es la definición de terminado. El resultado tiene que parecerse a
`data/Adultos/crisishiperglicemica.json`, el modelo: ábrelo (o su mapa en
`NORMA.md` §1) antes de diseñar.

Argumentos: `$ARGUMENTS`. El algoritmo puede venir como `sepsis`,
`sepsis.json` o `Adultos/sepsis.json`. Con `--sin-pausas` no se espera la
aprobación del plan del paso 2 (se deja escrito en el PR).

## 0. Línea base

```bash
galgo validar -a <algoritmo> --ejemplos 0 > "$SCRATCH/antes_validar.txt"
galgo auditar --listar -a <algoritmo>      > "$SCRATCH/antes_auditar.txt"
python3 tools/norma.py <algoritmo>          > "$SCRATCH/antes_norma.txt"
python3 tools/norma.py --vocabulario <algoritmo> > "$SCRATCH/antes_vocabulario.txt"
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
3. Consigue el PDF de **cada guía principal** (la más reciente de cada
   sociedad de referencia y la colombiana), por este orden: lo que diga
   `--guia`; la carpeta `guias-praxis/<carpeta_evidencia>/` si ese
   repositorio está en la sesión; descargar el PDF oficial al scratchpad.
   **Si alguna no se puede descargar** (de pago, bloqueo anti-bots o
   Cloudflare, sin copia libre), **para y pídesela al usuario en ese
   momento**, antes del plan y aunque se use `--sin-pausas`: en la primera
   pregunta (`AskUserQuestion`), di cuál es, por qué hace falta y qué
   cambiaría en el algoritmo, y pide que la adjunte al chat o la suba a
   `guias-praxis/<carpeta_evidencia>/`. Con la guía en mano, el algoritmo se
   construye a partir de ella, con todo lo que trae. No la sustituyas por
   fuentes secundarias sin que el usuario lo decida, y no intentes saltar el
   bloqueo. Sólo si el usuario no puede conseguirla: **no se escribe
   contenido clínico nuevo** de esa guía; se hace lo que no la necesita
   (lenguaje, enlaces, calculadoras que ya existen, estructura) y se dice
   en el PR.
4. Léela con `Read` (parámetro `pages`) por las secciones que tocan al
   algoritmo. Los PDF no se copian nunca dentro de `assets-medly`.

## 2. Mapa de brechas (antes de editar)

Escribe `$SCRATCH/plan_<algoritmo>.md` con:

- la silueta actual y la propuesta (secciones, nodos nuevos, nodos que se
  parten), respetando los ids existentes;
- **el mapa de ramas**, dibujado como el del modelo (`NORMA.md` §1): qué
  pregunta divide el tratamiento por trastorno, si la patología lo amerita,
  y qué cadena sigue cada entidad (con su color), con el porqué de cada
  división (o de no dividir), qué preguntas dividen también el diagnóstico, la
  gravedad o la hospitalización donde la guía separa grupos, dónde se juntan, todas las respuestas de cada
  pregunta (ningún «Sí» sin su «No»), el paso de vigilancia de cada cadena
  con su pregunta de ritmo, la pregunta de complicaciones, adónde vuelve
  cada «Aún no» y qué pasos compartidos preguntan «¿Qué crisis estás
  tratando?»;
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
   `pie_nodo` en cada decisión, rótulos en cada opción, según el mapa de
   ramas del plan y las reglas de `NORMA.md` §1: una cadena por trastorno
   sólo donde la patología lo amerita (no por defecto en todo tratamiento),
   con su `color` y la `descripcion` de sus criterios en la opción, opciones
   sin huecos ni solapes, la vigilancia y las complicaciones como bucle,
   «Aún no» al paso que se repite, «Ya lleva…» para no repetir un paso
   hecho. En una reforma completa conviene escribir el algoritmo con un
   script en el scratchpad (un diccionario por nodo, las citas en un solo
   sitio) que genere el JSON y regenerarlo tras cada cambio; al repositorio
   sólo va el JSON.
2. **Contenido**: cada cifra, dosis, umbral o criterio nuevo lleva su
   referencia con cita literal (`texto`, 12-30 palabras) y `paginas`. Si
   `imagen_evidencia` todavía no existe, `TODO_EVIDENCIA: <qué recortar>`,
   salvo en una **guía de pago** o de licencia no comercial (ACOG, Elsevier, Wiley, LWW, CC BY-NC…): ahí la cita
   textual va sin recorte y sin marcador (`NORMA.md` §7).
3. **Lenguaje**: reescribe lo confuso según `NORMA.md` §4: cada nodo
   clínico con `contexto` sólo si hace falta un porqué que no es obvio (no
   en todos), título con la acción, pills con
   sólo el dato, preguntas clínicas completas, viñetas completas pero breves
   en infinitivo; negritas en las cifras y en dos o tres palabras clave por
   frase, también en perlas, alertas, datos extra, `info` y discrepancias
   (la app pinta en color sólo las cifras) y español de Colombia
   (`python3 tools/norma.py --vocabulario <algoritmo> --corregir` aplica lo
   seguro; «suero», «pauta» y demás «revisar», a mano). Las siglas no se
   desarrollan: se añaden a `data/glosario.json` si faltan. Aquí sí se
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
   Criterios cuyo resultado decide la rama (diagnóstico, grado, riesgo) van
   como calculadora con `ramificar: true`, no como `checklist`; si la escala
   compartida no encaja, se crea su variante (skill `crear-calculadora`).
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
`TODO_EVIDENCIA` y va a la lista de pendientes del PR. **El segundo sólo se
pasa sobre guías que no son de pago ni de licencia no comercial** (`NORMA.md` §7): de una guía de pago
se queda la cita textual, sin recorte.

## 5. Verificar

1. `python3 tools/glosario.py --faltan <algoritmo>`: ninguna sigla fuera del
   glosario.
1. `galgo validar -a <algoritmo> --nivel error`: ningún error de estructura
   o esquema que no estuviera en la línea base.
2. `python3 tools/norma.py <algoritmo>` ≥ 80 y `galgo auditar --listar -a
   <algoritmo>` ≥ 85. Si no llega, la lista «qué le falta» dice por dónde
   (también las frases con más de tres palabras clave en negrita, las
   piezas sin ninguna y el
   vocabulario de España).
2b. `python3 tools/norma.py --vocabulario <algoritmo>`: sin cambios
   automáticos pendientes; cada «revisar» decidido (el suero sanguíneo o el
   «suero casero» de AIEPI se quedan).
2c. Recorre el mapa de ramas que sale del JSON (cada nodo con su
   `pie_nodo` y sus opciones → destino) y compáralo con el del plan: toda
   pregunta con dos opciones o más, ningún «Sí» suelto, todo «Aún no» hacia
   el paso que se repite, ninguna rama a la nada. Cuenta las palabras
   visibles de cada nodo (contexto + texto + alertas): 60-70, 90 como
   mucho; `tools/norma.py` lista los que se pasan.
2d. Figuras propias: `node tools/medios/solapes.js
   tools/medios/figuras/<carpeta>/*.html` sin fallos, y **mira cada PNG**
   con `Read` antes de subirlo (rótulos sobre las curvas, cajas que se
   salen, negritas partidas). La figura dice exactamente lo que dice su
   nodo.
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
- **`main` es producción**: la app lee de ahí en cuanto entra. El dueño
  autorizó (octubre de 2026) que Claude pase a `main` el trabajo validado
  (todo lo de §5 en verde y las correcciones de los revisores aplicadas, o
  listadas en el PR con su motivo): merge del PR por squash y comprobar que
  el workflow de Firebase termina bien. Sin forzar el push nunca. Si el
  algoritmo estaba oculto, quitar `"oculto": true` es una decisión del
  dueño: se pregunta antes.
