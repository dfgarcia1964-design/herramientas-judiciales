// ---------------------------------------------------------------------------
// De los fragmentos que devuelve pdf.js al Markdown.
//
// Un PDF no tiene lineas ni parrafos: tiene pedazos de texto con una posicion.
// Reconstruir el documento es agrupar por altura, ordenar por posicion y
// decidir que sobra. Todo lo de este archivo es esa decision, y todo lo que se
// decide quitar SE CUENTA: el informe que sale al final dice cuantas lineas se
// descartaron y por que. Un filtro que borra sin decirlo es exactamente lo que
// hacia la herramienta anterior.
//
// EL BUG QUE ORDENA ESTE ARCHIVO. La version anterior calculaba el umbral de
// "esto se repite en todas las paginas, es un encabezado" como
// `paginas * 0.4`. Para un documento de UNA pagina eso da 0.4, y cualquier
// linea aparece una vez, que es mas que 0.4: todas las lineas del borde
// pasaban a considerarse encabezado repetido y se borraban. Una resolucion de
// una carilla salia con 2 de sus 12 lineas —se perdia el "Resuelvo", el monto
// y la firma—, en silencio y con el archivo listo para descargar.
//
// Por eso ahora hay dos condiciones, y las dos tienen que darse:
//   1. el documento tiene al menos TRES paginas
//   2. la linea aparece en al menos DOS de ellas
// Algo que aparece una sola vez no es un encabezado repetido. Es el documento.
// ---------------------------------------------------------------------------

const PAGINAS_MINIMAS_PARA_REPETIDOS = 3;
const APARICIONES_MINIMAS = 2;

/** Agrupa los fragmentos de una pagina en lineas, de arriba hacia abajo.
 *
 * Se agrupa primero por altura y se ordena por posicion horizontal DESPUES,
 * dentro de cada linea. Al reves —que es como estaba— el comparador mezcla dos
 * criterios segun una tolerancia y deja de ser un orden total: dos fragmentos
 * pueden compararse distinto segun con quien se los compare, y el resultado del
 * ordenamiento pasa a depender del algoritmo interno del motor de JavaScript.
 */
export function agruparEnLineas(fragmentos, tolerancia = 5) {
    const grupos = [];

    for (const f of fragmentos) {
        const y = f.transform[5];
        const grupo = grupos.find((g) => Math.abs(g.y - y) <= tolerancia);
        if (grupo) grupo.fragmentos.push(f);
        else grupos.push({ y, fragmentos: [f] });
    }

    grupos.sort((a, b) => b.y - a.y);
    for (const g of grupos) g.fragmentos.sort((a, b) => a.transform[4] - b.transform[4]);

    return grupos.map((g) => g.fragmentos);
}

/** Une los fragmentos de una linea, reponiendo los espacios que el PDF no trae.
 *
 * Un PDF puede guardar "Buenos Aires" como dos fragmentos sin ningun espacio en
 * el medio: el espacio esta en la distancia entre uno y otro. Se repone cuando
 * el hueco supera el 40% del ancho de un caracter.
 */
export function textoDeLinea(fragmentos) {
    let salida = '';
    for (let i = 0; i < fragmentos.length; i++) {
        const f = fragmentos[i];
        if (i > 0) {
            const previo = fragmentos[i - 1];
            const hueco = f.transform[4] - (previo.transform[4] + previo.width);
            const anchoDeCaracter = previo.width / Math.max(previo.str.length, 1);
            if (hueco > anchoDeCaracter * 0.4) salida += ' ';
        }
        salida += f.str;
    }
    return salida;
}

/** Cuanto se parecen dos lineas. Sirve para agrupar "Pag. 1/10" con "Pag. 2/10".
 *
 * Sobre palabras si las lineas son largas, sobre caracteres si son cortas
 * —"Pag. 1/10" tiene tres palabras y ninguna se repite entre paginas—.
 */
function similitud(a, b) {
    const x = a.toLowerCase().trim();
    const y = b.toLowerCase().trim();
    const partir = (s) => (x.length < 50 && y.length < 50 ? [...s] : s.split(/\s+/));
    const A = new Set(partir(x));
    const B = new Set(partir(y));
    let comunes = 0;
    for (const t of A) if (B.has(t)) comunes++;
    const union = new Set([...A, ...B]).size;
    return union === 0 ? 0 : comunes / union;
}

/** Encuentra los encabezados y pies que se repiten a lo largo del documento.
 *
 * Devuelve `{ encabezados: Set, pies: Set }`. Vacios si el documento es corto:
 * ver el comentario del encabezado del archivo, que es el motivo por el que
 * existe este limite.
 */
export function detectarRepetidos(paginas) {
    const vacio = { encabezados: new Set(), pies: new Set() };
    if (paginas.length < PAGINAS_MINIMAS_PARA_REPETIDOS) return vacio;

    const frecuenciaPie = new Map();
    const frecuenciaEncabezado = new Map();

    for (const pagina of paginas) {
        const lineas = agruparEnLineas(pagina.fragmentos).map((l) => textoDeLinea(l).trim());

        // Se mira solo el borde: una frase que se repite en el medio del texto
        // es del texto, no del membrete.
        //
        // Y el borde se mide en proporcion a la pagina, no en lineas fijas. Con
        // 4 arriba y 6 abajo sobre una foja de 40 renglones se mira el 25%, que
        // es lo buscado; sobre una de 9 —una caratula, una hoja de cierre, un
        // proveido corto— esas mismas 10 lineas son la pagina entera, y ahi
        // cualquier cosa que se parezca entre paginas se considera membrete. En
        // un expediente de prueba de 5 fojas eso borro 30 de 35 lineas.
        const tope = Math.max(1, Math.floor(lineas.length / 4));
        const arriba = lineas.slice(0, Math.min(4, tope)).filter((s) => s.length > 10);
        const abajo = lineas.slice(-Math.min(6, tope)).filter((s) => s.length > 15);

        for (const s of abajo) frecuenciaPie.set(s, (frecuenciaPie.get(s) || 0) + 1);
        for (const s of arriba) frecuenciaEncabezado.set(s, (frecuenciaEncabezado.get(s) || 0) + 1);
    }

    const repetidos = (frecuencia) => {
        const salida = new Set();
        for (const [texto, veces] of frecuencia) {
            if (veces >= APARICIONES_MINIMAS) salida.add(texto);
        }
        // Segunda vuelta: las variantes numeradas del mismo pie ("Pag. 1/10",
        // "Pag. 2/10"...) aparecen una vez cada una y por si solas nunca llegan
        // al minimo. Se suman por parecido a las que si llegaron.
        //
        // SOLO PARA LINEAS CORTAS, y ese limite es la parte importante. Dos
        // renglones largos de prosa que se diferencian en un digito —"...en el
        // punto 3 de la resolucion apelada"— se parecen mas del 60% y son texto
        // del expediente, no membrete. Sin este limite, la red de seguridad
        // pensada para los numeros de pagina se lleva puestos parrafos enteros.
        // El pie largo de verdad ya lo agarro la vuelta anterior, que es exacta.
        const LARGO_DE_UN_NUMERO_DE_PAGINA = 40;
        for (const [texto] of frecuencia) {
            if (salida.has(texto) || texto.length > LARGO_DE_UN_NUMERO_DE_PAGINA) continue;
            for (const conocido of salida) {
                if (conocido.length > LARGO_DE_UN_NUMERO_DE_PAGINA) continue;
                if (similitud(texto, conocido) >= 0.6) { salida.add(texto); break; }
            }
        }
        return salida;
    };

    return { encabezados: repetidos(frecuenciaEncabezado), pies: repetidos(frecuenciaPie) };
}

/** Comparacion exacta, no por subcadena.
 *
 * La version anterior preguntaba `linea.includes(repetido) || repetido.includes(linea)`.
 * La segunda mitad es la peligrosa: cualquier linea corta que fuera subcadena
 * de un pie se borraba tambien. Con un pie "Poder Judicial de la Nacion", la
 * linea "Nacion" de cualquier parte del documento desaparecia.
 */
function esRepetido(texto, conjunto) {
    return conjunto.has(texto.trim());
}

/** Codigos de sistema del PJN: "#12345#", que van sueltos en el margen. */
function esCodigoDeSistema(str) {
    const t = str.trim();
    return t.startsWith('#') && /^#[\d#]+$/.test(t) && (t.match(/#/g) || []).length >= 3;
}

/** Numeros de pagina, sellos y lineas de separacion, solo en el borde. */
function esArtefactoDeBorde(texto, indice, total) {
    const t = texto.trim();
    if (!t) return false;
    if (!(indice < 2 || indice >= total - 3)) return false;
    if (/^\d{1,4}$/.test(t)) return true;                          // numero de pagina
    if (/^\d{1,4}\s*[-–—/]\s*\d{1,4}$/.test(t)) return true;       // "3 / 15"
    if (/^(Page|Pág|Pag|N°|Nro|Folio|Foja|fs)\.?\s*\d+/i.test(t)) return true;
    if (/^[-–—=_*·•]{5,}$/.test(t)) return true;                   // linea de guiones
    return false;
}

/** Parte los fragmentos de una pagina en columnas, si las hay.
 *
 * Se buscan huecos verticales anchos en las posiciones donde arranca el texto.
 * Si no hay un hueco claro, se devuelve todo junto: partir mal una pagina de
 * una sola columna intercala parrafos que no van juntos, y eso es peor que no
 * detectar columnas.
 */
export function partirEnColumnas(fragmentos, anchoDePagina) {
    if (!anchoDePagina) return [fragmentos];

    const posiciones = [...new Set(fragmentos.map((f) => Math.round(f.transform[4] / 5) * 5))]
        .sort((a, b) => a - b);
    if (posiciones.length < 4) return [fragmentos];

    const cortes = [];
    for (let i = 1; i < posiciones.length; i++) {
        const hueco = posiciones[i] - posiciones[i - 1];
        if (hueco > anchoDePagina * 0.12 && hueco > 30) cortes.push(posiciones[i]);
    }
    if (cortes.length === 0) return [fragmentos];

    const columnas = [];
    for (const f of fragmentos) {
        let indice = 0;
        for (let c = 0; c < cortes.length; c++) if (f.transform[4] >= cortes[c]) indice = c + 1;
        (columnas[indice] ||= []).push(f);
    }

    const utiles = columnas.filter((c) => c && c.length >= 3);
    return utiles.length > 1 ? utiles : [fragmentos];
}

/** Donde esta la caja de texto de una columna, y cuanto mide un interlineado.
 *
 * Se mide sobre los renglones de mas de 20 caracteres: un numero de pagina en
 * el margen o un sello corrido correrian el borde, y con el borde corrido
 * ningun renglon "llega al margen".
 */
function medirCaja(lineas) {
    const largas = lineas.filter((l) => textoDeLinea(l).trim().length > 20);
    if (largas.length < 2) return null;
    const izquierda = Math.min(...largas.map((l) => l[0].transform[4]));
    const derecha = Math.max(...largas.map(bordeDerecho));
    const saltos = [];
    for (let i = 1; i < lineas.length; i++) {
        const salto = lineas[i - 1][0].transform[5] - lineas[i][0].transform[5];
        if (salto > 0) saltos.push(salto);
    }
    saltos.sort((a, b) => a - b);
    const interlineado = saltos[Math.floor(saltos.length / 2)] || 0;
    return { izquierda, derecha, ancho: derecha - izquierda, interlineado };
}

function bordeDerecho(fragmentos) {
    return Math.max(...fragmentos.map((f) => f.transform[4] + (f.width || 0)));
}

function esTodoMayusculas(texto) {
    const letras = texto.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g, '');
    return letras.length >= 3 && letras === letras.toUpperCase();
}

/** Si el renglon que sigue es la continuacion del parrafo aunque empiece en
 *  mayuscula.
 *
 * POR QUE, 15/9/2026. El reflujo de abajo une solo si el renglon siguiente
 * empieza en minuscula, porque uno en mayuscula puede ser un parrafo nuevo. Pero
 * un renglon tambien empieza en mayuscula cuando el corte cae en medio de un
 * nombre: "...con el patrocinio de la Dra. Ana" / "Maria Del Monte y...". Asi
 * partido, el nombre no lo agarra ninguna regla entera —el tratamiento tapa la
 * mitad de arriba, y la de abajo queda sola—.
 *
 * La geometria lo decide sin adivinar: un renglon cortado por el ancho de la
 * hoja LLEGA AL MARGEN DERECHO, y el que sigue arranca en el izquierdo, pegado.
 * Un parrafo nuevo lleva sangria o un espacio de mas; un titulo no llega al
 * margen. Las cuatro guardas de abajo son los casos donde la geometria sola se
 * equivoca.
 */
function continuaElParrafo(previa, fragmentos, texto, caja) {
    if (!caja || caja.ancho <= 0) return false;
    if (previa.borde < caja.izquierda + caja.ancho * 0.9) return false;             // no llega al margen
    if (fragmentos[0].transform[4] > caja.izquierda + caja.ancho * 0.02) return false; // sangria
    if (caja.interlineado && previa.y - fragmentos[0].transform[5] > caja.interlineado * 1.6) return false;
    // Un titulo en mayusculas que llega al margen no se come el parrafo de abajo,
    // ni un parrafo que llega al margen se come el titulo que sigue. Lo que se
    // pierde: un renglon de caratula todo en mayusculas queda aparte, y eso no
    // le hace nada a la caratula, que se busca sobre el texto sin renglones.
    if (esTodoMayusculas(previa.ultimo) !== esTodoMayusculas(texto)) return false;
    // Un campo de formulario tambien: "Domicilio: ..." pegado al renglon de
    // arriba haria que la regla del campo se lleve los dos.
    if (/^[A-ZÁÉÍÓÚÜÑ][^:,.\n]{0,30}:/.test(texto)) return false;
    return true;
}

/** Marca titulos y enumeraciones.
 *
 * Conservador a proposito. Un escrito judicial tiene parrafos enteros en
 * mayusculas —"SOLICITA SE TENGA POR CONTESTADA LA DEMANDA Y SE RECHACE CON
 * COSTAS"— que no son titulos sino el objeto del escrito, asi que el limite de
 * largo es corto. Marcar de mas ensucia; marcar de menos no rompe nada.
 */
function marcarEstructura(texto, informe) {
    return texto.split('\n').map((linea) => {
        const t = linea.trim();
        if (t.length < 2 || t.length > 80) return linea;

        const letras = t.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g, '');
        const mayusculas = letras.replace(/[a-záéíóúüñ]/g, '').length;
        if (letras.length >= 3 && mayusculas === letras.length) {
            informe.titulos++;
            return '## ' + t;
        }

        // "I.-", "II.-" y "a)", "b)" al principio de la linea.
        const conNumeral = linea.replace(/^\s*([IVXLCDM]+\.-)\s*/, '**$1** ');
        if (conNumeral !== linea) { informe.titulos++; return conNumeral; }
        const conLetra = linea.replace(/^\s*([a-z]\))\s+/, '**$1** ');
        if (conLetra !== linea) { informe.titulos++; return conLetra; }

        return linea;
    }).join('\n');
}

export const OPCIONES_POR_DEFECTO = {
    quitarCodigos: true,
    quitarRepetidos: true,
    quitarBordes: true,
    unirCortes: true,
    detectarColumnas: true,
    detectarTitulos: true,
    separarPaginas: true,
};

/** Convierte las paginas ya extraidas en Markdown.
 *
 * Devuelve `{ markdown, informe }`. El informe lleva la cuenta de todo lo que
 * se quito, para que la pantalla lo pueda mostrar. Nada se descarta en
 * silencio: si el resultado sale corto, el informe dice por que.
 */
export function convertir(paginas, opciones = {}) {
    const opts = { ...OPCIONES_POR_DEFECTO, ...opciones };
    const informe = {
        paginas: paginas.length,
        lineas: 0,
        codigos: 0,
        encabezados: 0,
        pies: 0,
        bordes: 0,
        unidas: 0,
        titulos: 0,
        columnas: 0,
        repetidosActivo: false,
    };

    const repetidos = opts.quitarRepetidos
        ? detectarRepetidos(paginas)
        : { encabezados: new Set(), pies: new Set() };
    informe.repetidosActivo = repetidos.encabezados.size > 0 || repetidos.pies.size > 0;

    const textoDePaginas = [];

    for (const pagina of paginas) {
        const grupos = opts.detectarColumnas
            ? partirEnColumnas(pagina.fragmentos, pagina.ancho)
            : [pagina.fragmentos];
        if (grupos.length > 1) informe.columnas++;

        const columnas = [];

        for (const fragmentosDeColumna of grupos) {
            const lineas = agruparEnLineas(fragmentosDeColumna);
            const caja = medirCaja(lineas);
            const salida = [];

            for (let i = 0; i < lineas.length; i++) {
                let fragmentos = lineas[i];

                if (opts.quitarCodigos) {
                    const limpios = fragmentos.filter((f) => !esCodigoDeSistema(f.str));
                    if (limpios.length !== fragmentos.length) informe.codigos++;
                    if (limpios.length === 0) continue;
                    fragmentos = limpios;
                }

                const crudo = textoDeLinea(fragmentos);
                const texto = crudo.trim();
                if (!texto) continue;

                if (opts.quitarRepetidos && esRepetido(texto, repetidos.encabezados)) {
                    informe.encabezados++;
                    continue;
                }
                if (opts.quitarRepetidos && esRepetido(texto, repetidos.pies)) {
                    informe.pies++;
                    continue;
                }
                if (opts.quitarBordes && esArtefactoDeBorde(texto, i, lineas.length)) {
                    informe.bordes++;
                    continue;
                }

                // Palabra cortada entre renglones: el anterior termina en guion.
                // Se une sin el guion. Distinto del reflujo de parrafo, que es
                // la rama de abajo y solo repone el espacio.
                if (opts.unirCortes && salida.length > 0) {
                    const previa = salida[salida.length - 1];
                    const terminaEnGuion = /[-­]$/.test(previa.texto.trimEnd());
                    const empiezaMinuscula = /^[a-záéíóúüñ]/.test(texto);

                    const seguir = (unido) => {
                        previa.texto = unido;
                        previa.fragmentos = [...previa.fragmentos, ...fragmentos];
                        previa.borde = bordeDerecho(fragmentos);
                        previa.y = fragmentos[0].transform[5];
                        previa.ultimo = texto;
                        informe.unidas++;
                    };

                    if (terminaEnGuion && empiezaMinuscula) {
                        seguir(previa.texto.trimEnd().replace(/[-­]$/, '') + texto);
                        continue;
                    }

                    // Reflujo: el renglon anterior no cerro una oracion y este
                    // arranca en minuscula —o, aunque arranque en mayuscula, la
                    // geometria dice que sigue el mismo parrafo: ver
                    // continuaElParrafo—. Son el mismo parrafo, cortado por el
                    // ancho de la hoja. Unirlos es lo que hace que el Markdown
                    // se lea como texto y no como una lista de renglones.
                    //
                    // Una enumeracion es un renglon nuevo aunque este pegado y
                    // aunque empiece en minuscula: hasta el 15/9/2026 un "a)"
                    // se pegaba al final del renglon de arriba.
                    const cerroOracion = /[.:;!?]["'”)]?$/.test(previa.texto.trimEnd());
                    const esEnumeracion = /^\s*(?:[IVXLCDM]+\s*[.)-]|\d+\s*[.)-]|[a-z]\))/.test(texto);
                    if (!cerroOracion && !esEnumeracion &&
                        (empiezaMinuscula || continuaElParrafo(previa, fragmentos, texto, caja))) {
                        // Sin espacio si el corte cayo en la coma o la barra de
                        // un numero: "$1.234.567" / ",89" es un monto con
                        // decimales, y con el espacio en el medio parece otra cosa.
                        const junto = /^[,/]/.test(texto) ? '' : ' ';
                        seguir(previa.texto.trimEnd() + junto + texto);
                        continue;
                    }
                }

                salida.push({
                    texto: crudo,
                    fragmentos,
                    borde: bordeDerecho(fragmentos),
                    y: fragmentos[0].transform[5],
                    ultimo: texto,
                });
                informe.lineas++;
            }

            if (salida.length > 0) columnas.push(salida.map((l) => l.texto.trimEnd()).join('\n'));
        }

        if (columnas.length === 0) continue;

        let texto = columnas.join('\n\n');
        if (opts.detectarTitulos) texto = marcarEstructura(texto, informe);
        textoDePaginas.push(texto);
    }

    // El separador entre paginas se conserva a proposito: en un expediente,
    // saber en que foja estaba algo es parte del dato. Sin el, el Markdown es
    // un bloque continuo y no hay como volver al original.
    const union = opts.separarPaginas ? '\n\n---\n\n' : '\n\n';
    const markdown = textoDePaginas.join(union).replace(/\n{4,}/g, '\n\n\n').trim();

    return { markdown, informe };
}
