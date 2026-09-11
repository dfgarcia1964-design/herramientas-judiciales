// El nucleo de los conectores: el calendario judicial y el computo de plazos,
// consultables desde codigo.
//
// Por que existe: los motores de este repositorio estan escritos para el
// navegador --son IIFE que cuelgan su API de `window` y piden los JSON con
// `fetch`--, asi que nada fuera de una pestania podia consultarlos. El pedido
// vino de `pipeline-drafter`, que redacta borradores y no puede contar dias
// habiles: le cuesta una fecha por resolucion.
//
// LO QUE ESTE ARCHIVO NO HACE ES CALCULAR. Carga los motores tal como estan y
// traduce entre sus objetos `Date` y JSON. No hay una sola cuenta propia aca, y
// eso es deliberado: dos implementaciones de un computo con consecuencia
// juridica pueden discrepar en silencio durante anios. Es lo que paso con la
// feria de invierno, deducida con dos heuristicas distintas en dos pantallas.
//
// De aca cuelgan los tres consumos, y ninguno agrega logica:
//   - importarlo directo desde Node   (este archivo)
//   - conectores/http.mjs             (JSON sobre HTTP local)
//   - conectores/mcp.mjs              (MCP por stdio, para un modelo)
//
// Y hay un cuarto consumidor que NO pasa por aca: desde el 11/9/2026 el
// repositorio `ledger` carga calendario-judicial.js y plazos.js desde el sitio
// publicado, en el navegador, y los consulta directo. Para el, el contrato no
// es la forma de estas respuestas sino la API de `window` de los motores
// --CalendarioJudicial.CONFIG reescribible antes de init(), Plazos.caducidad y
// Plazos.vencimiento-- y las rutas del sitio. No se cambian sin avisar al
// ledger: si se rompen, no da error. Que usa exactamente, en docs/ESTADO.md.
//
// LA REGLA QUE NO SE AFLOJA. Si el computo toca un anio cuya Acordada de feria
// no se dicto, o cuyos feriados no estan cargados, la respuesta NO trae fecha:
// trae `ok: false` y el motivo. La pantalla puede darse el lujo de mostrar el
// aviso al lado del numero porque hay alguien leyendo; un conector no tiene a
// nadie del otro lado, y una fecha plausible que nadie desmiente es peor que un
// error. No hay medio resultado.

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');

// El anio mas viejo con feriados y asuetos completos. Antes de eso hay ferias
// cargadas pero no feriados, asi que el dia se evaluaria incompleto y el motor
// lo anota. Se decidio no completar 2004-2020: nadie computa un plazo de 2007.
const COBERTURA_DESDE = 2021;

let motores = null;

async function cargar() {
    if (motores) return motores;

    const ventana = {};
    const fetchLocal = async (url) => {
        const limpia = String(url).split('?')[0].replace(/^\.\.\//, '');
        const texto = await readFile(join(RAIZ, limpia), 'utf8');
        return { ok: true, status: 200, json: async () => JSON.parse(texto) };
    };

    // El orden importa: plazos.js busca el calendario ya colgado de `window`.
    for (const archivo of ['calendario-judicial.js', 'plazos.js']) {
        const fuente = await readFile(join(RAIZ, 'calculadoras', 'js', archivo), 'utf8');
        new Function('window', 'fetch', fuente)(ventana, fetchLocal);
    }

    motores = { CJ: ventana.CalendarioJudicial, P: ventana.Plazos };
    return motores;
}

// Los anios que un computo puede llegar a tocar. Se pide de sobra a proposito:
// que un anio no este cargado NO es motivo para no calcular --quiza el computo
// no llegue nunca ahi-- y lo que el computo toque realmente lo detecta la
// auditoria del motor, que da un motivo preciso. Es el mismo criterio de
// mora.html.
function ventanaDeAnios(anio) {
    const desde = Math.min(COBERTURA_DESDE, Number(anio) - 1);
    const hasta = Math.max(new Date().getFullYear(), Number(anio)) + 2;
    const anios = [];
    for (let y = desde; y <= hasta; y++) anios.push(y);
    return anios;
}

const ymd = (fecha) => fecha.toISOString().slice(0, 10);

// Las fechas viajan como 'AAAA-MM-DD'. Ni ISO completo ni epoch: los dos
// arrastran hora y huso, y del otro lado nadie sabe cual es el huso del que
// calculo. Un plazo judicial no tiene hora.
function partirFecha(texto, campo) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(texto || '').trim());
    if (!m) {
        throw new ErrorDeEntrada(`${campo} tiene que ser una fecha con el formato AAAA-MM-DD.`);
    }
    const [, anio, mes, dia] = m.map(Number);
    const prueba = new Date(anio, mes - 1, dia);
    if (prueba.getFullYear() !== anio || prueba.getMonth() !== mes - 1 || prueba.getDate() !== dia) {
        throw new ErrorDeEntrada(`${campo} no es una fecha que exista en el calendario.`);
    }
    return { anio, mes, dia };
}

export class ErrorDeEntrada extends Error {}

function entero(valor, campo, { minimo = 0, obligatorio = true } = {}) {
    if (valor === undefined || valor === null || valor === '') {
        if (obligatorio) throw new ErrorDeEntrada(`Falta ${campo}.`);
        return minimo;
    }
    const n = Number(valor);
    if (!Number.isInteger(n) || n < minimo) {
        throw new ErrorDeEntrada(`${campo} tiene que ser un número entero de ${minimo} en adelante.`);
    }
    return n;
}

// ---------------------------------------------------------------------------
// Calendario
// ---------------------------------------------------------------------------

/** Si una fecha es habil, y si no lo es, por que. */
export async function diaHabil({ fecha }) {
    const { CJ } = await cargar();
    const { anio, mes, dia } = partirFecha(fecha, 'La fecha');
    await CJ.init(ventanaDeAnios(anio));

    CJ.reiniciarAuditoria();
    const d = new Date(anio, mes - 1, dia);
    const habil = CJ.esDiaHabil(d);
    const motivo = CJ.obtenerMotivoInhabil(d);
    const problema = CJ.problemaDeDatos();

    if (problema) return { ok: false, problema };
    return { ok: true, fecha: ymd(new Date(Date.UTC(anio, mes - 1, dia))), habil, motivo };
}

/** El proximo dia habil despues de una fecha. */
export async function siguienteHabil({ fecha }) {
    const { CJ } = await cargar();
    const { anio, mes, dia } = partirFecha(fecha, 'La fecha');
    await CJ.init(ventanaDeAnios(anio));

    CJ.reiniciarAuditoria();
    const siguiente = CJ.siguienteDiaHabil(new Date(Date.UTC(anio, mes - 1, dia, 12)));
    const problema = CJ.problemaDeDatos();

    if (problema) return { ok: false, problema };
    return { ok: true, siguiente: ymd(siguiente) };
}

/** Los dias habiles entre dos fechas, y los inhabiles con su motivo. */
export async function diasHabilesEntre({ desde, hasta }) {
    const { CJ } = await cargar();
    const a = partirFecha(desde, 'La fecha de inicio');
    const b = partirFecha(hasta, 'La fecha de fin');

    const inicio = new Date(Date.UTC(a.anio, a.mes - 1, a.dia, 12));
    const fin = new Date(Date.UTC(b.anio, b.mes - 1, b.dia, 12));
    if (fin < inicio) throw new ErrorDeEntrada('La fecha de fin es anterior a la de inicio.');

    await CJ.init(ventanaDeAnios(a.anio).concat(ventanaDeAnios(b.anio)));
    CJ.reiniciarAuditoria();

    let habiles = 0;
    const inhabiles = [];
    const cursor = new Date(inicio);
    while (cursor.getTime() <= fin.getTime()) {
        if (CJ.esDiaHabil(cursor)) habiles++;
        else inhabiles.push({ fecha: ymd(cursor), motivo: CJ.obtenerMotivoInhabil(cursor) });
        cursor.setDate(cursor.getDate() + 1);
    }

    const problema = CJ.problemaDeDatos();
    if (problema) return { ok: false, problema };

    const corridos = Math.round((fin - inicio) / 86400000) + 1;
    return { ok: true, desde: ymd(inicio), hasta: ymd(fin), corridos, habiles, inhabiles };
}

// ---------------------------------------------------------------------------
// Computo de plazos
// ---------------------------------------------------------------------------

/**
 * El vencimiento de un plazo en dias habiles.
 *
 * `diasSalteados` viene con el motivo de cada dia, y es lo que permite auditar
 * el resultado sin volver a calcularlo: quien lo recibe puede ver donde cayo la
 * feria y cuantos fines de semana se comio el plazo.
 */
export async function vencimiento(entrada) {
    const { CJ, P } = await cargar();
    const { anio, mes, dia } = partirFecha(entrada.fecha, 'La fecha');
    await CJ.init(ventanaDeAnios(anio));

    const modalidad = entrada.modalidad === 'automatica' ? 'automatica' : 'cedula';
    const r = P.vencimiento({
        modalidad,
        anio, mes, dia,
        plazo: entero(entrada.plazo, 'el plazo', { minimo: 1 }),
        ampliacion: entero(entrada.ampliacion, 'la ampliación', { minimo: 0, obligatorio: false }),
        fueraDeHorario: !!entrada.fueraDeHorario,
        notasDejadas: entrada.notasDejadas || []
    });

    if (r.problema) return { ok: false, problema: r.problema };

    return {
        ok: true,
        modalidad: r.modalidad,
        fechaIngresada: ymd(r.fechaIngresada),
        eraDiaHabil: r.diaEraHabil,
        motivoInhabil: r.motivoInhabil,
        fechaNotificacion: ymd(r.fechaNotificacion),
        empiezaAContar: ymd(r.fechaInicioConteo),
        plazo: r.plazo,
        ampliacion: r.ampliacion,
        plazoTotal: r.plazoTotal,
        vencimiento: ymd(r.vencimiento),
        vencimientoSinPlazoDeGracia: ymd(r.vencimientoSinGracia),
        diasContados: r.diasContados.map(ymd),
        diasSalteados: r.diasSalteados.map((s) => ({ fecha: s.ymd, motivo: s.motivo }))
    };
}

/**
 * Un tramo de dias habiles y otro de corridos: cuando queda firme y cuando hay
 * mora. Son dos cosas distintas y conviene no mezclarlas.
 *
 * El caso que motivo este conector: notificado el 18/6/2026, diez dias habiles
 * del art. 257 CPCCN para que quede firme, y diez corridos del art. 54 de la
 * ley 27.423 para pagar. La mora opera por el solo vencimiento.
 */
export async function moraPorTramos(entrada) {
    const { CJ, P } = await cargar();
    const { anio, mes, dia } = partirFecha(entrada.notificacion, 'La fecha de notificación');
    await CJ.init(ventanaDeAnios(anio));

    const r = P.mora({
        anio, mes, dia,
        diasHabiles: entero(entrada.diasHabiles, 'los días hábiles', { minimo: 1 }),
        diasCorridos: entero(entrada.diasCorridos, 'los días corridos', { minimo: 0, obligatorio: false })
    });

    if (r.problema) return { ok: false, problema: r.problema };

    return {
        ok: true,
        notificacion: ymd(r.notificacion),
        empiezaAContar: ymd(r.inicioHabiles),
        firme: ymd(r.firme),
        empiezanLosCorridos: ymd(r.inicioCorridos),
        vencimiento: ymd(r.vencimiento),
        diasHabiles: r.diasHabiles,
        diasCorridos: r.diasCorridos
    };
}

/** Que anios cubre el calendario hoy, y cuales le faltan. */
export async function cobertura() {
    const { CJ } = await cargar();
    const anios = [];
    for (let y = COBERTURA_DESDE; y <= new Date().getFullYear() + 2; y++) anios.push(y);
    const carga = await CJ.init(anios);

    return {
        ok: true,
        coberturaDesde: CJ.coberturaDesde,
        feriadosCargados: carga.loadedYears,
        feriadosFaltantes: carga.missingYears,
        feriaFaltante: carga.missingFeriaYears,
        // Un anio sin feria bloquea solo los computos que caigan en julio o
        // agosto; uno sin feriados bloquea el anio entero, porque un feriado
        // puede caer en cualquier mes.
        nota: 'La feria de invierno la fija la CSJN por Acordada, normalmente entre abril y junio del mismo año: que falte un año futuro es lo esperable y sólo afecta a los cómputos que caigan en julio o agosto de ese año.'
    };
}

export const HERRAMIENTAS = {
    dia_habil: {
        fn: diaHabil,
        descripcion: 'Dice si una fecha es día hábil judicial y, si no lo es, por qué (fin de semana, feriado, feria, asueto).',
        entrada: { fecha: 'AAAA-MM-DD' }
    },
    siguiente_habil: {
        fn: siguienteHabil,
        descripcion: 'El próximo día hábil judicial posterior a una fecha.',
        entrada: { fecha: 'AAAA-MM-DD' }
    },
    dias_habiles_entre: {
        fn: diasHabilesEntre,
        descripcion: 'Cuántos días hábiles hay entre dos fechas, con el detalle de los inhábiles y su motivo.',
        entrada: { desde: 'AAAA-MM-DD', hasta: 'AAAA-MM-DD' }
    },
    vencimiento: {
        fn: vencimiento,
        descripcion: 'El vencimiento de un plazo en días hábiles, con el plazo de gracia. Modalidad "cedula" (art. 152 CPCCN) o "automatica" (art. 133 CPCCN).',
        entrada: {
            fecha: 'AAAA-MM-DD (la notificación, o la firma si la modalidad es automatica)',
            plazo: 'días hábiles',
            modalidad: '"cedula" | "automatica" (por defecto cedula)',
            ampliacion: 'días de ampliación por distancia, art. 158 CPCCN (opcional)',
            fueraDeHorario: 'true si la cédula se diligenció después de las 20 o antes de las 7 (opcional)',
            notasDejadas: 'lista de AAAA-MM-DD en que se dejó nota en el Libro de Asistencia (opcional)'
        }
    },
    mora: {
        fn: moraPorTramos,
        descripcion: 'Un tramo de días hábiles y otro de corridos desde una notificación: cuándo queda firme y cuándo hay mora.',
        entrada: {
            notificacion: 'AAAA-MM-DD',
            diasHabiles: 'días hábiles del primer tramo (p. ej. 10, art. 257 CPCCN)',
            diasCorridos: 'días corridos del segundo tramo (p. ej. 10, art. 54 ley 27.423)'
        }
    },
    cobertura: {
        fn: cobertura,
        descripcion: 'Qué años cubre el calendario judicial hoy y cuáles le faltan.',
        entrada: {}
    }
};
