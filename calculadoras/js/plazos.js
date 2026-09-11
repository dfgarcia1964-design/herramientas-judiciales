(function () {
    'use strict';

    // El computo de plazos, extraido de las pantallas que lo tenian adentro.
    //
    // Por que existe: hasta el 25/8/2026 la aritmetica de vencimientos vivia
    // dentro de vencimientos.html (funcion calcular(), entre document.
    // getElementById) y la de mora dentro de mora.html. Dos consecuencias:
    //
    //   1. Nada fuera del navegador podia consultarla. El pedido de
    //      pipeline-drafter --exponer el computo de vencimientos a Python-- no
    //      tenia a que llamar, y cumplirlo habria significado escribir una
    //      SEGUNDA implementacion de una cuenta con consecuencia juridica.
    //      Es el modo de falla que produjo el bug de la feria en mora.html:
    //      dos heuristicas distintas para lo mismo, cada una mal a su manera.
    //   2. El tablero no puede dibujar un plazo del que solo conoce la fecha
    //      final. Dibujarlo pide el tramo: que dias se contaron y cuales se
    //      saltaron, y por que.
    //
    // ESTE ARCHIVO NO DECIDE NADA NUEVO. Es transcripcion. Las calculadoras
    // quedan como estan --sin una linea modificada-- y sirven de referencia:
    // si este motor y la pantalla discrepan en un numero, el que esta mal es
    // este archivo. Esa comparacion es scripts/verificar-plazos.mjs.
    //
    // La regla del repositorio se hereda entera: si falta un dato, no hay
    // medio resultado. Cada calculo devuelve `problema`, y cuando `problema`
    // no es null NO hay que usar la fecha. El motor no la esconde --sirve
    // para depurar-- pero quien consuma esto tiene que mirar `problema`
    // primero. Un conector que devuelva la fecha ignorando eso es peor que la
    // pantalla, porque del otro lado no hay nadie leyendo un aviso.

    function calendario() {
        var CJ = (typeof window !== 'undefined' && window.CalendarioJudicial) || null;
        if (!CJ) throw new Error('plazos.js necesita calendario-judicial.js cargado antes.');
        return CJ;
    }

    function ymdUTC(fecha) {
        return fecha.toISOString().split('T')[0];
    }

    // vencimientos.html construye la fecha con Date.UTC(..., 12): mediodia
    // UTC. mora.html la construye con new Date(y, m, d) y setHours(0,0,0,0):
    // medianoche local. NO se unifican. Son husos distintos y unificarlos
    // moveria un numero en alguno de los dos lados, que es exactamente lo que
    // esta extraccion no puede hacer.
    function fechaComoVencimientos(anio, mes, dia) {
        return new Date(Date.UTC(Number(anio), Number(mes) - 1, Number(dia), 12));
    }

    function fechaComoMora(anio, mes, dia) {
        var d = new Date(Number(anio), Number(mes) - 1, Number(dia));
        d.setHours(0, 0, 0, 0);
        return d;
    }

    // caducidad.html, entre-fechas.html y regresiva.html construyen la fecha
    // con new Date(y, m - 1, d) pelado, que ya es medianoche local: es el mismo
    // instante que fechaComoMora sin el setHours redundante. Se escribe aparte
    // igual, para que se vea de un vistazo que son tres convenciones y no una
    // sola con tres nombres.
    function fechaLocal(anio, mes, dia) {
        return new Date(Number(anio), Number(mes) - 1, Number(dia));
    }

    // --- Notificacion automatica (art. 133 CPCCN) ----------------------------
    // Transcripcion literal de calcularNotificacionAutomatica() en
    // vencimientos.html. La tabla de saltos por dia de la semana se deja como
    // esta: es la que produce los numeros que la pantalla publica hoy.
    function notificacionAutomatica(fechaFirma) {
        var CJ = calendario();
        var dia = fechaFirma.getDay();
        var diasHastaNotificacion = 0;
        if (dia === 0) diasHastaNotificacion = 2;
        else if (dia === 1) diasHastaNotificacion = 1;
        else if (dia === 2) diasHastaNotificacion = 3;
        else if (dia === 3) diasHastaNotificacion = 2;
        else if (dia === 4) diasHastaNotificacion = 1;
        else if (dia === 5) diasHastaNotificacion = 4;
        else if (dia === 6) diasHastaNotificacion = 3;

        var fechaNotificacion = new Date(fechaFirma);
        fechaNotificacion.setDate(fechaNotificacion.getDate() + diasHastaNotificacion);

        while (!CJ.esDiaHabil(fechaNotificacion)) {
            var diaActual = fechaNotificacion.getDay();
            if (diaActual === 2) {
                fechaNotificacion.setDate(fechaNotificacion.getDate() + 3);
            } else {
                fechaNotificacion.setDate(fechaNotificacion.getDate() + 4);
            }
        }
        return fechaNotificacion;
    }

    // Martes y viernes, saltando los que sean inhabiles.
    function proximoDiaDeNota(fecha) {
        var CJ = calendario();
        var siguiente = new Date(fecha);
        siguiente.setDate(siguiente.getDate() + 1);
        while (true) {
            var diaSemana = siguiente.getDay();
            if (diaSemana === 2 || diaSemana === 5) {
                if (CJ.esDiaHabil(siguiente)) return siguiente;
            }
            siguiente.setDate(siguiente.getDate() + 1);
        }
    }

    // Los dos dias de nota siguientes a una fecha, que es lo que la pantalla
    // ofrece de a pares.
    function parDeNotas(fecha) {
        var primera = proximoDiaDeNota(fecha);
        return [primera, proximoDiaDeNota(primera)];
    }

    // --- Vencimiento de un plazo en dias habiles ----------------------------
    //
    // Transcripcion de calcular() en vencimientos.html, sin la parte que lee
    // el formulario y sin la que arma el HTML. La aritmetica no se toco.
    //
    // opciones:
    //   modalidad        'cedula' | 'automatica'
    //   anio, mes, dia   la fecha de notificacion, o la de la firma si la
    //                    modalidad es automatica
    //   plazo            dias habiles
    //   ampliacion       dias de ampliacion por distancia (art. 158 CPCCN), en
    //                    DIAS y no en km: los km los convierte distancia.html.
    //                    Se suma al PLAZO y no a la fecha final, asi que los
    //                    cuenta el mismo bucle y saltan feria y feriados como
    //                    los demas. Sumarlos al final darian dias corridos.
    //   fueraDeHorario   solo con cedula: se diligencio despues de las 20 o
    //                    antes de las 7
    //   notasDejadas     solo con automatica: fechas 'AAAA-MM-DD' en que se
    //                    dejo nota en el Libro de Asistencia (art. 133 CPCCN)
    function vencimiento(opciones) {
        var CJ = calendario();
        var o = opciones || {};
        var modalidad = o.modalidad === 'automatica' ? 'automatica' : 'cedula';
        var plazo = Number(o.plazo);
        var ampliacion = (o.ampliacion === undefined || o.ampliacion === null || o.ampliacion === '')
            ? 0
            : Number(o.ampliacion);

        if (!Number.isInteger(plazo) || plazo <= 0) {
            throw new Error('El plazo tiene que ser un número entero de días mayor que cero.');
        }
        if (!Number.isInteger(ampliacion) || ampliacion < 0) {
            throw new Error('La ampliación tiene que ser un número de días de 0 en adelante.');
        }

        var plazoTotal = plazo + ampliacion;
        var fechaIngresada = fechaComoVencimientos(o.anio, o.mes, o.dia);

        // La auditoria se reinicia aca y se consulta al final: el motor anota
        // los anios sin feria, sin feriados o fuera de cobertura que este
        // computo llegue a tocar. Sin eso, un anio faltante devuelve una fecha
        // plausible que nadie puede desmentir.
        CJ.reiniciarAuditoria();

        var fechaNotificacion;
        var fechaInicioConteo;

        if (modalidad === 'cedula') {
            // Una sola regla, y sale de que los dos supuestos son el mismo: la
            // cedula se tiene por practicada el primer dia habil a partir del
            // momento en que se diligencio, y el plazo corre desde el habil
            // siguiente a ese. Los dos ultimos NO se acumulan: un sabado a las
            // 23 hs. suma un dia, no dos.
            var horaHabil = !o.fueraDeHorario;
            var practicada = (CJ.esDiaHabil(fechaIngresada) && horaHabil)
                ? fechaIngresada
                : CJ.siguienteDiaHabil(fechaIngresada);

            fechaNotificacion = practicada;
            fechaInicioConteo = CJ.siguienteDiaHabil(practicada);
        } else {
            fechaNotificacion = notificacionAutomatica(fechaIngresada);

            var notas = (o.notasDejadas || []).map(function (f) {
                return typeof f === 'string' ? f : ymdUTC(f);
            });
            while (notas.indexOf(ymdUTC(fechaNotificacion)) !== -1) {
                fechaNotificacion = proximoDiaDeNota(fechaNotificacion);
            }
            fechaInicioConteo = CJ.siguienteDiaHabil(fechaNotificacion);
        }

        // El conteo arranca un dia ANTES de fechaInicioConteo y avanza, asi el
        // propio dia de inicio se cuenta como el primero. Se deja escrito como
        // estaba y no simplificado.
        var diasContados = 0;
        var fechaActual = new Date(fechaInicioConteo);
        fechaActual.setDate(fechaActual.getDate() - 1);

        var contados = [];
        while (diasContados < plazoTotal) {
            fechaActual.setDate(fechaActual.getDate() + 1);
            if (CJ.esDiaHabil(fechaActual)) {
                diasContados++;
                contados.push(new Date(fechaActual));
            }
        }

        var sinGracia = new Date(fechaActual);
        var conGracia = CJ.siguienteDiaHabil(sinGracia);

        // Los dias que el computo salteo, con el motivo de cada uno. Es lo que
        // el tablero necesita para dibujar el plazo: una fecha final sola no
        // dice donde cayo la feria ni cuantos fines de semana se comio.
        var salteados = [];
        var vistos = {};
        var cursor = new Date(fechaIngresada);
        while (cursor.getTime() <= conGracia.getTime()) {
            if (!CJ.esDiaHabil(cursor)) {
                var clave = ymdUTC(cursor);
                if (!vistos[clave]) {
                    vistos[clave] = true;
                    salteados.push({
                        fecha: new Date(cursor),
                        ymd: clave,
                        motivo: CJ.obtenerMotivoInhabil(cursor)
                    });
                }
            }
            cursor.setDate(cursor.getDate() + 1);
        }

        return {
            problema: CJ.problemaDeDatos(),
            modalidad: modalidad,
            fechaIngresada: fechaIngresada,
            diaEraHabil: CJ.esDiaHabil(fechaIngresada),
            motivoInhabil: CJ.obtenerMotivoInhabil(fechaIngresada),
            fueraDeHorario: !!o.fueraDeHorario,
            fechaNotificacion: fechaNotificacion,
            fechaInicioConteo: fechaInicioConteo,
            plazo: plazo,
            ampliacion: ampliacion,
            plazoTotal: plazoTotal,
            vencimiento: conGracia,
            vencimientoSinGracia: sinGracia,
            diasContados: contados,
            diasSalteados: salteados
        };
    }

    // --- Mora: un tramo de dias habiles y otro de corridos -------------------
    //
    // Transcripcion de la aritmetica de mora.html, que la tiene escrita en
    // cuatro funciones deliberadamente sin simplificar. Se mantienen las
    // cuatro por el mismo motivo por el que estaban asi alla:
    // nextBusinessDayStrict mas el conteo inclusivo de countBusinessDaysFrom
    // equivalen a un salto de dia habil si la notificacion cae habil, y dos si
    // cae inhabil. Escrito de otra forma el resultado se mueve.
    function mora(opciones) {
        var CJ = calendario();
        var o = opciones || {};
        var diasHabiles = Number(o.diasHabiles);
        var diasCorridos = Number(o.diasCorridos);

        if (!Number.isInteger(diasHabiles) || diasHabiles <= 0) {
            throw new Error('Los días hábiles tienen que ser un número entero mayor que cero.');
        }
        if (!Number.isInteger(diasCorridos) || diasCorridos < 0) {
            throw new Error('Los días corridos tienen que ser un número de 0 en adelante.');
        }

        function addDays(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }
        function isBusinessDay(date) { return CJ.esDiaHabil(date); }
        function nextBusinessDay(date) {
            var d = new Date(date); d.setHours(0, 0, 0, 0);
            while (!isBusinessDay(d)) d = addDays(d, 1);
            return d;
        }
        function nextBusinessDayStrict(date) {
            var effective = isBusinessDay(date) ? date : nextBusinessDay(date);
            return addDays(effective, 1);
        }
        // El recorrido se anota mientras se hace, y por eso el dibujo no puede
        // discrepar con el numero: es el MISMO paso. Armar la lista despues,
        // desde la pantalla, seria recorrer el calendario una segunda vez con
        // la convencion de conteo copiada a mano, que es el modo de falla que
        // ya produjo el bug de la feria. El bucle no cambio: solo se llena un
        // array.
        function countBusinessDaysFrom(startDate, days) {
            var counted = 0;
            var recorrido = [];
            var cursor = new Date(startDate); cursor.setHours(0, 0, 0, 0);
            while (counted < days) {
                var motivo = CJ.obtenerMotivoInhabil(cursor);
                var habil = isBusinessDay(cursor);
                recorrido.push({
                    fecha: new Date(cursor),
                    contado: habil,
                    orden: habil ? counted + 1 : null,
                    motivo: habil ? null : motivo
                });
                if (habil) counted++;
                if (counted >= days) break;
                cursor = addDays(cursor, 1);
            }
            return { lastCountedDay: cursor, evaluados: recorrido };
        }

        var notif = fechaComoMora(o.anio, o.mes, o.dia);

        CJ.reiniciarAuditoria();

        var startBiz = nextBusinessDayStrict(notif);
        var tramoHabiles = countBusinessDaysFrom(startBiz, diasHabiles);
        var lastBiz = tramoHabiles.lastCountedDay;

        // Tramo ii: los corridos arrancan el dia despues del ultimo habil, y el
        // conteo es inclusivo --de ahi el -1--.
        var startCorr = addDays(lastBiz, 1);
        var endCorr = addDays(startCorr, diasCorridos - 1);

        return {
            problema: CJ.problemaDeDatos(),
            notificacion: notif,
            inicioHabiles: startBiz,
            firme: lastBiz,
            inicioCorridos: startCorr,
            vencimiento: endCorr,
            diasHabiles: diasHabiles,
            diasCorridos: diasCorridos,
            // Dia por dia del tramo de habiles, para dibujarlo. Los corridos no
            // hacen falta: se cuentan todos, asi que la pantalla los pinta del
            // rango sin preguntar nada.
            evaluados: tramoHabiles.evaluados
        };
    }

    // --- Caducidad de instancia (art. 310 CPCCN) ----------------------------
    //
    // Transcripcion de la funcion que caducidad.html tenia adentro del submit,
    // sin la parte que lee el formulario y sin la que arma el HTML. La
    // aritmetica no se toco: ni el ancla, ni el salteo de enero, ni el punto
    // fijo de la feria, ni la iteracion del computo con inhabiles.
    //
    // Es un plazo en MESES y no en dias habiles, asi que no comparte una sola
    // linea con vencimiento(): se cuenta de fecha a fecha (art. 6 CCyC) y los
    // dias inhabiles corren adentro salvo los de feria (art. 311 CPCCN). Por
    // eso vive al lado y no encima.
    //
    // opciones:
    //   anio, mes, dia   la fecha del ultimo acto impulsor
    //   meses            el plazo del art. 310: 6, 3, 1 o el de prescripcion
    //
    // Devuelve datos y no prosa, salvo `problema`, que es la frase que explica
    // por que no se puede afirmar una fecha y que por regla del repositorio no
    // se reescribe en cada calculadora.
    function caducidad(opciones) {
        var CJ = calendario();
        var o = opciones || {};
        var meses = Number(o.meses);

        if (!Number.isInteger(meses) || meses <= 0) {
            throw new Error('El plazo tiene que ser un número entero de meses mayor que cero.');
        }

        var startDate = fechaLocal(o.anio, o.mes, o.dia);

        // El motor anota los anios cuya feria de invierno no esta cargada y
        // que este calculo llegue a tocar. Se consulta al final: si toco
        // alguno, no se muestra una fecha. Un plazo de caducidad cruza meses y
        // puede caer en un anio cuya Acordada la CSJN todavia no dicto --la
        // dicta en abril o junio del mismo anio--.
        CJ.reiniciarAuditoria();

        var ordDate = new Date(startDate);
        var eneroExcluido = [];

        // Los plazos en meses se cuentan DE FECHA A FECHA (art. 6 CCyC), y el
        // dia de anclaje es siempre el del ultimo acto impulsor. Si el mes de
        // llegada no tiene ese dia, ese tramo termina el ultimo dia del mes
        // --"cuando en el mes del vencimiento no hubiera dia equivalente al
        // inicial del computo, se entiende que el plazo expira el ultimo dia
        // de ese mes"-- pero el ancla NO se pierde: el tramo siguiente vuelve
        // a salir del dia original.
        //
        // Hasta el 18/8/2026 el ancla se arrastraba. Se avanzaba mutando la
        // misma fecha, asi que al pasar por febrero quedaba clavada en 28 y
        // los tramos siguientes salian de ahi. Un ultimo acto del 28, 29, 30 o
        // 31 de diciembre daba los cuatro la MISMA caducidad, y siempre antes
        // de lo que corresponde. Reportado por Javier.
        var anclaDia = startDate.getDate();

        var tramo = function (n) {
            var m = new Date(startDate.getFullYear(), startDate.getMonth() + n, 1);
            var ultimoDelMes = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
            return new Date(m.getFullYear(), m.getMonth(), Math.min(anclaDia, ultimoDelMes));
        };

        // Enero no computa: es feria entera. Se lo saltea corriendo un mes mas,
        // y eso es exacto y no una aproximacion. El tramo que se descarta --del
        // dia D de diciembre al dia D de enero-- trae dias corridos de
        // diciembre que si deberian contar; el primer tramo que si computa
        // --del dia D de enero al dia D de febrero-- trae los dias de enero que
        // NO deberian contar. Son la misma cantidad en los dos casos (31 - D),
        // asi que se cancelan.
        var corrimientos = 0;
        var computados = 0;
        while (computados < meses) {
            corrimientos++;
            var fin = tramo(corrimientos);
            if (CJ.esFeriaEnero(fin)) {
                eneroExcluido.push(fin.getFullYear());
                continue;
            }
            computados++;
        }
        ordDate = tramo(corrimientos);

        // Feria de julio: art. 311 CPCCN --el plazo corre durante los dias
        // inhabiles "salvo los que correspondan a las ferias judiciales", asi
        // que los dias de feria que caen dentro del plazo se descuentan y el
        // vencimiento se corre otro tanto.
        //
        // Se itera a punto fijo porque correr el vencimiento puede meter mas
        // dias de feria adentro del plazo, y esos tambien hay que descontarlos.
        // Sin iterar, un vencimiento nominal que cayera DENTRO de la feria
        // sumaba solo los dias solapados y quedaba igual adentro: con inicio
        // 23/6/2026 y plazo de 1 mes daba 27/7/2026, que es un dia de feria.
        // Fallaba en el 3,7 % de los cruces de fecha de inicio por plazo,
        // siempre por lo mismo. Reportado por Javier el 5/8/2026.
        var nominalDate = new Date(ordDate);

        // Los anios cuya Acordada de feria no esta cargada y que este computo
        // llega a tocar. Se anotan aca y no en la auditoria del motor porque
        // este calculo NO pasa por esDiaHabil: pregunta por los rangos
        // directo, asi que el calendario nunca se entera de que se lo
        // consulto. Ese fue el agujero del 17/8: la guarda existia y jamas
        // disparaba.
        var aniosSinFeria = new Set();

        var feriasDe = function (year) {
            var r = CJ.obtenerFeriasDelAnio(year);
            if (r === undefined) aniosSinFeria.add(year);
            return r || [];
        };

        // Dias de feria comprendidos entre el inicio y una fecha dada.
        var diasDeFeriaHasta = function (hasta) {
            var dias = 0;
            var detalle = [];
            for (var anio = startDate.getFullYear(); anio <= hasta.getFullYear(); anio++) {
                (function (anioActual) {
                    feriasDe(anioActual).forEach(function (f) {
                        var desde = new Date(Math.max(startDate.getTime(), f.inicio.getTime()));
                        var hastaFeria = new Date(Math.min(hasta.getTime(), f.fin.getTime()));
                        if (hastaFeria >= desde) {
                            var n = Math.round((hastaFeria.getTime() - desde.getTime()) / 86400000) + 1;
                            dias += n;
                            detalle.push({ anio: anioActual, feria: f, dias: n });
                        }
                    });
                })(anio);
            }
            return { dias: dias, detalle: detalle };
        };

        var feria = diasDeFeriaHasta(ordDate);
        for (var iter = 0; iter < 12; iter++) {
            var propuesta = new Date(nominalDate);
            propuesta.setDate(nominalDate.getDate() + feria.dias);
            if (propuesta.getTime() === ordDate.getTime()) break;
            ordDate = propuesta;
            feria = diasDeFeriaHasta(ordDate);
        }

        // Y despues del punto fijo, enero otra vez.
        //
        // POR QUE HACE FALTA UNA SEGUNDA VEZ. Las dos suspensiones del art. 311
        // estaban aplicadas en momentos distintos del calculo: enero se saltea
        // arriba, en la etapa de los tramos, o sea sobre el vencimiento NOMINAL;
        // la feria de invierno se descuenta aca, sumando dias al final. Con eso,
        // un tramo que termina en diciembre no pasa por el salteo --diciembre no
        // es enero-- y despues los dias de feria de invierno lo empujan adentro
        // de enero, que no computa, sin que quede nadie mirando.
        //
        // El caso, de Javier: ultimo acto impulsor el 21/6/2025, seis meses. Los
        // tramos van 21/7, 21/8, 21/9, 21/10, 21/11 y 21/12/2025; los doce dias
        // de la feria de 2025 --21/7 al 1/8, Acordada 9/2025-- lo corren al
        // 2/1/2026, que es feria de enero. Hasta el 26/8/2026 la pantalla lo
        // afirmaba sin un solo aviso. Eran 67 de 10.956 cruces entre 2021 y 2025.
        //
        // POR QUE SE CORRE UN MES Y NO AL PRIMER DIA DE FEBRERO. El plazo del
        // ejemplo necesita 183 dias corridos --del 21/6 al 21/12, de fecha a
        // fecha, art. 6 CCyC--. Del 22/6 al 31/12 hay 193 dias de calendario y
        // doce fueron feria: corrieron 181. LE FALTABAN DOS. Enero aporta cero,
        // asi que esos dos corren el 1 y el 2 de febrero y el plazo vence el
        // 2/2/2026. Vencerlo el 1 seria darlo por cumplido sin haber servido los
        // dos dias que se saltearon.
        //
        // Y no es una aproximacion: corriendo el plazo dia por dia desde el
        // 21/6/2025 y salteando todo dia de feria --los doce de julio y los
        // treinta y uno de enero-- se cae exactamente en el 2/2/2026. Sobre los
        // 67 casos afectados este corrimiento coincide con ese conteo literal en
        // 56; los once que difieren son exactamente aquellos cuyo acto impulsor
        // cae ADENTRO de la feria de invierno, que es otra pregunta y esta
        // abierta.
        //
        // Se usa el MISMO corrimiento que el salteo de los tramos --un mes,
        // respetando el ancla del dia-- y no uno nuevo: aplicar dos correcciones
        // distintas a la misma suspension es lo que produjo este bug.
        //
        // Decidido por Javier el 26/8/2026, con el caso en la mano.
        var corridoDeEnero = null;
        var vueltas = 0;
        while (CJ.esFeriaEnero(ordDate) && vueltas++ < 3) {
            var antesDeCorrer = new Date(ordDate);
            var mesSiguiente = new Date(ordDate.getFullYear(), ordDate.getMonth() + 1, 1);
            var ultimoDelSiguiente = new Date(mesSiguiente.getFullYear(), mesSiguiente.getMonth() + 1, 0).getDate();
            ordDate = new Date(
                mesSiguiente.getFullYear(),
                mesSiguiente.getMonth(),
                Math.min(ordDate.getDate(), ultimoDelSiguiente)
            );
            corridoDeEnero = {
                anio: antesDeCorrer.getFullYear(),
                desde: antesDeCorrer,
                hasta: new Date(ordDate)
            };
        }

        // Si el calculo toco un anio sin Acordada de feria cargada, no se
        // afirma una fecha: se dice cual falta. Es la misma regla que rige para
        // los feriados nacionales (ver AGENTS.md), y la frase vive aca por el
        // mismo motivo por el que problemaDeDatos() vive en el calendario:
        // cinco pantallas sin build no mantienen cinco copias de la misma
        // prosa. Se arma aparte de problemaDeDatos() porque el motor no puede
        // haberse enterado --ver el comentario de aniosSinFeria--.
        var faltantes = Array.from(aniosSinFeria).sort();
        var problema = faltantes.length
            ? 'El plazo alcanza ' + (faltantes.length === 1 ? 'el año ' : 'los años ') +
              faltantes.join(', ') + ', y la feria judicial de invierno ' +
              (faltantes.length === 1 ? 'de ese año' : 'de esos años') + ' todavía no está ' +
              'cargada. La fija la CSJN por Acordada, normalmente entre abril y junio del mismo ' +
              'año, y esta herramienta no la deduce: sin ella el plazo vencería antes de lo que vence.'
            : CJ.problemaDeDatos();

        var base = {
            problema: problema,
            inicio: startDate,
            meses: meses,
            corrimientos: corrimientos,
            eneroExcluido: eneroExcluido,
            corridoDeEnero: corridoDeEnero,
            // Donde caen los meses contados de fecha a fecha, ANTES de sumarle
            // los dias de feria de invierno. Es un hito del computo y no un
            // resultado: la pantalla lo dibuja para poder contar la historia
            // --los meses llegaron hasta aca, la feria lo empujo hasta alla--
            // sin reconstruirlo restando dias, que seria una segunda cuenta.
            vencimientoNominal: nominalDate,
            feriaAtravesada: feria.detalle,
            vencimiento: ordDate,
        };

        // Con un dato faltante no se sigue calculando. La pantalla vieja
        // devolvia aca mismo, asi que el computo con inhabiles no llegaba a
        // correr: se conserva, y ademas es lo que corresponde.
        if (problema) return base;

        return base;
    }

    // El "segundo computo" de caducidad ---al vencimiento ordinario se le
    // sumaban los dias inhabiles que no son de feria--- SE ELIMINO el 31/8/2026,
    // por decision de Javier. Vivia adentro de un div con display:none: la
    // pantalla no lo mostraba y el motor lo calculaba igual, en cada consulta.
    // Un numero que nadie ve no se puede verificar y no se puede desmentir, y
    // este ademas era el mas caro de los dos ---itera a punto fijo dos veces---.
    // Si alguna vez hace falta, esta entero en HISTORIA.md y en el historial.

    // --- Dias entre dos fechas ----------------------------------------------
    //
    // Transcripcion de performCalculation() en entre-fechas.html, sin la parte
    // que lee el formulario ni la que arma el HTML. La aritmetica no se toco.
    //
    // Es la unica de las cinco de plazos que NO computa un vencimiento: cuenta.
    // Y es la unica que puede contestar sin el calendario cargado, porque el
    // conteo de dias corridos no depende de ningun feriado. Por eso la
    // auditoria se reinicia SOLO cuando se cuentan habiles: reiniciarla siempre
    // haria que un conteo de corridos borrara la auditoria de otro calculo.
    //
    // opciones:
    //   desde, hasta     { anio, mes, dia } cada una. La pantalla las valida
    //                    antes: aca se asume que existen y que desde <= hasta.
    //   incluirInicio    contar el dia de arranque
    //   incluirFin       contar el dia de cierre
    //   soloHabiles      descontar fines de semana, feriados, asuetos y feria
    function entreFechas(opciones) {
        var CJ = calendario();
        var o = opciones || {};
        var desde = o.desde || {};
        var hasta = o.hasta || {};
        var soloHabiles = !!o.soloHabiles;

        var startDate = fechaLocal(desde.anio, desde.mes, desde.dia);
        var endDate = fechaLocal(hasta.anio, hasta.mes, hasta.dia);

        // Solo el conteo de habiles depende de la feria; el de dias corridos
        // no. Se audita para no contar julio como habil en un anio cuya
        // Acordada la CSJN todavia no dicto.
        if (soloHabiles) CJ.reiniciarAuditoria();

        var excluidos = [];
        var contados = [];
        var total = 0;

        var actualStart = new Date(startDate);
        var actualEnd = new Date(endDate);

        if (!o.incluirInicio) actualStart.setDate(actualStart.getDate() + 1);
        if (!o.incluirFin) actualEnd.setDate(actualEnd.getDate() - 1);

        var currentDate = new Date(actualStart);

        while (currentDate.getTime() <= actualEnd.getTime()) {
            var cuenta = true;
            var motivo = null;

            if (soloHabiles && !CJ.esDiaHabil(currentDate)) {
                cuenta = false;
                motivo = CJ.obtenerMotivoInhabil(currentDate) || 'Inhábil';
            }

            if (cuenta) {
                total++;
                // Los dias que SI entraron al conteo. Se anotan aca y no se
                // reconstruyen del lado de la pantalla: si el dibujo caminara
                // el rango por su cuenta y descontara los excluidos, seria una
                // segunda implementacion de este conteo y podria mostrar un
                // ultimo numero distinto de `total`. Un dibujo que discrepa
                // del numero miente con mas autoridad que el numero.
                contados.push(new Date(currentDate));
            } else if (soloHabiles && motivo) {
                excluidos.push({ fecha: new Date(currentDate), motivo: motivo });
            }

            currentDate.setDate(currentDate.getDate() + 1);
        }

        return {
            problema: soloHabiles ? CJ.problemaDeDatos() : null,
            desde: startDate,
            hasta: endDate,
            desdeEfectivo: actualStart,
            hastaEfectivo: actualEnd,
            soloHabiles: soloHabiles,
            total: total,
            contados: contados,
            excluidos: excluidos
        };
    }

    // --- Plazo regresivo: N dias habiles hacia atras -------------------------
    //
    // Transcripcion de calcular() en regresiva.html, sin la parte que lee el
    // formulario ni la que arma el HTML. La aritmetica no se toco.
    //
    // Contesta la pregunta al reves que las demas: no "cuando vence" sino
    // "hasta cuando tengo para presentar algo que tiene que estar N dias
    // habiles antes de una fecha". El conteo arranca el dia ANTERIOR al
    // objetivo --el objetivo no se cuenta-- y la fecha limite es el ultimo dia
    // contado, no el siguiente.
    //
    // EL ORDEN DE LO QUE DEVUELVE IMPORTA, porque es el orden en que la
    // pantalla avisa: primero el dato faltante, despues el objetivo inhabil,
    // y recien despues se valida el plazo. Al reves, una fecha de feria con el
    // plazo mal escrito se quejaria del plazo y no de la fecha.
    //
    // opciones:
    //   anio, mes, dia   la fecha objetivo, que tiene que ser habil
    //   dias             dias habiles de antelacion
    function regresiva(opciones) {
        var CJ = calendario();
        var o = opciones || {};

        var fechaObj = fechaLocal(o.anio, o.mes, o.dia);

        // Sin la Acordada de feria de ese anio, julio se contaria como habil y
        // el plazo regresivo arrancaria tarde. No se deduce.
        CJ.reiniciarAuditoria();
        CJ.esDiaHabil(fechaObj);
        var problema = CJ.problemaDeDatos();
        if (problema) {
            return { problema: problema, objetivo: fechaObj, objetivoInhabil: null, fechaLimite: null, evaluados: null };
        }

        var motivoObjetivo = CJ.obtenerMotivoInhabil(fechaObj);
        if (motivoObjetivo !== null) {
            return { problema: null, objetivo: fechaObj, objetivoInhabil: motivoObjetivo, fechaLimite: null, evaluados: null };
        }

        var dias = Number(o.dias);
        if (!Number.isInteger(dias) || dias < 1) {
            throw new Error('Los días tienen que ser un número entero mayor o igual a 1.');
        }

        var fechaActual = new Date(fechaObj);
        fechaActual.setDate(fechaActual.getDate() - 1);

        var diasRestantes = dias;
        var evaluados = [];

        while (diasRestantes > 0) {
            var motivo = CJ.obtenerMotivoInhabil(fechaActual);
            var esHabil = motivo === null;

            evaluados.push({
                fecha: new Date(fechaActual),
                contado: esHabil,
                motivo: esHabil ? null : motivo
            });

            if (esHabil) diasRestantes--;

            // Cuando ya se contaron todos, NO se retrocede una vez mas: la
            // fecha limite es el ultimo dia contado y no el anterior a el.
            if (diasRestantes > 0) {
                fechaActual.setDate(fechaActual.getDate() - 1);
            }
        }

        // LA GUARDA SE VUELVE A LEER ACA, Y NO SOLO ARRIBA.
        //
        // Arriba se audita la fecha OBJETIVO, que es lo unico que se conoce
        // antes de contar. Pero este computo retrocede, y retrocediendo se sale
        // de la ventana de cobertura sin que nadie mire: hasta el 26/8/2026 el
        // objetivo 4/2/2021 con 40 dias de antelacion contestaba 10/11/2020 sin
        // un solo aviso, y de 2020 no estan cargados ni los feriados nacionales
        // ni los asuetos --y encadeno once ferias extraordinarias--. O sea que
        // dias que fueron inhabiles se contaban como habiles, y el plazo
        // arrancaba mas tarde de lo que arranca.
        //
        // En vencimientos y en mora esto no pasa porque el computo avanza y la
        // auditoria se lee al final. Aca hacia falta leerla en los dos lados: la
        // de arriba para no calcular sobre un objetivo que ya no se puede
        // evaluar, la de aca para no afirmar una fecha que se apoyo en un anio
        // que no esta.
        var problemaAlContar = CJ.problemaDeDatos();
        if (problemaAlContar) {
            return {
                problema: problemaAlContar,
                objetivo: fechaObj,
                objetivoInhabil: null,
                dias: dias,
                fechaLimite: null,
                evaluados: null
            };
        }

        return {
            problema: null,
            objetivo: fechaObj,
            objetivoInhabil: null,
            dias: dias,
            fechaLimite: new Date(fechaActual),
            evaluados: evaluados
        };
    }

    // La API publica, y es contrato con otro repositorio. Ademas de las
    // pantallas y de conectores/nucleo.mjs, desde el 11/9/2026 el `ledger`
    // carga este archivo desde el sitio publicado y llama a:
    //
    //   caducidad({ anio, mes, dia, meses })
    //       y lee `problema` y `vencimiento`
    //   vencimiento({ modalidad: 'cedula', anio, mes, dia, plazo })
    //       y lee `problema`, `vencimientoSinGracia` --el dia en que vence--
    //       y `vencimiento` --el siguiente, el de las dos horas de gracia--
    //
    // Lee cada Date con getFullYear/getMonth/getDate, locales: la hora que
    // devuelve cada funcion --mediodia UTC una, medianoche local la otra--
    // tambien es contrato. Un nombre o un significado que cambia no le da
    // error: deja de mostrar la fecha, o muestra otra. No se toca sin avisar
    // alla (docs/ESTADO.md). Lo prueba el bloque del ledger de
    // scripts/verificar-plazos.mjs.
    var API = {
        notificacionAutomatica: notificacionAutomatica,
        proximoDiaDeNota: proximoDiaDeNota,
        parDeNotas: parDeNotas,
        vencimiento: vencimiento,
        caducidad: caducidad,
        entreFechas: entreFechas,
        regresiva: regresiva,
        mora: mora
    };

    if (typeof window !== 'undefined' && window) window.Plazos = API;
    if (typeof module !== 'undefined' && module.exports) module.exports = API;
})();
