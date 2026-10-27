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
- `node update_firebase_date.js --validar` comprueba los índices sin tocar
  Firebase. `data/*/disponibles.json` es antiguo: la app no lo lee.

## Repositorios hermanos

- `praxis` — la app. **El contrato del formato** es
  `praxis/docs/algoritmos_json.md` (+ `algoritmo.schema.json`): qué llaves
  existen y cómo se dibujan. Es la fuente de verdad; ante la duda, se lee ahí
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
  entidades con sus criterios. Detalle en `NORMA.md` §1.

- Sólo sobre el algoritmo que se pide: **no se crean algoritmos JSON nuevos**.
- La marca es **Empirica** (Praxis es el nombre antiguo).

- Mejorar un algoritmo existente: skill **`mejorar-algoritmo`**. Su
  `NORMA.md` es la definición de terminado (Norma Empirica v2).
- Escalas nuevas o conectar las que ya hay: skill **`crear-calculadora`**.
- Imágenes, galerías y GIF: skill **`imagenes-clinicas`**.
- Revisión antes del PR: subagentes **`revisor-clinico`** (cifra por cifra
  contra la guía) y **`revisor-legibilidad`** (claridad y uso de la app).
- Estilo de redacción: nota de guardia, telegráfico, imperativo y con las
  cifras delante; el contrato completo está en `galgo/plantillas.py`
  (`ESTILO`) de `galgo-empirica`.
- Todo en español, con tildes. Ids, nombres de archivo y carpetas en ASCII
  minúscula con guion bajo.
