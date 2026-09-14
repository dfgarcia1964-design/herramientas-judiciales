// ---------------------------------------------------------------
// Controla que sale del navegador desde las paginas publicadas.
//
//   npm run verificar-red
//
// Existe por una lista incompleta escrita con toda confianza. El
// 26/8/2026 Javier pregunto si el sitio promete que los datos no salen
// del navegador. Para contestar se leyeron las once calculadoras una
// por una y la respuesta nombro dos que consultaban afuera:
// honorarios-mediacion y distancia. Eran TRES: prorrateo.html le pedia
// el valor de la UMA a la misma planilla de Google, y no se vio porque
// la llamada esta a cuatrocientas lineas del calculo, adentro de un
// cargador de CSV con su propio parser de comillas.
//
// La leccion no es leer con mas atencion. Es que para una pregunta
// mecanica ---que hosts aparecen en estos archivos--- hay un control
// mecanico, y usar el ojo donde va el control es como se escribe una
// lista incompleta sin darse cuenta.
//
// QUE HACE. Busca cada host que aparezca en las paginas que se
// publican y exige que este en la lista de abajo, con el motivo
// escrito al lado. Un host nuevo no rompe nada visible ---la pagina
// sigue andando--- asi que sin esto entra en silencio.
//
// QUE NO HACE. No mira si la llamada se ejecuta ni cuando. Un host
// listado en un comentario cuenta igual que uno en un fetch(), a
// proposito: la pregunta que este control contesta es "a quien
// nombra este sitio", y afinarla para distinguir codigo de prosa la
// volveria a hacer dependiente de leer bien.
//
// Sin red y sin honorio/: corre siempre.
// ---------------------------------------------------------------

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

// Los hosts permitidos, con el motivo. Agregar uno aca es una decision
// y se ve en el diff, que es todo el punto.
const PERMITIDOS = new Map([
    // Tipografia. Es el unico tercero que cargan casi todas las paginas
    // y esta asumido: sin el, Archivo no se ve.
    ['fonts.googleapis.com', 'la hoja de estilos de Archivo'],
    ['fonts.gstatic.com', 'los archivos de la tipografia Archivo'],

    // distancia.html es la unica que manda algo que el usuario escribio
    // ---un nombre de localidad--- y la pagina lo dice arriba de todo.
    ['apis.datos.gob.ar', 'distancia.html: geolocalizacion de localidades argentinas (GEOREF)'],
    ['datosgobar.github.io', 'distancia.html: la documentacion de GEOREF, enlazada'],
    ['geocoding-api.open-meteo.com', 'distancia.html: geolocalizacion de localidades del exterior'],
    ['router.project-osrm.org', 'distancia.html: distancia por ruta sobre datos de OpenStreetMap'],
    ['www.openstreetmap.org', 'distancia.html: la atribucion de OpenStreetMap, enlazada'],

    // Enlaces a normas, sentencias y a los otros sitios propios. No
    // sale nada del navegador hasta que alguien hace clic, y entonces
    // se va a otra pagina.
    ['servicios.infoleg.gob.ar', 'enlaces al texto de las normas citadas'],
    // Infoleg publica el TEXTO de la Acordada 5/2010 pero no su anexo, que es
    // la tabla: termina justo donde la tabla empieza. En argentina.gob.ar el
    // anexo esta, como imagen, y es de ahi que se transcribio
    // data/acordada-5-2010-distancias.json. Se enlaza el que tiene la tabla.
    ['www.argentina.gob.ar', 'distancia.html: el texto y el anexo de la Acordada 5/2010, enlazados'],
    ['www.csjn.gov.ar', 'enlaces a las acordadas y resoluciones de la CSJN'],
    ['honorio.ar', 'enlace a Honorio, que es del mismo autor'],
    ['javiercuneo.com.ar', 'el propio sitio: og:image y la direccion de correo'],

    // La API de feriados NO se consulta desde el navegador: la consulta
    // scripts/actualizar-feriados.mjs en el build, y lo que las
    // calculadoras leen es data/feriados.json, versionado. documentacion.html
    // la nombra para decir de donde salen los datos, que es justo lo
    // contrario de una dependencia en vivo.
    ['argentinadatos.com', 'documentacion.html la NOMBRA como origen de data/feriados.json; no se la consulta desde el navegador'],
    ['github.com', 'enlaces al repositorio y al perfil'],
    ['ar.linkedin.com', 'enlace al perfil'],
    ['www.w3.org', 'el espacio de nombres de SVG, que no se descarga'],
]);

// Los hosts que ya estuvieron y no pueden volver. Un host prohibido da
// un mensaje distinto del de uno desconocido, porque no es lo mismo
// "esto es nuevo, decidilo" que "esto ya se saco a proposito".
const PROHIBIDOS = new Map([
    ['docs.google.com',
     'la planilla publicada de la que salian la UMA y el UHOM. Se saco el 26/8/2026: ' +
     'los valores estan en data/serie-uma.json y data/serie-uhom.json, leidos de los actos ' +
     'de la CSJN y verificados por npm run verificar-series. Una planilla suelta que se ' +
     'edita a mano no la controla nada.'],
]);

// Lo que pages.yml publica de calculadoras/ es la carpeta entera, con
// una excepcion: honorarios.html se retiro el 7/8/2026 y en su URL se
// publica el aviso de redirects/honorarios-retirada/. El archivo queda
// en el repositorio como historia y NO llega al sitio, asi que su
// fetch a la planilla no cuenta. Es la unica exclusion y esta escrita
// aca para que se vea, no adentro de una condicion.
const NO_SE_PUBLICAN = new Set(['honorarios.html']);

const RAIZ = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');

function paginas() {
    const salida = [];
    for (const f of readdirSync(join(RAIZ, 'calculadoras'))) {
        if (!f.endsWith('.html')) continue;
        if (NO_SE_PUBLICAN.has(f)) continue;
        salida.push(['calculadoras/' + f, join(RAIZ, 'calculadoras', f)]);
    }
    for (const f of ['index.html', 'documentacion.html', 'quien-soy.html', 'uma-uhom.html', '404.html']) {
        salida.push([f, join(RAIZ, f)]);
    }
    return salida;
}

const HOST = /https?:\/\/([a-z0-9.-]+)/gi;

let fallas = 0;
let hosts = 0;
const vistos = new Map();

for (const [rotulo, ruta] of paginas()) {
    const texto = readFileSync(ruta, 'utf8');
    for (const m of texto.matchAll(HOST)) {
        const host = m[1].toLowerCase().replace(/[.]+$/, '');
        hosts++;
        if (!vistos.has(host)) vistos.set(host, new Set());
        vistos.get(host).add(rotulo);
    }
}

console.log('');
for (const [host, donde] of [...vistos].sort()) {
    const paginasDe = [...donde].sort().join(', ');
    if (PROHIBIDOS.has(host)) {
        fallas++;
        console.log(`FALLA  ${host}`);
        console.log(`       en ${paginasDe}`);
        console.log(`       ${PROHIBIDOS.get(host)}`);
    } else if (!PERMITIDOS.has(host)) {
        fallas++;
        console.log(`FALLA  ${host} no esta en la lista`);
        console.log(`       en ${paginasDe}`);
        console.log('       Si tiene que estar, agregalo a PERMITIDOS con el motivo.');
    } else {
        console.log(`ok     ${host} — ${PERMITIDOS.get(host)}`);
    }
}

console.log('');
console.log(`${vistos.size} host(s) distintos en ${paginas().length} paginas publicadas, ${hosts} menciones.`);

if (fallas) {
    console.log(`${fallas} sin justificar.`);
    process.exit(1);
}

console.log('Todos los terceros que el sitio nombra estan declarados con su motivo.');
console.log('La unica pagina que manda algo escrito por el usuario sigue siendo distancia.html.');
