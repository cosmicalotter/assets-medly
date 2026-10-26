// Figura fija sobre un trazado real (EEG): la imagen recortada con `vista`
// ocupa el ancho, con dibujos encima en píxeles del original, y debajo una
// línea que dice qué mirar. Necesita base.js y recorrido.js (por D) antes.
function eegFijo({ titulo, subtitulo, credito, img, w, h, vista, filtro, dibujo, nota }) {
  const ANCHO = 668, ALTO = Math.round(ANCHO * vista[3] / vista[2]), e = vista[2] / ANCHO;
  lienzo(titulo, subtitulo,
    `<div style="width:${ANCHO}px;height:${ALTO}px;border-radius:12px;overflow:hidden;flex:none;background:#0b0b0b">
       <svg width="${ANCHO}" height="${ALTO}" viewBox="${vista.join(" ")}" preserveAspectRatio="xMidYMid slice">
         <image href="${img}" x="0" y="0" width="${w}" height="${h}" ${filtro ? `style="filter:${filtro}"` : ""}/>
         ${dibujo ? dibujo(e) : ""}</svg></div>
     <div style="background:#1F2A37;color:#fff;border-radius:10px;padding:7px 12px;font-size:13.5px;font-weight:600;line-height:1.3">${nota}</div>`,
    credito);
}
