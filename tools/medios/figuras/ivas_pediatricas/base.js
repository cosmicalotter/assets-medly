// Piezas comunes de las figuras de infecciones respiratorias altas en niños
// (ivas_pediatricas): estilo Empirica, colores por gravedad e ilustraciones
// esquemáticas en SVG (membrana timpánica, orofaringe, órbita, cuello).
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

const ROJO = "#EF5454", NARANJA = "#F07F3C", VERDE = "#2FB36D", AZUL = "#4F8CF6", TEAL = "#18B9A9", AMBAR = "#F2A23A", MORADO = "#8B5CF6", GRIS = "#94A3B8";
const tinte = (c, p) => `color-mix(in srgb, ${c} ${p}%, white)`;

const FUENTE_OMA = "Esquema. Fuente: ACORL 2024, guía de otitis media aguda";
const FUENTE_RS = "Esquema. Fuente: ACORL 2024, guía de rinosinusitis en niños";
const FUENTE_FAAB = "Esquema. Fuente: ACORL 2024, guía de faringoamigdalitis aguda bacteriana";

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
const hex = (c) => [1, 3, 5].map((k) => parseInt(c.slice(k, k + 2), 16));
const mezcla = (a, b, u) => `rgb(${hex(a).map((x, k) => Math.round(lerp(x, hex(b)[k], u))).join(",")})`;

// Membrana timpánica vista por el otoscopio (oído derecho). rojo: 0 gris perlada,
// 1 eritematosa; abombe: 0 plana, 1 abombada; efusion: 0-1 líquido ámbar con
// nivel y burbujas, sin inflamación.
function membrana(cx, cy, r, { rojo = 0, abombe = 0, efusion = 0, id = "m" } = {}) {
  const base = efusion > 0 ? mezcla("#D7DEE7", "#E9B96A", efusion) : mezcla("#D7DEE7", "#E05A4F", rojo);
  const borde = mezcla("#A9B4C2", "#B93A33", rojo);
  const visible = 1 - suave(tramo(abombe, 0.25, 0.85));     // mango y reflejo se borran al abombarse
  const reflejo = (1 - rojo * 0.6) * visible * (1 - efusion * 0.5);
  const brillo = abombe > 0 ? `<ellipse cx="${cx - r * 0.12}" cy="${cy - r * 0.12}" rx="${r * 0.55 * abombe}" ry="${r * 0.45 * abombe}" fill="#fff" opacity="${0.35 * abombe}"/>` : "";
  const sombra = abombe > 0 ? `<circle cx="${cx}" cy="${cy}" r="${r * 0.97}" fill="none" stroke="#7F1D1D" stroke-width="${r * 0.16 * abombe}" opacity="${0.35 * abombe}"/>` : "";
  const nivel = efusion > 0 ? `<clipPath id="${id}c"><circle cx="${cx}" cy="${cy}" r="${r * 0.96}"/></clipPath>
      <g clip-path="url(#${id}c)" opacity="${efusion}">
        <rect x="${cx - r}" y="${cy + r * 0.05}" width="${2 * r}" height="${r}" fill="#D9932B" opacity=".55"/>
        <path d="M${cx - r} ${cy + r * 0.05} L${cx + r} ${cy + r * 0.05}" stroke="#8A5A12" stroke-width="3"/>
        ${[[-0.35, -0.3, 0.09], [0.1, -0.45, 0.07], [0.4, -0.2, 0.1], [-0.05, -0.15, 0.06]].map(([dx, dy, rr]) =>
          `<circle cx="${cx + dx * r}" cy="${cy + dy * r}" r="${rr * r}" fill="none" stroke="#8A5A12" stroke-width="2.5" opacity=".8"/>`).join("")}
      </g>` : "";
  return `<circle cx="${cx}" cy="${cy}" r="${r * 1.18}" fill="#3B2A22"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="${base}" stroke="${borde}" stroke-width="${r * 0.05}"/>
    ${nivel}${sombra}${brillo}
    <path d="M${cx + r * 0.05} ${cy - r * 0.72} L${cx - r * 0.02} ${cy + r * 0.05}" stroke="${AZUL}" stroke-width="${r * 0.09}" stroke-linecap="round" opacity="${visible}"/>
    <circle cx="${cx + r * 0.06}" cy="${cy - r * 0.62}" r="${r * 0.08}" fill="${AZUL}" opacity="${visible}"/>
    <path d="M${cx + r * 0.02} ${cy + r * 0.14} L${cx + r * 0.7} ${cy + r * 0.62} L${cx + r * 0.42} ${cy + r * 0.82} Z" fill="${AMBAR}" opacity="${reflejo}"/>`;
}

// Membrana de perfil (corte): plana o abombada hacia el conducto, con líquido detrás.
function perfilMembrana(x, y, alto, { abombe = 0, rojo = 0, liquido = 0 } = {}) {
  const c = mezcla("#94A3B8", ROJO, rojo), dx = 46 * abombe;
  const curva = `M${x} ${y - alto / 2} Q${x - dx * 2} ${y} ${x} ${y + alto / 2}`;
  return `<rect x="${x - 120}" y="${y - alto / 2 - 18}" width="120" height="${alto + 36}" fill="#FDE7D3"/>
    <rect x="${x}" y="${y - alto / 2 - 18}" width="110" height="${alto + 36}" fill="#F1F5F9"/>
    ${liquido ? `<path d="${curva} L${x + 110} ${y + alto / 2} L${x + 110} ${y - alto / 2} Z" fill="${mezcla("#F1F5F9", "#E9B96A", liquido)}"/>` : ""}
    <path d="${curva}" stroke="${c}" stroke-width="6" fill="none" stroke-linecap="round"/>
    <text x="${x - 60}" y="${y + alto / 2 + 36}" text-anchor="middle" font-size="12" fill="#6B7280">conducto</text>
    <text x="${x + 55}" y="${y + alto / 2 + 36}" text-anchor="middle" font-size="12" fill="#6B7280">oído medio</text>`;
}
