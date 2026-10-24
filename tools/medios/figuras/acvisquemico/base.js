// Piezas comunes de las ilustraciones de acv (isquémico): estilo Empirica,
// colores por clase de recomendación y un corte axial esquemático.
const CSS = `
:root{--teal:#18B9A9;--violeta:#7B6CF6;--rojo:#EF5454;--ambar:#F2A23A;--verde:#2FB36D;--azul:#4F8CF6;--amarillo:#E9B93A;--tinta:#1F2A37;--suave:#6B7280;--linea:#E5E7EB;}
*{box-sizing:border-box;margin:0}
body{background:#fff;font-family:"Inter","Segoe UI",Roboto,Arial,sans-serif;color:var(--tinta)}
#lienzo{width:720px;height:540px;padding:22px 26px;display:flex;flex-direction:column;gap:10px;background:#fff}
.cab{display:flex;align-items:baseline;justify-content:space-between}
.tit{font-size:24px;font-weight:700;letter-spacing:-.01em}
.sub{font-size:13.5px;color:var(--suave);margin-top:2px}
.marca{font-size:12px;font-weight:700;color:var(--teal);letter-spacing:.1em}
.fuente{font-size:10.5px;color:var(--suave)}
.pill{display:inline-block;padding:2px 8px;border-radius:999px;font-size:12px;font-weight:700;color:#fff;white-space:nowrap}
b{font-weight:700}
`;
document.head.insertAdjacentHTML("beforeend", `<style>${CSS}</style>`);

// Clase de recomendación → color (como la leyenda de la guía).
const CLASE = {
  "I": "#2FB36D", "IIa": "#E0A92B", "IIb": "#F07F3C", "III": "#EF5454", "—": "#9CA3AF",
};
const pill = (clase, texto) => `<span class="pill" style="background:${CLASE[clase]}">${texto || clase}</span>`;

function lienzo(titulo, subtitulo, cuerpo, fuente) {
  document.body.innerHTML = `<div id="lienzo">
    <div class="cab"><div><div class="tit">${titulo}</div>${subtitulo ? `<div class="sub">${subtitulo}</div>` : ""}</div><div class="marca">EMPIRICA</div></div>
    ${cuerpo}
    ${fuente ? `<div class="fuente">${fuente}</div>` : ""}
  </div>`;
}

const tramo = (t, a, b) => Math.max(0, Math.min(1, (t - a) / (b - a)));
const FUENTE_AHA = "Esquema. Fuente: guía AHA/ASA 2026 del ACV isquémico agudo (Prabhakaran et al., Stroke 2026).";

// Sector de anillo elíptico entre los ángulos a1 y a2 (grados; 0 = derecha, 90 = abajo).
function sector(cx, cy, rxo, ryo, rxi, ryi, a1, a2) {
  const pts = [];
  const paso = (a2 - a1) / 24;
  for (let a = a1; a <= a2 + 1e-6; a += paso) {
    const r = (a * Math.PI) / 180;
    pts.push([cx + rxo * Math.cos(r), cy + ryo * Math.sin(r)]);
  }
  for (let a = a2; a >= a1 - 1e-6; a -= paso) {
    const r = (a * Math.PI) / 180;
    pts.push([cx + rxi * Math.cos(r), cy + ryi * Math.sin(r)]);
  }
  return "M" + pts.map((p) => p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" L") + " Z";
}
const enElipse = (cx, cy, rx, ry, a) => [cx + rx * Math.cos((a * Math.PI) / 180), cy + ry * Math.sin((a * Math.PI) / 180)];
