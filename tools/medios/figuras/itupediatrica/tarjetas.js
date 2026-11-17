// Esquema de decisión: una tarjeta de color por categoría, con sus criterios en viñetas.
// tarjetas(titulo, sub, [{ c, t, sub, filas: [[rótulo, valor]] }], pie, fuente)
function tarjetas(titulo, sub, cs, pie, fuente, ancho) {
  const w = ancho || Math.floor((668 - 10 * (cs.length - 1)) / cs.length);
  const tarjeta = (e) => {
    const ct = e.c === AMBAR ? "#B26B10" : e.c;
    return `<div style="width:${w}px;border:2px solid ${e.c};border-radius:14px;background:${tinte(e.c, 9)};display:flex;flex-direction:column;overflow:hidden">
      <div style="background:${e.c};color:#fff;padding:8px 11px"><div style="font-weight:900;font-size:16.5px">${e.t}</div>${e.sub ? `<div style="font-size:12.5px;opacity:.95">${e.sub}</div>` : ""}</div>
      <div style="padding:8px 11px;display:flex;flex-direction:column;gap:7px">${e.filas.map(([r, v]) => `<div><div style="font-size:11.5px;font-weight:800;color:${ct};text-transform:uppercase;letter-spacing:.04em">${r}</div><div style="font-size:13.4px;line-height:1.32">${v}</div></div>`).join("")}</div></div>`;
  };
  lienzo(titulo, sub, `<div style="display:flex;gap:10px;justify-content:center;align-items:stretch;flex:1">${cs.map(tarjeta).join("")}</div>
    ${pie ? `<div class="caja" style="background:#1F2A37;color:#fff;font-weight:700;font-size:13.5px">${pie}</div>` : ""}`, fuente);
}
