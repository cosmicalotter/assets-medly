---
name: imagenes-clinicas
description: Añade imágenes, galerías y GIF a los nodos de un algoritmo de Empirica — ilustraciones y animaciones propias hechas con tools/medios, figuras de la guía y fotos clínicas con licencia que permite uso comercial — con su ruta, nombre, peso y crédito correctos. Usar al enriquecer un algoritmo con imágenes o GIF, o cuando se pida una ilustración, animación, esquema o foto para un nodo.
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

1. **Propias**, dibujadas en HTML/SVG y convertidas con `tools/medios`. Sin
   problema de licencia y con el aspecto de Empirica. Sirven para esquemas,
   técnicas, secuencias, clasificaciones, algoritmos visuales y animaciones.
2. **Figuras de la guía**: `galgo generar` y `galgo resolver` las recortan
   del PDF. Su uso es responsabilidad del titular (ver `AVISO.md` de galgo).
3. **Fotos clínicas de terceros** sólo con licencia que permita uso
   comercial (Empirica tiene suscripción): dominio público, CC0, CC BY,
   CC BY-SA. Fuentes habituales: Wikimedia Commons, CDC Public Health Image
   Library (sólo las marcadas de dominio público), figuras CC BY de artículos
   de PubMed Central. **No**: CC BY-NC, CC BY-ND, Radiopaedia, DermNet,
   materiales OMS/OPS con licencia NC, ni capturas de Google Imágenes.
4. Nunca una imagen generada por IA presentada como foto clínica real.

Si la red de la sesión no deja descargar de la fuente, no se sustituye por
otra cosa: se anota en el PR la URL exacta y el nodo, para descargarla a mano.

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

La app no lee SVG. Se descarga con datos móviles: si pesa más, se reduce.

## Nombre, carpeta y conexión

- Carpeta: `data/imagenes/algoritmo/<carpeta_imagenes>/`. Si el algoritmo
  no declara `carpeta_imagenes`, se añade (igual que su `carpeta_evidencia`).
  Lo que comparten varios algoritmos va en `data/imagenes/algoritmo/comun/`
  y se nombra `comun/<archivo>`.
- Nombre: `<tema>_<qué>.<ext>` en minúsculas ASCII con guion bajo:
  `sepsis_llenado_capilar.gif`, `neumoped_tiraje_subcostal.jpg`.
- En el nodo, siempre `media` con título y pie que diga **qué mirar**:

```json
"media": [
  { "recurso": "sepsis_llenado_capilar.gif",
    "titulo": "Llenado capilar",
    "descripcion": "Presionar 5 s el lecho ungueal y contar: **>2 s** es hipoperfusión." },
  { "recurso": "sepsis_piel_moteada.jpg",
    "titulo": "Piel moteada en rodillas",
    "descripcion": "Signo de hipoperfusión. Foto: Autor, CC BY 4.0." }
]
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
`"fuente"` si se guarda; las de la guía con `"origen": "guia"` y la página.
Con CC BY y CC BY-SA, el crédito corto va también en `descripcion`.
