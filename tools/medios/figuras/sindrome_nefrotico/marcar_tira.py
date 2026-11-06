"""Marca la casilla de proteína (la cuarta desde arriba) de la tira positiva con un recuadro ámbar."""
from PIL import Image, ImageDraw
F = "tools/medios/figuras/sindrome_nefrotico/fuentes/"
im = Image.open(F + "commons_Comp.Urine.Test.Strip_recorte.jpg").convert("RGB")
d = ImageDraw.Draw(im)
AMBAR = "#F2A23A"
d.rectangle((266, 288, 344, 362), outline=AMBAR, width=7)   # tira izquierda: proteína positiva
d.rectangle((424, 288, 502, 362), outline="#94A3B8", width=5)  # tira derecha: la misma casilla, sin proteína
im.save(F + "commons_Comp.Urine.Test.Strip_marcado.jpg", quality=92, subsampling=0)
