(function (global) {
    'use strict';

    const CONFIG = {
        JSON_FERIADOS_URL: '../data/feriados-colombia.json',
        DEFAULT_MIN_YEAR: 2021
    };

    let feriadosPorAnio = new Map();
    let aniosCargados = [];
    let aniosFaltantes = new Set();
    let datosCargados = false;

    function clonarFecha(fecha) {
        return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
    }

    function ymd(fecha) {
        const anio = fecha.getFullYear();
        const mes = String(fecha.getMonth() + 1).padStart(2, '0');
        const dia = String(fecha.getDate()).padStart(2, '0');
        return `${anio}-${mes}-${dia}`;
    }

    function parsearFecha(fecha) {
        if (fecha instanceof Date) return clonarFecha(fecha);
        const [anio, mes, dia] = String(fecha).split('-').map(Number);
        const resultado = new Date(anio, mes - 1, dia);
        if (!Number.isInteger(anio) || !Number.isInteger(mes) || !Number.isInteger(dia)
            || resultado.getFullYear() !== anio
            || resultado.getMonth() !== mes - 1
            || resultado.getDate() !== dia) {
            throw new Error('La fecha tiene que existir y usar el formato AAAA-MM-DD.');
        }
        return resultado;
    }

    function esFinDeSemana(fecha) {
        return fecha.getDay() === 0 || fecha.getDay() === 6;
    }

    function reiniciarAuditoria() {
        aniosFaltantes = new Set();
    }

    function aniosSinDatos() {
        return Array.from(aniosFaltantes).sort((a, b) => a - b);
    }

    function feriadosDelAnio(anio) {
        const datos = feriadosPorAnio.get(anio);
        if (!datos) {
            aniosFaltantes.add(anio);
            return new Map();
        }
        return datos;
    }

    function esFeriado(fecha) {
        const dia = parsearFecha(fecha);
        return feriadosDelAnio(dia.getFullYear()).has(ymd(dia));
    }

    function esDiaHabil(fecha) {
        const dia = parsearFecha(fecha);
        return !esFinDeSemana(dia) && !esFeriado(dia);
    }

    function contarDiasHabiles(fechaInicial, cantidad) {
        if (!Number.isInteger(cantidad) || cantidad < 0) {
            throw new Error('La cantidad de días hábiles tiene que ser un entero no negativo.');
        }
        let fecha = parsearFecha(fechaInicial);
        let restantes = cantidad;
        while (restantes > 0) {
            fecha.setDate(fecha.getDate() + 1);
            if (esDiaHabil(fecha)) restantes--;
        }
        return fecha;
    }

    function sumarDiasCalendario(fechaInicial, cantidad) {
        if (!Number.isInteger(cantidad) || cantidad < 0) {
            throw new Error('La cantidad de días calendario tiene que ser un entero no negativo.');
        }
        const fecha = parsearFecha(fechaInicial);
        fecha.setDate(fecha.getDate() + cantidad);
        return fecha;
    }

    function problemaDeDatos() {
        if (!datosCargados) return 'Todavía no se cargaron los festivos colombianos.';
        if (aniosFaltantes.size) {
            return `Faltan festivos colombianos para ${aniosSinDatos().join(', ')}.`;
        }
        return null;
    }

    async function init(anios = []) {
        const lista = [...new Set(anios.map(Number).filter(Number.isInteger))];
        const respuesta = await global.fetch(CONFIG.JSON_FERIADOS_URL);
        if (!respuesta.ok) {
            datosCargados = false;
            throw new Error(`feriados-colombia.json: HTTP ${respuesta.status}`);
        }
        const contenido = await respuesta.json();
        feriadosPorAnio = new Map(
            Object.entries(contenido.feriados || {}).map(([anio, listaFeriados]) => [
                Number(anio),
                new Map(listaFeriados.map((feriado) => [feriado.fecha, feriado]))
            ])
        );
        aniosCargados = lista;
        datosCargados = true;
        for (const anio of lista) feriadosDelAnio(anio);
        return {
            dataLoaded: datosCargados,
            loadedYears: [...aniosCargados],
            missingYears: aniosSinDatos()
        };
    }

    const api = {
        CONFIG,
        init,
        ymd,
        parsearFecha,
        esFeriado,
        esDiaHabil,
        contarDiasHabiles,
        sumarDiasCalendario,
        problemaDeDatos,
        reiniciarAuditoria,
        aniosSinDatos
    };

    global.CalendarioJudicialColombia = api;
})(typeof window !== 'undefined' ? window : globalThis);
