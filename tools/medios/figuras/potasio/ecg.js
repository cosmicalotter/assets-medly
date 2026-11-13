// El ECG del potasio (curva animada, esquema plano): cómo cambia el trazo al subir o bajar el potasio.
// window.MODO = "hiper" | "hipo". Fuente: Zieg J et al. BMC Nephrol 2024 (citado, sin reproducir figuras).
const ESC = {
  hiper: {
    titulo: "Hiperpotasemia: cómo cambia el ECG",
    sub: "A medida que el potasio sube, el trazo cambia en este orden",
    color: ROJO, flecha: "↑",
    // a: amplitudes y anchos de cada onda; cada etapa se interpola con la siguiente
    etapas: [
      { p: [0.15, 0.045], pr: 0.16, qrs: [1, 0.03], st: 0, t: [0.3, 0.07], u: 0, qt: 0.36 },
      { p: [0.15, 0.045], pr: 0.16, qrs: [1, 0.03], st: 0, t: [0.85, 0.045], u: 0, qt: 0.34 },
      { p: [0.05, 0.08], pr: 0.22, qrs: [0.9, 0.04], st: 0, t: [0.8, 0.05], u: 0, qt: 0.36 },
      { p: [0.0, 0.08], pr: 0.24, qrs: [0.75, 0.09], st: 0, t: [0.7, 0.09], u: 0, qt: 0.42 },
      { onda: true },
    ],
    pasos: [
      ["ECG normal", "Onda P, QRS angosto y onda T <b>redondeada</b>.", TEAL, null],
      ["T picuda", "El primer signo: onda T <b>alta y puntiaguda</b>.", AMBAR, "T"],
      ["P aplanada y ancha", "La onda P se <b>aplana</b> y se ensancha.", CELESTE, "P"],
      ["QRS ancho", "El QRS se <b>alarga</b> con el potasio más alto.", ROSA_, "QRS"],
      ["Bloqueo, asistolia o FV", "En la grave: bloqueo, <b>asistolia</b> o taquicardia y fibrilación ventricular.", ROJO, null],
    ],
  },
  hipo: {
    titulo: "Hipopotasemia: cómo cambia el ECG",
    sub: "A medida que el potasio baja, el trazo cambia en este orden",
    color: MORADO, flecha: "↓",
    etapas: [
      { p: [0.15, 0.045], pr: 0.16, qrs: [1, 0.03], st: 0, t: [0.3, 0.07], u: 0, qt: 0.36 },
      { p: [0.15, 0.045], pr: 0.2, qrs: [1, 0.03], st: -0.1, t: [0.18, 0.07], u: 0.05, qt: 0.4 },
      { p: [0.15, 0.045], pr: 0.2, qrs: [1, 0.03], st: -0.14, t: [0.08, 0.07], u: 0.22, qt: 0.42 },
      { p: [0.15, 0.045], pr: 0.2, qrs: [1, 0.03], st: -0.14, t: [-0.16, 0.07], u: 0.24, qt: 0.42 },
    ],
    pasos: [
      ["ECG normal", "Onda T <b>redondeada</b> y sin onda U.", TEAL, null],
      ["ST descendido; PR y QT largos", "El ST <b>desciende</b> y se alargan el PR y el QT.", AMBAR, "ST"],
      ["Onda U prominente", "En la grave aparece la <b>onda U</b>: positiva, después de la T.", CELESTE, "U"],
      ["T invertida", "También típica de la grave: la onda T se <b>invierte</b>.", ROSA_, "T"],
    ],
  },
}[window.MODO];
var ROSA_ = "#E11D74";

const W = 668, H = 250, Y0 = 150, AMP = 95, PX = 120;   // PX: píxeles por segundo
const g = (x, c, w) => Math.exp(-(((x - c) / w) ** 2));
function latido(x, e) {     // x en segundos desde el inicio del latido (dura 0,8 s)
  const tq = 0.1 + e.pr;    // inicio del QRS
  let y = e.p[0] * g(x, 0.1, e.p[1]);
  const q = e.qrs[1];
  y += -0.12 * g(x, tq, q * 0.6) + e.qrs[0] * g(x, tq + q, q * 0.75) - 0.22 * g(x, tq + 2.1 * q, q * 0.7);
  const fin = tq + 3 * q;
  if (x > fin && x < tq + e.qt - 0.09) y += e.st * Math.min(1, (x - fin) / 0.03);
  y += e.t[0] * g(x, tq + e.qt - 0.08, e.t[1]);
  y += e.u * g(x, tq + e.qt + 0.08, 0.045);
  return y;
}
function mezclar(a, b, k) {
  const m = (u, v) => Array.isArray(u) ? u.map((x, i) => lerp(x, v[i], k)) : lerp(u, v, k);
  const o = {};
  for (const c of Object.keys(a)) o[c] = m(a[c], b[c]);
  return o;
}
function trazo(e, desplaz, onda) {
  let d = "";
  for (let px = 0; px <= W; px += 2) {
    const t = (px / PX + desplaz);
    let y;
    if (onda) y = 0.55 * Math.sin(t * 2 * Math.PI * 2.6) + 0.18 * Math.sin(t * 2 * Math.PI * 4.1 + 1);
    else y = latido(t % 0.8, e);
    d += `${px === 0 ? "M" : "L"}${px} ${Y0 - y * AMP}`;
  }
  return d;
}

window.cuadro = function (i, n) {
  const u = n > 1 ? i / (n - 1) : 1;
  const E = ESC.etapas, nE = E.length;
  const pos = u * (nE - 1) * 1.0001;
  const k0 = Math.min(nE - 1, Math.floor(pos)), k = suave(tramo(pos - k0, 0.15, 0.75));
  const a = E[k0], b = E[Math.min(nE - 1, k0 + 1)];
  const onda = (a.onda) || (b.onda && k > 0.5);
  const e = a.onda ? E[nE - 2] : (b.onda ? a : mezclar(a, b, k));
  const paso = Math.min(ESC.pasos.length - 1, k0 + (k > 0.5 ? 1 : 0));
  // rejilla de papel de ECG
  let rej = "";
  for (let x = 0; x <= W; x += 10) rej += `<line x1="${x}" x2="${x}" y1="0" y2="${H}" stroke="${x % 50 ? "#FBD5D5" : "#F5A9A9"}" stroke-width="${x % 50 ? 0.6 : 1.1}"/>`;
  for (let y = 0; y <= H; y += 10) rej += `<line x1="0" x2="${W}" y1="${y}" y2="${y}" stroke="${y % 50 ? "#FBD5D5" : "#F5A9A9"}" stroke-width="${y % 50 ? 0.6 : 1.1}"/>`;
  // flecha que señala la onda que cambia, en el segundo latido
  const [, , cpaso, onda_] = ESC.pasos[paso];
  let marca = "";
  if (onda_ && !onda) {
    const tq = 0.1 + e.pr, x0 = 0.8 * 2;
    const tx = { P: 0.1, QRS: tq + e.qrs[1], T: tq + e.qt - 0.08, U: tq + e.qt + 0.08, ST: tq + 3 * e.qrs[1] + 0.05 }[onda_];
    const X = (x0 + tx) * PX, Yv = Y0 - latido(tx, e) * AMP;
    const arriba = onda_ === "QRS" || onda_ === "P" || (onda_ === "T" && e.t[0] > 0) || onda_ === "U";
    const yl = arriba ? Math.max(18, Yv - 58) : Math.min(H - 14, Yv + 58);
    marca = `<line x1="${X}" y1="${yl + (arriba ? 14 : -14)}" x2="${X}" y2="${Yv + (arriba ? -10 : 10)}" stroke="${cpaso}" stroke-width="4" stroke-linecap="round"/>
      <rect x="${X - 26}" y="${yl - 13}" width="52" height="24" rx="7" fill="${cpaso}"/><text x="${X}" y="${yl + 4}" font-size="13" font-weight="800" fill="#fff" text-anchor="middle">${onda_}</text>`;
  }
  const lista = ESC.pasos.map(([t, d, c], j) => `<div class="item" style="flex:1;opacity:${j <= paso ? 1 : 0.22};background:${j === paso ? tinte(c, 16) : "#F7F8FA"};border:1.5px solid ${j === paso ? c : "transparent"};font-size:12.4px">
      <b style="color:${c}">${t}</b><br>${d}</div>`).join("");
  const nivel = (paso + 1) / ESC.pasos.length;
  lienzo(ESC.titulo, ESC.sub,
    `<div style="display:flex;gap:10px;align-items:stretch">
       <svg width="${W - 58}" height="${H}" viewBox="0 0 ${W - 58} ${H}" style="display:block;border-radius:12px;background:#FFF5F5">${rej}
         <path d="${trazo(e, 0, onda)}" fill="none" stroke="#1F2937" stroke-width="2.6" stroke-linejoin="round"/>${marca}</svg>
       <div style="width:48px;display:flex;flex-direction:column;align-items:center;gap:6px">
         <div style="font-size:11px;font-weight:800;color:${ESC.color}">K ${ESC.flecha}</div>
         <div style="flex:1;width:18px;border-radius:9px;background:#EEF0F3;position:relative;overflow:hidden">
           <div style="position:absolute;left:0;right:0;${window.MODO === "hiper" ? "bottom" : "top"}:0;height:${Math.round(nivel * 100)}%;background:${ESC.color}"></div></div></div>
     </div>
     <div style="display:flex;gap:7px;flex:1">${lista}</div>`,
    "Datos: Zieg J et al. BMC Nephrol 2024. Trazos esquemáticos, no a escala. Elaboración de Empirica.");
};
window.cuadro(1, 1);
