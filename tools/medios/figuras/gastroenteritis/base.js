// Piezas comunes de las figuras de la enfermedad diarreica aguda (EDA): estilo
// Empirica, colores por grado de deshidratación e iconos sencillos en SVG.
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

// Colores de la escala: grave, algún grado, sin deshidratación.
const ROJO = "#EF5454", NARANJA = "#F07F3C", VERDE = "#2FB36D", AZUL = "#4F8CF6", TEAL = "#18B9A9", AMBAR = "#F2A23A";
const tinte = (c, p) => `color-mix(in srgb, ${c} ${p}%, white)`;

const FUENTE_GPC = "Esquema. Fuente: GPC de la enfermedad diarreica aguda en menores de 5 años, MinSalud Colombia 2013 (Guía No. 8).";

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

// Vaso con un nivel de líquido entre 0 y 1.
function vaso(x, y, w, h, nivel, color = AZUL) {
  const yl = y + h * (1 - nivel);
  return `<path d="M${x} ${y} L${x + w * 0.1} ${y + h} L${x + w * 0.9} ${y + h} L${x + w} ${y} Z" fill="#F8FAFC" stroke="#94A3B8" stroke-width="2"/>
    <clipPath id="cv${x}${y}"><path d="M${x} ${y} L${x + w * 0.1} ${y + h} L${x + w * 0.9} ${y + h} L${x + w} ${y} Z"/></clipPath>
    <rect x="${x}" y="${yl}" width="${w}" height="${h}" fill="${color}" opacity=".55" clip-path="url(#cv${x}${y})"/>`;
}

// Cuchara de lado.
function cuchara(x, y, s = 1, color = "#64748B") {
  return `<g transform="translate(${x},${y}) scale(${s})"><ellipse cx="0" cy="0" rx="16" ry="10" fill="#E2E8F0" stroke="${color}" stroke-width="2.4"/>
    <ellipse cx="0" cy="-1" rx="10" ry="5.5" fill="${AZUL}" opacity=".6"/>
    <rect x="15" y="-2.5" width="48" height="5" rx="2.5" fill="${color}"/></g>`;
}
