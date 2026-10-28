# Norma de calculadoras Empirica (v3)

Lo que tiene que llevar una calculadora para darse por terminada. El formato
de cada llave y lo que la app hace con ella está en
`praxis/docs/calculadoras_json.md` (la fuente de verdad); esto dice **qué
modelo elegir, cómo redactar y de dónde sale cada cifra**.

| | qué contesta | meta |
|---|---|---|
| `python3 tools/calculadoras.py <escala>` | ¿se rompe algo? (errores) ¿está completa? (nota) | **0 errores, nota ≥ 85** |
| `node update_firebase_date.js --validar` | ¿el índice está bien y dónde se usa? | sin errores |
| el algoritmo que la abre (`galgo validar`) | ¿la rama que elige existe? | sin errores nuevos |

El validador recorre **todas** las combinaciones (o 20 000 al azar si son
más): si dice que un total no tiene resultado, es que un paciente real puede
llegar a ese total.

---

## 1. Elegir el modelo

Las escalas médicas son de seis clases. Todas caben en los tres modelos de la
app; lo que cambia es qué piezas se usan.

| la escala… | modelo | piezas | ejemplos |
|---|---|---|---|
| **suma puntos** de varios ítems con niveles | tabla de puntos | `detalles` si un nivel necesita explicación | Westley, Wood-Downes, Glasgow, Silverman, NIHSS |
| **cuenta criterios** presentes (sí/no) | tabla de dos columnas: «No» 0 / «Sí» n | la app los pinta «No · Sí» junto al criterio | CURB-65, HAS-BLED, CHA₂DS₂-VASc, Wells, PERC, Alvarado |
| **clasifica** en una categoría (una sola elección) | tabla de **una fila**, una columna por clase | `detalles` con la definición de cada clase; imagen si ayuda | ASA, Killip, Mallampati, Forrest, West Haven |
| da puntos por **valores medidos** en tramos | tabla con `entrada` en esas filas (o formulario con `intervalos` si no hay nada que describir) | `entrada.tramos`, `unidades`, `min`/`max` | APACHE II, SOFA, Child-Pugh, GRACE, Glasgow-Blatchford |
| es una **ecuación** | formulario con fórmula | `min`/`max`, `unidades`, `decimales`, `extras` | CKD-EPI, Cockcroft-Gault, ABC/2 |
| **combina criterios** (A + B + C, 2 de 4, «y además») | formulario con **reglas** (`resultados[].si`) | `formula` equivalente para las versiones antiguas | Tokio diagnóstico, CAM-ICU, SIRS, HIC |

Reglas para decidir:

- **Se prefiere la tabla** siempre que la escala sea una suma: es lo más
  rápido de marcar y se reconoce como la escala de papel.
- Un criterio sí/no **nunca** va como formulario si la escala es una suma:
  dos columnas «No» / «Sí» en la tabla.
- Si la escala combina criterios con «y» / «o» / «al menos n», van **reglas**,
  no una fórmula aritmética codificada (`a * (b + 2 * c)`, sumas de 1, 10,
  100, 1000): la regla se lee y se revisa; el código no.
- Si un valor medido da puntos, el usuario tiene que poder **escribirlo**
  (`entrada` o `intervalos`): no se le hace buscar «38,5-38,9» en una lista.

---

## 2. La portada de la calculadora

- **`titulo`**: el nombre de la escala y, si la tiene, la sigla; sin
  «Calculadora de»: «Escala de Westley (crup)», «CURB-65 (neumonía
  comunitaria)», «Tasa de filtración glomerular (CKD-EPI 2021)». El mismo
  título va en `indices/index_calculadoras.json`.
- **`descripcion`** («Para qué sirve»): 2-3 frases, **40-80 palabras**: qué
  estima o clasifica, **en quién** se derivó o validó (adultos con NAC,
  niños con crup, UCI…), qué decisión apoya y de qué publicación sale.
  Sin cifras de puntos de corte (están en los resultados).
- **`instrucciones`** («Cómo se aplica», arriba de los criterios): lo que
  hace falta para puntuar bien y no está en los criterios: qué valor (el
  peor de las primeras 24 h), en qué momento (antes de tratar, a los 1 y 5
  min), qué hacer si no se puede evaluar (sedado, intubado), qué filas son
  alternativas. 1-3 frases, **≤ 45 palabras**. Si no hay nada que decir,
  no se inventa.
- **`limitaciones`** («Cuándo no aplica»): poblaciones excluidas o en las
  que no se validó, y el error más común de uso (PERC sólo con probabilidad
  baja; Alvarado en embarazo; CURB-65 no decide el alta sola). 1-3 frases.
- **`referencias`**: la **publicación original** y, si existe, la **guía
  que la adopta** y de la que sale la conducta. Cada una con:
  - `titulo`: la cita (Autor A, et al. Título. Revista Año;vol:págs.);
  - `url`: PubMed o DOI;
  - `texto`: **cita literal de 12-30 palabras** que respalda los puntos de
    corte o la conducta (la app la enseña en cursiva bajo el título);
  - `paginas` si la fuente es una guía larga.

---

## 3. Tablas de puntos

- **`columnas`**: una por valor de puntos, en orden. `titulo` es lo que va en
  la pastilla: el número («0», «1», «2»), la clase («Clase III») o el grado.
  `color` sigue la **gravedad**, no el número: verde lo normal, amarillo y
  naranja lo intermedio, rojo lo grave (en Glasgow, 1 es rojo).
- **`filas`**:
  - `nombre`: el criterio, corto (≤ 30 caracteres): «Frecuencia
    respiratoria», «Retracciones». Lo que haga falta explicar va a `ayuda`.
  - `descripciones`: el texto de cada celda, **≤ 30 caracteres**, `"-"`
    donde no aplica. Lo que haga falta para elegir bien va a `detalles`.
  - `detalles`: la definición de cada celda cuando la etiqueta no basta
    (clases de ASA, respuestas de Glasgow, grados de Silverman). Una por
    celda, en paralelo a `descripciones`; `""` donde no hace falta.
  - `ayuda`: cómo se mide o se explora el criterio, si no es obvio.
  - `grupo`: filas alternativas (sólo una cuenta). Con nombre en
    minúscula ASCII: `"genitales"`, `"creatinina"`.
  - `entrada`: si el criterio es un **valor medido** (temperatura, FC,
    PaO₂/FiO₂, bilirrubina…). Tramos **contiguos** con dos decimales de
    margen (`{"min": 36, "max": 38.49}`, `{"min": 38.5, "max": 38.99}`)
    para que 38,45 no caiga entre dos tramos; `min`/`max` de lo posible;
    `unidades` si se mide en más de una (§5). Los tramos copian la fuente,
    incluidos sus «/» (dos tramos con los mismos puntos).
- **Lo no marcado cuenta 0**: el 0 tiene que ser lo normal o lo ausente. Si
  una fila no tiene 0 (Glasgow), es obligatoria; está bien, la app lo pide.
- Si la escala resta desde un máximo (ASPECTS: 10 menos lo afectado), los
  puntos cuentan lo afectado y cada resultado traduce el total («ASPECTS 7»).
- Si el total es un **código** (1000 por factor mayor, 10 por grado), va
  `"mostrarPuntaje": false`. Mejor aún: reescribirla con reglas.

---

## 4. Formularios

- **`id`**: minúscula ASCII con guion bajo; **nunca empieza por `e`** (`edad`
  → `anios`, `grupo_edad`): las versiones antiguas de la app la leen como el
  número e. El validador lo marca como error.
- **`label`**: el criterio, como en una tabla. `ayuda` si hace falta.
- **`input_numero`** lleva siempre `unidad`, `min` y `max` (lo posible, no lo
  normal: edad 18-120 en adultos, creatinina 0,1-30 mg/dL) y `unidades` si
  el valor se informa de más de una forma (§5).
- **`opciones`**: cortas; `detalle` si una opción necesita definición.
  `puntos` si la escala suma; `valoresVariables` si la opción fija
  coeficientes (sexo en CKD-EPI).
- **`formula`**: la ecuación de la publicación, tal cual, con sus
  coeficientes. Sintaxis en el contrato §4 (`abs`, `sqrt`, `ln`, `exp`; el
  mínimo con `abs`). `decimales` como se informa en la clínica (TFG y
  aclaramiento enteros; volumen con 1).
- **`extras`**: otros valores que el clínico necesita con el resultado
  (volumen por tramo horario, dosis ajustada, déficit). Cada uno con su
  fuente en las referencias.

---

## 5. Unidades alternativas

Se escriben en la unidad base de la fórmula o de los tramos; `unidades`
añade las otras: base = valor × `factor` + `suma`. Factores de conversión
(SI ↔ convencional) que se usan en la app:

| magnitud | base | otra | `factor` | `suma` |
|---|---|---|---|---|
| creatinina | mg/dL | µmol/L | 0.01131 | |
| bilirrubina | mg/dL | µmol/L | 0.0585 | |
| BUN | mg/dL | urea mmol/L | 2.8 | |
| glucosa | mg/dL | mmol/L | 18.016 | |
| albúmina | g/dL | g/L | 0.1 | |
| hemoglobina | g/dL | g/L | 0.1 | |
| temperatura | °C | °F | 0.5556 | -17.778 |
| peso | kg | lb | 0.4536 | |
| talla | cm | m | 100 | |
| plaquetas | ×10³/µL | ×10⁹/L | 1 | |

Ojo: **urea ≠ BUN**. Si la escala pide urea en mg/dL (CURB-65 británico
pide urea en mmol/L), BUN mg/dL = urea mg/dL × 0,467.

---

## 6. Reglas

- Cada resultado lleva su `si`; el de por defecto (sin `si`) va el último.
- Se escriben **como dice la fuente**: «A y además B o C» →
  `{"todos": [A, {"alguno": [B, C]}]}`; «≥ 2 de 4» →
  `{"suma": [a, b, c, d], "minimo": 2}`.
- Mientras haya versiones antiguas, la escala lleva además
  `tipoCalculo: "formula"` y una `formula` **equivalente** (productos y
  sumas de criterios 0/1; `match` por `min`/`max`). El validador comprueba
  que fórmula y reglas dan lo mismo en todas las combinaciones. Si no hay
  fórmula posible, `tipoCalculo: "reglas"` y se avisa en el PR (en las
  versiones antiguas la escala sale vacía).
- Patrones de fórmula para criterios 0/1: Y = `a * b`; O = `1 - (1 - a) * (1 - b)`;
  NO = `1 - a`; elegir entre categorías: `c1 * 1 + c2 * 2` con categorías
  excluyentes.

---

## 7. Resultados

- **Cubren todo**: cada total posible (o valor de la fórmula) cae en
  exactamente un resultado; sin huecos ni solapes. Límites copiados de la
  fuente; decimales contiguos (`60-89.99` y `90-999`, o con `decimales: 0`,
  `60-89` y `90-999`).
- **`categoria`**: ≤ 6 palabras, en minúscula salvo nombres propios: «Crup
  moderado», «Riesgo alto», «Clase III», «G3a: descenso moderado».
- **`color`**: verde, amarillo, naranja, rojo según la gravedad.
- **`approach`** (la conducta): lo que se hace con ese resultado según la
  fuente, en estilo de nota de guardia: telegráfico, imperativo, cifras
  delante, **≤ 40 palabras**, 1-3 acciones. «Ingreso; considerar UCI si
  PAS < 90 o FR ≥ 30.» No se escribe conducta que la fuente no da: si la
  escala sólo estima un riesgo, la conducta dice qué riesgo es y qué decisión
  apoya, sin inventar tratamientos.
- **`match_opcion_index`**: sólo si un nodo con `ramificar: true` la usa y
  sus opciones siguen ese orden; si no, `-1`. **Nunca** se cambia el orden
  ni el número de resultados de una escala que ya decide ramas sin revisar
  esos nodos (el validador lista y comprueba los índices).

---

## 8. Estilo de redacción

- Español con tildes. Decimales con **coma** en los textos («38,5 °C»); en los
  números del JSON, punto.
- Unidades con espacio y símbolos correctos: «°C», «lpm», «rpm», «mmHg»,
  «mg/dL», «SatO₂», «PaO₂/FiO₂», «≥», «≤», «×».
- Sin mayúsculas de título («Frecuencia cardiaca», no «Frecuencia Cardíaca»
  — se acepta la tilde de la RAE en ambas formas, pero una sola en la escala).
- Abreviaturas comunes sin explicar (FC, FR, PAS, PAM, IMC, TFG, UCI, VO,
  IV); las demás, la primera vez en `descripcion` o `ayuda`.
- La conducta no repite la categoría.

---

## 9. Fuentes

**Nada clínico sin fuente**: cada punto de corte, coeficiente, criterio y
conducta sale de la publicación original o de la guía que la adopta, nunca
de memoria. Las fuentes se leen (PubMed, PMC, la guía), y la cita literal va
en `referencias[].texto`. Si una cifra de la escala actual no coincide con
la fuente, se corrige y se dice en el PR (entrada, valor anterior, valor de
la fuente, cita). Los PDF de guías no entran al repositorio.

---

## 10. Lista de comprobación

- [ ] Modelo según §1; sin totales codificados.
- [ ] `titulo`, `descripcion` (40-80 palabras), `instrucciones` si hay qué
  decir, `limitaciones`.
- [ ] Referencias: original + guía, con `url` y cita literal en `texto`.
- [ ] Tabla: nombres ≤ 30 caracteres, celdas ≤ 30, `detalles`/`ayuda`
  donde la etiqueta no basta, `entrada` en los valores medidos, `grupo` en
  las filas alternativas, colores por gravedad.
- [ ] Formulario: ids sin `e` inicial, `min`/`max` y `unidades` en cada
  número, `decimales`.
- [ ] Resultados: cubren todo, categoría corta, color, conducta con fuente
  en cada uno; `match_opcion_index` sin romper ramas.
- [ ] `python3 tools/calculadoras.py <escala>`: 0 errores, nota ≥ 85.
- [ ] Entrada en `indices/index_calculadoras.json` con URL raw completa,
  `categoria` y `palabrasClave` sin tildes; `node update_firebase_date.js
  --validar`.
- [ ] Tres casos de la publicación en el PR (entrada → total → categoría),
  incluidos los bordes.
