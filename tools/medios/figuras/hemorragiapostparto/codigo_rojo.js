// Línea de tiempo del código rojo obstétrico (NACER-UdeA 2009, adoptado por la GPC MinSalud 2013).
// dibujar(activa, avance): activa = fase encendida (0-3, o -1 = todas); avance 0-1 = cuánto se ve de ella.
const FASES = [
  { c: ROJO, cuando: "Minuto 0", que: "Activar",
    items: ["Lo activa la <b>primera persona</b>, por altavoz", "Avisar al <b>laboratorio</b> y al banco de sangre", "Retener la <b>ambulancia</b>", "Calentar líquidos a <b>39 °C</b>"] },
  { c: NARANJA, cuando: "Minutos 1-20", que: "Reanimar y buscar la causa",
    items: ["<b>Oxígeno</b> y dos vías <b>14-16</b>", "Bolos de <b>500 mL</b> tibios por metas", "<b>Paquete</b> de primera respuesta", "Buscar la causa con las <b>4 T</b>", "Choque grave: <b>O negativo</b> en <b>15 min</b>"] },
  { c: AMBAR, cuando: "Minutos 20-60", que: "Estabilizar",
    items: ["Mantener el <b>volumen</b>; vasopresor si sigue hipotensa", "Sostenimiento a <b>150-300 mL/h</b>", "Atonía: <b>compresión</b> y uterotónicos", "Decidir: <b>seguir o remitir</b>"] },
  { c: MORADO, cuando: "Minuto 60", que: "Manejo avanzado",
    items: ["Probable <b>CID</b>: TP, TPT, fibrinógeno y dímero D", "Corregirla <b>antes de operar</b>", "<b>Decisión crítica</b>: cirugía, hemoderivados y UCI, o trasladar"] },
];

function dibujar(activa, avance = 1, meta = true) {
  const W = 668, COLW = (W - 3 * 10) / 4;
  const cx = (i) => i * (COLW + 10) + COLW / 2;
  const on = (i) => activa < 0 || i <= activa;
  let linea = `<svg width="${W}" height="50" viewBox="0 0 ${W} 50" style="flex:none">`;
  linea += `<line x1="${cx(0)}" y1="25" x2="${cx(3)}" y2="25" stroke="#E5E7EB" stroke-width="6" stroke-linecap="round"/>`;
  const hasta = activa < 0 ? 3 : activa;
  if (hasta > 0) linea += `<line x1="${cx(0)}" y1="25" x2="${cx(hasta - 1) + (cx(hasta) - cx(hasta - 1)) * avance}" y2="25" stroke="${ROJO}" stroke-width="6" stroke-linecap="round"/>`;
  FASES.forEach((f, i) => {
    const lit = on(i), act = i === activa;
    linea += `<circle cx="${cx(i)}" cy="25" r="${act ? 21 : 18}" fill="${lit ? f.c : "#fff"}" stroke="${lit ? f.c : "#CBD5E1"}" stroke-width="3"/>`;
    linea += `<text x="${cx(i)}" y="31" text-anchor="middle" font-size="16" font-weight="800" fill="${lit ? "#fff" : "#94A3B8"}">${i + 1}</text>`;
  });
  linea += `</svg>`;
  const cols = `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px">${FASES.map((f, i) => {
    const lit = on(i), act = i === activa;
    const op = lit ? 1 : 0.32;
    const n = act ? Math.ceil(f.items.length * avance) : (lit ? f.items.length : f.items.length);
    return `<div style="display:flex;flex-direction:column;gap:6px;opacity:${op}">
      <div style="align-self:center;background:${tinte(f.c, act ? 22 : 12)};color:${f.c};font-weight:800;font-size:13px;padding:4px 10px;border-radius:999px;white-space:nowrap">${f.cuando}</div>
      <div class="caja" style="background:${act ? tinte(f.c, 7) : "#fff"};border:${act ? 3 : 2}px solid ${tinte(f.c, act ? 85 : 50)};min-height:232px;display:flex;flex-direction:column;gap:6px">
        <div style="font-weight:800;font-size:14.5px;color:${TINTA}">${f.que}</div>
        ${f.items.map((t, k) => `<div style="font-size:12px;line-height:1.3;color:#334155;opacity:${act && k >= n ? 0 : 1}"><span style="color:${f.c};font-weight:800">●</span> <span>${t}</span></div>`).join("")}
      </div>
    </div>`;
  }).join("")}</div>`;
  const pie = meta ? `<div style="display:flex;gap:10px">
    <div class="caja" style="flex:1;background:${tinte(ROJO, 8)};border:1.5px solid ${tinte(ROJO, 40)};font-size:13px"><b style="color:${ROJO}">Meta</b>: detener la fuente del sangrado en los primeros <b>20 min</b>.</div>
    <div class="caja" style="flex:1;background:#F8FAFC;border:1.5px solid var(--linea);font-size:13px"><b>Equipo de 4</b>: coordinador, dos asistentes y un circulante, con funciones fijas.</div>
  </div>` : "";
  lienzo("Tiempos del código rojo", "Hemorragia posparto con choque o pérdida de 1.000 mL o más", linea + cols + pie,
    "Esquema. Fuente: Código Rojo, NACER-Universidad de Antioquia (Rev Colomb Obstet Ginecol 2009); GPC MinSalud 2013, preguntas 7-10.");
}
