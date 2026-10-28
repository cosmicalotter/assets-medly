---
name: crear-calculadora
description: Crea, corrige o mejora una escala o calculadora clínica de data/calculadoras con el formato DatosEscala v3 de Empirica (tabla de puntos, formulario con fórmula o con reglas), validada contra su publicación original y con la Norma de calculadoras (NORMA.md), y la conecta por URL a los nodos que la usan. Usar cuando un algoritmo pide una escala que no existe (TODO_CALC_…), cuando se pida crear, corregir, completar o reformar una calculadora (conducta por resultado, instrucciones, unidades, valores medidos), o al conectar una escala existente a un nodo.
argument-hint: "<nombre de la escala> [algoritmo y nodo que la usan]"
---

# Crear, mejorar o conectar una calculadora

La definición de terminado es **`NORMA.md`** (en esta carpeta): qué modelo
elegir, cómo se redacta, de dónde sale cada cifra y la lista de comprobación.
El formato de cada llave está en `praxis/docs/calculadoras_json.md`.

```bash
python3 tools/calculadoras.py               # tablero de todas, lo peor primero
python3 tools/calculadoras.py <escala>      # errores, avisos y lo que le falta
python3 tools/calculadoras.py --chequeo <escala>   # sólo errores (sale con 1)
node update_firebase_date.js --validar      # índices
node update_firebase_date.js --mostrar      # lo que se publica, con «Se usa en»
```

Meta: **0 errores y nota ≥ 85**. Un error del validador es un paciente real
que no recibe resultado o recibe uno equivocado.

## 1. Antes de crear: ¿ya existe?

`ls data/calculadoras/`. Muchos `TODO_CALC_` piden escalas que ya están con
otro nombre (`TODO_CALC_curb65.json` → `curb65.json`,
`TODO_CALC_wells_tep.json` → `wellstep.json`,
`TODO_CALC_glasgow_blatchford.json` → `glasgowbratchford.json`,
`TODO_CALC_sofa.json` → `sofa.json`, `TODO_CALC_criterios_light.json` →
`light.json`, `TODO_CALC_GRACE_Score.json` → `grace.json`). `galgo auditar`
las señala como «regla». Si existe, sólo se conecta (§6).

## 2. La fuente primero

Toda escala sale de su **publicación original** y, para la conducta, de la
**guía que la adopta**. Se leen antes de escribir:

- resumen de PubMed: `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=<PMID>&rettype=abstract&retmode=text`;
- texto completo abierto en PMC / Europe PMC si lo hay;
- la guía (NICE, IDSA/ATS, AHA/ASA, Tokio, KDIGO, ESC…) para la conducta.

Los puntos de corte, coeficientes y criterios se copian de ahí. Cada
referencia va con `url` y una **cita literal** (`texto`, 12-30 palabras) que
respalde lo que la escala afirma. Si la guía del algoritmo usa una variante
(CHA₂DS₂-VA en vez de CHA₂DS₂-VASc), se crea esa variante. Sin fuente a
mano, no se añade contenido clínico.

## 3. Elegir el modelo (NORMA §1)

| la escala… | modelo | ejemplo para copiar |
|---|---|---|
| suma puntos de ítems con niveles | tabla de puntos | `westley.json`, `glasgowcoma.json` |
| cuenta criterios sí/no | tabla «No» 0 / «Sí» n | `curb65.json`, `hasbled.json` |
| clasifica en una categoría | tabla de una fila con `detalles` | `asa.json`, `killipkimball.json` |
| da puntos por valores medidos | tabla con `entrada` | `apacheii.json`, `sofa.json`, `childpugh.json` |
| es una ecuación | formulario con fórmula | `ckdepi.json`, `cockcroft.json`, `volumen_abc2.json` |
| combina criterios (y / o / al menos n) | formulario con reglas | `tokyocolecistitis_diagnostico.json`, `CamIcu.json` |

## 4. Escribirla

Llaves (NORMA §2-§7): `titulo`, `descripcion` (40-80 palabras: qué estima,
en quién, qué decide), `instrucciones` (cómo se puntúa, ≤ 45 palabras),
`limitaciones` (cuándo no aplica), `referencias` (original + guía, con
cita), el modelo, y `resultados` con `categoria` corta, `color`, `approach`
(conducta con cifras, ≤ 40 palabras, de la fuente) y `match_opcion_index`.

Piezas que hacen la escala cómoda en el teléfono:

- `detalles` / `detalle`: la definición de cada opción bajo su etiqueta.
- `ayuda`: cómo medir o explorar un criterio (botón (i)).
- `entrada`: escribir el valor medido y que se marque la celda.
- `unidades`: mg/dL ↔ µmol/L, °C ↔ °F (tabla de factores en NORMA §5).
- `min` / `max`: lo posible; un valor imposible no se usa.
- `grupo`: filas alternativas (sólo una cuenta).
- `extras`: otros valores del resultado (volumen por tramos, dosis).
- `decimales`: como se informa en la clínica.

**Compatibilidad**: el JSON de `main` lo leen todas las versiones de la app.
Las llaves v3 se ignoran en las antiguas sin romper nada, salvo dos cosas
que el validador vigila: una variable de fórmula que empiece por `e`, y una
escala sólo con reglas (va con su `formula` equivalente; NORMA §6).

## 5. Comprobarla

1. `python3 tools/calculadoras.py <escala>` sin errores y nota ≥ 85.
2. **Tres casos** de la publicación (uno por categoría, con los bordes):
   entrada → total → categoría. Se escriben en el PR.
3. Si cambió una cifra respecto a la versión anterior: valor anterior, valor
   de la fuente y cita, en el PR.
4. Si la escala decide ramas (`ramificar: true` en algún nodo): el número y
   el orden de los resultados no cambian (el validador comprueba los
   índices; el sentido lo revisa quien edita).

## 6. Conectarla a un algoritmo

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

`match_opcion_index` es la posición, desde 0, dentro de las `opciones` del
nodo que abre la escala. **El archivo de la escala es uno y lo comparten
todos los algoritmos**: sólo se rellena si las opciones del nodo siguen ese
orden; si dos algoritmos la usan con ramas distintas, `-1` y
`ramificar: false`. Cuando de unos criterios sale la rama (diagnóstico
definitivo / sospecha / no; grado), el nodo lleva la escala con
`ramificar: true` en vez de una `checklist`; si la escala compartida no sigue
el orden de las opciones del nodo, se crea una variante
(`tokyocolecistitis_diagnostico.json` junto a `tokyocolecistitis.json`).

«Se usa en» (la sección de la ventana de información con los algoritmos que
usan la escala) **no se escribe**: lo calcula el workflow al publicar
`index_calculadoras` con los algoritmos visibles.

## 7. El menú de Calculadoras

El menú sale de `indices/index_calculadoras.json` (el workflow lo publica en
Firebase Remote Config en cada push a `main`). En el mismo commit que una
escala nueva se añade su entrada, con la URL raw completa
(`…/refs/heads/main/…`), el mismo `titulo` que la escala, `categoria` y
`palabrasClave` sin tildes, y se comprueba con
`node update_firebase_date.js --validar`.

Nombre de archivo en minúsculas ASCII sin espacios (`news2.json`,
`ich_score.json`): la app los pide por URL cruda y un nombre con tildes o
espacios se sirve mal.

## 8. El validador como hook (opcional)

`tools/calculadoras.py --hook` es un PostToolUse de Claude Code: tras cada
edición de `data/calculadoras/*.json` devuelve los errores para
arreglarlos en el momento. Para activarlo, el dueño del repositorio añade en
`.claude/settings.json`, junto al de `norma.py`:

```json
{"type": "command", "command": "python3 \"$CLAUDE_PROJECT_DIR\"/tools/calculadoras.py --hook"}
```
