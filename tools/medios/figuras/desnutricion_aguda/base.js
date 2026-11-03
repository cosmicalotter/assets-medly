// Piezas comunes de las figuras de desnutrición aguda: estilo
// Empirica: colores de gravedad (adecuado verde, riesgo ámbar, moderada naranja,
// severa rojo) y una silueta infantil simple para el edema y el perímetro del brazo.
const CSS = `
:root{--teal:#18B9A9;--rojo:#EF5454;--ambar:#F2A23A;--naranja:#F07F3C;--verde:#2FB36D;--azul:#4F8CF6;--morado:#8B5CF6;--tinta:#1F2A37;--suave:#6B7280;--linea:#E5E7EB;}
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
.esc{flex:1;min-height:0;width:100%}
`;
document.head.insertAdjacentHTML("beforeend", `<style>${CSS}</style>`);

const ROJO = "#EF5454", NARANJA = "#F07F3C", VERDE = "#2FB36D", AZUL = "#4F8CF6", TEAL = "#18B9A9", AMBAR = "#F2A23A", MORADO = "#8B5CF6", GRIS = "#94A3B8", TINTA = "#1F2A37";
const tinte = (c, p) => `color-mix(in srgb, ${c} ${p}%, white)`;

const F_L = "Esquema. Fuente: MinSalud-UNICEF, lineamiento de la Resolución 2350 de 2020";
const F_R = "Esquema. Fuente: MinSalud, Resolución 115 de 2026";

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

// Silueta infantil de frente (sentado de pie, esquemática). edema: 0-3 colorea las zonas con edema.
function nino(cx, base, h, { edema = 0, flaco = 0, color = "#F3D2B6" } = {}) {
  const s = h / 300, e = (k) => (edema >= k ? ROJO : color), op = (k) => (edema >= k ? 0.55 : 1);
  const ancho = 1 - flaco * 0.35;
  return `<g transform="translate(${cx},${base}) scale(${s})">
    <circle cx="0" cy="-262" r="${edema >= 3 ? 38 : 33}" fill="${edema >= 3 ? tinte(ROJO, 45) : color}" stroke="#C9A486" stroke-width="2"/>
    <rect x="${-36 * ancho}" y="-226" width="${72 * ancho}" height="96" rx="22" fill="${color}" stroke="#C9A486" stroke-width="2"/>
    <rect x="${-62 * ancho}" y="-220" width="${20 * ancho}" height="56" rx="9" fill="${edema >= 3 ? tinte(ROJO, 45) : color}" stroke="#C9A486" stroke-width="2"/>
    <rect x="${42 * ancho}" y="-220" width="${20 * ancho}" height="56" rx="9" fill="${edema >= 3 ? tinte(ROJO, 45) : color}" stroke="#C9A486" stroke-width="2"/>
    <rect x="${-64 * ancho}" y="-166" width="${22 * ancho}" height="46" rx="10" fill="${edema >= 2 ? tinte(ROJO, 45) : color}" stroke="#C9A486" stroke-width="2"/>
    <rect x="${42 * ancho}" y="-166" width="${22 * ancho}" height="46" rx="10" fill="${edema >= 2 ? tinte(ROJO, 45) : color}" stroke="#C9A486" stroke-width="2"/>
    <circle cx="${-53 * ancho}" cy="-112" r="11" fill="${edema >= 2 ? tinte(ROJO, 45) : color}" stroke="#C9A486" stroke-width="2"/>
    <circle cx="${53 * ancho}" cy="-112" r="11" fill="${edema >= 2 ? tinte(ROJO, 45) : color}" stroke="#C9A486" stroke-width="2"/>
    <rect x="${-30 * ancho}" y="-132" width="${26 * ancho}" height="62" rx="11" fill="${edema >= 3 ? tinte(ROJO, 45) : color}" stroke="#C9A486" stroke-width="2"/>
    <rect x="${4 * ancho}" y="-132" width="${26 * ancho}" height="62" rx="11" fill="${edema >= 3 ? tinte(ROJO, 45) : color}" stroke="#C9A486" stroke-width="2"/>
    <rect x="${-31 * ancho}" y="-72" width="${27 * ancho}" height="54" rx="11" fill="${edema >= 2 ? tinte(ROJO, 45) : color}" stroke="#C9A486" stroke-width="2"/>
    <rect x="${4 * ancho}" y="-72" width="${27 * ancho}" height="54" rx="11" fill="${edema >= 2 ? tinte(ROJO, 45) : color}" stroke="#C9A486" stroke-width="2"/>
    <ellipse cx="${-19 * ancho}" cy="-10" rx="${edema >= 1 ? 22 : 17}" ry="11" fill="${edema >= 1 ? tinte(ROJO, 45) : color}" stroke="#C9A486" stroke-width="2"/>
    <ellipse cx="${19 * ancho}" cy="-10" rx="${edema >= 1 ? 22 : 17}" ry="11" fill="${edema >= 1 ? tinte(ROJO, 45) : color}" stroke="#C9A486" stroke-width="2"/>
  </g>`;
}
