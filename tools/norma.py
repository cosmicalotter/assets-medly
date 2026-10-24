#!/usr/bin/env python3
"""Norma Praxis v2: lo que el auditor de galgo todavía no mide.

`galgo auditar` contesta si lo que ya hay está completo: la dosis con su
pastilla, la pregunta en cada decisión, la escala conectada, los recortes de
la guía. Esto contesta la otra mitad de la norma: si el algoritmo usa las
herramientas que la app ya sabe dibujar y que casi ningún algoritmo usa
todavía —listas de criterios, alertas, perlas, grado de evidencia, dosis por
peso, imágenes y GIF, enlaces a otros algoritmos, portada con puntos clave—.

Las dos notas se leen juntas: la de galgo es el suelo (que no falte nada de
lo que hay), la de aquí es el techo (que se use todo lo que la app ofrece).

Uso:
  python3 tools/norma.py                       tablero de todos, lo peor primero
  python3 tools/norma.py Adultos/sepsis.json   detalle de uno, con qué le falta
  python3 tools/norma.py --md                  la tabla en Markdown, para un PR
  python3 tools/norma.py --json                para otro script
  python3 tools/norma.py --chequeo RUTA        lo que rompe en la app; sale con 1
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


def palabras(texto: str) -> int:
    return len(re.findall(r"\w+", texto or ""))


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

    # Portada: descripción, especialidad, puntos clave y bibliografía con enlace.
    puntos = alg.get("puntos_clave") or alg.get("puntosClave") or []
    refs = [r for r in alg.get("referencias") or [] if isinstance(r, dict)]
    portada = [
        bool(alg.get("descripcion")),
        bool(alg.get("especialidad")),
        3 <= len(puntos) <= 5,
        any(es_url(r.get("url") or r.get("enlace") or "") for r in refs),
    ]
    inf.dimensiones["portada"] = sum(portada) / len(portada)
    for ok, falta in zip(portada, ("descripcion", "especialidad", "3-5 puntos_clave", "bibliografía general con URL")):
        if not ok:
            inf.faltas.append(f"portada: falta {falta}")

    n_check = sum(1 for n in clinicos.values() if n.get("checklist") or n.get("lista_verificacion"))
    n_alert = sum(1 for n in clinicos.values() if n.get("alertas") or n.get("alerta"))
    n_perla = sum(1 for n in clinicos.values() if n.get("nota_adicional") or n.get("notaAdicional"))
    n_grado = sum(1 for n in clinicos.values() if n.get("evidencia") or n.get("recomendacion"))
    n_crono = sum(1 for n in clinicos.values() if n.get("cronometros"))
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
        if not n.get("checklist") and len(_VINETA.findall(texto)) >= 3 and _CRITERIOS.search(f"{n.get('titulo', '')} {texto}"):
            inf.faltas.append(f"{nid}: lista de criterios en viñetas; candidata a checklist")
        if palabras(texto) > 120:
            inf.faltas.append(f"{nid}: {palabras(texto)} palabras en el texto; partir o pasar a tabla/checklist")

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
    args = ap.parse_args()

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
