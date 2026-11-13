// Línea de tiempo de la corrección del sodio (GIF de flujo): el marcador avanza por las horas y se encienden los pasos.
// window.MODO = "hipo" | "hiper". Fuente: Zieg J et al. BMC Nephrol 2024 (citado, sin reproducir figuras).
const R = {
  hipo: {
    titulo: "Hiponatremia sintomática: qué tan rápido subir",
    sub: "Ejemplo: sodio de 118 mEq/L con encefalopatía",
    horas: 48, y0: 112, y1: 142, color: AZUL,
    curva: [[0, 118], [1.5, 124], [6, 125], [24, 127.5], [36, 132], [48, 137]],
    topes: [[24, 128, "Tope: +10 en 24 h"], [48, 138, "Tope: +20 en 48 h"]],
    banda: [0.8, 2.2, 123, 124, "Meta: +5-6 en 1-2 h"],
    pasos: [
      [0, "0 h", "Bolo de <b>salina 3 %</b>: <b>2 mL/kg</b>, máximo 100 mL", ROJO],
      [1.5, "1-2 h", "Meta: subir <b>5-6 mEq/L</b>; repetir el bolo si siguen los síntomas", AMBAR],
      [24, "24 h", "No subir más de <b>10 mEq/L</b>", MORADO],
      [48, "48 h", "No subir más de <b>20 mEq/L</b>", MORADO],
    ],
  },
  hiper: {
    titulo: "Hipernatremia: qué tan rápido bajar el sodio",
    sub: "Ejemplo: sodio de 165 mEq/L, ya con buena perfusión",
    horas: 24, y0: 136, y1: 168, color: NARANJA,
    curva: [[0, 165], [2, 164.2], [8, 160.5], [16, 155.4], [24, 150.6]],
    topes: [[24, 150, "Tope: −15 en 24 h"]],
    rapido: [[0, 165], [24, 141], "Más rápido que 1 mEq/L por hora"],
    pasos: [
      [0, "0 h", "Si hay hipovolemia, <b>isotónica</b> primero", ROJO],
      [1, "1 h", "Calcular el <b>agua libre</b>: 4 mL × kg × Δ sodio", AZUL],
      [8, "Cada pocas horas", "<b>Medir el sodio</b>: bajar menos de <b>1 mEq/L</b> por hora", AMBAR],
      [24, "24 h", "No bajar más de <b>15 mEq/L</b>", MORADO],
    ],
  },
}[window.MODO];

const GW = 668, GH = 318, PX = 48, PY = 16, AW = GW - PX - 14, AH = GH - PY - 34;
const X = (h) => PX + (h / R.horas) * AW, Y = (na) => PY + (1 - (na - R.y0) / (R.y1 - R.y0)) * AH;
function naEn(h) {
  const c = R.curva;
  for (let i = 0; i < c.length - 1; i++) if (h <= c[i + 1][0]) return lerp(c[i][1], c[i + 1][1], (h - c[i][0]) / (c[i + 1][0] - c[i][0]));
  return c[c.length - 1][1];
}

window.cuadro = function (i, n) {
  const u = n > 1 ? suave(Math.min(1, i / (n - 1) * 1.08)) : 1;
  const h = u * R.horas;
  let g = "";
  // rejilla y ejes
  for (let na = Math.ceil(R.y0 / 5) * 5; na <= R.y1; na += 5)
    g += `<line x1="${PX}" x2="${GW - 14}" y1="${Y(na)}" y2="${Y(na)}" stroke="#EEF0F3"/><text x="${PX - 8}" y="${Y(na) + 4}" font-size="11" fill="${GRIS}" text-anchor="end">${na}</text>`;
  const paso = R.horas === 48 ? 6 : 4;
  for (let t = 0; t <= R.horas; t += paso)
    g += `<text x="${X(t)}" y="${GH - 12}" font-size="11" fill="${GRIS}" text-anchor="middle">${t} h</text>`;
  g += `<text x="${PX - 40}" y="${PY + 8}" font-size="11" font-weight="700" fill="${GRIS}">mEq/L</text>`;
  if (R.banda) {
    const [a, b, lo, hi, t] = R.banda;
    g += `<rect x="${X(a)}" y="${Y(hi + 0.6)}" width="${X(b) - X(a)}" height="${Y(lo - 0.6) - Y(hi + 0.6)}" fill="${tinte(AMBAR, 35)}" rx="4"/>
      <text x="${X(b) + 8}" y="${Y(lo) + 20}" font-size="11.5" font-weight="800" fill="#B7791F">${t}</text>`;
  }
  if (R.rapido) {
    const [[a, na0], [b, na1], t] = R.rapido;
    g += `<line x1="${X(a)}" y1="${Y(na0)}" x2="${X(b)}" y2="${Y(na1)}" stroke="${ROJO}" stroke-width="2.5" stroke-dasharray="7 6"/>
      <text x="${X(b) - 6}" y="${Y(na1) - 8}" font-size="11.5" font-weight="800" fill="${ROJO}" text-anchor="end">${t}: edema cerebral</text>`;
  }
  R.topes.forEach(([t, na, txt]) => {
    g += `<line x1="${PX}" x2="${GW - 14}" y1="${Y(na)}" y2="${Y(na)}" stroke="${MORADO}" stroke-width="2" stroke-dasharray="5 5" opacity=".75"/>
      <circle cx="${X(t)}" cy="${Y(na)}" r="5" fill="${MORADO}"/><text x="${window.MODO === "hiper" ? PX + 8 : X(t) - 8}" y="${Y(na) - 8}" font-size="11.5" font-weight="800" fill="${MORADO}" text-anchor="${window.MODO === "hiper" ? "start" : "end"}">${txt}</text>`;
  });
  // curva recorrida y marcador
  let d = `M${X(0)} ${Y(naEn(0))}`;
  for (let t = 0.25; t <= h; t += 0.25) d += ` L${X(t)} ${Y(naEn(t))}`;
  g += `<path d="${d}" fill="none" stroke="${R.color}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="${X(h)}" cy="${Y(naEn(h))}" r="8" fill="#fff" stroke="${R.color}" stroke-width="4"/>
    <rect x="${Math.min(X(h) + 10, GW - 92)}" y="${Y(naEn(h)) + (window.MODO === "hipo" ? 10 : -38)}" width="78" height="26" rx="7" fill="${R.color}"/>
    <text x="${Math.min(X(h) + 10, GW - 92) + 39}" y="${Y(naEn(h)) + (window.MODO === "hipo" ? 28 : -20)}" font-size="13" font-weight="800" fill="#fff" text-anchor="middle">${Math.round(naEn(h))} mEq/L</text>`;
  const activo = R.pasos.reduce((a, p, j) => (h >= p[0] - 0.01 ? j : a), 0);
  const tarjetas = R.pasos.map(([t, hora, txt, c], j) => `<div class="item" style="flex:1;opacity:${j <= activo ? 1 : 0.25};background:${j === activo ? tinte(c, 16) : "#F7F8FA"};border:1.5px solid ${j === activo ? c : "transparent"};font-size:12.8px">
      <div style="font-size:12px;font-weight:800;color:${c};margin-bottom:2px">${hora}</div>${txt}</div>`).join("");
  lienzo(R.titulo, R.sub,
    `<svg width="${GW}" height="${GH}" viewBox="0 0 ${GW} ${GH}" style="display:block">${g}</svg>
     <div style="display:flex;gap:8px;align-items:stretch">${tarjetas}</div>`,
    "Datos: Zieg J et al. BMC Nephrol 2024. Valores de ejemplo para ilustrar los topes. Elaboración de Empirica.");
};
window.cuadro(1, 1);
