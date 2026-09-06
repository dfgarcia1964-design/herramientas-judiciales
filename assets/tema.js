// ------------------------------------------------------------------
// Interruptor de tema claro / oscuro para todo el sitio.
//
// Antes el sitio seguía y punto a `prefers-color-scheme`, o sea al
// sistema operativo del visitante. Eso está bien de arranque pero no
// alcanza: el mismo usuario abre el sitio en casa con Windows en
// oscuro y en la oficina en claro, y no tenía cómo decidir. Honorio ya
// tenía su interruptor, así que además el sitio y la app se
// comportaban distinto.
//
// POR QUE ESTE ARCHIVO Y NO UNO POR PAGINA: son muchas páginas sin
// build —y desde el 26/8 también las que genera scripts/build-docs.mjs,
// que lo carga con ../assets/tema.js—. Un archivo compartido es la única
// forma de que el comportamiento no se desincronice, igual que comun.css
// con los tokens.
//
// EL DEFECTO ES OSCURO, NO EL DEL SISTEMA (6/9/2026). Antes, sin
// preferencia guardada, mandaba `prefers-color-scheme`. Ahora el que no
// eligió ve oscuro, y el que quiere claro lo tiene a un botón. Que
// decida el sistema operativo no es más neutral: es otra decisión, y
// encima no es la del que mira.
//
// El `@media (prefers-color-scheme: dark)` de comun.css NO sobra por
// esto, aunque acá siempre quede un `data-tema` puesto. Es lo único que
// queda cuando este archivo no corre: sin él, alguien con el JS
// bloqueado y el sistema en oscuro vería la página clara.
//
// SE CARGA EN EL <head>, CON defer NO. Tiene que correr antes del
// primer pintado o se ve el destello del tema equivocado. Por eso la
// primera parte no toca el DOM más allá de <html>, que ya existe.
//
// Los tokens viven en el CSS de cada página. Este archivo solo pone el
// atributo `data-tema` en <html>; el CSS hace el resto.
// ------------------------------------------------------------------
(function () {
  'use strict';

  var CLAVE = 'javiercuneo.tema';
  var DEFECTO = 'oscuro';

  function guardado() {
    try {
      var v = localStorage.getItem(CLAVE);
      return v === 'claro' || v === 'oscuro' ? v : null;
    } catch (e) {
      // Modo privado o cookies bloqueadas: se sigue sin recordar.
      return null;
    }
  }

  function aplicar(tema) {
    if (tema) document.documentElement.setAttribute('data-tema', tema);
    else document.documentElement.removeAttribute('data-tema');
  }

  // 1) Antes de pintar. Siempre queda un tema aplicado: el guardado, o el
  //    de defecto. Ya no se sale sin atributo, asi que el CSS no depende
  //    de `prefers-color-scheme` mientras este archivo corra.
  aplicar(guardado() || DEFECTO);

  // 2) Cuál se está viendo ahora. No pregunta por el sistema: desde que el
  //    defecto es fijo, el sistema no decide y preguntarle daria el rotulo
  //    equivocado --el boton diria "Oscuro" en una pagina ya oscura--.
  function actual() {
    return guardado() || DEFECTO;
  }

  // 3) El botón, ya con el DOM listo.
  function montar() {
    if (document.querySelector('.tema-boton')) return;

    var btn = document.createElement('button');
    btn.className = 'tema-boton';
    btn.type = 'button';

    function rotular() {
      var a = actual();
      var proximo = a === 'oscuro' ? 'claro' : 'oscuro';
      btn.textContent = a === 'oscuro' ? 'Claro' : 'Oscuro';
      // El texto dice a dónde va; el aria-label explica qué es, porque
      // "Oscuro" solo no dice si describe el estado o la acción.
      btn.setAttribute('aria-label', 'Cambiar a tema ' + proximo);
      btn.title = 'Cambiar a tema ' + proximo;
    }

    btn.addEventListener('click', function () {
      var proximo = actual() === 'oscuro' ? 'claro' : 'oscuro';
      try {
        localStorage.setItem(CLAVE, proximo);
      } catch (e) {
        /* sin persistencia, pero el cambio de esta sesión vale igual */
      }
      aplicar(proximo);
      rotular();
    });

    rotular();
    document.body.appendChild(btn);

    // Acá había un listener de `prefers-color-scheme` para seguir al sistema
    // en vivo mientras el usuario no hubiera elegido. Se fue con el defecto
    // fijo: no queda ningun estado en el que el sistema mande, asi que lo
    // unico que podia hacer era cambiar el rotulo de un boton que no cambia.
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', montar);
  } else {
    montar();
  }
})();
