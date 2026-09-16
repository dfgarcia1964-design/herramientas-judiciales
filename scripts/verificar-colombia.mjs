import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
let pruebas = 0;
let fallos = 0;

function ok(condicion, descripcion) {
    pruebas++;
    if (condicion) return;
    fallos++;
    console.log(`  FALLA  ${descripcion}`);
}

async function cargar() {
    const ventana = {};
    const fetchLocal = async (url) => {
        const limpia = String(url).split('?')[0].replace(/^\.\.\//, '');
        const texto = await readFile(join(RAIZ, limpia), 'utf8');
        return { ok: true, status: 200, json: async () => JSON.parse(texto) };
    };
    ventana.fetch = fetchLocal;
    for (const archivo of [
        'js/calendario-colombia.js',
        'js/plazos-colombia.js',
        'js/radicado-colombia.js',
        'js/moneda-colombia.js'
    ]) {
        const fuente = await readFile(join(RAIZ, 'calculadoras', archivo), 'utf8');
        new Function('window', 'fetch', fuente)(ventana, fetchLocal);
    }
    await ventana.CalendarioJudicialColombia.init([2025, 2026]);
    return ventana;
}

const ventana = await cargar();
const calendario = ventana.CalendarioJudicialColombia;
const plazos = ventana.PlazosColombia;
const radicado = ventana.RadicadoColombia;
const moneda = ventana.MonedaColombia;

ok(calendario.esFeriado('2026-01-01'), '2026-01-01 es festivo');
ok(calendario.esFeriado('2026-01-12'), 'Reyes Magos se traslada al lunes');
ok(calendario.esFeriado('2026-04-02'), 'Jueves Santo está cargado');
ok(calendario.esFeriado('2026-04-03'), 'Viernes Santo está cargado');
ok(!calendario.esDiaHabil('2026-04-03'), 'Viernes Santo no es hábil');
ok(calendario.esDiaHabil('2026-04-06'), 'el lunes posterior a Semana Santa es hábil');

const tutela = plazos.vencimientoTutela(new Date(2026, 5, 1, 10));
ok(calendario.ymd(tutela.vencimiento) === '2026-06-11', 'tutela suma 10 días calendario');
const cumplimiento = plazos.vencimientoCumplimientoTutela(new Date(2026, 5, 1, 10));
ok(cumplimiento.vencimiento.getDate() === 3 && cumplimiento.vencimiento.getHours() === 10,
    'cumplimiento de tutela suma el máximo de 48 horas');
const cumplimientoCorto = plazos.vencimientoCumplimientoTutela(new Date(2026, 5, 1, 10), 24);
ok(cumplimientoCorto.vencimiento.getDate() === 2 && cumplimientoCorto.horas === 24,
    'cumplimiento de tutela respeta el plazo concreto fijado en la orden');

const plazoCivil = plazos.vencimientoDiasHabiles(new Date(2026, 0, 9), 1);
ok(calendario.ymd(plazoCivil.vencimiento) === '2026-01-13',
    'el primer día hábil posterior a un viernes festivo es martes');

const peticion = plazos.vencimientoPeticion(new Date(2026, 0, 2), 15);
ok(calendario.esDiaHabil(peticion.vencimiento), 'petición termina en día hábil');

ok(radicado.esValido('25000-23-42-000-2014-01267-00'), 'radicado colombiano válido');
ok(!radicado.esValido('25000-23-42-000-2014-01267-0'), 'radicado con bloque corto inválido');
ok(radicado.analizar('25000-23-42-000-2014-01267-00').primeraInstancia,
    'instancia 00 identificada como primera instancia');

ok(moneda.valorUVT(2026) === 52374, 'UVT 2026 documentada');
ok(moneda.copDesdeUVT(2, 2026) === 104748, 'conversión UVT a COP');
ok(moneda.formatearCOP(1_234_567).includes(['1', '234', '567'].join('.')),
    'formato colombiano de COP');
ok(calendario.ymd(plazos.prescripcionDisciplinariaTrasFallo(new Date(2026, 0, 1)).vencimiento) === '2028-01-01',
    'la interrupción disciplinaria general suma dos años');
ok(calendario.ymd(plazos.prescripcionLaboral(new Date(2026, 0, 1), new Date(2026, 5, 1)).vencimiento) === '2029-06-01',
    'el reclamo escrito reinicia la prescripción laboral');

console.log(`${pruebas} comprobaciones, ${fallos} fallas.`);
process.exit(fallos ? 1 : 0);
