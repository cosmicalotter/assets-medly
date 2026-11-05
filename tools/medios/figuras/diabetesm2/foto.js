// Foto real con marcas encima: recorte, anillos y rótulos en español.
// marcas: {tipo:"anillo", x, y, r, c, t, dx, dy}  (coordenadas de la imagen original)
const AMARILLO = "#FDE047", CIAN = "#22D3EE", ROSA = "#F472B6";
function fotoAnotada({ titulo, sub, src, recorte, marcas = [], notas = [], fuente, alto = 360 }) {
  const [x0, y0, w, h] = recorte;
  const k = Math.min(668 / w, alto / h);
  const W = Math.round(w * k), H = Math.round(h * k);
  const svg = `<svg width="${W}" height="${H}" viewBox="${x0} ${y0} ${w} ${h}" style="display:block;border-radius:12px">
    <image href="${src}" x="0" y="0"/>
    ${marcas.map((m) => `<circle cx="${m.x}" cy="${m.y}" r="${m.r}" fill="none" stroke="#000" stroke-opacity=".35" stroke-width="${7 / k}"/>
      <circle cx="${m.x}" cy="${m.y}" r="${m.r}" fill="none" stroke="${m.c}" stroke-width="${4 / k}"/>
      ${m.t ? `<text x="${m.x + (m.dx || 0)}" y="${m.y + (m.dy ?? -m.r - 8 / k)}" text-anchor="middle" font-size="${15 / k}" font-weight="800" fill="${m.c}" stroke="#111" stroke-width="${3.5 / k}" paint-order="stroke">${m.t}</text>` : ""}`).join("")}
  </svg>`;
  lienzo(titulo, sub,
    `<div style="display:flex;justify-content:center">${svg}</div>
     ${notas.length ? `<div style="display:flex;gap:8px;flex-wrap:wrap">${notas.map(([c, t]) => `<div class="item" style="background:#F7F8FA;flex:1;min-width:200px"><b style="color:${c === "#FDE047" ? "#B59A00" : c}">●</b> ${t}</div>`).join("")}</div>` : ""}`,
    fuente);
}
