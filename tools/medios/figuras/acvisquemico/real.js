// Piezas comunes de las figuras reales de acv (isquémico): estilo Empirica y paneles con
// imágenes reales (TC, RM, arteriografía) recortadas y rotuladas encima.
const CSS = `
:root{--teal:#18B9A9;--violeta:#7B6CF6;--rojo:#EF5454;--ambar:#F2A23A;--verde:#2FB36D;--azul:#4F8CF6;--celeste:#3BA7E0;--tinta:#1F2A37;--suave:#6B7280;--linea:#E5E7EB;}
*{box-sizing:border-box;margin:0}
body{background:#fff;font-family:"Inter","Segoe UI",Roboto,Arial,sans-serif;color:var(--tinta)}
#lienzo{width:720px;height:540px;padding:22px 26px;display:flex;flex-direction:column;gap:10px;background:#fff}
.cab{display:flex;align-items:baseline;justify-content:space-between}
.tit{font-size:24px;font-weight:700;letter-spacing:-.01em}
.sub{font-size:13.5px;color:var(--suave);margin-top:2px}
.marca{font-size:12px;font-weight:700;color:var(--teal);letter-spacing:.1em}
.cuerpo{flex:1;min-height:0;display:flex;flex-direction:column;gap:10px}
.fuente{flex:none;margin-top:auto;position:relative;z-index:2;background:#fff;padding-top:3px;font-size:10.5px;line-height:1.3;color:var(--suave)}
b{font-weight:700}
.paneles{display:flex;gap:10px;flex:1;min-height:0}
.panel{flex:1;display:flex;flex-direction:column;gap:6px;min-width:0}
.panel svg{border-radius:12px;background:#0b0b0b;display:block}
.pie{font-size:13px;line-height:1.3}
.pie .r{font-weight:800}
`;
document.head.insertAdjacentHTML("beforeend", `<style>${CSS}</style>`);

function lienzo(titulo, subtitulo, cuerpo, fuente) {
  document.body.innerHTML = `<div id="lienzo">
    <div class="cab"><div><div class="tit">${titulo}</div>${subtitulo ? `<div class="sub">${subtitulo}</div>` : ""}</div><div class="marca">EMPIRICA</div></div>
    <div class="cuerpo">${cuerpo}</div>
    ${fuente ? `<div class="fuente">${fuente}</div>` : ""}
  </div>`;
}

const tramo = (t, a, b) => Math.max(0, Math.min(1, (t - a) / (b - a)));
const lerp = (a, b, u) => a + (b - a) * u;

// Panel con una imagen real: `vista` = [x, y, w, h] en píxeles del original; `tapas` tapa
// letras o datos del original; `dibujo(e)` añade flechas y rótulos (e = unidades por píxel).
function panel({ img, w, h, vista, ancho, alto, tapas = [], dibujo = () => "", pie = "", color = "#5EEAD4", filtro = "" }) {
  const e = vista[2] / ancho;
  const tapa = tapas.map((t) => `<rect x="${t[0]}" y="${t[1]}" width="${t[2]}" height="${t[3]}" fill="${t[4] || "#000"}"/>`).join("");
  return `<div class="panel"><svg width="${ancho}" height="${alto}" viewBox="${vista.join(" ")}" preserveAspectRatio="xMidYMid slice">
      <image href="${img}" x="0" y="0" width="${w}" height="${h}" ${filtro ? `style="filter:${filtro}"` : ""}/>${tapa}${dibujo(e)}</svg>
    ${pie ? `<div class="pie" style="--c:${color}">${pie}</div>` : ""}</div>`;
}

// Flecha con borde oscuro y rótulo, legible sobre la TC.
function flecha(x1, y1, x2, y2, col, e) {
  const a = Math.atan2(y2 - y1, x2 - x1), L = 12 * e;
  const p = (s) => `${x2 - L * Math.cos(a + s)},${y2 - L * Math.sin(a + s)}`;
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#111" stroke-width="${7 * e}" stroke-linecap="round"/>
    <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${col}" stroke-width="${4 * e}" stroke-linecap="round"/>
    <polygon points="${x2},${y2} ${p(0.45)} ${p(-0.45)}" fill="${col}" stroke="#111" stroke-width="${1.4 * e}"/>`;
}
function rotulo(x, y, txt, col, e, ancla = "start", tam = 14) {
  return `<text x="${x}" y="${y}" font-size="${tam * e}" font-weight="800" fill="${col}" text-anchor="${ancla}"
    stroke="#111" stroke-width="${3.6 * e}" stroke-linejoin="round" paint-order="stroke">${txt}</text>`;
}
