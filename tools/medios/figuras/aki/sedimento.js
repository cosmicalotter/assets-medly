// Dibujos esquemáticos de elementos del sedimento urinario (campo de microscopio).
function rnd(seed) { let s = seed; return () => (s = (s * 9301 + 49297) % 233280) / 233280; }
function campo(contenido, id) {
  return `<svg width="210" height="180" viewBox="0 0 200 170">
    <defs><radialGradient id="f${id}" cx="50%" cy="50%" r="60%"><stop offset="0" stop-color="#FBF8EE"/><stop offset="1" stop-color="#E8E1CC"/></radialGradient>
    <clipPath id="c${id}"><circle cx="100" cy="85" r="80"/></clipPath></defs>
    <circle cx="100" cy="85" r="80" fill="url(#f${id})" stroke="#CFC6AE" stroke-width="2"/>
    <g clip-path="url(#c${id})">${contenido}</g></svg>`;
}
function cilindro(x, y, l, h, rot, relleno, borde, dentro) {
  return `<g transform="translate(${x} ${y}) rotate(${rot})">
    <rect x="${-l / 2}" y="${-h / 2}" width="${l}" height="${h}" rx="${h / 2}" fill="${relleno}" stroke="${borde}" stroke-width="2"/>${dentro || ""}</g>`;
}
function granos(l, h, n, color, seed) {
  const r = rnd(seed); let s = "";
  for (let i = 0; i < n; i++) s += `<circle cx="${(-l / 2 + 8 + r() * (l - 16)).toFixed(1)}" cy="${(-h / 2 + 5 + r() * (h - 10)).toFixed(1)}" r="${(1.6 + r() * 2.2).toFixed(1)}" fill="${color}"/>`;
  return s;
}
function hematie(x, y, r, color) { return `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}" stroke="#A33" stroke-width="1"/><circle cx="${x}" cy="${y}" r="${r * 0.45}" fill="#F2B3A8" opacity=".7"/>`; }
function acantocito(x, y) {
  let s = `<circle cx="${x}" cy="${y}" r="12" fill="#F4C2B8" stroke="#B5463A" stroke-width="1.6"/>`;
  [20, 110, 200, 290].forEach((a) => { const t = (a * Math.PI) / 180; s += `<circle cx="${(x + 13 * Math.cos(t)).toFixed(1)}" cy="${(y + 13 * Math.sin(t)).toFixed(1)}" r="4" fill="#F4C2B8" stroke="#B5463A" stroke-width="1.4"/>`; });
  return s;
}
function leucocito(x, y) {
  return `<circle cx="${x}" cy="${y}" r="10" fill="#E9E6F3" stroke="#6B63A8" stroke-width="1.5"/>
    <circle cx="${x - 4}" cy="${y - 2}" r="3" fill="#6B63A8"/><circle cx="${x + 3}" cy="${y - 3}" r="3" fill="#6B63A8"/><circle cx="${x}" cy="${y + 4}" r="3" fill="#6B63A8"/>`;
}
function tubular(x, y) {
  return `<path d="M${x - 16} ${y - 6} L${x - 6} ${y - 15} L${x + 12} ${y - 12} L${x + 17} ${y + 4} L${x + 6} ${y + 15} L${x - 12} ${y + 11} Z" fill="#E6D3B3" stroke="#8A6A3F" stroke-width="1.6"/>
    <circle cx="${x + 1}" cy="${y}" r="6.5" fill="#7A5A33"/>`;
}
function panel(svg, nombre, que, color) {
  return `<div class="pn"><div class="dib">${svg}</div><div class="nm" style="color:${color}">${nombre}</div><div class="qu">${que}</div></div>`;
}
const CSS_SED = `.fila{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;flex:1}
.pn{border-radius:14px;background:#F7F8FA;padding:8px;display:flex;flex-direction:column;align-items:center;gap:4px}
.dib{height:180px}.nm{font-size:15px;font-weight:800;text-align:center;line-height:1.2}.qu{font-size:12.5px;text-align:center;line-height:1.3;color:var(--tinta)}
.nota{border-radius:12px;background:#F7F8FA;padding:8px 12px;font-size:13.5px;line-height:1.35}`;
document.head.insertAdjacentHTML("beforeend", `<style>${CSS_SED}</style>`);
