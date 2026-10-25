// ¿Algo del cuerpo de una figura pisa la línea de fuente o se sale del lienzo?
// Prueba tres momentos de cada animación (principio, mitad y final).
//   node tools/medios/solapes.js tools/medios/figuras/<carpeta>/*.html
// Sale con 1 si alguna falla. Lo de dentro de un .visor (la foto con zoom) no cuenta.
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 720, height: 540 } });
  let malas = 0;
  for (const f of process.argv.slice(2)) {
    await p.goto('file://' + path.resolve(f));
    const r = await p.evaluate(async () => {
      const prueba = [0, 0.5, 0.99];
      const malos = [];
      for (const t of prueba) {
        if (typeof window.cuadro === 'function') window.cuadro(Math.round(t * 99), 100);
        await new Promise((ok) => setTimeout(ok, 50));
        const lienzo = document.querySelector('#lienzo'); if (!lienzo) return ['sin #lienzo'];
        const L = lienzo.getBoundingClientRect();
        const fu = document.querySelector('.fuente');
        const F = fu ? fu.getBoundingClientRect() : null;
        for (const e of document.querySelectorAll('.cuerpo *')) {
          const R = e.getBoundingClientRect(); if (!R.width || !R.height) continue;
          if (e.closest('svg') && e.tagName !== 'svg') continue;
          if (e.parentElement && e.parentElement.closest('.visor')) continue;
          if (F && R.bottom > F.top + 1 && R.top < F.bottom) malos.push(`t=${t} ${e.tagName}.${e.className && e.className.baseVal !== undefined ? e.className.baseVal : e.className} baja hasta ${R.bottom.toFixed(0)} > fuente ${F.top.toFixed(0)}`);
          if (R.bottom > L.bottom - 21 + 0.5 && !F) malos.push(`t=${t} ${e.tagName} se sale (${R.bottom.toFixed(0)})`);
        }
        if (F && F.bottom > L.bottom - 21) malos.push(`t=${t} la fuente se sale del lienzo (${F.bottom.toFixed(0)})`);
      }
      return [...new Set(malos)].slice(0, 4);
    });
    console.log(path.basename(f), r.length ? 'MAL\n   ' + r.join('\n   ') : 'ok');
    malas += r.length > 0;
  }
  await b.close();
  process.exit(malas ? 1 : 0);
})();
