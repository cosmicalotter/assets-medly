// Motor de recorridos sobre imágenes reales (720 × 540): a la izquierda la
// imagen con cámara (zoom y paneo) y dibujos encima; a la derecha la lista de
// pasos que se va encendiendo. Cada página define:
//
//   recorrido({
//     titulo, subtitulo, credito,
//     escenas: [{ img, w, h, vista: [x, y, w, h], filtro, tapas: ["x,y x,y …"], encima: (e) => svg,
//                 pasos: [{ texto, vista, dibujo: (u, e) => svg }] }],
//     final: "html de la tarjeta final" (opcional),
//   });
//
// Coordenadas en píxeles de la imagen original; `e` = unidades de imagen por
// píxel de pantalla, para que trazos y letras se vean igual con cualquier zoom.
// `u` va de 0 a 1 mientras entra el paso (y se queda en 1 después).

const VISOR = [390, 388];
const suaviza = (u) => u * u * (3 - 2 * u);

// --- piezas de dibujo -------------------------------------------------------
const D = {
  rotulo(x, y, txt, col, e, { ancla = "start", op = 1, tam = 14 } = {}) {
    return `<text x="${x}" y="${y}" font-size="${tam * e}" font-weight="800" fill="${col}" text-anchor="${ancla}" opacity="${op}"
      stroke="#111" stroke-width="${3.6 * e}" stroke-linejoin="round" paint-order="stroke">${txt}</text>`;
  },
  flecha(x1, y1, x2, y2, col, e, op = 1, u = 1) {
    const xe = x1 + (x2 - x1) * u, ye = y1 + (y2 - y1) * u, a = Math.atan2(ye - y1, xe - x1), L = 13 * e;
    const p = (s) => `${xe - L * Math.cos(a + s)},${ye - L * Math.sin(a + s)}`;
    return `<g opacity="${op}"><line x1="${x1}" y1="${y1}" x2="${xe}" y2="${ye}" stroke="#111" stroke-width="${7.5 * e}" stroke-linecap="round"/>
      <line x1="${x1}" y1="${y1}" x2="${xe}" y2="${ye}" stroke="${col}" stroke-width="${4.5 * e}" stroke-linecap="round"/>
      <polygon points="${xe},${ye} ${p(0.45)} ${p(-0.45)}" fill="${col}" stroke="#111" stroke-width="${1.5 * e}"/></g>`;
  },
  anillo(cx, cy, r, col, e, op = 1, pulso = 0) {
    return `<circle cx="${cx}" cy="${cy}" r="${r * (1 + 0.1 * pulso)}" fill="${col}" fill-opacity=".16" stroke="${col}" stroke-width="${3.5 * e}" opacity="${op}"/>`;
  },
  elipse(cx, cy, rx, ry, rot, col, e, op = 1, guion = false) {
    return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" transform="rotate(${rot} ${cx} ${cy})" fill="${col}" fill-opacity=".18"
      stroke="${col}" stroke-width="${3.2 * e}" ${guion ? `stroke-dasharray="${9 * e} ${6 * e}"` : ""} opacity="${op}"/>`;
  },
  zona(puntos, col, e, op = 1) {
    return `<polygon points="${puntos}" fill="${col}" fill-opacity=".2" stroke="${col}" stroke-width="${3 * e}" stroke-linejoin="round" opacity="${op}"/>`;
  },
  calibre(x1, y1, x2, y2, col, e, u = 1, op = 1) {
    const xe = x1 + (x2 - x1) * u, ye = y1 + (y2 - y1) * u, a = Math.atan2(y2 - y1, x2 - x1) + Math.PI / 2, c = 8 * e;
    const tope = (x, y) => `<line x1="${x - c * Math.cos(a)}" y1="${y - c * Math.sin(a)}" x2="${x + c * Math.cos(a)}" y2="${y + c * Math.sin(a)}" stroke="${col}" stroke-width="${3 * e}"/>`;
    return `<g opacity="${op}">${tope(x1, y1)}<line x1="${x1}" y1="${y1}" x2="${xe}" y2="${ye}" stroke="${col}" stroke-width="${2.6 * e}"/>${u > 0.98 ? tope(x2, y2) : ""}</g>`;
  },
};

function recorrido(cfg) {
  // Pasos en una sola fila de tiempo, con su escena.
  const fila = [];
  cfg.escenas.forEach((esc, s) => esc.pasos.forEach((p, j) => fila.push({ ...p, s, j })));
  const N = fila.length + (cfg.final ? 1 : 0);
  const css = `.fila{display:flex;gap:12px;flex:1;min-height:0}
    .visor{position:relative;width:${VISOR[0]}px;height:${VISOR[1]}px;border-radius:14px;overflow:hidden;background:#0b0b0b;flex:none}
    .lado{flex:1;display:flex;flex-direction:column;gap:5px}
    .p{display:flex;gap:8px;align-items:center;border-radius:10px;padding:6px 9px;background:#F3F4F6;font-size:12.5px;line-height:1.25;color:#9CA3AF}
    .p .n{width:21px;height:21px;border-radius:7px;background:#D1D5DB;color:#fff;font-weight:800;font-size:12px;display:flex;align-items:center;justify-content:center;flex:none}
    .p.hecho{color:var(--tinta)} .p.hecho .n{background:var(--suave)}
    .p.ya{background:#1F2A37;color:#fff;font-weight:700} .p.ya .n{background:var(--teal)}
    .cierre{position:absolute;left:12px;right:12px;bottom:12px;background:rgba(31,42,55,.95);color:#fff;border-radius:12px;padding:9px 12px;font-size:13.5px;font-weight:700;line-height:1.3}`;
  document.head.insertAdjacentHTML("beforeend", `<style>${css}</style>`);

  window.cuadro = function (i, n) {
    const t = n > 1 ? i / (n - 1) : 0.5;
    const pos = Math.min(N - 1e-6, t * N);
    const k = Math.floor(pos), u = suaviza(Math.min(1, (pos - k) / 0.3));
    const enFinal = cfg.final && k === fila.length;
    const actual = fila[Math.min(k, fila.length - 1)];
    const esc = cfg.escenas[actual.s];
    // Cámara: del paso anterior (si es la misma escena) al actual.
    const vistaDe = (p) => p.vista || cfg.escenas[p.s].vista;
    const previo = k > 0 && fila[k - 1] && fila[k - 1].s === actual.s ? vistaDe(fila[k - 1]) : vistaDe(actual);
    const vb = enFinal ? vistaDe(actual) : previo.map((v, j) => lerp(v, vistaDe(actual)[j], u));
    const e = vb[2] / VISOR[0];
    let s = `<image href="${esc.img}" x="0" y="0" width="${esc.w}" height="${esc.h}" ${esc.filtro ? `style="filter:${esc.filtro}"` : ""}/>`;
    s += (esc.tapas || []).map((p) => `<polygon points="${p.split("|")[0]}" fill="${p.split("|")[1] || "#000"}"/>`).join("");
    if (esc.encima) s += esc.encima(e); // capa fija de la escena (p. ej. rótulos traducidos)
    // Dibujos de los pasos ya vistos de esta escena y del actual.
    fila.forEach((p, idx) => {
      if (p.s !== actual.s || idx > Math.min(k, fila.length - 1) || !p.dibujo) return;
      s += p.dibujo(idx === k ? u : 1, e, idx === k ? t : null);
    });
    const tarjeta = enFinal ? `<div class="cierre" style="opacity:${u}">${cfg.final}</div>` : "";
    const lista = fila.map((p, j) => `<div class="p ${j < k ? "hecho" : j === k ? "ya" : ""}"><div class="n">${j + 1}</div><div>${p.texto}</div></div>`).join("");
    lienzo(cfg.titulo, cfg.subtitulo,
      `<div class="fila"><div class="visor"><svg width="${VISOR[0]}" height="${VISOR[1]}" viewBox="${vb.join(" ")}" preserveAspectRatio="xMidYMid slice">${s}</svg>${tarjeta}</div>
         <div class="lado">${lista}${cfg.extraLado ? cfg.extraLado(k, u) : ""}</div></div>`,
      cfg.credito);
  };
  window.cuadro(0, 1);
}
