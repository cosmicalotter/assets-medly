// Piezas comunes de las figuras de cefalea en el adulto (cefaleassecundarias): estilo
// Empirica, colores e iconos sencillos en SVG.
const CSS = `
:root{--teal:#18B9A9;--violeta:#7B6CF6;--rojo:#EF5454;--ambar:#F2A23A;--naranja:#F07F3C;--verde:#2FB36D;--azul:#4F8CF6;--celeste:#3BA7E0;--tinta:#1F2A37;--suave:#6B7280;--linea:#E5E7EB;}
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

// Colores: grave, neumonía, leve; azul bronquiolitis y morado asma.
const ROJO = "#EF5454", NARANJA = "#F07F3C", VERDE = "#2FB36D", AZUL = "#4F8CF6", TEAL = "#18B9A9", AMBAR = "#F2A23A", MORADO = "#8B5CF6";
const tinte = (c, p) => `color-mix(in srgb, ${c} ${p}%, white)`;

const FUENTE_GINA = "Esquema. Fuente: GINA 2026";
const FUENTE_GEMA = "Esquema. Fuente: GEMA 5.5 (2025)";

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

// Cara esquemática de un niño. estado: "alerta" | "irritable" | "letargico"; hundidos: ojos hundidos.
function cara(x, y, r, { estado = "alerta", hundidos = false, color = "#1F2A37" } = {}) {
  const ojoY = y - r * 0.12, dx = r * 0.36;
  const sombra = hundidos
    ? `<ellipse cx="${x - dx}" cy="${ojoY + r * 0.02}" rx="${r * 0.25}" ry="${r * 0.21}" fill="#6B4E3D" opacity=".42"/>
       <ellipse cx="${x + dx}" cy="${ojoY + r * 0.02}" rx="${r * 0.25}" ry="${r * 0.21}" fill="#6B4E3D" opacity=".42"/>` : "";
  let ojos, boca;
  if (estado === "letargico") {
    ojos = [x - dx, x + dx].map((cx) => `<path d="M${cx - r * 0.13} ${ojoY} q${r * 0.13} ${r * 0.08} ${r * 0.26} 0" stroke="${color}" stroke-width="${r * 0.07}" fill="none" stroke-linecap="round"/>`).join("");
    boca = `<path d="M${x - r * 0.2} ${y + r * 0.42} h${r * 0.4}" stroke="${color}" stroke-width="${r * 0.07}" stroke-linecap="round"/>`;
  } else if (estado === "irritable") {
    ojos = [x - dx, x + dx].map((cx, i) => `<circle cx="${cx}" cy="${ojoY}" r="${r * 0.08}" fill="${color}"/>
      <path d="M${cx - r * 0.14} ${ojoY - r * (i ? 0.26 : 0.18)} L${cx + r * 0.14} ${ojoY - r * (i ? 0.18 : 0.26)}" stroke="${color}" stroke-width="${r * 0.06}" stroke-linecap="round"/>`).join("");
    boca = `<path d="M${x - r * 0.24} ${y + r * 0.5} q${r * 0.24} ${-r * 0.2} ${r * 0.48} 0" stroke="${color}" stroke-width="${r * 0.07}" fill="none" stroke-linecap="round"/>`;
  } else {
    ojos = [x - dx, x + dx].map((cx) => `<circle cx="${cx}" cy="${ojoY}" r="${r * 0.08}" fill="${color}"/>`).join("");
    boca = `<path d="M${x - r * 0.22} ${y + r * 0.36} q${r * 0.22} ${r * 0.2} ${r * 0.44} 0" stroke="${color}" stroke-width="${r * 0.07}" fill="none" stroke-linecap="round"/>`;
  }
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="#FDE7D3" stroke="${color}" stroke-width="${r * 0.06}"/>
    <path d="M${x - r * 0.75} ${y - r * 0.62} q${r * 0.75} ${-r * 0.55} ${r * 1.5} 0" stroke="#7C5A3C" stroke-width="${r * 0.16}" fill="none" stroke-linecap="round"/>
    ${sombra}${ojos}${boca}`;
}

// Niño acostado boca arriba, visto de lado (cabeza a la izquierda). insp: 0 espirado,
// 1 inspiración completa. hundir: 0 normal, 1 tiraje subcostal (la parte baja del
// tórax se hunde al inspirar mientras el abdomen sale).
function perfil(insp, { hundir = 0, w = 680, base = 300, marca = false } = {}) {
  const C = 78 + (hundir ? 4 : 18) * insp, A = 60 + 20 * insp, D = 30 * hundir * insp;
  const alto = (x) => C * Math.exp(-(((x - 270) / 100) ** 2)) + A * Math.exp(-(((x - 480) / 72) ** 2)) - D * Math.exp(-(((x - 392) / 26) ** 2));
  const pts = [];
  for (let x = 150; x <= 590; x += 5) pts.push(`${x},${(base - Math.max(18, alto(x))).toFixed(1)}`);
  const cuerpo = `<path d="M150,${base} L${pts.join(" L")} L590,${base} Z" fill="#FDE7D3" stroke="#9A5B32" stroke-width="3" stroke-linejoin="round"/>`;
  const pierna = `M586,${base - 18} C606,${base - 30} 640,${base - 34} ${w - 30},${base - 34} q22 0 22 17 q0 17 -22 17 L586,${base}`;
  const piernas = `<path d="${pierna} Z" fill="#FDE7D3"/><path d="${pierna}" fill="none" stroke="#9A5B32" stroke-width="3" stroke-linejoin="round"/>`;
  const cabeza = `<circle cx="100" cy="${base - 52}" r="50" fill="#FDE7D3" stroke="#9A5B32" stroke-width="3"/>
    <path d="M58 ${base - 78} q30 -36 78 -14" stroke="#7C5A3C" stroke-width="9" fill="none" stroke-linecap="round"/>
    <circle cx="82" cy="${base - 66}" r="4" fill="#1F2A37"/>`;
  const cama = `<rect x="0" y="${base}" width="${w}" height="14" rx="4" fill="#E2E8F0"/>`;
  // Reborde costal: dónde acaba el tórax y empieza el abdomen.
  const yr = base - Math.max(18, alto(392));
  const reborde = marca ? `<path d="M392 ${yr + 4} L392 ${base - 4}" stroke="#94A3B8" stroke-width="2" stroke-dasharray="5 5"/>` : "";
  return { svg: cama + cuerpo + piernas + cabeza + reborde, alto, yRef: (x) => base - Math.max(18, alto(x)) };
}

// Inhalador presurizado con cámara y mascarilla o boquilla, de lado. nube: 0-1, aerosol dentro de la cámara.
function camara(x, y, { nube = 0, mascarilla = true, sacude = 0 } = {}) {
  const boca = mascarilla
    ? `<path d="M${x} ${y - 30} q34 30 0 60 l24 -6 q10 -24 0 -48 Z" fill="${tinte(MORADO, 30)}" stroke="${MORADO}" stroke-width="4" stroke-linejoin="round"/>`
    : `<rect x="${x + 2}" y="${y - 10}" width="24" height="20" rx="5" fill="#E2E8F0" stroke="#64748B" stroke-width="3"/>`;
  const nubes = nube > 0 ? [0, 1, 2, 3, 4].map((k) => `<circle cx="${x + 60 + k * 30}" cy="${y + (k % 2 ? 6 : -6)}" r="${10 + 4 * nube}" fill="${tinte(TEAL, 45)}" opacity="${0.75 * nube}"/>`).join("") : "";
  return `${boca}<rect x="${x + 24}" y="${y - 24}" width="190" height="48" rx="22" fill="#F1F5F9" stroke="#64748B" stroke-width="3"/>${nubes}
    <path d="M${x + 24} ${y - 14} L${x + 14} ${y - 8} L${x + 14} ${y + 8} L${x + 24} ${y + 14}" fill="#E2E8F0" stroke="#64748B" stroke-width="3"/>
    <g transform="translate(${x + 214 + sacude},${y - 58})"><rect x="0" y="40" width="20" height="40" rx="5" fill="${tinte(AZUL, 30)}" stroke="${AZUL}" stroke-width="3"/>
    <rect x="20" y="0" width="32" height="92" rx="10" fill="${AZUL}" stroke="#2F5FB3" stroke-width="3"/><rect x="27" y="-8" width="18" height="12" rx="3" fill="#2F5FB3"/></g>`;
}
