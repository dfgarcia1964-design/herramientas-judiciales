(function (global) {
    'use strict';

    const calendario = global.CalendarioJudicialColombia;
    if (!calendario) {
        throw new Error('plazos-colombia.js necesita calendario-colombia.js cargado antes.');
    }

    function fechaConHora(valor) {
        const fecha = valor instanceof Date
            ? new Date(valor)
            : new Date(valor.anio, valor.mes - 1, valor.dia, valor.hora || 0, valor.minuto || 0);
        if (Number.isNaN(fecha.getTime())) throw new Error('La fecha no es válida.');
        return fecha;
    }

    function sumarMeses(fecha, meses) {
        const resultado = new Date(fecha);
        const diaOriginal = resultado.getDate();
        resultado.setDate(1);
        resultado.setMonth(resultado.getMonth() + meses);
        const ultimoDia = new Date(
            resultado.getFullYear(),
            resultado.getMonth() + 1,
            0
        ).getDate();
        resultado.setDate(Math.min(diaOriginal, ultimoDia));
        return resultado;
    }

    function vencimientoTutela(fechaPresentacion) {
        const inicio = fechaConHora(fechaPresentacion);
        return {
            vencimiento: calendario.sumarDiasCalendario(inicio, 10),
            dias: 10,
            unidad: 'calendario',
            norma: 'Decreto 2591 de 1991, artículo 29'
        };
    }

    function vencimientoCumplimientoTutela(fechaFallo, horas = 48) {
        if (!Number.isInteger(horas) || horas < 1 || horas > 48) {
            throw new Error('El plazo de cumplimiento debe ser de 1 a 48 horas.');
        }
        const vencimiento = fechaConHora(fechaFallo);
        vencimiento.setHours(vencimiento.getHours() + horas);
        return {
            vencimiento,
            horas,
            unidad: 'horas',
            norma: 'Decreto 2591 de 1991'
        };
    }

    function vencimientoDiasHabiles(fechaNotificacion, dias, opciones = {}) {
        if (opciones.jurisdiccion === 'cgp') {
            throw new Error('El CGP requiere además datos de vacancia judicial y cierres del juzgado.');
        }
        return {
            vencimiento: calendario.contarDiasHabiles(fechaNotificacion, dias),
            dias,
            unidad: 'hábiles',
            norma: 'Ley 1564 de 2012, artículo 118'
        };
    }

    function vencimientoPeticion(fechaRecepcion, dias = 15) {
        if (![10, 15].includes(dias)) {
            throw new Error('La petición sólo admite los términos documentados de 10 o 15 días.');
        }
        return {
            vencimiento: calendario.contarDiasHabiles(fechaRecepcion, dias),
            dias,
            unidad: 'hábiles',
            norma: 'Ley 1437 de 2011, artículo 14'
        };
    }

    function vencimientoMeses(fecha, meses, norma) {
        if (!Number.isInteger(meses) || meses < 0) {
            throw new Error('La cantidad de meses tiene que ser un entero no negativo.');
        }
        return {
            vencimiento: sumarMeses(fechaConHora(fecha), meses),
            meses,
            unidad: 'meses',
            norma
        };
    }

    function prescripcionLaboral(fechaExigible, fechaReclamo = null) {
        return vencimientoMeses(
            fechaReclamo || fechaExigible,
            36,
            fechaReclamo
                ? 'Código Procesal del Trabajo y de la Seguridad Social, artículo 151; reclamo escrito'
                : 'Código Procesal del Trabajo y de la Seguridad Social, artículo 151'
        );
    }

    function prescripcionDisciplinaria(fechaInicio, faltaArticulo52 = false) {
        return vencimientoMeses(
            fechaInicio,
            faltaArticulo52 ? 144 : 60,
            'Ley 1952 de 2019, artículo 33'
        );
    }

    function prescripcionDisciplinariaTrasFallo(fechaNotificacion, faltaArticulo52 = false) {
        return vencimientoMeses(
            fechaNotificacion,
            faltaArticulo52 ? 36 : 24,
            'Ley 1952 de 2019, artículo 33, interrupción por fallo de primera instancia'
        );
    }

    function prescripcionSancionDisciplinaria(fechaEjecutoria) {
        return vencimientoMeses(
            fechaEjecutoria,
            60,
            'Ley 1952 de 2019, artículo 36'
        );
    }

    function indagacionPenalMenor(fechaNoticia, prorrogada = false) {
        return vencimientoMeses(
            fechaNoticia,
            prorrogada ? 14 : 8,
            'Ley 906 de 2004, artículo 175, modificado por Ley 2205 de 2022'
        );
    }

    global.PlazosColombia = {
        vencimientoTutela,
        vencimientoCumplimientoTutela,
        vencimientoDiasHabiles,
        vencimientoPeticion,
        vencimientoMeses,
        prescripcionLaboral,
        prescripcionDisciplinaria,
        prescripcionDisciplinariaTrasFallo,
        prescripcionSancionDisciplinaria,
        indagacionPenalMenor
    };
})(typeof window !== 'undefined' ? window : globalThis);
