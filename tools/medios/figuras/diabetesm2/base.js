// Piezas comunes de las ilustraciones de anemia del adulto: estilo Empirica,
// colores y tarjetas.
const CSS = `
:root{--teal:#18B9A9;--violeta:#7B6CF6;--rojo:#EF5454;--ambar:#F2A23A;--naranja:#F07F3C;--verde:#2FB36D;--azul:#4F8CF6;--amarillo:#E9B93A;--tinta:#1F2A37;--suave:#6B7280;--linea:#E5E7EB;--orina:#E9C84A;}
*{box-sizing:border-box;margin:0}
body{background:#fff;font-family:"Inter","Segoe UI",Roboto,Arial,sans-serif;color:var(--tinta)}
#lienzo{width:720px;height:540px;padding:22px 26px;display:flex;flex-direction:column;gap:10px;background:#fff}
.cab{display:flex;align-items:baseline;justify-content:space-between}
.tit{font-size:24px;font-weight:700;letter-spacing:-.01em}
.sub{font-size:13.5px;color:var(--suave);margin-top:2px}
.marca{font-size:12px;font-weight:700;color:var(--teal);letter-spacing:.1em}
.cuerpo{flex:1;min-height:0;display:flex;flex-direction:column;gap:10px}
.fuente{flex:none;margin-top:auto;position:relative;z-index:2;background:#fff;padding-top:3px;font-size:10.5px;line-height:1.3;color:var(--suave)}
.pill{display:inline-block;padding:2px 8px;border-radius:999px;font-size:12px;font-weight:700;color:#fff;white-space:nowrap}
b{font-weight:700}
.tarjeta{border-radius:14px;background:#F7F8FA;padding:10px 12px;display:flex;flex-direction:column;gap:6px}
.item{background:#fff;border-radius:8px;padding:6px 9px;font-size:13.5px;line-height:1.3}
.flecha{color:var(--suave);font-weight:800;text-align:center;font-size:16px;line-height:1}
`;
document.head.insertAdjacentHTML("beforeend", `<style>${CSS}</style>`);

// Estadio KDIGO → color.
const ESTADIO = { 0: "#9CA3AF", 1: "#E9B93A", 2: "#F07F3C", 3: "#EF5454" };
const pill = (color, texto) => `<span class="pill" style="background:${color}">${texto}</span>`;

function lienzo(titulo, subtitulo, cuerpo, fuente) {
  document.body.innerHTML = `<div id="lienzo">
    <div class="cab"><div><div class="tit">${titulo}</div>${subtitulo ? `<div class="sub">${subtitulo}</div>` : ""}</div><div class="marca">EMPIRICA</div></div>
    <div class="cuerpo">${cuerpo}</div>
    ${fuente ? `<div class="fuente">${fuente}</div>` : ""}
  </div>`;
}

const tramo = (t, a, b) => Math.max(0, Math.min(1, (t - a) / (b - a)));
const lerp = (a, b, u) => a + (b - a) * u;
const KDIGO = (que) => `Esquema propio. Fuente: KDIGO 2026, guía de LRA y ERA (marzo 2026)${que ? ", " + que : ""}.`;
