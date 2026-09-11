(function () {
    'use strict';

    // Los feriados nacionales salen del repositorio, no de una API en vivo.
    // Hasta el 13/8/2026 se le pedian a api.argentinadatos.com en cada carga
    // de cada calculadora, y el catch estaba vacio: si un anio no contestaba
    // —CORS intermitente, caida— el calculo seguia adelante sin esos feriados.
    // Un feriado contado como habil ADELANTA el vencimiento, o sea que el
    // plazo parece cumplirse antes de lo que se cumple.
    //
    // data/feriados.json lo genera scripts/actualizar-feriados.mjs contra la
    // misma API, pero en el build y no en el navegador del visitante.
    // La feria de invierno tampoco se deduce. Hasta el 17/8/2026 salia de una
    // heuristica —el penultimo lunes de julio— que contra las 21 Acordadas de
    // la CSJN que se cargaron acierta 12 veces. mora.html usaba otra —el tercer
    // lunes— que acierta 16. Ninguna acierta 2005, 2006 ni 2008, y ninguna
    // puede producir 2020, cuando la feria se suspendio por la pandemia: una
    // formula habria inventado doce dias inhabiles que juridicamente no
    // existieron. La feria la fija la Corte por Acordada y ahora sale de
    // data/feria-judicial.json, con la Acordada citada al lado de cada anio.
    //
    // CONFIG ES CONTRATO CON OTRO REPOSITORIO. Desde el 11/9/2026 el `ledger`
    // carga este archivo desde el sitio publicado y, entre cargarlo y llamar a
    // init(), reescribe las tres URL con las absolutas del sitio: las
    // relativas de abajo apuntarian al ledger. Por eso CONFIG tiene que seguir
    // siendo un objeto mutable, colgado de window.CalendarioJudicial, y las
    // URL se tienen que leer en init() y no al cargar el archivo. Si esto
    // cambia, el ledger no da error: se queda sin calendario y deja de
    // mostrar vencimientos. No se toca sin avisar alla (docs/ESTADO.md).
    var CONFIG = {
        JSON_FERIADOS_URL: '../data/feriados.json',
        JSON_CUSTOM_URL: '../data/dias-inhabiles.json',
        JSON_FERIA_URL: '../data/feria-judicial.json',
        DEFAULT_MIN_YEAR: 2021
    };

    var feriadosMap = new Map();
    var adicionalMap = new Map();
    var feriaMap = new Map();
    var _coberturaDesde = null;
    var _dataLoaded = false;
    var _loadError = false;
    var _loadedYears = [];
    var _missingYears = [];
    var _missingFeriaYears = [];

    function toYMD(date) {
        var y = date.getFullYear();
        var m = String(date.getMonth() + 1).padStart(2, '0');
        var d = String(date.getDate()).padStart(2, '0');
        return y + '-' + m + '-' + d;
    }

    function _toYMD_local(date) {
        var y = date.getFullYear();
        var m = String(date.getMonth() + 1).padStart(2, '0');
        var d = String(date.getDate()).padStart(2, '0');
        return y + '-' + m + '-' + d;
    }

    function isWeekend(fecha) {
        var dia = fecha.getDay();
        return dia === 0 || dia === 6;
    }

    function _parseYMD(str) {
        var p = String(str).split('-').map(Number);
        return new Date(p[0], p[1] - 1, p[2]);
    }

    // Devuelve el array de rangos de feria de ese anio, o undefined si no hay
    // dato. Un array vacio significa "ese anio no tuvo feria", que es una
    // respuesta; undefined significa "no se sabe", que no lo es. No hay que
    // confundirlos.
    //
    // Son varios rangos y no uno porque un anio puede tener mas de una feria:
    // 2009 se rectifico y se amplio —dos tramos—, y 2020 encadeno once
    // Acordadas de feria extraordinaria entre marzo y agosto.
    function obtenerFeriasDelAnio(year) {
        return feriaMap.get(Number(year));
    }

    // Compatibilidad y comodidad: el primer rango del anio, que en un anio
    // normal es el unico. No usarlo para decidir si una fecha es feria —para
    // eso esta esFeriaJudicial—, porque en 2009 y 2020 hay mas de uno.
    function obtenerFeriaJulio(year) {
        var rangos = obtenerFeriasDelAnio(year);
        if (rangos === undefined) return undefined;
        return rangos.length ? rangos[0] : null;
    }

    function generarFeriaJulio(year) {
        var rangos = obtenerFeriasDelAnio(year) || [];
        var dates = [];
        rangos.forEach(function (r) {
            var d = new Date(r.inicio);
            while (d <= r.fin) {
                dates.push(_toYMD_local(d));
                d.setDate(d.getDate() + 1);
            }
        });
        return dates;
    }

    // Una feria puede terminar en agosto —2007, 2008, 2014, 2019, 2025— asi
    // que no alcanza con mirar el anio de la fecha: un 1 de agosto pertenece a
    // la feria declarada bajo el anio en curso. Se consulta el anio de la
    // fecha y el anterior.
    // Auditoria de anios sin feria conocida.
    //
    // La feria de un anio futuro NO se puede tener: la CSJN dicta la Acordada
    // en abril o junio DEL MISMO anio. Asi que no alcanza con bloquear la
    // herramienta cuando falta un anio —quedaria muerta todos los anios,
    // esperando un acto que todavia no se dicto— ni con devolver false, que
    // es contar la feria como habil y adelantar el vencimiento.
    //
    // Lo que se hace es anotar cada anio sin dato que un calculo toca. El que
    // calcula pregunta despues si toco alguno, y si toco, no afirma una fecha.
    // Asi ningun anio se cuela: lo anota el motor, no el que lo llama.
    var _aniosSinFeria = new Set();
    var _aniosSinFeriados = new Set();
    var _aniosFueraDeCobertura = new Set();

    function reiniciarAuditoria() {
        _aniosSinFeria = new Set();
        _aniosSinFeriados = new Set();
        _aniosFueraDeCobertura = new Set();
    }

    function aniosSinFeriaTocados() {
        return Array.from(_aniosSinFeria).sort();
    }

    function aniosSinFeriadosTocados() {
        return Array.from(_aniosSinFeriados).sort();
    }

    function aniosFueraDeCoberturaTocados() {
        return Array.from(_aniosFueraDeCobertura).sort();
    }

    // Devuelve null si el computo se apoyo en datos completos, o la frase que
    // explica por que no se puede afirmar una fecha.
    //
    // La frase vive aca y no en cada calculadora a proposito: son cinco
    // herramientas sin build, y cinco copias de la misma prosa se
    // desincronizan. Es texto, no HTML: la usan un innerHTML y dos alert().
    function problemaDeDatos() {
        var viejos = aniosFueraDeCoberturaTocados();
        if (viejos.length) {
            return 'El cómputo alcanza ' + (viejos.length === 1 ? 'el año ' : 'los años ') +
                viejos.join(', ') + ', anterior' + (viejos.length === 1 ? '' : 'es') + ' a ' +
                _coberturaDesde + ', que es desde cuándo esta herramienta tiene los feriados ' +
                'nacionales y los asuetos completos. Las ferias viejas sí están cargadas, pero ' +
                'con esas solas el cálculo contaría como hábiles días que no lo fueron.';
        }

        var sinFeria = aniosSinFeriaTocados();
        if (sinFeria.length) {
            return 'El cómputo alcanza ' + (sinFeria.length === 1 ? 'el año ' : 'los años ') +
                sinFeria.join(', ') + ', y la feria judicial de invierno ' +
                (sinFeria.length === 1 ? 'de ese año' : 'de esos años') + ' todavía no está ' +
                'cargada. La fija la CSJN por Acordada, normalmente entre abril y junio del ' +
                'mismo año, y esta herramienta no la deduce: contar julio como hábil ' +
                'adelantaría el vencimiento.';
        }

        var sinFeriados = aniosSinFeriadosTocados();
        if (sinFeriados.length) {
            return 'El cómputo alcanza ' + (sinFeriados.length === 1 ? 'el año ' : 'los años ') +
                sinFeriados.join(', ') + ', y los feriados nacionales ' +
                (sinFeriados.length === 1 ? 'de ese año' : 'de esos años') + ' no están ' +
                'cargados. Un feriado contado como hábil adelanta el vencimiento.';
        }

        return null;
    }

    function esFeriaJudicial(fecha) {
        var f = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
        var year = f.getFullYear();
        var encontrada = false;

        // Fuera de la ventana de cobertura hay feria cargada pero faltan los
        // feriados nacionales y los asuetos, asi que el dia se evaluaria
        // incompleto. Se anota y el que calcula no afirma una fecha.
        if (_coberturaDesde !== null && year < _coberturaDesde) {
            _aniosFueraDeCobertura.add(year);
        }

        // Una feria puede empezar en un anio y terminar en el siguiente mes
        // de otro —2007, 2014, 2019, 2025 terminan en agosto—, asi que se
        // consulta el anio de la fecha y el anterior.
        for (var y = year - 1; y <= year; y++) {
            var rangos = obtenerFeriasDelAnio(y);

            if (rangos === undefined) {
                // Solo importa si la fecha cae donde una feria podria estar.
                // Un 3 de marzo de un anio normal no depende de la Acordada.
                if ((f.getMonth() === 6 || f.getMonth() === 7) && y === year) {
                    _aniosSinFeria.add(y);
                }
                continue;
            }

            for (var i = 0; i < rangos.length; i++) {
                if (f >= rangos[i].inicio && f <= rangos[i].fin) encontrada = true;
            }
        }
        return encontrada;
    }

    // Nombre viejo. La feria dejo de ser solo "de julio" cuando entraron las
    // extraordinarias de 2020, que van de marzo a agosto.
    var esFeriaJulio = esFeriaJudicial;

    // Enero entero es feria. Hasta el 24/8/2026 esto era `getMonth() === 0`
    // escrito a mano, y era el ultimo dia inhabil que este repositorio decidia
    // en codigo en vez de en datos: lo fija el art. 2 del Reglamento para la
    // Justicia Nacional, que es un acto que la Corte puede reformar sin que
    // cambie ninguna ley. Ahora sale de la clave `feria_de_enero` de
    // data/feria-judicial.json, con la norma citada al lado.
    //
    // EL DEFAULT NO ES "no hay feria". Si el archivo no se pudo leer, enero
    // sigue siendo feria: la feria de invierno puede darse por ausente sin
    // romper nada --son doce dias y el motor anota el anio faltante-- pero
    // enero contado como habil adelanta el vencimiento un mes entero, y eso
    // no se informa: se ve como un numero plausible. Por eso el valor de
    // arranque es el mismo que traeria el archivo, y leerlo solo puede
    // confirmarlo o cambiar el mes, nunca apagarlo.
    var _feriaEnero = {
        mes: 1,
        motivo: 'Feria judicial de enero'
    };

    function esFeriaEnero(fecha) {
        return fecha.getMonth() === _feriaEnero.mes - 1;
    }

    function es16Noviembre(fecha) {
        return fecha.getMonth() === 10 && fecha.getDate() === 16;
    }

    function esFeriado(fecha) {
        // Los feriados nacionales se cargan por anio, solo los pedidos. Un
        // computo que cruza a un anio que no se pidio no encuentra sus
        // feriados y los cuenta como habiles, que adelanta el vencimiento.
        // Es el mismo agujero que la feria, por el otro insumo: se anota.
        var y = fecha.getFullYear();
        if (_loadedYears.length && _loadedYears.indexOf(y) === -1) {
            _aniosSinFeriados.add(y);
        }
        return feriadosMap.has(_toYMD_local(fecha));
    }

    function esInhabilCustom(fecha) {
        return adicionalMap.has(_toYMD_local(fecha));
    }

    function esDiaHabil(fecha) {
        if (isWeekend(fecha)) return false;
        if (esFeriado(fecha)) return false;
        if (esInhabilCustom(fecha)) return false;
        if (esFeriaJulio(fecha)) return false;
        if (esFeriaEnero(fecha)) return false;
        if (es16Noviembre(fecha)) return false;
        return true;
    }

    function siguienteDiaHabil(fecha) {
        var next = new Date(fecha);
        next.setDate(next.getDate() + 1);
        while (!esDiaHabil(next)) {
            next.setDate(next.getDate() + 1);
        }
        return next;
    }

    function contarDiasHabiles(fromDate, days) {
        var current = new Date(fromDate);
        var count = 0;
        while (count < days) {
            current.setDate(current.getDate() + 1);
            if (esDiaHabil(current)) {
                count++;
            }
        }
        return current;
    }

    function obtenerMotivoInhabil(fecha) {
        if (isWeekend(fecha)) return 'Fin de semana';

        var ymd = _toYMD_local(fecha);

        if (feriadosMap.has(ymd)) return feriadosMap.get(ymd).motivo;
        if (adicionalMap.has(ymd)) return adicionalMap.get(ymd).motivo;

        if (esFeriaJudicial(fecha)) {
            var f = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
            for (var y = f.getFullYear() - 1; y <= f.getFullYear(); y++) {
                var rangos = obtenerFeriasDelAnio(y) || [];
                for (var i = 0; i < rangos.length; i++) {
                    if (f < rangos[i].inicio || f > rangos[i].fin) continue;
                    return rangos[i].acordada
                        ? 'Feria judicial (Acordada CSJN ' + rangos[i].acordada + ')'
                        : 'Feria judicial';
                }
            }
            return 'Feria judicial';
        }
        if (esFeriaEnero(fecha)) return _feriaEnero.motivo;
        if (es16Noviembre(fecha)) return '16 de noviembre (Día de la Justicia Nacional)';

        return null;
    }

    // Devuelve los anios pedidos que el archivo cubre. Un anio que no esta
    // NO se completa ni se aproxima: se informa como faltante y el llamador
    // decide. Antes esto se tragaba el error y devolvia la lista corta, que
    // es como un anio sin feriados terminaba pareciendo un anio cargado.
    async function loadFeriados(yearsArray) {
        var resp = await fetch(CONFIG.JSON_FERIADOS_URL + '?v=' + Date.now());
        if (!resp.ok) throw new Error('feriados.json: HTTP ' + resp.status);

        var data = await resp.json();
        var porAnio = data.feriados || {};
        var loaded = [];

        for (var i = 0; i < yearsArray.length; i++) {
            var year = yearsArray[i];
            var lista = porAnio[String(year)];
            if (!Array.isArray(lista) || !lista.length) continue;

            for (var j = 0; j < lista.length; j++) {
                var item = lista[j];
                feriadosMap.set(item.fecha, { motivo: item.motivo || item.nombre || 'Feriado nacional' });
            }
            loaded.push(year);
        }
        return loaded;
    }

    // Mismo criterio que los feriados: un anio que el archivo no cubre NO se
    // deduce. Se informa como faltante y la herramienta no calcula. Un anio
    // con "sinFeria" —2020— si es una respuesta: se guarda como null y julio
    // corre entero como habil.
    async function loadFeria(yearsArray) {
        var resp = await fetch(CONFIG.JSON_FERIA_URL + '?v=' + Date.now());
        if (!resp.ok) throw new Error('feria-judicial.json: HTTP ' + resp.status);

        var data = await resp.json();
        var porAnio = data.ferias || {};
        var loaded = [];

        _coberturaDesde = data.cobertura && data.cobertura.desde
            ? Number(data.cobertura.desde)
            : null;

        // Enero. Se pisa el default solo con un mes que sea un mes: un 0, un
        // 13 o un "enero" apagarian la feria entera sin que se note.
        var enero = data.feria_de_enero;
        if (enero && Number.isInteger(enero.mes) && enero.mes >= 1 && enero.mes <= 12) {
            _feriaEnero = {
                mes: enero.mes,
                motivo: enero.motivo || 'Feria judicial de enero',
                norma: enero.norma || null,
                url: enero.url || null
            };
        }

        // Se carga todo lo que el archivo tenga, no solo los anios pedidos:
        // una feria que termina en agosto la puede necesitar el anio anterior.
        Object.keys(porAnio).forEach(function (clave) {
            var item = porAnio[clave] || {};
            var year = Number(clave);
            var rangos = Array.isArray(item.rangos) ? item.rangos : [];

            var parseados = rangos
                .filter(function (r) { return r && r.inicio && r.fin; })
                .map(function (r) {
                    return {
                        inicio: _parseYMD(r.inicio),
                        fin: _parseYMD(r.fin),
                        acordada: r.acordada || null,
                        url: r.url || null,
                        detalle: r.detalle || null
                    };
                });

            feriaMap.set(year, parseados);
            loaded.push(year);
        });

        return yearsArray.filter(function (y) { return loaded.indexOf(y) !== -1; });
    }

    async function loadCustomHolidaysJSON() {
        try {
            var resp = await fetch(CONFIG.JSON_CUSTOM_URL + '?v=' + Date.now());
            if (resp.ok) {
                var data = await resp.json();
                var list = data.dias_inhabiles_adicionales || data.inhabiles || data.dias || [];
                if (Array.isArray(list)) {
                    for (var i = 0; i < list.length; i++) {
                        var item = list[i];
                        if (item.fecha) {
                            adicionalMap.set(item.fecha, { motivo: item.motivo || item.nombre || 'Inhábil adicional' });
                        }
                    }
                    return true;
                }
            }
            return false;
        } catch (e) {
            return false;
        }
    }

    async function init(yearsArray) {
        _dataLoaded = false;
        _loadError = false;
        _loadedYears = [];
        reiniciarAuditoria();

        if (!yearsArray || !yearsArray.length) {
            var currentYear = new Date().getFullYear();
            yearsArray = [];
            for (var y = CONFIG.DEFAULT_MIN_YEAR; y <= currentYear + 1; y++) {
                yearsArray.push(y);
            }
        }

        try {
            var results = await Promise.all([
                loadFeriados(yearsArray),
                loadCustomHolidaysJSON(),
                loadFeria(yearsArray)
            ]);

            _loadedYears = results[0];
            var feriaLoaded = results[2];

            // Falta un anio = no esta cargado. No alcanza con que haya
            // cargado alguno: si falta 2026 y alguien computa un plazo de
            // 2026, el resultado sale mal y nada lo delata.
            _missingYears = yearsArray.filter(function (y) {
                return _loadedYears.indexOf(y) === -1;
            });
            _missingFeriaYears = yearsArray.filter(function (y) {
                return feriaLoaded.indexOf(y) === -1;
            });

            // Que falte la feria de un anio futuro es lo normal y no bloquea:
            // la Acordada se dicta durante ese mismo anio. Que falte la de un
            // anio ya transcurrido si es un archivo incompleto. En los dos
            // casos, un calculo que TOQUE un anio sin feria no afirma nada:
            // de eso se ocupa aniosSinFeriaTocados().
            var anioEnCurso = new Date().getFullYear();
            var feriaPasadaFaltante = _missingFeriaYears.filter(function (y) {
                return y <= anioEnCurso;
            });

            _dataLoaded = _missingYears.length === 0 && feriaPasadaFaltante.length === 0;
            _loadError = !_dataLoaded;
        } catch (e) {
            _loadError = true;
            _dataLoaded = false;
            _loadedYears = [];
            _missingYears = yearsArray.slice();
            _missingFeriaYears = yearsArray.slice();
        }

        return {
            dataLoaded: _dataLoaded,
            loadError: _loadError,
            loadedYears: _loadedYears.slice(),
            missingYears: _missingYears.slice(),
            missingFeriaYears: _missingFeriaYears.slice()
        };
    }

    // La API publica. La consumen las pantallas, conectores/nucleo.mjs y el
    // `ledger`, que la carga desde el sitio publicado: de aca usa CONFIG e
    // init(). Ver el comentario de CONFIG, arriba.
    window.CalendarioJudicial = {
        CONFIG: CONFIG,

        get dataLoaded() { return _dataLoaded; },
        get loadError() { return _loadError; },
        get loadedYears() { return _loadedYears.slice(); },
        get missingYears() { return _missingYears.slice(); },
        get missingFeriaYears() { return _missingFeriaYears.slice(); },

        init: init,

        toYMD: toYMD,
        isWeekend: isWeekend,

        get coberturaDesde() { return _coberturaDesde; },
        get feriaDeEnero() { return _feriaEnero; },

        obtenerFeriasDelAnio: obtenerFeriasDelAnio,
        obtenerFeriaJulio: obtenerFeriaJulio,
        generarFeriaJulio: generarFeriaJulio,
        reiniciarAuditoria: reiniciarAuditoria,
        problemaDeDatos: problemaDeDatos,
        aniosSinFeriaTocados: aniosSinFeriaTocados,
        aniosSinFeriadosTocados: aniosSinFeriadosTocados,
        aniosFueraDeCoberturaTocados: aniosFueraDeCoberturaTocados,
        esFeriaJudicial: esFeriaJudicial,
        esFeriaJulio: esFeriaJulio,
        esFeriaEnero: esFeriaEnero,
        es16Noviembre: es16Noviembre,

        esFeriado: esFeriado,
        esInhabilCustom: esInhabilCustom,
        esDiaHabil: esDiaHabil,
        siguienteDiaHabil: siguienteDiaHabil,
        contarDiasHabiles: contarDiasHabiles,
        obtenerMotivoInhabil: obtenerMotivoInhabil
    };
})();
