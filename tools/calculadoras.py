#!/usr/bin/env python3
"""Calculadoras de Empirica: lo que rompe y lo que falta.

Cada JSON de data/calculadoras se lee como lo lee la app (praxis,
`DatosEscala` y `MotorCalculadora`; el formato está en
praxis/docs/calculadoras_json.md y la norma en
.claude/skills/crear-calculadora/NORMA.md) y se comprueba en dos niveles:

- **Errores**: lo que la app no denuncia y da un resultado equivocado o
  ninguno. Un total alcanzable sin resultado, una fórmula con una variable
  que nadie fija, una regla que no coincide con su fórmula, un tramo que
  marca una celda vacía, una variable que empieza por «e»… Se recorren
  TODAS las combinaciones de las opciones (o una muestra si son demasiadas).
- **Nota (0-100)**: lo completa que está según la norma: para qué sirve,
  cómo se aplica, cuándo no aplica, fuentes con cita, conducta en cada
  resultado, colores.

Uso:
  python3 tools/calculadoras.py                    tablero, lo peor primero
  python3 tools/calculadoras.py asa                detalle de una
  python3 tools/calculadoras.py --md               tabla en Markdown (PR)
  python3 tools/calculadoras.py --json             para otro script
  python3 tools/calculadoras.py --chequeo RUTA...  sólo errores; sale con 1
  python3 tools/calculadoras.py --hook             PostToolUse de Claude Code

Sin dependencias: sólo la biblioteca estándar.
"""

from __future__ import annotations

import argparse
import itertools
import json
import math
import random
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
CARPETA = RAIZ / "data" / "calculadoras"
ALGORITMOS = [RAIZ / "data" / "Adultos", RAIZ / "data" / "Pediatria"]
INDICE = RAIZ / "indices" / "index_calculadoras.json"

COLORES = {"verde", "amarillo", "naranja", "rojo"}
TIPOS = {None, "suma", "formula", "reglas"}
LLAVES = {
    "titulo", "descripcion", "instrucciones", "limitaciones", "referencias",
    "tipoCalculo", "formula", "secciones", "prefijoResultado", "sufijoResultado",
    "mostrarPuntaje", "mostrar_puntaje", "decimales", "extras", "columnas",
    "filas", "resultados", "imagenTopUrl", "imagenBottomUrl",
}
LLAVES_FILA = {"nombre", "descripciones", "detalles", "ayuda", "grupo", "entrada"}
LLAVES_ELEMENTO = {"id", "tipo", "label", "unidad", "unidades", "opciones",
                   "intervalos", "ayuda", "min", "max"}
LLAVES_RESULTADO = {"min", "max", "categoria", "color", "approach",
                    "match_opcion_index", "matchOpcionIndex", "si"}
OPERADORES = {"igual", "distinto", "en", "mayor", "menor", "mayorIgual", "menorIgual"}
FUNCIONES = {"abs": abs, "sqrt": math.sqrt, "ln": math.log, "exp": math.exp,
             "sin": math.sin, "cos": math.cos, "tan": math.tan,
             "ceil": math.ceil, "floor": math.floor,
             "log": lambda b, x: math.log(x, b),
             "sgn": lambda x: (x > 0) - (x < 0)}
MAX_COMBINACIONES = 20000
VACIAS = {"", "-", "–", "—"}


def vacia(texto) -> bool:
    return str(texto).strip() in VACIAS


def numero(v) -> bool:
    return isinstance(v, (int, float)) and not isinstance(v, bool)


def fmt(x) -> str:
    return str(int(x)) if float(x).is_integer() else f"{x:g}"


@dataclass
class Informe:
    archivo: str
    titulo: str = ""
    modelo: str = ""
    errores: list[str] = field(default_factory=list)
    avisos: list[str] = field(default_factory=list)
    faltas: list[str] = field(default_factory=list)
    nota: int = 0


# --------------------------------------------------------------------------
# Fórmulas: como las evalúa la app (math_expressions), en Python
# --------------------------------------------------------------------------

IDENT = re.compile(r"[A-Za-z_][A-Za-z0-9_]*")


def identificadores(formula: str) -> set[str]:
    return {i for i in IDENT.findall(formula) if i not in FUNCIONES and i != "e"}


def evaluar(formula: str, variables: dict[str, float]) -> float | None:
    """None si falta una variable o no da un número (como la app)."""
    faltan = identificadores(formula) - variables.keys()
    if faltan:
        return None
    texto = formula.replace("^", "**")
    try:
        r = eval(texto, {"__builtins__": {}}, {**FUNCIONES, "e": math.e, **variables})  # noqa: S307
        r = float(r)
    except (ZeroDivisionError, ValueError, OverflowError, TypeError, SyntaxError):
        return None
    if isinstance(r, complex) or math.isnan(r) or math.isinf(r):
        return None
    return r


def redondear(x: float, decimales: int) -> float:
    return float(f"{x:.{decimales}f}")


def ckdepi(v: dict[str, float]) -> float | None:
    """El caso aparte de la app para CKD-EPI (fórmula con 142 y scr/edad/kappa)."""
    try:
        r = v["scr"] / v["kappa"]
        return (142 * min(r, 1) ** v.get("alpha", 0) * max(r, 1) ** -1.2
                * 0.9938 ** v["edad"] * v.get("factorSexo", v.get("factor_sexo", 1)))
    except (KeyError, ZeroDivisionError, ValueError):
        return None


# --------------------------------------------------------------------------
# Lectura común
# --------------------------------------------------------------------------

def es_formulario(d: dict) -> bool:
    reglas = any(isinstance(r, dict) and "si" in r for r in d.get("resultados") or [])
    return d.get("secciones") is not None and (d.get("tipoCalculo") in ("formula", "reglas") or reglas)


def resultado_por_rango(d: dict, t: float):
    for i, r in enumerate(d.get("resultados") or []):
        if numero(r.get("min")) and numero(r.get("max")) and r["min"] <= t <= r["max"]:
            return i
    return None


def elementos(d: dict) -> list[dict]:
    return [e for s in d.get("secciones") or [] for e in (s.get("elementos") or []) if isinstance(e, dict)]


def valor_opcion(o: dict, i: int) -> float:
    """El valor de una opción para las reglas (como `valorDe` en la app)."""
    if numero(o.get("puntos")):
        return float(o["puntos"])
    vv = o.get("valoresVariables")
    if isinstance(vv, dict) and len(vv) == 1 and numero(next(iter(vv.values()))):
        return float(next(iter(vv.values())))
    return float(i)


def tramo_de(intervalos: list[dict], v: float):
    for t in intervalos:
        if (not numero(t.get("min")) or v >= t["min"]) and (not numero(t.get("max")) or v <= t["max"]):
            return t
    return None


def huecos(intervalos: list[dict], lo: float | None, hi: float | None) -> list[float]:
    """Valores que no caen en ningún tramo, entre lo y hi (o entre los límites
    de los tramos). Los huecos de una centésima o menos («39,99» y «40») no
    cuentan: nadie escribe 39,995."""
    tramos = sorted(
        (t["min"] if numero(t.get("min")) else -math.inf,
         t["max"] if numero(t.get("max")) else math.inf)
        for t in intervalos
    )
    if not tramos:
        return []
    a = lo if lo is not None else max(tramos[0][0], -1e9)
    b = hi if hi is not None else min(max(t[1] for t in tramos), 1e9)
    salida = []
    cubierto = a
    if tramos[0][0] > a + 0.011:
        salida.append(a)
    cubierto = max(cubierto, tramos[0][1])
    for x, y in tramos[1:]:
        if x > cubierto + 0.011 and cubierto < b:
            salida.append(round((cubierto + min(x, b)) / 2, 3))
        cubierto = max(cubierto, y)
    if cubierto < b - 0.011:
        salida.append(b)
    return [v for v in salida if a <= v <= b]


def muestras(e: dict) -> list[float]:
    """Valores de prueba para un campo numérico."""
    lo = e.get("min") if numero(e.get("min")) else None
    hi = e.get("max") if numero(e.get("max")) else None
    vals = set()
    for t in e.get("intervalos") or []:
        for k in ("min", "max"):
            if numero(t.get(k)):
                vals.update({t[k], t[k] + 0.5, t[k] - 0.5})
    if lo is not None and hi is not None:
        vals.update(lo + (hi - lo) * f for f in (0, 0.1, 0.25, 0.5, 0.75, 0.9, 1))
    elif not vals:
        vals.update({0.5, 1, 2, 5, 10, 30, 60, 90, 120})
    return sorted(v for v in vals if (lo is None or v >= lo) and (hi is None or v <= hi) and v >= 0) or [1.0]


# --------------------------------------------------------------------------
# Comprobaciones
# --------------------------------------------------------------------------

def chequear_comun(d: dict, inf: Informe) -> None:
    for k in d:
        if k not in LLAVES:
            inf.avisos.append(f"llave desconocida «{k}» (¿errata? la app la ignora)")
    if not str(d.get("titulo") or "").strip():
        inf.errores.append("falta «titulo»")
    if d.get("tipoCalculo") not in TIPOS:
        inf.errores.append(f"tipoCalculo «{d.get('tipoCalculo')}» desconocido (suma, formula o reglas)")
    if numero(d.get("decimales")) and not 0 <= d["decimales"] <= 6:
        inf.errores.append("«decimales» va de 0 a 6")
    resultados = d.get("resultados")
    if not isinstance(resultados, list) or not resultados:
        inf.errores.append("sin «resultados»")
        return
    for i, r in enumerate(resultados):
        if not isinstance(r, dict):
            inf.errores.append(f"resultados[{i}] no es un objeto")
            continue
        for k in r:
            if k not in LLAVES_RESULTADO:
                inf.avisos.append(f"resultados[{i}]: llave desconocida «{k}»")
        if not str(r.get("categoria") or "").strip():
            inf.errores.append(f"resultados[{i}] sin «categoria»")
        if r.get("color") is not None and r.get("color") not in COLORES:
            inf.avisos.append(f"resultados[{i}]: color «{r.get('color')}» (verde, amarillo, naranja o rojo)")
        idx = r.get("match_opcion_index", r.get("matchOpcionIndex"))
        if idx is not None and not isinstance(idx, int):
            inf.errores.append(f"resultados[{i}]: match_opcion_index tiene que ser un entero")
    for i, ref in enumerate(d.get("referencias") or []):
        if not (ref.get("titulo") or ref.get("texto")):
            inf.errores.append(f"referencias[{i}] sin título")
    for i, ex in enumerate(d.get("extras") or []):
        if not ex.get("etiqueta") or not ex.get("formula"):
            inf.errores.append(f"extras[{i}] necesita «etiqueta» y «formula»")


def rangos_solapados(d: dict, inf: Informe) -> None:
    rs = [(r["min"], r["max"], r.get("categoria", "")) for r in d.get("resultados") or []
          if numero(r.get("min")) and numero(r.get("max"))]
    for a, b, c in rs:
        if a > b:
            inf.errores.append(f"resultado «{c}»: min {fmt(a)} > max {fmt(b)}")
    orden = sorted(rs)
    for (a1, b1, c1), (a2, b2, c2) in zip(orden, orden[1:]):
        if a2 <= b1:
            inf.errores.append(f"resultados solapados: «{c1}» ({fmt(a1)}–{fmt(b1)}) y «{c2}» ({fmt(a2)}–{fmt(b2)})")


def chequear_tabla(d: dict, inf: Informe) -> None:
    columnas = d.get("columnas") or []
    filas = d.get("filas") or []
    if not columnas or not filas:
        inf.errores.append("una tabla necesita «columnas» y «filas»")
        return
    for i, c in enumerate(columnas):
        if not numero(c.get("puntos")):
            inf.errores.append(f"columnas[{i}] sin «puntos» numéricos")
        if c.get("color") is not None and c.get("color") not in COLORES:
            inf.avisos.append(f"columnas[{i}]: color «{c.get('color')}»")
        if not str(c.get("titulo", "")).strip():
            inf.avisos.append(f"columnas[{i}] sin título")
    puntos = [c.get("puntos") for c in columnas]
    if len(set(map(str, puntos))) != len(puntos):
        inf.avisos.append("dos columnas con los mismos puntos (las pastillas y los tramos de «entrada» se confunden)")

    grupos: dict[str, list[int]] = {}
    opciones_fila: list[list[float]] = []
    obligatoria: list[bool] = []
    for f, fila in enumerate(filas):
        nombre = str(fila.get("nombre") or "").strip() or f"fila {f}"
        for k in fila:
            if k not in LLAVES_FILA:
                inf.avisos.append(f"«{nombre}»: llave desconocida «{k}»")
        desc = fila.get("descripciones") or []
        if len(desc) > len(columnas):
            inf.errores.append(f"«{nombre}»: {len(desc)} celdas para {len(columnas)} columnas (sobran)")
        elif len(desc) < len(columnas):
            inf.avisos.append(f"«{nombre}»: {len(desc)} celdas para {len(columnas)} columnas (las que faltan cuentan como «-»)")
        validas = [c for c in range(min(len(desc), len(columnas))) if not vacia(desc[c])]
        if not validas:
            inf.errores.append(f"«{nombre}»: ninguna celda con texto")
        if len(nombre) > 45:
            inf.avisos.append(f"«{nombre[:40]}…»: nombre de fila largo (> 45 caracteres)")
        detalles = fila.get("detalles") or []
        if len(detalles) > len(columnas):
            inf.errores.append(f"«{nombre}»: más «detalles» que columnas")
        for c, det in enumerate(detalles):
            if not vacia(det) and (c >= len(desc) or vacia(desc[c])):
                inf.avisos.append(f"«{nombre}»: detalle en una celda vacía (columna {c})")
        pts = [float(columnas[c]["puntos"]) for c in validas if numero(columnas[c].get("puntos"))]
        opciones_fila.append(pts)
        obligatoria.append(bool(pts) and 0 not in pts)
        if fila.get("grupo"):
            grupos.setdefault(str(fila["grupo"]), []).append(f)
        entrada = fila.get("entrada")
        if entrada is not None:
            chequear_entrada(nombre, entrada, columnas, validas, inf)

    for g, miembros in grupos.items():
        if len(miembros) < 2:
            inf.avisos.append(f"grupo «{g}» con una sola fila (no excluye a nadie)")

    # Totales alcanzables: cada fila suma una de sus opciones (o 0 si no es
    # obligatoria); de un grupo, sólo una fila.
    sueltas = [f for f in range(len(filas)) if not filas[f].get("grupo")]
    totales = {0.0}
    for f in sueltas:
        elecciones = set(opciones_fila[f]) | (set() if obligatoria[f] else {0.0})
        totales = {round(t + p, 6) for t in totales for p in elecciones}
    for miembros in grupos.values():
        opciones = set()
        alguna_obligatoria = any(obligatoria[f] for f in miembros)
        for f in miembros:
            opciones |= set(opciones_fila[f])
        if not alguna_obligatoria:
            opciones.add(0.0)
        totales = {round(t + p, 6) for t in totales for p in opciones}
    sin = sorted(t for t in totales if resultado_por_rango(d, t) is None)
    if sin:
        muestra = ", ".join(fmt(t) for t in sin[:8])
        inf.errores.append(f"totales posibles sin resultado: {muestra}{'…' if len(sin) > 8 else ''}")
    alcanzados = {resultado_por_rango(d, t) for t in totales}
    for i, r in enumerate(d.get("resultados") or []):
        if i not in alcanzados:
            inf.avisos.append(f"el resultado «{r.get('categoria')}» no se alcanza con ninguna combinación")
    if d.get("mostrarPuntaje", True) is not False and any(abs(p) >= 100 for ps in opciones_fila for p in ps):
        inf.avisos.append("puntos de 100 o más: si el total es un código, «mostrarPuntaje»: false")


def chequear_entrada(nombre: str, entrada: dict, columnas: list, validas: list[int], inf: Informe) -> None:
    tramos = entrada.get("tramos") or []
    if not tramos:
        inf.errores.append(f"«{nombre}»: «entrada» sin «tramos»")
        return
    for u in entrada.get("unidades") or []:
        if not numero(u.get("factor", 1)) or u.get("factor", 1) == 0:
            inf.errores.append(f"«{nombre}»: unidad «{u.get('unidad')}» con factor 0 o no numérico")
    puntos_validos = {float(columnas[c]["puntos"]) for c in validas if numero(columnas[c].get("puntos"))}
    for t in tramos:
        if not numero(t.get("puntos")):
            inf.errores.append(f"«{nombre}»: tramo sin «puntos»")
        elif float(t["puntos"]) not in puntos_validos:
            inf.errores.append(f"«{nombre}»: el tramo {tramo_txt(t)} da {fmt(t['puntos'])} puntos y esa celda está vacía")
    lo = entrada.get("min") if numero(entrada.get("min")) else None
    hi = entrada.get("max") if numero(entrada.get("max")) else None
    agujeros = huecos(tramos, lo, hi)
    if agujeros:
        inf.avisos.append(f"«{nombre}»: valores sin tramo, p. ej. {', '.join(fmt(round(x, 3)) for x in agujeros[:4])} (usa límites contiguos: 38,49 y 38,5)")
    solapes = solapados(tramos)
    if solapes:
        inf.errores.append(f"«{nombre}»: tramos solapados ({solapes}); manda el primero")


def tramo_txt(t: dict) -> str:
    a = fmt(t["min"]) if numero(t.get("min")) else "−∞"
    b = fmt(t["max"]) if numero(t.get("max")) else "∞"
    return f"[{a}, {b}]"


def solapados(tramos: list[dict]) -> str:
    def lim(t):
        return (t["min"] if numero(t.get("min")) else -math.inf, t["max"] if numero(t.get("max")) else math.inf)
    orden = sorted((lim(t), t) for t in tramos)
    for ((a1, b1), t1), ((a2, b2), t2) in zip(orden, orden[1:]):
        if a2 <= b1 and t1.get("puntos") != t2.get("puntos"):
            return f"{tramo_txt(t1)} y {tramo_txt(t2)}"
    return ""


def chequear_formulario(d: dict, inf: Informe) -> None:
    els = elementos(d)
    if not els:
        inf.errores.append("formulario sin elementos")
        return
    ids = [e.get("id") for e in els]
    for i in {x for x in ids if ids.count(x) > 1}:
        inf.errores.append(f"id repetido «{i}»")
    producidas: set[str] = set()
    for e in els:
        nombre = e.get("label") or e.get("id")
        for k in e:
            if k not in LLAVES_ELEMENTO:
                inf.avisos.append(f"«{nombre}»: llave desconocida «{k}»")
        if not e.get("id") or not e.get("label"):
            inf.errores.append(f"elemento sin «id» o «label» ({nombre})")
        tipo = e.get("tipo")
        if tipo == "input_numero":
            producidas.add(e["id"])
            if e.get("intervalos"):
                producidas.add(f"{e['id']}_puntos")
                lo = e.get("min") if numero(e.get("min")) else None
                hi = e.get("max") if numero(e.get("max")) else None
                agujeros = huecos(e["intervalos"], lo, hi)
                if agujeros:
                    inf.avisos.append(f"«{nombre}»: valores sin tramo, p. ej. {', '.join(fmt(round(x, 3)) for x in agujeros[:4])}")
            if not numero(e.get("min")) or not numero(e.get("max")):
                inf.faltas.append(f"«{nombre}»: sin «min»/«max» de lo posible")
            for u in e.get("unidades") or []:
                if not numero(u.get("factor", 1)) or u.get("factor", 1) == 0:
                    inf.errores.append(f"«{nombre}»: unidad «{u.get('unidad')}» con factor 0")
        elif tipo == "opciones":
            ops = e.get("opciones") or []
            if not ops:
                inf.errores.append(f"«{nombre}»: «opciones» vacía")
            for o in ops:
                if not str(o.get("label") or "").strip():
                    inf.errores.append(f"«{nombre}»: opción sin «label»")
                if numero(o.get("puntos")):
                    producidas.add(e["id"])
                for k in (o.get("valoresVariables") or {}):
                    producidas.add(k)
        else:
            inf.errores.append(f"«{nombre}»: tipo «{tipo}» desconocido (input_numero u opciones)")

    reglas = any("si" in r for r in d.get("resultados") or [])
    formula = d.get("formula")
    if formula:
        usadas = identificadores(formula)
        for v in sorted(usadas - producidas):
            inf.errores.append(f"la fórmula usa «{v}» y ningún elemento la fija")
        ckd = "142" in formula and {"scr", "edad", "kappa"} <= usadas
        for v in sorted(usadas):
            if v.lower().startswith("e") and not (ckd and v == "edad"):
                inf.errores.append(f"variable «{v}»: las versiones antiguas de la app leen la «e» inicial como el número e (renómbrala)")
    elif not reglas:
        inf.errores.append("formulario sin «formula» ni reglas (resultados[].si)")
    for i, ex in enumerate(d.get("extras") or []):
        for v in sorted(identificadores(str(ex.get("formula") or "")) - producidas - {"total"}):
            inf.errores.append(f"extras[{i}] usa «{v}» y ningún elemento la fija")

    if reglas:
        ids_reglas = {e.get("id") for e in els} | {f"{e.get('id')}_puntos" for e in els if e.get("intervalos")}
        chequear_sintaxis_reglas(d, ids_reglas, inf)
        if d.get("tipoCalculo") == "reglas" and not formula:
            inf.avisos.append("sólo reglas: las versiones antiguas de la app no la calculan (añade una «formula» equivalente)")
        ultimas = [i for i, r in enumerate(d["resultados"]) if "si" not in r]
        if ultimas and ultimas[0] != len(d["resultados"]) - 1:
            inf.avisos.append("hay un resultado sin «si» antes del final: los de después no se alcanzan")
    else:
        rangos_solapados(d, inf)

    recorrer_formulario(d, els, formula, reglas, inf)


def chequear_sintaxis_reglas(d: dict, ids: set, inf: Informe) -> None:
    def ver(c, donde):
        if not isinstance(c, dict):
            inf.errores.append(f"{donde}: condición que no es un objeto")
            return
        for k in ("todos", "alguno", "ninguno"):
            if k in c:
                if not isinstance(c[k], list) or not c[k]:
                    inf.errores.append(f"{donde}: «{k}» tiene que ser una lista no vacía")
                    return
                for sub in c[k]:
                    ver(sub, donde)
                return
        if "suma" in c:
            for i in c["suma"] if isinstance(c["suma"], list) else []:
                if i not in ids:
                    inf.errores.append(f"{donde}: «suma» usa «{i}», que no existe")
            if not any(numero(c.get(k)) for k in ("minimo", "maximo")):
                inf.errores.append(f"{donde}: «suma» sin «minimo» ni «maximo»")
            return
        if c.get("id") not in ids:
            inf.errores.append(f"{donde}: «id» «{c.get('id')}» no existe")
        ops = [k for k in c if k in OPERADORES]
        if not ops:
            inf.errores.append(f"{donde}: sin operador ({', '.join(sorted(OPERADORES))})")
        for k in c:
            if k not in OPERADORES and k != "id":
                inf.errores.append(f"{donde}: llave «{k}» desconocida en la condición")

    for i, r in enumerate(d.get("resultados") or []):
        if "si" in r:
            ver(r["si"], f"resultados[{i}].si")


class Respuestas:
    """Las respuestas de una combinación, para evaluar reglas y fórmula."""

    def __init__(self, els: list[dict], eleccion: dict[str, int], numeros: dict[str, float]):
        self.els = {e["id"]: e for e in els}
        self.eleccion = eleccion
        self.numeros = numeros

    def valor(self, id_: str) -> float | None:
        e = self.els.get(id_)
        if e is None and id_.endswith("_puntos"):
            # «<id>_puntos»: los puntos del intervalo en que cae el número.
            base = self.els.get(id_[: -len("_puntos")])
            if base is None or base.get("tipo") != "input_numero":
                return None
            x = self.numeros.get(base["id"])
            t = tramo_de(base.get("intervalos") or [], x) if x is not None else None
            return None if t is None else float(t["puntos"])
        if e is None:
            return None
        if e.get("tipo") == "input_numero":
            return self.numeros.get(id_)
        i = self.eleccion.get(id_)
        if i is None:
            return None
        return valor_opcion(e["opciones"][i], i)

    def variables(self) -> dict[str, float]:
        v: dict[str, float] = {}
        for id_, e in self.els.items():
            if e.get("tipo") == "input_numero":
                x = self.numeros.get(id_)
                if x is None:
                    continue
                v[id_] = x
                t = tramo_de(e.get("intervalos") or [], x)
                if e.get("intervalos") and t is not None:
                    v[f"{id_}_puntos"] = float(t["puntos"])
            else:
                i = self.eleccion.get(id_)
                if i is None:
                    continue
                o = e["opciones"][i]
                if numero(o.get("puntos")):
                    v[id_] = float(o["puntos"])
                for k, x in (o.get("valoresVariables") or {}).items():
                    v[k] = float(x)
        return v

    def cumple(self, c: dict) -> bool:
        for k, f in (("todos", all), ("alguno", any)):
            if k in c:
                return f(self.cumple(s) for s in c[k])
        if "ninguno" in c:
            return not any(self.cumple(s) for s in c["ninguno"])
        if "suma" in c:
            vals = [self.valor(i) for i in c["suma"]]
            if any(v is None for v in vals):
                return False
            s = sum(vals)
            return (not numero(c.get("minimo")) or s >= c["minimo"]) and (not numero(c.get("maximo")) or s <= c["maximo"])
        v = self.valor(c.get("id"))
        if v is None:
            return False
        ok, alguna = True, False
        if isinstance(c.get("en"), list):
            alguna = True
            ok = ok and v in [float(x) for x in c["en"]]
        for k, f in (("igual", lambda a, b: a == b), ("distinto", lambda a, b: a != b),
                     ("mayor", lambda a, b: a > b), ("menor", lambda a, b: a < b),
                     ("mayorIgual", lambda a, b: a >= b), ("menorIgual", lambda a, b: a <= b)):
            if numero(c.get(k)):
                alguna = True
                ok = ok and f(v, float(c[k]))
        return ok and alguna


def recorrer_formulario(d: dict, els: list[dict], formula: str | None, reglas: bool, inf: Informe) -> None:
    discretos = [e for e in els if e.get("tipo") == "opciones" and e.get("opciones")]
    campos = [e for e in els if e.get("tipo") == "input_numero"]
    ejes = [[(e["id"], i) for i in range(len(e["opciones"]))] for e in discretos]
    ejes += [[(e["id"], x) for x in muestras(e)] for e in campos]
    total = math.prod(len(x) for x in ejes) if ejes else 0
    if total == 0:
        return
    azar = random.Random(7)
    if total <= MAX_COMBINACIONES:
        combinaciones = itertools.product(*ejes)
    else:
        combinaciones = (tuple(azar.choice(eje) for eje in ejes) for _ in range(MAX_COMBINACIONES))
    decimales = int(d["decimales"]) if numero(d.get("decimales")) else 2
    resultados = d.get("resultados") or []
    sin, distintos, alcanzados = [], [], set()
    # Las versiones antiguas de la app no redondean a «decimales» (sólo a 2):
    # con tramos enteros (0-14 y 15-29), 14,67 se queda sin resultado.
    sin_antigua, continua = [], False
    ids_campo = {e["id"] for e in campos}
    for combo in combinaciones:
        eleccion = {k: v for k, v in combo if k not in ids_campo}
        numeros = {k: float(v) for k, v in combo if k in ids_campo}
        r = Respuestas(els, eleccion, numeros)
        por_formula = None
        if formula:
            v = r.variables()
            if "142" in formula and {"scr", "edad", "kappa"} <= v.keys():
                x = ckdepi(v)
            else:
                x = evaluar(formula, v)
            if x is not None:
                continua = continua or abs(x - round(x)) > 1e-9
                por_formula = resultado_por_rango(d, redondear(x, decimales))
                if por_formula is None:
                    sin.append((describir(els, eleccion, numeros), fmt(round(x, 3))))
                elif decimales < 2 and resultado_por_rango(d, redondear(x, 2)) is None:
                    sin_antigua.append((describir(els, eleccion, numeros), fmt(round(x, 2))))
        if reglas:
            por_reglas = next((i for i, res in enumerate(resultados) if "si" not in res or r.cumple(res["si"])), None)
            alcanzados.add(por_reglas)
            if por_reglas is None:
                sin.append((describir(els, eleccion, numeros), "ninguna regla"))
            elif formula and por_formula is not None and por_formula != por_reglas:
                distintos.append((describir(els, eleccion, numeros), resultados[por_formula].get("categoria"), resultados[por_reglas].get("categoria")))
        else:
            alcanzados.add(por_formula)
    hay_campos = bool(campos)
    if sin:
        caso, valor = sin[0]
        texto = f"{len(sin)} combinación(es) sin resultado, p. ej. {caso} → {valor}"
        (inf.avisos if hay_campos and not reglas else inf.errores).append(texto)
    if not sin_antigua and continua and decimales < 2 and not reglas:
        tramos = sorted((r["min"], r["max"]) for r in resultados if numero(r.get("min")) and numero(r.get("max")))
        for (_, hasta), (desde, _) in zip(tramos, tramos[1:]):
            if desde - hasta > 0.01 + 1e-9:
                sin_antigua.append((f"un valor entre {fmt(hasta)} y {fmt(desde)}", fmt(round((hasta + desde) / 2, 2))))
    if sin_antigua:
        caso, valor = sin_antigua[0]
        inf.errores.append(
            f"en las versiones antiguas de la app (no redondean a «decimales») {len(sin_antigua)} combinación(es) "
            f"quedan sin resultado, p. ej. {caso} → {valor}: usa límites contiguos con decimales (14.99 y 15)")
    if distintos:
        caso, f_, r_ = distintos[0]
        inf.errores.append(f"la fórmula y las reglas no coinciden en {len(distintos)} caso(s), p. ej. {caso}: fórmula «{f_}», reglas «{r_}»")
    for i, res in enumerate(resultados):
        if i not in alcanzados and not hay_campos and total <= MAX_COMBINACIONES:
            inf.avisos.append(f"el resultado «{res.get('categoria')}» no se alcanza con ninguna combinación")


def describir(els: list[dict], eleccion: dict, numeros: dict) -> str:
    partes = []
    for e in els:
        if e["id"] in eleccion:
            partes.append(f"{e['id']}={e['opciones'][eleccion[e['id']]].get('label')}")
        elif e["id"] in numeros:
            partes.append(f"{e['id']}={fmt(numeros[e['id']])}")
    return "{" + ", ".join(partes[:6]) + ("…" if len(partes) > 6 else "") + "}"


# --------------------------------------------------------------------------
# La nota
# --------------------------------------------------------------------------

def puntuar(d: dict, inf: Informe) -> None:
    puntos = 0.0
    descripcion = str(d.get("descripcion") or "")
    if len(descripcion) >= 120:
        puntos += 15
    elif descripcion:
        puntos += 7
        inf.faltas.append("«descripcion» corta: qué estima, en quién y de qué publicación sale")
    else:
        inf.faltas.append("sin «descripcion»")
    refs = d.get("referencias") or []
    if any(str(r.get("url") or r.get("enlace") or "").startswith("http") for r in refs):
        puntos += 15
    else:
        inf.faltas.append("sin referencia con enlace (PubMed o DOI)")
    if any(r.get("titulo") and r.get("texto") for r in refs):
        puntos += 10
    else:
        inf.faltas.append("sin cita literal («texto») de la fuente en las referencias")
    resultados = d.get("resultados") or []
    con_conducta = [r for r in resultados if str(r.get("approach") or "").strip()]
    if resultados:
        puntos += 25 * len(con_conducta) / len(resultados)
        if len(con_conducta) < len(resultados):
            inf.faltas.append(f"conducta («approach») en {len(con_conducta)} de {len(resultados)} resultados")
    largos = [r.get("categoria") for r in resultados if len(str(r.get("categoria") or "").split()) > 7]
    if largos:
        inf.faltas.append(f"categorías largas (> 7 palabras): «{largos[0]}»")
    if d.get("instrucciones"):
        puntos += 10
    else:
        inf.faltas.append("sin «instrucciones» (cómo se puntúa: qué valor, qué momento, qué excluir)")
    if d.get("limitaciones"):
        puntos += 10
    else:
        inf.faltas.append("sin «limitaciones» (cuándo no aplica)")
    if resultados and all(r.get("color") in COLORES for r in resultados):
        puntos += 5
    else:
        inf.faltas.append("resultados sin color")
    puntos += max(0, 10 - 2 * len(inf.avisos))
    inf.nota = 0 if inf.errores else round(puntos)


# --------------------------------------------------------------------------

_RAMAS: dict[str, list[tuple[str, str, int]]] | None = None


def ramas() -> dict[str, list[tuple[str, str, int]]]:
    """calculadora → [(algoritmo, nodo, nº de opciones)] de los nodos que la
    abren con `ramificar: true` (su resultado elige la rama)."""
    global _RAMAS
    if _RAMAS is not None:
        return _RAMAS
    _RAMAS = {}
    for carpeta in ALGORITMOS:
        for ruta in sorted(carpeta.glob("*.json")):
            try:
                alg = json.loads(ruta.read_text(encoding="utf-8"))
            except (json.JSONDecodeError, UnicodeDecodeError):
                continue
            for id_, nodo in (alg.get("nodos") or {}).items() if isinstance(alg, dict) else []:
                calc = nodo.get("calculadora") if isinstance(nodo, dict) else None
                if not isinstance(calc, dict) or calc.get("ramificar") is not True:
                    continue
                nombre = str(calc.get("archivo") or "").split("/")[-1].lower()
                _RAMAS.setdefault(nombre, []).append(
                    (f"{carpeta.name}/{ruta.name}", id_, len(nodo.get("opciones") or [])))
    return _RAMAS


def chequear_ramas(d: dict, nombre: str, inf: Informe) -> None:
    for algoritmo, nodo, n in ramas().get(nombre.lower(), []):
        for r in d.get("resultados") or []:
            idx = r.get("match_opcion_index", r.get("matchOpcionIndex", -1))
            if isinstance(idx, int) and idx >= n:
                inf.errores.append(
                    f"«{r.get('categoria')}» elige la opción {idx} y el nodo {nodo} de {algoritmo} "
                    f"sólo tiene {n}: el resultado no lleva a ninguna rama")


def medir(ruta: Path) -> Informe:
    inf = Informe(archivo=ruta.name)
    try:
        d = json.loads(ruta.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError) as e:
        inf.errores.append(f"JSON inválido: {e}")
        return inf
    if not isinstance(d, dict):
        inf.errores.append("el JSON no es un objeto")
        return inf
    inf.titulo = str(d.get("titulo") or "")
    reglas = any(isinstance(r, dict) and "si" in r for r in d.get("resultados") or [])
    chequear_comun(d, inf)
    if inf.errores and not d.get("resultados"):
        return inf
    if es_formulario(d):
        inf.modelo = "reglas" if reglas else "fórmula"
        chequear_formulario(d, inf)
    else:
        inf.modelo = "tabla"
        rangos_solapados(d, inf)
        chequear_tabla(d, inf)
    chequear_ramas(d, ruta.name, inf)
    puntuar(d, inf)
    return inf


def todos() -> list[Path]:
    return sorted(CARPETA.glob("*.json"))


def resolver(arg: str) -> Path:
    p = Path(arg)
    if p.exists():
        return p.resolve()
    nombre = arg if arg.endswith(".json") else f"{arg}.json"
    return (CARPETA / Path(nombre).name).resolve()


def fuera_del_indice() -> list[str]:
    try:
        indice = json.loads(INDICE.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return []
    listados = {str(c.get("archivo", "")).split("/")[-1].lower() for c in indice}
    return [p.name for p in todos() if p.name.lower() not in listados]


def tabla(informes: list[Informe], md: bool) -> str:
    lineas = []
    if md:
        lineas += ["| Calculadora | Modelo | Nota | Errores | Avisos |", "|---|---|---|---|---|"]
        for i in informes:
            lineas.append(f"| {i.archivo} | {i.modelo} | {i.nota} | {len(i.errores)} | {len(i.avisos)} |")
    else:
        for i in informes:
            marca = "✗" if i.errores else ("·" if i.avisos else " ")
            lineas.append(f"{marca} {i.nota:>3}  {i.modelo:<8} {i.archivo:<38} {len(i.errores)} errores, {len(i.avisos)} avisos")
        media = sum(i.nota for i in informes) / max(len(informes), 1)
        lineas.append(f"\n{len(informes)} calculadoras · nota media {media:.0f} · "
                      f"{sum(bool(i.errores) for i in informes)} con errores")
        sueltas = fuera_del_indice()
        if sueltas:
            lineas.append(f"Fuera de indices/index_calculadoras.json (la app no las enseña en el menú): {', '.join(sueltas)}")
    return "\n".join(lineas)


def detalle(i: Informe) -> str:
    lineas = [f"{i.archivo} · {i.titulo} · {i.modelo} · nota {i.nota}"]
    for titulo, lista in (("Errores", i.errores), ("Avisos", i.avisos), ("Le falta", i.faltas)):
        if lista:
            lineas.append(f"\n{titulo}:")
            lineas += [f"  - {x}" for x in lista]
    if not (i.errores or i.avisos or i.faltas):
        lineas.append("Completa: sin errores, avisos ni faltas.")
    return "\n".join(lineas)


def hook() -> int:
    """PostToolUse de Claude Code: chequea la calculadora que se acaba de escribir."""
    try:
        evento = json.load(sys.stdin)
    except json.JSONDecodeError:
        return 0
    ruta = Path((evento.get("tool_input") or {}).get("file_path") or "")
    try:
        ruta.resolve().relative_to(CARPETA)
    except ValueError:
        return 0
    if ruta.suffix != ".json" or not ruta.exists():
        return 0
    inf = medir(ruta.resolve())
    if not inf.errores:
        return 0
    print(f"data/calculadoras/{ruta.name}: {len(inf.errores)} error(es):", file=sys.stderr)
    for e in inf.errores[:25]:
        print(f"  - {e}", file=sys.stderr)
    return 2  # PostToolUse: exit 2 devuelve stderr a Claude para que lo arregle


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("calculadoras", nargs="*", help="archivos o nombres (asa, westley.json)")
    ap.add_argument("--md", action="store_true", help="tabla en Markdown")
    ap.add_argument("--json", action="store_true", help="salida JSON")
    ap.add_argument("--chequeo", metavar="RUTA", nargs="+", help="sólo errores")
    ap.add_argument("--hook", action="store_true", help="modo PostToolUse de Claude Code")
    args = ap.parse_args()

    if args.hook:
        return hook()
    if args.chequeo:
        malos = 0
        for arg in args.chequeo:
            inf = medir(resolver(arg))
            malos += bool(inf.errores)
            for e in inf.errores:
                print(f"{inf.archivo}: {e}")
        return 1 if malos else 0

    rutas = [resolver(a) for a in args.calculadoras] if args.calculadoras else todos()
    informes = sorted((medir(r) for r in rutas), key=lambda i: (i.nota, i.archivo))
    if args.json:
        print(json.dumps([i.__dict__ for i in informes], ensure_ascii=False, indent=1))
    elif len(informes) == 1 and not args.md:
        print(detalle(informes[0]))
    else:
        print(tabla(informes, args.md))
    return 0


if __name__ == "__main__":
    sys.exit(main())
