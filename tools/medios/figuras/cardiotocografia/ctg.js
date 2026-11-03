// Trazados de cardiotocografía dibujados en SVG: papel, FCF y contracciones.
// Todo es determinista (ruido con semilla) para que la figura no cambie al regenerarla.

function azar(semilla) {               // generador congruencial: siempre la misma secuencia
  let s = semilla >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

// Oscilaciones de la línea de base con amplitud pico-valle ≈ `amp` lpm y 3-6 ciclos/min.
function oscilacion(amp, semilla = 7) {
  const r = azar(semilla), ondas = [];
  for (let k = 0; k < 7; k++) ondas.push({ f: 2.5 + r() * 4, fase: r() * 6.283, a: 0.5 + r() });
  const suma = ondas.reduce((s, o) => s + o.a, 0);
  const ruido = []; for (let k = 0; k < 4000; k++) ruido.push(r() - 0.5);
  return (t) => {
    let v = 0; for (const o of ondas) v += o.a * Math.sin(6.283 * o.f * t + o.fase);
    const j = ruido[Math.floor(t * 100) % ruido.length] * 0.35;
    return (amp / 2) * (v / suma * 1.9 + j);
  };
}

// Campana de una contracción (pico en `t0`, duración total `dur` en minutos).
const campana = (t, t0, dur, alto = 1) => {
  const u = (t - t0) / (dur / 2);
  return Math.abs(u) >= 1 ? 0 : alto * Math.pow(Math.cos(u * Math.PI / 2), 2);
};
// Caída suave (desaceleración gradual) y caída abrupta (variable).
const valle = (t, t0, ancho) => { const u = (t - t0) / ancho; return Math.exp(-u * u * 2.2); };
function caidaV(t, ini, bajada, meseta, subida) { // tiempos en minutos desde ini
  const x = t - ini;
  if (x < 0) return 0;
  if (x < bajada) return x / bajada;
  if (x < bajada + meseta) return 1;
  if (x < bajada + meseta + subida) return 1 - (x - bajada - meseta) / subida;
  return 0;
}

// Una tira de papel. Devuelve el SVG y las funciones de escala.
// op: {x, y, w, h, t0, t1, lmin, lmax, paso (lpm entre líneas finas), ejes, toco}
function papel(op) {
  const { x, y, w, h, t0 = 0, t1 = 10, lmin = 60, lmax = 200, paso = 10, etiquetas = true, banda = true, fino = 0.5 } = op;
  const X = (t) => x + (t - t0) / (t1 - t0) * w;
  const Y = (l) => y + h - (l - lmin) / (lmax - lmin) * h;
  let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#FFFDFB" stroke="#E7D3CF"/>`;
  if (banda) s += `<rect x="${x}" y="${Y(160)}" width="${w}" height="${Y(110) - Y(160)}" fill="${tinte(TEAL, 7)}"/>`;
  for (let l = Math.ceil(lmin / paso) * paso; l <= lmax; l += paso) {
    const mayor = l % 30 === 0;
    s += `<line x1="${x}" y1="${Y(l)}" x2="${x + w}" y2="${Y(l)}" stroke="${mayor ? "#EBC8C2" : "#F6E6E2"}" stroke-width="${mayor ? 1 : fino}"/>`;
    if (etiquetas && mayor) s += `<text x="${x - 5}" y="${Y(l) + 4}" font-size="10.5" text-anchor="end" fill="#94A3B8">${l}</text>`;
  }
  for (let t = Math.ceil(t0); t <= t1 + 1e-9; t += 1) s += `<line x1="${X(t)}" y1="${y}" x2="${X(t)}" y2="${y + h}" stroke="#EBC8C2"/>`;
  return { svg: s, X, Y };
}

// Trazo de una función f(t) entre t0 y t1.
function trazo(f, X, Y, t0, t1, { color = TINTA, ancho = 1.6, dt = 0.01, op = 1 } = {}) {
  let d = "";
  for (let t = t0; t <= t1 + 1e-9; t += dt) d += `${d ? "L" : "M"}${X(t).toFixed(1)},${Y(f(t)).toFixed(1)}`;
  return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${ancho}" stroke-linejoin="round" stroke-linecap="round" opacity="${op}"/>`;
}

// Canal de contracciones: f(t) en 0-1.
function toco(f, op) {
  const { x, y, w, h, t0 = 0, t1 = 10 } = op;
  const X = (t) => x + (t - t0) / (t1 - t0) * w;
  const Y = (v) => y + h - 4 - v * (h - 10);
  let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#FCFBFF" stroke="#E2DDF7"/>`;
  for (let t = Math.ceil(t0); t <= t1 + 1e-9; t += 1) s += `<line x1="${X(t)}" y1="${y}" x2="${X(t)}" y2="${y + h}" stroke="#EEEAFB"/>`;
  s += trazo((t) => f(t) * 1 + 0.02, X, (v) => Y(v), t0, t1, { color: VIOLETA, ancho: 2.2 });
  return { svg: s, X, Y };
}

const flecha = (x1, y1, x2, y2, c, w = 2) => {
  const a = Math.atan2(y2 - y1, x2 - x1), L = 7;
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="${w}"/>
    <path d="M${x2},${y2} L${x2 - L * Math.cos(a - 0.45)},${y2 - L * Math.sin(a - 0.45)} L${x2 - L * Math.cos(a + 0.45)},${y2 - L * Math.sin(a + 0.45)} Z" fill="${c}"/>`;
};
const texto = (x, y, t, { c = TINTA, s = 12.5, w = 700, a = "start", fondo = false } = {}) =>
  (fondo ? `<text x="${x}" y="${y}" font-size="${s}" font-weight="${w}" text-anchor="${a}" stroke="#fff" stroke-width="4" stroke-linejoin="round" fill="#fff">${t}</text>` : "") +
  `<text x="${x}" y="${y}" font-size="${s}" font-weight="${w}" text-anchor="${a}" fill="${c}">${t}</text>`;

// Recorta lo que se dibuje dentro al rectángulo del papel.
let _clip = 0;
function dentro(x, y, w, h, contenido) {
  const id = `clip${++_clip}`;
  return `<clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath><g clip-path="url(#${id})">${contenido}</g>`;
}
