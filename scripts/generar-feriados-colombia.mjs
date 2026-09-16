import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const DESDE = 2021;
const HASTA = 2030;

function fechaLocal(anio, mes, dia) {
    return new Date(anio, mes - 1, dia);
}

function ymd(fecha) {
    const y = fecha.getFullYear();
    const m = String(fecha.getMonth() + 1).padStart(2, '0');
    const d = String(fecha.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function sumarDias(fecha, dias) {
    const resultado = new Date(fecha);
    resultado.setDate(resultado.getDate() + dias);
    return resultado;
}

// Algoritmo gregoriano de Meeus/Jones/Butcher.
function domingoPascua(anio) {
    const a = anio % 19;
    const b = Math.floor(anio / 100);
    const c = anio % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const mes = Math.floor((h + l - 7 * m + 114) / 31);
    const dia = ((h + l - 7 * m + 114) % 31) + 1;
    return fechaLocal(anio, mes, dia);
}

function lunesSiguiente(fecha) {
    if (fecha.getDay() === 1) return new Date(fecha);
    const dias = (8 - fecha.getDay()) % 7 || 7;
    return sumarDias(fecha, dias);
}

function agregar(lista, fecha, motivo, trasladado = false) {
    lista.push({ fecha: ymd(fecha), motivo, trasladado });
}

function feriadosDelAnio(anio) {
    const resultado = [];
    const pascua = domingoPascua(anio);
    const fijos = [
        [1, 1, 'Año Nuevo'],
        [5, 1, 'Día del Trabajo'],
        [7, 20, 'Independencia de Colombia'],
        [8, 7, 'Batalla de Boyacá'],
        [12, 8, 'Inmaculada Concepción'],
        [12, 25, 'Navidad']
    ];
    for (const [mes, dia, motivo] of fijos) {
        agregar(resultado, fechaLocal(anio, mes, dia), motivo);
    }

    const trasladables = [
        [1, 6, 'Reyes Magos'],
        [3, 19, 'San José'],
        [6, 29, 'San Pedro y San Pablo'],
        [8, 15, 'Asunción de la Virgen'],
        [10, 12, 'Día de la Raza'],
        [11, 1, 'Todos los Santos'],
        [11, 11, 'Independencia de Cartagena']
    ];
    for (const [mes, dia, motivo] of trasladables) {
        const fecha = fechaLocal(anio, mes, dia);
        agregar(resultado, lunesSiguiente(fecha), motivo, fecha.getDay() !== 1);
    }

    agregar(resultado, sumarDias(pascua, -3), 'Jueves Santo');
    agregar(resultado, sumarDias(pascua, -2), 'Viernes Santo');
    agregar(resultado, sumarDias(pascua, 39), 'Ascensión del Señor');
    agregar(resultado, sumarDias(pascua, 60), 'Corpus Christi');
    agregar(resultado, sumarDias(pascua, 68), 'Sagrado Corazón de Jesús');

    resultado.sort((a, b) => a.fecha.localeCompare(b.fecha));
    return resultado;
}

const feriados = {};
for (let anio = DESDE; anio <= HASTA; anio++) {
    feriados[String(anio)] = feriadosDelAnio(anio);
}

const salida = {
    pais: 'Colombia',
    fuente: 'Ley 51 de 1983',
    generado: new Date().toISOString().slice(0, 10),
    cobertura: { desde: DESDE, hasta: HASTA },
    feriados
};

const destino = join(RAIZ, 'data', 'feriados-colombia.json');
await mkdir(dirname(destino), { recursive: true });
await writeFile(destino, `${JSON.stringify(salida, null, 2)}\n`, 'utf8');
console.log(`Escritos ${Object.keys(feriados).length} años en ${destino}`);
