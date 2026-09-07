// ---------------------------------------------------------------
// scripts/verificar-estado.mjs
//
// Control mecanico de docs/ESTADO.md. No verifica que lo que dice sea
// cierto —eso no se puede automatizar— pero si mantiene la unica
// propiedad de la que depende que sirva: QUE SEA CORTO.
//
// POR QUE EXISTE. ESTADO.md se lee entero al empezar cada sesion, asi
// que cada linea de mas se paga en todas las sesiones que vengan. El
// 28/8 tenia 3766 lineas y 223 KB —unos 56 mil tokens por sesion— y
// casi todo era cronica de trabajo ya cerrado, acumulada dia por dia
// sin que nadie la sacara. Javier: «es como que siempre se descuida y
// nadie lo limpia; sale caro en tokens».
//
// LA CAUSA NO ES QUE NADIE LIMPIE: ES QUE LIMPIAR NO TIENE MOMENTO.
// Cada sesion agrega su seccion al final y ninguna tiene motivo para
// sacar la de la sesion anterior. Un documento que crece con cada
// commit y se poda cuando alguien se acuerda solo puede crecer. Por eso
// el control no pide prolijidad: pone un techo y falla.
//
// LAS CUATRO REGLAS, y cada una caza una forma distinta de engordar:
//
//   1. PRESUPUESTO DE LINEAS. Es el techo, y lo que hace que las otras
//      tres no hagan falta discutirlas: pasado el limite hay que mudar
//      algo a HISTORIA.md, y lo que se muda es siempre lo mismo, lo que
//      ya se cerro.
//
//   2. NADA TACHADO. Un `~~asi~~` es la marca de algo cerrado que quedo
//      escrito «para que se vea que se hizo». Eso es historia: se muda,
//      no se tacha. Es la forma mas comun de engordar, porque cuesta
//      cero y no se siente como agregar.
//
//   3. NINGUN TITULO CON FECHA. Un encabezado que termina en `— 27/8`
//      es la cronica de una jornada, y una cronica es historia desde el
//      momento en que la jornada termina, aunque sea la de hoy. Es la
//      forma que hizo crecer este archivo de 900 a 3766 lineas.
//
//   4. NINGUN ENLACE INTERNO ROTO. Mudar una seccion a HISTORIA.md deja
//      atras los `](#ancla)` que le apuntaban, y un enlace roto en el
//      documento que se lee para orientarse manda a nadie a ningun
//      lado. Se controlan tambien los enlaces a archivos.
//
// ES EL CONTROL DE LOS CINCO REPOS, NO SOLO DE ESTE. Desde el 7/9/2026
// acepta la ruta del ESTADO.md y su techo por argumento, y el
// `.githooks/pre-commit` de cada repositorio lo llama con los suyos.
// Vive aca y no copiado, por el mismo motivo que `verificar-datos.sh`:
// cuatro copias de la misma regla se desincronizan solas, y ya paso.
//
// Uso: npm run verificar-estado                  este repo (docs/ESTADO.md, techo 1000)
//      node <ruta>/verificar-estado.mjs <archivo> <techo>
// ---------------------------------------------------------------

import { readFileSync, existsSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'

const RAIZ = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
// Sin argumentos se comporta como siempre, que es lo que corren npm y CI.
const ESTADO = process.argv[2]
  ? resolve(process.argv[2])
  : join(RAIZ, 'docs', 'ESTADO.md')

if (!existsSync(ESTADO)) {
  console.error(`No existe ${ESTADO}`)
  process.exit(2)
}

// El techo. Se eligio contra el tamanio que quedo despues de la poda del
// 28/8 —893 lineas— con margen para una sesion de trabajo adentro: si un
// dia hay que subirlo, la pregunta correcta no es cuanto sino QUE HAY
// ADENTRO QUE YA ESTA CERRADO.
// Cada repo trae el suyo. El numero correcto es el tamanio que queda
// despues de una poda mas margen para una sesion adentro, no una cifra
// redonda igual para todos.
const TECHO = process.argv[3] ? Number(process.argv[3]) : 1000
const AVISO = Math.round(TECHO * 0.9)

const rojo = (t) => `\x1b[31m${t}\x1b[0m`
const verde = (t) => `\x1b[32m${t}\x1b[0m`
const amarillo = (t) => `\x1b[33m${t}\x1b[0m`
const gris = (t) => `\x1b[90m${t}\x1b[0m`

const texto = readFileSync(ESTADO, 'utf8')
const lineas = texto.split('\n')

const fallas = []
const avisos = []

// --- 1. el presupuesto ---------------------------------------------------
// Se informa siempre, pase o no: es el numero que hay que mirar antes de
// agregar algo, y esconderlo cuando esta en verde es esconderlo justo
// cuando todavia se puede hacer algo barato.
const largo = lineas.length
const bytes = Buffer.byteLength(texto, 'utf8')

if (largo > TECHO) {
  fallas.push(
    `ESTADO.md tiene ${largo} lineas y el techo es ${TECHO}. ` +
    `Muda a HISTORIA.md lo que ya se cerro: es siempre eso.`
  )
} else if (largo > AVISO) {
  avisos.push(
    `ESTADO.md va por ${largo} lineas de ${TECHO}. Queda poco margen: ` +
    `conviene mudar algo cerrado antes de que el techo lo obligue.`
  )
}

// --- 2. nada tachado -----------------------------------------------------
lineas.forEach((l, i) => {
  if (l.includes('~~')) {
    fallas.push(
      `linea ${i + 1}: hay texto tachado. Lo cerrado se muda a HISTORIA.md, no se tacha.\n` +
      `      ${l.trim().slice(0, 90)}`
    )
  }
})

// --- 3. ningun titulo con fecha -----------------------------------------
// `— 27/8`, `- 5/8`, `— 27/8/2026`. El guion puede ser el corto o el largo.
const TITULO_CON_FECHA = /^#{2,4} .*[—-]\s*\d{1,2}\/\d{1,2}(\/\d{2,4})?\s*$/
lineas.forEach((l, i) => {
  if (TITULO_CON_FECHA.test(l)) {
    fallas.push(
      `linea ${i + 1}: encabezado fechado, o sea cronica. Va en HISTORIA.md.\n` +
      `      ${l.trim().slice(0, 90)}`
    )
  }
})

// --- 4. enlaces ----------------------------------------------------------
// Las anclas de GitHub: minusculas, los espacios a guiones, y afuera todo
// lo que no sea letra, numero, guion o guion bajo. Los acentos SI quedan.
const ancla = (titulo) =>
  titulo
    .replace(/^#{1,6}\s+/, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .trim()
    .replace(/\s/g, '-')

const anclas = new Set(
  lineas.filter((l) => /^#{1,6}\s/.test(l)).map(ancla)
)

for (const m of texto.matchAll(/\]\((#[^)]+)\)/g)) {
  const a = m[1].slice(1)
  if (!anclas.has(a)) {
    fallas.push(`enlace interno roto: #${a} no es ningun titulo de este archivo.`)
  }
}

for (const m of texto.matchAll(/\]\(([^)#][^)]*)\)/g)) {
  const destino = m[1].split('#')[0]
  if (/^(https?:|mailto:)/.test(destino) || destino === '') continue
  if (!existsSync(resolve(dirname(ESTADO), destino))) {
    fallas.push(`enlace roto: ${destino} no existe.`)
  }
}

// --- el informe ----------------------------------------------------------
console.log(`\nControl de ${ESTADO}`)
console.log('================================================================')
const porcentaje = Math.round((largo / TECHO) * 100)
console.log(`  lineas              ${largo} de ${TECHO}  (${porcentaje} %)`)
console.log(`  tamanio             ${(bytes / 1024).toFixed(1)} KB`)
console.log(`  titulos             ${anclas.size}`)
console.log(gris('  Se lee entero en cada sesion: el presupuesto es el punto.'))

if (avisos.length > 0) {
  console.log(amarillo(`\nPara mirar (${avisos.length})`))
  for (const a of avisos) console.log(amarillo(`  !  ${a}`))
}

if (fallas.length > 0) {
  console.log(rojo(`\nHay que arreglar (${fallas.length})`))
  for (const f of fallas) console.log(rojo(`  x  ${f}`))
  console.log(rojo('\nESTADO.md lleva lo que sigue vivo. Lo cerrado va a HISTORIA.md,'))
  console.log(rojo('que no se lee al arrancar, y se muda en el mismo commit que cierra.\n'))
  process.exit(1)
}

console.log(verde('\nESTADO.md esta adentro del presupuesto y sin cronica vieja.'))
console.log(gris('Esto no dice que lo que afirma sea cierto: dice que es corto,'))
console.log(gris('que no arrastra tachados y que sus enlaces llegan a algun lado.\n'))
