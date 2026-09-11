// Banco de pruebas del computo de plazos extraido a calculadoras/js/plazos.js.
//
// Que cubre y que NO:
//
//   - Cubre EL MOTOR extraido: la aritmetica de vencimiento y de mora, la
//     notificacion automatica y los dias de nota.
//   - NO cubre las pantallas. La comparacion contra las calculadoras publicadas
//     --que son la referencia a preservar y quedaron sin tocar-- vive en
//     scripts/pruebas-calculadoras.html, que las maneja por iframe. Este script
//     corre en Node y en CI; aquel necesita un navegador.
//
// Por que existe: plazos.js es una TRANSCRIPCION de codigo que vivia adentro de
// vencimientos.html y de mora.html. Una transcripcion no puede mover un numero,
// y "no puede" sin una prueba es una intencion. Cada REGRESION de abajo lleva el
// caso concreto con el resultado que la pantalla produce hoy.
//
// Correr con: npm run verificar-plazos

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');

let fallos = 0;
let pruebas = 0;

function ok(condicion, descripcion, detalle) {
    pruebas++;
    if (condicion) return;
    fallos++;
    console.log(`  FALLA  ${descripcion}`);
    if (detalle) console.log(`         ${detalle}`);
}

function igual(obtenido, esperado, descripcion) {
    ok(obtenido === esperado, descripcion, `esperado ${esperado}, obtenido ${obtenido}`);
}

const d = (fecha) => fecha.toISOString().slice(0, 10);

// ---------------------------------------------------------------------------
// Carga de los dos motores.
//
// Los dos son IIFE de navegador: cuelgan su API de `window` y calendario-judicial
// pide los JSON con `fetch` sobre rutas relativas a calculadoras/. Se les arma
// ese entorno con lo minimo y se lee el disco en lugar de la red, igual que en
// verificar-calculos.mjs. El orden importa: plazos.js necesita el calendario ya
// colgado de `window`.
// ---------------------------------------------------------------------------
async function cargarMotores() {
    const ventana = {};
    const fetchLocal = async (url) => {
        const limpia = String(url).split('?')[0].replace(/^\.\.\//, '');
        const texto = await readFile(join(RAIZ, limpia), 'utf8');
        return { ok: true, status: 200, json: async () => JSON.parse(texto) };
    };

    for (const archivo of ['calendario-judicial.js', 'plazos.js']) {
        const fuente = await readFile(join(RAIZ, 'calculadoras', 'js', archivo), 'utf8');
        new Function('window', 'fetch', fuente)(ventana, fetchLocal);
    }

    if (!ventana.CalendarioJudicial) throw new Error('calendario-judicial.js no publico window.CalendarioJudicial');
    if (!ventana.Plazos) throw new Error('plazos.js no publico window.Plazos');

    return { CJ: ventana.CalendarioJudicial, P: ventana.Plazos };
}

const { CJ, P } = await cargarMotores();
const carga = await CJ.init([2021, 2022, 2023, 2024, 2025, 2026, 2027]);
if (carga.loadError && carga.missingYears.length) {
    console.log(`  AVISO  faltan los feriados de ${carga.missingYears.join(', ')}`);
}

console.log('Verificando el computo de plazos...\n');

// ---------------------------------------------------------------------------
// REGRESION: el caso con el que pipeline-drafter pidio este motor.
//
// Es la cadena entera de un recurso extraordinario y esta verificada contra una
// resolucion real: notificacion 18/6/2026, diez dias habiles del art. 257 CPCCN
// para que quede firme, y diez corridos del art. 54 de la ley 27.423 para pagar.
// Si alguno de estos tres numeros se mueve, se rompio la extraccion.
// ---------------------------------------------------------------------------
console.log('Mora: la cadena del art. 257 CPCCN + art. 54 ley 27.423');
{
    const m = P.mora({ anio: 2026, mes: 6, dia: 18, diasHabiles: 10, diasCorridos: 10 });
    igual(d(m.firme), '2026-07-02', 'diez dias habiles desde el 18/6/2026');
    igual(d(m.inicioCorridos), '2026-07-03', 'queda firme el habil siguiente');
    igual(d(m.vencimiento), '2026-07-12', 'diez corridos mas: la mora opera el 12/7/2026');
    igual(m.problema, null, 'el computo no toco ningun anio sin datos');
}

// ---------------------------------------------------------------------------
// INVARIANTES de mora: ciertos siempre, con cualquier fecha.
// ---------------------------------------------------------------------------
console.log('\nMora: invariantes');
{
    // El salto de entrada es uno si la notificacion cae habil y dos si cae
    // inhabil. Es la frase que el comentario de mora.html deja escrita, y es lo
    // que la extraccion no podia perder.
    const habil = P.mora({ anio: 2026, mes: 6, dia: 18, diasHabiles: 1, diasCorridos: 0 });
    ok(CJ.esDiaHabil(new Date(2026, 5, 18)), 'el 18/6/2026 es habil');
    igual(d(habil.inicioHabiles), '2026-06-19', 'notificado en dia habil, cuenta desde el habil siguiente');

    const inhabil = P.mora({ anio: 2026, mes: 6, dia: 20, diasHabiles: 1, diasCorridos: 0 });
    ok(!CJ.esDiaHabil(new Date(2026, 5, 20)), 'el 20/6/2026 es sabado');
    igual(d(inhabil.inicioHabiles), '2026-06-23', 'notificado en inhabil, dos saltos: al habil y al siguiente');

    // Cero dias corridos: el vencimiento es el dia anterior al inicio del tramo,
    // que es el mismo dia en que quedo firme. Es consecuencia del conteo
    // inclusivo y se fija para que nadie lo "arregle".
    const sinCorridos = P.mora({ anio: 2026, mes: 6, dia: 18, diasHabiles: 10, diasCorridos: 0 });
    igual(d(sinCorridos.vencimiento), d(sinCorridos.firme), 'con cero corridos el vencimiento es el dia en que quedo firme');
}

// ---------------------------------------------------------------------------
// INVARIANTES de vencimiento por cedula.
// ---------------------------------------------------------------------------
console.log('\nVencimiento por cedula');
{
    const v = P.vencimiento({ modalidad: 'cedula', anio: 2026, mes: 6, dia: 18, plazo: 10 });
    igual(d(v.fechaNotificacion), '2026-06-18', 'dia habil y hora habil: practicada ese mismo dia');
    igual(d(v.fechaInicioConteo), '2026-06-19', 'el plazo corre desde el habil siguiente');
    igual(v.diasContados.length, 10, 'se contaron diez dias habiles');
    ok(v.diasContados.every((f) => CJ.esDiaHabil(f)), 'todos los dias contados son habiles');
    ok(CJ.esDiaHabil(v.vencimiento), 'el vencimiento nunca cae en un dia inhabil');

    // El sabado a las 23 hs. suma UN dia, no dos. Los dos supuestos --dia
    // inhabil y hora inhabil-- son el mismo y no se acumulan. Hasta el 17/8/2026
    // el desplegable dejaba elegir las dos cosas juntas y elegir "habil" un
    // sabado devolvia el vencimiento un dia antes.
    const sabadoEnHora = P.vencimiento({ modalidad: 'cedula', anio: 2026, mes: 6, dia: 20, plazo: 10 });
    const sabadoFuera = P.vencimiento({ modalidad: 'cedula', anio: 2026, mes: 6, dia: 20, plazo: 10, fueraDeHorario: true });
    igual(d(sabadoFuera.vencimiento), d(sabadoEnHora.vencimiento), 'sabado: la hora no acumula un segundo salto');

    // Fuera de horario en dia habil si desplaza, y desplaza exactamente un habil.
    const enHora = P.vencimiento({ modalidad: 'cedula', anio: 2026, mes: 6, dia: 18, plazo: 10 });
    const fuera = P.vencimiento({ modalidad: 'cedula', anio: 2026, mes: 6, dia: 18, plazo: 10, fueraDeHorario: true });
    igual(d(fuera.fechaNotificacion), d(CJ.siguienteDiaHabil(enHora.fechaNotificacion)),
        'dia habil fuera de hora: practicada el habil siguiente');
}

// ---------------------------------------------------------------------------
// La ampliacion del art. 158 CPCCN suma dias HABILES, no corridos.
//
// Es la distincion que el comentario de vencimientos.html deja escrita: se suma
// al PLAZO y la cuenta el mismo bucle, asi que salta feria, feriados y fines de
// semana como los demas. Sumarla sobre la fecha ya calculada serian corridos y
// daria una fecha anterior.
// ---------------------------------------------------------------------------
console.log('\nAmpliacion por distancia (art. 158 CPCCN)');
{
    const sin = P.vencimiento({ modalidad: 'cedula', anio: 2026, mes: 6, dia: 18, plazo: 10 });
    const con = P.vencimiento({ modalidad: 'cedula', anio: 2026, mes: 6, dia: 18, plazo: 10, ampliacion: 3 });

    igual(con.plazoTotal, 13, 'la ampliacion se suma al plazo');
    igual(con.diasContados.length, 13, 'y la cuenta el mismo bucle');
    ok(con.vencimiento > sin.vencimiento, 'con ampliacion el vencimiento es posterior');
    ok(CJ.esDiaHabil(con.vencimiento), 'el vencimiento ampliado tampoco cae en inhabil');

    // La prueba de que son habiles y no corridos: tres dias corridos sobre la
    // fecha sin ampliar dan una fecha distinta de la ampliada, salvo que los
    // tres dias siguientes sean todos habiles. Se elige un caso donde no lo son.
    const corridos = new Date(sin.vencimiento);
    corridos.setDate(corridos.getDate() + 3);
    ok(d(con.vencimiento) !== d(corridos) || con.diasSalteados.length === sin.diasSalteados.length,
        'la ampliacion no se sumo como dias corridos');

    const cero = P.vencimiento({ modalidad: 'cedula', anio: 2026, mes: 6, dia: 18, plazo: 10, ampliacion: 0 });
    igual(d(cero.vencimiento), d(sin.vencimiento), 'ampliacion 0 es lo mismo que no ampliar');
}

// ---------------------------------------------------------------------------
// Notificacion automatica (art. 133 CPCCN): los dias de nota.
// ---------------------------------------------------------------------------
console.log('\nNotificacion automatica (art. 133 CPCCN)');
{
    // Sea cual sea el dia de la firma, la notificacion cae en un dia de nota
    // habil: martes o viernes. Se recorre un anio entero.
    let malos = 0;
    for (let i = 0; i < 365; i++) {
        const firma = new Date(Date.UTC(2026, 0, 1 + i, 12));
        const notif = P.notificacionAutomatica(firma);
        const dia = notif.getDay();
        if ((dia !== 2 && dia !== 5) || !CJ.esDiaHabil(notif)) malos++;
    }
    igual(malos, 0, 'la notificacion automatica siempre cae en martes o viernes habil');

    // Dejar nota corre la notificacion al proximo dia de nota.
    const sinNota = P.vencimiento({ modalidad: 'automatica', anio: 2026, mes: 6, dia: 18, plazo: 10 });
    const conNota = P.vencimiento({
        modalidad: 'automatica', anio: 2026, mes: 6, dia: 18, plazo: 10,
        notasDejadas: [d(sinNota.fechaNotificacion)]
    });
    ok(conNota.fechaNotificacion > sinNota.fechaNotificacion,
        'la nota en el libro corre la notificacion al proximo dia de nota');
    const diaNota = conNota.fechaNotificacion.getDay();
    ok(diaNota === 2 || diaNota === 5, 'y el dia corrido tambien es dia de nota');

    const par = P.parDeNotas(new Date(Date.UTC(2026, 5, 18, 12)));
    igual(par.length, 2, 'el par de dias de nota trae dos fechas');
    ok(par[1] > par[0], 'y en orden');
}

// ---------------------------------------------------------------------------
// La guarda de datos faltantes se hereda entera.
//
// Es lo que separa a este motor de una calculadora cualquiera: si el computo
// toca un anio cuya Acordada de feria no se dicto, o cuyos feriados no estan
// cargados, `problema` deja de ser null y la fecha NO se puede afirmar.
//
// Y la guarda es fina, no gruesa: un computo de febrero de 2027 no depende de la
// Acordada de la feria de invierno de 2027, asi que calcula. Bloquear el anio
// entero dejaria la herramienta muerta esperando un acto que no se dicto.
// ---------------------------------------------------------------------------
console.log('\nLa guarda de datos faltantes');
{
    const feriaFaltante = carga.missingFeriaYears;

    if (feriaFaltante.includes(2027)) {
        const febrero = P.vencimiento({ modalidad: 'cedula', anio: 2027, mes: 2, dia: 15, plazo: 10 });
        igual(febrero.problema, null, 'febrero de 2027 calcula: no toca la feria de invierno');

        const cruzaJulio = P.vencimiento({ modalidad: 'cedula', anio: 2027, mes: 6, dia: 15, plazo: 30 });
        ok(cruzaJulio.problema !== null, 'un computo que cruza a julio de 2027 no afirma una fecha');
        ok(/feria judicial de invierno/.test(cruzaJulio.problema || ''),
            'y el motivo nombra la feria', cruzaJulio.problema);
    } else {
        console.log('  (la feria de 2027 ya esta cargada: esta seccion se saltea)');
    }

    // Un anio sin feriados cargados bloquea el anio ENTERO, no solo julio, y eso
    // es correcto: un feriado puede caer en cualquier mes. Es la diferencia con
    // la feria, y es la razon por la que data/feriados.json hay que mantenerlo
    // al dia: cuando se quede corto, la herramienta se congela para ese anio.
    const anioSinDatos = Math.max(...carga.loadedYears) + 1;
    const lejos = P.vencimiento({ modalidad: 'cedula', anio: anioSinDatos, mes: 3, dia: 10, plazo: 5 });
    ok(lejos.problema !== null, `marzo de ${anioSinDatos} no afirma una fecha: faltan los feriados`);
}

// ---------------------------------------------------------------------------
// CADUCIDAD DE INSTANCIA (art. 310 CPCCN)
//
// Es un plazo en MESES: se cuenta de fecha a fecha (art. 6 CCyC) y los dias
// inhabiles corren adentro salvo los de feria (art. 311 CPCCN). No comparte
// una linea con vencimiento().
//
// Las fechas esperadas de abajo NO salen de este motor: son las que
// caducidad.html mostraba en pantalla ANTES de la extraccion, capturadas el
// 26/8/2026 contra el sitio servido sobre una matriz de 1132 casos --seis
// anios por doce meses por cuatro dias por cuatro plazos--. La matriz entera
// dio identica despues de migrar; esto guarda los testigos para que una
// diferencia futura falle en CI y no dentro de un navegador que nadie abrio.
//
// Las fechas se comparan en huso local y no con toISOString(): caducidad
// construye la fecha con new Date(y, m - 1, d), que es medianoche local, y en
// un huso al este de Greenwich toISOString() devolveria el dia anterior.
// ---------------------------------------------------------------------------
console.log('\nCaducidad de instancia (art. 310 CPCCN)');
{
    const dl = (fecha) =>
        `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;

    const cad = (dia, mes, anio, meses) => P.caducidad({ anio, mes, dia, meses });

    // --- Los testigos de la pantalla ---------------------------------------
    const testigos = [
        // inicio            meses  ordinario     con inhabiles (no se muestra)
        [[1, 1, 2021], 6, '2021-07-01', '2021-07-12'],
        [[1, 7, 2025], 1, '2025-08-13', '2025-08-14'],
        [[15, 7, 2025], 1, '2025-08-27', '2025-08-29'],
        [[28, 7, 2025], 1, '2025-09-02', '2025-09-04'],
        [[28, 2, 2025], 6, '2025-09-09', '2025-09-23'],
        [[15, 12, 2025], 1, '2026-02-15', '2026-02-20'],
        [[28, 12, 2025], 3, '2026-04-28', '2026-05-08'],
        [[31, 12, 2025], 3, '2026-04-30', '2026-05-11'],
        [[1, 6, 2026], 1, '2026-07-01', '2026-07-03'],
        [[15, 6, 2026], 3, '2026-09-27', '2026-10-01'],
    ];

    for (const [[dia, mes, anio], meses, esperado] of testigos) {
        const r = cad(dia, mes, anio, meses);
        igual(r.problema, null, `${dia}/${mes}/${anio} a ${meses} mes(es) calcula`);
        igual(dl(r.vencimiento), esperado, `${dia}/${mes}/${anio} a ${meses} mes(es) vence el ${esperado}`);
    }

    // --- REGRESION: el ancla del dia no se arrastra (bug del 18/8/2026) -----
    //
    // Se avanzaba mutando la misma fecha, asi que al pasar por febrero quedaba
    // clavada en 28 y los tramos siguientes salian de ahi. Un ultimo acto del
    // 28, 29, 30 o 31 de diciembre daba los cuatro la MISMA caducidad, y
    // siempre antes de lo que corresponde: impulsar el 31 no compraba nada
    // respecto de impulsar el 28.
    const finDeDiciembre = [28, 29, 30, 31].map((dia) => dl(cad(dia, 12, 2025, 3).vencimiento));
    igual(finDeDiciembre.join(' '), '2026-04-28 2026-04-29 2026-04-30 2026-04-30',
        'el ancla no se arrastra: el 28, el 29 y el 30 de diciembre dan tres fechas distintas',
        finDeDiciembre.join(' '));
    // El 30 y el 31 SI coinciden, y no es el bug: abril no tiene 31, asi que el
    // art. 6 CCyC hace expirar el tramo el ultimo dia del mes. Lo que el bug
    // producia era que los CUATRO coincidieran, y en febrero.
    ok(finDeDiciembre.every((f, i) => i === 0 || f >= finDeDiciembre[i - 1]),
        'y en orden: impulsar mas tarde no adelanta la caducidad', finDeDiciembre.join(' '));

    // Febrero sigue siendo el mes que acorta el tramo que cae en el, y solo ese:
    // el art. 6 CCyC hace expirar en el ultimo dia del mes cuando no hay dia
    // equivalente.
    igual(dl(cad(31, 1, 2025, 1).vencimiento), '2025-02-28',
        'el 31 de enero a un mes vence el ultimo dia de febrero');
    igual(dl(cad(31, 1, 2025, 2).vencimiento), '2025-03-31',
        'y a dos meses vuelve al 31: el ancla no se perdio en febrero');

    // --- Enero no computa ---------------------------------------------------
    const cruzaEnero = cad(15, 12, 2025, 1);
    ok(cruzaEnero.eneroExcluido.includes(2026),
        'un plazo que caeria en enero lo saltea y lo dice', JSON.stringify(cruzaEnero.eneroExcluido));
    igual(cad(15, 12, 2025, 1).corrimientos, 2,
        'saltear enero cuesta un corrimiento de mas');

    // --- La feria de invierno se descuenta y se dice cuanto ------------------
    const conFeria = cad(1, 7, 2025, 1);
    igual(conFeria.feriaAtravesada.length, 1, 'una sola feria atravesada');
    igual(conFeria.feriaAtravesada[0].dias, 12, 'y son los doce dias de la feria de 2025');
    igual(conFeria.feriaAtravesada[0].anio, 2025, 'anotada bajo su anio');

    // Un inicio DENTRO de la feria solo descuenta los dias que quedan.
    igual(cad(28, 7, 2025, 1).feriaAtravesada[0].dias, 5,
        'empezando dentro de la feria se descuentan solo los dias que restan');

    // --- INVARIANTE: el vencimiento nunca cae en feria (bug del 5/8/2026) ----
    //
    // Sin iterar a punto fijo, un vencimiento nominal que cayera DENTRO de la
    // feria sumaba solo los dias solapados y quedaba igual adentro. Fallaba en
    // el 3,7 % de los cruces. Se barre un anio entero por seis plazos.
    {
        let enInvierno = 0;
        let enEnero = 0;
        let mirados = 0;
        let ejemploInvierno = null;
        let ejemploEnero = null;
        for (let mes = 1; mes <= 12; mes++) {
            const ultimo = new Date(2025, mes, 0).getDate();
            for (let dia = 1; dia <= ultimo; dia++) {
                for (let meses = 1; meses <= 6; meses++) {
                    const r = cad(dia, mes, 2025, meses);
                    if (r.problema) continue;
                    mirados++;
                    if (CJ.esFeriaJudicial(r.vencimiento)) {
                        enInvierno++;
                        if (!ejemploInvierno) ejemploInvierno = `${dia}/${mes}/2025 a ${meses} mes(es) -> ${dl(r.vencimiento)}`;
                    }
                    if (CJ.esFeriaEnero(r.vencimiento)) {
                        enEnero++;
                        if (!ejemploEnero) ejemploEnero = `${dia}/${mes}/2025 a ${meses} mes(es) -> ${dl(r.vencimiento)}`;
                    }
                }
            }
        }
        ok(mirados > 2000, `el barrido miro ${mirados} cruces de fecha por plazo`);
        igual(enInvierno, 0, 'ningun vencimiento de caducidad cae en la feria de invierno', ejemploInvierno);
        igual(enEnero, 0, 'ni en la feria de enero', ejemploEnero);
    }

    // --- REGRESION: el vencimiento empujado adentro de enero (26/8/2026) ----
    //
    // El salteo de enero miraba si el TRAMO termina en enero, o sea el
    // vencimiento NOMINAL, y no volvia a mirar despues de correrlo por los dias
    // de la feria de invierno. Un tramo que terminaba en diciembre no pasaba por
    // el salteo --diciembre no es enero-- y los dias de feria lo empujaban
    // adentro de enero, que no computa. Eran 67 de 10.956 cruces entre 2021 y
    // 2025, de dos formas: seis meses desde fines de junio, o cinco desde fines
    // de julio.
    //
    // El caso lo trajo Javier: 21/6/2025, seis meses. Ahora se corre un mes
    // respetando el ancla, que es el MISMO corrimiento que ya hacia el salteo de
    // los tramos.
    {
        igual(dl(cad(21, 6, 2025, 6).vencimiento), '2026-02-02',
            'el caso de Javier: 21/6/2025 a seis meses vence el 2/2/2026 y no el 2/1');
        igual(dl(cad(25, 6, 2025, 6).vencimiento), '2026-02-06',
            'y el testigo con el inicio lejos de toda feria');
        igual(dl(cad(21, 7, 2025, 5).vencimiento), '2026-02-02',
            'cinco meses desde el 21/7/2025, que es la otra forma que tomaba el bug');
        igual(dl(cad(21, 7, 2025, 6).vencimiento), '2026-03-05',
            'y el que ya salia bien porque el tramo caia en enero no se movio');

        // El corrimiento se dice, porque explica un mes entero de diferencia.
        const corrido = cad(21, 6, 2025, 6);
        ok(corrido.corridoDeEnero !== null, 'el motor avisa que corrio el vencimiento');
        igual(corrido.corridoDeEnero.anio, 2026, 'y de que enero lo saco');
        igual(cad(21, 7, 2025, 6).corridoDeEnero, null,
            'y no avisa nada cuando no hubo que correr nada');

        // DERIVACION INDEPENDIENTE, que es lo que hace que esto no sea el motor
        // dandose la razon solo: se corre el plazo dia por dia desde el inicio,
        // salteando TODO dia de feria --de invierno y de enero-- hasta juntar
        // los dias que van de fecha a fecha (art. 6 CCyC). Es el art. 311 leido
        // literal, escrito aparte y con otra forma.
        const literal = (dia, mes, anio, meses) => {
            const inicio = new Date(anio, mes - 1, dia);
            const m = new Date(anio, mes - 1 + meses, 1);
            const ultimo = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
            const nominal = new Date(m.getFullYear(), m.getMonth(), Math.min(dia, ultimo));
            const necesarios = Math.round((nominal - inicio) / 86400000);
            let corridos = 0;
            const cursor = new Date(inicio);
            while (corridos < necesarios) {
                cursor.setDate(cursor.getDate() + 1);
                if (CJ.esFeriaJudicial(cursor) || CJ.esFeriaEnero(cursor)) continue;
                corridos++;
            }
            return cursor;
        };
        igual(dl(literal(21, 6, 2025, 6)), '2026-02-02',
            'contando dia por dia y salteando toda feria se llega a la misma fecha');

        // Y sobre los casos que el arreglo movio: coincide con ese conteo
        // siempre que el acto impulsor NO caiga adentro de la feria. Los que
        // caen adentro difieren en un dia, y eso depende de si el propio dia de
        // inicio cuenta como dia de feria: es otra pregunta y sigue abierta.
        let coinciden = 0;
        let difieren = 0;
        let difierenConInicioLimpio = 0;
        for (const [dia, mes, anio, meses] of [
            [20, 6, 2025, 6], [21, 6, 2025, 6], [25, 6, 2025, 6], [30, 6, 2025, 6],
            [21, 7, 2025, 5], [25, 7, 2025, 5], [31, 7, 2025, 5],
            [20, 6, 2021, 6], [26, 6, 2023, 6],
        ]) {
            const inicioEnFeria = CJ.esFeriaJudicial(new Date(anio, mes - 1, dia));
            if (dl(cad(dia, mes, anio, meses).vencimiento) === dl(literal(dia, mes, anio, meses))) coinciden++;
            else {
                difieren++;
                if (!inicioEnFeria) difierenConInicioLimpio++;
            }
        }
        ok(coinciden > 0 && difieren > 0, `${coinciden} coinciden con el conteo literal y ${difieren} no`);
        igual(difierenConInicioLimpio, 0,
            'y los que no coinciden son todos de actos impulsores que caen adentro de la feria');
    }

    // --- La guarda de datos faltantes ---------------------------------------
    //
    // El calculo ordinario NO pasa por esDiaHabil --pregunta por los rangos de
    // feria directo-- asi que la auditoria del calendario no se entera. La
    // guarda es propia y este es el agujero del 17/8/2026: existia y jamas
    // disparaba.
    if (carga.missingFeriaYears.includes(2027)) {
        const toca2027 = cad(15, 8, 2026, 6);
        ok(toca2027.problema !== null, 'un plazo que alcanza 2027 no afirma una fecha');
        ok(/feria judicial de invierno/.test(toca2027.problema || ''),
            'y el motivo nombra la feria', toca2027.problema);
    } else {
        console.log('  (la feria de 2027 ya esta cargada: la guarda se saltea)');
    }
}

// ---------------------------------------------------------------------------
// DIAS ENTRE DOS FECHAS
//
// La unica de las cinco que no computa un vencimiento: cuenta. Los totales de
// abajo son los que entre-fechas.html mostraba antes de la extraccion,
// capturados el 26/8/2026 sobre una matriz de 4608 casos --seis anios por doce
// meses por dos dias por cuatro distancias por las cuatro combinaciones de
// puntas por habiles y corridos--, que dio identica despues de migrar.
// ---------------------------------------------------------------------------
console.log('\nDias entre dos fechas');
{
    const dl = (fecha) =>
        `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;

    const entre = (desde, hasta, opts = {}) =>
        P.entreFechas({
            desde: { anio: desde[2], mes: desde[1], dia: desde[0] },
            hasta: { anio: hasta[2], mes: hasta[1], dia: hasta[0] },
            incluirInicio: opts.incluirInicio !== false,
            incluirFin: opts.incluirFin !== false,
            soloHabiles: !!opts.soloHabiles,
        });

    // --- Los testigos de la pantalla ---------------------------------------
    igual(entre([15, 7, 2025], [14, 8, 2025], { soloHabiles: true }).total, 13,
        'del 15/7 al 14/8/2025, habiles: la feria de 2025 se come doce dias');
    igual(entre([15, 6, 2026], [13, 10, 2026], { soloHabiles: true }).total, 72,
        'del 15/6 al 13/10/2026, habiles');
    igual(entre([1, 12, 2025], [31, 3, 2026], { soloHabiles: true }).total, 57,
        'del 1/12/2025 al 31/3/2026, habiles: enero entero no aporta ninguno');
    igual(entre([1, 1, 2021], [31, 1, 2021], { soloHabiles: true }).total, 0,
        'enero entero de 2021 no tiene un solo dia habil');
    igual(entre([14, 7, 2024], [31, 7, 2024], { soloHabiles: true }).total, 3,
        'del 14 al 31/7/2024, habiles: quedan el 29, el 30 y el 31');
    igual(entre([2, 1, 2026], [28, 2, 2026], { soloHabiles: true }).total, 18,
        'del 2/1 al 28/2/2026, habiles');
    igual(entre([2, 1, 2026], [28, 2, 2026]).total, 58,
        'los mismos dias, corridos: cuenta las dos puntas');

    // --- Las puntas ---------------------------------------------------------
    igual(entre([1, 1, 2026], [31, 1, 2026], { incluirInicio: false, incluirFin: false }).total, 29,
        'sin las dos puntas, enero de 2026 da 29 dias corridos');
    igual(dl(entre([1, 1, 2026], [31, 1, 2026], { incluirInicio: false }).desdeEfectivo), '2026-01-02',
        'y el conteo arranca el 2, que es lo que la pantalla muestra');
    igual(entre([10, 3, 2026], [10, 3, 2026]).total, 1,
        'la misma fecha con las dos puntas es un dia');
    igual(entre([10, 3, 2026], [10, 3, 2026], { incluirInicio: false }).total, 0,
        'y sin una punta, ninguno');

    // --- INVARIANTES --------------------------------------------------------
    //
    // El conteo de corridos es aritmetica de calendario y tiene que dar exacto;
    // el de habiles no puede superarlo, y cada dia del tramo esta contado o
    // excluido, sin un tercer estado.
    {
        let mal = 0;
        let mirados = 0;
        let ejemplo = null;
        for (let mes = 1; mes <= 12; mes++) {
            for (const dia of [1, 9, 17, 25]) {
                for (const salto of [0, 1, 13, 60, 200]) {
                    for (const ini of [true, false]) {
                        for (const fin of [true, false]) {
                            const desde = new Date(2025, mes - 1, dia);
                            const hasta = new Date(desde);
                            hasta.setDate(hasta.getDate() + salto);
                            const arg = [
                                [desde.getDate(), desde.getMonth() + 1, desde.getFullYear()],
                                [hasta.getDate(), hasta.getMonth() + 1, hasta.getFullYear()],
                            ];
                            const corridos = entre(arg[0], arg[1], { incluirInicio: ini, incluirFin: fin });
                            const habiles = entre(arg[0], arg[1], { incluirInicio: ini, incluirFin: fin, soloHabiles: true });
                            mirados++;
                            const esperado = Math.max(0, salto + 1 - (ini ? 0 : 1) - (fin ? 0 : 1));
                            const rotulo = `${dia}/${mes}/2025 +${salto} ini=${ini} fin=${fin}`;
                            if (corridos.total !== esperado ||
                                habiles.total > corridos.total ||
                                habiles.total + habiles.excluidos.length !== corridos.total) {
                                mal++;
                                if (!ejemplo) ejemplo = `${rotulo}: corridos ${corridos.total} (esperado ${esperado}), habiles ${habiles.total}, excluidos ${habiles.excluidos.length}`;
                            }
                        }
                    }
                }
            }
        }
        ok(mirados > 900, `el barrido miro ${mirados} tramos`);
        igual(mal, 0, 'los corridos dan la cuenta exacta y cada dia esta contado o excluido', ejemplo);
    }

    // Los dias corridos no dependen del calendario, asi que se contestan
    // igual cuando falta un anio. Es la unica de las cinco que puede.
    const lejos = Math.max(...carga.loadedYears) + 1;
    igual(entre([1, 3, lejos], [10, 3, lejos]).problema, null,
        `un tramo de ${lejos} se cuenta en corridos aunque falten sus feriados`);
    ok(entre([1, 3, lejos], [10, 3, lejos], { soloHabiles: true }).problema !== null,
        'y el mismo tramo en habiles no afirma un numero');
}

// ---------------------------------------------------------------------------
// PLAZO REGRESIVO: N dias habiles hacia atras
//
// Contesta al reves: hasta cuando hay tiempo para algo que tiene que estar N
// dias habiles antes de una fecha. Los testigos son los de la pantalla, de la
// matriz de 864 casos del 26/8/2026, que dio identica despues de migrar.
// ---------------------------------------------------------------------------
console.log('\nPlazo regresivo');
{
    const dl = (fecha) =>
        `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
    const atras = (dia, mes, anio, dias) => P.regresiva({ anio, mes, dia, dias });

    igual(dl(atras(15, 7, 2025, 15).fechaLimite), '2025-06-23',
        'quince habiles antes del 15/7/2025');
    igual(dl(atras(15, 3, 2024, 5).fechaLimite), '2024-03-08',
        'cinco habiles antes del 15/3/2024');
    igual(dl(atras(1, 12, 2025, 40).fechaLimite), '2025-10-01',
        'cuarenta habiles antes del 1/12/2025');

    // Enero entero no aporta ninguno. Va como invariante y no como testigo: los
    // dias que la matriz de captura barrio --1, 15 y 28-- caen todos en fin de
    // semana en febrero y marzo de 2026, asi que no hay ningun objetivo de esos
    // meses con un valor capturado de la pantalla. Un testigo que salga de una
    // corrida que NO calculo es peor que ninguno: fue exactamente el error de
    // este bloque en su primera version, que copio 1/2/2026 sin ver que es
    // domingo y se llevo el resultado del caso anterior, que habia quedado en
    // el DOM.
    {
        const cruzaEnero = atras(2, 2, 2026, 40);
        igual(cruzaEnero.objetivoInhabil, null, 'el 2/2/2026 es habil, asi que el caso calcula');
        igual(cruzaEnero.evaluados.filter((e) => e.fecha.getMonth() === 0 && e.contado).length, 0,
            'contando hacia atras, ningun dia de enero se cuenta');
        ok(cruzaEnero.evaluados.some((e) => e.fecha.getMonth() === 0),
            'y sin embargo el conteo atraviesa enero entero');
    }
    igual(dl(atras(28, 2, 2024, 15).fechaLimite), '2024-02-05',
        'quince habiles antes del 28/2/2024, con el carnaval en el medio');
    igual(dl(atras(30, 7, 2024, 5).fechaLimite), '2024-07-08',
        'cinco habiles antes del 30/7/2024: la feria 15 al 26 se los come');
    igual(dl(atras(10, 3, 2026, 15).fechaLimite), '2026-02-13',
        'quince habiles antes del 10/3/2026');

    // Un objetivo inhabil no se calcula: se dice por que. No es un error, es
    // una respuesta, y por eso no lanza.
    const enFeria = atras(4, 1, 2022, 5);
    igual(enFeria.fechaLimite, null, 'un objetivo en feria de enero no devuelve fecha');
    ok(/[Ff]eria/.test(enFeria.objetivoInhabil || ''), 'y dice que es feria', enFeria.objetivoInhabil);
    igual(atras(15, 3, 2025, 5).objetivoInhabil, 'Fin de semana',
        'un objetivo en fin de semana tampoco, y lo dice');

    // --- INVARIANTES --------------------------------------------------------
    {
        let mal = 0;
        let mirados = 0;
        let ejemplo = null;
        for (let mes = 1; mes <= 12; mes++) {
            for (let dia = 1; dia <= 28; dia++) {
                for (const dias of [1, 3, 10, 25]) {
                    const r = atras(dia, mes, 2025, dias);
                    if (r.problema || r.objetivoInhabil) continue;
                    mirados++;
                    const contados = r.evaluados.filter((e) => e.contado).length;
                    const ultimo = r.evaluados[r.evaluados.length - 1];
                    const rotulo = `${dia}/${mes}/2025 x${dias}`;
                    if (contados !== dias ||
                        !CJ.esDiaHabil(r.fechaLimite) ||
                        r.fechaLimite >= r.objetivo ||
                        !ultimo.contado ||
                        dl(ultimo.fecha) !== dl(r.fechaLimite)) {
                        mal++;
                        if (!ejemplo) ejemplo = `${rotulo}: contados ${contados}, limite ${dl(r.fechaLimite)}`;
                    }
                }
            }
        }
        ok(mirados > 700, `el barrido miro ${mirados} objetivos habiles`);
        igual(mal, 0,
            'se cuentan exactamente los dias pedidos, el limite es habil, anterior al objetivo, y es el ultimo contado',
            ejemplo);

        // Pedir un dia mas nunca puede dar una fecha posterior.
        let rompen = 0;
        for (let mes = 1; mes <= 12; mes++) {
            const a = atras(15, mes, 2025, 5);
            const b = atras(15, mes, 2025, 6);
            if (a.fechaLimite && b.fechaLimite && b.fechaLimite >= a.fechaLimite) rompen++;
        }
        igual(rompen, 0, 'un dia mas de antelacion siempre corre el limite hacia atras');
    }

    // --- REGRESION: contar hacia atras no se sale de la cobertura en silencio -
    //
    // Hasta el 26/8/2026 la guarda se leia SOLO sobre la fecha objetivo y antes
    // del bucle, asi que un conteo que retrocedia a un anio fuera de la ventana
    // no la volvia a consultar. El caso, verificado en pantalla antes de
    // arreglarlo: objetivo 4/2/2021 con 40 dias de antelacion contestaba
    // 10/11/2020, sin un solo aviso, y de 2020 no estan cargados ni los
    // feriados nacionales ni los asuetos --y encadeno once ferias
    // extraordinarias--. O sea que dias que fueron inhabiles se contaban como
    // habiles y el plazo arrancaba mas tarde de lo que arranca.
    {
        const cruzaAtras = atras(4, 2, 2021, 40);
        ok(cruzaAtras.problema !== null,
            'un conteo que retrocede fuera de la ventana de cobertura no afirma una fecha');
        ok(/anterior/.test(cruzaAtras.problema || ''),
            'y el motivo dice que el anio es anterior a la cobertura', cruzaAtras.problema);
        igual(cruzaAtras.fechaLimite, null, 'y no devuelve fecha, que es lo que veria un conector');
        ok(CJ.coberturaDesde > 2020,
            `2020 esta fuera de la ventana, que arranca en ${CJ.coberturaDesde}`);

        // Y la guarda es FINA, no gruesa: se niega el conteo que se sale, no el
        // anio entero. Un objetivo de marzo de 2021 con quince dias no llega a
        // 2020 y calcula igual.
        const noSeSale = atras(1, 3, 2021, 15);
        igual(noSeSale.problema, null, 'un conteo de 2021 que no llega a 2020 sigue calculando');
        igual(dl(noSeSale.fechaLimite), '2021-02-04', 'y da la misma fecha que antes del arreglo');

        // El barrido que fija el alcance: lo unico que dejo de contestar es lo
        // que antes contestaba una fecha anterior a la cobertura. Ni un caso mas.
        let seNiegan = 0;
        let mirados = 0;
        let malos = 0;
        for (let anio = 2021; anio <= 2026; anio++) {
            for (let mes = 1; mes <= 12; mes++) {
                for (let dia = 1; dia <= new Date(anio, mes, 0).getDate(); dia++) {
                    for (const dias of [1, 5, 15, 40, 60]) {
                        const r = atras(dia, mes, anio, dias);
                        if (r.objetivoInhabil) continue;
                        mirados++;
                        if (r.problema) seNiegan++;
                        // lo que si contesta, contesta dentro de la ventana
                        else if (r.fechaLimite.getFullYear() < CJ.coberturaDesde) malos++;
                    }
                }
            }
        }
        ok(mirados > 5000, `el barrido miro ${mirados} conteos`);
        igual(malos, 0, 'ninguna fecha limite afirmada cae antes de la ventana de cobertura');
        ok(seNiegan > 0 && seNiegan < mirados / 20,
            `y las negativas son las justas: ${seNiegan} de ${mirados}`);
    }
}

// ---------------------------------------------------------------------------
// Entradas invalidas: se rechazan con un mensaje, no con una fecha.
// ---------------------------------------------------------------------------
console.log('\nEntradas invalidas');
{
    const rechaza = (fn, descripcion) => {
        try { fn(); ok(false, descripcion, 'no lanzo error'); }
        catch (e) { ok(/[áéíóúñ]/.test(e.message), descripcion, `mensaje sin acentuar: ${e.message}`); }
    };
    rechaza(() => P.vencimiento({ anio: 2026, mes: 6, dia: 18, plazo: 0 }), 'plazo 0 se rechaza, con mensaje acentuado');
    rechaza(() => P.vencimiento({ anio: 2026, mes: 6, dia: 18, plazo: 10, ampliacion: -1 }), 'ampliacion negativa se rechaza');
    rechaza(() => P.mora({ anio: 2026, mes: 6, dia: 18, diasHabiles: 0, diasCorridos: 10 }), 'mora sin dias habiles se rechaza');
    rechaza(() => P.caducidad({ anio: 2026, mes: 6, dia: 18, meses: 0 }), 'caducidad sin meses se rechaza');
    rechaza(() => P.caducidad({ anio: 2026, mes: 6, dia: 18 }), 'caducidad con el plazo vacio se rechaza, y no devuelve la fecha de inicio');
    rechaza(() => P.regresiva({ anio: 2026, mes: 3, dia: 10, dias: 0 }), 'regresiva con cero dias se rechaza');
}

// ---------------------------------------------------------------------------
// EL LEDGER: la API que otro repositorio carga desde el sitio publicado.
//
// Desde el 11/9/2026 el `ledger` no pasa por conectores/: carga los dos motores
// desde javiercuneo.com.ar y los consulta en el navegador (cargarCalendario()
// en su web/js/app.js). Si esta API cambia, alla no hay error: deja de mostrar
// vencimientos, o muestra uno equivocado. Aca se lo imita tal cual --el orden
// de carga, las tres URL reescritas, las dos llamadas, la lectura de la fecha
// con getters locales-- para que el cambio falle en este repositorio y no en
// silencio en aquel. Que el sitio sirva estas rutas con CORS abierto no se ve
// desde Node: eso lo mira pages.yml despues de publicar.
//
// Va al final a proposito: fija el huso de Buenos Aires, que es donde corre el
// ledger, y el huso cambia todas las fechas que se construyan despues.
// ---------------------------------------------------------------------------
console.log('\nEl ledger: lo que carga desde el sitio publicado');
{
    process.env.TZ = 'America/Argentina/Buenos_Aires';
    const SITIO = 'https://sitio-publicado.invalid/';
    const ventana = {};
    const pedidas = [];
    const fetchDelSitio = async (url) => {
        pedidas.push(String(url));
        const limpia = String(url).split('?')[0];
        if (!limpia.startsWith(SITIO)) {
            return { ok: false, status: 404, json: async () => { throw new Error('404 ' + limpia); } };
        }
        const texto = await readFile(join(RAIZ, limpia.slice(SITIO.length)), 'utf8');
        return { ok: true, status: 200, json: async () => JSON.parse(texto) };
    };
    const cargarScript = async (archivo) => {
        const fuente = await readFile(join(RAIZ, 'calculadoras', 'js', archivo), 'utf8');
        new Function('window', 'fetch', fuente)(ventana, fetchDelSitio);
    };

    // El orden del ledger: el calendario, las tres URL, plazos.js, init().
    await cargarScript('calendario-judicial.js');
    const L = ventana.CalendarioJudicial;
    ok(!!L && !!L.CONFIG && typeof L.init === 'function', 'window.CalendarioJudicial expone CONFIG e init()');
    let reescribible = true;
    try {
        L.CONFIG.JSON_FERIADOS_URL = SITIO + 'data/feriados.json';
        L.CONFIG.JSON_CUSTOM_URL = SITIO + 'data/dias-inhabiles.json';
        L.CONFIG.JSON_FERIA_URL = SITIO + 'data/feria-judicial.json';
    } catch (e) {
        reescribible = false;
    }
    ok(reescribible && L.CONFIG.JSON_FERIA_URL === SITIO + 'data/feria-judicial.json',
        'las tres URL de CONFIG se pueden reescribir despues de cargar el script');

    await cargarScript('plazos.js');
    const LP = ventana.Plazos;
    const anios = [];
    for (let y = 2021; y <= new Date().getFullYear() + 2; y++) anios.push(y);
    const cargaLedger = await L.init(anios);

    for (const archivo of ['feriados.json', 'dias-inhabiles.json', 'feria-judicial.json']) {
        ok(pedidas.some((u) => u.split('?')[0] === SITIO + 'data/' + archivo),
            `init() pide data/${archivo} a la URL reescrita`, `pidio: ${pedidas.join(', ') || 'nada'}`);
    }
    ok(pedidas.every((u) => u.startsWith(SITIO)),
        'y no pide nada a las rutas relativas de antes', `pidio: ${pedidas.join(', ')}`);
    ok(cargaLedger.loadedYears.includes(new Date().getFullYear()),
        'con las URL reescritas carga los feriados del año en curso');

    // La fecha como la lee el ledger: getters locales, no toISOString.
    const comoLeeElLedger = (f) => f.getFullYear() + '-' + String(f.getMonth() + 1).padStart(2, '0') +
        '-' + String(f.getDate()).padStart(2, '0');

    // Caducidad de seis meses, como la pide su radar.
    const cad = LP.caducidad({ anio: 2026, mes: 3, dia: 10, meses: 6 });
    ok(!cad.problema && cad.vencimiento instanceof Date,
        'caducidad({ anio, mes, dia, meses }) devuelve problema vacío y vencimiento como Date');
    igual(comoLeeElLedger(cad.vencimiento), d(cad.vencimiento),
        'caducidad: leída con getters locales en Buenos Aires da el mismo día que el resto del banco');

    // La apelacion: cinco dias habiles por cedula.
    const ape = LP.vencimiento({ modalidad: 'cedula', anio: 2026, mes: 6, dia: 18, plazo: 5 });
    ok(!ape.problema && ape.vencimiento instanceof Date && ape.vencimientoSinGracia instanceof Date,
        'vencimiento({ modalidad: cedula, ... }) devuelve vencimiento y vencimientoSinGracia como Date');
    igual(comoLeeElLedger(ape.vencimientoSinGracia), d(ape.vencimientoSinGracia),
        'vencimientoSinGracia: leído con getters locales en Buenos Aires da el día que publica el conector');
    igual(comoLeeElLedger(ape.vencimiento), d(ape.vencimiento),
        'vencimiento: leído con getters locales en Buenos Aires da el día que publica el conector');
    igual(d(ape.vencimiento), d(L.siguienteDiaHabil(ape.vencimientoSinGracia)),
        'vencimiento es el hábil siguiente a vencimientoSinGracia, que es lo que el ledger muestra como gracia');

    // Con un dato faltante, `problema` no viene vacio: el ledger lo mira antes
    // que la fecha. 2040 no tiene ni feriados ni feria cargados.
    const sinDatos = LP.vencimiento({ modalidad: 'cedula', anio: 2040, mes: 7, dia: 20, plazo: 5 });
    ok(!!sinDatos.problema, 'un plazo que toca un año sin datos cargados trae problema', 'problema vacío');
}

console.log(`\n${pruebas} comprobaciones, ${fallos} fallas.`);
process.exit(fallos ? 1 : 0);
