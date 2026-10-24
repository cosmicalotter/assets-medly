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
[Nombre del tema]                    portada: sólo el tema
 ├── Diagnóstico                     estilo "rama"
 ├── Estratificación / gravedad      estilo "rama"   (si la guía estratifica)
 ├── Tratamiento                     estilo "rama"
 ├── Situaciones especiales          estilo "rama"   (embarazo, ERC, pediatría, anciano…)
 └── Seguimiento y alta              estilo "rama"
```

- Entre 2 y 5 secciones. Una sección sin al menos 3 pasos se funde con otra.
- Portada: `descripcion` (una línea de alcance), `especialidad`, `actualizado`,
  **3 a 5 `puntos_clave`** con cifras, `referencias` generales con `url`.
  Nada de lista de fuentes en `texto`.
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
| `checklist` | criterios que se marcan con el paciente delante: diagnóstico, gravedad, ingreso, UCI, intubación, alta, requisitos antes de un procedimiento | al menos 2 por algoritmo, 1 por cada 12 nodos clínicos |
| `alertas` | lo que mata o daña si se pasa por alto: contraindicación, «no hacer», Clase III | 1 por cada 10 nodos; 1-2 por nodo como mucho |
| `nota_adicional` | la perla: el error frecuente, la población especial, el truco de exploración, el matiz que cambia la conducta | 1 de cada 3-4 nodos clínicos |
| `evidencia` | la clase y el nivel que da la guía para ese paso, simplificados: `{"clase": "IIa", "nivel": "B"}` (sin -R, -NR, -LD, -EO); con GRADE, `{"texto": "GRADE: débil a favor"}` | siempre que la guía los dé; si no, nunca |
| `farmacos` | todo fármaco nombrado con dosis en la guía | todos |
| `farmacos[].por_kg` | toda dosis «/kg», con `tope` y `concentracion` si la guía los da | todas (en pediatría es obligatorio) |
| `tabla` | dosis por peso o edad, metas, estadios, criterios que se consultan de un vistazo | cuando la guía trae la tabla |
| `cronometros` | **no usar por ahora**: su uso en la app todavía no está definido | nunca |
| `calculadora` | el paso que estratifica con una escala | toda escala que la guía use; por URL |
| `media` | ver ayuda a decidir: exploración, signo, técnica, imagen diagnóstica, ECG, lesión, dispositivo | 1 de cada 4 nodos clínicos; galería (2-4) donde se comparan hallazgos |
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
- «→» para encadenar condición y conducta cuando quede cómodo: «Sangre solo intraventricular → arteriografía». Con moderación, no en cada viñeta.
- Siglas: la primera vez que aparecen en el algoritmo van con su nombre
  («PAM (presión arterial media)»), después solas.
- Cada decisión con su umbral y sus unidades: «¿**Lactato >2 mmol/L**?», no
  «¿lactato elevado?».
- `pie_nodo` es la pregunta que abre las ramas, con «¿» y «?»; rótulos de
  opción cortos y distintos entre sí.
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
- **Imágenes**: ver la skill `imagenes-clinicas`. Tres orígenes: figuras de la
  guía, ilustraciones propias (`tools/medios`) y fotos con licencia que
  permite uso comercial, con su crédito en `creditos.json`.
- **Calculadoras**: de su publicación original, con referencia. Ver la skill
  `crear-calculadora`.
