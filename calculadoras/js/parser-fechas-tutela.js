/**
 * Parser de Fechas para Documentos de Tutela
 * Decreto Ley 2591/1991 — Colombia
 *
 * Extrae fechas relevantes de texto previamente extraído
 * Identifica contexto: presentación, notificación, fallo, cumplimiento
 */

const PALABRAS_CLAVE = {
  presentacion: ['se presenta', 'presentada', 'interpuesta', 'radicada', 'fecha de presentación', 'presentación de la tutela'],
  notificacion: ['se notifica', 'notificado', 'notificación', 'cédula de citación', 'cédula'],
  fallo: ['se profiere', 'proferida', 'sentencia', 'decisión', 'resolución', 'fallo'],
  cumplimiento: ['debe cumplirse', 'plazo de cumplimiento', 'orden debe ser cumplida', 'en el término de', 'dentro de']
};

const PATRON_FECHA = /(\d{1,2})[\s/\-](\d{1,2})[\s/\-](\d{4})/g;
const PATRON_FECHA_TEXTO = new RegExp(
  `\\b(${[
    'treinta y uno', 'veintinueve', 'veintiocho', 'veintisiete', 'veintiseis', 'veintiséis',
    'veinticinco', 'veinticuatro', 'veintitrés', 'veintitres', 'veintidós', 'veintidos',
    'veintiuno', 'veintiún', 'veinte', 'diecinueve', 'dieciocho', 'diecisiete',
    'dieciséis', 'dieciseis', 'quince', 'catorce', 'trece', 'doce', 'once', 'diez',
    'nueve', 'ocho', 'siete', 'seis', 'cinco', 'cuatro', 'tres', 'dos', 'uno', 'una'
  ].join('|')})(?:\\s*\\(\\d{1,2}\\))?\\s+de\\s+(${[
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto',
    'septiembre', 'setiembre', 'octubre', 'noviembre', 'diciembre'
  ].join('|')})\\s+de\\s+(dos\\s+mil\\s+(?:veintiséis|veintiseis|veinticinco|veinticuatro|veintitrés|veintitres|veintidós|veintidos|veintiuno|veinte|diecinueve|dieciocho|diecisiete|dieciséis|dieciseis|dieciocho|diecisiete|dieciséis|dieciseis|quince|catorce|trece|doce|once|diez|nueve|ocho|siete|seis|cinco|cuatro|tres|dos|uno))(?:\\s*\\(\\d{4}\\))?`,
  'giu'
);

const NOMBRES_MESES = {
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6,
  julio: 7, agosto: 8, septiembre: 9, octubre: 10, noviembre: 11, diciembre: 12
};

const NUMEROS_DIA = {
  uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6,
  siete: 7, ocho: 8, nueve: 9, diez: 10, once: 11, doce: 12, trece: 13,
  catorce: 14, quince: 15, dieciseis: 16, 'dieciséis': 16, diecisiete: 17,
  dieciocho: 18, diecinueve: 19, veinte: 20, veintiuno: 21, 'veintiún': 21,
  veintidos: 22, 'veintidós': 22, veintitres: 23, 'veintitrés': 23,
  veinticuatro: 24, veinticinco: 25, veintiseis: 26, 'veintiséis': 26,
  veintisiete: 27, veintiocho: 28, veintinueve: 29, treinta: 30,
  'treinta y uno': 31
};

const NUMEROS_ANIO = {
  ...NUMEROS_DIA,
  treinta: 30
};

function numeroTexto(texto, tabla = NUMEROS_DIA) {
  return tabla[texto.toLowerCase().replace(/\s+/g, ' ').trim()];
}

function anioTexto(texto) {
  const match = /^dos\s+mil\s+(.+)$/i.exec(texto);
  const resto = match && numeroTexto(match[1], NUMEROS_ANIO);
  return resto === undefined ? undefined : 2000 + resto;
}

/**
 * Extrae fechas de texto con contexto
 * @param {string} texto - Texto del documento
 * @returns {Array} Array de objetos con fecha y contexto
 */
function extraerFechas(texto) {
  const fechas = [];

  let match;
  while ((match = PATRON_FECHA.exec(texto)) !== null) {
    const dia = parseInt(match[1]);
    const mes = parseInt(match[2]);
    const anio = parseInt(match[3]);

    // Validar fecha
    if (!esFechaValida(dia, mes, anio)) continue;

    // Encontrar contexto
    const posicion = match.index;
    const contextoAntes = obtenerContextoAntes(texto, posicion);
    const contexto = identificarContexto(contextoAntes);

    fechas.push({
      fecha: `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${anio}`,
      dia, mes, anio,
      tipo: contexto.tipo,
      palabraClave: contexto.palabra,
      confianza: contexto.confianza,
      contextoAntes,
      posicion
    });
  }

  while ((match = PATRON_FECHA_TEXTO.exec(texto)) !== null) {
    const dia = numeroTexto(match[1]);
    const mes = NOMBRES_MESES[match[2].toLowerCase()];
    const anio = anioTexto(match[3]);
    if (dia === undefined || mes === undefined || anio === undefined) continue;
    if (!esFechaValida(dia, mes, anio)) continue;

    const posicion = match.index;
    const contextoAntes = obtenerContextoAntes(texto, posicion);
    const contexto = identificarContexto(contextoAntes);
    fechas.push({
      fecha: `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${anio}`,
      dia, mes, anio,
      tipo: contexto.tipo,
      palabraClave: contexto.palabra,
      confianza: contexto.confianza,
      contextoAntes,
      posicion
    });
  }

  return fechas;
}

/**
 * Obtiene texto anterior a una posición (máximo 10 palabras)
 */
function obtenerContextoAntes(texto, posicion) {
  const inicio = Math.max(0, posicion - 100);
  return texto.substring(inicio, posicion).toLowerCase();
}

/**
 * Identifica el tipo de fecha según palabras clave
 */
function identificarContexto(contexto) {
  for (const [tipo, palabras] of Object.entries(PALABRAS_CLAVE)) {
    for (const palabra of palabras) {
      if (contexto.includes(palabra)) {
        return {
          tipo,
          palabra,
          confianza: 'alta'
        };
      }
    }
  }

  return {
    tipo: 'desconocido',
    palabra: null,
    confianza: 'baja'
  };
}

/**
 * Valida que sea una fecha legítima
 */
function esFechaValida(dia, mes, anio) {
  if (mes < 1 || mes > 12) return false;
  if (dia < 1 || dia > 31) return false;
  if (anio < 2000 || anio > 2030) return false;

  // Validar días específicos por mes
  const diasPorMes = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  // Considerar bisiesto
  if (anio % 4 === 0 && (anio % 100 !== 0 || anio % 400 === 0)) {
    diasPorMes[1] = 29;
  }

  return dia <= diasPorMes[mes - 1];
}

/**
 * Proporciona sugerencias sobre qué fecha usar
 */
function sugerirFechas(fechasExtraidas) {
  const sugerencias = {
    presentacion: fechasExtraidas.find(f => f.tipo === 'presentacion'),
    fallo: fechasExtraidas.find(f => f.tipo === 'fallo'),
    cumplimiento: fechasExtraidas.find(f => f.tipo === 'cumplimiento')
  };

  return sugerencias;
}

/**
 * Formatea resultado para mostrar al usuario
 */
function formatearResultado(fechasExtraidas) {
  if (fechasExtraidas.length === 0) {
    return {
      exito: false,
      mensaje: 'No se encontraron fechas en el documento',
      fechas: []
    };
  }

  const sugerencias = sugerirFechas(fechasExtraidas);

  return {
    exito: true,
    total: fechasExtraidas.length,
    sugerencias,
    todas: fechasExtraidas.map(f => ({
      fecha: f.fecha,
      tipo: f.tipo,
      palabraClave: f.palabraClave,
      confianza: f.confianza
    }))
  };
}

// Exportar para uso en navegador
if (typeof window !== 'undefined') {
  window.ParserFechasTutela = {
    extraerFechas,
    sugerirFechas,
    formatearResultado
  };
}

// Exportar para uso en Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    extraerFechas,
    sugerirFechas,
    formatearResultado,
    esFechaValida,
    identificarContexto
  };
}
