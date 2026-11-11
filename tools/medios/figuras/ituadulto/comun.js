// Piezas comunes de los esquemas de IVU del adulto: colores de las ramas del algoritmo
// (cistitis teal, pielonefritis azul, sepsis rojo, prostatitis morado, sonda naranja, bacteriuria gris).
const CIS = TEAL, PIE = AZUL, SEP = ROJO, PRO = MORADO, SON = NARANJA, BAC = GRIS;
const b = (s) => s.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
const pastilla = (c, t) => `<div class="item" style="background:${tinte(c, 9)};border:1.5px solid ${tinte(c, 38)};font-size:14.5px;padding:9px 12px"><span>${b(t)}</span></div>`;
