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
 ├── Estratificación / gravedad      estilo "rama"   (si la guía estratifica)
 ├── Tratamiento                     estilo "rama"
 ├── Situaciones especiales          estilo "rama"   (embarazo, ERC, pediatría, anciano…)
 └── Seguimiento y alta              estilo "rama"
```

- Entre 2 y 5 secciones. Una sección sin al menos 3 pasos se funde con otra.
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
  ni enumera las entidades con sus criterios (eso va debajo, en la lista). Además `especialidad`, `actualizado` (la app lo pone en una franja al pie de
  la portada) y `referencias` generales con `url`. **Sin `puntos_clave`**: la
  portada ya no los enseña. Nada de lista de fuentes en `texto`.
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

Cada algoritmo se recorre contra esta lista. Lo que la guía trae y el mapa no,
es un hueco; lo que la guía no trae, no se escribe.

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
| `media` | ver ayuda a decidir: exploración, signo, técnica, imagen diagnóstica, ECG, lesión, dispositivo. Toda imagen lleva **su título escrito dentro** (las figuras de `base.js` ya lo traen; a una foto se le pone con `franja_credito.py --titulo`) y un pie (`descripcion`) **breve, ≤18 palabras**, que diga qué se ve, sin crédito. **Un flujograma de la guía que repite el algoritmo no va en `media`** (ni en GIF): va como imagen fija en las fuentes del paso (`referencias[].imagen_evidencia` con la URL raw) | 1 de cada 4 nodos clínicos; galería (2-4) donde se comparan hallazgos |
| `media[].en_texto` | la frase del texto que la imagen ilustra («signo de Murphy»): la app la subraya con un icono de imagen y al tocarla abre la imagen o el GIF. Nunca «(GIF)» ni «(ver imagen)» en el texto | toda imagen que tenga su frase en el texto |
| GIF en `media` | algo que se mueve: técnica, maniobra, signo dinámico, secuencia de un protocolo | al menos 1 por algoritmo si el tema lo tiene |
| `enlaces` | otro algoritmo relacionado (complicación, diagnóstico diferencial), una calculadora fuera del flujo, un salto interno para reevaluar | al menos 2 hacia fuera |
| `discrepancias` | dos guías dicen cosas distintas para el mismo paciente | cuando pase; nunca inventada |
| `chips` | población, urgencia, clase | 1-3, no en todos los nodos |

## 4. Cómo se escribe

El contrato de estilo completo está en `galgo/plantillas.py` (`ESTILO`) del
repositorio `galgo-empirica`. Lo esencial:

- Nota de guardia: telegráfico, imperativo, cifras delante.
- 1 a 4 viñetas por nodo; si salen más, sobra texto o falta un `checklist` o
  una `tabla`.
- Ninguna frase pasa de 30 palabras. Un nodo pasa de 120 palabras sólo si no
  hay forma de partirlo.
- `**` sólo en dosis, umbrales, tiempos y metas.
- Viñeta que abre con un rótulo corto y dos puntos («- Soporte de órganos: …»,
  «- Leve: …»): la app pinta el rótulo en negrita y en el color del nodo,
  como un semititular. Se usa para enumerar categorías, no en cada viñeta; el
  rótulo, de 1 a 6 palabras, sin comas ni puntos.
- «→» para encadenar condición y conducta cuando quede cómodo: «Sangre solo intraventricular → arteriografía». Con moderación, no en cada viñeta.
- Siglas: la primera vez que aparecen en el algoritmo van con su nombre
  («PAM (presión arterial media)»), después solas.
- Cada decisión con su umbral y sus unidades: «¿**Lactato >2 mmol/L**?», no
  «¿lactato elevado?».
- `pie_nodo` es la pregunta que abre las ramas, con «¿» y «?»; rótulos de
  opción cortos y distintos entre sí.
- Cada opción se entiende sola: en el modo lectura de la app las tarjetas
  hermanas se leen de una en una (las demás quedan como fantasmas), así que
  ninguna dice «lo mismo que la anterior» ni depende de leer la de al lado.
  El título de la tarjeta nombra la situación («Deterioro grave: tratar ya»),
  no sólo «Sí».
- Lenguaje claro sin perder precisión: se explica el término difícil, no se
  sustituye por uno vago.
- Nada de «es importante destacar», «cabe mencionar», «piedra angular»… (la
  lista está en `galgo/estilo.py`).

## 5. Sin repetir

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
