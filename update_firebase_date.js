// Publica en Firebase Remote Config lo que manda este repositorio:
//
//   - los menús de la app y los banners, desde indices/<parámetro>.json
//     (index_adultos, index_pediatria, index_calculadoras, json_banners);
//   - la fecha `ultima_actualizacion_app`, que hace que la app vuelva a bajar
//     el contenido.
//
// Lo corre el workflow en cada push a main. Antes de publicar:
//   1. valida cada índice (JSON, forma, que cada archivo exista en el repo);
//   2. arma lo que se publica de los índices de algoritmos (ver `publicable`):
//      sin los algoritmos con `"oculto": true` en su JSON (no existen para la
//      app ni para Nodo) y con `definiciones`, el texto de su portada en una
//      línea, que la biblioteca enseña bajo las guías;
//   3. protege lo que se cambió a mano en la consola: si el valor de Firebase
//      no coincide con el que el repo publicó la vez anterior (PREV_SHA), ese
//      parámetro no se pisa y el workflow falla avisando. Se arregla copiando
//      el valor de Firebase al archivo del repo.
//
//   node update_firebase_date.js --validar     # solo valida, sin Firebase
//   node update_firebase_date.js --mostrar     # además imprime lo que se publicaría
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

// -------------------------------------------------------------------------
// LO QUE SE PUBLICA DE LOS ÍNDICES DE ALGORITMOS
// -------------------------------------------------------------------------
const INDICES_ALGORITMOS = ['index_adultos', 'index_pediatria'];
const MAX_DEFINICIONES = 600;

// El JSON del algoritmo al que apunta una URL raw, leído con [leer]
// (el repo actual o el de PREV_SHA).
function algoritmoDe(url, leer) {
  const m = RAW.exec(url || '');
  if (!m) return null;
  const texto = leer(decodeURIComponent(m[1]));
  const datos = texto === undefined ? undefined : lee(texto);
  return datos && typeof datos === 'object' ? datos : null;
}

function raizDe(algoritmo) {
  const nodos = algoritmo.nodos || {};
  const iniciales = algoritmo.nodos_iniciales || algoritmo.nodosIniciales ||
    [algoritmo.nodo_inicial || algoritmo.nodoInicial].filter(Boolean);
  const id = iniciales.find((i) => nodos[i]) || Object.keys(nodos)[0];
  return id ? nodos[id] : null;
}

// Las definiciones de la portada tal cual, en una línea: sin saltos ni
// viñetas, con sus negritas. Vacío si la portada sólo repite el nombre.
function definiciones(algoritmo, titulo) {
  const texto = String(raizDe(algoritmo)?.texto || '')
    .split('\n')
    .map((l) => l.replace(/^\s*(?:[-•*]|\d{1,2}[.)])\s+/, '').trim())
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
  const plano = (t) => String(t || '').replace(/\*\*/g, '').toLowerCase().trim();
  if (texto.length < 40 || plano(texto) === plano(titulo) || plano(texto) === plano(algoritmo.titulo)) return '';
  return texto.length <= MAX_DEFINICIONES ? texto : `${texto.slice(0, MAX_DEFINICIONES - 1).trim()}…`;
}

// El índice tal como lo ve la app: sin los ocultos y con sus definiciones.
function publicable(parametro, datos, leer) {
  if (!INDICES_ALGORITMOS.includes(parametro) || !Array.isArray(datos)) return datos;
  return datos.map((seccion) => ({
    ...seccion,
    items: (seccion.items || []).flatMap((item) => {
      const algoritmo = algoritmoDe(item.archivo, leer);
      if (algoritmo && algoritmo.oculto === true) return [];
      const { definiciones: _viejas, ...resto } = item;
      const texto = algoritmo ? definiciones(algoritmo, item.titulo) : '';
      return [texto ? { ...resto, definiciones: texto } : resto];
    }),
  }));
}

const leerActual = (ruta) => {
  const p = path.join(__dirname, ruta);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : undefined;
};

function leerEn(sha) {
  return (ruta) => {
    try {
      return execSync(`git show ${sha}:${ruta}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 * 1024 * 1024 });
    } catch {
      return undefined;
    }
  };
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
  for (const ix of indices) {
    ix.publicado = publicable(ix.parametro, ix.datos, leerActual);
    if (!INDICES_ALGORITMOS.includes(ix.parametro)) continue;
    const total = ix.datos.reduce((n, s) => n + (s.items || []).length, 0);
    const visibles = ix.publicado.reduce((n, s) => n + s.items.length, 0);
    console.log(`  ${ix.parametro}: ${visibles} visibles, ${total - visibles} ocultos`);
  }
  if (process.argv.includes('--mostrar')) {
    for (const ix of indices) console.log(`\n# ${ix.parametro}\n${JSON.stringify(ix.publicado, null, 2)}`);
  }
  if (process.argv.includes('--validar') || process.argv.includes('--mostrar')) return;

  const admin = require('firebase-admin');
  admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
  const remoteConfig = admin.remoteConfig();
  const template = await remoteConfig.getTemplate();
  template.parameters = template.parameters || {};

  const bloqueados = [];
  for (const ix of indices) {
    const actual = template.parameters[ix.parametro];
    const remoto = actual && actual.defaultValue ? lee(actual.defaultValue.value) : undefined;
    if (remoto !== undefined && igual(remoto, ix.publicado)) {
      console.log(`= ${ix.parametro}: sin cambios`);
      continue;
    }
    // Lo que se publicó la vez anterior: el índice de entonces, armado con los
    // algoritmos de entonces (o tal cual, como se publicaba antes de armarlo).
    const previo = anterior(ix.ruta);
    const prev = process.env.PREV_SHA;
    const previoPublicado = previo === undefined ? undefined :
      publicable(ix.parametro, previo, leerEn(prev));
    if (remoto !== undefined && previo !== undefined &&
        !igual(remoto, previo) && !igual(remoto, previoPublicado)) {
      bloqueados.push(ix.parametro);
      console.error(`✗ ${ix.parametro}: en Firebase se cambió a mano desde el último push; no se pisa. ` +
        `Copiar el valor de Firebase a ${ix.ruta} y volver a subir el cambio.`);
      continue;
    }
    template.parameters[ix.parametro] = {
      ...(actual || {}),
      defaultValue: { value: JSON.stringify(ix.publicado, null, 2) },
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
