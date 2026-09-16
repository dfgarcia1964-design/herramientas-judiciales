// ---------------------------------------------------------------
// Controla los tokens de color del sistema visual.
//
//   npm run verificar-contraste
//
// Existe por un bug que se arreglo tres veces a mano y volvio tres
// veces: --faint se calibro contra la tarjeta blanca y nadie lo midio
// contra el fondo de la pagina, que es mas oscuro. Sobre --card daba
// 5.14 y sobre --bg 4.30, o sea reprobaba AA (4.5) justo en el unico
// texto que lo usa, que es chico. Cada vez que aparecio se resolvio
// cambiando el token en esa pantalla ---primero vencimientos.html,
// despues el badge del tablero--- y el token seguia mal para las
// trece paginas.
//
// De ahi los dos controles, que son dos formas distintas de fallar:
//
//   1. CONTRASTE. Cada token de texto contra cada superficie, en los
//      dos temas. La superficie que manda no es la misma en los dos:
//      en claro es --bg, que es la mas oscura; en oscuro es --card,
//      que es la mas clara. Medir contra una sola es como se llego
//      hasta aca.
//
//   2. DERIVA. Los tokens estan escritos SEIS veces ---cuatro paginas
//      sueltas, comun.css y la plantilla de los documentos de dominio---
//      porque son paginas sin build. Seis copias no se mantienen
//      iguales solas: cuando se escribio este script, la plantilla de
//      scripts/build-docs.mjs todavia tenia los valores anteriores al
//      5/8 ---#8b93a0, que da 2.59 sobre el fondo--- y uma-uhom.html
//      ya tenia el arreglo que las otras tres no. Ninguna de las dos
//      cosas se ve mirando una pagina.
//      Adentro de cada archivo el tema oscuro esta ademas dos veces
//      ---el @media y el [data-tema="oscuro"]--- y tienen que decir lo
//      mismo, que es la regla escrita en comun.css.
//
// Los tokens de estado ---ok, warn, error--- entran con una exigencia
// mas: no alcanza con medirlos contra las tres superficies, porque casi
// nunca se escriben directamente sobre una. Se escriben sobre su propio
// tinte ---el mismo color al 8-13 % compuesto encima de la superficie---
// y eso es siempre mas oscuro. El fondo que manda es el tinte sobre --bg.
//
// Nacieron como aviso y no como falla, porque los tres reprobaban en
// claro y bajarlos era mover la paleta, que es una decision y no un
// arreglo. Javier la tomo el 26/8: se bajaron los tres y esto paso a
// fallar. El peor era --warn, que no llegaba sobre NINGUNA superficie.
//
// Salidas:
//   0  todo bien
//   1  algo no cierra. Se listan todas las fallas, no la primera.
// ---------------------------------------------------------------

import { readFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')

// AA para texto chico. Todo lo que usa estos tokens es texto chico:
// etiquetas de 11 px en mayusculas, pies de pagina, fechas.
const AA = 4.5

// Los dos lugares donde siguen escritos los tokens: la hoja compartida y la
// plantilla que genera la documentación. Las páginas colombianas consumen
// comun.css y no duplican la paleta.
const ARCHIVOS = [
  'calculadoras/css/comun.css',
  'scripts/build-docs.mjs',
]

const SUPERFICIES = ['bg', 'card', 'sunk']
const TEXTOS = ['fg', 'muted-fg', 'faint', 'accent']
// Estos ademas se miden sobre su propio tinte compuesto encima de cada
// superficie, que es la superficie sobre la que se escriben.
const ESTADOS = ['ok', 'warn', 'error']

const fallas = []
const mal = (mensaje) => fallas.push(mensaje)

// ---------------------------------------------------------------
// Color
// ---------------------------------------------------------------

// Devuelve [r, g, b] y, si el color es translucido, la opacidad.
// Acepta las dos formas que usa el repositorio: #rrggbb / #rgb y la
// sintaxis de espacios rgb(18 22 28 / 0.13), que es la que tienen
// --border y --hair.
function color(valor) {
  const v = valor.trim()
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(v)
  if (hex) {
    const h =
      hex[1].length === 3
        ? hex[1]
            .split('')
            .map((c) => c + c)
            .join('')
        : hex[1]
    return {
      rgb: [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)),
      alfa: 1,
      texto: '#' + h.toLowerCase(),
    }
  }
  const rgb = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)\s*(?:[/,]\s*([\d.]+))?\s*\)$/i.exec(v)
  if (rgb) {
    const canal = [1, 2, 3].map((i) => Number(rgb[i]))
    const alfa = rgb[4] === undefined ? 1 : Number(rgb[4])
    return { rgb: canal, alfa, texto: `rgb(${canal.join(' ')} / ${alfa})` }
  }
  return null
}

const aLineal = (c) => {
  const x = c / 255
  return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4
}

const luminancia = ([r, g, b]) =>
  0.2126 * aLineal(r) + 0.7152 * aLineal(g) + 0.0722 * aLineal(b)

function contraste(a, b) {
  const x = luminancia(a)
  const y = luminancia(b)
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
}

// Un color translucido encima de una superficie opaca. Hace falta para
// los tintes: --warn no se lee sobre --card sino sobre --warn-tint
// compuesto encima de --card, que es mas oscuro y da menos contraste.
const componer = (frente, alfa, fondo) =>
  frente.map((c, i) => Math.round(c * alfa + fondo[i] * (1 - alfa)))

const dosDec = (n) => n.toFixed(2)

// ---------------------------------------------------------------
// Lectura de los bloques
// ---------------------------------------------------------------

// Todos los bloques que definen tokens declaran color-scheme como
// primera linea, en los seis archivos, asi que ese es el ancla. Lo que
// hay que esquivar es prefers-color-scheme, que es la consulta de
// medios y no un bloque.
function bloques(fuente) {
  // Sin comentarios: los de comun.css nombran prefers-color-scheme y
  // los de este mismo archivo nombran los tokens.
  const texto = fuente.replace(/\/\*[\s\S]*?\*\//g, '')
  const encontrados = []
  const ancla = /(?<!prefers-)color-scheme\s*:\s*(light|dark)/g
  let m
  while ((m = ancla.exec(texto)) !== null) {
    const abre = texto.lastIndexOf('{', m.index)
    if (abre === -1) continue
    const cierra = texto.indexOf('}', abre)
    if (cierra === -1) continue
    const cuerpo = texto.slice(abre + 1, cierra)
    const selector = texto.slice(Math.max(0, texto.lastIndexOf('}', abre) + 1), abre)
    const tokens = {}
    for (const d of cuerpo.matchAll(/--([a-z0-9-]+)\s*:\s*([^;]+);/gi)) {
      tokens[d[1].toLowerCase()] = d[2].trim()
    }
    encontrados.push({
      tema: m[1],
      // Como se llega a este bloque: el sistema o la eleccion del usuario.
      via: selector.includes('data-tema') ? 'eleccion' : 'sistema',
      tokens,
    })
  }
  return encontrados
}

// ---------------------------------------------------------------

const porArchivo = new Map()

for (const relativo of ARCHIVOS) {
  let fuente
  try {
    fuente = await readFile(join(RAIZ, relativo), 'utf8')
  } catch {
    mal(`${relativo}: no se puede leer, y es uno de los lugares donde viven los tokens`)
    continue
  }
  const encontrados = bloques(fuente)
  if (!encontrados.length) {
    mal(`${relativo}: no se encontro ningun bloque de tokens (se busca color-scheme)`)
    continue
  }
  porArchivo.set(relativo, encontrados)
}

// --- 1. Contraste ------------------------------------------------

for (const [relativo, encontrados] of porArchivo) {
  for (const bloque of encontrados) {
    const { tema, via, tokens } = bloque
    const donde = `${relativo} (${tema}, por ${via})`

    const superficies = {}
    for (const s of SUPERFICIES) {
      if (tokens[s] === undefined) continue
      const c = color(tokens[s])
      if (!c) {
        mal(`${donde}: --${s} = "${tokens[s]}" no se puede leer como color`)
        continue
      }
      superficies[s] = c.rgb
    }

    for (const t of [...TEXTOS, ...ESTADOS]) {
      if (tokens[t] === undefined) continue
      const c = color(tokens[t])
      if (!c) {
        mal(`${donde}: --${t} = "${tokens[t]}" no se puede leer como color`)
        continue
      }
      const tinte = tokens[`${t}-tint`] && color(tokens[`${t}-tint`])
      for (const [nombre, fondo] of Object.entries(superficies)) {
        const fondos = [[`--${nombre}`, fondo]]
        // El tinte del propio token encima de la superficie: es el fondo real
        // de casi todos los avisos, y es mas oscuro que la superficie sola.
        // Medir solo contra la superficie deja pasar justo el caso que se usa.
        if (tinte && tinte.alfa < 1) {
          fondos.push([`--${t}-tint sobre --${nombre}`, componer(tinte.rgb, tinte.alfa, fondo)])
        }
        for (const [queFondo, rgb] of fondos) {
          const r = contraste(c.rgb, rgb)
          if (r < AA) {
            mal(
              `${donde}: --${t} sobre ${queFondo} da ${dosDec(r)}, abajo de ${AA}. ` +
                `Es texto chico: tiene que pasar sobre las tres superficies ---y sobre ` +
                `su tinte encima de cada una---, no solo sobre la que se miro al elegirlo.`,
            )
          }
        }
      }
    }
  }
}

// --- 2. Deriva ---------------------------------------------------

// 2a. Adentro de cada archivo, los dos bloques oscuros tienen que
//     decir lo mismo. Es la regla escrita en comun.css: "si tocas un
//     valor, toca los dos".
for (const [relativo, encontrados] of porArchivo) {
  const oscuros = encontrados.filter((b) => b.tema === 'dark')
  if (oscuros.length < 2) {
    mal(
      `${relativo}: hay ${oscuros.length} bloque(s) de tema oscuro y tiene que haber dos, ` +
        `el del @media y el de [data-tema="oscuro"]. Con uno solo, el que elige oscuro a ` +
        `mano en un sistema claro se queda sin la mitad de los tokens.`,
    )
    continue
  }
  const [primero, ...resto] = oscuros
  for (const otro of resto) {
    const nombres = new Set([...Object.keys(primero.tokens), ...Object.keys(otro.tokens)])
    for (const n of nombres) {
      if (primero.tokens[n] !== otro.tokens[n]) {
        mal(
          `${relativo}: --${n} vale "${primero.tokens[n] ?? '(no esta)'}" en el bloque oscuro ` +
            `por sistema y "${otro.tokens[n] ?? '(no esta)'}" en el de eleccion. Los dos ` +
            `bloques son el mismo tema y tienen que decir lo mismo.`,
        )
      }
    }
  }
}

// 2b. Entre archivos: el mismo token, en el mismo tema, tiene que
//     valer lo mismo en los seis lugares. Solo se comparan los que son
//     colores: las pilas de tipografias difieren a proposito y no
//     cambian un pixel de contraste.
const porToken = new Map()
for (const [relativo, encontrados] of porArchivo) {
  for (const { tema, tokens } of encontrados) {
    for (const [nombre, valor] of Object.entries(tokens)) {
      const c = color(valor)
      if (!c) continue
      const clave = `${tema}|${nombre}`
      if (!porToken.has(clave)) porToken.set(clave, new Map())
      const donde = porToken.get(clave)
      if (!donde.has(c.texto)) donde.set(c.texto, new Set())
      donde.get(c.texto).add(relativo)
    }
  }
}

for (const [clave, valores] of porToken) {
  if (valores.size < 2) continue
  const [tema, nombre] = clave.split('|')
  const detalle = [...valores]
    .map(([v, archivos]) => `${v} en ${[...archivos].join(', ')}`)
    .join(' | ')
  mal(`--${nombre} (${tema}) esta escrito con ${valores.size} valores distintos: ${detalle}`)
}

// ---------------------------------------------------------------

const bloquesLeidos = [...porArchivo.values()].reduce((n, b) => n + b.length, 0)
console.log(
  `${porArchivo.size} archivo(s) con tokens, ${bloquesLeidos} bloque(s) leido(s), ` +
    `umbral AA ${AA} para texto chico.`,
)

if (fallas.length) {
  console.error(`\n${fallas.length} problema(s):`)
  for (const f of fallas) console.error('  ' + f)
  process.exit(1)
}

console.log('\nLos tokens de texto y los de estado pasan AA sobre las tres superficies')
console.log('---y sobre sus tintes---, en los dos temas, y los archivos fuente dicen lo mismo.')
