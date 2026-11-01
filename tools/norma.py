#!/usr/bin/env python3
"""Norma Empirica v2: lo que el auditor de galgo todavía no mide.

`galgo auditar` contesta si lo que ya hay está completo: la dosis con su
pastilla, la pregunta en cada decisión, la escala conectada, los recortes de
la guía. Esto contesta la otra mitad de la norma: si el algoritmo usa las
herramientas que la app ya sabe dibujar y que casi ningún algoritmo usa
todavía —listas de criterios, alertas, perlas, grado de evidencia, dosis por
peso, imágenes y GIF, enlaces a otros algoritmos, portada—.

Las dos notas se leen juntas: la de galgo es el suelo (que no falte nada de
lo que hay), la de aquí es el techo (que se use todo lo que la app ofrece).

Uso:
  python3 tools/norma.py                       tablero de todos, lo peor primero
  python3 tools/norma.py Adultos/sepsis.json   detalle de uno, con qué le falta
  python3 tools/norma.py --md                  la tabla en Markdown, para un PR
  python3 tools/norma.py --json                para otro script
  python3 tools/norma.py --chequeo RUTA        lo que rompe en la app; sale con 1
  python3 tools/norma.py --vocabulario [RUTA]  español de España que se cuela
  python3 tools/norma.py --vocabulario RUTA --corregir
                                               aplica los cambios seguros (no
                                               toca citas ni el formato)
  python3 tools/norma.py --hook                lo mismo, leyendo el evento de
                                               Claude Code por stdin

Sin dependencias: sólo la biblioteca estándar.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
DATA = RAIZ / "data"
CATEGORIAS = ("Adultos", "Pediatria")
BASE_RAW = "https://raw.githubusercontent.com/cosmicalotter/assets-medly/main/data/"
IMAGENES = ("imagen", "imagen_clinica")
GALERIAS = ("media", "imagenes")

#: Las metas de la norma. Se ajustan aquí y en NORMA.md a la vez.
METAS = {
    "perlas": 0.25,          # nodos clínicos con nota_adicional
    "imagenes": 0.25,        # nodos clínicos con al menos una imagen que se ve
    "nodos_por_checklist": 12,
    "nodos_por_alerta": 10,
    "nodos_por_evidencia": 8,
    "enlaces_fuera": 2,      # a otro algoritmo o a una calculadora
    "palabras_visibles": 90, # contexto + texto + alertas de un nodo (60-70 es lo normal)
    "palabras_contexto": 25,
}

#: Peso de cada dimensión en la nota. Una dimensión que no aplica no cuenta.
PESOS = {
    "portada": 1.0,
    "criterios": 1.5,
    "alertas": 1.0,
    "perlas": 1.0,
    "evidencia": 1.0,
    "dosis_kg": 1.0,
    "imagenes": 1.5,
    "gif": 0.5,
    "conexiones": 1.0,
}

ROTULOS = {
    "portada": "Portada",
    "criterios": "Checklist",
    "alertas": "Alertas",
    "perlas": "Perlas",
    "evidencia": "Grado",
    "dosis_kg": "Por kg",
    "imagenes": "Imágenes",
    "gif": "GIF",
    "conexiones": "Enlaces",
}

_POR_KG = re.compile(r"/\s*kg", re.I)
_VINETA = re.compile(r"^\s*(-|\d+\.)\s", re.M)
_CRITERIOS = re.compile(r"criterio|indicaci[oó]n de|signos de alarma|ingreso|alta|intubaci[oó]n|uci\b", re.I)
_PIE_CON_CREDITO = re.compile(
    r"\bCC[ -]?(BY|0)\b|wikimedia|commons|dominio p[uú]blico|licencia|editada por|"
    r"^\s*(imagen|foto|figura|fuente)\s*:", re.I | re.M,
)
# `media[].info`: colores que el visor de la app sabe pintar (`kColoresInfo`
# en praxis, media_nodo_widget.dart). Un nombre que no esté aquí se ve en
# crudo, con sus llaves.
COLORES_INFO = {"teal", "turquesa", "amarillo", "rojo", "rosa", "azul", "celeste",
                "ambar", "naranja", "verde", "violeta", "blanco"}
_COLOR_INFO = re.compile(r"\{([^{}:]+):[^{}]+\}")
# Un `info` con una cifra en negrita afirma un criterio o una dosis: lleva
# sus `referencias` para el botón del libro del visor.
_CIFRA_EN_NEGRITA = re.compile(r"\*\*[^*]*\d[^*]*\*\*")

_AVISO_DE_MEDIO = re.compile(r"\((gif|imagen|foto|video|ver imagen)\)", re.I)
_VISUAL = re.compile(
    r"exploraci[oó]n|examen f[ií]sico|signo de|t[eé]cnica|radiograf|ecograf|\btc\b|tomograf|"
    r"\becg\b|electrocardiograma|lesi[oó]n|exantema|otoscop|fondo de ojo|tiraje|pliegue|"
    r"punci[oó]n|maniobra|intubaci[oó]n|cat[eé]ter|sonda|inhalador|espaciador",
    re.I,
)


# --- lectura -----------------------------------------------------------------


def es_url(valor: str) -> bool:
    return valor.startswith(("http://", "https://"))


def es_pendiente(valor: str) -> bool:
    return "TODO" in valor


def opciones(nodo: dict) -> list[dict]:
    return [o for o in nodo.get("opciones") or [] if isinstance(o, dict)]


def destino(opcion: dict) -> str:
    return opcion.get("siguiente_nodo") or opcion.get("siguienteNodo") or ""


def entradas(alg: dict) -> list[str]:
    for llave in ("nodos_iniciales", "nodosIniciales", "nodo_inicial", "nodoInicial"):
        valor = alg.get(llave)
        if valor:
            return [valor] if isinstance(valor, str) else list(valor)
    return []


def es_portada(nid: str, nodo: dict, raices: set[str]) -> bool:
    estilo = (nodo.get("estilo") or "").lower()
    return nid in raices or estilo in ("rama", "seccion")


def imagenes_de(nodo: dict) -> list[str]:
    rutas = [nodo[k] for k in IMAGENES if isinstance(nodo.get(k), str)]
    for llave in GALERIAS:
        for m in nodo.get(llave) or []:
            if isinstance(m, str):
                rutas.append(m)
            elif isinstance(m, dict):
                rutas.append(m.get("recurso") or m.get("url") or m.get("imagen") or "")
    return [r for r in rutas if r]


def ruta_imagen(ruta: str, carpeta: str) -> Path | None:
    """§4 del contrato: dónde está en disco una imagen de nodo, o None si es remota."""
    if es_url(ruta) or ruta.startswith("assets/"):
        return None
    base = DATA / "imagenes" / "algoritmo"
    return base / ruta if "/" in ruta else base / carpeta / ruta


def calculadora(nodo: dict) -> str:
    valor = nodo.get("calculadora") or nodo.get("calculadora_id") or nodo.get("calculadoraId")
    if isinstance(valor, dict):
        return valor.get("archivo") or valor.get("id") or ""
    return valor or ""


def enlaces(nodo: dict) -> list[dict]:
    return [e for e in nodo.get("enlaces") or [] if isinstance(e, dict)]


def destino_enlace(enl: dict) -> str:
    return enl.get("archivo_objetivo") or enl.get("archivo") or enl.get("url") or ""


def farmacos(nodo: dict) -> list[dict]:
    for llave in ("farmacos", "medicamentos", "dosis"):
        valor = nodo.get(llave)
        if isinstance(valor, list):
            return [f for f in valor if isinstance(f, dict)]
    return []


def media_de(nodo: dict) -> list[dict]:
    return [m for llave in GALERIAS for m in nodo.get(llave) or [] if isinstance(m, dict)]


def frases_en_texto(m: dict) -> list[str]:
    valor = m.get("en_texto") or m.get("enTexto") or []
    return [valor] if isinstance(valor, str) else [f for f in valor if isinstance(f, str)]


def textos_visibles(valor, fuera=("media", "imagenes", "referencias", "evidencia")) -> list[str]:
    """Las cadenas del nodo que se leen en la tarjeta (sin media ni citas)."""
    if isinstance(valor, str):
        return [valor]
    if isinstance(valor, list):
        return [t for v in valor for t in textos_visibles(v, fuera)]
    if isinstance(valor, dict):
        return [t for k, v in valor.items() if k not in fuera for t in textos_visibles(v, fuera)]
    return []


def contiene_palabra(texto: str, frase: str) -> bool:
    """Como la app: sin mayúsculas y con la frase entera, no dentro de otra palabra."""
    return re.search(rf"(?<![\w]){re.escape(frase.lower())}(?![\w])", texto.lower()) is not None


def secciones_hogar(alg: dict) -> dict[str, str]:
    """Sección de cada nodo: la primera del camino más corto desde la raíz,
    si las ramas de la raíz son secciones (estilo rama o seccion)."""
    nodos = alg.get("nodos") or {}
    hogar: dict[str, str] = {}
    cola: list[str] = []
    for raiz in entradas(alg):
        for o in opciones(nodos.get(raiz) or {}):
            sec = destino(o)
            estilo = ((nodos.get(sec) or {}).get("estilo") or "").lower()
            if sec in nodos and estilo in ("rama", "seccion") and sec not in hogar:
                hogar[sec] = sec
                cola.append(sec)
    while cola:
        actual = cola.pop(0)
        for o in opciones(nodos.get(actual) or {}):
            sig = destino(o)
            if sig in nodos and sig not in hogar and sig not in entradas(alg):
                hogar[sig] = hogar[actual]
                cola.append(sig)
    return hogar


# --- vocabulario: español de Colombia ----------------------------------------
#
# La app es colombiana y muchas guías (GEMA, JBDS traducidas, apuntes) llegan
# con el español de España. Cada entrada: el patrón, el cambio y por qué. Con
# `cambio` se aplica sola (`--corregir`); con `None` depende de la frase y
# sólo se avisa. Nunca se toca una cita literal (`referencias`), ni ids ni URL.
VOCABULARIO: list[tuple[str, str | None, str]] = [
    (r"cloruro potásico", "cloruro de potasio", "en Colombia, «de potasio»"),
    (r"fosfato potásico", "fosfato de potasio", "en Colombia, «de potasio»"),
    (r"bicarbonato sódico", "bicarbonato de sodio", "en Colombia, «de sodio»"),
    (r"valproato sódico", "valproato de sodio", "en Colombia, «de sodio»"),
    (r"paracetamol", "acetaminofén", "nombre de uso en Colombia"),
    (r"metamizol", "dipirona", "nombre de uso en Colombia"),
    (r"amoxicilina-clavulánico", "amoxicilina-clavulanato", "nombre de uso en Colombia"),
    (r"amoxicilina/clavulánico", "amoxicilina/clavulanato", "nombre de uso en Colombia"),
    (r"(?:suero|salino) hipertónico", "solución salina hipertónica", "norma: «solución salina»"),
    (r"salino 0,9", "solución salina 0,9", "norma: «solución salina 0,9 %»"),
    (r"suero salino", "solución salina", "norma: «solución salina»"),
    (r"paritorio", "sala de partos", "en Colombia, «sala de partos»"),
    (r"médico sénior", "especialista", "en Colombia, «especialista»"),
    (r"derivar(á|án|lo|la|los|las)?\b", r"remitir\1", "en Colombia se «remite» al especialista"),
    (r"ictus", "ACV", "en Colombia, «ACV»"),
    (r"gasometría venosa", "gases venosos", "en Colombia, «gases»"),
    (r"gasometría arterial", "gases arteriales", "en Colombia, «gases»"),
    (r"(?<!la )(?<!una )gasometría", "gases sanguíneos", "en Colombia, «gases»"),
    (r"(\d+) comprimido\b", r"\1 tableta", "en Colombia, «tableta»"),
    (r"(\d+) comprimidos\b", r"\1 tabletas", "en Colombia, «tableta»"),
    (r"pauta descendente", "reducción gradual", "en Colombia, «reducción gradual»"),
    (r"en planta\b", "en hospitalización", "en Colombia, «hospitalización» o «piso»"),
    (r"planta u observación", "hospitalización u observación", "en Colombia, «hospitalización»"),
    (r"mascarilla reservorio", "máscara con reservorio", "en Colombia, «máscara»"),
    (r"mascarilla", "máscara", "en Colombia, «máscara»"),
    (r"analíticas ambulatorias", "laboratorios ambulatorios", "en Colombia, «laboratorios»"),
    (r"hidratos de carbono", "carbohidratos", "en Colombia, «carbohidratos»"),
    (r"deprisa", "rápido", "en Colombia, «rápido»"),
    # Dependen de la frase: sólo se avisa.
    (r"\bsueros?\b", None, "si son líquidos IV, «líquidos IV»; si es suero sanguíneo o «suero casero» (AIEPI), se queda"),
    (r"\bpaut(?:a|as|ar|ado|ada|ados|adas)\b", None, "«esquema», «formulado», «indicado» o «plan», según la frase"),
    (r"\banalític[ao]s?\b", None, "«laboratorios» o «paraclínicos»"),
    (r"\bplanta\b", None, "«hospitalización» o «piso»"),
    (r"\bcomprimidos?\b", None, "«tableta»"),
    (r"\b112\b", None, "en Colombia el número de emergencias es el 123 (si no es una página)"),
    (r"\biones\b", None, "«electrolitos» (si son el sodio, el potasio, el cloro…)"),
    (r"\bhidratos\b", None, "«carbohidratos»"),
    (r"\bbioquímicas?\b", None, "si es el examen, «química sanguínea» o «laboratorios»"),
]
_VOCABULARIO = [(re.compile(p if p.startswith("(") or p.startswith("\\b") else r"\b" + p, re.I), c, n) for p, c, n in VOCABULARIO]
_SIN_TOCAR = {"referencias", "paginas", "imagen_evidencia", "id", "siguiente_nodo", "recurso",
              "archivo", "archivo_objetivo", "nodo_objetivo", "calculadora_objetivo", "nodoInicial",
              "nodo_inicial", "carpeta_imagenes", "carpeta_evidencia", "url", "enlace", "color", "icono"}


def _mayuscula_como(original: str, nuevo: str) -> str:
    return nuevo[:1].upper() + nuevo[1:] if original[:1].isupper() and nuevo[:1].islower() else nuevo


def _cadenas(valor, ruta: str = ""):
    """Las cadenas que ve el usuario, con su ruta; nunca citas, ids ni URL."""
    if isinstance(valor, dict):
        for k, v in valor.items():
            if k not in _SIN_TOCAR:
                yield from _cadenas(v, f"{ruta}.{k}" if ruta else k)
    elif isinstance(valor, list):
        for i, v in enumerate(valor):
            yield from _cadenas(v, f"{ruta}[{i}]")
    elif isinstance(valor, str) and not es_url(valor):
        yield ruta, valor


def vocabulario(alg: dict) -> list[tuple[str, str, str | None, str]]:
    """(ruta, término encontrado, cambio o None, por qué) de cada aparición."""
    hallazgos = []
    for ruta, texto in _cadenas(alg):
        ocupado: list[tuple[int, int]] = []
        for patron, cambio, nota in _VOCABULARIO:
            for m in patron.finditer(texto):
                if any(a < m.end() and m.start() < b for a, b in ocupado):
                    continue  # ya lo cubre una entrada más precisa
                ocupado.append((m.start(), m.end()))
                sugerido = _mayuscula_como(m.group(0), m.expand(cambio)) if cambio else None
                hallazgos.append((ruta, m.group(0), sugerido, nota))
    return hallazgos


def corregir_vocabulario(valor):
    """Aplica los cambios seguros de [VOCABULARIO]; devuelve (valor, cuántos)."""
    cuantos = 0

    def cambiar(texto: str) -> str:
        nonlocal cuantos
        for patron, cambio, _ in _VOCABULARIO:
            if cambio is None:
                continue

            def sustituto(m: re.Match) -> str:
                nonlocal cuantos
                cuantos += 1
                return _mayuscula_como(m.group(0), m.expand(cambio))

            texto = patron.sub(sustituto, texto)
        return texto

    def recorrer(v, clave: str = ""):
        if isinstance(v, dict):
            return {k: (x if k in _SIN_TOCAR else recorrer(x, k)) for k, x in v.items()}
        if isinstance(v, list):
            return [recorrer(x, clave) for x in v]
        if isinstance(v, str) and not es_url(v):
            return cambiar(v)
        return v

    return recorrer(valor), cuantos


# Negritas: la app pinta las cifras en el color del nodo y las palabras clave
# en negrita del color del texto. Dos o tres palabras clave por frase (más y la
# vista ya no sabe adónde saltar) y alguna en cada pieza de texto.
_NEGRITA = re.compile(r"\*\*([^*]+)\*\*")
_ROTULO_INICIAL = re.compile(r"^\s*(?:-|\d+\.)\s+\*\*[^*]+:\*\*")


def negritas_densas(nodo: dict, tope: int = 3) -> list[tuple[str, int]]:
    """Frases (viñetas del texto; frases de la perla, el contexto y las
    alertas) con más de [tope] palabras clave en negrita."""
    frases: list[str] = (nodo.get("texto") or "").split("\n")
    for prosa in [nodo.get("contexto") or "", nodo.get("nota_adicional") or "",
                  *[(a.get("texto") or "") for a in nodo.get("alertas") or [] if isinstance(a, dict)]]:
        frases += re.split(r"(?<=[.;])\s+(?=[A-ZÁÉÍÓÚ¿*])", prosa)
    densas = []
    for frase in frases:
        sin_rotulo = _ROTULO_INICIAL.sub("", frase)
        claves = [x for x in _NEGRITA.findall(sin_rotulo) if not re.search(r"\d", x)]
        if len(claves) > tope:
            densas.append((frase.strip(), len(claves)))
    return densas


def piezas_sin_negritas(nodo: dict) -> list[str]:
    """Piezas de prosa (8 palabras o más) sin ninguna palabra clave en
    negrita: perla, contexto, alertas, datos extra, `info` de las imágenes,
    notas de discrepancias y de dosis."""
    piezas = [("contexto", nodo.get("contexto")), ("perla", nodo.get("nota_adicional"))]
    piezas += [("alerta", a.get("texto")) for a in nodo.get("alertas") or [] if isinstance(a, dict)]
    piezas += [("dato extra", b.get("texto")) for b in nodo.get("burbujas") or [] if isinstance(b, dict)]
    piezas += [("info de imagen", m.get("info")) for m in nodo.get("media") or [] if isinstance(m, dict)]
    piezas += [("nota de discrepancia", d.get("nota")) for d in nodo.get("discrepancias") or [] if isinstance(d, dict)]
    piezas += [("nota de dosis", f.get("nota")) for f in nodo.get("farmacos") or [] if isinstance(f, dict)]
    piezas += [("pauta de dosis", f.get("pauta")) for f in nodo.get("farmacos") or [] if isinstance(f, dict)]
    faltan = []
    for nombre, texto in piezas:
        if texto and palabras(texto) >= 3 and not [x for x in _NEGRITA.findall(texto) if not re.search(r"\d", x)]:
            faltan.append(nombre)
    return faltan


def palabras(texto: str) -> int:
    return len(re.findall(r"\w+", texto or ""))


_MARCAS = re.compile(r"\*\*|\{#?[0-9A-Za-z]+:|\}")


def palabras_visibles(nodo: dict) -> tuple[int, int]:
    """(palabras que se ven sin desplegar nada —contexto, texto y alertas—,
    palabras del contexto), contadas como las cuenta quien lee: «3,5 mEq/L»
    es una palabra, no tres."""
    def contar(t: str) -> int:
        return len([x for x in _MARCAS.sub("", t or "").split() if re.search(r"\w", x)])
    alertas = [a for a in nodo.get("alertas") or [] if isinstance(a, dict)]
    contexto = contar(nodo.get("contexto") or "")
    total = contexto + contar(nodo.get("texto") or "") + sum(
        contar(a.get("titulo") or "") + contar(a.get("texto") or "") for a in alertas)
    return total, contexto


# Una respuesta «Sí» pide su contraria (con otras palabras vale: «Diferir»,
# «Controlada», «Aún no»): un «Sí» que es la única salida es un hueco.
_SI = re.compile(r"^\s*s[ií]\b", re.I)


# --- chequeo: lo que rompe en la app ----------------------------------------


def chequear(ruta: Path) -> list[str]:
    """Lo que la app dibuja mal o no dibuja, sin avisar. Rápido y sin red."""
    try:
        alg = json.loads(ruta.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        return [f"JSON inválido: {e}"]
    nodos = alg.get("nodos")
    if not isinstance(nodos, dict):
        return ["falta el objeto «nodos»"]
    problemas: list[str] = []
    carpeta = alg.get("carpeta_imagenes") or alg.get("carpetaImagenes") or ""
    for nid in entradas(alg):
        if nid not in nodos:
            problemas.append(f"la entrada «{nid}» no existe en nodos")
    for nid, nodo in nodos.items():
        if not isinstance(nodo, dict):
            problemas.append(f"{nid}: no es un objeto")
            continue
        for o in opciones(nodo):
            if destino(o) and destino(o) not in nodos:
                problemas.append(f"{nid}: la rama «{o.get('texto', '')}» va a «{destino(o)}», que no existe (se ignora en silencio)")
        calc = calculadora(nodo)
        if calc and not es_pendiente(calc) and not es_url(calc):
            problemas.append(f"{nid}: la calculadora «{calc}» va con nombre suelto; la app sólo la descarga por URL → {BASE_RAW}calculadoras/{calc}")
        for enl in enlaces(nodo):
            dest = destino_enlace(enl)
            if dest.endswith(".json") and not es_url(dest) and not es_pendiente(dest):
                problemas.append(f"{nid}: el enlace «{enl.get('texto', '')}» apunta a «{dest}» sin URL; la app lo busca dentro del paquete y no lo encuentra")
            calc_obj = enl.get("calculadora_objetivo") or enl.get("calculadoraObjetivo") or ""
            if calc_obj and not es_url(calc_obj) and not es_pendiente(calc_obj):
                problemas.append(f"{nid}: el enlace a la calculadora «{calc_obj}» va sin URL")
            if (dest.upper() == "INTERNO" or enl.get("tipo") in ("interno", "nodo")) and enl.get("nodo_objetivo") not in nodos:
                problemas.append(f"{nid}: el salto interno «{enl.get('texto', '')}» va a «{enl.get('nodo_objetivo')}», que no existe")
        for img in imagenes_de(nodo):
            if es_pendiente(img):
                continue
            en_disco = ruta_imagen(img, carpeta)
            if en_disco is not None and not en_disco.is_file():
                problemas.append(f"{nid}: la imagen «{img}» no está en {en_disco.relative_to(RAIZ)}")
        for f in farmacos(nodo):
            if not (f.get("nombre") or f.get("farmaco") or f.get("medicamento")) or not (f.get("dosis") or f.get("posologia")):
                problemas.append(f"{nid}: un fármaco sin «nombre» o sin «dosis» (la app lo descarta)")
        visibles = "\n".join(textos_visibles(nodo))
        for m in media_de(nodo):
            for frase in frases_en_texto(m):
                if not contiene_palabra(visibles, frase):
                    problemas.append(f"{nid}: «en_texto» pide enlazar «{frase}», que no está en el texto del nodo (no se enlaza nada)")
            info = m.get("info") or ""
            for color in _COLOR_INFO.findall(info):
                if not (re.fullmatch(r"#[0-9A-Fa-f]{6}", color) or color in COLORES_INFO):
                    problemas.append(f"{nid}: «info» de «{m.get('recurso', '?')}» usa el color «{color}», que la app no conoce (se ve con llaves)")
            if info.count("{") != info.count("}") or info.count("**") % 2:
                problemas.append(f"{nid}: «info» de «{m.get('recurso', '?')}» tiene llaves o ** sin cerrar")
            for r in m.get("referencias") or []:
                img = (r.get("imagen_evidencia") or "").strip() if isinstance(r, dict) else ""
                if not isinstance(r, dict):
                    problemas.append(f"{nid}: «referencias» de «{m.get('recurso', '?')}» con una entrada que no es objeto (la app la descarta)")
                elif img and not img.startswith(("https://", "TODO_")):
                    problemas.append(f"{nid}: «referencias» de «{m.get('recurso', '?')}»: «imagen_evidencia» sin URL raw completa (el visor no conoce la carpeta)")
        for d in nodo.get("discrepancias") or []:
            if isinstance(d, dict) and len(d.get("posturas") or []) < 2:
                problemas.append(f"{nid}: discrepancia «{d.get('asunto', '')}» con menos de dos posturas (la app la descarta)")
    return problemas


# --- la nota ----------------------------------------------------------------


@dataclass
class Informe:
    archivo: str
    titulo: str
    clinicos: int
    dimensiones: dict[str, float | None] = field(default_factory=dict)
    cuentas: dict[str, int] = field(default_factory=dict)
    faltas: list[str] = field(default_factory=list)

    @property
    def nota(self) -> int:
        validas = {k: v for k, v in self.dimensiones.items() if v is not None}
        if not validas:
            return 0
        peso = sum(PESOS[k] for k in validas)
        return round(100 * sum(PESOS[k] * v for k, v in validas.items()) / peso)


def proporcion(n: int, meta: float) -> float:
    return 1.0 if meta <= 0 else min(1.0, n / meta)


def medir(ruta: Path) -> Informe:
    alg = json.loads(ruta.read_text(encoding="utf-8"))
    nodos: dict = alg.get("nodos") or {}
    raices = set(entradas(alg)) or {next(iter(nodos), "")}
    clinicos = {nid: n for nid, n in nodos.items() if isinstance(n, dict) and not es_portada(nid, n, raices)}
    c = max(1, len(clinicos))
    carpeta = alg.get("carpeta_imagenes") or alg.get("carpetaImagenes") or ""
    inf = Informe(str(ruta.relative_to(DATA)), alg.get("titulo", ""), len(clinicos))

    # Portada: descripción, especialidad, fecha y bibliografía con enlace.
    # Sin puntos clave: la portada ya no los enseña.
    refs = [r for r in alg.get("referencias") or [] if isinstance(r, dict)]
    portada = [
        bool(alg.get("descripcion")),
        bool(alg.get("especialidad")),
        bool(alg.get("actualizado")),
        any(es_url(r.get("url") or r.get("enlace") or "") for r in refs),
    ]
    if alg.get("puntos_clave") or alg.get("puntosClave"):
        inf.faltas.append("portada: quitar puntos_clave (la portada ya no los enseña)")
    inf.dimensiones["portada"] = sum(portada) / len(portada)
    for ok, falta in zip(portada, ("descripcion", "especialidad", "actualizado", "bibliografía general con URL")):
        if not ok:
            inf.faltas.append(f"portada: falta {falta}")

    n_check = sum(1 for n in clinicos.values() if n.get("checklist") or n.get("lista_verificacion"))
    n_alert = sum(1 for n in clinicos.values() if n.get("alertas") or n.get("alerta"))
    n_perla = sum(1 for n in clinicos.values() if n.get("nota_adicional") or n.get("notaAdicional"))
    n_grado = sum(1 for n in clinicos.values() if n.get("evidencia") or n.get("recomendacion"))
    n_crono = sum(1 for n in clinicos.values() if n.get("cronometros"))
    for nid, n in clinicos.items():
        if n.get("cronometros"):
            inf.faltas.append(f"{nid}: lleva cronómetros; no se usan por ahora")
    meta_check = max(2, c // METAS["nodos_por_checklist"])
    meta_alert = max(1, c // METAS["nodos_por_alerta"])
    meta_grado = max(2, c // METAS["nodos_por_evidencia"])
    inf.dimensiones["criterios"] = proporcion(n_check, meta_check)
    inf.dimensiones["alertas"] = proporcion(n_alert, meta_alert)
    inf.dimensiones["perlas"] = proporcion(n_perla / c, METAS["perlas"])
    inf.dimensiones["evidencia"] = proporcion(n_grado, meta_grado)

    # Dosis por peso: toda dosis «/kg» con su `por_kg`.
    kg_total = kg_ok = 0
    for nid, n in clinicos.items():
        for f in farmacos(n):
            if _POR_KG.search(f.get("dosis") or f.get("posologia") or ""):
                kg_total += 1
                if f.get("por_kg") or f.get("porKg") or f.get("dosis_kg"):
                    kg_ok += 1
                else:
                    inf.faltas.append(f"{nid}: «{f.get('nombre', '?')}» dosifica por kilo y no lleva por_kg")
    inf.dimensiones["dosis_kg"] = kg_ok / kg_total if kg_total else None

    # Imágenes que se ven (ni marcador ni ausentes), galerías y GIF.
    n_img = n_galeria = n_gif = 0
    for nid, n in clinicos.items():
        vistas = []
        for img in imagenes_de(n):
            en_disco = ruta_imagen(img, carpeta)
            if not es_pendiente(img) and (en_disco is None or en_disco.is_file()):
                vistas.append(img)
        if vistas:
            n_img += 1
            n_galeria += len(vistas) >= 2
            n_gif += sum(1 for v in vistas if v.lower().endswith(".gif"))
        elif _VISUAL.search(f"{n.get('titulo', '')} {n.get('texto', '')}"):
            inf.faltas.append(f"{nid}: habla de algo que se ve (exploración, técnica, imagen) y no lleva imagen")
    inf.dimensiones["imagenes"] = proporcion(n_img / c, METAS["imagenes"])
    inf.dimensiones["gif"] = 1.0 if n_gif else 0.0

    # Conexiones hacia fuera: otros algoritmos y calculadoras, por URL.
    fuera = pendientes = 0
    for nid, n in clinicos.items():
        calc = calculadora(n)
        if calc and es_pendiente(calc):
            pendientes += 1
            inf.faltas.append(f"{nid}: calculadora pendiente {calc}")
        for enl in enlaces(n):
            dest = destino_enlace(enl)
            if es_pendiente(dest):
                pendientes += 1
                inf.faltas.append(f"{nid}: enlace pendiente {dest}")
            elif (dest.endswith(".json") and es_url(dest)) or enl.get("calculadora_objetivo") or enl.get("tipo") == "calculadora":
                fuera += 1
    conexiones = proporcion(fuera, METAS["enlaces_fuera"])
    inf.dimensiones["conexiones"] = conexiones * (0.5 if pendientes else 1.0)

    # Pistas para quien mejora: listas de criterios escritas como viñetas.
    for nid, n in clinicos.items():
        texto = n.get("texto") or ""
        calc = n.get("calculadora")
        ramifica = isinstance(calc, dict) and calc.get("ramificar")
        if not n.get("checklist") and not ramifica and len(_VINETA.findall(texto)) >= 3 and _CRITERIOS.search(f"{n.get('titulo', '')} {texto}"):
            inf.faltas.append(f"{nid}: lista de criterios en viñetas; candidata a checklist")
        if _AVISO_DE_MEDIO.search(texto):
            inf.faltas.append(f"{nid}: «{_AVISO_DE_MEDIO.search(texto).group(0)}» en el texto; enlazar la frase con media[].en_texto")
        for m in media_de(n):
            pie = m.get("pie") or m.get("descripcion") or ""
            if _PIE_CON_CREDITO.search(pie):
                inf.faltas.append(f"{nid}: el pie de «{m.get('recurso', '?')}» lleva el crédito; va dentro de la imagen y en creditos.json")
            if palabras(pie) > 18:
                inf.faltas.append(f"{nid}: el pie de «{m.get('recurso', '?')}» tiene {palabras(pie)} palabras; ≤18, qué se ve")
            if not (m.get("titulo") or "").strip():
                inf.faltas.append(f"{nid}: «{m.get('recurso', '?')}» sin título")
            info = m.get("info") or ""
            if not info.strip():
                inf.faltas.append(f"{nid}: «{m.get('recurso', '?')}» sin «info» (texto del visor a pantalla completa)")
            else:
                limpio = _COLOR_INFO.sub(lambda c: c.group(0).split(":", 1)[1][:-1], info)
                if palabras(limpio) > 50:
                    inf.faltas.append(f"{nid}: el «info» de «{m.get('recurso', '?')}» tiene {palabras(limpio)} palabras; ≤50")
                if "\n" in info:
                    inf.faltas.append(f"{nid}: el «info» de «{m.get('recurso', '?')}» tiene saltos de línea; un solo párrafo")
                if _PIE_CON_CREDITO.search(info):
                    inf.faltas.append(f"{nid}: el «info» de «{m.get('recurso', '?')}» lleva el crédito; va dentro de la imagen")
                if _CIFRA_EN_NEGRITA.search(info) and not m.get("referencias"):
                    inf.faltas.append(f"{nid}: el «info» de «{m.get('recurso', '?')}» da cifras o criterios sin «referencias» (botón del libro)")
        if palabras(texto) > 120:
            inf.faltas.append(f"{nid}: {palabras(texto)} palabras en el texto; partir o pasar a tabla/checklist")
        visibles, en_contexto = palabras_visibles(n)
        if visibles > METAS["palabras_visibles"]:
            inf.faltas.append(f"{nid}: {visibles} palabras visibles (contexto, texto y alertas); 60-70, {METAS['palabras_visibles']} como mucho: quitar el contexto, pasar lo opcional a la perla o los criterios a una tabla")
        if en_contexto > METAS["palabras_contexto"]:
            inf.faltas.append(f"{nid}: el contexto tiene {en_contexto} palabras; {METAS['palabras_contexto']} como mucho (o quitarlo)")
        for frase, n_clave in negritas_densas(n):
            inf.faltas.append(f"{nid}: {n_clave} palabras clave en negrita en «{frase[:60]}…»; tres como mucho (las cifras y el rótulo no cuentan)")
        for pieza in piezas_sin_negritas(n):
            inf.faltas.append(f"{nid}: {pieza} sin ninguna palabra clave en negrita")

    # Un camino que entra en otra sección por la mitad: mejor al nodo de sección.
    hogar = secciones_hogar(alg)
    for nid, n in nodos.items():
        if not isinstance(n, dict) or nid not in hogar:
            continue
        for o in opciones(n):
            dest = destino(o)
            if dest in hogar and hogar[dest] != hogar[nid] and dest != hogar[dest]:
                inf.faltas.append(
                    f"{nid}: la rama «{o.get('texto', '')}» entra en la sección «{hogar[dest]}» por la mitad; apuntar a «{hogar[dest]}»"
                )

    # Cada decisión, con todas sus respuestas (NORMA §1): una pregunta con una
    # sola salida no es una pregunta, y un «Sí» lleva su «No» o su «Aún no».
    for nid, n in nodos.items():
        if not isinstance(n, dict):
            continue
        ops = opciones(n)
        textos = [str(o.get("texto") or "") for o in ops]
        if len(ops) == 1 and _SI.search(textos[0]):
            inf.faltas.append(f"{nid}: «{textos[0][:40]}» es la única respuesta; falta la negativa (el «No» o el «Aún no» también lleva a algún sitio)")
        elif (n.get("pie_nodo") or "").strip().endswith("?") and len(ops) < 2:
            inf.faltas.append(f"{nid}: pregunta «{n['pie_nodo'][:50]}» con una sola respuesta; añadir las demás o quitar la pregunta (un paso que sólo sigue adelante no pregunta)")

    # Español de Colombia: cada término una vez, con cuántas veces sale.
    vistos: dict[tuple[str, str | None], int] = {}
    for _, termino, cambio, nota in vocabulario(alg):
        clave = (termino.lower(), cambio.lower() if cambio else nota)
        vistos[clave] = vistos.get(clave, 0) + 1
    for (termino, cambio), n in vistos.items():
        veces = f" ({n} veces)" if n > 1 else ""
        sugerencia = f"«{cambio}»" if cambio and not cambio.startswith(("en Colombia", "si son", "«", "nombre", "norma")) else cambio
        inf.faltas.append(f"vocabulario: «{termino}»{veces} → {sugerencia}")

    inf.cuentas = {
        "nodos": len(nodos), "clinicos": len(clinicos), "checklist": n_check, "alertas": n_alert,
        "perlas": n_perla, "grado": n_grado, "cronometros": n_crono, "con_imagen": n_img,
        "galerias": n_galeria, "gif": n_gif, "por_kg": kg_ok, "kg_sin_por_kg": kg_total - kg_ok,
        "enlaces_fuera": fuera, "pendientes": pendientes,
    }
    return inf


# --- salida -----------------------------------------------------------------


def todos() -> list[Path]:
    return sorted(p for cat in CATEGORIAS for p in (DATA / cat).glob("*.json") if p.name != "disponibles.json")


def resolver(arg: str) -> Path:
    for candidato in (Path(arg), DATA / arg, *(DATA / cat / arg for cat in CATEGORIAS), *(DATA / cat / f"{arg}.json" for cat in CATEGORIAS)):
        if candidato.is_file():
            return candidato.resolve()
    sys.exit(f"no encuentro {arg}")


def celda(v: float | None) -> str:
    return "—" if v is None else f"{round(100 * v)}"


def tabla(informes: list[Informe], markdown: bool) -> str:
    dims = list(PESOS)
    if markdown:
        lineas = ["| algoritmo | nota | " + " | ".join(ROTULOS[d] for d in dims) + " |",
                  "|---|--:|" + "--:|" * len(dims)]
        lineas += [f"| {i.archivo} | **{i.nota}** | " + " | ".join(celda(i.dimensiones.get(d)) for d in dims) + " |" for i in informes]
        return "\n".join(lineas)
    cab = f"   {'algoritmo':<44}{'nota':>5}" + "".join(f"{ROTULOS[d]:>10}" for d in dims)
    filas = [f"   {i.archivo[-44:]:<44}{i.nota:>5}" + "".join(f"{celda(i.dimensiones.get(d)):>10}" for d in dims) for i in informes]
    media = round(sum(i.nota for i in informes) / max(1, len(informes)))
    return "\n".join([cab, "   " + "─" * (len(cab) - 3), *filas, "", f"   {len(informes)} algoritmos · nota media {media}"])


def detalle(inf: Informe) -> str:
    lineas = [f"{inf.archivo} · {inf.titulo}", f"nota norma v2: {inf.nota}", ""]
    lineas += [f"   {ROTULOS[d]:<10}{celda(v):>5}" for d, v in inf.dimensiones.items()]
    lineas += ["", "   " + " · ".join(f"{k} {v}" for k, v in inf.cuentas.items()), ""]
    lineas += ["qué le falta:"] + [f"   - {f}" for f in inf.faltas] if inf.faltas else ["no le falta nada que se pueda medir."]
    return "\n".join(lineas)


def hook() -> int:
    """PostToolUse de Claude Code: chequea el JSON de algoritmo que se acaba de escribir."""
    try:
        evento = json.load(sys.stdin)
    except json.JSONDecodeError:
        return 0
    ruta = Path((evento.get("tool_input") or {}).get("file_path") or "")
    try:
        relativa = ruta.resolve().relative_to(DATA)
    except ValueError:
        return 0
    if ruta.suffix != ".json" or relativa.parts[0] not in CATEGORIAS or ruta.name == "disponibles.json":
        return 0
    problemas = chequear(ruta)
    if not problemas:
        return 0
    print(f"{relativa}: {len(problemas)} problema(s) que la app no denuncia:", file=sys.stderr)
    for p in problemas[:25]:
        print(f"  - {p}", file=sys.stderr)
    return 2  # PostToolUse: exit 2 devuelve stderr a Claude para que lo arregle


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("algoritmos", nargs="*", help="archivos o nombres (sepsis, Adultos/sepsis.json)")
    ap.add_argument("--md", action="store_true", help="tabla en Markdown")
    ap.add_argument("--json", action="store_true", help="salida JSON")
    ap.add_argument("--chequeo", metavar="RUTA", nargs="+", help="sólo lo que rompe en la app")
    ap.add_argument("--hook", action="store_true", help="modo PostToolUse de Claude Code")
    ap.add_argument("--vocabulario", action="store_true", help="español de España que se cuela")
    ap.add_argument("--corregir", action="store_true", help="con --vocabulario: aplica los cambios seguros")
    args = ap.parse_args()

    if args.vocabulario:
        rutas = [resolver(a) for a in args.algoritmos] if args.algoritmos else todos()
        total = 0
        for ruta in rutas:
            crudo = ruta.read_text(encoding="utf-8")
            alg = json.loads(crudo)
            if alg.get("oculto") and not args.algoritmos:
                continue
            if args.corregir:
                sangria = next((n for n in (2, 1, 4) if json.dumps(alg, ensure_ascii=False, indent=n) + "\n" == crudo), None)
                if sangria is None:
                    print(f"{ruta.relative_to(DATA)}: no se reescribe (su formato no es el estándar); corregir a mano")
                    continue
                nuevo, cuantos = corregir_vocabulario(alg)
                if cuantos:
                    ruta.write_text(json.dumps(nuevo, ensure_ascii=False, indent=sangria) + "\n", encoding="utf-8")
                    print(f"{ruta.relative_to(DATA)}: {cuantos} cambio(s)")
                alg = nuevo
            hallazgos = vocabulario(alg)
            total += len(hallazgos)
            for r, termino, cambio, nota in hallazgos:
                print(f"{ruta.relative_to(DATA)}: {r}: «{termino}» → {('«' + cambio + '»') if cambio else 'revisar: ' + nota}")
        print(f"{total} aparición(es)")
        return 0

    if args.hook:
        return hook()
    if args.chequeo:
        malos = 0
        for arg in args.chequeo:
            problemas = chequear(resolver(arg))
            malos += bool(problemas)
            for p in problemas:
                print(f"{arg}: {p}")
        return 1 if malos else 0

    rutas = [resolver(a) for a in args.algoritmos] if args.algoritmos else todos()
    informes = sorted((medir(r) for r in rutas), key=lambda i: i.nota)
    if args.json:
        print(json.dumps([{"archivo": i.archivo, "nota": i.nota, "dimensiones": i.dimensiones, "cuentas": i.cuentas, "faltas": i.faltas} for i in informes], ensure_ascii=False, indent=1))
    elif len(informes) == 1 and not args.md:
        print(detalle(informes[0]))
    else:
        print(tabla(informes, args.md))
    return 0


if __name__ == "__main__":
    sys.exit(main())
