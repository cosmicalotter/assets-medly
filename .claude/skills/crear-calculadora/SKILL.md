---
name: crear-calculadora
description: Crea una escala o calculadora clínica nueva en data/calculadoras con el formato DatosEscala de Empirica, validada contra su publicación original, y la conecta por URL a los nodos que la usan. Usar cuando un algoritmo pide una escala que no existe (TODO_CALC_…), cuando se pida crear o corregir una calculadora, o al conectar una escala existente a un nodo.
argument-hint: "<nombre de la escala> [algoritmo y nodo que la usan]"
---

# Crear o conectar una calculadora

## Antes de crear: ¿ya existe?

`ls data/calculadoras/`. Muchos `TODO_CALC_` piden escalas que ya están con
otro nombre (`TODO_CALC_curb65.json` → `curb65.json`,
`TODO_CALC_wells_tep.json` → `wellstep.json`,
`TODO_CALC_glasgow_blatchford.json` → `glasgowbratchford.json`). `galgo
auditar` las señala como «regla». Si existe, sólo se conecta (abajo).

## La fuente

Toda escala sale de su **publicación original o de la guía que la adopta**,
con la referencia en `referencias` (título y URL de PubMed o DOI). Los puntos
de corte se copian de ahí, no de memoria. Si la guía del algoritmo usa una
variante (p. ej. CHA₂DS₂-VA en vez de CHA₂DS₂-VASc), se crea esa variante.

## El formato

Lo lee `DatosEscala.fromJson` en `praxis/lib/models/algoritmo.dart`.

**Se prefiere la tabla** (`tipoCalculo: "suma"` con `columnas` + `filas`)
siempre que la escala se pueda expresar como puntos que se suman: es más
práctica y visual en la app. La fórmula queda para lo que de verdad es una
ecuación (CKD-EPI, ABC/2) o para valores numéricos que se convierten en puntos
por tramos. Dos detalles de la tabla:

- Lo que no se marca cuenta **0**: el 0 tiene que ser el valor normal o
  ausente. Si la escala resta desde un máximo (ASPECTS: 10 menos las regiones
  afectadas), los puntos cuentan lo afectado y cada `resultados[]` traduce el
  total a la puntuación real (`min`/`max` exactos y `categoria` «ASPECTS 7»).
- Una celda que no aplica en esa fila lleva `"-"` en `descripciones`.
- `nombre` de fila corto: la app lo corta a dos líneas.

**Imagen de ayuda**: `imagenTopUrl` (encima de la tabla o del formulario) o
`imagenBottomUrl` (debajo), con URL raw completa. Va en
`data/calculadoras/imagenes/<escala>.png` y sigue las reglas de la skill
`imagenes-clinicas` (propia o con licencia, marca Empirica, ≤300 KB). Úsala
cuando enseñe qué mirar para puntuar: regiones de una TC, grados de una
clasificación, cómo medir.

Antes de escribir, **abre un ejemplo del mismo tipo**:

| tipo | ejemplo | cuándo |
|---|---|---|
| tabla de puntos (preferida) | `abcd2.json`, `ich_score.json`, `aspects.json` | cada criterio suma 0/1 (o 0/1/2) |
| fórmula | `ckdepi.json`, `cockcroft.json` | hay una ecuación con variables |
| elementos con intervalos | `sofa.json`, `grace.json` | un valor numérico se convierte en puntos por tramos |

Llaves de primer nivel: `titulo`, `descripcion` (qué estima y en quién),
`referencias`, y según el tipo `columnas` + `filas`, o `tipoCalculo:
"formula"` + `formula` + `secciones[].elementos[]` (`tipo`: `input_numero` u
`opciones`; `opciones[].puntos` o `opciones[].valoresVariables`;
`intervalos[]` con `min`, `max`, `puntos`), y `prefijoResultado` /
`sufijoResultado`.

`resultados[]`: `min`, `max`, `categoria`, `color` (`verde`, `amarillo`,
`naranja`, `rojo`), `approach` (la conducta que corresponde, con cifras y de
la misma fuente) y `match_opcion_index`.

### `match_opcion_index`

Es la posición, desde 0, dentro de las `opciones` del nodo que abre la
escala. **El archivo de la escala es uno y lo comparten todos los algoritmos**,
así que sólo se rellena si las opciones del nodo que la usa siguen ese orden.
Si dos algoritmos la usan con ramas distintas, se deja `-1` y el nodo la
conecta con `ramificar: false`. Nunca se cambia el índice de una escala que ya
usa otro algoritmo sin revisar ese otro nodo.

Varios intervalos pueden llevar a la misma opción: el primero que contiene la
puntuación decide.

### Criterios que deciden la rama

Cuando de unos criterios sale un resultado y de él la conducta (diagnóstico
definitivo / sospecha / no; grado; riesgo), el nodo no lleva una `checklist`
que el médico interpreta solo: lleva la escala con `ramificar: true`, y cada
resultado abre su rama. Si la escala compartida no sigue el orden de las
opciones del nodo, o mide otra cosa (gravedad en vez de diagnóstico), se crea
una variante propia: `tokyocolecistitis_diagnostico.json` junto a
`tokyocolecistitis.json` (gravedad).

Para criterios que se combinan por grupos («A + B + C») se usa el
**formulario Sí/No**, no la tabla: con textos largos, las celdas de una tabla
de 4 columnas apilan las palabras en un cuadro pequeño. Un elemento
`opciones` por grupo (`No` = 0, `Sí` = 1) y una `formula` que da
directamente la categoría, con `"mostrarPuntaje": false` para que la app
enseñe «Definitiva (A + B + C)» y no «Resultado: 2»:

```json
"tipoCalculo": "formula", "formula": "a * b * (1 + c)", "mostrarPuntaje": false,
"secciones": [{"elementos": [
  {"id": "a", "tipo": "opciones", "label": "A · Signos locales: Murphy, o masa…",
   "opciones": [{"label": "No", "puntos": 0}, {"label": "Sí", "puntos": 1}]}, …]}]
```

(0 no cumple, 1 sospecha, 2 definitiva). Ver
`tokyocolecistitis_diagnostico.json` y `tokyocolangitis_diagnostico.json`
(`a * (b + 2 * c)` distingue A + B de A + C). Los casos de prueba cubren las
8 combinaciones.

**Resultados cortos**: `categoria` de ≤5 palabras y `approach` de ≤15: la
app los enseña juntos bajo la tabla y uno largo empuja el resto hacia arriba
(la app pliega el `approach` a tres líneas).

## Nombre y comprobación

- Nombre de archivo en minúsculas ASCII sin espacios: `news2.json`,
  `ich_score.json`. La app los pide por URL cruda y un nombre con tildes o
  espacios se sirve mal.
- Comprueba la escala con **tres casos** sacados de la publicación (uno por
  categoría de riesgo, incluidos los bordes) y escríbelos en el PR: entrada,
  puntuación esperada, categoría.

## Conectarla

En el nodo, siempre por URL completa (con nombre suelto la app no la
descarga):

```json
"calculadora": {
  "archivo": "https://raw.githubusercontent.com/cosmicalotter/assets-medly/main/data/calculadoras/news2.json",
  "etiqueta": "Calcular NEWS2",
  "ramificar": false
}
```

Y quita el `calculadora_id: "TODO_CALC_…"` que hubiera.

## Para que aparezca también en el menú de Calculadoras

El menú sale de `indices/index_calculadoras.json` (el workflow lo publica en
Firebase Remote Config en cada push a `main`). En el mismo commit que la
escala se añade su entrada, con la URL raw completa (`…/refs/heads/main/…`),
`categoria` y `palabrasClave` sin tildes, y se comprueba:

```bash
node update_firebase_date.js --validar
```
