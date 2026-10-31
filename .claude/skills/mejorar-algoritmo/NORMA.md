# Norma Empirica v2

Lo que tiene que llevar un algoritmo para darse por terminado. El formato de
cada llave está en `praxis/docs/algoritmos_json.md` (la fuente de verdad);
esto dice **cuándo** se usa cada una y **cuánto**.

La medida es doble y se lee junta:

| | qué contesta | meta |
|---|---|---|
| `galgo auditar --listar -a X` | ¿está completo lo que hay? (dosis con pastilla, pregunta en cada decisión, escala conectada, recortes) | **≥85** |
| `python3 tools/norma.py X` | ¿usa todo lo que la app sabe dibujar? (criterios, alertas, perlas, grado, por kg, imágenes, GIF, enlaces) | **≥80** |
| `galgo validar -a X --nivel error` | ¿se rompe algo? | **0 errores nuevos** de estructura o esquema |

Las metas numéricas de `norma.py` están en su diccionario `METAS`. Si se
cambian, se cambian allí y aquí a la vez.

---

## 1. La silueta

```
[Nombre del tema]                    portada: el tema y sus definiciones
 ├── Diagnóstico                     estilo "rama"
 ├── Gravedad                        estilo "rama"   (si la guía estratifica)
 ├── Tratamiento                     estilo "rama"
 ├── Situaciones especiales          estilo "rama"   (embarazo, ERC, pediatría, anciano…)
 └── Seguimiento                     estilo "rama"
```

- Entre 2 y 5 secciones. Una sección sin al menos 3 pasos se funde con otra.
- **El título de una sección es una sola palabra**: «Diagnóstico»,
  «Gravedad», «Tratamiento», «Resolución», «Seguimiento». Sólo cuando una
  palabra no basta, dos o tres: «Situaciones especiales». Nada de «Diagnóstico
  y confirmación de la crisis» ni de barras («Estratificación / gravedad»).
- Portada: el `titulo` de la raíz es el nombre del tema (es el título del
  mapa) y su `texto` son **las definiciones del tema**, en lista: una viñeta
  por entidad que el algoritmo trata (`- **Colecistitis aguda:** …`,
  `- **Coledocolitiasis:** …`, `- **Colangitis aguda:** …`). Cada definición
  es la explícita y técnica que da la guía, completa pero directa: una o dos
  líneas, sin conducta ni dosis. Además de qué es, cada definición resume lo
  técnico que la guía usa para delimitarla: los **criterios simples** (los que
  el algoritmo desarrolla después en su sección), los **límites de tiempo**
  (cuándo es aguda o crónica, los minutos que definen un estado, la ventana
  de una complicación) y los umbrales que la definen. Entre dos y cinco
  viñetas; la portada es lo primero que se ve y no puede asustar. Cada una lleva su cita literal y
  página en las `referencias` de `nodo_raiz`. Si la guía no define una
  entidad, no se escribe de memoria: se deja fuera y se dice en el PR.
  `descripcion` es la **entradilla**: un párrafo natural y general, en frases
  completas («En este algoritmo se abordan las patologías agudas de la vía
  biliar más frecuentes en cirugía: cómo llegar al diagnóstico, estimar la
  gravedad…»). Dice qué problema cubre, en qué contexto, qué partes recorre y
  a quién no cubre. Complementa las definiciones y no las repite: no define
  ni enumera las entidades con sus criterios (eso va debajo, en la lista).
  **Breve: una o dos frases, unas 25-35 palabras.** Las partes se nombran,
  no se explican; nada de fármacos, situaciones especiales ni detalles que ya
  están en el mapa. Ejemplos de la medida:
  - «En este algoritmo se abordan las patologías agudas de la vía biliar más
    frecuentes en cirugía: diagnóstico, gravedad y cuándo indicar
    antibiótico, drenaje, endoscopia o cirugía.»
  - «En este algoritmo se aborda al niño con crisis epilépticas: la
    convulsión en curso, la primera crisis, el tratamiento según el tipo y el
    seguimiento. No incluye el periodo neonatal ni la crisis febril simple.» Además `especialidad`, `actualizado` (la app lo pone en una franja al pie de
  la portada) y `referencias` generales con `url`. **Sin `puntos_clave`**: la
  portada ya no los enseña. Nada de lista de fuentes en `texto`.
- **En la biblioteca** el algoritmo se ve como nombre, guías y definiciones:
  su entrada en `indices/` lleva `titulo` conciso (el nombre del tema, sin
  «Manejo de…» ni la guía) y `descripcion` con **las guías principales**
  separadas por « · » («Tokio 2018 · WSES 2020 · ASGE · ESGE»); debajo la app
  enseña las definiciones de la portada en tres líneas como mucho. Por eso la
  primera viñeta de la portada debe entenderse sola. Al terminar un algoritmo
  oculto, se quita `"oculto": true` del JSON para publicarlo.
- **Un camino no se mete en otra sección.** Cuando el final de un camino
  continúa en otra sección (el diagnóstico confirma una colecistitis y sigue
  su tratamiento), la opción apunta al **nodo de sección** de destino
  (`nodo_colecistitis`), no a un paso intermedio de ella. La app no cuelga
  esa sección debajo: la abre en su sitio, arriba, y en la tarjeta deja un
  botón «Ir a Colecistitis aguda». Si el destino tiene que ser un paso
  concreto de otra sección, la app hace lo mismo (lo abre en su sección y
  deja «Sigue en la sección …»), pero en las versiones viejas se duplicaría:
  se prefiere el nodo de sección.
- Ningún nodo existe para decir «fin» o «continuar manejo». Una vía acaba en
  el último paso que dice algo útil.
- **Los ids existentes no se renombran ni se borran**: las notas que cada
  usuario escribe en un paso se guardan con el id del nodo (`nodoId`), y un id
  que desaparece se lleva sus notas. Si un nodo sobra, se reescribe; si hay
  que partirlo, el id viejo se queda con la primera mitad.
- Ids nuevos: minúsculas ASCII con prefijo de sección (`diag_`, `estr_`,
  `trat_`, `esp_`, `seg_`).

## 2. Lo que no puede faltar (los datos cruciales)

Un algoritmo contiene **todo lo que hay que hacer cuando llega un paciente con
esa patología**, en el orden en que se hace: desde que cruza la puerta hasta el
alta y el seguimiento. Quien lo abra de guardia no debería tener que buscar
fuera ningún paso (la estabilización, las pruebas de la primera hora, la
monitorización, las complicaciones del tratamiento, el alta).

Cada algoritmo se recorre contra esta lista. Lo que la guía trae y el mapa no,
es un hueco; lo que la guía no trae, no se escribe.

- **Llegada y estabilización** (en toda urgencia): el **ABCDE** como primer
  paso del recorrido, antes de confirmar el diagnóstico (vía aérea,
  respiración, circulación con su acceso y su primer bolo, estado
  neurológico, exposición con temperatura y búsqueda del desencadenante), y
  las pruebas de la primera hora como `checklist`. Cada letra con lo que la
  guía dice para esa patología, con su cita; si la guía no lo trae, se cita
  la guía de la patología que sí lo dice (p. ej. JBDS para el ABCDE de la
  cetoacidosis). En un algoritmo de consulta (no urgente), la primera
  valoración ordenada ocupa ese lugar.
- **Definición y criterios diagnósticos**, contados («2 de 4») y completos.
- **Criterios de gravedad** con sus umbrales y la escala que usa la guía.
- **Criterios de ingreso, de UCI y de alta**, cada uno como `checklist`.
- **Soporte vital cuando aplica**: criterios de intubación o de ventilación no
  invasiva, metas de oxigenación, metas hemodinámicas (PAM, diuresis,
  lactato), con cifras.
- **Tratamiento completo**: primera línea, alternativa (alergia, embarazo,
  ERC), segunda línea si falla y **el criterio de fallo** que la dispara.
- **Dosis**: fármaco, dosis, vía, frecuencia, máximo y duración. Ajuste renal
  o hepático si la guía lo da.
- **Signos de alarma y cuándo derivar**, con el motivo.
- **Seguimiento**: cuándo se revisa y qué se mide.
- **Discrepancias** entre guías cuando hay dos y se contradicen.

## 3. Cada herramienta, cuándo y cuánto

| llave | cuándo | cuánto |
|---|---|---|
| `checklist` | criterios que se marcan con el paciente delante: ingreso, UCI, intubación, alta, requisitos antes de un procedimiento. Si de los criterios sale un resultado que decide la rama (diagnóstico definitivo/sospecha, grado, riesgo), va una calculadora con `ramificar` | al menos 2 por algoritmo, 1 por cada 12 nodos clínicos |
| `alertas` | lo que mata o daña si se pasa por alto: contraindicación, «no hacer», Clase III | 1 por cada 10 nodos; 1-2 por nodo como mucho |
| `nota_adicional` | la perla: el error frecuente, la población especial, el truco de exploración, el matiz que cambia la conducta | 1 de cada 3-4 nodos clínicos |
| `evidencia` | la clase y el nivel que da la guía para ese paso, simplificados: `{"clase": "IIa", "nivel": "B"}` (sin -R, -NR, -LD, -EO); con GRADE, `{"texto": "GRADE: débil a favor"}` | siempre que la guía los dé; si no, nunca |
| `farmacos` | todo fármaco nombrado con dosis en la guía | todos |
| `farmacos[].por_kg` | toda dosis «/kg», con `tope` y `concentracion` si la guía los da | todas (en pediatría es obligatorio) |
| `tabla` | dosis por peso o edad, metas, estadios, criterios que se consultan de un vistazo | cuando la guía trae la tabla |
| `cronometros` | **no usar por ahora**: su uso en la app todavía no está definido | nunca |
| `calculadora` | el paso que estratifica con una escala | toda escala que la guía use; por URL |
| `calculadora` + `ramificar` | **criterios que dan un resultado y de él sale la conducta** (diagnóstico de Tokio: definitivo / sospecha / no; gravedad por grados; riesgo alto / intermedio / bajo): la calculadora lleva a la rama que toca, en vez de una `checklist` que el médico interpreta solo. Criterios por grupos con textos largos → formulario Sí/No, no tabla (skill `crear-calculadora`) | siempre que exista o se pueda crear la escala |
| `media` | ver ayuda a decidir: exploración, signo, técnica, imagen diagnóstica, ECG, lesión, dispositivo. Toda imagen lleva **su título escrito dentro** (las figuras de `base.js` ya lo traen; a una foto se le pone con `franja_credito.py --titulo`) y un pie (`descripcion`) **breve, ≤18 palabras**, que diga qué se ve, sin crédito. Y un **`info`** (texto del visor a pantalla completa): un párrafo de 25-60 palabras en frases completas, sin saltos de línea, que explica qué señala cada flecha, qué significa y por qué importa (§4) —teñida con su hex exacto, `{#FDE047:flecha amarilla}`— y aporta lo que el pie no dice, con fuente. Si afirma una cifra, un criterio o una conducta, la imagen lleva sus **`referencias`**: sólo las que respaldan ese texto (copia de las que ya cita el algoritmo, `imagen_evidencia` por URL raw), que el visor abre con el botón del libro; ver «Texto de información» en la skill `imagenes-clinicas`. Una foto o figura real va en el lienzo de Empirica (título y subtítulo dentro, imagen recortada, leyenda debajo con una caja por señalador y su color, crédito; skill `imagenes-clinicas`, «Foto o figura real rotulada»). **Si el original ya trae flechas o recuadros, se usan y se citan con su color («Flechas rojas: …», sin escribir «del original»): no se añade otro señalador encima**; como mucho, un rótulo en español sin forma. **Un flujograma de la guía que repite el algoritmo no va en `media`** (ni en GIF): va como imagen fija en las fuentes del paso (`referencias[].imagen_evidencia` con la URL raw) | 1 de cada 4 nodos clínicos; galería (2-4) donde se comparan hallazgos |
| `media[].en_texto` | la frase del texto que la imagen ilustra («signo de Murphy»): la app la subraya con un icono de imagen y al tocarla abre la imagen o el GIF. Nunca «(GIF)» ni «(ver imagen)» en el texto | toda imagen que tenga su frase en el texto |
| GIF en `media` | algo que se mueve: técnica, maniobra, signo dinámico, secuencia de un protocolo | al menos 1 por algoritmo si el tema lo tiene |
| `enlaces` | otro algoritmo relacionado (complicación, diagnóstico diferencial), una calculadora fuera del flujo, un salto interno para reevaluar. La app los pone en la **rejilla de dos columnas** del final de la tarjeta (con la perla y las discrepancias, piezas iguales; las calculadoras primero, en naranja): el `texto` tiene que caber en media tarjeta, **corto** («ACV isquémico», «Fósforo bajo: fosfato»; no «ACV isquémico (desencadenante)»). En un paso **sin ramas**, el **primer enlace interno** es el que sigue el camino («Ir al tratamiento»): la app lo pone en el pie, a la derecha, y «mantener ↓» lo sigue («Fin de ruta» sólo sale en un paso sin ramas ni enlaces); por eso va **primero** el principal y después los demás saltos | al menos 2 hacia fuera |
| `discrepancias` | dos guías dicen cosas distintas para el mismo paciente | cuando pase; nunca inventada |
| `chips` | población, urgencia, clase. Van en la cabecera, a la derecha del tipo de paso («CRÍTICO · UCI»): una o dos palabras cada uno | 1-3, no en todos los nodos |
| `contexto` | la situación y el porqué del paso (§4): la app lo pinta en un cuadro teñido, como el de las definiciones de la portada | todo nodo clínico |
| `formulas` | **toda fórmula** que el texto nombra (osmolalidad efectiva, sodio corregido, anion gap, déficit de agua…): en el texto va **el nombre** («calcular la osmolalidad efectiva»), nunca la notación plana («2 × Na + glucosa / 18»). La app la marca como la frase de una imagen, pero en naranja (subrayada, texto teñido y un Σ pequeño arriba a la derecha) y al tocarla abre la fórmula dibujada (fracciones, subíndices, símbolos), con las fuentes en el botón del libro. Cada entrada: `en_texto` (la frase exacta), `titulo`, `tex` (LaTeX), `variables` (`[["[Na⁺]", "sodio sérico (mmol/L)"], …]`), `nota` breve si hace falta (unidades, corte) y `referencias` con la cita de la guía | toda fórmula que la guía da |
| `burbujas` | **el dato extra** que no cabe en la viñeta pero vale la pena: el mecanismo que explica una conducta («por qué la urea no es un osmol eficaz»), un matiz fisiopatológico, un dato histórico o de la evidencia que ayuda a recordar. La app pone una bombilla gris de contorno al final de la frase (`en_texto`) y al tocarlo abre `titulo` + `texto` (1-3 frases), con sus `referencias` en el botón del libro. Buenos candidatos: la cifra que engaña (potasio «normal» en la CAD), el porqué de una prohibición (bicarbonato de rutina), el ritmo que no se debe pasar (osmolalidad), la elección entre dos opciones (salino o balanceado). **Con mesura**: sólo si es clínicamente importante o de verdad interesante; lo que cambia la conducta va en el texto, una perla o una alerta, y el globito no repite una perla | 0-1 por nodo; **1 de cada 4-5 nodos clínicos** (5-6 en un algoritmo de 25 nodos) |

## 4. Cómo se escribe

Estilo decidido con el dueño en octubre de 2026 (sustituye al «telegráfico de
guardia»). La app la usa también un estudiante que empieza: cada nodo tiene que
entenderse solo, sin dar por sabido el protocolo. Se escribe con las palabras y
los conectores necesarios («porque», «hasta que», «mientras», «si…, entonces»),
pero sin relleno.

**Sin elipsis.** Cada frase lleva su verbo y sus artículos y preposiciones;
no se comprime a estilo de apunte:

| así no | así sí |
|---|---|
| «mejor que con la tira de orina» | «es mejor que con la tira de orina» |
| «valorar intermedios o UCI» | «valorar el requerimiento de cuidados intermedios o de UCI» |
| «potasio <3,5 → no insulina» | «si el potasio es menor de **3,5 mmol/L**, no empezar la insulina» |

**Unidades: las de Colombia.** Se escriben las unidades convencionales que
usan los laboratorios colombianos, aunque la guía use el SI:

| analito | unidad | si la guía sólo da mmol/L |
|---|---|---|
| glucosa | **mg/dL** | × 18 (33,3 mmol/L = **600 mg/dL**) |
| creatinina | **mg/dL** | ÷ 88,4 (µmol/L → mg/dL) |
| urea | **BUN en mg/dL** | urea mmol/L × 2,8 |
| calcio, fósforo, magnesio | **mg/dL** | × 4,0 · × 3,1 · × 2,43 |
| sodio, potasio, cloro, bicarbonato, anion gap | **mEq/L** (y las dosis de cloruro potásico y de bicarbonato en **mEq**: «**10-20 mEq/h**») | igual cifra: son iones de carga 1, 1 mmol/L = 1 mEq/L |
| β-hidroxibutirato, lactato | mmol/L (no tienen equivalente en mEq) | — |
| osmolalidad | mOsm/kg | — |
| fosfato (dosis) | mmol, como la guía («**20-30 mmol** de fosfato potásico») | — |

- Las fórmulas, también en mg/dL («glucosa/18», «BUN/2,8»).
- Si la guía sólo da la cifra en mmol/L, la cita literal se queda como está
  y el texto da la conversión redondeada como la guía (**250 mg/dL**, no
  «249,8»). Si al convertir la cifra resulta extraña (cae en el rango normal,
  no cuadra con otra guía), no se corrige: se consulta con el dueño.

**Palabras fijas.** Un fármaco IV continuo es una **«infusión»** («infusión
de insulina a **0,1 U/kg/h**»), nunca «perfusión» (que queda para el riego de
un órgano: «perfusión renal»). Los sueros, con su nombre completo:
**«solución salina 0,9 %»** (no «salino» ni «suero salino»), **«solución
salina 0,45 %»** y **«lactato de Ringer»** (no «Ringer lactato»).

### Las piezas de un nodo y qué dice cada una

| pieza | qué dice | ejemplo (potasio <3,5 en la cetoacidosis) |
|---|---|---|
| respuesta del nodo anterior (pill) | **sólo el dato** que lleva aquí | «Menor de 3,5 mmol/L» |
| `titulo` | **la acción** del paso (la app lo pinta en el color del tipo de nodo) | «Reponer potasio y retrasar la insulina» |
| `contexto` | **la situación y el porqué**, 1-2 frases completas | «En la cetoacidosis el potasio total del cuerpo está bajo, aunque en sangre parezca normal o alto. La insulina lo mete en las células y puede hundirlo en pocas horas.» |
| `texto` | **el cómo**: viñetas completas pero breves, con las cifras en negrita | «- No empezar la insulina hasta que el potasio supere **3,5 mmol/L**.» |
| `pie_nodo` | **pregunta clínica completa** que dice qué mirar y para qué | «¿Cuánto potasio tiene en sangre antes de empezar la insulina?» |

Ninguna pieza repite a otra: la pill no adelanta la acción del título, el
título no repite la pill y el texto no vuelve a decir el título.

### Texto (`texto`)

- **Mixto**: el `contexto` sitúa el paso y el `texto` da las indicaciones en
  viñetas completas pero breves. Cada viñeta es una frase con sentido propio
  («Reponer cloruro potásico IV a **10-20 mmol/h**; si hace falta más rápido,
  por vía central»), no una lista de palabras («Cloruro potásico 10-20 mmol/h;
  más rápido, central»).
- **Verbos en infinitivo**, como en las guías: «Reponer», «No empezar»,
  «Medir». Ni «repón» ni «reponga».
- **Sin límite fijo de viñetas**: las que hagan falta para que se entienda.
  Si un nodo crece tanto que mezcla dos decisiones, se parte; si es una lista
  de criterios, va a `checklist`; si es una tabla de dosis o cortes, a `tabla`.
- **Negritas** en dosis, umbrales, tiempos y metas, y también en **las
  palabras clave** de cada viñeta: la condición que decide («**hipovolemia
  grave**», «**compromiso cardiaco**»), el fármaco o el suero («**lactato de
  Ringer**»), el hallazgo o la población («**anciano**», «**embarazo**»).
  Palabras o expresiones cortas, no frases enteras: una a tres por viñeta,
  para que la vista salte de una a otra. La app las pinta en el color del
  nodo.
- **Subviñetas.** Una viñeta que junta varios pasos (simultáneos o
  seguidos), o una condición con datos que dependen de ella, se parte en
  subviñetas con dos espacios delante. Pasos en orden → numeradas (`  1.`,
  `  2.`); datos en paralelo o un matiz de la viñeta de arriba → con punto
  (`  - `). La viñeta que abre una sublista puede terminar en «:» y la app la
  pinta entera como rótulo. Dos niveles como mucho. Ejemplo:

  ```
  - Si hay **hipovolemia grave** → **solución salina 0,9 %** o cristaloide a **1 L/h**.
    - Si además hay **compromiso cardiaco**, monitorizar y valorar vasopresores.
  - Si no hay **compromiso renal ni cardiaco**:
    1. Poner **500-1.000 mL/h** las primeras **2-4 h**.
    2. Después, reponer el **50 %** del déficit en **8-12 h** y el resto en **24-48 h**.
  ```

  Se usan mucho: toda viñeta con «; después…», «y además…» o dos acciones
  seguidas es candidata.
- **Rótulo de viñeta** («- CAD y mixta: …»): la app lo pinta en el color del
  nodo. Fuera de los paréntesis, hasta 8 palabras y sin comas ni puntos; lo que
  va entre paréntesis no cuenta, así que caben las condiciones: «- EHH sin
  cetonemia (β-hidroxibutirato **<3,0**, pH **≥7,3**, bicarbonato **≥18**):
  insulina a **0,05 U/kg/h**». Se usa para enumerar categorías, no en cada
  viñeta.
- **«→» para condición → acción** al principio de una viñeta («Si hay
  **hipovolemia grave** → solución salina 0,9 % a **1 L/h**»): se lee de un
  vistazo qué hacer en cada caso. No se encadenan flechas ni se usan como
  abreviatura de un verbo en medio de la frase.
- Lenguaje claro sin perder precisión: se explica el término difícil, no se
  sustituye por uno vago. Nada de «es importante destacar», «cabe mencionar»,
  «piedra angular» (lista en `galgo/estilo.py` de `galgo-empirica`).

### Contexto (`contexto`)

- 1-2 frases completas (como mucho 2 párrafos cortos): qué situación clínica
  es y **por qué** se hace este paso. Sin viñetas ni dosis (las indicaciones
  van en `texto`). La app lo pinta entre el título y el texto, en un cuadro
  teñido con el color del nodo, como el cuadro de definiciones de la portada.
- Puede llevar `formulas` o `burbujas` igual que el `texto` (la frase de
  `en_texto` se busca en los dos).
- Lleva su cita como todo lo clínico: lo que afirma sale de la guía y está en
  las `referencias` del nodo.
- Va en todo nodo clínico (no en las portadas de sección `estilo: "rama"`).
- **Negritas en las palabras clave**, como en el texto: lo que el lector tiene
  que captar de un vistazo («En la cetoacidosis el **potasio total del cuerpo
  está bajo**, aunque en sangre parezca normal o alto»). La app las pinta en
  el color del nodo. No en la frase de un `en_texto`, que tiene que quedar
  entera fuera de la negrita.

### Preguntas y opciones

- `pie_nodo`: pregunta clínica completa, con «¿» y «?», que diga qué mirar y
  para qué: «¿Cuánto potasio tiene en sangre antes de empezar la insulina?»,
  «¿Cumple los criterios de resolución de su crisis?».
- Cada opción (pill) dice **sólo el dato o la condición** que lleva a esa rama,
  con su umbral y unidades: «Menor de 3,5 mmol/L», «Entre 3,5 y 5,0 mmol/L».
  La acción va en el título del nodo al que lleva. Cada opción se entiende
  sola (en el modo lectura las hermanas se leen de una en una).

### Perlas y alertas

- `nota_adicional` (perla): explicada, con el porqué, en 1-2 frases completas:
  qué pasa, por qué y qué hacer, con **negritas en las palabras clave** (la app
  las pinta en el naranja de la perla). «Al poner mucha solución salina 0,9 %
  aparece una **acidosis hiperclorémica**: el **bicarbonato sigue bajo**
  aunque las cetonas ya se hayan ido. Por eso la resolución se juzga por las
  **cetonas en sangre**, no por el bicarbonato.»
- `alertas`: el título nombra el peligro y el texto dice qué pasa y cómo
  evitarlo, con **negritas** en el riesgo y en lo que hay que hacer («puede
  causar **arritmias mortales**… **Reponer primero**»). Título «Insulina antes de los líquidos en el EHH»; texto «Poner
  insulina antes de reponer el volumen mete agua en las células y puede causar
  un colapso cardiovascular. Empezar con los sueros y dar la insulina cuando la
  glucosa deje de bajar sólo con ellos.»

### Siglas

- Se escriben solas («CAD», «HBPM»), sin desarrollarlas en el texto: la app
  las subraya con puntos y enseña su significado al tocarlas, desde el
  glosario común **`data/glosario.json`**.
- Toda sigla que se use en un algoritmo tiene que estar en el glosario; una
  nueva se añade en el mismo cambio (`python3 tools/glosario.py --faltan
  <algoritmo>` las lista).

### Fórmulas y datos extra

- Una fórmula **nunca** se escribe en notación plana en el texto: se nombra
  («Calcular la osmolalidad efectiva») y se declara en `formulas` con su `tex`
  (`2\,[\mathrm{Na^+}] + \dfrac{\text{glucosa}}{18}`), sus `variables` con
  unidades y la cita. La calculadora, si existe, sigue en `calculadora`: la
  fórmula enseña de dónde sale el número; la calculadora lo hace.
- `burbujas` (globito al final de la frase): para el **porqué** que un
  residente curioso preguntaría y el texto no puede contestar sin alargarse.
  Título como pregunta o como dato («¿Por qué la urea no cuenta?»), 1-3
  frases, con fuente, y con **negritas** en las palabras clave del
  mecanismo, que la app pinta en el color del nodo («La urea **atraviesa
  libremente las membranas**…»). Si el dato cambia la conducta, no va en un
  dato extra: va en el `texto`, la perla o la alerta.

### Texto del visor de imágenes (`info`)

- Frases completas: qué señala cada flecha o recuadro (con su color), qué
  significa y por qué importa para la conducta. «Flechas azules: ondas U, una
  onda pequeña después de la T. Flecha verde: descenso del ST. Son signos de
  potasio bajo; con menos de 3,5 mmol/L se repone a 10-20 mmol/h y se retrasa
  la insulina.»

## 5. Sin repetir

- La pill dice el dato, el título la acción, el contexto el porqué y el texto el cómo: ninguno repite a otro (§4).
- Si una imagen ya muestra una tabla, una lista de criterios o una secuencia, **se queda la imagen** y no se repite como `tabla` o `checklist` en el mismo nodo.
- La misma imagen no se pone en dos nodos seguidos de la misma vía.
- Lo que dice el texto no se repite en la perla ni en la alerta.

## 6. Alcance

- Se trabaja **sólo sobre el algoritmo indicado**. No se crean algoritmos JSON nuevos; un algoritmo relacionado que no existe se deja como `TODO_LINK_` y se lista en el PR. Las calculadoras nuevas sí se pueden crear si la guía usa la escala.
- La marca es **Empirica** (Praxis es el nombre antiguo) en textos, imágenes y documentación.

## 7. De dónde sale cada cosa

- **Contenido clínico**: de la guía, con `referencias[].texto` = cita literal
  de 12 a 30 palabras y `paginas`. Nunca de memoria.
- **Imágenes**: ver la skill `imagenes-clinicas`. Primero imágenes reales
  con licencia que permite el uso comercial (figuras de la guía si son CC BY,
  como las de la WSES, y si no, fotos de internet: Commons, PMC CC BY),
  editadas y, cuando hay un recorrido que contar, animadas en GIF; después,
  ilustraciones propias (`tools/medios`). Las de © editorial no entran sin
  permiso. Crédito en `creditos.json`.
- **Calculadoras**: de su publicación original, con referencia. Ver la skill
  `crear-calculadora`.
