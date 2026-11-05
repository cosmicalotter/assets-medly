// Mapa de calor de la ERC (KDIGO): filas G1-G5, columnas A1-A3.
const VERDE = "#2FB36D", AMARILLO = "#F2C94C", NARANJA = "#F2994A", ROJO = "#EB5757";
const FILAS = [["G1", "Normal o alta", "≥90"], ["G2", "Descenso leve", "60-89"], ["G3a", "Leve a moderado", "45-59"],
               ["G3b", "Moderado a grave", "30-44"], ["G4", "Grave", "15-29"], ["G5", "Falla renal", "<15"]];
const COLS = [["A1", "Normal a leve", "<30 mg/g"], ["A2", "Moderada", "30-300 mg/g"], ["A3", "Grave", ">300 mg/g"]];
const RIESGO = [[VERDE, AMARILLO, NARANJA], [VERDE, AMARILLO, NARANJA], [AMARILLO, NARANJA, ROJO],
                [NARANJA, ROJO, ROJO], [ROJO, ROJO, ROJO], [ROJO, ROJO, ROJO]];
function mapa(celda) {
  const x0 = 250, y0 = 62, cw = 138, ch = 46;
  let s = `<svg width="668" height="${y0 + ch * 6 + 4}" viewBox="0 0 668 ${y0 + ch * 6 + 4}">`;
  COLS.forEach(([a, d, r], j) => {
    s += `<text x="${x0 + cw * j + cw / 2}" y="20" text-anchor="middle" font-size="16" font-weight="800" fill="#1F2A37">${a}</text>
      <text x="${x0 + cw * j + cw / 2}" y="37" text-anchor="middle" font-size="12" fill="#6B7280">${d}</text>
      <text x="${x0 + cw * j + cw / 2}" y="53" text-anchor="middle" font-size="12" font-weight="700" fill="#6B7280">${r}</text>`;
  });
  FILAS.forEach(([g, d, r], i) => {
    const y = y0 + ch * i;
    s += `<text x="12" y="${y + 29}" font-size="16" font-weight="800" fill="#1F2A37">${g}</text>
      <text x="58" y="${y + 22}" font-size="12.5" fill="#1F2A37">${d}</text>
      <text x="58" y="${y + 38}" font-size="12" font-weight="700" fill="#6B7280">${r} mL/min/1,73 m²</text>`;
    COLS.forEach((_, j) => {
      s += `<rect x="${x0 + cw * j + 2}" y="${y + 2}" width="${cw - 4}" height="${ch - 4}" rx="7" fill="${RIESGO[i][j]}"/>`;
      const t = celda(i, j);
      if (t) s += `<text x="${x0 + cw * j + cw / 2}" y="${y + 29}" text-anchor="middle" font-size="16" font-weight="800" fill="${RIESGO[i][j] === AMARILLO ? "#1F2A37" : "#fff"}">${t}</text>`;
    });
  });
  return s + "</svg>";
}
const leyenda = `<div style="display:flex;gap:8px;flex-wrap:wrap">${[[VERDE, "Riesgo <b>bajo</b> (sin otro marcador, no es ERC)"], [AMARILLO, "<b>Moderado</b>"], [NARANJA, "<b>Alto</b>"], [ROJO, "<b>Muy alto</b>"]]
  .map(([c, t]) => `<div class="item" style="background:#F7F8FA;font-size:12.5px"><b style="color:${c}">■</b> ${t}</div>`).join("")}</div>`;
