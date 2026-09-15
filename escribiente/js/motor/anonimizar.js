// ---------------------------------------------------------------------------
// Anonimizacion de escritos, resoluciones y expedientes.
//
// Portadas de otra herramienta propia, anterior a esta y fuera de este
// repositorio, donde llevan tiempo en uso. Los comentarios de cada regla vienen
// de alla y NO son decoracion: cada uno anota una fuga o una corrupcion de texto
// que efectivamente paso. Si vas a tocar un patron, leelo primero; casi todos
// parecen mejorables hasta que se entiende que evitan.
//
// EL DISENO, EN UNA FRASE: la maquina reemplaza lo que tiene forma inequivoca
// y le pregunta al humano por los nombres propios. No hay heuristica que
// distinga sola "Perez, Juan Carlos" (la parte, hay que ocultarla) de
// "Llambias, Jorge Joaquin" (doctrina, hay que conservarla) ni de "Buenos
// Aires, Astrea" (una editorial). Adivinar rompe el texto; no adivinar filtra.
// Preguntar es lo correcto, y es barato: son treinta segundos de casillas.
//
// Por que en tres pasos y en este orden, que costo una fuga:
//   1. identificadores de forma inequivoca, que consumen el token entero
//   2. los reemplazos que confirmo el usuario
//   3. reglas que miran nombres propios (tratamiento, domicilio, dominio)
// Con el orden al reves, un nombre como "Ficticio" pega DENTRO de
// "aficticio@ficticio-inventado.com" y lo deja como "a[PERSONA]@[PERSONA]-inventado.com":
// el patron de email ya no reconoce nada, y el dominio —que lleva el otro
// apellido— sobrevive entero.
// ---------------------------------------------------------------------------

// JS no es Python: `\w` es ASCII y `\b` se apoya en `\w`, asi que ninguno de
// los dos ve una tilde. Un patron con `\bAlvarez` no engancha "Álvarez" porque
// "Á" no es caracter de palabra y el limite de palabra no existe ahi. De ahi
// que las clases esten escritas a mano en todo el archivo.
const MAY = 'A-ZÁÉÍÓÚÜÑ';
const MIN = 'a-záéíóúüñ';
const LETRA = MAY + MIN;

// Limite de palabra que si ve las tildes: o borde del texto, o algo que no es
// letra ni digito. Se captura y se devuelve en el reemplazo.
const ANTES = `(^|[^${LETRA}\\d])`;
const DESPUES = `(?=[^${LETRA}\\d]|$)`;

// Las particulas de un apellido o de un nombre compuesto: "Del Monte", "de la
// Fuente", "Maria de los Angeles", "Di Pietro". Tres de ellas —del, las, los—
// estan tambien en NO_SON_PERSONAS, porque sueltas en un titulo delatan que no
// hay un nombre; EN EL MEDIO de dos palabras de nombre, en cambio, son parte
// del nombre. Quien las consulta decide cual de las dos cosas mira.
const PARTICULAS = ['de', 'del', 'la', 'las', 'los', 'di', 'da', 'van', 'von'];
const PARTICULA = `(?:${PARTICULAS.join('|')})`;
// Para los patrones que corren SIN la bandera `i`: "de", "De" y "DE".
const PARTICULA_CUALQUIER_CAJA = `(?:${PARTICULAS
    .flatMap((p) => [p, p[0].toUpperCase() + p.slice(1), p.toUpperCase()])
    .join('|')})`;

function limpiarPalabra(palabra) {
    return sinTildes(palabra.replace(/[,.;:"“”'()]/g, '').toLowerCase());
}

function esParticula(palabra) {
    return PARTICULAS.includes(limpiarPalabra(palabra));
}

// Terminaciones que no lleva ningun nombre de persona y lleva casi todo el
// vocabulario de un titulo: "PRESCRIPCION ADQUISITIVA", "INTERPONE
// REVOCATORIA", "SOLICITA SUSPENSION". Agregar a mano cada una de esas palabras
// a NO_SON_PERSONAS es una lista que no termina nunca; la terminacion las
// alcanza a todas.
//
// LAS EXCEPCIONES SON NOMBRES, y sin ellas la regla se come uno: "Concepcion"
// y "Asuncion" son nombres de pila, y una parte que se llama asi dejaba de
// salir entera de la caratula.
const TERMINACION_QUE_NO_ES_NOMBRE = /(?:cion|sion|miento|mente|tivo|tiva|tivos|tivas|sivo|siva)$/;
const NOMBRES_CON_ESA_TERMINACION = new Set([
    'concepcion', 'asuncion', 'encarnacion', 'purificacion', 'anunciacion',
    'consolacion', 'ascension', 'visitacion',
]);

// Lo que delata que una palabra no es parte de un nombre de persona.
function noEsNombre(palabra) {
    const p = limpiarPalabra(palabra);
    if (NO_SON_PERSONAS.has(p)) return true;
    return TERMINACION_QUE_NO_ES_NOMBRE.test(p) && !NOMBRES_CON_ESA_TERMINACION.has(p);
}

// Las reglas de formulario y la de tratamiento corren con la bandera `i`
// —"DOMICILIO:" y "Domicilio:" son la misma etiqueta— y eso apaga la
// distincion entre mayuscula y minuscula tambien en el valor. La guarda va
// aparte, en una funcion, para que el valor siga teniendo que empezar en
// mayuscula: es lo unico que separa un nombre de una frase.
function empiezaEnMayuscula(valor) {
    return new RegExp(`^[ \\t]*[${MAY}]`).test(valor);
}

// Guarda de la regla de tratamiento, que es la unica que corre sobre PROSA con
// la bandera `i`: ahi no alcanza con la mayuscula inicial, porque "Sres. Los
// Abogados" la tiene. Devuelve cuantas palabras del principio son el nombre, o
// 0 si no hay nombre.
//
// POR QUE DEVUELVE UN LARGO Y NO UN SI O UN NO, 15/9/2026. La regla toma hasta
// cuatro palabras y no vuelve atras: si la guarda rechaza el calce, el nombre
// entero queda en el texto. Con "Dra. Lucia Ines Del Monte" en un solo
// renglon, el "Del" —que esta en NO_SON_PERSONAS— rechazaba todo, y un
// tratamiento seguido de un nombre salia completo. Ahora las particulas del
// medio ("Del", "de la") son parte del nombre, y lo que sobra al final ("Dr.
// Juan Perez Juzgado") se devuelve al texto en vez de tirar el calce. Lo que
// sobra puede ser un cargo, y por eso los cargos estan en NO_SON_PERSONAS: sin
// "directora", "la Sra. Directora General" salia como "Sra. [PERSONA] General".
//
// El nombre es lo que viene detras del tratamiento HASTA la primera palabra que
// no es de nombre: una del oficio ("Dr. Juan Perez Juzgado Nro. 3"), o una en
// minuscula que no sea particula —con la bandera `i` el patron no las distingue,
// y "el Dr. Carlos Pietro contesto" se llevaba el verbo adentro del reemplazo—.
// Si la primera ya no es de nombre ("Sr. Juez", "Sres. Los Abogados"), no hay
// nombre. Una particula adelante seguida de un nombre es un apellido: "Sr. De
// la Rua".
function largoDeNombre(valor) {
    if (!empiezaEnMayuscula(valor)) return 0;
    const palabras = valor.trim().split(/\s+/);
    let fin = palabras.findIndex((p, i) => !esParticula(p) &&
        (noEsNombre(p) || (i > 0 && !new RegExp(`^[${MAY}]`).test(p))));
    if (fin === -1) fin = palabras.length;
    while (fin > 0 && esParticula(palabras[fin - 1])) fin--;
    return fin;
}

// ---------------------------------------------------------------------------
// Nivel 1: identificadores estructurados.
//
// Se reemplazan siempre, sin preguntar. Tienen forma inequivoca, asi que no
// hay falsos positivos que danen el texto. Van ANTES que los reemplazos que
// elige el usuario porque consumen el token completo.
// ---------------------------------------------------------------------------

export const REGLAS_IDENTIFICADORES = [
    {
        nombre: 'firma',
        // Los PDF del PJN cierran con "Firmado por: LOPEZ MARIA, Juez de
        // Primera Instancia". Se oculta el nombre y SE CONSERVA el cargo: quien
        // firmo la resolucion es dato del expediente, no dato personal, y sin el
        // no se entiende quien resolvio que. La herramienta anterior reemplazaba
        // la linea entera por "[Firma]" y se llevaba el cargo puesto.
        patron: /(Firmad[oa]s?\s+(?:digitalmente\s+)?por\s*:?\s*)([^,\n]+)/gi,
        reemplazo: '$1[PERSONA]',
    },

    // -----------------------------------------------------------------------
    // Campos de formulario: "Etiqueta: valor".
    //
    // POR QUE EXISTEN, 21/8/2026. El resto del motor esta escrito para PROSA, y
    // los adjuntos mas sensibles de un expediente no son prosa: son
    // formularios. La ficha del un formulario oficial que venia
    // adjunta a un exhorto trae el apellido, el nombre, la fecha de nacimiento,
    // el domicilio completo y el numero de tramite, cada uno en su renglon y
    // detras de su etiqueta. De todo eso el motor anonimizaba el telefono.
    //
    // POR QUE SE REEMPLAZAN SOLOS, si la regla de la casa es preguntar por los
    // nombres propios: porque aca la etiqueta hace inequivoca la forma, que es
    // el criterio de siempre. Detras de "Apellidos:" no hay una cita de
    // doctrina ni una editorial: hay un apellido. Es el mismo argumento que
    // sostiene la regla de la firma, que tambien reemplaza un nombre entero
    // porque "Firmado por:" dice que ahi va uno.
    //
    // Y no le esconden nada a la lista de candidatos: `candidatosANombre` corre
    // sobre el texto CRUDO, antes que cualquier regla, asi que el nombre que
    // esta detras de "Nombres:" se sigue ofreciendo para tildar y el reemplazo
    // lo alcanza tambien donde aparezca en el cuerpo del escrito.
    //
    // LAS DOS GUARDAS, que son lo que hace que no corrompan prosa:
    //   - los dos puntos son obligatorios. "constituyendo domicilio procesal en
    //     Sarmiento 940" no lleva ninguno, y de esa se ocupa la regla de
    //     domicilio de mas abajo.
    //   - el valor tiene que empezar en mayuscula. "Nombres: los que surgen del
    //     poder" no es un nombre, y sin esta guarda quedaba como
    //     "Nombres: [PERSONA]".
    // -----------------------------------------------------------------------
    {
        nombre: 'campo con nombre de persona',
        patron: new RegExp(
            `(\\b(?:Apellidos?(?:[ \\t]+y[ \\t]+nombres?)?|Nombres?|Padre|Madre` +
            `|Apoderad[oa]|Patrocinante|Testigo|Causante)[ \\t]*:[ \\t]*)([^\\n]+)`,
            'gi'
        ),
        reemplazo: (todo, etiqueta, valor) =>
            empiezaEnMayuscula(valor) ? etiqueta + '[PERSONA]' : todo,
    },
    {
        nombre: 'campo con domicilio',
        // El valor tiene que traer un numero ademas de empezar en mayuscula: un
        // domicilio lleva altura. Sin eso, "Domicilio: Se tiene presente el
        // denunciado" quedaba como "Domicilio: [DOMICILIO]".
        patron: new RegExp(
            `(\\b(?:Domicilio|Domicilios|Calle)` +
            `(?:[ \\t]+(?:legal|real|procesal|constituido|comercial|denunciado))?` +
            `[ \\t]*:[ \\t]*)([^\\n]+)`,
            'gi'
        ),
        reemplazo: (todo, etiqueta, valor) =>
            empiezaEnMayuscula(valor) && /\d/.test(valor) ? etiqueta + '[DOMICILIO]' : todo,
    },
    {
        nombre: 'campo con fecha de nacimiento',
        patron: /(\bFecha[ \t]+(?:de[ \t]+)?Nac(?:imiento)?\.?[ \t]*:[ \t]*)\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4}/gi,
        reemplazo: '$1[FECHA NAC]',
    },
    {
        nombre: 'campo con anio de nacimiento',
        // "Clase: 1958" es como el formulario oficial escribe el anio de nacimiento.
        patron: /(\bClase[ \t]*:[ \t]*)(?:19|20)\d{2}/g,
        reemplazo: '$1[AÑO NAC]',
    },
    {
        nombre: 'campo con datos de tramite',
        // "Datos del Trámite: Idtrámite :123456789 Ejemplar (B) Toma: 23/06/2015
        // BP: 67340100000284075415350003 Formulario: 0284075415 Oficina::7000".
        // Cuatro identificadores del tramite de DNI en un solo renglon, ninguno
        // con forma propia. La etiqueta cubre el renglon entero, que es lo unico
        // que los alcanza a los cuatro.
        patron: /(\bDatos[ \t]+del[ \t]+Tr[aá]mite[ \t]*:[ \t]*)[^\n]+/gi,
        reemplazo: '$1[TRÁMITE]',
    },
    {
        nombre: 'campo con matricula',
        // Los dos puntos son obligatorios por la misma razon que arriba:
        // "matrícula inscripta al T 45 F 210 del CPACF" es prosa, no lleva dos
        // puntos, y de ella se ocupa la regla de tomo y folio. Un renglon de
        // formulario, en cambio, es todo el campo: "Matrícula N°: XXXV, FOLIO
        // 271" no se puede recortar por la mitad sin dejar el numero a la vista.
        patron: /(\bMatr[ií]cula[ \t]*(?:N[°ºo]?\.?)?[ \t]*:[ \t]*)([^\n]+)/gi,
        reemplazo: (todo, etiqueta, valor) =>
            /\d/.test(valor) ? etiqueta + '[MATRICULA]' : todo,
    },

    {
        nombre: 'email',
        // Termina obligatoriamente en letra o digito, no en punto: sin eso el
        // patron se come el punto final de la oracion ("...@estudio.com." queda
        // como "[EMAIL]" y la frase siguiente arranca sin separacion).
        patron: /[\w.\-+]+@[\w-]+\.[\w.-]*[\w-]/g,
        reemplazo: '[EMAIL]',
    },
    {
        nombre: 'CUIT',
        patron: new RegExp(`${ANTES}\\d{2}-?\\d{8}-?\\d${DESPUES}`, 'g'),
        reemplazo: '$1[CUIT]',
    },
    {
        nombre: 'CBU',
        patron: new RegExp(`${ANTES}\\d{22}${DESPUES}`, 'g'),
        reemplazo: '$1[CBU]',
    },
    {
        nombre: 'CVU',
        patron: /\bCVU\s*:?\s*\d+/gi,
        reemplazo: '[CVU]',
    },
    {
        nombre: 'DNI con etiqueta',
        // Va ANTES que la regla de abajo, que es la ambigua. Un numero de
        // documento escrito SIN puntos no tiene forma propia —"5432109" son
        // siete digitos como cualquier otro numero— y por eso la regla de abajo
        // no lo puede mirar. Anclado en la palabra que lo nombra, en cambio, no
        // hay falso positivo posible: lo que viene despues de "DNI" es un DNI.
        //
        // CASO DE PRUEBA, 21/8/2026, en un documento largo que paso por la
        // herramienta: un informe del un formulario oficial trae
        // "DNI: 5432109" y "Tipo y N° de documento: DNI 18234567". Cinco
        // documentos de identidad no se detectaron, porque la unica
        // regla de DNI que habia exigia los puntos.
        //
        // La palabra que ancla SE CONSERVA, como en la de telefono: sin eso el
        // renglon queda como "[DNI]" pelado y no se entiende que se oculto.
        patron: /(\b(?:D\.?N\.?I\.?|L\.?[CE]\.?|documento(?:\s+nacional\s+de\s+identidad)?)\s*(?:n[°ºo]?\.?)?\s*:?\s*)(\d{1,2}\.\d{3}\.\d{3}|\d{7,8})(?![\d.,-])/gi,
        reemplazo: '$1[DNI]',
    },
    {
        nombre: 'DNI',
        // Un DNI con puntos tiene EXACTAMENTE la misma forma que un monto:
        // "30.119.078" y "3.255.622" no se distinguen mirando el numero. Se
        // excluye lo que venga precedido de "$" o seguido de decimales.
        //
        // Sin esto, "$ 3.255.622,50" quedaba como "$ [DNI],50" y el monto
        // reclamado —el dato del que depende toda la resolucion— desaparecia
        // del texto. Es la corrupcion mas cara de las que se encontraron,
        // porque no rompe nada visible: deja el documento diciendo otra cosa.
        // Un monto no siempre lleva el signo adelante: "la suma de 1.500.000" es
        // tan frecuente como "$ 1.500.000". Por eso, ademas del signo y de los
        // decimales, se mira la palabra que viene antes. Esta parte no esta en
        // la version original de las reglas y se agrego aca.
        patron: /((?:\$|pesos|suma de|importe de|valor de|monto de)\s*)?(\d{1,2}\.\d{3}\.\d{3})(\s*,\s*\d+|\s*(?:pesos|\$))?/gi,
        reemplazo: (todo, plata, numero, despues) => (plata || despues) ? todo : '[DNI]',
    },
    {
        nombre: 'expediente con contexto',
        // Va ANTES que la regla general a proposito: es mas especifica y
        // consume mas texto. Al reves, la general engancha primero la mitad
        // derecha y "Expte. 56.868/2017" termina como "Expte. 56.[EXPTE]", con
        // los primeros digitos del expediente a la vista. En la version original
        // de las reglas el orden esta invertido, y ese es el resultado.
        patron: /\b(?:expte|expediente|causa|autos)\.?\s*(?:n[°ºo]?\.?)?\s*\d{1,7}(?:\.\d{3})*\s*\/\s*(?:19|20)\d{2}/gi,
        reemplazo: '[EXPTE]',
    },
    {
        nombre: 'expediente',
        // Numero/anio suelto. Se exigen 3 digitos o mas para no comerse una
        // fecha: "el dia 06/08/2026" contiene "08/2026", que matcheaba y dejaba
        // "06/[EXPTE]". Las fechas son criticas en estos escritos —un plazo se
        // cuenta desde una— y romperlas es peor que no ocultar un expediente
        // corto. El punto en la clase de exclusion es lo que permite que
        // "56.868/2017" se tome entero en vez de por la mitad.
        patron: /(^|[^\d/.])((?:\d{1,3}\.)?\d{3,7}\s*\/\s*(?:19|20)\d{2})(?![\d/])/g,
        reemplazo: '$1[EXPTE]',
    },
    {
        nombre: 'matricula',
        // Tomo y folio: como se identifica a un abogado en el PJN.
        //
        // Se filtraron cuatro el 21/8/2026, todas por la misma razon: el patron
        // aceptaba UNA sola forma de escribirlo. Ahora entran los dos puntos
        // ("T: 62 F: 415"), la O mayuscula que deja el OCR donde va el ordinal
        // ("T°22 FO371") y el tomo escrito con la palabra entera.
        //
        // Los separadores son `[ \t]` y no `\s`: `\s` cruza el salto de linea,
        // y un tomo al final de un renglon se llevaria el numero del renglon
        // siguiente. Es la misma trampa que la de la regla de tratamiento.
        patron: /\b(?:T[ºo°]?|Tomo)[ \t]*[.:]?[ \t]*\d{1,4}[ \t]*[,/]?[ \t]*(?:F[ºoO°]?|Folio)[ \t]*[.:]?[ \t]*\d{1,4}/gi,
        reemplazo: '[MATRICULA]',
    },
    {
        nombre: 'telefono',
        patron: /(^|[^\d-])((?:\+?54\s*)?(?:11|15)[\s-]?\d{4}[\s-]?\d{4}(?:\s*\/\s*\d{4})?)(?![\d-])/g,
        reemplazo: '$1[TEL]',
    },
    {
        nombre: 'telefono local',
        // Fijo de CABA sin prefijo: ocho digitos pelados ("4371-1696"), que la
        // regla de arriba no engancha porque exige 11 o 15 adelante. Se ancla en
        // la palabra "tel"/"fax" a proposito: un \d{4}-\d{4} suelto tambien
        // matchea un rango de anios ("1994-2001"), y romper una cita por un
        // falso positivo es peor que no reemplazar. El "/2348" del final es el
        // interno, que en la primera version quedaba afuera.
        // La palabra que ancla se conserva: sin eso, "su telefono 4371-1696"
        // quedaba como "su [TEL]", que no se entiende al leer.
        patron: /\b(tel[eé]fonos?|celulares?|cel|fax|tel)(\.?\s*:?\s*)\d{4}[\s-]?\d{4}(?:\s*\/\s*\d{2,4})?/gi,
        reemplazo: '$1$2[TEL]',
    },
];

// ---------------------------------------------------------------------------
// Nivel 1b: reglas que miran nombres propios.
//
// Van DESPUES de los reemplazos que eligio el usuario: son heuristicas sobre
// sustantivos propios, y ahi el criterio de quien conoce el expediente tiene
// que ganarle al patron.
// ---------------------------------------------------------------------------

// Siglas que tienen la forma de una patente vieja. Ocultar el numero de un
// articulo deja la cita rota y sin arreglo posible del otro lado.
const NO_ES_DOMINIO = /^(ART|LEY|CPC|CCC|BIS|TER|CSJ|SRL|SAS|IVA|UMA|CPR|LCT|CPP|INC|NRO|FTS)\b/i;

// Piso, departamento y unidad, que van pegados a la altura.
//
// LA UNIDAD ES UN TOKEN CORTO Y CERRADO —un numero, una letra sola, o una letra
// entre comillas— y no "hasta seis caracteres", que es como estaba escrito.
// `[LETRA\d]{1,6}` se queda con seis letras de la palabra que siga y devuelve
// el resto: "Montevideo 1740 PB departamento 2" salia como "[DOMICILIO]amento
// 2". El `(?!LETRA)` del final es lo que impide comerse media palabra, y por
// eso "piso de la Ciudad" no se lleva el "de".
const UNIDAD = `(?:[ \\t]*(?:\\d{1,4}|["“][${LETRA}]["”]|[${LETRA}])(?![${LETRA}\\d]))?`;
const PISO =
    `(?:[ \\t]*[.,]?[ \\t]*(?:` +
    `\\d{1,3}[ºo°]?(?:do|er|ro|to|mo|vo|no)?[ \\t]*piso` +   // "2do piso", "5° piso"
    `|entre[ \\t]*piso|departamento|depto\\.?|dpto\\.?|piso|P\\.?B\\.?|of\\.?|oficina|U\\.?F\\.?` +
    `)${UNIDAD})`;

export const REGLAS_NOMBRES = [
    {
        nombre: 'dominio de automotor',
        patron: new RegExp(`${ANTES}([A-Z]{2}\\s?\\d{3}\\s?[A-Z]{2}|[A-Z]{3}\\s?\\d{3})${DESPUES}`, 'g'),
        reemplazo: (todo, antes, dominio) =>
            NO_ES_DOMINIO.test(dominio.trim()) ? todo : antes + '[DOMINIO]',
    },
    {
        nombre: 'persona con tratamiento',
        // Tratamiento + nombre propio: "Dr. Juan Carlos Perez", "Sra. Maria
        // Lopez". El tratamiento ancla el comienzo, que es lo que hace seguro el
        // reemplazo, y SE CONSERVA: "Dr." no identifica a nadie, y perderlo
        // borra la distincion entre el letrado y la parte, que es informacion
        // que la resolucion necesita para entenderse.
        //
        // El separador es `[ \t]+` y no `\s+`, que es lo que parece natural
        // escribir. `\s` incluye el salto de linea, y con eso la regla saltaba
        // al renglon siguiente y se llevaba puesto lo que hubiera ahi: una
        // resolucion que terminaba en "Firmado por: LOPEZ MARIA, Jueza" seguida
        // de "Poder Judicial de la Nacion - Lex100" quedaba como
        // "Jueza [PERSONA] - Lex100", con el pie del documento comido y el
        // reemplazo puesto donde no habia ningun nombre. Un tratamiento y su
        // nombre estan en el mismo renglon.
        //
        // LOS DOS PUNTOS Y LA BANDERA `i`, 21/8/2026. Una cedula del PJN
        // encabeza "SR :ERNESTO QUIROGA", con el tratamiento en mayusculas y un
        // separador que el patron no contemplaba: fallaba por las dos cosas a
        // la vez. Con `i` la clase `[MAY]` deja de distinguir mayusculas, asi
        // que la guarda pasa a una funcion —el nombre tiene que empezar en
        // mayuscula y no puede llevar ninguna palabra de NO_SON_PERSONAS—.
        // Sin esa guarda, "Sres. los abogados" quedaba como "Sres. [PERSONA]".
        patron: new RegExp(
            `\\b((?:Dr|Dra|Dres|Dras|Sr|Sra|Sres|Sras|Srta|Ing|Lic|Cdor|Cra|Arq|Juez|Jueza|Perito|Martiller[oa])\\.?)` +
            // El tratamiento tiene que terminar ahi. Sin este control, con la
            // bandera `i` el "Ing" de "INGENIERO JUAN" calza como tratamiento y
            // el resto de la palabra se va adentro del reemplazo:
            // "INGENIERO JUAN" quedaba como "Ing [PERSONA]".
            `(?=[^${LETRA}]|$)` +
            // Las particulas no cuentan entre las cuatro palabras: sin eso,
            // "Dr. Juan Perez de la Fuente" llenaba el cupo en "la" y el
            // apellido quedaba afuera, en claro.
            `[ \\t]*:?[ \\t]*([${MAY}][${LETRA}]+(?:[ \\t]+(?:${PARTICULA}[ \\t]+){0,2}[${MAY}][${LETRA}]+){0,3})`,
            'gi'
        ),
        reemplazo: (todo, tratamiento, nombre) => {
            const largo = largoDeNombre(nombre);
            if (!largo) return todo;
            const conservado = nombre.match(new RegExp(`^\\S+(?:[ \\t]+\\S+){${largo - 1}}`))[0];
            return `${tratamiento} [PERSONA]` + nombre.slice(conservado.length);
        },
    },
    {
        nombre: 'domicilio con ancla',
        // Calle y altura SIN piso ni departamento, que es como se escribe la
        // mayoria de los domicilios de un escrito: "Av. San Juan 640 CABA",
        // "Rivera 3120 CABA", "Alsina 1220 de Rosario". La regla de abajo los
        // dejaba enteros porque exige el piso.
        //
        // Sin piso hace falta otra cosa que acote, y esa es la palabra que
        // ancla —"domicilio", "sito", "calle"—. NO ES UN ADORNO: sin ella la
        // regla dice "cualquier palabra capitalizada seguida de un numero", y
        // eso tambien describe "el expediente 48210" y "el art. 431". La
        // palabra se conserva, como en la de telefono: "en [DOMICILIO]" a secas
        // no se entiende al leer.
        patron: new RegExp(
            `((?:domicili[oa]\\w*|sit[oa]|calle|avenida|av\\.)` +
            // El calificativo se repite: "domicilio legal constituido en X"
            // lleva dos, y aceptando uno solo el segundo se colaba adentro del
            // nombre de la calle y la guarda de mayuscula tiraba el calce.
            `(?:[ \\t]+(?:legal|real|procesal|constituid[oa]|comercial|denunciad[oa]))*` +
            `[ \\t]*:?[ \\t]*(?:en[ \\t]+)?)` +
            `([${MAY}][${LETRA}.]+(?:[ \\t]+(?:de[l]?|la|las|los)?[ \\t]*[${MAY}][${LETRA}.]+){0,2}` +
            `[ \\t]+\\d{1,5}${PISO}*)`,
            'gi'
        ),
        reemplazo: (todo, ancla, direccion) =>
            empiezaEnMayuscula(direccion) ? ancla + '[DOMICILIO]' : todo,
    },
    {
        nombre: 'domicilio',
        // Calle con altura, piso y departamento. Acá el que acota es el piso,
        // así que esta regla no necesita palabra que la ancle y alcanza un
        // domicilio suelto en su renglón.
        //
        // EL BLOQUE DE PISO YA NO CORTA LA PALABRA. Era `[LETRA\d"']{1,6}`, y
        // "Montevideo 1740 PB departamento 2" salía como "[DOMICILIO]amento 2":
        // el cuantificador se quedaba con seis letras de "departamento" y
        // devolvía el resto al texto. Un reemplazo partido al medio es peor que
        // ninguno, porque parece hecho.
        patron: new RegExp(
            `[${MAY}][${LETRA}]+(?:[ \\t]+[${MAY}]?[${LETRA}]+){0,2}[ \\t]+\\d{1,5}${PISO}+`,
            'gi'
        ),
        reemplazo: '[DOMICILIO]',
    },
];

// ---------------------------------------------------------------------------
// Nivel 2: candidatos a nombre propio.
//
// NO se reemplazan solos. Se listan para que el usuario decida, porque la misma
// forma "Apellido, Nombre" la producen las partes del juicio, las citas de
// doctrina ("Llambias, Jorge Joaquin") y los nombres de tribunales, y pisarlos
// a todos rompe el texto.
// ---------------------------------------------------------------------------

// Igual que las reglas de arriba, los separadores son `[ \t]+` y no `\s+`: un
// patron que cruza el salto de linea junta el final de un renglon con el
// principio del siguiente y propone como nombre algo que nunca estuvo escrito.
const S = '[ \\t]+';

// Entre dos palabras de un nombre puede ir una particula, o dos: "Del Monte",
// "de la Fuente". Sin esto "Lucia del Monte" no calzaba en ningun patron
// —"del" no empieza en mayuscula— y el nombre no se ofrecia.
const J = `${S}(?:${PARTICULA_CUALQUIER_CAJA}${S}){0,2}`;

const CANDIDATOS = [
    // "Perez, Juan Carlos" — forma de caratula y de cita de doctrina.
    new RegExp(`[${MAY}][${MIN}]{2,15},${S}[${MAY}][${MIN}]{2,15}(?:${S}[${MAY}][${MIN}]{2,15})?`, 'g'),
    // "ANALIA GABRIELA ARIAS" — tres o mas palabras seguidas en mayusculas.
    new RegExp(`[${MAY}]{3,}(?:${J}[${MAY}]{3,}){2,}`, 'g'),
    // "Juan Carlos Perez" — de tres a cinco palabras capitalizadas seguidas.
    //
    // ERAN TRES EXACTAS HASTA EL 15/9/2026, y un nombre de cuatro —"Juan Carlos
    // Perez Garcia"— salia partido: este patron ofrecia "Juan Carlos Perez" y el
    // de dos palabras, "Perez Garcia". Tildar el primero dejaba el segundo
    // apellido en claro, y nada avisaba que el nombre seguia.
    new RegExp(`[${MAY}][${MIN}]{2,14}(?:${J}[${MAY}][${MIN}]{2,14}){2,4}`, 'g'),
    // "PEREZ, Juan" — apellido en mayusculas y nombre capitalizado, que es como
    // el PJN escribe las partes en la caratula.
    new RegExp(`[${MAY}]{3,}(?:${S}[${MAY}]{2,})*,${S}[${MAY}][${MIN}]{2,15}`, 'g'),
    // "PEREZ, JUAN CARLOS" — la caratula entera en mayusculas. Ninguno de los
    // otros la toma: el de mayusculas se corta en la coma, y el de arriba pide
    // el nombre en minusculas. Salia "JUAN CARLOS" solo, y tildarlo dejaba el
    // apellido —lo que mas identifica— a la vista.
    new RegExp(`[${MAY}]{3,}(?:${S}[${MAY}]{3,})*,${S}[${MAY}]{3,}(?:${J}[${MAY}]{3,}){0,3}`, 'g'),

    // "Ernesto Quiroga" y "ERNESTO QUIROGA" — DOS palabras, que es como se
    // llama la gente en un escrito una vez que ya fue presentada.
    //
    // CASO DE PRUEBA, 21/8/2026. Las cuatro reglas de arriba exigen tres palabras o
    // una coma, asi que un nombre de un exhorto —diez apariciones
    // en claro, mas cuatro sin tilde y una en mayusculas— NUNCA se ofrecio para
    // tildar. No es que el usuario lo dejo pasar: no lo vio. Y es la forma mas
    // frecuente que hay, porque el nombre completo aparece una vez y el
    // "Nombre Apellido" aparece en cada foja.
    //
    // Es la regla mas ruidosa de las seis: engancha "Razon Social", "Ingresos
    // Brutos", "Codigo Producto". Por eso entra junto con dos cosas y no sola:
    // la lista NO_SON_PERSONAS de abajo, que se amplio para este caso, y que
    // los candidatos ya no vengan tildados de fabrica (ver app.js). Un candidato
    // de mas cuesta una mirada; uno de menos es un nombre que sale del
    // expediente sin que nadie se entere.
    new RegExp(`[${MAY}][${MIN}]{2,15}${J}[${MAY}][${MIN}]{2,15}`, 'g'),
    new RegExp(`[${MAY}]{3,}${J}[${MAY}]{3,}`, 'g'),
];

// Palabras que delatan un falso positivo. Un nombre propio no lleva verbos,
// preposiciones ni sustantivos del oficio; los titulos de los escritos, que van
// en mayusculas y por eso disparan el detector, estan llenos de estas.
const NO_SON_PERSONAS = new Set(`
aires astrea sala administrativo civil comercial abogados procuradores nacion
nacional buenos capital federal provincia hammurabi depalma abeledo perrot
rubinzal culzoni juzgado camara corte suprema tribunal secretaria fuero
instancia laboral penal paz contencioso ciudad autonoma justicia poder judicial
ley leyes derecho codigo articulo art inciso expediente autos caratulados
demanda demandado demandada actor actora parte partes tercero citada garantia
recurso reposicion apelacion nulidad queja excepcion excepciones incidente
sentencia resolucion providencia decreto traslado notificacion cedula oficio
prueba pericia perito perita pericial testimonial informativa confesional documental
juez jueza fiscal defensor defensora prosecretario prosecretaria ujier oficial
martillero martillera escribano escribana contador contadora medico medica
ingeniero ingeniera arquitecto arquitecta abogado abogada doctor doctora
titular subrogante interino interina presidente vocal ministro auxiliar
honorarios costas intereses tasa plazo plazos rebeldia caducidad
caso objeto presupuesto material orden publico procesal apoderado patrocinio
letrado poder escrito presentacion contestacion liquidacion ejecucion titulo
deuda pago capital seguro seguros poliza siniestro cobertura asegurado
aseguradora sociedad consorcio propiedad horizontal expensas inmueble
unidad funcional contrato clausula danos perjuicios lucro cesante moral
tener deje dejar solicita solicito interpone plantea opone contesta acompana
ofrece hace hago reserva manifiesta denuncia impugna promueve inicia formula
por con sin para del las los que son sea sus una uno este esta ese esa
nuestro nuestra verdadero efecto subsidio conforme atento visto vistos
primera segunda tercera vista informe constancia monto suma total general
considerando resuelvo resuelve notifiquese registrese proveido despacho
vease conf cfr ver citado citada supra infra
comparece comparecen comparecio comparecieron declara declaro declaran
declararon ratifica ratifico expone dice siendo otrosi respecto cuando
donde ademas tambien entonces finalmente oportunamente notese observese
hagase tengase agreguese librese remitase glosese estese cumplase designa
designo fija fijo luego asimismo seguidamente acto seguido previo
oficios judiciales notificador entradas mesa virtual link reunion clave
acceso sistema lex100 sne

# Las de abajo entraron el 21/8/2026, con las dos reglas de candidatos de DOS
# palabras. Con tres palabras el ruido era tolerable; con dos, un expediente de
# muchas paginas propone "Razon Social" y "Codigo Producto" tantas veces como
# propone un apellido, y una lista de candidatos que no se puede leer no se
# lee: se tilda entera, que es exactamente como se corrompieron 27 lugares del
# texto en la prueba que motivo este cambio.

# La ficha del un formulario oficial, que viene como formulario.
apellidos nombres clase nacionalidad argentina argentino argentinos masculino
femenino oficina padre madre tramite idtramite ejemplar toma formulario
nacimiento nac foto huella mano manos derecha izquierda pulgar indice anular
menique dedo sexo domicilio piso entre calle avenida

# Facturas y planillas, que son la mitad de las fojas de un expediente de cobro.
razon social comercial ingresos brutos codigo producto servicio cantidad bonif
subtotal neto gravado exento inscripto responsable sujeto condicion venta
comprobante factura remito periodo facturado desde hasta vencimiento unitario
unit medida precio cuit cuil iva alicuota descuento importe importes observaciones
observacion copia copias requirente requerido patrocinante folio tomo matricula

# Montos escritos en letras: "NUEVE MILLONES DOSCIENTOS OCHENTA" tiene la forma
# de un nombre en mayusculas. No se filtran "diez" ni "leon", que son apellidos.
mil millon millones ciento cientos doscientos trescientos cuatrocientos
quinientos seiscientos setecientos ochocientos novecientos veinte treinta
cuarenta cincuenta sesenta setenta ochenta noventa cero

# Titulos de escritos y caratulas de cedula, que van en mayusculas y por eso
# disparan las dos reglas nuevas.
habeas corpus insania urgente notificar habilitacion dia dias hora horas
pregunta preguntas indicativa indicativas afirmativa afirmativas hechos
hecho relevantes facturas impagas debidamente rechazadas rechazada
economico economica contenido derechos humanos
inhabil inhabiles audiencia designe nuevo nueva unica unico

# Las de abajo entraron el 15/9/2026, de un escrito de contestacion de traslado
# que ofrecio siete candidatos que no eran nadie. Las palabras que terminan en
# -cion, -tiva y parecidas no estan: las alcanza TERMINACION_QUE_NO_ES_NOMBRE.
#
# Los tratamientos, porque pegados a un lugar arman la forma "Apellido, Nombre":
# "...de la CABA, Dra. Ana" proponia "CABA, Dra". Y porque en la caratula son el
# borde del nombre: "SUCESORES DEL SR. JUAN PEREZ" ofrecia el "SR." adentro.
sr sra sres sras srta dr dra dres dras
#
# Los cargos, porque detras de un tratamiento lo que viene hasta la primera
# palabra que no es de nombre se toma como nombre: "la Sra. Directora General"
# sin estas saldria como "Sra. [PERSONA] General".
director directora secretario subsecretario subsecretaria procurador
procuradora coordinador coordinadora jefe jefa gerente vicepresidente
intendente gobernador gobernadora diputado diputada senador senadora concejal
asesor asesora curador curadora sindico sindica interventor interventora
administrador administradora
caba departamento sucesores sucesor sucesion herederos
heredero cedente cedentes cesionario cesionaria litigiosos expresa expreso
ineficacia eficacia sustancial sobre todo toda evento cobro pesos
`.replace(/^\s*#.*$/gm, '').trim().split(/\s+/));

// La caratula tiene forma fija: "X c/ Y s/ OBJETO". De ahi salen las partes.
//
// La "c/" y la "s/" van en cualquier caja. Hasta el 15/9/2026 el patron exigia
// la minuscula, y un escrito que transcribe la caratula entera en mayusculas
// —"PEREZ, JUAN C/ GARCIA, MARIA S/ DANOS"— no daba ninguna parte: ninguna
// venia tildada y el apellido del actor no se ofrecia en ningun lado.
const CARATULA = new RegExp(`([${MAY}][^/\\n]{2,60}?)\\s+[cC]/\\s*([${MAY}][^/\\n]{2,60}?)\\s+[sS]/`);

// "PEREZ, JUAN Y OTROS C/ ...": el "y otros" es de la caratula, no del nombre.
// Tolera "OTOR", la transposicion de letras mas facil de cometer al tipearlo.
const Y_OTROS = /\s+y\s+ot(?:r[oa]|or)s?\.?$/i;

// Los incidentes del PJN no usan "c/": vienen como
//   "INCIDENTE Nº 2 - ACTOR: FICTICIO, ADRIAN DEMANDADO: INVENTADA, BEATRIZ S/EJECUCION"
// Sin esto, las partes de un incidente no se detectan y por lo tanto nunca se
// sugieren: el usuario no se entera de que quedaron en claro. Caso de prueba,
// detectada en pruebas el 11/8/2026.
const CARATULA_ACTOR_DEMANDADO =
    /ACTORA?\s*:\s*(.+?)\s+DEMANDAD[OA]S?\s*:\s*(.+?)\s*(?:S\s*\/|$)/i;

// ---------------------------------------------------------------------------

/** Colapsa el espaciado irregular del PDF. Corre ANTES de anonimizar.
 *
 * pdf.js devuelve espacios dobles y cortes de linea en medio de un nombre. Si
 * se anonimiza sobre eso, ningun patron de varias palabras engancha: el texto
 * se ve bien y no se reemplaza nada.
 */
export function normalizarEspacios(texto) {
    return texto
        .replace(/­/g, '')          // guion suave de corte de linea
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n');
}

function sinTildes(texto) {
    return texto.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function escapar(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function aplicarReglas(texto, reglas, conteo) {
    for (const { nombre, patron, reemplazo } of reglas) {
        let n = 0;
        texto = texto.replace(patron, (...args) => {
            const salida = typeof reemplazo === 'function'
                ? reemplazo(...args)
                : expandir(reemplazo, args);
            if (salida !== args[0]) n++;
            return salida;
        });
        if (n) conteo[nombre] = (conteo[nombre] || 0) + n;
    }
    return texto;
}

// `$1`, `$2`... a mano. Se usa un reemplazo por funcion en todas las reglas
// para poder contar solo los cambios reales —una regla que devuelve lo mismo
// que encontro no reemplazo nada, y contarla mentiria en el reporte—, y ahi la
// expansion automatica de String.replace ya no corre.
function expandir(plantilla, args) {
    return plantilla.replace(/\$(\d)/g, (_, d) => args[Number(d)] ?? '');
}

/** Aplica las reglas deterministicas y los reemplazos elegidos por el usuario.
 *
 * Devuelve `{ texto, conteo }`, donde `conteo` es un objeto regla -> cantidad.
 * El conteo no es estadistica: es la constancia de que se reemplazo, y es lo
 * unico que le permite a alguien auditar el resultado sin releer el documento
 * entero contra el original.
 *
 * NINGUNA CLAVE DEL CONTEO PUEDE LLEVAR TEXTO DEL DOCUMENTO. El conteo se
 * imprime tal cual al pie del .md (documento.js), asi que una clave con el
 * nombre adentro es el nombre publicado en el archivo anonimizado.
 *
 * CASO DE PRUEBA, encontrada el 21/8/2026 revisando la salida de un expediente de
 * muchas paginas: la clave de cada reemplazo elegido era `elegido: ${original}`, y
 * la constancia terminaba con varios nombres y la cantidad de veces que
 * aparecia cada uno. El archivo traia abajo el diccionario para deshacerlo.
 *
 * Es el mismo bug que documento.js fue escrito para evitar —el nombre del
 * archivo en el titulo— una funcion mas abajo y en el otro extremo del .md.
 * Por eso la clave lleva la etiqueta ([PERSONA], [ACTOR]) y no el nombre: el
 * detalle por nombre esta en la pantalla, que es donde no sale de la maquina.
 */
export function anonimizar(texto, elegidos = []) {
    const conteo = {};

    texto = aplicarReglas(texto, REGLAS_IDENTIFICADORES, conteo);

    // De mas largo a mas corto, sin depender del orden en que llegaron. Con
    // "Estudio Juridico Ficticio" y "Ficticio" al reves, el corto pega primero y
    // deja "Estudio Juridico [ESTUDIO]": un reemplazo parcial, que es peor que
    // ninguno porque parece hecho.
    const ordenados = [...elegidos].sort((a, b) => b.texto.length - a.texto.length);
    for (const { texto: original, reemplazo } of ordenados) {
        if (!original || !original.trim()) continue;
        // Tolerante al espaciado: el texto de un PDF trae espacios dobles y
        // saltos de linea en medio de un nombre, asi que un escape literal no
        // engancha nada. Esto fue un bug real, no una precaucion teorica.
        const fuente = original.trim().split(/\s+/).map(escapar).join('\\s+');
        const patron = new RegExp(`${ANTES}(?:${fuente})${DESPUES}`, 'gi');
        let n = 0;
        texto = texto.replace(patron, (todo, antes) => { n++; return antes + reemplazo; });
        // La clave lleva la ETIQUETA, no el nombre. Ver el comentario de arriba
        // de `anonimizar`: el conteo termina impreso en el archivo.
        if (n) conteo[`nombre propio → ${reemplazo}`] =
            (conteo[`nombre propio → ${reemplazo}`] || 0) + n;
    }

    texto = aplicarReglas(texto, REGLAS_NOMBRES, conteo);

    return { texto, conteo };
}

/** Le saca al candidato las palabras de los extremos que no son nombre.
 *
 * Devuelve `''` si lo que queda no llega a dos palabras, o si la palabra que
 * sobra esta en el medio —"Juan de Dios" no se puede recortar sin inventar—.
 *
 * POR QUE RECORTAR Y NO DESCARTAR. Un patron se queda con el primer calce que
 * encuentra y no vuelve atras: en "Comparece Hector Ernesto Quiroga" el de tres
 * palabras engancha "Comparece Hector Ernesto", y como "comparece" es un verbo
 * el candidato se tiraba entero. El nombre que estaba ahi al lado —el unico
 * que importaba— no se ofrecia nunca, y no porque no se lo detectara: porque
 * el verbo de adelante se lo llevo puesto. Recortando, queda "Hector Ernesto".
 */
// Las particulas se recortan de los bordes —"Registro de la" no termina en un
// nombre— pero se aceptan en el medio: "Lucia Del Monte" es un nombre, y hasta
// el 15/9/2026 el "Del" lo hacia descartar entero.
function recortarPalabrasQueNoSonNombre(completo) {
    const tokens = completo.split(/\s+/);
    const sobra = (t) => noEsNombre(t) || esParticula(t);

    let i = 0;
    let j = tokens.length - 1;
    while (i <= j && sobra(tokens[i])) i++;
    while (j >= i && sobra(tokens[j])) j--;

    const nombre = tokens.slice(i, j + 1);
    if (nombre.length < 2) return '';
    if (nombre.some((t) => noEsNombre(t) && !esParticula(t))) return '';
    return nombre.join(' ').replace(/^,+|,+$/g, '');
}

/** Descarta el candidato que es un pedazo de otro y no aparece por su cuenta.
 *
 * Los seis patrones corren sobre el mismo texto, asi que uno largo y uno corto
 * enganchan el mismo nombre: "Llambias, Jorge Joaquin" propone tambien "Jorge
 * Joaquin". Con seis patrones esto duplica media lista, y una lista que se lee
 * peor se tilda peor.
 *
 * El criterio es la cuenta, no el largo: si el corto aparece MAS veces que el
 * largo, es que ademas esta suelto en el texto —"Ernesto Quiroga" diez veces
 * dentro de un "Hector Ernesto Quiroga" que aparece una— y ahi hay que
 * ofrecerlo, porque el reemplazo del largo no lo va a alcanzar.
 */
function esFragmentoDeOtro(encontrados) {
    const todos = [...encontrados.entries()];
    return ({ texto, apariciones }) => !todos.some(([otro, veces]) =>
        otro !== texto &&
        otro.length > texto.length &&
        veces >= apariciones &&
        new RegExp(`${ANTES}${escapar(texto)}${DESPUES}`).test(otro));
}

/** Nombres propios probables que las reglas NO reemplazaron.
 *
 * Se reportan, no se reemplazan. Devuelve `[{ texto, apariciones }]` ordenado
 * por frecuencia.
 */
export function candidatosANombre(texto) {
    const encontrados = new Map();
    // Dos patrones pueden calzar el mismo nombre en el mismo lugar —"Lucia Del
    // Monte" es de tres palabras y tambien de dos con particula—, y contarlo dos
    // veces hace que la pantalla diga "2 veces" de algo que esta una.
    const vistos = new Set();
    for (const patron of CANDIDATOS) {
        patron.lastIndex = 0;
        for (const match of texto.matchAll(patron)) {
            const completo = match[0].replace(/\s+/g, ' ').trim();
            if (completo.includes('[')) continue;      // ya lo tomo otra regla
            const nombre = recortarPalabrasQueNoSonNombre(completo);
            if (!nombre) continue;
            const lugar = match.index + match[0].indexOf(nombre.split(' ')[0]);
            if (vistos.has(`${lugar}|${nombre}`)) continue;
            vistos.add(`${lugar}|${nombre}`);
            encontrados.set(nombre, (encontrados.get(nombre) || 0) + 1);
        }
    }
    return [...encontrados.entries()]
        .map(([texto, apariciones]) => ({ texto, apariciones }))
        .filter(esFragmentoDeOtro(encontrados))
        .sort((a, b) => b.apariciones - a.apariciones || a.texto.localeCompare(b.texto));
}

/** Extrae las partes de la caratula. Devuelve `[]`, o `[actor, demandado]`.
 *
 * Se busca sobre una copia con los saltos de linea convertidos en espacios: en
 * un PDF la caratula casi siempre queda cortada en dos renglones, y sin esto el
 * patron engancha solo la mitad de abajo, perdiendo el apellido —que es justo
 * lo que hay que ocultar—.
 */
export function partesDeCaratula(texto) {
    // Sin las marcas de Markdown: un renglon de la caratula que queda todo en
    // mayusculas sale marcado como titulo, y el "##" cortaba el nombre del actor
    // por la mitad —se recorta de derecha a izquierda y "##" no es un nombre—.
    const plano = texto.slice(0, 4000)
        .replace(/^#{1,6}[ \t]+/gm, '')
        .replace(/\*\*/g, '')
        .replace(/\s+/g, ' ');
    const match = CARATULA.exec(plano) || CARATULA_ACTOR_DEMANDADO.exec(plano);
    if (!match) return [];
    return [match[1], match[2]].map(recortarAlNombre).filter((p) => p.length > 3);
}

/** Se queda con los tokens capitalizados del final del fragmento.
 *
 * El patron de caratula arrastra el texto que venia antes ("...en los autos
 * caratulados PEREZ, JUAN"). Se recorta tomando desde el final mientras los
 * tokens sigan pareciendo parte de un nombre, en vez de adivinar donde empieza:
 * cortar de mas deja el apellido a medias, y un apellido a medias filtra igual.
 */
function recortarAlNombre(fragmento) {
    const tokens = fragmento.trim()
        .replace(/^[\s,.;:"“”']+|[\s,.;:"“”']+$/g, '')
        .replace(Y_OTROS, '')
        .split(/\s+/);
    const nombre = [];
    for (let i = tokens.length - 1; i >= 0; i--) {
        const limpio = tokens[i].replace(/^[,.;:"“”']+|[,.;:"“”']+$/g, '');
        if (!limpio) continue;
        // La particula pasa: "JUAN DEL MONTE" se cortaba en el "DEL" y la parte
        // salia como "MONTE". Si queda en el borde izquierdo, se saca abajo.
        if (esParticula(limpio)) { nombre.unshift(tokens[i]); continue; }
        if (!new RegExp(`^[${MAY}]`).test(limpio)) break;
        if (noEsNombre(limpio)) break;
        nombre.unshift(tokens[i]);
        if (nombre.length >= 6) break;
    }
    while (nombre.length && esParticula(nombre[0])) nombre.shift();
    return nombre.join(' ').replace(/\s+/g, ' ').replace(/^[\s,.;:]+|[\s,.;:]+$/g, '');
}
