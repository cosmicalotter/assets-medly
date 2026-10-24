// Publica en Firebase Remote Config lo que manda este repositorio:
//
//   - los menús de la app y los banners, desde indices/<parámetro>.json
//     (index_adultos, index_pediatria, index_calculadoras, json_banners);
//   - la fecha `ultima_actualizacion_app`, que hace que la app vuelva a bajar
//     el contenido.
//
// Lo corre el workflow en cada push a main. Antes de publicar:
//   1. valida cada índice (JSON, forma, que cada archivo exista en el repo);
//   2. protege lo que se cambió a mano en la consola: si el valor de Firebase
//      no coincide con el que el repo publicó la vez anterior (PREV_SHA), ese
//      parámetro no se pisa y el workflow falla avisando. Se arregla copiando
//      el valor de Firebase al archivo del repo.
//
//   node update_firebase_date.js --validar     # solo valida, sin Firebase
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CARPETA = 'indices';
const RAW = /^https:\/\/raw\.githubusercontent\.com\/cosmicalotter\/assets-medly\/(?:refs\/heads\/)?main\/(.+)$/;
const SELLO = 'ultima_actualizacion_app';

function archivos() {
  return fs.readdirSync(path.join(__dirname, CARPETA))
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => ({ parametro: f.replace(/\.json$/, ''), ruta: path.join(CARPETA, f) }));
}

// El archivo del repo al que apunta una URL raw de este repositorio.
function existe(url) {
  const m = RAW.exec(url || '');
  return Boolean(m) && fs.existsSync(path.join(__dirname, decodeURIComponent(m[1])));
}

function valida(parametro, datos) {
  const errores = [];
  if (!Array.isArray(datos)) return [`${parametro}: debe ser una lista`];
  if (parametro === 'index_calculadoras') {
    const ids = new Set();
    datos.forEach((c, i) => {
      if (!c.id || !c.titulo || !c.archivo) errores.push(`${parametro}[${i}]: falta id, titulo o archivo`);
      if (ids.has(c.id)) errores.push(`${parametro}: id repetido «${c.id}»`);
      ids.add(c.id);
      if (!existe(c.archivo)) errores.push(`${parametro}: «${c.titulo}» apunta a un archivo que no está en main: ${c.archivo}`);
    });
  } else if (parametro.startsWith('index_')) {
    datos.forEach((s, i) => {
      if (!s.nombre || !Array.isArray(s.items)) return errores.push(`${parametro}[${i}]: cada sección lleva nombre e items`);
      s.items.forEach((a) => {
        if (!a.titulo || !a.archivo) errores.push(`${parametro} / ${s.nombre}: entrada sin titulo o archivo`);
        else if (!existe(a.archivo)) errores.push(`${parametro} / ${s.nombre}: «${a.titulo}» apunta a un archivo que no está en main: ${a.archivo}`);
      });
    });
  } else if (parametro === 'json_banners') {
    datos.forEach((b, i) => {
      if (!b.imageUrl) errores.push(`${parametro}[${i}]: falta imageUrl`);
      else if (RAW.test(b.imageUrl) && !existe(b.imageUrl)) errores.push(`${parametro}[${i}]: la imagen no está en main: ${b.imageUrl}`);
    });
  }
  return errores;
}

// Igualdad de JSON sin importar el orden de las llaves ni el formato.
function canonico(v) {
  if (Array.isArray(v)) return v.map(canonico);
  if (v && typeof v === 'object') return Object.keys(v).sort().reduce((o, k) => ((o[k] = canonico(v[k])), o), {});
  return v;
}
const igual = (a, b) => JSON.stringify(canonico(a)) === JSON.stringify(canonico(b));

function lee(texto) {
  try { return JSON.parse(texto); } catch { return undefined; }
}

// Lo que el repo tenía en el push anterior (undefined si el archivo no existía).
function anterior(ruta) {
  const prev = process.env.PREV_SHA;
  if (!prev || /^0+$/.test(prev)) return undefined;
  try {
    return lee(execSync(`git show ${prev}:${ruta}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }));
  } catch {
    return undefined;
  }
}

async function main() {
  const indices = archivos().map((a) => {
    const texto = fs.readFileSync(path.join(__dirname, a.ruta), 'utf8');
    return { ...a, texto, datos: lee(texto) };
  });
  const errores = [];
  for (const ix of indices) {
    if (ix.datos === undefined) errores.push(`${ix.ruta}: no es JSON válido`);
    else errores.push(...valida(ix.parametro, ix.datos));
  }
  if (errores.length) {
    console.error('Índices con errores; no se publica nada:\n  ' + errores.join('\n  '));
    process.exit(1);
  }
  console.log(`Índices válidos: ${indices.map((i) => i.parametro).join(', ')}`);
  if (process.argv.includes('--validar')) return;

  const admin = require('firebase-admin');
  admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
  const remoteConfig = admin.remoteConfig();
  const template = await remoteConfig.getTemplate();
  template.parameters = template.parameters || {};

  const bloqueados = [];
  for (const ix of indices) {
    const actual = template.parameters[ix.parametro];
    const remoto = actual && actual.defaultValue ? lee(actual.defaultValue.value) : undefined;
    if (remoto !== undefined && igual(remoto, ix.datos)) {
      console.log(`= ${ix.parametro}: sin cambios`);
      continue;
    }
    const previo = anterior(ix.ruta);
    if (remoto !== undefined && previo !== undefined && !igual(remoto, previo)) {
      bloqueados.push(ix.parametro);
      console.error(`✗ ${ix.parametro}: en Firebase se cambió a mano desde el último push; no se pisa. ` +
        `Copiar el valor de Firebase a ${ix.ruta} y volver a subir el cambio.`);
      continue;
    }
    template.parameters[ix.parametro] = {
      ...(actual || {}),
      defaultValue: { value: JSON.stringify(ix.datos, null, 2) },
      valueType: (actual && actual.valueType) || 'JSON',
    };
    console.log(`→ ${ix.parametro}: se publica`);
  }

  const now = new Date().toISOString();
  template.parameters[SELLO] = { defaultValue: { value: now }, valueType: 'STRING' };
  await remoteConfig.publishTemplate(template);
  console.log(`¡Éxito! Remote Config publicado; ${SELLO} = ${now}`);
  if (bloqueados.length) process.exit(1);
}

main().catch((error) => {
  console.error('Error actualizando Firebase:', error);
  process.exit(1);
});
