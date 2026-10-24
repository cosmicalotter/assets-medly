// Piezas comunes de las ilustraciones de acv_hemorragico: estilo Empirica y un
// corte axial de TC esquemático (cráneo, parénquima, ventrículos, hematoma).
const CSS = `
:root{--teal:#18B9A9;--violeta:#7B6CF6;--rojo:#EF5454;--ambar:#F2A23A;--verde:#2FB36D;--azul:#4F8CF6;--celeste:#3BA7E0;--tinta:#1F2A37;--suave:#6B7280;--linea:#E5E7EB;}
*{box-sizing:border-box;margin:0}
body{background:#fff;font-family:"Inter","Segoe UI",Roboto,Arial,sans-serif;color:var(--tinta)}
#lienzo{width:720px;height:540px;padding:24px 28px;display:flex;flex-direction:column;gap:12px;background:#fff}
.cab{display:flex;align-items:baseline;justify-content:space-between}
.tit{font-size:25px;font-weight:700;letter-spacing:-.01em}
.sub{font-size:14px;color:var(--suave);margin-top:2px}
.marca{font-size:12px;font-weight:700;color:var(--teal);letter-spacing:.1em}
.fuente{font-size:11px;color:var(--suave)}
b{font-weight:700}
`;
document.head.insertAdjacentHTML("beforeend", `<style>${CSS}</style>`);

// Corte axial supratentorial. `hema` = {cx, cy, rx, ry, rot} en coordenadas del corte (0-200).
function corteTC({ x = 0, y = 0, s = 1, hema = null, ivh = false, hidro = false, fosa = false, brillo = 1, extra = "" } = {}) {
  const v = hidro ? 1.6 : 1;
  const sangre = `rgba(245,245,245,${brillo})`;
  const cerebro = fosa
    ? `<ellipse cx="100" cy="112" rx="70" ry="62" fill="#6f6f6f"/>
       <ellipse cx="72" cy="128" rx="34" ry="36" fill="#7a7a7a"/><ellipse cx="128" cy="128" rx="34" ry="36" fill="#7a7a7a"/>
       <ellipse cx="100" cy="78" rx="20" ry="16" fill="#858585"/>
       <path d="M96 104 L104 104 L100 116 Z" fill="#2b2b2b" transform="scale(1,${v}) translate(0,${hidro ? -40 : 0})"/>`
    : `<ellipse cx="100" cy="100" rx="78" ry="90" fill="#7d7d7d"/>
       <path d="M100 14 L100 186" stroke="#5e5e5e" stroke-width="2"/>
       <g transform="translate(100,100) scale(${v}) translate(-100,-100)">
         <path d="M88 70 Q80 92 86 116 Q92 122 96 112 Q94 92 97 72 Z" fill="#2b2b2b"/>
         <path d="M112 70 Q120 92 114 116 Q108 122 104 112 Q106 92 103 72 Z" fill="#2b2b2b"/>
         ${ivh ? `<path d="M88 96 Q86 108 89 114 Q93 116 95 108 Q95 100 94 96 Z" fill="${sangre}"/>` : ""}
       </g>`;
  const h = hema
    ? `<ellipse cx="${hema.cx}" cy="${hema.cy}" rx="${hema.rx}" ry="${hema.ry}" transform="rotate(${hema.rot || 0} ${hema.cx} ${hema.cy})" fill="${sangre}"/>
       <ellipse cx="${hema.cx}" cy="${hema.cy}" rx="${hema.rx + 5}" ry="${hema.ry + 5}" transform="rotate(${hema.rot || 0} ${hema.cx} ${hema.cy})" fill="none" stroke="#5a5a5a" stroke-width="5" opacity=".7"/>`
    : "";
  return `<g transform="translate(${x},${y}) scale(${s})">
    <rect x="-6" y="-6" width="212" height="212" rx="14" fill="#0b0d10"/>
    <ellipse cx="100" cy="100" rx="88" ry="98" fill="#e9e9e9"/>
    <ellipse cx="100" cy="100" rx="82" ry="92" fill="#1a1a1a"/>
    ${cerebro}${h}${extra}
  </g>`;
}

function lienzo(titulo, subtitulo, cuerpo, fuente) {
  document.body.innerHTML = `<div id="lienzo">
    <div class="cab"><div><div class="tit">${titulo}</div>${subtitulo ? `<div class="sub">${subtitulo}</div>` : ""}</div><div class="marca">EMPIRICA</div></div>
    ${cuerpo}
    ${fuente ? `<div class="fuente">${fuente}</div>` : ""}
  </div>`;
}

const tramo = (t, a, b) => Math.max(0, Math.min(1, (t - a) / (b - a)));
