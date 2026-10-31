#!/usr/bin/env python3
"""Siglas de un algoritmo que no están en el glosario (data/glosario.json).

La app subraya las siglas del glosario y enseña su significado al tocarlas, así
que el texto de los nodos no las desarrolla. Toda sigla que se use tiene que
estar en el glosario.

Uso:
    python3 tools/glosario.py --faltan <algoritmo>    # siglas que faltan, con un ejemplo
    python3 tools/glosario.py --faltan --todos        # en todos los algoritmos visibles
"""
import argparse
import json
import re
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
GLOSARIO = RAIZ / "data" / "glosario.json"

# Mayúsculas que no son siglas clínicas: números romanos, segmentos y grados,
# nombres de ensayos.
NO_SIGLA = re.compile(r"^(?:[IVX]+[ab]?|[A-Z]\d|[UGBM]\d+|DE|UP|HAS|BLED|VASc|CAST|IST|WAKE|TRACE|EXTEND|DIAGRAM|CHANCE|"
                      r"INSPIRES|POINT|PROTECTION|AKIKI|HELLP|KAMPS|FOSF|GAIS|ASGE|BSG|ACORL|RCUK|BNFc|AIR|COI|R4U|PFAPA|NIH|CKD|EPI|aGLP|GLP)$")
SIGLA = re.compile(r"(?<![\w])(?:[a-z]{0,2}[A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ0-9]+[a-z]?(?: II)?)(?![\w])")


def textos(nodo):
    for k in ("texto", "titulo", "contexto", "pie_nodo", "nota_adicional"):
        if nodo.get(k):
            yield nodo[k]
    for a in nodo.get("alertas", []):
        yield a.get("titulo", "")
        yield a.get("texto", "")
    for o in nodo.get("opciones", []):
        yield o.get("texto", "")
    for f in nodo.get("farmacos", []):
        for k in ("nombre", "dosis", "pauta", "nota"):
            yield f.get(k) or ""
    if nodo.get("checklist"):
        yield from nodo["checklist"].get("items", [])
    if nodo.get("tabla"):
        for fila in nodo["tabla"].get("filas", []):
            yield " ".join(map(str, fila))
    for m in nodo.get("media", []):
        yield m.get("descripcion", "")
        yield m.get("info", "")


def archivo(nombre):
    for carpeta in ("Adultos", "Pediatria"):
        p = RAIZ / "data" / carpeta / (nombre if nombre.endswith(".json") else nombre + ".json")
        if p.exists():
            return p
    sys.exit(f"no encuentro el algoritmo {nombre}")


def visibles():
    for carpeta in ("Adultos", "Pediatria"):
        for p in sorted((RAIZ / "data" / carpeta).glob("*.json")):
            try:
                d = json.loads(p.read_text())
            except Exception:
                continue
            if isinstance(d, dict) and "nodos" in d and not d.get("oculto"):
                yield p


def faltan(ruta, conocidas):
    d = json.loads(ruta.read_text())
    vistas = {}
    for nid, n in d["nodos"].items():
        for t in textos(n):
            limpio = re.sub(r"\{#[0-9A-Fa-f]{6}:", "", t or "")
            for s in SIGLA.findall(limpio):
                s = s.strip()
                if s not in conocidas and not NO_SIGLA.match(s) and s not in vistas:
                    vistas[s] = nid
    return vistas


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("algoritmo", nargs="?")
    ap.add_argument("--faltan", action="store_true", required=True)
    ap.add_argument("--todos", action="store_true")
    a = ap.parse_args()
    conocidas = set(json.loads(GLOSARIO.read_text())["siglas"])
    rutas = list(visibles()) if a.todos else [archivo(a.algoritmo)]
    total = 0
    for ruta in rutas:
        f = faltan(ruta, conocidas)
        total += len(f)
        if f:
            print(f"{ruta.stem}: {len(f)} siglas sin glosario")
            for s, nid in f.items():
                print(f"   {s:10} (p. ej. en {nid})")
    if not total:
        print("todas las siglas están en el glosario")
    sys.exit(1 if total else 0)


if __name__ == "__main__":
    main()
