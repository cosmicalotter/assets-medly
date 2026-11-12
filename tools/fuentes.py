#!/usr/bin/env python3
"""«Abrir fuente»: el PDF original de la guía, abierto en la página de la cita.

Cada referencia de un nodo tiene un botón «Abrir fuente» que abre su `url` tal
cual en el navegador. La norma (NORMA.md §7) pide que esa `url` sea, siempre
que se pueda, el PDF original de la guía, y que todo enlace a un PDF lleve la
página exacta de la cita con `#page=N`. N es la página **física** del PDF
(la 1 es la primera hoja del archivo), no el número impreso: en la OMS el
resumen va en romanos y la página 10 del PDF es la «viii»; en las revistas la
página impresa es la «1257». Por eso N no se copia de `paginas`: se busca la
cita literal (`texto`) dentro del mismo PDF que sirve la `url`.

Uso:
  python3 tools/fuentes.py [ALG ...]
      revisa: referencias a un PDF sin `#page=N` o con el fragmento mal
      escrito, y fuentes con cita que no van a un PDF (¿hay PDF oficial?).
      Sin algoritmos, todos los visibles. Sale con 1 si hay un PDF sin página.

  python3 tools/fuentes.py ALG --url URL_DEL_PDF [--pdf COPIA.pdf]
                           [--de URL_VIEJA ...] [--aplicar]
      ancla cada referencia cuya `url` (sin el `#…`) es URL_DEL_PDF —o una de
      las `--de`, p. ej. la página de aterrizaje o el DOI de la misma guía—:
      busca su `texto` en el PDF y le pone `URL_DEL_PDF#page=<física>`. Sin
      `--pdf`, descarga la URL (así la página es la del archivo que abre el
      usuario). Sin `--aplicar` sólo enseña lo que cambiaría. Lo que no se
      ancla se lista con una página sugerida (`paginas` + el desfase de las
      citas que sí se anclaron) para comprobarla a mano.

Sin dependencias de Python: lee el PDF con `pdftotext` (poppler) o, si está,
con PyMuPDF.
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import sys
import tempfile
import unicodedata
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import norma  # noqa: E402  (resolver, todos, DATA)

# --- qué es un PDF y qué página lleva ----------------------------------------

#: `.pdf` en la ruta, o rutas que sirven un PDF sin extensión (NICE:
#: `/resources/<nombre>-pdf-66141662244037`; revistas de la AHA:
#: `/doi/pdf/<doi>`; revistas de Elsevier como CHEST: `/article/<pii>/pdf`).
_PDF = re.compile(r"\.pdf$|-pdf-\d+$|^/doi/pdf/|/article/[^/]+/pdf$", re.I)
_PAGE = re.compile(r"^page=(\d+)$")


def partir(url: str) -> tuple[str, str]:
    """La URL sin el fragmento, y el fragmento."""
    base, _, frag = url.partition("#")
    return base, frag


def es_pdf(url: str) -> bool:
    base, _ = partir(url.strip())
    ruta = re.sub(r"^https?://[^/]+", "", base).split("?")[0]
    return bool(_PDF.search(ruta))


def pagina_fragmento(url: str) -> int | None:
    """N de `#page=N`; None si no hay fragmento o está mal escrito."""
    m = _PAGE.match(partir(url)[1])
    return int(m.group(1)) if m and int(m.group(1)) > 0 else None


def referencias(valor, ruta: str = ""):
    """Toda referencia con `url` del algoritmo: nodos, imágenes, fórmulas, burbujas, bibliografía."""
    if isinstance(valor, dict):
        if isinstance(valor.get("url"), str) and any(k in valor for k in ("texto", "paginas", "cita", "fuente")):
            yield ruta, valor
        for k, v in valor.items():
            yield from referencias(v, f"{ruta}.{k}" if ruta else k)
    elif isinstance(valor, list):
        for i, v in enumerate(valor):
            yield from referencias(v, f"{ruta}[{i}]")


def tiene_cita(ref: dict) -> bool:
    """Una referencia de paso (cita o página). La bibliografía general no tiene página que abrir."""
    return bool((ref.get("texto") or "").strip() or (ref.get("paginas") or "").strip())


def revisar(alg: dict) -> tuple[list[str], list[str]]:
    """(faltas, avisos). Falta: PDF sin página o fragmento mal escrito. Aviso: cita que no abre un PDF."""
    faltas: list[str] = []
    web: Counter[str] = Counter()
    for ruta, ref in referencias(alg):
        url = ref["url"].strip()
        if not url or "TODO" in url:
            continue
        if es_pdf(url):
            frag = partir(url)[1]
            if frag and pagina_fragmento(url) is None:
                faltas.append(f"{ruta}: «#{frag}» no es «#page=N» (el visor de PDF lo ignora)")
            elif tiene_cita(ref) and not frag:
                faltas.append(f"{ruta}: PDF sin «#page=N» (página {ref.get('paginas') or '?'} impresa) → {url}")
        elif tiene_cita(ref):
            web[partir(url)[0]] += 1
    avisos = [f"{n} cita(s) abren {u}, que no es un PDF: ¿hay PDF oficial y libre de esa guía?" for u, n in web.most_common()]
    return faltas, avisos


# --- leer el PDF -------------------------------------------------------------


def paginas_pdf(ruta: Path) -> list[str]:
    try:
        import fitz  # type: ignore

        with fitz.open(ruta) as doc:
            return [p.get_text() for p in doc]
    except ImportError:
        pass
    if not shutil.which("pdftotext"):
        sys.exit("hace falta pdftotext (poppler-utils) o PyMuPDF para leer el PDF")
    salida = subprocess.run(["pdftotext", str(ruta), "-"], capture_output=True, check=True)
    texto = salida.stdout.decode("utf-8", "replace")
    paginas = texto.split("\f")
    if paginas and not paginas[-1].strip():
        paginas.pop()
    return paginas


def normalizar(texto: str) -> str:
    """Minúsculas, sin tildes, sin guiones de corte de línea ni signos: sólo palabras."""
    texto = re.sub(r"(\w)-\s*\n\s*(\w)", r"\1\2", texto)
    texto = unicodedata.normalize("NFKD", texto)
    texto = "".join(c for c in texto if not unicodedata.combining(c)).lower()
    texto = texto.replace("ﬁ", "fi").replace("ﬂ", "fl")
    return " ".join(re.findall(r"[a-z0-9]+", texto))


class Indice:
    """El PDF entero como una sola cadena normalizada, con la página de cada tramo."""

    def __init__(self, paginas: list[str]):
        self.texto = ""
        self.inicios: list[int] = []
        for p in paginas:
            self.inicios.append(len(self.texto))
            self.texto += normalizar(p) + " "
        self.total = len(paginas)

    def pagina(self, pos: int) -> int:
        n = 0
        for i, ini in enumerate(self.inicios):
            if ini <= pos:
                n = i
            else:
                break
        return n + 1

    def buscar(self, cita: str) -> list[int]:
        """Páginas físicas (desde 1) donde empieza la cita; prueba la cita entera y luego trozos."""
        trozos = [t for t in re.split(r"…|\.\.\.|\[[^\]]*\]", cita) if t.strip()]
        trozos.sort(key=len, reverse=True)
        for trozo in trozos[:1] or [cita]:
            palabras = normalizar(trozo).split()
            if len(palabras) < 4:
                continue
            candidatos = [palabras]
            # Si la cita entera no aparece (una tilde, una cifra con otro
            # formato), se prueban ventanas de 8 palabras.
            candidatos += [palabras[i:i + 8] for i in range(0, max(1, len(palabras) - 7), 4)]
            for c in candidatos:
                aguja = " " + " ".join(c) + " "
                posiciones = [m.start() + 1 for m in re.finditer(re.escape(aguja), " " + self.texto)]
                if posiciones:
                    return sorted({self.pagina(max(0, p - 1)) for p in posiciones})
        return []


def impresa(paginas: str) -> int | None:
    m = re.match(r"\s*[a-z]?(\d+)", paginas or "", re.I)
    return int(m.group(1)) if m else None


def descargar(url: str, carpeta: Path) -> Path:
    destino = carpeta / "guia.pdf"
    subprocess.run(["curl", "-sSL", "--fail", "-A", "Mozilla/5.0", "-o", str(destino), url], check=True)
    if destino.read_bytes()[:5] != b"%PDF-":
        sys.exit(f"{url} no sirve un PDF (¿página de aterrizaje, bloqueo o Cloudflare?); pasa la copia con --pdf")
    return destino


def anclar(ruta_alg: Path, url: str, pdf: Path | None, de: list[str], aplicar: bool) -> int:
    url = partir(url.strip())[0]
    if not es_pdf(url):
        print(f"aviso: {url} no parece un PDF por su ruta; se sigue porque se pidió", file=sys.stderr)
    with tempfile.TemporaryDirectory() as tmp:
        archivo = pdf or descargar(url, Path(tmp))
        indice = Indice(paginas_pdf(archivo))
    crudo = ruta_alg.read_text(encoding="utf-8")
    alg = json.loads(crudo)
    bases = {url, *(partir(d.strip())[0] for d in de)}
    halladas: list[tuple[str, dict, list[int], int | None]] = []
    sueltas: list[tuple[str, dict]] = []
    for ruta, ref in referencias(alg):
        if partir(ref["url"].strip())[0] not in bases or not tiene_cita(ref):
            continue
        paginas = indice.buscar(ref.get("texto") or "")
        if paginas:
            halladas.append((ruta, ref, paginas, impresa(ref.get("paginas") or "")))
        else:
            sueltas.append((ruta, ref))

    # El desfase física − impresa sale de las citas que aparecen una sola vez;
    # con él se elige entre las que aparecen en varias páginas.
    desfases = Counter(p[0] - i for _, _, p, i in halladas if len(p) == 1 and i is not None)
    desfase = desfases.most_common(1)[0][0] if desfases else None
    anclas: list[tuple[str, dict, int]] = []
    for ruta, ref, paginas, imp in halladas:
        esperada = imp + (desfase or 0) if imp is not None else None
        fisica = min(paginas, key=lambda p: abs(p - esperada)) if esperada is not None else paginas[0]
        if len(paginas) > 1 and (esperada is None or abs(fisica - esperada) > 1):
            print(f"{ruta}: la cita sale en las páginas {paginas}; se usa la {fisica}, compruébalo")
        anclas.append((ruta, ref, fisica))

    cambios = 0
    for ruta, ref, fisica in anclas:
        nueva = f"{url}#page={fisica}"
        if ref["url"] != nueva:
            print(f"{ruta}: p. {ref.get('paginas') or '?'} impresa → #page={fisica}")
            ref["url"] = nueva
            cambios += 1
    for ruta, ref in sueltas:
        imp = impresa(ref.get("paginas") or "")
        sugerida = f"; prueba #page={imp + desfase}" if imp is not None and desfase is not None else ""
        print(f"{ruta}: la cita no se encontró en el PDF (p. {ref.get('paginas') or '?'} impresa{sugerida}); poner a mano tras mirarla")
    print(f"{len(anclas)} anclada(s), {len(sueltas)} sin anclar, {cambios} cambio(s) · PDF de {indice.total} páginas"
          + (f" · desfase más común física − impresa: {desfase:+d}" if desfase is not None else ""))

    if aplicar and cambios:
        sangria = next((n for n in (2, 1, 4) if json.dumps(json.loads(crudo), ensure_ascii=False, indent=n) + "\n" == crudo), None)
        if sangria is None:
            print(f"{ruta_alg.name}: no se reescribe (su formato no es el estándar); aplicar a mano")
            return 1
        ruta_alg.write_text(json.dumps(alg, ensure_ascii=False, indent=sangria) + "\n", encoding="utf-8")
        print(f"{ruta_alg.relative_to(norma.RAIZ)}: escrito")
    elif cambios:
        print("(sin --aplicar: no se escribió nada)")
    return 1 if sueltas else 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("algoritmos", nargs="*", help="archivos o nombres (sepsis, Adultos/sepsis.json)")
    ap.add_argument("--url", help="URL del PDF original de la guía: ancla las citas de esa guía")
    ap.add_argument("--pdf", type=Path, help="copia local del mismo PDF (si no, se descarga --url)")
    ap.add_argument("--de", action="append", default=[], help="otra URL de la misma guía que se cambia por --url (aterrizaje, DOI)")
    ap.add_argument("--aplicar", action="store_true", help="escribe los cambios en el JSON")
    args = ap.parse_args()

    if args.url:
        if len(args.algoritmos) != 1:
            sys.exit("--url va con un solo algoritmo")
        return anclar(norma.resolver(args.algoritmos[0]), args.url, args.pdf, args.de, args.aplicar)

    rutas = [norma.resolver(a) for a in args.algoritmos] if args.algoritmos else norma.todos()
    con_faltas = 0
    for ruta in rutas:
        alg = json.loads(ruta.read_text(encoding="utf-8"))
        if alg.get("oculto") and not args.algoritmos:
            continue
        faltas, avisos = revisar(alg)
        nombre = ruta.relative_to(norma.DATA)
        if not args.algoritmos:
            print(f"{nombre}: {len(faltas)} PDF sin página · {len(avisos)} fuente(s) web con cita")
        else:
            for f in faltas:
                print(f"{nombre}: {f}")
            for a in avisos:
                print(f"{nombre}: aviso: {a}")
        con_faltas += bool(faltas)
    return 1 if con_faltas else 0


if __name__ == "__main__":
    sys.exit(main())
