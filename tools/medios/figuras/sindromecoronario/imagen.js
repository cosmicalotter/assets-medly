// Imagen real con señaladores propios (flechas, elipses, rótulos con borde oscuro) y leyenda.
// Coordenadas en píxeles de la imagen original; el SVG usa su viewBox, así el grosor y la
// letra se escalan con k para verse siempre igual.
// imagen({ titulo, sub, src, tam:[w,h], recorte:[x,y,w,h], alto, lado:"derecha"|"abajo",
//          tapas:[{x,y,w,h,c}], flechas:[{x1,y1,x2,y2,c}], elipses:[{x,y,rx,ry,rot,c}],
//          rotulos:[{x,y,t,c,ancla,tam}], lineas:[{x1,y1,x2,y2,c,discontinua}], puntos:[{x,y,c}],
//          notas:[[color, html]], fuente })
function imagen(o) {
  const [x0, y0, w, h] = o.recorte;
  const lado = o.lado || "derecha";
  const maxW = lado === "derecha" ? (o.anchoImg || 420) : 668;
  const k = Math.min((o.alto || 388) / h, maxW / w);
  const W = Math.round(w * k), H = Math.round(h * k);
  const s = (v) => v / k;
  const halo = (c) => `stroke="#111" stroke-opacity=".55"`;
  const flecha = (f) => {
    const a = Math.atan2(f.y2 - f.y1, f.x2 - f.x1), p = s(f.punta || 16);
    const bx = f.x2 - p * Math.cos(a), by = f.y2 - p * Math.sin(a);
    const q = (sg) => `${bx + sg * p * 0.55 * Math.sin(a)},${by - sg * p * 0.55 * Math.cos(a)}`;
    const linea = (c, an, op) => `<line x1="${f.x1}" y1="${f.y1}" x2="${bx}" y2="${by}" stroke="${c}" stroke-opacity="${op}" stroke-width="${s(an)}" stroke-linecap="round"/>`;
    return linea("#111", 8, 0.5) + linea(f.c, 4.5, 1) +
      `<polygon points="${f.x2},${f.y2} ${q(1)} ${q(-1)}" fill="${f.c}" stroke="#111" stroke-opacity=".5" stroke-width="${s(1.5)}"/>`;
  };
  const elipse = (e) => [["#111", 7, 0.45], [e.c, 3.5, 1]].map(([c, an, op]) =>
    `<ellipse cx="${e.x}" cy="${e.y}" rx="${e.rx}" ry="${e.ry}" transform="rotate(${e.rot || 0} ${e.x} ${e.y})" fill="none" stroke="${c}" stroke-opacity="${op}" stroke-width="${s(an)}"${e.discontinua ? ` stroke-dasharray="${s(9)} ${s(6)}"` : ""}/>`).join("");
  const linea = (l) => [["#111", 8, 0.45], [l.c, 4, 1]].map(([c, an, op]) =>
    `<line x1="${l.x1}" y1="${l.y1}" x2="${l.x2}" y2="${l.y2}" stroke="${c}" stroke-opacity="${op}" stroke-width="${s(an)}" stroke-linecap="round"${l.discontinua ? ` stroke-dasharray="${s(8)} ${s(6)}"` : ""}/>`).join("");
  const punto = (p) => `<circle cx="${p.x}" cy="${p.y}" r="${s(6)}" fill="${p.c}" stroke="#111" stroke-width="${s(2)}"/>`;
  const rotulo = (r) => `<text x="${r.x}" y="${r.y}" text-anchor="${r.ancla || "middle"}" font-size="${s(r.tam || 15)}" font-weight="800" fill="${r.c || "#fff"}" stroke="#111" stroke-width="${s(3)}" paint-order="stroke" style="word-spacing:.25em">${r.t}</text>`;
  const tapa = (t) => `<rect x="${t.x}" y="${t.y}" width="${t.w}" height="${t.h}" fill="${t.c || "#000"}"/>`;
  const svg = `<svg width="${W}" height="${H}" viewBox="${x0} ${y0} ${w} ${h}" style="display:block;border-radius:10px;flex:none">
    <image href="${o.src}" x="0" y="0" width="${o.tam[0]}" height="${o.tam[1]}"/>
    ${(o.tapas || []).map(tapa).join("")}${(o.lineas || []).map(linea).join("")}${(o.elipses || []).map(elipse).join("")}
    ${(o.flechas || []).map(flecha).join("")}${(o.puntos || []).map(punto).join("")}${(o.rotulos || []).map(rotulo).join("")}
  </svg>`;
  const notas = (o.notas || []).map(([c, t]) => `<div class="item" style="background:#F7F8FA"><b style="color:${c}">●</b> ${t}</div>`).join("");
  const cuerpo = lado === "derecha"
    ? `<div style="display:flex;gap:12px;align-items:center;justify-content:center;flex:1;min-height:0">${svg}<div style="display:flex;flex-direction:column;gap:7px;flex:1">${notas}</div></div>`
    : `<div style="display:flex;justify-content:center">${svg}</div><div style="display:flex;gap:8px;flex-wrap:wrap">${notas.replace(/class="item" style="/g, 'class="item" style="flex:1;min-width:200px;')}</div>`;
  lienzo(o.titulo, o.sub, cuerpo, o.fuente);
}
