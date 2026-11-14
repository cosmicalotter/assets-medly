// Piezas comunes de las figuras del VIH: estilo Empirica, colores de la app y el lienzo de 720×540
// con título, subtítulo y línea de fuente.

const CSS = `
:root{--teal:#18B9A9;--violeta:#7B6CF6;--rojo:#EF5454;--ambar:#F2A23A;--naranja:#F07F3C;--verde:#2FB36D;--azul:#4F8CF6;--celeste:#3BA7E0;--morado:#8B5CF6;--tinta:#1F2A37;--suave:#6B7280;--linea:#E5E7EB;}
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
.caja{border-radius:12px;padding:9px 11px;font-size:13px;line-height:1.3}
`;
document.head.insertAdjacentHTML("beforeend", `<style>${CSS}</style>`);

const ROSA_C = "#DB2777", ROJO = "#EF5454", NARANJA = "#F07F3C", VERDE = "#2FB36D", AZUL = "#4F8CF6", TEAL = "#18B9A9",
  AMBAR = "#F2A23A", MORADO = "#8B5CF6", CELESTE = "#3BA7E0", GRIS = "#64748B", TINTA = "#1F2A37", PIEL = "#FDE7D3", BORDE_PIEL = "#9A5B32";
const tinte = (c, p) => `color-mix(in srgb, ${c} ${p}%, white)`;

function lienzo(titulo, subtitulo, cuerpo, fuente) {
  document.body.innerHTML = `<div id="lienzo">
    <div class="cab"><div><div class="tit">${titulo}</div>${subtitulo ? `<div class="sub">${subtitulo}</div>` : ""}</div><div class="marca">EMPIRICA</div></div>
    <div class="cuerpo">${cuerpo}</div>
    ${fuente ? `<div class="fuente">${fuente}</div>` : ""}
  </div>`;
}

const tramo = (t, a, b) => Math.max(0, Math.min(1, (t - a) / (b - a)));
const lerp = (a, b, u) => a + (b - a) * u;
const suave = (u) => u * u * (3 - 2 * u);

// Flecha SVG de (x1,y1) a (x2,y2).
function flecha(x1, y1, x2, y2, color, ancho = 5, punta = 14) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const bx = x2 - punta * Math.cos(a), by = y2 - punta * Math.sin(a);
  const p1 = `${bx + punta * 0.55 * Math.sin(a)},${by - punta * 0.55 * Math.cos(a)}`;
  const p2 = `${bx - punta * 0.55 * Math.sin(a)},${by + punta * 0.55 * Math.cos(a)}`;
  return `<line x1="${x1}" y1="${y1}" x2="${bx}" y2="${by}" stroke="${color}" stroke-width="${ancho}" stroke-linecap="round"/>
    <polygon points="${x2},${y2} ${p1} ${p2}" fill="${color}"/>`;
}
document.head.insertAdjacentHTML("beforeend", `<style>.item{border-radius:10px;padding:7px 10px;font-size:12.5px;line-height:1.3}</style>`);

// Tarjeta de color con título y viñetas (para los esquemas de decisión del VIH).
function tarjeta(c, tit, items, { ancho = 0, alto = 0, sub = "", grande = false, fs = 0 } = {}) {
  const ct = c === AMBAR ? "#B26B10" : c;
  return `<div style="flex:${ancho ? "none" : 1};${ancho ? `width:${ancho}px;` : ""}${alto ? `min-height:${alto}px;` : ""}border:2px solid ${c};background:${tinte(c, 11)};border-radius:12px;padding:9px 11px;display:flex;flex-direction:column;gap:3px">
    <div style="font-weight:900;color:${ct};font-size:${grande ? 18 : 16.5}px;line-height:1.15">${tit}</div>
    ${sub ? `<div style="font-size:13px;font-weight:700;color:#374151">${sub}</div>` : ""}
    <div style="font-size:${fs || (grande ? 15.5 : 14.5)}px;line-height:1.34">${items.map((t) => `<div style="display:flex;gap:6px"><span style="color:${ct};font-weight:900">•</span><span>${t}</span></div>`).join("")}</div></div>`;
}
const fila = (html, gap = 10) => `<div style="display:flex;gap:${gap}px;align-items:stretch">${html}</div>`;
const banda = (html, fondo = "#1F2A37") => `<div class="caja" style="background:${fondo};color:#fff;font-weight:700;font-size:14px;padding:11px 13px">${html}</div>`;
// Fila que crece hasta llenar el lienzo (las tarjetas se estiran).
const filaC = (html, gap = 10) => `<div style="display:flex;gap:${gap}px;align-items:stretch;flex:1 0 auto">${html}</div>`;
