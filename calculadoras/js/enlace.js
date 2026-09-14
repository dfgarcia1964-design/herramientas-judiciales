/* ------------------------------------------------------------------
   El caso que viene en el enlace.

   Una calculadora de plazos se puede abrir con los datos ya puestos:
     vencimientos.html#modalidad=automatica&fecha=2026-09-14&plazo=5
   La primera que lo pidio fue el ledger, que no puede computar la
   notificacion automatica ---depende de las notas del Libro de
   Asistencia, que pregunta la pantalla--- y abre la calculadora con lo
   que sabe. Desde el 14/9/2026 lo leen las cinco de plazos.

   LAS TRES DECISIONES, que no hay que revisar sin saber por que estan:

   1. Los datos van en el FRAGMENTO (#...), no en la consulta (?...).
      El fragmento no viaja en ningun request: no llega al servidor ni
      queda en sus registros. Una fecha y un plazo no identifican a
      nadie, pero son datos de un expediente concreto. Es la misma
      decision que tasa y prorrateo tomaron para su enlace.

   2. El enlace COMPLETA Y NO CALCULA. Las pantallas de plazos preguntan
      cosas que un enlace no sabe ---las notas del Libro de Asistencia,
      el horario, la ampliacion por distancia---, y un resultado
      calculado al abrir parece terminado sin que nadie las haya
      contestado. Decision de Javier del 14/9/2026.

   3. Con un dato invalido NO SE COMPLETA NINGUNO, y se dice cual fallo.
      Medio formulario lleno por un enlace roto se confunde con uno
      bueno; un formulario vacio con el motivo arriba, no.

   Este archivo decide como se lee un enlace y como se avisa. Que dato
   va en que campo lo decide cada pantalla, con su esquema: son cinco
   formularios distintos.

   Los nombres de cada esquema son contrato: el ledger ya arma enlaces
   con los de vencimientos. Estan listados en docs/ESTADO.md.
   ------------------------------------------------------------------ */
(function (global) {
    'use strict';

    // ------------------------------------------------------------------
    // Los tipos. Cada uno recibe el texto crudo del enlace y devuelve
    // { valor } o { problema }. El problema es una frase que termina de
    // decir que le pasa al dato, y la ve el usuario: lleva tildes.
    // ------------------------------------------------------------------

    // AAAA-MM-DD, que es como viajan las fechas en todo el sistema
    // (conectores/ y el ledger). Se devuelve en texto, con ceros, porque
    // los campos de las pantallas son de texto y asi los llena el usuario.
    function fecha(texto) {
        var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);
        if (!m) return { problema: 'tiene que ser una fecha escrita AAAA-MM-DD' };
        var a = parseInt(m[1], 10), me = parseInt(m[2], 10), d = parseInt(m[3], 10);
        // Se construye y se le pregunta si quedo en el dia pedido: es la
        // forma de rechazar un 31 de febrero, igual que en las pantallas.
        var f = new Date(a, me - 1, d);
        if (f.getFullYear() !== a || f.getMonth() !== me - 1 || f.getDate() !== d) {
            return { problema: 'no es una fecha que exista' };
        }
        return { valor: { anio: m[1], mes: m[2], dia: m[3] } };
    }

    function entero(min, max) {
        return function (texto) {
            var rango = 'un número entero de ' + min + ' a ' + max;
            if (!/^\d{1,4}$/.test(texto)) return { problema: 'tiene que ser ' + rango };
            var n = parseInt(texto, 10);
            if (n < min || n > max) return { problema: 'tiene que ser ' + rango };
            return { valor: n };
        };
    }

    function opcion(lista) {
        return function (texto) {
            if (lista.indexOf(texto) === -1) {
                return { problema: 'tiene que ser ' + lista.map(function (o) { return '«' + o + '»'; }).join(' o ') };
            }
            return { valor: texto };
        };
    }

    function siNo(texto) {
        var r = opcion(['si', 'no'])(texto);
        return r.problema ? r : { valor: texto === 'si' };
    }

    // ------------------------------------------------------------------
    // La lectura, con desconfianza: el fragmento lo escribe cualquiera y
    // un cliente de correo lo puede cortar.
    //
    // Devuelve { datos, problema }. Sin nada que leer, los dos son null y
    // la pantalla arranca vacia como siempre. Un fragmento sin ningun «=»
    // tampoco se lee: no es un enlace con datos, es un ancla.
    // ------------------------------------------------------------------
    function leer(esquema, fragmento) {
        var crudo = fragmento === undefined ? global.location.hash : fragmento;
        crudo = String(crudo || '').replace(/^#/, '');
        if (crudo.indexOf('=') === -1) return { datos: null, problema: null };

        var datos = {};
        var partes = crudo.split('&');
        for (var i = 0; i < partes.length; i++) {
            if (!partes[i]) continue;
            var corte = partes[i].indexOf('=');
            var clave, texto;
            try {
                clave = decodeURIComponent(corte === -1 ? partes[i] : partes[i].slice(0, corte));
                texto = corte === -1 ? '' : decodeURIComponent(partes[i].slice(corte + 1));
            } catch (e) {
                return fallo('el enlace tiene caracteres que no se pueden leer');
            }
            if (!Object.prototype.hasOwnProperty.call(esquema, clave)) {
                return fallo('«' + clave + '» no es un dato que esta calculadora lea');
            }
            if (Object.prototype.hasOwnProperty.call(datos, clave)) {
                return fallo('«' + clave + '» viene dos veces');
            }
            var r = esquema[clave](texto);
            if (r.problema) return fallo('«' + clave + '» ' + r.problema);
            datos[clave] = r.valor;
        }
        return { datos: datos, problema: null };
    }

    function fallo(problema) {
        return { datos: null, problema: problema };
    }

    // ------------------------------------------------------------------
    // El aviso, arriba del formulario. Se dice siempre que el formulario
    // vino de un enlace: la pantalla no calcula sola (decision 2), y sin
    // el aviso la persona espera un resultado que no va a aparecer.
    // ------------------------------------------------------------------
    var CLASE = 'aviso-enlace';

    function avisar(contenedor, texto, esProblema) {
        var p = contenedor.querySelector(':scope > .' + CLASE);
        if (!texto) { if (p) p.remove(); return; }
        if (!p) {
            p = document.createElement('p');
            p.className = CLASE;
            p.setAttribute('role', 'status');
            contenedor.insertBefore(p, contenedor.firstChild);
        }
        p.classList.toggle('problema', !!esProblema);
        p.textContent = texto;
    }

    // Lo que hacen las cinco pantallas, en un solo lugar: leer, y completar
    // o avisar. `completar` recibe los datos ya validados; `texto`, si
    // viene, es una funcion de esos datos y reemplaza la frase de siempre.
    function aplicar(opciones) {
        var r = leer(opciones.esquema);
        if (r.problema) {
            avisar(opciones.contenedor,
                'El enlace con el que se abrió esta página trae un dato que no se puede usar: ' +
                r.problema + '. No se completó ningún campo.', true);
            return;
        }
        if (!r.datos) return;
        opciones.completar(r.datos);
        avisar(opciones.contenedor, (opciones.texto && opciones.texto(r.datos)) ||
            'Estos datos vienen del enlace. Revisalos, completá lo que falte y apretá Calcular.');
    }

    // Limpiar tiene que olvidar el enlace: si no, recargar la pagina
    // vuelve a llenar lo que la persona acaba de borrar. replaceState no
    // deja una entrada en el historial ni dispara hashchange.
    function olvidar(contenedor) {
        if (contenedor) avisar(contenedor, null);
        if (global.location.hash) {
            global.history.replaceState(null, '', global.location.pathname + global.location.search);
        }
    }

    // Un enlace nuevo pegado sobre la pagina abierta cambia solo el
    // fragmento, y el navegador no recarga. Se recarga a mano: rellenar
    // encima de un formulario ya tocado dejaria datos del caso anterior.
    global.addEventListener('hashchange', function () { global.location.reload(); });

    global.EnlaceCaso = {
        fecha: fecha,
        entero: entero,
        opcion: opcion,
        siNo: siNo,
        leer: leer,
        aplicar: aplicar,
        avisar: avisar,
        olvidar: olvidar
    };
})(window);
