// Fotos reales con marcas encima: uno o varios paneles recortados, anillos o elipses
// y rótulos en español. Las coordenadas de las marcas son las de la imagen original.
// panel: { src, tam: [ancho, alto], recorte: [x, y, w, h], marcas, rotulo }
// marca: { x, y, r } (anillo) o { x, y, rx, ry, rot } (elipse), con color c y texto t opcional.
// tapar: [[x, y, w, h]] rectángulos blancos sobre los rótulos del original; textos: [{ x, y, t, ancla }]
// rótulos traducidos en negro (fondo blanco, como en las figuras dibujadas).
const AMARILLO = "#FDE047", ROSA = "#E11D74", CIAN = "#22D3EE";

function panelSvg(p, k) {
  const [x0, y0, w, h] = p.recorte;
  const W = Math.round(w * k), H = Math.round(h * k);
  const forma = (m, color, ancho, op = 1) => {
    const trazo = `fill="none" stroke="${color}" stroke-opacity="${op}" stroke-width="${ancho / k}"${m.discontinua ? ` stroke-dasharray="${10 / k} ${6 / k}"` : ""}`;
    return m.rx
      ? `<ellipse cx="${m.x}" cy="${m.y}" rx="${m.rx}" ry="${m.ry}" transform="rotate(${m.rot || 0} ${m.x} ${m.y})" ${trazo}/>`
      : `<circle cx="${m.x}" cy="${m.y}" r="${m.r}" ${trazo}/>`;
  };
  const marcas = (p.marcas || []).map((m) => `${forma(m, "#000", 7, 0.35)}${forma(m, m.c, 3.5)}
    ${m.t ? `<text x="${m.tx ?? m.x}" y="${m.ty ?? m.y - (m.ry || m.r) - 8 / k}" text-anchor="${m.ancla || "middle"}" font-size="${15 / k}" font-weight="800" fill="${m.c}" stroke="#111" stroke-width="${3.5 / k}" paint-order="stroke">${m.t}</text>` : ""}`).join("");
  const tapas = (p.tapar || []).map(([x, y, w, h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#fff"/>`).join("");
  const textos = (p.textos || []).map((t) => `<text x="${t.x}" y="${t.y}" text-anchor="${t.ancla || "start"}" font-size="${t.tam || 15 / k}" font-weight="600" fill="#1F2937">${t.t}</text>`).join("");
  return `<div style="position:relative;flex:none">
    <svg width="${W}" height="${H}" viewBox="${x0} ${y0} ${w} ${h}" style="display:block;border-radius:10px">
      ${tapas || textos ? `<rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="#fff"/>` : ""}<image href="${p.src}" x="0" y="0" width="${p.tam[0]}" height="${p.tam[1]}"/>${tapas}${textos}${marcas}
    </svg>
    ${p.rotulo ? `<div style="position:absolute;left:7px;top:7px;background:rgba(17,24,39,.78);color:#fff;font-size:12.5px;font-weight:700;padding:3px 8px;border-radius:6px">${p.rotulo}</div>` : ""}
  </div>`;
}

function fotos({ titulo, sub, paneles, dir = "fila", alto = 380, ancho = 668, hueco = 8, notas = [], fuente }) {
  let ks;
  if (dir === "fila") {
    // misma altura para todos los paneles
    const anchoA1 = paneles.reduce((s, p) => s + p.recorte[2] / p.recorte[3], 0);
    const h = Math.min(alto, (ancho - hueco * (paneles.length - 1)) / anchoA1);
    ks = paneles.map((p) => h / p.recorte[3]);
  } else {
    // mismo ancho para todos los paneles
    const altoA1 = paneles.reduce((s, p) => s + p.recorte[3] / p.recorte[2], 0);
    const w = Math.min(ancho, (alto - hueco * (paneles.length - 1)) / altoA1);
    ks = paneles.map((p) => w / p.recorte[2]);
  }
  lienzo(titulo, sub,
    `<div style="display:flex;flex-direction:${dir === "fila" ? "row" : "column"};gap:${hueco}px;justify-content:center;align-items:center">${paneles.map((p, i) => panelSvg(p, ks[i])).join("")}</div>
     ${notas.length ? `<div style="display:flex;gap:8px;flex-wrap:wrap">${notas.map(([c, t]) => `<div class="item" style="background:#F7F8FA;flex:1;min-width:200px"><b style="color:${c === AMARILLO ? "#B59A00" : c}">●</b> ${t}</div>`).join("")}</div>` : ""}`,
    fuente);
}
