// La neurona y el agua (fisiología, esquema plano): el sodio del plasma decide hacia dónde va el agua.
// window.MODO = "hipo" | "hiper" antes de cargar este archivo. Fuentes: Zieg 2017 (Front Pediatr) y Zieg 2024 (BMC Nephrol).
const ESC = {
  hipo: {
    titulo: "Hiponatremia: el agua entra a la neurona",
    sub: "Por qué la encefalopatía es una urgencia y por qué no se corrige rápido",
    // t: comienzo del tramo; na: sodio al final del tramo; r: radio de la neurona; agua: hacia dónde va; sol: salen solutos
    tramos: [
      { t: 0.00, na: 140, r: 74, agua: null, color: TEAL, paso: 0 },
      { t: 0.14, na: 118, r: 98, agua: "entra", color: ROJO, paso: 1 },
      { t: 0.42, na: 118, r: 80, agua: "sale", sol: true, color: AMBAR, paso: 2 },
      { t: 0.68, na: 138, r: 58, agua: "sale", color: MORADO, paso: 3 },
      { t: 1.00 },
    ],
    pasos: [
      ["Sodio normal", "El agua está en <b>equilibrio</b> entre el plasma y la neurona.", TEAL],
      ["Sodio bajo: edema cerebral", "El plasma queda <b>diluido</b> y el agua entra a la neurona. El cerebro del niño tiene <b>menos espacio</b> en el cráneo.", ROJO],
      ["Adaptación", "Con el tiempo, la neurona saca <b>solutos</b> (sodio, potasio y osmolitos) y agua, y recupera su volumen: ya es <b>crónica</b>.", AMBAR],
      ["Corregir rápido: desmielinización", "Si el sodio sube <b>de golpe</b>, la neurona adaptada pierde agua y se encoge. Tope: <b>10 mEq/L</b> en 24 h.", MORADO],
    ],
    fuente: "Datos: Zieg J. Front Pediatr 2017 (CC BY 4.0) y Zieg J et al. BMC Nephrol 2024. Elaboración de Empirica.",
  },
  hiper: {
    titulo: "Hipernatremia: el agua sale de la neurona",
    sub: "Por qué los síntomas son neurológicos y por qué el sodio se baja despacio",
    tramos: [
      { t: 0.00, na: 140, r: 74, agua: null, color: TEAL, paso: 0 },
      { t: 0.14, na: 165, r: 56, agua: "sale", color: NARANJA, paso: 1 },
      { t: 0.42, na: 140, r: 96, agua: "entra", color: ROJO, paso: 2, rapido: true },
      { t: 0.68, na: 152, r: 74, agua: "entra", color: VERDE, paso: 3, desde: { na: 165, r: 56 } },
      { t: 1.00 },
    ],
    pasos: [
      ["Sodio normal", "El agua está en <b>equilibrio</b> entre el plasma y la neurona.", TEAL],
      ["Sodio alto: la neurona se encoge", "El plasma está <b>concentrado</b> y saca el agua de la neurona: irritabilidad, letargia, <b>convulsiones</b>.", NARANJA],
      ["Bajarlo rápido: edema cerebral", "Si el sodio baja <b>de golpe</b>, el agua vuelve a entrar en exceso y la neurona se <b>hincha</b>.", ROJO],
      ["Bajarlo despacio", "Menos de <b>1 mEq/L por hora</b> y <b>15 mEq/L</b> en 24 h: la neurona recupera su tamaño.", VERDE],
    ],
    fuente: "Datos: Zieg J et al. BMC Nephrol 2024 (CC BY-NC-ND 4.0), citado sin reproducir figuras. Elaboración de Empirica.",
  },
}[window.MODO];

function estado(u) {
  const T = ESC.tramos;
  let i = 0;
  while (i < T.length - 2 && u >= T[i + 1].t) i++;
  const a = T[i], b = T[i + 1];
  const k = suave(tramo(u, a.t, a.t + (b.t - a.t) * 0.7));
  const prev = a.desde || (i > 0 ? { na: T[i - 1].na, r: T[i - 1].r } : { na: a.na, r: a.r });
  return { na: lerp(prev.na, a.na, k), r: lerp(prev.r, a.r, k), k, tr: a, fase: (u - a.t) / (b.t - a.t) };
}

function escena(u) {
  const e = estado(u), W = 420, H = 392, cx = 210, cy = 204;
  const sodios = Math.round(e.na / 6);
  // puntos de sodio del plasma: fijos, fuera del cráneo; su número sigue al sodio
  let na = "";
  for (let j = 0; j < 30; j++) {
    const ang = j * 2.399, rad = 162 + (j % 4) * 10;
    const x = cx + Math.cos(ang) * rad * 1.25, y = cy + Math.sin(ang) * rad * 0.92;
    if (j < sodios - 6) na += `<circle cx="${x}" cy="${y}" r="5.5" fill="${AZUL}"/><text x="${x}" y="${y + 3}" font-size="7" text-anchor="middle" fill="#fff" font-weight="800">Na</text>`;
  }
  // gotas de agua que cruzan la membrana
  let agua = "";
  if (e.tr.agua && e.k < 0.999) {
    for (let j = 0; j < 8; j++) {
      const ang = j * Math.PI / 4 + 0.3;
      const f = (e.fase * 3 + j / 8) % 1;
      const r0 = e.tr.agua === "entra" ? e.r + 46 - f * 46 : e.r - 10 + f * 52;
      const x = cx + Math.cos(ang) * r0, y = cy + Math.sin(ang) * r0 * 0.9;
      agua += `<path d="M${x} ${y - 7} q5 7 0 11 q-5 -4 0 -11z" fill="${CELESTE}" opacity="${0.35 + 0.65 * Math.sin(f * Math.PI)}"/>`;
    }
  }
  let sol = "";
  if (e.tr.sol) {
    for (let j = 0; j < 7; j++) {
      const ang = j * 0.9 + 1.1, f = Math.min(1, e.fase * 1.6 + j * 0.03);
      const r0 = e.r * 0.55 + f * (e.r * 0.75);
      sol += `<circle cx="${cx + Math.cos(ang) * r0}" cy="${cy + Math.sin(ang) * r0 * 0.9}" r="4.5" fill="${AMBAR}" stroke="#fff" stroke-width="1.2"/>`;
    }
  }
  const choca = e.r > 90;
  const membrana = e.tr.color;
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="display:block;background:${tinte(AZUL, 7)};border-radius:14px">
    ${na}
    <text x="14" y="22" font-size="13" font-weight="800" fill="${AZUL}">Plasma</text>
    <rect x="${cx - 118}" y="${cy - 104}" width="236" height="208" rx="96" fill="#fff" stroke="${choca ? ROJO : GRIS}" stroke-width="${choca ? 7 : 5}"/>
    <text x="${cx}" y="${cy - 112}" font-size="12.5" font-weight="800" fill="${choca ? ROJO : GRIS}" text-anchor="middle">Cráneo</text>
    <ellipse cx="${cx}" cy="${cy}" rx="${e.r}" ry="${e.r * 0.9}" fill="${tinte(membrana, 16)}" stroke="${membrana}" stroke-width="4"/>
    <circle cx="${cx - e.r * 0.15}" cy="${cy - e.r * 0.1}" r="${e.r * 0.26}" fill="${tinte(membrana, 38)}"/>
    <text x="${cx}" y="${cy + e.r * 0.62}" font-size="13" font-weight="800" fill="${membrana}" text-anchor="middle">Neurona</text>
    ${agua}${sol}
  </svg>`;
}

window.cuadro = function (i, n) {
  const u = n > 1 ? i / (n - 1) : 1;
  const e = estado(u), paso = e.tr.paso;
  const lista = ESC.pasos.map(([t, d, c], j) => `<div class="item" style="font-size:13px;line-height:1.32;padding:7px 10px;opacity:${j <= paso ? 1 : 0.22};background:${j === paso ? tinte(c, 15) : "#F7F8FA"};border:1.5px solid ${j === paso ? c : "transparent"}">
      <b style="color:${c}">${j + 1}. ${t}</b><br><span>${d}</span></div>`).join("");
  lienzo(ESC.titulo, ESC.sub,
    `<div style="display:flex;gap:14px;align-items:flex-start">
      <div style="position:relative;flex:none">${escena(u)}
        <div style="position:absolute;right:10px;top:8px;background:#fff;border:2px solid ${e.tr.color};border-radius:10px;padding:4px 10px;text-align:center">
          <div style="font-size:10.5px;font-weight:700;color:var(--suave)">Sodio</div><div style="font-size:22px;font-weight:800;color:${e.tr.color}">${Math.round(e.na)}</div><div style="font-size:9.5px;color:var(--suave)">mEq/L</div></div></div>
      <div style="flex:1;display:flex;flex-direction:column;gap:6px">${lista}</div></div>`,
    ESC.fuente);
};
window.cuadro(1, 1);
