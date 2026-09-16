// ---------------------------------------------------------------
// Publica docs/domain/ como HTML estatico en site/docs/.
//
// Los documentos de dominio son el "por que" de las reglas que estan
// en el codigo: que hace cada tipo de proceso, que dice cada articulo
// y donde la ley obliga a elegir un criterio. Vivian solo en el repo,
// asi que no existian para nadie que no clonara.
//
//   node scripts/build-docs.mjs <directorio-de-salida>
//
// Se usa la misma paleta y los mismos roles tipograficos que la
// landing y que Honorio: la documentacion tiene que verse parte de lo
// mismo, no un anexo.
// ---------------------------------------------------------------

import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname, basename, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { marked } from 'marked'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..')
// resolve() y no join(): asi acepta tanto una ruta relativa al repo
// como una absoluta, que es lo que pasa el workflow.
const destino = resolve(raiz, process.argv[2] ?? 'site/docs')
const origen = resolve(raiz, process.argv[3] ?? 'docs/domain')

// El BOM de UTF-8 al inicio del archivo se cuela como texto y rompe el
// primer encabezado. Varios de estos documentos lo tienen.
const sinBOM = (s) => s.replace(/^﻿/, '')

// "03_REGLAS_DE_NEGOCIO.md" -> { num: "03", titulo: "Reglas de negocio" }
function rotular(archivo, markdown) {
  const num = basename(archivo).match(/^(\d+)/)?.[1] ?? ''
  const h1 = sinBOM(markdown).match(/^#\s+(.+)$/m)?.[1] ?? basename(archivo, '.md')
  // Primero se saca el numero de orden que algunos H1 repiten ("04 — Modelo
  // del Dominio"), y recien despues se corta el sufijo descriptivo
  // ("— Calculadora de honorarios bajo Ley 27.423"). Al reves, el split se
  // queda con el numero y el titulo se pierde.
  const titulo = h1
    .replace(/^\d+\s*[—–-]\s*/, '')
    .split(/\s+[—–-]\s+/)[0]
    .trim()
  return { num, titulo }
}

const plantilla = (titulo, cuerpo, nav) => `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${titulo} · Documentación de dominio</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&family=Source+Serif+4:opsz,wght@8..60,400&display=swap" rel="stylesheet">
<style>
:root{color-scheme:light;--bg:#e9ebee;--fg:#12161c;--card:#fff;--muted-fg:#5a626e;--faint:#5f6774;
--accent:#1e45ce;--border:rgb(18 22 28/.13);--hair:rgb(18 22 28/.07);--sunk:#f2f4f6;--radius:.375rem;
--font-meter:'Archivo','Segoe UI',sans-serif;--font-sans:ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif;
--font-law:'Source Serif 4',ui-serif,Georgia,serif}
@media(prefers-color-scheme:dark){:root:not([data-tema="claro"]){color-scheme:dark;--bg:#0d0f13;--fg:#edeff3;--card:#16191f;
--muted-fg:#99a1ae;--faint:#828a98;--accent:#7a99ff;--border:rgb(237 239 243/.15);--hair:rgb(237 239 243/.08);--sunk:#101318}}
/* El mismo bloque, para cuando el usuario eligio oscuro a mano con el
   sistema en claro. Si tocas un valor arriba, tocalo aca: verificar-contraste
   exige que los dos digan lo mismo. */
:root[data-tema="oscuro"]{color-scheme:dark;--bg:#0d0f13;--fg:#edeff3;--card:#16191f;
--muted-fg:#99a1ae;--faint:#828a98;--accent:#7a99ff;--border:rgb(237 239 243/.15);--hair:rgb(237 239 243/.08);--sunk:#101318}
*,*::before,*::after{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--fg);font-family:var(--font-sans);line-height:1.65;-webkit-font-smoothing:antialiased}
.shell{max-width:1160px;margin:0 auto;padding:0 24px;display:grid;grid-template-columns:250px 1fr;gap:56px;align-items:start}
nav{position:sticky;top:0;padding:40px 0;max-height:100vh;overflow-y:auto}
nav .label{font-family:var(--font-meter);font-size:.7rem;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--faint);display:block;margin-bottom:14px}
nav a{display:block;text-decoration:none;color:var(--muted-fg);font-size:.88rem;padding:5px 10px;border-radius:var(--radius);border-left:2px solid transparent}
nav a:hover{color:var(--accent);background:var(--card)}
nav a.on{color:var(--accent);border-left-color:var(--accent);font-weight:600}
nav .volver{margin-bottom:20px;font-family:var(--font-meter);font-size:.85rem;padding-left:0}
main{padding:40px 0 96px;min-width:0;max-width:74ch}
h1,h2,h3,h4{font-family:var(--font-meter);font-weight:600;letter-spacing:-.015em;line-height:1.25}
h1{font-size:clamp(1.8rem,4vw,2.5rem);margin:0 0 28px}
h2{font-size:1.45rem;margin:44px 0 14px;padding-top:22px;border-top:1px solid var(--hair)}
h3{font-size:1.13rem;margin:28px 0 10px}
h4{font-size:1rem;margin:22px 0 8px;color:var(--muted-fg)}
p,li{color:var(--muted-fg)}
strong{color:var(--fg);font-weight:600}
a{color:var(--accent)}
blockquote{font-family:var(--font-law);font-size:1.03rem;border-left:2px solid var(--accent);margin:20px 0;padding:2px 0 2px 18px}
blockquote p{color:var(--fg)}
code{font-family:ui-monospace,'SF Mono',Menlo,Consolas,monospace;font-size:.86em;background:var(--sunk);border:1px solid var(--hair);border-radius:3px;padding:1px 5px}
pre{background:var(--sunk);border:1px solid var(--hair);border-radius:var(--radius);padding:16px;overflow-x:auto}
pre code{background:0;border:0;padding:0}
.tablewrap{overflow-x:auto;margin:20px 0}
table{border-collapse:collapse;font-size:.9rem;width:100%}
th,td{text-align:left;padding:9px 14px;border-bottom:1px solid var(--hair);vertical-align:top}
th{font-family:var(--font-meter);font-weight:600;color:var(--fg);background:var(--sunk);white-space:nowrap}
td{color:var(--muted-fg)}
hr{border:0;border-top:1px solid var(--hair);margin:32px 0}
.aviso{background:var(--sunk);border:1px solid var(--hair);border-radius:var(--radius);padding:14px 18px;font-size:.86rem;color:var(--faint);margin-bottom:32px}
/* ---------- Interruptor de tema ----------
   Lo inyecta assets/tema.js; el marcado no lo declara. Mismo estilo que
   las otras trece paginas. */
.tema-boton{position:fixed;top:12px;right:12px;z-index:999;padding:7px 14px;font-size:.8rem;
font-family:var(--font-sans);font-weight:500;line-height:1.2;background:var(--card);color:var(--muted-fg);
border:1px solid var(--border);border-radius:var(--radius);cursor:pointer;box-shadow:0 1px 3px rgb(0 0 0/.06);
transition:color .15s,border-color .15s}
.tema-boton:hover{color:var(--accent);border-color:var(--accent)}
.tema-boton:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
@media(max-width:600px){.tema-boton{top:8px;right:8px;padding:5px 10px;font-size:.72rem}}
@media print{.tema-boton{display:none}}
@media(max-width:880px){.shell{grid-template-columns:1fr;gap:0}nav{position:static;max-height:none;padding:28px 0 0;border-bottom:1px solid var(--hair)}main{padding-top:28px}}
</style>
<script src="../assets/tema.js"></script>
</head>
<body>
<div class="shell">
<nav>
  <a class="volver" href="../">← Herramientas</a>
  <span class="label">Documentación de dominio</span>
  ${nav}
</nav>
<main>
  <div class="aviso">Documento de dominio: el razonamiento normativo detrás de las reglas que aplica el motor. Se mantiene junto al código, en <code>docs/domain/</code>.</div>
  ${cuerpo}
</main>
</div>
</body>
</html>
`

const archivos = readdirSync(origen).filter((f) => f.endsWith('.md')).sort()
const paginas = archivos.map((archivo) => {
  const md = sinBOM(readFileSync(join(origen, archivo), 'utf8'))
  return { archivo, salida: archivo.replace(/\.md$/, '.html'), md, ...rotular(archivo, md) }
})

mkdirSync(destino, { recursive: true })

marked.setOptions({ gfm: true, breaks: false })

// Las tablas de estos documentos son anchas; sin contenedor propio
// desbordan la pagina en pantallas chicas.
const envolverTablas = (html) => html.replace(/<table>[\s\S]*?<\/table>/g, (t) => `<div class="tablewrap">${t}</div>`)

for (const pagina of paginas) {
  const nav = paginas
    .map((p) => `<a href="${p.salida}"${p.salida === pagina.salida ? ' class="on"' : ''}>${p.num} · ${p.titulo}</a>`)
    .join('\n  ')
  const cuerpo = envolverTablas(marked.parse(pagina.md))
  writeFileSync(join(destino, pagina.salida), plantilla(pagina.titulo, cuerpo, nav), 'utf8')
}

// Indice: entra por aca quien llega desde la landing.
const indiceNav = paginas.map((p) => `<a href="${p.salida}">${p.num} · ${p.titulo}</a>`).join('\n  ')
const indiceCuerpo = `<h1>Documentación de dominio</h1>
<p>El <em>por qué</em> de las reglas que aplica el motor de Honorio: qué hace cada tipo de proceso, qué dice cada artículo de la Ley 27.423 y dónde la ley obliga a elegir un criterio.</p>
<p>Son los documentos de trabajo con los que se construyó el cálculo, no un manual de usuario. Para eso está la <a href="../documentacion.html">guía de las herramientas</a>.</p>
<ul>${paginas.map((p) => `<li><a href="${p.salida}"><strong>${p.num} · ${p.titulo}</strong></a></li>`).join('')}</ul>`

writeFileSync(join(destino, 'index.html'), plantilla('Documentación de dominio', indiceCuerpo, indiceNav), 'utf8')

console.log(`Documentacion generada: ${paginas.length} paginas + indice en ${destino}`)
