// Piezas comunes de las figuras de cardiotocografía: estilo Empirica y lienzo.
const CSS = `
:root{--teal:#18B9A9;--violeta:#7B6CF6;--rojo:#EF5454;--ambar:#F2A23A;--naranja:#F07F3C;--verde:#2FB36D;--azul:#4F8CF6;--tinta:#1F2A37;--suave:#6B7280;--linea:#E5E7EB;}
*{box-sizing:border-box;margin:0}
body{background:#fff;font-family:"Inter","Segoe UI",Roboto,Arial,sans-serif;color:var(--tinta)}
#lienzo{width:720px;height:540px;padding:22px 24px;display:flex;flex-direction:column;gap:9px;background:#fff}
.cab{display:flex;align-items:baseline;justify-content:space-between}
.tit{font-size:24px;font-weight:700;letter-spacing:-.01em}
.sub{font-size:13.5px;color:var(--suave);margin-top:2px}
.marca{font-size:12px;font-weight:700;color:var(--teal);letter-spacing:.1em}
.cuerpo{flex:1;min-height:0;display:flex;flex-direction:column;gap:8px}
.fuente{flex:none;margin-top:auto;position:relative;z-index:2;background:#fff;padding-top:3px;font-size:10.5px;line-height:1.3;color:var(--suave)}
b{font-weight:700}
.caja{border-radius:10px;padding:7px 10px;font-size:12.8px;line-height:1.3}
.rot{font-size:13px;font-weight:700}
`;
document.head.insertAdjacentHTML("beforeend", `<style>${CSS}</style>`);

const ROJO = "#EF5454", NARANJA = "#F07F3C", VERDE = "#2FB36D", AZUL = "#4F8CF6", TEAL = "#18B9A9", AMBAR = "#F2A23A", VIOLETA = "#7B6CF6", TINTA = "#1F2A37";
const tinte = (c, p) => `color-mix(in srgb, ${c} ${p}%, white)`;
const FUENTE = "Esquema ilustrativo, no es el registro de una paciente.";

function lienzo(titulo, subtitulo, cuerpo, fuente) {
  document.body.innerHTML = `<div id="lienzo">
    <div class="cab"><div><div class="tit">${titulo}</div>${subtitulo ? `<div class="sub">${subtitulo}</div>` : ""}</div><div class="marca">EMPIRICA</div></div>
    <div class="cuerpo">${cuerpo}</div>
    ${fuente ? `<div class="fuente">${fuente}</div>` : ""}
  </div>`;
}
const caja = (c, html) => `<div class="caja" style="background:${tinte(c, 12)};border:1.5px solid ${tinte(c, 45)}"><span>${html}</span></div>`;
