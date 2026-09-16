(function (global) {
    'use strict';

    const UVT = {
        2025: 49799,
        2026: 52374
    };

    function numero(valor) {
        const resultado = Number(valor);
        if (!Number.isFinite(resultado)) throw new Error('El valor tiene que ser numérico.');
        return resultado;
    }

    function formatearCOP(valor, decimales = 0) {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: decimales,
            maximumFractionDigits: decimales
        }).format(numero(valor));
    }

    function formatearNumero(valor, decimales = 0) {
        return new Intl.NumberFormat('es-CO', {
            minimumFractionDigits: decimales,
            maximumFractionDigits: decimales
        }).format(numero(valor));
    }

    function valorUVT(anio) {
        const valor = UVT[Number(anio)];
        if (valor === undefined) throw new Error(`No hay UVT cargada para ${anio}.`);
        return valor;
    }

    function copDesdeUVT(cantidad, anio) {
        return numero(cantidad) * valorUVT(anio);
    }

    global.MonedaColombia = {
        UVT,
        formatearCOP,
        formatearNumero,
        valorUVT,
        copDesdeUVT
    };
})(typeof window !== 'undefined' ? window : globalThis);
