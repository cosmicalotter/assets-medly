// Variante apaisada de recorrido.js (../biliar) para trazados largos: ECG y EEG.
// La imagen real ocupa todo el ancho y los pasos van debajo, en dos columnas.
// Mismo formato de escenas y pasos que recorrido(); además `alto` (del visor,
// 230 por defecto) y `barrido`: si es true, un cursor recorre el trazado
// durante cada paso que declara `barre: [x0, x1]` y descubre la imagen a su paso.
// Necesita base.js y recorrido.js (por D y suaviza) cargados antes.

function recorridoAncho(cfg) {
  const ANCHO = 668, ALTO = cfg.alto || 230;
  const fila = [];
  cfg.escenas.forEach((esc, s) => esc.pasos.forEach((p, j) => fila.push({ ...p, s, j })));
  const N = fila.length + (cfg.final ? 1 : 0);
  const css = `.visor{position:relative;width:${ANCHO}px;height:${ALTO}px;border-radius:14px;overflow:hidden;background:#0b0b0b;flex:none}
    .lista{display:grid;grid-template-columns:1fr 1fr;gap:5px 8px}
    .p{display:flex;gap:8px;align-items:center;border-radius:10px;padding:7px 10px;background:#F3F4F6;font-size:13.5px;line-height:1.25;color:#9CA3AF}
    .p .n{width:22px;height:22px;border-radius:7px;background:#D1D5DB;color:#fff;font-weight:800;font-size:12px;display:flex;align-items:center;justify-content:center;flex:none}
    .p.hecho{color:var(--tinta)} .p.hecho .n{background:var(--suave)}
    .p.ya{background:#1F2A37;color:#fff;font-weight:700} .p.ya .n{background:var(--teal)}
    .cierre{background:#1F2A37;color:#fff;border-radius:12px;padding:9px 12px;font-size:13.5px;font-weight:700;line-height:1.3}`;
  document.head.insertAdjacentHTML("beforeend", `<style>${css}</style>`);

  window.cuadro = function (i, n) {
    const t = n > 1 ? i / (n - 1) : 0.5;
    const pos = Math.min(N - 1e-6, t * N);
    const k = Math.floor(pos), crudo = Math.min(1, pos - k), u = suaviza(Math.min(1, crudo / 0.3));
    const enFinal = cfg.final && k === fila.length;
    const actual = fila[Math.min(k, fila.length - 1)];
    const esc = cfg.escenas[actual.s];
    const vistaDe = (p) => p.vista || cfg.escenas[p.s].vista;
    const previo = k > 0 && fila[k - 1] && fila[k - 1].s === actual.s ? vistaDe(fila[k - 1]) : vistaDe(actual);
    const vb = enFinal ? vistaDe(actual) : previo.map((v, j) => lerp(v, vistaDe(actual)[j], u));
    const e = vb[2] / ANCHO;
    // Barrido: lo ya recorrido se ve; lo que falta, tapado.
    let corte = esc.w;
    if (cfg.barrido) {
      corte = 0;
      fila.forEach((p, idx) => {
        if (!p.barre || p.s !== actual.s || idx > k) return;
        const [a, b] = p.barre;
        corte = Math.max(corte, idx < k || enFinal ? b : lerp(a, b, Math.min(1, crudo / 0.8)));
      });
    }
    let s = `<image href="${esc.img}" x="0" y="0" width="${esc.w}" height="${esc.h}" ${esc.filtro ? `style="filter:${esc.filtro}"` : ""}/>`;
    s += (esc.tapas || []).map((p) => `<polygon points="${p.split("|")[0]}" fill="${p.split("|")[1] || "#000"}"/>`).join("");
    if (cfg.barrido && corte < esc.w) {
      s += `<rect x="${corte}" y="0" width="${esc.w - corte}" height="${esc.h}" fill="${cfg.fondo || "#fff"}"/>
        <line x1="${corte}" y1="0" x2="${corte}" y2="${esc.h}" stroke="#2FB36D" stroke-width="${3 * e}"/>`;
    }
    if (esc.encima) s += esc.encima(e);
    fila.forEach((p, idx) => {
      if (p.s !== actual.s || idx > Math.min(k, fila.length - 1) || !p.dibujo) return;
      s += p.dibujo(idx === k ? u : 1, e, idx === k ? t : null);
    });
    const lista = fila.map((p, j) => `<div class="p ${j < k ? "hecho" : j === k ? "ya" : ""}"><div class="n">${j + 1}</div><div>${p.texto}</div></div>`).join("");
    const cierre = cfg.final ? `<div class="cierre" style="opacity:${enFinal ? u : 0}">${cfg.final}</div>` : "";
    lienzo(cfg.titulo, cfg.subtitulo,
      `<div class="visor"><svg width="${ANCHO}" height="${ALTO}" viewBox="${vb.join(" ")}" preserveAspectRatio="xMidYMid slice">${s}</svg></div>
       <div class="lista">${lista}</div>${cierre}`,
      cfg.credito);
  };
  window.cuadro(0, 1);
}
