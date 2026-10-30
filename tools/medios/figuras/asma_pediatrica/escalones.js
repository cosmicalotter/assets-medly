// Escalera de tratamiento: cada peldaño un poco más alto que el anterior.
function escalera(peldanos, nota) {
  const n = peldanos.length, W = 650, H = 330, w = W / n;
  const svg = peldanos.map(([k, txt, c], j) => {
    const h = 150 + (j * (H - 160)) / (n - 1), x = j * w, y = H - h;
    return `<g><rect x="${x + 3}" y="${y}" width="${w - 6}" height="${h}" rx="10" fill="${tinte(c, 16)}" stroke="${c}" stroke-width="2.5"/>
      <text x="${x + 14}" y="${y + 26}" font-size="18" font-weight="800" fill="${c}">Escalón ${k}</text>
      <foreignObject x="${x + 10}" y="${y + 34}" width="${w - 20}" height="${h - 40}"><div xmlns="http://www.w3.org/1999/xhtml" style="font-size:13.5px;line-height:1.3;color:#1F2A37">${txt}</div></foreignObject></g>`;
  }).join("");
  return `<svg viewBox="0 0 ${W} ${H + 4}" style="flex:1;min-height:0">${svg}</svg>
    <div style="border-radius:10px;background:${tinte(AZUL, 12)};padding:7px 10px;font-size:13.5px">${nota}</div>`;
}
