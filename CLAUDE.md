# assets-medly

Contenido de la app **Empirica** (antes Praxis; el repositorio de la app sigue llamándose `praxis`): algoritmos clínicos (`data/Adultos`,
`data/Pediatria`), calculadoras (`data/calculadoras`), imágenes de nodo
(`data/imagenes/algoritmo/<carpeta>`), recortes de evidencia
(`data/imagenes/evidencia/<carpeta>`) y el dataset de interacciones
(`data/interactio`).

**`main` es producción.** La app descarga de
`raw.githubusercontent.com/cosmicalotter/assets-medly/main/…` y el workflow de
`.github/` avisa a Firebase en cada push. Lo que entra en `main` lo ven los
usuarios. Se trabaja en una rama y se pasa a `main` solo con el trabajo
validado (`galgo validar` sin errores, `tools/norma.py`, revisores); el dueño
autorizó (octubre de 2026) que Claude haga ese paso a `main` él mismo.

## Índices: qué algoritmos y calculadoras enseña la app

Los menús de la app salen de Firebase Remote Config, y Remote Config sale de
**`indices/`**: `index_adultos.json`, `index_pediatria.json`,
`index_calculadoras.json` y `json_banners.json` (un archivo por parámetro).
En cada push a `main`, el workflow (`update_firebase_date.js`) los valida,
los publica y pone la fecha `ultima_actualizacion_app`; la app los recibe al
abrirse.

- Algoritmo o calculadora nueva → su entrada en `indices/` en el mismo commit
  (URL raw completa de `main`). Si el archivo no está en `main`, el workflow
  no publica nada.
- No se editan los índices en la consola de Firebase: si alguien lo hace, el
  workflow no pisa ese parámetro y falla; se copia el valor de Firebase al
  archivo y se vuelve a subir.
- **Cómo se ve cada algoritmo en la biblioteca:** `titulo` es el nombre,
  conciso («Patología biliar aguda», «ACV isquémico»); `descripcion` son las
  guías principales en que se basa, separadas por « · » («Tokio 2018 · WSES
  2020 · ASGE · ESGE»). Debajo, la app enseña las definiciones de la portada
  (el `texto` del nodo raíz) en tres líneas como mucho: por eso la portada
  empieza por las definiciones. Dentro de cada especialidad van en orden
  alfabético.
- Lo que se publica no es el archivo tal cual: el workflow quita los
  algoritmos ocultos y añade a cada entrada `definiciones` (la portada en una
  línea). `definiciones` no se escribe a mano en `indices/`.
- **`"oculto": true`** en el JSON de un algoritmo lo saca de la app por
  completo: no se publica en el índice (ni biblioteca, ni buscador, ni
  recientes, ni Nodo) y la app no lo abre aunque se llegue por un enlace o
  una nota. Su entrada se queda en `indices/` para volver a enseñarlo con sólo
  quitar la llave. Hoy (octubre de 2026) están visibles sólo ACV isquémico,
  ACV hemorrágico, patología biliar y epilepsia pediátrica; el resto espera
  la reforma a la norma nueva.
- `node update_firebase_date.js --validar` comprueba los índices sin tocar
  Firebase (y dice cuántos quedan visibles); `--mostrar` imprime lo que se
  publicaría. `data/*/disponibles.json` es antiguo: la app no lo lee.

## Repositorios hermanos

- `praxis` — la app. **El contrato del formato** es
  `praxis/docs/algoritmos_json.md` (+ `algoritmo.schema.json`): qué llaves
  existen y cómo se dibujan; el de las calculadoras,
  `praxis/docs/calculadoras_json.md`. Es la fuente de verdad; ante la duda, se lee ahí
  y, si hace falta, el parser en `lib/models/algoritmo.dart` y
  `lib/features/algoritmos/modelos/contenido_nodo.dart`.
- `galgo-empirica` — la herramienta `galgo` (validar, auditar, resolver
  recortes). Su copia del contrato en `contrato/` está atrasada respecto a la
  de praxis; el hook de inicio apunta `GALGO_ESQUEMA` a la de praxis.

## Comandos

```bash
galgo validar -a <algoritmo> --nivel error   # ¿se rompe algo? (esquema, grafo, imágenes)
galgo auditar --listar -a <algoritmo>        # ¿está completo lo que hay? nota 0-100
python3 tools/norma.py [<algoritmo>]         # ¿usa todo lo que la app dibuja? nota 0-100
python3 tools/norma.py --chequeo <algoritmo> # lo que la app no denuncia y se rompe
python3 tools/calculadoras.py [<escala>]     # calculadoras: errores y nota 0-100
node tools/medios/capturar.js …              # HTML → PNG o cuadros de GIF
python3 tools/medios/armar_gif.py …          # cuadros → GIF
```

`galgo publicar` y `galgo indice` no se usan desde Claude: publican en
Firebase directamente, saltándose `indices/`.

## Reglas que no se saltan

1. **Nada clínico sin fuente.** Cada dosis, umbral, criterio o conducta sale
   de la guía, con `referencias[].texto` (cita literal, 12-30 palabras) y
   `paginas`. Nunca de memoria. Si no hay guía a mano, no se añade contenido
   clínico.
2. **Calculadoras y enlaces a otros algoritmos por URL raw completa.** Con
   nombre suelto la app busca dentro del paquete y no lo encuentra (el botón
   no abre). `tools/norma.py --hook` lo vigila tras cada edición.
3. **Los ids de nodo existentes no se renombran ni se borran**: las notas de
   los usuarios se guardan por id.
4. **Imágenes sólo propias, de la guía, o con licencia que permita uso
   comercial**, con su `creditos.json`. Ver la skill `imagenes-clinicas`.
5. **Los PDF de las guías no entran en este repositorio** (copyright). Se
   leen desde `guias-praxis` o desde el scratchpad.
6. Un marcador `TODO_EVIDENCIA:` / `TODO_IMG:` / `TODO_CALC_` / `TODO_LINK_`
   es trabajo pendiente, no un error: la app lo oculta. Se resuelve o se deja
   y se lista en el PR; nunca se rellena con algo inventado.

## Cómo se trabaja

- **La portada define.** En el nodo raíz, `titulo` es el nombre del tema y
  `texto` es la lista de definiciones explícitas y técnicas que da la guía de
  cada entidad del algoritmo (`- **Colangitis aguda:** …`): dos a cinco
  viñetas, completas pero breves, sin conducta, cada una con su cita literal
  en las `referencias` de `nodo_raiz`. Cada definición incluye, resumido, lo
  técnico que da la guía: los criterios simples (que el algoritmo desarrolla
  después), los límites de tiempo (cuándo es agudo o crónico, los minutos que
  definen un estado) y demás datos que delimitan la entidad.
- **La entradilla presenta.** `descripcion` es un párrafo natural y general
  («En este algoritmo se abordan…»): qué problema cubre, en qué contexto y qué
  partes recorre (diagnóstico, gravedad, tratamiento…), y a quién no cubre.
  Complementa las definiciones y no las repite: ni define ni enumera las
  entidades con sus criterios. **Breve: una o dos frases, unas 25-35
  palabras** (ejemplo en `NORMA.md` §1). Detalle en `NORMA.md` §1.

- Sólo sobre el algoritmo que se pide: **no se crean algoritmos JSON nuevos**.
- La marca es **Empirica** (Praxis es el nombre antiguo).

- Mejorar un algoritmo existente: skill **`mejorar-algoritmo`**. Su
  `NORMA.md` es la definición de terminado (Norma Empirica v2).
- Escalas nuevas, mejorar las que hay o conectarlas: skill
  **`crear-calculadora`**. Su `NORMA.md` es la definición de terminado de una
  calculadora (modelos tabla / fórmula / reglas, conducta con fuente en cada
  resultado); el formato está en `praxis/docs/calculadoras_json.md`. «Se usa
  en» lo calcula el workflow; no se escribe a mano.
- Imágenes, galerías y GIF: skill **`imagenes-clinicas`**. Toda imagen lleva título, pie (`descripcion`) e
  **`info`**: el texto del visor a pantalla completa, con cada flecha teñida
  con su color exacto (`{#hex:…}`). Si el `info` da cifras, criterios o
  conducta, la imagen lleva sus propias `referencias` (sólo las que respaldan
  ese texto), que el visor abre con el botón del libro.
- Revisión antes del PR: subagentes **`revisor-clinico`** (cifra por cifra
  contra la guía) y **`revisor-legibilidad`** (claridad y uso de la app).
- Estilo de redacción (octubre de 2026): cada nodo se entiende solo, también
  para un estudiante. La pill dice el dato, el `titulo` la acción, el
  `contexto` (1-2 frases) el porqué y el `texto` el cómo, en viñetas completas
  pero breves, con verbos en infinitivo y cifras en negrita. Preguntas clínicas
  completas; perlas y alertas con el porqué y qué hacer; siglas sin
  desarrollar, porque las explica el glosario (`data/glosario.json`). Frases
  sin elipsis («es mejor que…», no «mejor que…»); «infusión», no «perfusión»,
  para los fármacos; «solución salina 0,9 %» y «lactato de Ringer» (no
  «salino» ni «Ringer lactato»); secciones de una palabra («Diagnóstico»,
  «Tratamiento»); negritas también en las palabras clave de cada viñeta
  («**hipovolemia grave**»); subviñetas (dos espacios, numeradas si son pasos
  en orden) para partir las viñetas con varios pasos; «Si hay X → acción»;
  unidades de Colombia: glucosa, creatinina, BUN, calcio, fósforo y magnesio
  en **mg/dL** aunque la guía dé mmol/L (tabla de conversión en `NORMA.md` §4).
  Las fórmulas no se escriben en notación plana: se nombran y se declaran en
  `formulas` (la app las dibuja); el dato extra interesante va, con mesura, en
  `burbujas` (bombilla al final de la frase). Detalle y ejemplos en `NORMA.md` §3-§4.
- Todo en español, con tildes. Ids, nombres de archivo y carpetas en ASCII
  minúscula con guion bajo.
