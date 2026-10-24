// Anatomía hepatobiliar esquemática (vista frontal: el lado derecho del
// paciente queda a la izquierda). viewBox 0 0 240 260.
const COL = { higado: "#C9785D", higadoBorde: "#A65E46", vesicula: "#9CC66B", vesiculaBorde: "#5E8C2E",
              bilis: "#6FA33A", duodeno: "#F4B9B2", duodenoBorde: "#D98C84", estomago: "#F6CFC9", calculo: "#E9D9A6" };

function higado() {
  return `<path d="M8 22 Q120 -2 232 30 Q226 78 176 96 Q120 112 40 108 Q6 96 8 22 Z" fill="${COL.higado}" stroke="${COL.higadoBorde}" stroke-width="2"/>`;
}
function estomago() {
  return `<path d="M232 70 Q240 150 200 172 Q176 182 170 160 Q196 140 196 100 Q200 80 232 70 Z" fill="${COL.estomago}" stroke="${COL.duodenoBorde}" stroke-width="2"/>`;
}
function duodeno() {
  return `<path d="M172 166 Q140 166 126 186 Q112 214 132 236 Q156 252 196 240" fill="none" stroke="${COL.duodenoBorde}" stroke-width="26" stroke-linecap="round"/>
          <path d="M172 166 Q140 166 126 186 Q112 214 132 236 Q156 252 196 240" fill="none" stroke="${COL.duodeno}" stroke-width="21" stroke-linecap="round"/>`;
}
// Vía biliar: hepático común, colédoco hasta la papila, y cístico.
function viaBiliar(ancho = 6) {
  return `<path d="M128 92 L130 150 Q131 178 125 200" fill="none" stroke="${COL.bilis}" stroke-width="${ancho}" stroke-linecap="round"/>
          <path d="M96 108 Q112 118 129 124" fill="none" stroke="${COL.bilis}" stroke-width="4" stroke-linecap="round"/>`;
}
function vesicula(cx = 78, cy = 134, extra = "") {
  return `<g transform="rotate(-24 ${cx} ${cy})"><ellipse cx="${cx}" cy="${cy}" rx="22" ry="38" fill="${COL.vesicula}" stroke="${COL.vesiculaBorde}" stroke-width="3"/>${extra}</g>`;
}
function calculos(pts) {
  return pts.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${COL.calculo}" stroke="#B49B57" stroke-width="1.5"/>`).join("");
}
function rotulo(x, y, texto, ancla = "start", color = "#1F2A37") {
  return `<text x="${x}" y="${y}" font-size="10.5" font-weight="700" fill="${color}" text-anchor="${ancla}">${texto}</text>`;
}
