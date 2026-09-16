(function (global) {
    'use strict';

    const PATRON = /^(\d{5})-(\d{2})-(\d{2})-(\d{3})-(\d{4})-(\d{5})-(\d{2})$/;

    function normalizar(radicado) {
        return String(radicado || '').trim().replace(/\s+/g, '');
    }

    function analizar(radicado) {
        const texto = normalizar(radicado);
        const match = PATRON.exec(texto);
        if (!match) {
            return {
                válido: false,
                error: 'El radicado debe tener el formato NNNNN-NN-NN-NNN-NNNN-NNNNN-NN.'
            };
        }
        const [geografia, corporacion, especialidad, despacho, anio, proceso, instancia] =
            match.slice(1);
        return {
            válido: true,
            radicado: texto,
            bloques: { geografia, corporacion, especialidad, despacho, anio, proceso, instancia },
            primeraInstancia: instancia === '00'
        };
    }

    function esValido(radicado) {
        return analizar(radicado).válido;
    }

    function formatear(partes) {
        const nombres = ['geografia', 'corporacion', 'especialidad', 'despacho', 'anio', 'proceso', 'instancia'];
        if (!partes || nombres.some((nombre) => !/^\d+$/.test(String(partes[nombre] || '')))) {
            throw new Error('Todos los bloques del radicado tienen que ser numéricos.');
        }
        const longitudes = [5, 2, 2, 3, 4, 5, 2];
        const bloques = nombres.map((nombre, i) => String(partes[nombre]).padStart(longitudes[i], '0'));
        if (bloques.some((bloque, i) => bloque.length !== longitudes[i])) {
            throw new Error('Cada bloque del radicado tiene una longitud fija.');
        }
        return bloques.join('-');
    }

    global.RadicadoColombia = { analizar, esValido, formatear };
})(typeof window !== 'undefined' ? window : globalThis);
