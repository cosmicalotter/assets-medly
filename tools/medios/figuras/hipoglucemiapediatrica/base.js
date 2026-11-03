// Piezas comunes de las figuras de hipoglucemia neonatal y pediátrica: estilo
// Empirica, colores por cadena (recién nacido teal, grave rosa-rojo, niño
// morado, diabetes azul) y ayudas de animación.
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

const F_BAPM = "Esquema. Fuente: BAPM 2024, Identification and Management of Neonatal Hypoglycaemia in the Full-Term Infant";
const F_PES = "Esquema. Fuente: Pediatric Endocrine Society 2015 (Thornton et al.)";
const F_ISPAD = "Esquema. Fuente: ISPAD 2022, Assessment and management of hypoglycemia in children and adolescents with diabetes";

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
