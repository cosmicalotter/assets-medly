#!/usr/bin/env python3
"""Busca fotos reales con licencia libre en Wikimedia Commons y las descarga.

Desde la nube la API de Commons (api.php) y upload.wikimedia.org suelen responder
429; las páginas HTML de Commons y thumb.php sí responden si se va despacio. Por
eso este script lee la búsqueda avanzada en HTML y la licencia de la ficha de cada
archivo, y descarga por thumb.php.

Uso:
  python3 tools/medios/commons_buscar.py buscar "placenta" "fetal doppler" [--n 8]
  python3 tools/medios/commons_buscar.py ficha "File:Placenta_001.jpg"
  python3 tools/medios/commons_buscar.py bajar "Placenta_001.jpg" tools/medios/figuras/<carpeta>/fuentes/commons_Placenta_001.jpg [--ancho 1280]

Licencias que sirven (uso comercial): CC0, dominio público (Public domain, PDM),
CC BY y CC BY-SA. Las demás (NC, ND, «Attribution» sin versión, GFDL sola) no.
La licencia que imprime `buscar` es la que declara la ficha; se confirma con
`ficha` antes de usar la imagen, y se anota autor, URL y licencia en creditos.json.

Nunca se pone en el User-Agent el correo del usuario ni otro dato personal.
"""
import argparse
import html
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

UA = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) EmpiricaContenido/1.0"}
PAUSA = 3  # segundos entre peticiones: más rápido, Commons devuelve 429
LIBRES = re.compile(r"^(CC0|Public domain|PDM|CC BY(-SA)? \d)", re.I)


def get(url, binario=False):
    for intento in range(6):
        try:
            datos = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60).read()
            return datos if binario else datos.decode("utf8", "replace")
        except urllib.error.HTTPError as e:
            if e.code != 429 or intento == 5:
                raise
            time.sleep(15 * (intento + 1))


def buscar(q, n=8):
    url = "https://commons.wikimedia.org/w/index.php?" + urllib.parse.urlencode(
        {"search": q + " filetype:bitmap", "title": "Special:Search", "profile": "advanced",
         "fulltext": "1", "ns6": "1", "limit": n})
    h = get(url)
    return list(dict.fromkeys(html.unescape(m) for m in re.findall(r'href="/wiki/(File:[^"#?]+)"', h)))[:n]


def campo(h, nombre):
    i = h.find(">" + nombre + "<")
    if i < 0:
        return ""
    t = re.sub(r"<[^>]+>", " ", h[i:i + 1500])
    t = re.sub(r"\s+", " ", html.unescape(t)).strip()
    return t[len(nombre) + 1:].split(" Licensing")[0].strip()[:200]


def ficha(titulo):
    h = get("https://commons.wikimedia.org/wiki/" + urllib.parse.quote(titulo))
    lic = [x.strip() for x in re.findall(r'licensetpl(?:_|&#95;)short"[^>]*>(.*?)<', h)] or ["?"]
    dim = re.search(r"([\d,]+) × ([\d,]+) pixels, file size", h)
    return {
        "archivo": titulo,
        "licencia": sorted(set(lic)),
        "libre": any(LIBRES.match(x) for x in lic) and not any("NC" in x or "ND" in x for x in lic),
        "autor": campo(h, "Author"),
        "descripcion": campo(h, "Description"),
        "tamano": "×".join(dim.groups()) if dim else "?",
        "url": "https://commons.wikimedia.org/wiki/" + titulo,
    }


def bajar(archivo, destino, ancho=1280):
    archivo = archivo.removeprefix("File:")
    datos = get("https://commons.wikimedia.org/w/thumb.php?" + urllib.parse.urlencode({"f": archivo, "w": ancho}), binario=True)
    if datos[:2] != b"\xff\xd8" and datos[:4] != b"\x89PNG":
        sys.exit("Commons no devolvió una imagen (¿429?); esperar un minuto y repetir.")
    open(destino, "wb").write(datos)
    print(f"{destino} ({len(datos) // 1024} KB)")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="orden", required=True)
    b = sub.add_parser("buscar")
    b.add_argument("consultas", nargs="+")
    b.add_argument("--n", type=int, default=8)
    f = sub.add_parser("ficha")
    f.add_argument("archivo")
    d = sub.add_parser("bajar")
    d.add_argument("archivo")
    d.add_argument("destino")
    d.add_argument("--ancho", type=int, default=1280)
    a = ap.parse_args()
    if a.orden == "buscar":
        for q in a.consultas:
            print("=====", q)
            for t in buscar(q, a.n):
                time.sleep(PAUSA)
                try:
                    x = ficha(t)
                    marca = "SÍ " if x["libre"] else "no "
                    print(f"  {marca}{t[:70]:70s} {x['tamano']:>12s}  {', '.join(x['licencia'])}  · {x['autor'][:40]}")
                except Exception as e:  # noqa: BLE001
                    print("  ?? ", t, e)
            time.sleep(PAUSA)
    elif a.orden == "ficha":
        for k, v in ficha(a.archivo if a.archivo.startswith("File:") else "File:" + a.archivo).items():
            print(f"{k:12s} {v}")
    else:
        bajar(a.archivo, a.destino, a.ancho)


if __name__ == "__main__":
    main()
