// Figura 1 de WSES 2020 (Pisano et al., World J Emerg Surg 2020;15:61, CC BY 4.0)
// traducida al español encima de la figura original: cada texto en inglés se
// tapa con el color de su caja y se escribe la traducción. Coordenadas en
// píxeles de fuentes/wses2020_fig1.png (1280 × 1101).
const WSES_IMG = "fuentes/wses2020_fig1.png";
const WSES_ANCHO = 1280, WSES_ALTO = 1101;
const AMARILLO = "#FFCC00", CIAN = "#99FFFF", BLANCO = "#FFFFFF", GRIS = "#C0C0C0";

// [x0, y0, x1, y1, texto, fondo, tamaño, forma, alineación]
const WSES_TEXTOS = [
  // Cajas.
  [86, 87, 203, 120, "Colecistitis aguda", AMARILLO, 12.5],
  [244, 197, 438, 251, "Pacientes sin alto riesgo<br>Pacientes de alto riesgo", AMARILLO, 12.5],
  [939, 197, 1056, 251, "Estudio<br>intraoperatorio", AMARILLO, 12.5],
  [48, 328, 242, 382, "No apto para cirugía<br>o la rechaza", AMARILLO, 12.5],
  [48, 419, 242, 473, "Antibiótico y observación", AMARILLO, 12.5],
  [598, 441, 1034, 490, "<b>en ≤72 h o, como mínimo,<br>≤7 días del ingreso y ≤10 días del inicio de los síntomas</b>", CIAN, 12.5, "plano"],
  [1089, 439, 1142, 492, "<b>CL<br>temprana</b>", CIAN, 9.5],
  [914, 534, 1019, 592, "<b>Alta</b>", AMARILLO, 13.5],
  [1089, 534, 1141, 592, "CL<br>diferida", AMARILLO, 10],
  [395, 624, 671, 695, "DRENAJE VESICULAR:<br>según la experiencia, de percutáneo<br>(PTGBD) a endoscópico (EGBD)", AMARILLO, 11.5],
  [912, 634, 1189, 700, "Alta.<br>Valorar cirugía diferida según el estado<br>clínico y el motivo para no operar", AMARILLO, 12],
  [912, 724, 1189, 790, "Valorar cirugía de rescate", AMARILLO, 12.5],
  [6, 808, 283, 870, "Alta.<br>Valorar cirugía diferida según el estado<br>clínico y el motivo para no operar", AMARILLO, 12],
  // Rombos.
  [75, 154, 215, 294, "Riesgo<br>estimado y<br>acepta la CL<br>temprana", AMARILLO, 11.5, "rombo"],
  [504, 173, 606, 275, "Riesgo de<br>coledoco-<br>litiasis", AMARILLO, 11, "rombo"],
  [710, 165, 846, 283, "¿Estudio<br>preopera-<br>torio?", AMARILLO, 11.5, "rombo"],
  [77, 592, 213, 728, "¿Éxito?", AMARILLO, 13, "rombo"],
  [724, 595, 860, 731, "¿Éxito?", AMARILLO, 13, "rombo"],
  // Rótulos de las flechas.
  [608, 230, 676, 264, "Moderado<br>y alto", BLANCO, 11.5],
  [512, 288, 546, 306, "Bajo", BLANCO, 12],
  [560, 323, 760, 375, "M: USE o colangio-RM<br>(si +: CPRE preoperatoria)<br>A: CPRE preoperatoria", BLANCO, 11.5, "", "left"],
  [798, 336, 830, 354, "Sí", BLANCO, 12.5],
  [1000, 323, 1278, 375, "M: COI o ecografía laparoscópica<br>(si +: explorar colédoco o CPRE posop.)<br>A: explorar colédoco o CPRE posop.", BLANCO, 11, "", "left"],
  [1042, 441, 1072, 460, "Sí", BLANCO, 12.5],
  [861, 641, 892, 659, "Sí", BLANCO, 12.5],
  [146, 748, 177, 766, "Sí", BLANCO, 12.5],
  // Leyenda y definiciones.
  [540, 838, 650, 860, "Siglas", GRIS, 12.5],
  [940, 838, 1060, 860, "Definiciones", GRIS, 12.5],
  [413, 864, 776, 1088, "<b>CL</b>: colecistectomía laparoscópica<br><b>CPRE</b>: colangiopancreatografía retrógrada endoscópica<br><b>USE</b>: ultrasonido endoscópico<br><b>COI</b>: colangiografía intraoperatoria<br><b>PTGBD</b>: drenaje vesicular percutáneo transhepático<br><b>EGBD</b>: drenaje vesicular endoscópico<br><b>M</b>: riesgo moderado de coledocolitiasis<br><b>A</b>: riesgo alto de coledocolitiasis", BLANCO, 11.5, "arriba", "left"],
  [808, 864, 1188, 1080, "<b>Alto riesgo</b>: APACHE mayor de 7; alto riesgo de morbimortalidad según la escala clínica y el acuerdo clínico locales.<br><br><b>No apto para cirugía</b>: distinto del paciente de alto riesgo habitual; a juicio del cirujano, no apto para operar por condiciones clínicas que ninguna escala clasifica.", BLANCO, 11.5, "arriba", "left"],
];

// Devuelve el HTML de la figura traducida (posiciones absolutas, 1280 × 1101).
// Cajas y rombos se redibujan enteros (relleno y borde) para que no asome
// ninguna letra del original; los rótulos sueltos solo se tapan con blanco.
function wsesTraducida() {
  const capas = WSES_TEXTOS.map(([x0, y0, x1, y1, txt, fondo, tam, forma = "", alin = "center"]) => {
    const w = x1 - x0, h = y1 - y0, caja = (fondo === AMARILLO || fondo === CIAN) && forma !== "plano";
    const letra = `font:500 ${tam}px/1.22 Inter,'Segoe UI',Roboto,Arial,sans-serif;color:#111;text-align:${alin}`;
    const texto = (pad) => `<div style="position:absolute;left:${x0}px;top:${y0}px;width:${w}px;height:${h}px;display:flex;align-items:${forma === "arriba" ? "flex-start" : "center"};` +
      `justify-content:${alin === "left" ? "flex-start" : "center"};padding:${pad};${letra}"><div>${txt}</div></div>`;
    if (forma === "rombo")
      return `<svg style="position:absolute;left:${x0}px;top:${y0}px;overflow:visible" width="${w}" height="${h}">` +
        `<polygon points="${w / 2},0 ${w},${h / 2} ${w / 2},${h} 0,${h / 2}" fill="${fondo}" stroke="#1a1a1a" stroke-width="1.2"/></svg>` + texto("0");
    const fondoDiv = `<div style="position:absolute;left:${x0}px;top:${y0}px;width:${w}px;height:${h}px;background:${fondo};` +
      (caja ? "border:1px solid #1a1a1a;border-radius:3px;" : "") + `"></div>`;
    return fondoDiv + texto(forma === "arriba" ? "14px 6px 0" : alin === "left" ? "0 0 0 4px" : "0 3px");
  }).join("");
  return `<div class="wses" style="position:relative;width:${WSES_ANCHO}px;height:${WSES_ALTO}px;background:#fff">
    <img src="${WSES_IMG}" style="position:absolute;left:0;top:0;width:${WSES_ANCHO}px;height:${WSES_ALTO}px">${capas}</div>`;
}
