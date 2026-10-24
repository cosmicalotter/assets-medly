#!/usr/bin/env node
// Convierte una página HTML en la imagen de un nodo: un PNG o los cuadros de
// un GIF. Las ilustraciones propias se dibujan en HTML/SVG porque la app no
// lee SVG (CachedNetworkImage: PNG, JPG, WebP y GIF), y así quedan con la
// tipografía y los colores de Praxis sin depender de la licencia de nadie.
//
//   node tools/medios/capturar.js figura.html salida.png
//   node tools/medios/capturar.js animacion.html cuadros/ --cuadros 24
//
// Para animar, la página define `window.cuadro(i, total)` y dibuja en él el
// estado del cuadro i; aquí se llama para cada i y se fotografía `#lienzo`
// (o la página entera si no existe). Los cuadros se montan después con
// tools/medios/armar_gif.py.

const path = require("path");
const fs = require("fs");
const { chromium } = require("playwright");

function opciones(argv) {
  const [entrada, salida, ...resto] = argv;
  if (!entrada || !salida) {
    console.error("uso: capturar.js PAGINA.html (SALIDA.png | CARPETA/) [--cuadros N] [--ancho 720] [--alto 540] [--escala 2]");
    process.exit(2);
  }
  const op = { entrada, salida, cuadros: 1, ancho: 720, alto: 540, escala: 2 };
  for (let i = 0; i < resto.length; i += 2) {
    const llave = resto[i].replace(/^--/, "");
    if (!(llave in op)) {
      console.error(`opción desconocida: ${resto[i]}`);
      process.exit(2);
    }
    op[llave] = Number(resto[i + 1]);
  }
  return op;
}

(async () => {
  const op = opciones(process.argv.slice(2));
  const navegador = await chromium.launch();
  const pagina = await navegador.newPage({
    viewport: { width: op.ancho, height: op.alto },
    deviceScaleFactor: op.escala,
  });
  await pagina.goto("file://" + path.resolve(op.entrada));
  await pagina.evaluate(() => document.fonts && document.fonts.ready);
  // Se busca `#lienzo` en cada foto: una página puede redibujarlo entero en
  // cada cuadro, y una referencia vieja apuntaría a un nodo que ya no está.
  const lienzo = async () => (await pagina.$("#lienzo")) || pagina;
  const anima = await pagina.evaluate(() => typeof window.cuadro === "function");

  if (op.cuadros <= 1) {
    if (anima) await pagina.evaluate(() => window.cuadro(0, 1));
    await (await lienzo()).screenshot({ path: op.salida });
    console.log(`imagen: ${op.salida}`);
  } else {
    if (!anima) {
      console.error("la página no define window.cuadro(i, total): no hay nada que animar");
      process.exit(1);
    }
    fs.mkdirSync(op.salida, { recursive: true });
    for (let i = 0; i < op.cuadros; i++) {
      await pagina.evaluate(([n, total]) => window.cuadro(n, total), [i, op.cuadros]);
      await (await lienzo()).screenshot({ path: path.join(op.salida, `cuadro_${String(i).padStart(3, "0")}.png`) });
    }
    console.log(`${op.cuadros} cuadros en ${op.salida}`);
  }
  await navegador.close();
})();
