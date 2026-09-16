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

const NOMBRES_MESES = {
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6,
  julio: 7, agosto: 8, septiembre: 9, octubre: 10, noviembre: 11, diciembre: 12
};

/**
 * Extrae fechas de texto con contexto
 * @param {string} texto - Texto del documento
 * @returns {Array} Array de objetos con fecha y contexto
 */
function extraerFechas(texto) {
  const fechas = [];
  const palabras = texto.toLowerCase().split(/\s+/);

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
