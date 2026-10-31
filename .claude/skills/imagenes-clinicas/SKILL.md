---
name: imagenes-clinicas
description: Añade imágenes, galerías y GIF a los nodos de un algoritmo de Empirica — primero figuras de la guía y fotos de internet con licencia que permite uso comercial, editadas y animadas (traducir, señalar, trazar, colorear, zoom), y si no hay, ilustraciones propias hechas con tools/medios — con su ruta, nombre, peso y crédito correctos. Usar al enriquecer un algoritmo con imágenes o GIF, o cuando se pida una ilustración, animación, esquema o foto para un nodo.
argument-hint: "<algoritmo> [nodo]"
---

# Imágenes y GIF en los nodos

La meta es que recorrer el algoritmo se parezca a ver al paciente: lo que se
explora, lo que se ve en la imagen, cómo se hace la técnica. Una imagen entra
si ayuda a **decidir o a hacer** algo en ese paso; si sólo adorna, no.

## Dónde van

- Nodos de exploración física, signos, técnicas y procedimientos, imagen
  diagnóstica (Rx, ECO, TC), ECG, lesiones, dispositivos (inhaladores,
  sondas), y secuencias de un protocolo.
- **Galería** (`media` con 2-4 elementos) cuando hay que comparar: normal vs
  patológico, grados de una clasificación, hallazgos que se confunden.
- **GIF** cuando algo se mueve: la técnica, la maniobra, el signo dinámico
  (tiraje, llenado capilar), la cuenta atrás de un protocolo.
- Meta: 1 de cada 4 nodos clínicos con imagen y al menos 1 GIF si el tema
  lo tiene (`python3 tools/norma.py <algoritmo>` lo mide y lista los nodos
  que hablan de algo visible y no lo enseñan).

## De dónde salen, por orden de preferencia

Primero una **imagen real** (de la guía o de internet, con licencia que
permita el uso comercial: Empirica se vende por suscripción), y **editada**;
el dibujo propio desde cero va después.

1. **Figuras de la propia guía, si su licencia lo permite.** Es la fuente
   que ya cita el nodo. Antes de usarla, leer la licencia en la primera
   página del PDF:
   - **Sí**: "Open Access … Creative Commons Attribution 4.0" (CC BY) o
     CC BY-SA, dominio público, o permiso escrito del titular guardado.
     Se recorta del PDF a resolución nativa (`pymupdf`, `get_pixmap(clip=…)`)
     y se guarda el original en `tools/medios/figuras/<carpeta>/fuentes/`.
   - **No**: © de editorial sin licencia CC (Wiley, Elsevier, Thieme,
     Springer o Wolters Kluwer sin acceso abierto, sociedades como ASGE o
     SAGES), "Free access" (gratis de leer no es licencia), CC BY-NC y
     CC BY-ND. Tampoco, dentro de una guía CC BY, la figura o tabla con
     línea de crédito de un tercero ("reproduced with permission from",
     "modified from", "adapted from"): la licencia la excluye.
   - Si la figura buena tiene © y no hay permiso: se busca una real libre
     (punto 2) o se dibuja una propia basada en ella (punto 3, "Basado en …,
     Fig. N" en el pie), y se anota en el PR qué figura y de qué editorial
     pedir permiso (p. ej. RightsLink).
   - Una tabla de puro texto no se pega como imagen: se pasa a `tabla`.
2. **Imágenes de internet con licencia comercial**: dominio público, CC0,
   CC BY, CC BY-SA. Fuentes habituales: Wikimedia Commons, CDC Public Health
   Image Library (sólo las marcadas de dominio público), figuras CC BY de
   artículos de PubMed Central. **No**: CC BY-NC, CC BY-ND, Radiopaedia,
   DermNet, materiales OMS/OPS con licencia NC, ni capturas de Google
   Imágenes.
3. **Propias**, dibujadas en HTML/SVG con `tools/medios`, cuando no hay
   imagen real que sirva: esquemas, técnicas, secuencias, clasificaciones.
4. Nunca una imagen generada por IA presentada como foto clínica real.

**Las imágenes de los puntos 1 y 2 no se pegan tal cual: se editan**, y si
hay un recorrido que contar, se animan en GIF (ver "Editar y animar una
imagen real"). Todo lo que se añade encima (rótulos, cifras) cumple las
mismas reglas que el texto: en español y con fuente.

Licencias ya comprobadas (octubre de 2026):

| guía | licencia | figuras |
|---|---|---|
| WSES (World J Emerg Surg, BMC/Springer Nature) | CC BY 4.0 | sí, con crédito |
| Guías de Tokio 2018 (J Hepatobiliary Pancreat Sci, Wiley) | © JSHBPS | no sin permiso |
| ASGE (Gastrointest Endosc, Elsevier) | © ASGE | no sin permiso |
| ESGE (Endoscopy, Thieme) | © Thieme | no sin permiso |
| SAGES 2020 (Surg Endosc, Springer) | © SAGES y Wolters Kluwer | no sin permiso |

Si la red de la sesión no deja descargar de la fuente, no se sustituye por
otra cosa: se anota en el PR la URL exacta y el nodo, para descargarla a mano.

## Editar y animar una imagen real

Se hace igual que una ilustración propia (HTML + `window.cuadro(i, n)` →
`capturar.js` → `armar_gif.py`), con la imagen real de fondo y todo lo demás
encima. Repertorio, y cuanto más se use mejor, mientras cada edición enseñe
algo:

- **Tapar** lo que estorba del original: flechas, letras, rótulos en
  inglés (polígonos del color del fondo).
- **Traducir en el sitio**: redibujar cada caja o rombo con su relleno y
  borde y escribir el texto en español encima, con leyenda y definiciones
  incluidas. La geometría de las cajas sale del PDF (`page.get_drawings()`,
  rellenos y rectángulos) y los colores, de muestrear la imagen.
- **Señalar**: contornos, círculos que laten, flechas, puntas de calibre;
  sólo lo que el original no señala ya (ver «Señaladores del original»).
- **Trazar** estructuras (un conducto, un vaso, un borde) con un trazo que
  se dibuja solo (`stroke-dashoffset`). Para que caiga encima de verdad, la
  línea media se mide sobre el brillo de la imagen, no a ojo.
- **Colorear**: velos y rellenos translúcidos por zona, y realce del camino
  recorrido (intenso el paso actual, tenue lo ya visto, un color por rama).
- **Cámara**: zoom y paneo al detalle (cambiar el `viewBox` del SVG o un
  `transform` CSS), y vuelta a la vista completa al final.
- **Rótulos y pasos**: una barra con el paso actual y su número, o una
  lista de pasos que se va encendiendo; tarjeta final con la conducta.

### Señaladores del original: se usan, no se duplican

Si la foto o figura original **ya trae flechas, recuadros o círculos** que
señalan el hallazgo, **no se añade otro señalador encima** (ni anillo, ni
elipse, ni flecha propia sobre lo mismo). Se usan los del original y se
citan: en la leyenda de la imagen y en el `info`, con su color exacto medido
(`colores_imagen.py`): «**Flechas rojas** (del original): sangre en las
cisternas». Lo más que se pone encima es un **rótulo en español sin forma**
junto a la flecha original (`marcas: [{…, solo: true, t: "T picudas", tx, ty, c}]`
en `foto.js`), del mismo color que ella, o se traduce el rótulo en inglés
que traiga el original.

Sólo se dibuja un señalador propio para algo que el original **no** señala.
Si se prefiere el señalador propio (porque el original es confuso), se
borran antes los del original (`borrar_rotulos.py`): nunca quedan los dos a
la vez.

### Foto o figura real rotulada: el formato de la casa

Para una imagen fija real (TC, ECG, foto clínica, figura CC BY) el formato es
el lienzo de Empirica de `foto.js` + `base.js` (copiarlos de
`tools/medios/figuras/crisishiperglicemica/`), con la función
`fotos({ titulo, sub, paneles, notas, fuente })`:

- **Título y subtítulo dentro de la imagen**: qué es y qué se ve, en una línea
  cada uno.
- **La imagen original**, recortada a lo que importa (uno o varios
  `paneles` con `recorte` y `rotulo`: «Coronal», «Ojo izquierdo»), con sus
  señaladores originales y, si hacen falta, rótulos en español (`solo: true`)
  o rótulos en inglés traducidos (`tapar` + `textos`).
- **Leyenda debajo** (`notas`): una caja por señalador, con un punto de su
  color exacto, el nombre en negrita y entre paréntesis «(del original)» si
  lo trae la fuente: `["#EB1C24", "<b>Flechas rojas</b> (del original): …"]`.
  Una caja más, con punto gris (`#64748B`), puede dar la conducta que cambia
  esa imagen («Potasio >5,0 mmol/L: insulina sin potasio»). Para un
  señalador blanco o negro, el punto va en gris (`#94A3B8`).
- **Crédito** en la línea de fuente: autor o revista, año, licencia y
  «Rotulada por Empirica» si se añadió algo.
- La leyenda no debe cortarse: si no cabe, se baja `alto` del panel y se
  comprueba con `solapes.js` y mirando el PNG.

Ejemplos: `crisishiperglicemica/hiperk.html`, `hipok.html`, `edema.html`;
`cefaleassecundarias/hsa.html`, `racimos.html`.

Coordenadas: el SVG usa las de la imagen original (`viewBox="0 0 ancho alto"`),
así los trazos no se mueven al hacer zoom; el grosor y el tamaño de letra se
escalan con el zoom para verse siempre igual. Antes de dibujar, sacar una
copia con cuadrícula (cada 50 px) y ampliar las zonas finas para medir.

Ritmo: **≥2,5 s** por rótulo; transiciones de 2-3 cuadros y pausas largas
(`armar_gif.py` funde los cuadros repetidos, así que las pausas no pesan).

Plantillas hechas (patología biliar, `tools/medios/figuras/biliar/`):

| archivo | qué hace |
|---|---|
| `colangiorm_coledocolitiasis.html` | foto de Commons: tapa flechas, traza la vía biliar medida, lista de pasos, zoom a los cálculos, tarjeta final |
| `wses_es.js` + `wses_flujo_es.html` | figura de la guía traducida al español encima del original (PNG fijo) |
| `wses_recorrido.html` | la misma figura recorrida con cámara (demostración: un flujograma de la guía ya no va en los nodos, sino fijo en las fuentes) |
| `recorrido.js` | **motor común**: escenas con imagen real, pasos con cámara, flechas, anillos, calibres y tarjeta final; ver `murphy_real.html`, `eco_real.html`, `cvs_real.html`, `cpre_real.html` |
| `drenaje_real.html`, `coledoco_eco_real.html` | foto real rotulada + tarjetas de texto (imagen fija) |

Para borrar rótulos, flechas o datos del paciente de la imagen original sin
dejar cuadros negros: `python3 tools/medios/borrar_rotulos.py entrada salida
--caja x0,y0,x1,y1 [--linea x1,y1,x2,y2] [--rojo] [--recorte …] [--ancho …]`
(rellena con el tejido de alrededor; necesita `opencv-python-headless`). Los
rótulos nuevos van en el mismo sitio que los borrados, que tapan la mancha.
Siempre se borra un número de registro o nombre de paciente que traiga la imagen.

Si la imagen es casi toda gris (ecografía, foto antigua), armar el GIF con
`--colores 256`: con la paleta común los rojos y amarillos salen marrones.
Las fotos clínicas se buscan también en artículos CC BY de PubMed Central
(Cureus, BMC, Frontiers…; ojo, Baishideng y otras son CC BY-NC): la figura se
baja de `cdn.ncbi.nlm.nih.gov/pmc/blobs/…` (aparece en el HTML del artículo).
Desde la nube, Commons sirve imágenes por `commons.wikimedia.org/w/thumb.php?f=<archivo>&w=<ancho>`
cuando `upload.wikimedia.org` responde 429.

Crédito de lo editado: en `creditos.json`, `"cambios"` dice qué se tapó,
tradujo o añadió y qué HTML lo genera. Con CC BY-SA la obra derivada se
comparte con la misma licencia; con CC BY basta indicar los cambios. El
crédito visible (autor, licencia, "editada por Empirica") va **dentro de la
imagen**: en la línea de fuente del lienzo si es una figura nuestra, o en una
franja al pie si es una foto que sólo se recorta o se rotula:

```bash
python3 tools/medios/franja_credito.py fuentes/original.jpg data/imagenes/algoritmo/<carpeta>/<nombre>.jpg \
    "Imagen: Autor, Wikimedia Commons, CC BY-SA 4.0. Editada por Empirica."
```

La franja se pone siempre sobre el original guardado en `fuentes/` (nunca
sobre una salida que ya la tiene), y una figura que dibuja encima de la foto
lee el original de `fuentes/`, no la imagen de `data/` con franja: si no, la
foto cambia de tamaño y lo que tapa las flechas originales deja de taparlas.
El pie del nodo **no repite el crédito**.

### La línea de fuente nunca queda tapada

`base.js` deja el cuerpo de la figura en una columna flexible (`.cuerpo`) y la
fuente al final, en su propia franja blanca (`.fuente`): el contenido no puede
bajar hasta ella. Aun así, en un lienzo de 720×540 con título, subtítulo y
fuente, un visor de foto mide **≤388 px de alto** (`recorrido.js` usa
`VISOR = [390, 388]`). Antes de capturar:

```bash
node tools/medios/solapes.js tools/medios/figuras/<carpeta>/*.html   # sale con 1 si algo pisa la fuente
```

Cada carpeta de figuras lleva un `regenerar.sh` que rehace todas sus
imágenes (PNG, JPG y GIF con sus cuadros, tiempos y colores); ver
`tools/medios/figuras/biliar/regenerar.sh`. Si se cambia `base.js` o
`recorrido.js`, se regenera todo y se mira de nuevo.

## Hacer una ilustración o un GIF propio

```bash
cp .claude/skills/imagenes-clinicas/plantilla_animacion.html "$SCRATCH/fig.html"
# editar el dibujo y window.cuadro(i, total)

# imagen fija
node tools/medios/capturar.js "$SCRATCH/fig.html" data/imagenes/algoritmo/<carpeta>/<nombre>.png

# GIF
node tools/medios/capturar.js "$SCRATCH/fig.html" "$SCRATCH/cuadros" --cuadros 30
~/.cache/galgo-venv/bin/python tools/medios/armar_gif.py "$SCRATCH/cuadros" data/imagenes/algoritmo/<carpeta>/<nombre>.gif
```

Reglas de la plantilla: 720×540, fondo blanco, los tonos del contrato (teal
`#18B9A9`, rojo `#EF5454`, ámbar `#F2A23A`, verde `#2FB36D`, azul
`#4F8CF6`), rótulos en español, cifras en negrita, un mensaje por imagen.
Toda cifra que aparezca dibujada sale de la guía, igual que en el texto.

**Mira siempre el resultado** (`Read` sobre el PNG, o sobre unos cuadros del
GIF) antes de conectarlo: textos cortados, solapes, colores que no se leen.

## Peso y formato

| | formato | tope |
|---|---|---|
| esquema o ilustración | PNG | 300 KB |
| foto | JPG o WebP, lado largo ≤1280 px | 300 KB |
| GIF | 720 px de ancho, 3-8 s, en bucle | 2 MB |

Las figuras HTML se diseñan a 720×540 pero se **guardan a 1440×1080** (lo que da
`capturar.js` con `--escala 2`): nunca se reducen a 720, porque en pantallas
retina la app las amplía y se ven borrosas. JPG con `quality=88, subsampling=0`
(sin submuestreo de color, para que el texto no se emborrone).

La app no lee SVG. Se descarga con datos móviles: si pesa más, se reduce.

## Nombre, carpeta y conexión

- Carpeta: `data/imagenes/algoritmo/<carpeta_imagenes>/`. Si el algoritmo
  no declara `carpeta_imagenes`, se añade (igual que su `carpeta_evidencia`).
  Lo que comparten varios algoritmos va en `data/imagenes/algoritmo/comun/`
  y se nombra `comun/<archivo>`.
- Nombre: `<tema>_<qué>.<ext>` en minúsculas ASCII con guion bajo:
  `sepsis_llenado_capilar.gif`, `neumoped_tiraje_subcostal.jpg`.
- **Toda imagen lleva su título escrito dentro** (cabecera de `base.js`; a
  una foto, `franja_credito.py --titulo … --subtitulo …`).
- **Los flujogramas de la guía que repiten el algoritmo no van en `media`**
  (y nunca como GIF): van fijos en las fuentes del paso, como
  `referencias[].imagen_evidencia` con la URL raw completa.
- En el nodo, siempre `media` con título, `info` (ver «Texto de información») y pie (`descripcion`) **breve (≤18
  palabras)** que diga **qué se ve**. La app nueva acepta también `pie`, pero las versiones ya
  instaladas sólo leen `descripcion`: se usa esa. La app lo dibuja como pie de
  foto: una franja algo más oscura, fundida bajo la imagen. Sin crédito: ya
  va dentro de la imagen.
- Para que el texto del nodo lleve a la imagen, `en_texto` con la frase tal
  como aparece en el texto (da igual mayúscula o minúscula; palabra entera): la app la
  subraya, la tiñe un poco y le pone un icono pequeño de imagen; al tocarla
  abre la imagen o el GIF (el visor de GIF tiene pausa, cuadro a cuadro y
  barra). **Nunca "(GIF)" ni "(ver imagen)" en el texto.**
  `python3 tools/norma.py --chequeo` avisa si la frase no está.

```json
"texto": "Explorar el llenado capilar en el lecho ungueal.",
"media": [
  { "recurso": "sepsis_llenado_capilar.gif",
    "titulo": "Llenado capilar",
    "descripcion": "Presionar 5 s el lecho ungueal y contar: **>2 s** es hipoperfusión.",
    "en_texto": "llenado capilar" },
  { "recurso": "sepsis_piel_moteada.jpg",
    "titulo": "Piel moteada en rodillas",
    "descripcion": "Signo de hipoperfusión: manchas violáceas en rodillas." }
]
```

## Texto de información (`info`)

Toda imagen de `media` lleva, además del pie, un **`info`**: el texto que la
app enseña al abrir la imagen a pantalla completa, en una franja oscura
transparente abajo (arriba va otra franja igual con el título y la X).

- **Qué dice:** qué se ve y qué señala cada flecha, círculo o rótulo, con su
  significado, y lo que conviene saber de esa imagen (un dato que la
  distingue, una trampa, qué cambia la conducta), dicho sin anunciarlo como
  «perla». No repite el pie del nodo ni el título ni el texto de la tarjeta:
  añade lo que ellos no dicen. Nada genérico («imagen ilustrativa de…»).
- **Forma:** un solo párrafo, sin saltos de línea ni viñetas, **25-50
  palabras** (2-3 frases). Cifras delante y en `**negrita**` (la app la pinta
  en blanco pleno, sin color). Sin crédito ni licencia.
- **Colores:** cada flecha o marca que se nombra va teñida con **su color
  exacto**: `{#11B1ED:Flecha azul}: hematoma lobar`. El hex sale de la fuente,
  nunca a ojo:
  - figura propia: la constante del HTML en `tools/medios/figuras/<carpeta>/`
    (`const A = "#FDE047"` → `{#FDE047:flecha amarilla}`);
  - flecha que ya traía la foto original, o PNG sin HTML:
    `python3 tools/medios/colores_imagen.py <imagen>` (mediana de los píxeles
    de ese color; en GIF, el último cuadro). Se nombra como del original:
    `{#EB1C24:Flechas rojas} del original: …`, y no se le suma un señalador
    propio sobre lo mismo (ver «Señaladores del original»).
  - Los nombres de la paleta de la app (`amarillo`, `teal`, `rojo`,
    `verde`, `azul`…, ver `docs/algoritmos_json.md` de praxis) sólo si el
    dibujo usa ese mismo hex. Un nombre que la app no conoce se ve con llaves:
    `python3 tools/norma.py --chequeo` lo denuncia.
  - Sólo se tiñe lo que tiene color en la imagen; lo blanco o negro va en
    `**negrita**` («**Flecha negra**: …»).
- **Fuente:** lo clínico del `info` sale de la guía como todo lo demás: de lo
  que el algoritmo ya cita en ese nodo o en otro, o de la propia figura y su
  artículo. Si no hay fuente, el `info` se queda en describir lo que se ve.
- **Referencias del `info` (`media[].referencias`):** si el `info` afirma
  una cifra, un criterio o una conducta («en la cerebelosa, **≥15 mL** es
  criterio de cirugía»), la imagen lleva sus propias `referencias`: **sólo
  las que respaldan lo que dice ese texto**, no todas las del nodo. Son copia
  exacta de referencias que el algoritmo ya cita (mismo `texto`, `paginas`,
  `fuente`…), con `imagen_evidencia` por **URL raw completa**
  (`…/data/imagenes/evidencia/<carpeta_evidencia>/<archivo>`), porque el
  visor no conoce la carpeta. La app pone junto a la X del visor un botón con
  un libro abierto y el número de fuentes, que abre la hoja de referencias
  con ésas. Un `info` que sólo describe lo que se ve no lleva. `norma.py`
  avisa de un `info` con cifras en negrita y sin `referencias`; `--chequeo`,
  de un `imagen_evidencia` sin URL completa.

```json
{ "recurso": "acvhemorragico_mav_real.jpg",
  "titulo": "Causa macrovascular: malformación arteriovenosa",
  "descripcion": "Hematoma lobar en la TC y la malformación que sangró en la arteriografía.",
  "info": "{#FCFD01:Flechas amarillas}: en la TC, el hematoma lobar frontal; en la arteriografía, el nido de la MAV, ovillo de vasos que se llena de contraste con sus arterias nutricias. Si la angio-TC la sugiere, la **DSA** va lo antes posible; con sangre **solo intraventricular**, directa.",
  "en_texto": "malformación arteriovenosa",
  "referencias": [
    { "titulo": "Recomendación 4.2.3 (Clase 1, C-LD)", "paginas": "e295",
      "texto": "catheter intra-arterial DSA should be performed as soon as possible to confirm and manage underlying intracranial vascular malformations",
      "fuente": "AHA/ASA", "anio": "2022", "url": "https://doi.org/10.1161/STR.0000000000000407",
      "imagen_evidencia": "https://raw.githubusercontent.com/cosmicalotter/assets-medly/main/data/imagenes/evidencia/acvhemorragico/evidencia_acvhemorragico_page295_recomendacion_4_2_3.png" }
  ] }
```

## Créditos

Cada carpeta de imágenes con material que no es propio lleva un
`creditos.json` (galgo y la app lo ignoran; es el registro de licencias):

```json
{
  "sepsis_piel_moteada.jpg": {
    "origen": "tercero",
    "autor": "Nombre del autor",
    "fuente": "https://commons.wikimedia.org/wiki/File:...",
    "licencia": "CC BY 4.0",
    "cambios": "recortada y reducida a 1280 px"
  }
}
```

Las propias se registran con `"origen": "propia"` y el HTML de origen en
`"fuente"` si se guarda; las de la guía con `"origen": "guia"`, la cita, la
figura y la página en `"fuente"`, y su `"licencia"` (sin licencia que permita
el uso comercial, no entran).
Con CC BY y CC BY-SA, el crédito corto va también **dentro de la imagen**
(línea de fuente o `franja_credito.py`), no en el pie del nodo.
