# Historia del proyecto

Lo que se hizo y quedó cerrado: cómo se llegó hasta acá, qué se rompió y ya se
arregló, qué se discutió y se decidió.

**No hace falta leer esto para trabajar.** Para eso está
[`ESTADO.md`](ESTADO.md), que lleva sólo lo que está abierto, lo que está roto y
las trampas vivas. Este archivo se abre cuando aparece una pregunta concreta:
«¿por qué esto quedó así?», «¿esto ya se probó?», «¿de dónde salió esta regla?».

**Que este archivo sea largo es su trabajo, y por eso el otro puede ser corto.**
`ESTADO.md` tiene presupuesto de líneas —se lee entero en cada sesión— y acá no
hay ninguno: lo que se cierra se muda para acá en el mismo commit que lo cierra,
y nadie lo paga hasta que va a buscarlo. El 28/8 se mudó de una vez la crónica
acumulada de cuatro meses, que era la mayor parte de `ESTADO.md`.

El texto está tal cual se escribió en su momento, sin reescribir. Las fechas son
de 2026.

---

## El ledger pasa a cargar los motores desde el sitio — anotado el 11/9

El repositorio `ledger` empezó a cargar `calendario-judicial.js` y `plazos.js`
desde `javiercuneo.com.ar`, con los tres JSON del calendario, para la caducidad
y el vencimiento de la apelación. No se tocó una línea de los motores: se anotó
la dependencia en `ESTADO.md`, en `AGENTS.md` y en la cabecera de
`conectores/nucleo.mjs`, que es donde se enumeraban los consumidores y decía
«tres».

Lo que se leyó para escribirlo, y no se tomó de la descripción del pedido: el
`cargarCalendario()` del ledger —reescribe las tres URL de `CONFIG` entre cargar
el script y llamar a `init`— y el `export` de los dos motores. Y se comprobó con
`curl` que GitHub Pages devuelve `Access-Control-Allow-Origin: *` en los cinco
archivos.

---

## El certificado de `www`, resuelto por el otro lado — cerrado el 8/9

Arrastrado desde el 5/8: el ápex andaba por HTTPS y `www` caía al wildcard
`*.github.io`, con corte de nombre en el navegador. El 7/9 se confirmó contra la
API en vez de deducirlo —`https_certificate.domains` traía `["javiercuneo.com.ar"]`
y nada más— y se descartó el DNS: las cuatro A del ápex y el CNAME de `www`
estaban bien, y el dominio ya estaba verificado a nivel cuenta.

**El camino que parecía obvio no funciona.** Se escribió
`scripts/reemitir-certificado-pages.sh` sobre la premisa de que sacar y reponer el
dominio obliga a GitHub a emitir de nuevo, para el ápex y para `www`. Corrió
entero y **fue una operación en vacío**: el certificado volvió con el mismo
`expires_at: 2026-11-03` —o sea, el mismo— y GitHub volvió a prender
`https_enforced` solo. Con 60 segundos de hueco el registro del certificado no se
cae del lado de GitHub, y al reponer el dominio se le engancha el que ya tenía. No
arregló nada y tampoco rompió nada: el sitio no llegó a caerse.

**Y hubo un error de lectura que conviene no repetir.** Con el script todavía
corriendo se leyó `https_enforced: true` y se concluyó que no había llegado ni al
primer paso, que es el que lo apaga. Era al revés: los tres pasos habían corrido y
**GitHub lo había vuelto a prender solo** al reenganchar el certificado. La
captura de pantalla del operador fue el dato correcto contra el razonamiento.
`https_enforced` no sirve para inferir por dónde va un proceso: lo mueve GitHub
además de uno.

**Se resolvió sin tocar GitHub.** El registro `www` pasó a proxeado en Cloudflare,
donde el certificado del borde ya cubre `*.javiercuneo.com.ar`. Cero corte: el
ápex nunca dejó de servir y siguió siendo el canónico. Verificado el 8/9: la
cadena `www/uma-uhom.html` → 301 → ápex → 200, con la ruta preservada.

Lo que quedó anotado en `ESTADO.md` como frágil son las dos cosas que la
verificación destapó: que el 301 lo emite GitHub y no la regla de Cloudflare —que
no matchea—, y que la cadena depende de que el modo SSL/TLS siga en *Full*, porque
en *Full (strict)* Cloudflare validaría un certificado de origen que no cubre `www`.

---

## La poda del 7/9, y lo que encontró: el archivo ya casi no tiene grasa

`ESTADO.md` estaba en 900 de 1000, o sea en el aviso, y quedó en **860**: se
sacaron unas 60 líneas y entraron 20 nuevas con el diagnóstico del certificado de
`www`, que antes era una conjetura de dos renglones. Lo que salió es lo que
**este archivo ya contaba entero** y que allá había quedado duplicado: el
mapa de `distancia` —el contorno del IGN, el encuadre, la tierra en `--fg`, el
`overview=full` de OSRM—, el caso Formosa, la crónica de las dos roturas de las
teclas del tablero, el porqué de cada uno de los tres bancos del navegador, y el
detalle de la regresión de `verificar-plazos`. También bajó entera la sección
«Del lado de Honorio: mudado, no hay nada que hacer acá», que decía de sí misma
que no había nada que hacer: los tres puntos de `scripts/actualizar-uma.mjs` se
mudaron el 1/9 al `ESTADO.md` de Honorio y de este lado sólo quedan las series
con las que se calibran, que no piden nada.

**Y lo que la poda encontró importa más que las líneas que sacó.** Después de dos
limpiezas seguidas —la del 6/9 y ésta— lo que queda ya casi no es crónica: son
diez calculadoras, tres bancos de navegador, doce controles, el contrato de
`conectores/` que ya consume un hermano, los límites conocidos del anonimizador y
una lista de trampas que siguen mordiendo. **El archivo está cerca del techo
porque el repositorio tiene esa superficie viva, no porque nadie lo limpie**, que
era la causa que el control se escribió para atacar. La pregunta que el propio
`verificar-estado.mjs` manda hacerse antes de tocar el número —«no cuánto, sino
qué hay adentro que ya está cerrado»— esta vez se contestó, y la respuesta fue
poco. Queda anotada para Javier: o el techo sube a sabiendas, o hay que aceptar
que las decisiones que un control ya hace cumplir no necesitan su prosa entera
en el archivo que se lee todas las sesiones. **Eso último es arquitectura de la
memoria y no lo decide un agente.**

---

## El tema por defecto es oscuro, y el sistema deja de decidir — cerrado el 6/9

Sin preferencia guardada mandaba `prefers-color-scheme`, o sea el sistema
operativo del que mira. Ahora el que no eligió ve oscuro y el que quiere claro lo
tiene a un botón. **Que decida el sistema no es más neutral: es otra decisión, y
encima no es la del que mira.**

Tres cambios en `assets/tema.js` y ninguno toca un valor de color, así que
`verificar-contraste` siguió valiendo y no hubo que recalibrar nada:
`aplicar(guardado() || 'oscuro')` —corre en el `<head>` sin `defer`, así que
sigue sin haber destello—; `actual()` dejó de preguntarle a `matchMedia`, porque
con el defecto fijo el sistema no decide y preguntarle daba el rótulo equivocado
—el botón habría dicho «Oscuro» en una página ya oscura—; y se fue el listener de
`prefers-color-scheme`, que no tenía ningún estado en el que mandara.

**El `@media (prefers-color-scheme: dark)` de `comun.css` se quedó.** Parece
muerto porque acá siempre queda un `data-tema` puesto, pero es lo único que
decide cuando ese archivo no corre: sin él, alguien con el JS bloqueado y el
sistema en oscuro vería la página clara. No alcanza a Honorio, que tiene su
propio interruptor y su propia clave.

---

## Lo que bajó de `ESTADO.md` en la limpieza del 6/9

`ESTADO.md` llegó a 999 de 1000 líneas. Casi todo lo que se podó estaba ya acá
—la reescritura de `distancia`, el mapa, las dos roturas de las teclas del
tablero, el aviso de red—: quedaba duplicado. Lo que **no** estaba escrito en
ningún lado es esto.

**El jueves santo, cuando se cargó.** Estaba a mano sólo 2025; de 2021 a 2024 el
motor lo contaba como hábil. Se cargaron los seis en `data/dias-inhabiles.json`.
**2026 no figura y no es un olvido**: ese año cayó 2 de abril y ya es feriado
nacional por Malvinas. La regla viva —que `verificar-calculos` exija que el día
anterior a cada viernes santo sea inhábil— se quedó en `ESTADO.md`.

**La feria de enero, cuando salió del código.** Era el último día inhábil escrito
a mano, `getMonth() === 0` en `calculadoras/js/calendario-judicial.js`, y el
comentario del archivo decía que lo fijaba el art. 257 CPCCN, que no dice nada de
esto. Pasó a la clave `feria_de_enero` de `data/feria-judicial.json`, con el art.
2 del Reglamento para la Justicia Nacional citado y el texto adentro.

**Un valor con vigencia futura era inválido, y no tenía por qué serlo.** La
prohibición existía porque `uma-uhom.html` tomaba el **último del archivo** como
vigente, mientras las otras tres páginas ya tomaban el último que ya rige.
Arreglada esa, la prohibición quedó sin motivo, y el Ministerio publica el UHOM
por trimestres: **lo que hacía falta garantizar no era que no hubiera futuros,
sino que siempre hubiera alguno vigente.**

**Y el pedido del conector estaba cerrado hacía cuatro días sin que este lado lo
supiera.** `ESTADO.md` decía «lo que falta: avisarle al hermano» y «hasta que
alguien los consuma, *andan* quiere decir que pasan una corrida a mano».
`HERMANOS.md` lo daba por cerrado el 2/9 y `pipeline/plazos.py` de
`pipeline-drafter` levanta `conectores/mcp.mjs` por stdio. **Es el modo de falla
propio de un pedido que se cierra en el repositorio del otro:** el que lo
construyó no se entera. Lo que cambia no es una tilde en una lista, es el peso de
un cambio: tocar la forma de una respuesta ahora rompe a alguien.

**Y una trampa que no es de este repositorio.** «La consola de Next acumula
errores viejos y no los limpia al recargar»: un guardado intermedio con el JSX
roto dejaba errores de sintaxis en el buffer que seguían apareciendo después de
arreglarlo, con números de línea de código que ya no existía. Lo resuelve una
compilación fresca —`rm -rf .next && npm run build`—, y si `tsc --noEmit` está
limpio, la consola miente. **Next es Honorio, que no vive acá**, así que la
trampa se fue de las trampas vivas de este lado.

---

## El calendario de agosto se dibujaba encima del de septiembre — cerrado el 2/9

Javier mandó una captura de `vencimientos`: los dos meses del dibujo pisados uno
sobre el otro, las iniciales de los días superpuestas —una «V» y una «M» en el
mismo lugar—, y las últimas columnas de agosto escritas arriba de las de
septiembre. **El motor estaba bien**: la respuesta grande, la tira de datos y los
números de orden decían exactamente lo que tenían que decir. Se rompía el dibujo.

**La causa es un nombre de clase repetido.** El día que originaba el plazo —la
firma de la resolución— se marcaba con `.celda.firma`, y las cinco pantallas que
dibujan traen un pie de autoría que también es `.firma`, con `margin-top: 28px`,
`padding-top: 18px` y un `border-top`. El `<style>` de cada calculadora se carga
**después** de `css/dibujo-plazo.css` —es el orden que deja ganar a lo local— así
que la celda del 24 de agosto se comía los 18 px de relleno del pie.

**Y con `aspect-ratio: 1` el alto vuelve al ancho.** El mínimo automático de una
celda con relación de aspecto se transfiere de un eje al otro: esa celda pasó a
pedir 70,5 px de mínimo, las siete columnas de `1fr` de la grilla se estiraron a
70,5 —una columna `1fr` nunca baja de su mínimo— y el mes entero se dibujó a
493 px adentro de una caja de 236. Lo que sobraba caía sobre el mes siguiente.

**Se veía sólo con notificación automática**, que es la única modalidad de
`vencimientos` que marca ese día. Con cédula, la fecha cargada ya es la de la
diligencia y la marca no se dibuja: por eso el dibujo funcionaba casi siempre.
`regresiva` y `entre-fechas` usaban la misma clase para el ancla del cómputo y
estaban rotas igual, en todos sus casos.

**Cómo se cerró.** La clase pasó a llamarse `ancla`, que es lo que en realidad
significa en las tres pantallas —el dato que el usuario cargó y del que sale todo
lo demás— y que no existe en el `<style>` de ninguna. Y `.celda` lleva desde
ahora `margin: 0; padding: 0; min-width: 0`, que no dibujan nada: con esas tres,
un nombre repetido puede cambiar un color, pero **no puede volver a romper la
grilla**.

### Y de paso, un casillero que repetía el de al lado

Con notificación **por cédula** la tira mostraba «Cédula diligenciada 24 ago» y
«Notificada 24 ago»: el mismo día dos veces con dos nombres. Javier, el 2/9:
«el único dato es el de notificada, que es el que ingresa el usuario; lo de
diligenciada se presta a confusión». Quedó un solo casillero.

Las dos fechas **sí** se separan cuando la cédula cae en día inhábil o fuera del
horario, y ahí lo que hace falta no es la segunda fecha sino **por qué se
corrió**: eso pasó a ser la nota del casillero de «Notificada», con la fecha
cargada adentro —«diligenciada el 29 ago 2026 — Fin de semana: se tiene por
practicada el hábil siguiente»—. No se pierde de vista lo que el usuario
escribió, y no aparece un casillero de más cuando no hay nada que explicar.

**Lo que lo encontró fue medir, no mirar.** La captura admitía media docena de
explicaciones —dos calendarios superpuestos, una animación a medio camino, un
error de composición del panel—. Lo que lo cerró fue leer
`getComputedStyle(grilla).gridTemplateColumns` en los dos meses: `70.5px` contra
`31.14px` en grillas de idéntico ancho. Después, quitando una clase por vez de
las celdas hasta que las columnas volvían a 31,14, quedó una sola: `firma`.

---

## Cómo se leyeron los PDF de la Corte — cerrado el 1/9

Baja de `ESTADO.md`, donde figuraba como «una de las tres cosas que aparecieron
leyendo». La reconstrucción de la serie está hecha y versionada, así que esto ya
no es algo con lo que alguien se vaya a topar: es cómo se hizo.

**Ocho de los 50 PDF de la Corte no tienen capa de texto**: dibujan las letras
como trazos y `pdftotext` devuelve cero. Son las acordadas 36/2020, 1/2021,
7/2021, 12/2021, 21/2021, 4/2022, 12/2022 y la res. 2722/2023. Hubo que
rasterizarlos.

Y las acordadas de 2018 y 2019 llevan **la fecha del acto escrita a mano en el
original**: el valor y la vigencia están impresos y se leen del texto, la fecha
no. Por eso esos valores llevan `fecha_leida_a_mano` y la página los marca con
un § en la columna del acto. Esa marca sigue viva y está explicada en la propia
tabla; lo que baja acá es de dónde salió.

---

## `distancia` estaba al revés, y la tabla de la Corte no existía — cerrado el 1/9

Javier, mirando la pantalla: «hay que rediseñarla a cero, porque está al revés
de la lógica. Eso es porque se diseñó en capas, primero se pensó el haversine,
luego se agregó la ruta y último la Corte. **Es al revés, porque en fidelidad,
está al revés**».

Tenía razón, y el arreglo destapó algo más grande que un problema de orden.

### La regla de la Corte no es «por ruta»

El anexo de la Acordada 5/2010 —la tabla de distancias a los asientos federales—
**no está en Infoleg**: el texto termina en «Tabla de distancias en kilómetros
entre la Capital Federal y los asientos federales del interior del país:» y ahí
se corta. En `argentina.gob.ar` sí está, **como imagen escaneada**. De ahí se
transcribió, fila por fila.

Y leyéndola aparece lo que la pantalla anterior no sabía. El considerando I
recita la Acordada 50/86: «la distancia que se tendrá en cuenta será **la más
larga** que resulte de la comparación entre las medidas por vía férrea y por
ruta terrestre». **No es la ruta: es la más larga de las dos.**

**Formosa es el caso que lo muestra.** 1.112 km por ruta y **2.501 por tren**.
La Corte da **13 días**; calculando por ruta salen 6. Una herramienta que sólo
mira la ruta no puede reproducir la tabla, y por eso la tabla se carga como dato
en vez de recalcularse. La misma pantalla, con la línea recta, daba 5.

### Cómo se verificó una transcripción de una imagen

45 filas por cinco columnas son 225 oportunidades de errar un dígito, y un
dígito de más en una distancia devuelve un plazo plausible y equivocado. **La
propia tabla trae con qué controlarse**: publica las distancias *y* los días, y
los días salen de las distancias por una regla escrita. Aplicar «un día cada 200
km o fracción que no baje de 100» a la más larga de las dos medidas reproduce
**exactamente** la columna del art. 158 en las 45 filas, y el plazo de queja es
esa cifra más los 5 del art. 282 en las 45.

Eso es `npm run verificar-acordada`, 90 comprobaciones. Se lo vio fallar a
propósito transponiendo dos dígitos de Formosa —2501 por 2051—: dice «la tabla
dice 13 día(s) y de 2051 km salen 10».

**Lo que no prueba, y está escrito en el script:** que las distancias sean
ciertas. Eso lo informaron la CNRT y Vialidad y lo publicó la Corte. Prueba que
el archivo dice lo que dice la imagen, que es lo único que un script puede
probar.

### El orden nuevo, y qué contesta en cada caso

Un solo botón, y tres fuentes de más fiel a menos: la tabla, la ruta, la recta.

- **Formosa** → tabla, 13 días, con las dos distancias y por qué manda el tren.
- **Tucumán → Salta** → ruta, 2 días, **avisando que puede quedar corto**: la
  Corte compara con la vía férrea y para ese par no hay dato ferroviario.
- **Puerto Argentino** → «la ampliación es de **al menos** 10 días». No hay ruta.
- **Jerusalén** → al menos 61 días, y sin mapa, diciendo por qué.

**La línea recta pasó a declararse piso y no respuesta.** Nadie viaja en recta,
así que la distancia real nunca es menor: si la recta ya da 10 días, por
cualquier camino van a ser 10 o más. Es lo que la vuelve útil siendo la peor de
las tres.

### Lo que contestaba antes cuando no hay ruta

`Error al consultar OSRM: Error en OSRM`. Y no había ningún error: OSRM devuelve
un **400 con `code: "NoRoute"`**, que es la respuesta correcta a cómo se va en
auto de Buenos Aires a Puerto Argentino. Ahora se distingue de una falla real.

**Malvinas no necesitó ningún caso especial**, que era la pregunta de Javier.
GEOREF —el geocodificador del Estado— devuelve «Puerto Argentino» dentro de
Tierra del Fuego, Antártida e Islas del Atlántico Sur, así que ya es local para
la fuente que se consulta. El segmentado lo dice: «En el país · incluye las
islas del Atlántico Sur».

### El ruido que se fue

Todo señalado por Javier, y todo de la misma familia: la pantalla decía cinco
veces lo que ya decía la pestaña elegida.

- El bloque ámbar de «Advertencia Legal & Método de Cálculo», que era media
  pantalla de documentación y **declaraba que la herramienta fue generada
  mediante Inteligencia Artificial**, como pidiendo disculpas. Eso ya se había
  desterrado del repositorio y sobrevivía sólo acá.
- «(Arg)» en los dos rótulos, «Fuente: API GEOREF» repetido *adentro* de la
  pestaña Argentina, «Buscar localidad argentina…» en el placeholder y
  «(Argentina)» en el botón.
- «(OSRM)» en un botón. El nombre del servicio es documentación, no una pregunta
  que el usuario tenga que contestar; sigue dicho, al lado del resultado que
  produjo.
- Los inputs y los botones al 100 % del ancho. Javier: «SON GIGANTES, ocupan
  toda la pantalla». Vale el criterio de `vencimientos`: cada control ocupa lo
  que mide su contenido y lo único grande es el resultado.
- El resultado abajo del formulario. Era la única de las diez así; ahora va a la
  derecha.

### El aviso de red, y por qué ahora es una línea que se abre

Estaba arriba de todo, en un bloque grande. Javier: «es muy inocuo lo que hace la
app y parece decir que en el resto de las cosas sí hay cosas que salen del
navegador, al contrario de la idea general. De todos modos, que una localidad
salga del navegador no dice nada a nadie, es un dato no sensible (no es un
domicilio) y es imposible de atar a una persona porque ningún otro dato viaja
con ella».

Las dos observaciones son correctas y son distintas. **Se dice entero y sin
recortar nada** —la promesa no se afloja— pero con el peso que tiene: un
`<details>` cerrado. Y ahora hay algo más que decir, que antes no existía:
**cuando el caso lo resuelve la tabla de la Corte no se consulta a nadie.**

### Y una que salió sola

Al escribir el comentario de CSS que advierte sobre el cierre de comentario de
más, **se escribió el cierre de comentario**. La regla `.mapa-tierra` quedó
muerta y el mapa salió negro a fondo pleno. Por eso ese comentario ahora nombra
la secuencia en palabras y no la escribe.

## `regresiva` era la única con la fecha en un campo continuo — cerrado el 1/9

Pedido de Javier: «es la única que tiene input continuo, creo que habría que
hacer como las demás que tienen 3 casilleros, como para unificar el sistema».

Era la última que quedaba del diseño viejo, con su propio parser de formato
`DD/MM/AAAA`. No había ninguna razón escrita para la diferencia. Ahora usa los
tres casilleros, con el mismo salto de foco y el mismo filtro de sólo números.

**Un error dejó de existir:** con tres campos no puede haber un error *de
formato* —no hay barras que poner mal— así que el aviso pasó a ser el de las
otras cuatro, «Esa fecha no existe en el calendario».

**Los casos del banco no se tocaron.** Siguen escribiendo `'30/07/2024'`, que se
lee mejor en la tabla; lo único que cambió es que el driver la reparte en tres
campos. Ningún esperado se movió: 75 de 75.

### Y el banco del tablero tenía un agujero que esto destapó

Los dos casos de `regresiva` fallaban **sólo** en la fila «tablero → regresiva»,
con la página suelta pasando al lado. Se lee como que el tablero rompió algo, y
lo que estaba viejo era el caché: `montar()` hace `f.src = h.archivo` sin `?v=`,
y tiene que seguir así —en producción el tablero carga lo publicado—. La sección
del tablero corría contra la copia cacheada de cada calculadora.

Se arregló del lado del banco, con `fetch(url, { cache: 'reload' })` sobre cada
calculadora antes de abrir el tablero. **Lo grave no es el falso rojo: es que el
mismo mecanismo puede dar un falso verde** contra una calculadora vieja.

## Por qué las series de UMA y UHOM no se copiaron de una compilación

Las dos compilaciones públicas que existen **atribuyen a la Acordada 4/2022 el
valor de $8.183 desde abril de 2022**. La acordada dice $7.439 a partir del 1 de
enero de 2022; $8.183 y $9.001 los fijó la 12/2022. **Enero de 2022 no figura en
ninguna de las dos**, y a una de ellas además le falta abril de 2024 en el UHOM.
Por eso cada valor se leyó del acto que lo fija.

Y de ahí sale el dato que la página tiene y las compilaciones no: de los 63
valores con demora computable, **los 63 salieron después del día desde el que
rigen**, con una mediana de 63 días y un máximo de 141. No se puede armar sin
tener los dos documentos delante.

## Las tres formas en que miente un valor computado con el panel oculto

Los tres casos que fundan la regla corta de `ESTADO.md` —«con el panel del
navegador oculto, un color computado no es evidencia; el token sí»—. Los tres se
pagaron entre el 26 y el 27/8.

1. **Las transiciones CSS no avanzan.** Un elemento con `transition: color` se
   queda con el color del tema anterior después de cambiar `data-tema`, y
   `getComputedStyle` devuelve ese color viejo **por tiempo indefinido**, no por
   un instante. Midiendo contraste dio falsos positivos escandalosos: 2,36 en el
   control segmentado de `vencimientos`, que en realidad da 5,59. Desaparecían
   al medir ese elemento solo.
2. **`getComputedStyle` reporta transiciones que no existen.** Midiendo los
   hitos de `caducidad`, el elemento no tenía ninguna transición declarada,
   `getComputedStyle` igual reportó `transitionProperty: all`, y el color
   devuelto era un valor intermedio que no está escrito en ningún lado:
   `rgb(154, 107, 18)` donde el token dice `#815a0f`. El contraste daba 4,05 y
   parecía reprobar AA. Calculado afuera del navegador, del token contra la
   superficie compuesta, da 5,34 y pasa. **Lo que lo resuelve no es volver a
   medir: es no medir.**
3. **El `ResizeObserver` no dispara.** Midiendo la mediación embebida en el
   tablero, el iframe quedaba en 584 px con 1033 de contenido y parecía que la
   refundación había roto el ajuste de alto. No era eso: `vencimientos` embebida
   daba 642 contra 1092 en la misma corrida, con el mismo desfase, y no se había
   tocado. **La forma de descartarlo es medir en la misma corrida algo que no se
   tocó**, que es más rápido que abrir el panel.

## El banco de navegación del tablero, y el bug que encontró — cerrado el 1/9

`ESTADO.md` lo pedía con nombre desde el 31/8: **el tablero no tenía banco de
pruebas de navegación.** Que embeber no mueve un número ya estaba cubierto —los
21 casos verificados se corren dos veces, sueltos y adentro del tablero, y dan
75 de 75— pero que las pestañas, el enlace directo por `#pestania`, las teclas
1-6 y las flechas siguieran andando no lo probaba nadie: se había probado a mano
el 31/8 y nada más.

Salió `scripts/pruebas-tablero.html`, 37 comprobaciones en ocho grupos. **Y a la
primera corrida dio tres fallas, dos de las cuales eran un bug publicado.**

**Los atajos numéricos no hacían nada, en producción.** `HERRAMIENTAS` se armaba
así:

```js
return acc.concat(r.items.map(function (h) {
    return { id: h.id, rotulo: h.rotulo, archivo: h.archivo, region: r };
}));
```

o sea **copias**. Y `construir()` escribe el número del atajo sobre el item de
la región: `h.atajo = numero`. Entonces `atajoNumerico`, que busca en
`HERRAMIENTAS`, no encontraba nunca ninguno. Apretar 1, 2 o 6 no hacía nada, y
cada pestaña seguía dibujando su badge con el número al lado.

Lo que la copia aportaba era no ensuciar los items con `region`. A cambio, el
estado que escribe `construir()` se perdía en silencio. Se cambió a devolver los
items mismos.

**Es la segunda vez que las teclas 1-6 se rompen, con dos causas distintas.** La
primera —agosto— fue que un evento de teclado no cruza de un iframe al documento
de arriba. Las dos veces la pestaña siguió prometiendo la función que había
perdido. Por eso el banco no comprueba «que alguna tecla haga algo» sino que
**cada tecla abra la que dice su propio badge**: es la promesa concreta que se
rompió las dos veces.

La tercera falla era del banco y no del tablero: `new URL(h, '…/tablero.html')`
con una base relativa tira `Invalid base URL`.

**Lo que el banco cubre, y por qué cada cosa.** Las pestañas —orden, arranque,
que la región de abajo empiece vacía, que sólo la elegida sea alcanzable con el
tabulador—; que las dos regiones sean independientes en los dos sentidos; el
enlace directo, incluida la regresión de que entrar por `#tasa` deje la URL
diciendo `#tasa` y no `#vencimientos`; que navegar use `replaceState` y no llene
el historial; las teclas, incluida la que se dispara **adentro** del marco y la
que se ignora porque el foco está escribiendo; las flechas y que no crucen de
región; el montaje perezoso y el estado vivo —que lo escrito en un campo
sobreviva al ir y volver—; lo que el CSS inyectado le hace al marco —
`.solo-suelta`, el botón de tema, el `min-height`, la sincronización del tema—;
y que las tarjetas de enlace no sean pestañas y ningún destino sea un 404.

**Cada prueba abre su propio tablero**, porque varias dependen del estado de
arranque y ésas no se pueden correr sobre uno que ya se tocó.

## La distancia, dibujada sobre un mapa — cerrado el 1/9

Salió de una pregunta de Javier del 31/8: «¿acá se podría armar algo como un
globo terráqueo o una Argentina que muestre las distancias dibujadas, o
imposible?». Quedó anotado en `IDEAS.md` con las tres cosas que costaban, y las
tres decidieron cómo quedó.

**El contorno tenía que ser un dato.** Un límite político dibujado a ojo es un
error que se ve. Se bajó de la capa `ign:provincia` del WFS del IGN —111 MB
crudos, más de cuatro millones de vértices— y se simplificó con Douglas-Peucker
a 0,02°, que
mueve la costa hasta unos 2 km: sobre un mapa de 620 px donde un píxel son 6 km,
la simplificación es más fina que el dibujo. Quedaron 7.017 vértices y 125 KB,
38 KB gzip. Lo hace `npm run contorno` y **el archivo dice de sí mismo que no
sirve para decidir de qué lado de un límite cae un punto.**

**El sector antártico se resolvió sin decidir nada.** La capa trae Tierra del
Fuego, Antártida e Islas del Atlántico Sur como una jurisdicción que llega a
latitud −90: encuadrar en el país entero obligaba a elegir qué territorio se
dibuja y cuál no. **El encuadre lo mandan los puntos**, así que la pregunta no
existe —y además dos localidades bonaerenses sobre el mapa entero son dos puntos
pegados que no dicen nada—. En el archivo no se recortó nada.

**Y el dibujo no puede contradecir al número**, que era la advertencia más seria
de la idea. El art. 158 se computa por ruta terrestre —CSJN, Fallos 304:1345— y
la ruta es más larga que la recta. Se resolvió dibujando las dos, cada una con
su distancia en la referencia: la recta punteada y en gris, la ruta llena y en
el acento. Ver las dos juntas es exactamente el motivo por el que la Corte se
atiene a la segunda: entre el Congreso y Córdoba, 645,82 km contra 697,71.

**Tres cosas que aparecieron construyéndolo:**

- **`overview=simplified` de OSRM no sirve para esto.** Devuelve unos 25 puntos
  para 700 km, y con eso la ruta sale casi recta: el mapa terminaba diciendo lo
  contrario de lo que existe para decir. Se pide `overview=full` —2.944 puntos
  para ese tramo— y se adelgaza en la página a 400. **Antes de cambiar el
  parámetro se comprobó que no moviera el número:** `false`, `simplified` y
  `full` devuelven la misma distancia hasta el último decimal sobre tres pares
  de localidades. Un parámetro de más en una URL es justo la clase de cambio que
  mueve un resultado sin que nadie lo mire.
- **La primera versión salió un rectángulo negro.** La tierra se pintó de
  `--card` sobre agua `--sunk`, y las tres superficies del sistema son casi el
  mismo color a propósito: 1,1 de contraste en claro y 1,2 en oscuro. Se veían
  los puntos y las líneas flotando sobre nada. Se resolvió con `--fg` a opacidad
  baja en vez de inventar un color plano: sale del sistema y se da vuelta sola
  con el tema. El trazo a 0,5 da 3,37 y 4,78 contra `--sunk`, o sea que pasa el
  3:1 de un objeto gráfico en los dos temas. **La cuenta se hizo afuera del
  navegador**, del token contra la superficie compuesta, porque el panel estaba
  oculto y ahí un color computado no es evidencia.
- **La proyección se verificó geométricamente y no mirando.** Con el panel del
  navegador oculto las capturas no componen, así que en vez de mirar el mapa se
  comprobó que el punto del Congreso cayera **adentro** del polígono de CABA y
  el de Córdoba adentro del de Córdoba, en el espacio ya proyectado, y que el
  mínimo y de Jujuy quedara por encima del de Santa Cruz. Una proyección
  espejada o dada vuelta no pasa ninguna de las dos.

**El caché de OSRM pasó a podarse** —las últimas 25 consultas— porque hasta acá
cada entrada eran dos números y ahora lleva el trazado. `localStorage` tira
cuando se llena, y lo que se rompería es el cálculo, no el dibujo.

**La pestaña internacional quedó sin mapa a propósito**, y lo dice en pantalla:
el contorno que hay es el de la Argentina, y un planisferio es otro trabajo.

## El barrido de texto de las tres que faltaban — cerrado el 1/9

`ESTADO.md` lo pedía para `prorrateo`, `honorarios-mediacion` y
`ejecucion-estado`, con los cuatro criterios de `tasa`. **Encontró una sola
cosa, y conviene que quede escrito que fue una sola**, porque las tres se habían
refundado de cero entre el 27 y el 31/8 y salieron ya escritas en el registro de
la casa.

Lo que quedaba era `Ingrese un UHOM válido.` en `honorarios-mediacion`. El usted
no es un error —es otro registro, y así está dicho en `ESTADO.md`— pero era el
**único** usted entre voseo: la misma pantalla dice `Cargá el monto del asunto` y
la de al lado, `Revisá el día y el mes`. Mezclar los dos adentro del mismo
producto se lee como que lo escribieron dos personas. Y decía poco: «válido» no
dice por qué no lo es ni qué hacer, cuando la única forma de llegar ahí es haber
borrado un campo que se completa solo.

Quedó: «Falta el valor del UHOM, o lo que hay no es un importe. Se carga solo
desde la serie del sitio: si lo borraste, recargá la página.»

**El banco de fijados lo cazó**, que es exactamente para lo que está: reportó
`CAMBIÓ` sobre el texto del mensaje sin que se moviera un solo número, y hubo
que actualizar el caso a mano después de mirarlo.

Los otros tres criterios se comprobaron y ya se cumplían: ninguna de las tres
tiene un solo `<select>`, así que un desplegable de una opción no puede existir;
los rótulos preguntan el caso y no la mecánica —«La causa o título: el hecho, el
contrato, el despido, el daño», y no «fecha de inicio del cómputo»—; y el mapeo
está a la vista —el tramo de la escala, el inciso de la tasa, el régimen—.

## PDF Studio fallaba callada y pasó a llamarse Escribiente — cerrado el 17/8

La herramienta venía heredada de una plantilla de Google AI Studio y nunca se
había leído. Javier la describió como que «por momentos siento que no anda».
Andaba mal siempre; lo que nunca hacía era decirlo.

**Seis bugs, y ninguno rompía nada visible.** Todos devolvían un archivo con
aspecto correcto, que es lo que los hizo durar meses publicados. Los cuatro
primeros se encontraron leyendo y corriendo el código viejo; los dos últimos
aparecieron probando el código nuevo con documentos de prueba, que es la lección
más útil de todas.

1. **Una resolución de una carilla salía con 2 de sus 12 líneas.** El umbral de
   «esto se repite en todas las páginas, es un membrete» era `páginas * 0.4`.
   Para un documento de una página eso da 0,4, y cualquier línea aparece una
   vez, que es más. Se borraban el `Resuelvo`, el monto regulado y la firma.
   Como la mayoría de las resoluciones y los escritos tienen una o dos carillas,
   el caso roto era el caso normal.

2. **`$ 3.255.622,50` se convertía en `$ [DNI],50`.** Un DNI con puntos tiene
   exactamente la misma forma que un monto. El anonimizador destruía la cifra
   de la que depende la resolución entera.

3. **El nombre del archivo se filtraba en el documento anonimizado.** El
   Markdown se armaba como `"# " + archivo.name` y recién después se
   anonimizaba, pero los nombres de archivo del PJN son la carátula entera
   —`PEREZ JUAN c GARCIA MARIA s DAÑOS.pdf`—. La única función que existía para
   no filtrar nombres publicaba los dos apellidos más importantes del
   expediente, en la primera línea.

4. **Pedir las páginas «1, 5, 900» de un documento de 10 devolvía la 1 y la 5,
   sin avisar.** Las páginas fuera de rango se descartaban en silencio.

5. **`Jueza` al final de un renglón se comía el renglón siguiente.** El
   separador entre el tratamiento y el nombre era `\s+`, que incluye el salto
   de línea. Una resolución que cerraba con «Firmado por: LOPEZ MARIA, Jueza» y
   abajo el pie del sistema quedaba como «Jueza [PERSONA] - Lex100».

6. **Un expediente de 5 fojas perdía 30 de sus 35 líneas.** Dos causas sumadas:
   la ventana de «borde» era fija —4 líneas arriba, 6 abajo—, así que en una
   foja de 9 renglones abarcaba la página entera; y la expansión por parecido,
   pensada para agrupar «Pág. 1/10» con «Pág. 2/10», no tenía límite de largo,
   y dos renglones de prosa que difieren en un dígito se parecen más del 60%.

**Lo que no era un bug pero importaba igual.** El `README.md` era el de Google
AI Studio, con su banner y la instrucción de cargar una `GEMINI_API_KEY` para
una aplicación que no hace ninguna llamada a ninguna API. Para una herramienta
cuyo argumento es que el documento no sale de la máquina, eso no es residuo
cosmético: es la documentación diciendo que le manda los expedientes a Google.
Iban en el mismo paquete `metadata.json` con `SERVER_SIDE_GEMINI_API`,
`.env.example`, y un `server.js` con Express que nunca se usó —lo publicado
siempre fue la carpeta estática—.

La landing, además, prometía «comprimir» PDF, función que nunca existió, y no
mencionaba ni la conversión a Markdown ni la anonimización, que son las dos
cosas por las que la herramienta existe.

### Se rehizo entero, y por qué no se parchó

Quedaba poco que preservar. Las partes valiosas eran justo las rotas, el
anonimizador había que reemplazarlo por uno con reglas ya probadas, y el
envoltorio era residuo de una plantilla. Contra
eso pesaba la regla de la casa: **una herramienta publicada tiene que estar bien
o no estar publicada.**

Las decisiones que quedaron, en `ESTADO.md`: la anonimización en dos niveles con
el humano decidiendo los nombres propios, y la promesa de privacidad apoyada en
la CSP y en las librerías versionadas adentro del repositorio.

El nombre lo eligió Javier: **escribiente** es un cargo real del PJN, donde
trabaja, y es literalmente quien pasa documentos a texto. La URL vieja
`/PDF-studio/` queda viva con un aviso.

### Lo que se corrigió al portar las reglas

Traerlas sirvió para encontrarles tres fallas, que valen también para la
versión de la que salieron:

- el orden de las dos reglas de expediente estaba invertido, y la general
  enganchaba la mitad derecha antes de que la específica pudiera tomarlo entero:
  `Expte. 56.868/2017` quedaba como `Expte. 56.[EXPTE]`;
- el patrón de DNI solo se protegía del signo `$`, así que
  `la suma de 1.500.000` se convertía en `[DNI]`;
- el patrón de email se comía el punto final de la oración.

---

## La feria de julio se deducía con una fórmula, y la fórmula estaba mal — cerrado el 17/8

Dos bugs que convivieron años, encontrados el mismo día por la misma razón: se
fue a verificar una afirmación de `ESTADO.md` en vez de creerle.

**Lo que decía `ESTADO.md`:** que `mora.html` tenía su propia copia de la lógica
de feria, pero que era «duplicación de código, no divergencia de datos, así que
no cambia ningún número». Estaba afirmado sin medirlo, y era falso.

### Primer bug: dos reglas distintas, ninguna fundada

`calendario-judicial.js` deducía el inicio de la feria de invierno con el
**penúltimo lunes de julio**; `mora.html`, con el **tercer lunes**. Coinciden
cuando julio tiene cuatro lunes y difieren en **una semana entera** cuando tiene
cinco. Los años en que se había probado —2021, 2022, 2025, 2026— son justo los
que coinciden. Por eso nadie lo vio.

Javier trajo las **21 Acordadas de la CSJN** de 2004 a 2026. Contra ellas:

| regla | acierta |
|---|---|
| penúltimo lunes (`calendario-judicial.js`) | 12 de 21 |
| tercer lunes (`mora.html`) | 16 de 21 |

Ninguna acierta 2005, 2006 ni 2008. Y ninguna fórmula puede producir los dos
años que rompen el molde:

- **2009**, gripe A. La Acordada 8/2009 fijó la feria del 20 al 31 de julio; la
  21/2009 la **rectificó** al 6 al 17; la 23/2009 la amplió del 20 al 24; y la
  27/2009 dispuso el cese, retomándose la actividad el lunes 27. Son **dos
  rangos**, no uno, y el rango que declaraba la Acordada original quedó sin
  efecto.
- **2020**, COVID. La Acordada 21/2020 suspendió la feria **ordinaria** de
  julio, y **eso no significa que julio haya sido hábil**: once Acordadas
  encadenadas declararon feria judicial extraordinaria desde el 16 de marzo
  hasta el 3 de agosto sin interrupción.

Ese último punto lo cometió este mismo trabajo. La primera versión del archivo
afirmaba que «en 2020 no hubo feria: julio corrió entero como hábil», con un
test que lo consagraba. Se leyó «se suspendió la feria» como «hubo actividad».
Lo corrigió Javier al pasar las once Acordadas de la feria extraordinaria, que
no le habían sido pedidas. **De ahí que el archivo lleve rangos y no un rango:**
un año puede tener varios, y el modelo de datos que sólo admite uno obliga a
mentir.

**La feria es un acto normativo, no aritmética.** Pasó a
[`data/feria-judicial.json`](../data/feria-judicial.json), un año por línea con
su Acordada y el enlace al texto. Cambió **171 de 8064** cruces de fecha por
plazo (2,1 %), **todos en 2023 y 2024**, que son exactamente los años en que la
heurística fallaba: la corrección es quirúrgica y verificada.

Sobrevive un invariante que aportó Javier y que las 21 Acordadas confirman:
**12 días, de lunes a viernes**, porque son dos semanas de vacaciones escolares
—la Corte sigue el calendario del Ministerio— menos el último sábado y domingo,
que quedan inhábiles igual por fin de semana. Sirve para detectar un error de
carga; no para deducir el año que falta.

### Segundo bug: una caducidad que operaba un mes antes

Buscando lo anterior apareció otro, en `caducidad.html`. Cuando el vencimiento
caía dentro de la feria, el ajuste hacía:

```js
fullDate.setDate(endJulioFull.getDate() + 1);
```

que mezcla dos fechas: toma el **día del mes** del fin de feria y lo aplica al
**mes** de `fullDate`. Mientras la feria terminó en julio no se notó. Cuando
termina en agosto —2007, 2008, 2014, 2019, 2025— el fin cae 1 o 2, y un
vencimiento del 25 de julio de 2025 se movía al **2 de julio**: 33 días hacia
atrás. Una caducidad que operaba un mes antes de lo que decía la pantalla, en
el año en curso.

### Lo que quedó, que vale más que los dos arreglos

**`npm run verificar-calculos`** ([`scripts/verificar-calculos.mjs`](../scripts/verificar-calculos.mjs)),
647 comprobaciones. Era el primer control automático sobre un resultado de
cálculo del repositorio: hasta ese día `verificar-docs` miraba que las citas de
la ley existieran y nada miraba que las cuentas dieran. Carga el motor con un
`window` y un `fetch` de mentira que leen el disco, sin dependencias.

Y dos reglas nuevas en el motor, que salieron de dos errores de diseño de esta
misma sesión:

- **La feria de un año futuro no se puede tener** —la Corte dicta la Acordada
  en abril o junio de ese mismo año—, así que bloquear la herramienta por falta
  de dato la dejaría muerta todos los años. La primera versión hacía
  exactamente eso: `caducidad.html` abría diciendo «no se puede calcular»
  porque pedía hasta 2027.
- **Tener la feria de un año no alcanza para calcular en ese año.** Al cargar
  las Acordadas desde 2004 quedaron diecisiete años con feria pero sin feriados
  nacionales ni asuetos, o sea con el día evaluado a medias y sin que nada lo
  dijera. De ahí la **ventana de cobertura**, declarada en el archivo de datos y
  no en el código: desde 2021, que es desde cuándo están los tres insumos.

Las dos se resuelven igual: el motor **anota** cada año problemático que un
cálculo llega a tocar, y el que calcula pregunta antes de mostrar. Lo anota el
motor, no el que lo llama, para que no se pueda olvidar en una calculadora.

Completar 2004-2020 sería ir a buscar cada feriado y cada asueto de diecisiete
años. Se decidió que no vale la pena —nadie computa un plazo de 2007— y las
ferias viejas se conservan sólo como evidencia: son las que probaron que la
heurística estaba mal.

### Y `mora.html` dejó de tener lógica propia

Era la última. Tenía las dos divergencias juntas —tercer lunes de julio, y los
feriados nacionales pedidos a `api.argentinadatos.com` en vivo, porque el
arreglo del 13/8 no la había alcanzado—.

**Lo que no se tocó fue la aritmética de mora**, para que si un número se movía
fuera por la feria o por los feriados y no por el cómputo. Su
`nextBusinessDayStrict` más el conteo inclusivo de `countBusinessDaysFrom`
equivalen a un salto de día hábil si la notificación cae hábil y dos si cae
inhábil —la notificación se tiene por hecha el hábil siguiente y el plazo corre
desde el día después—, que es la misma lectura que hace `vencimientos.html` para
la cédula en día inhábil. Se dejó escrito así, sin simplificar, con un comentario
que lo explica.

Buscando cómo migrarla apareció un tercer agujero, del mismo tipo que los dos
anteriores pero por el otro insumo: **el motor auditaba los años sin feria y no
los años sin feriados.** Los feriados se cargan por año pedido, así que un
cómputo que cruzaba a un año no pedido los perdía en silencio y contaba como
hábiles días que no lo eran. Quedó auditado igual.

Y las cinco calculadoras dejaron de tener cada una su propia prosa para explicar
por qué no calcula: la frase vive en `problemaDeDatos()`, en el motor. Cinco
copias del mismo texto en cinco archivos sin build se desincronizan, que es
exactamente lo que ya había pasado con las cuatro cifras de Honorio.

---

## El desplegable de modalidad preguntaba algo que el programa ya sabía — cerrado el 17/8

`vencimientos.html` ofrecía tres opciones, y las dos primeras eran:

- «Por cédula (art. 152) — **Día y hora hábil** (entre las 7 y las 20 hs.)»
- «Por cédula (art. 152) — **Día y hora inhábil** (después de las 20 hs.)»

El rótulo dice «día **y** hora», pero el que lo lee está pensando en la hora:
diligenció la cédula a las 15, elige «hábil», y sigue. **El programa, en
cambio, usaba esa elección también para el día** —que es un dato que ya tiene—,
así que elegir «hábil» un sábado devolvía el vencimiento **un día antes**.

Lo planteó Javier el 17/8, con el ejemplo del día: era lunes 17 de agosto,
feriado por el Paso a la Inmortalidad de San Martín.

### La regla, que resulta ser una sola

Los dos supuestos que el desplegable presentaba como distintos son el mismo: la
cédula **se tiene por practicada el primer día hábil a partir del momento en que
se diligenció**, y el plazo corre desde el hábil siguiente a ese.

| día | hora | practicada |
|---|---|---|
| hábil | en horario | ese mismo día |
| hábil | fuera de horario | el hábil siguiente |
| inhábil | cualquiera | el hábil siguiente |

**Los dos últimos no se acumulan**, y eso lo marcó Javier expresamente: un
sábado a las 23 suma un día, no dos. Por eso la condición es una sola —
`esDiaHabil(fecha) && horaHabil` — y no dos sumandos. Hay dos invariantes que lo
comprueban forzando el casillero a verdadero sobre un sábado y un domingo.

Quedó una sola opción de cédula, y el casillero de la hora **aparece sólo cuando
el día es hábil**, que es cuando la hora decide algo. Si el día es inhábil, en
vez de una pregunta inútil la pantalla explica por qué ese día no cuenta —
citando el motivo: fin de semana, feria con su Acordada, puente turístico—.
Obligar a cargar la hora se descartó por fricción: es un dato que casi siempre
es «en horario».

### Y agarró dos errores en las pruebas del día anterior

Dos casos del banco marcados **«verificados a mano»** empezaron a fallar, y
tenían razón:

- `18/07/2024`, que yo había rotulado «Cédula hábil», **cae dentro de la feria**
  (Ac. 16/2024).
- `10/07/2026`, ídem, es **puente turístico** pegado al 9 de julio.

La aritmética estaba bien derivada desde el inicio del conteo; lo que nunca se
comprobó fue si el día de la notificación era hábil, **porque el desplegable
obligaba a elegirlo y se lo dio por sentado**. Es exactamente la trampa que el
cambio elimina, y alcanzó para meterse en un archivo cuyo propósito declarado es
no dar nada por sentado. Los dos casos quedaron corregidos, con el error escrito
al lado.

---

## Caducidad: el ancla del día se caía en febrero — cerrado el 18/8

Javier trajo un cálculo para que se lo explicaran —último acto 30/12/2025, seis
meses— y salieron tres cosas.

### La regla, con la norma en la mano

El art. 310 CPCCN fija el plazo **en meses**, así que se cuenta por el art. 6
CCyC: **de fecha a fecha**, y «cuando en el mes del vencimiento no hubiera día
equivalente al inicial del cómputo, se entiende que el plazo expira el último día
de ese mes». El art. 311 agrega que el plazo **corre durante los días inhábiles
salvo los que correspondan a las ferias judiciales** —por eso la calculadora no
suma feriados ni fines de semana, sólo ferias—.

De ahí sale la fricción que señaló Javier: **se mezcla un cómputo de meses (art.
310) con uno de días (la feria de julio son doce días corridos)**, y el art. 6
los cuenta distinto.

El cómputo, para el caso: enero no computa, así que los seis meses corren del
30/1 al 30/7/2026 —el tramo de febrero termina el 28 porque no hay 30, pero el
ancla vuelve a ser 30 en marzo—. Después la feria de invierno suspende el
cómputo: al 19/7 quedaban 11 días de plazo, que se cuentan **del 1 al 11 de
agosto**, porque del 20 al 31 de julio el reloj está frenado. **11/08/2026.**

Javier había llegado al mismo lugar y se le escapó un día al final: propuso sumar
**11** días —los que van del 20 al 30 de julio, o sea los de feria que caen dentro
de la ventana nominal— y son **12**. Sumar 11 al 30/7 usa el 31 de julio como si
el reloj hubiera avanzado ese día, y no avanzó: todavía es feria. Su propia
formulación —«los días a contar desde el 1/8»— da 11/8; la suma era la que
fallaba. Correr el vencimiento nominal por la **duración entera** de la feria es
lo mismo: 30/7 + 12 = 11/8.

### El bug: el ancla se arrastraba

La calculadora daba **9/8/2026**. El bucle de meses mutaba una sola fecha, así
que al pasar por febrero el día quedaba clavado en **28** y los cinco tramos
siguientes salían de ahí. Consecuencia:

| último acto | caducidad (antes) | (después) |
|---|---|---|
| 28/12/2025 | 9/8/2026 | 9/8/2026 |
| 29/12/2025 | 9/8/2026 | 10/8/2026 |
| 30/12/2025 | 9/8/2026 | **11/8/2026** |
| 31/12/2025 | 9/8/2026 | 12/8/2026 |

**Cuatro días de diciembre daban la misma caducidad**: impulsar el 31 no compraba
nada respecto de impulsar el 28, y siempre erraba hacia adelante —la caducidad
aparecía antes de lo que corresponde—. De 6.573 cruces de fecha por plazo entre
2021 y 2026 cambiaron **147 (2,2 %)**, con un corrimiento máximo de 3 días.

De paso quedó escrito por qué saltear enero **avanzando un mes** es exacto y no
una aproximación: el tramo que se descarta trae días de diciembre que sí deberían
contar, y el primer tramo que computa trae los días de enero que no deberían.
Son `31 − D` en los dos casos, así que se cancelan.

### La negativa se escribía donde nadie la ve

`caducidad.html` tiene un segundo resultado —«con días inhábiles y feriados»—
dentro de un bloque con `display: none`. La guarda por falta de datos que se
agregó el 17/8 escribía **ahí**: un plazo que alcanzaba 2027 mostraba
`25/7/2027` en pantalla, calculado con **cero días de feria**, mientras la
negativa quedaba en el bloque oculto.

Y moverla no alcanzó: el cálculo ordinario no pasa por `esDiaHabil` —pregunta los
rangos con `obtenerFeriasDelAnio` directo— así que la auditoría del motor nunca
se enteraba. El año faltante se anota ahora en el propio `feriasDe()`.

**El banco de pruebas tenía el mismo error de fondo**: su driver leía
`#resultDateFull`. Un elemento oculto responde igual a `getElementById`, así que
las pruebas venían validando un número que ningún usuario ve.

### Y una cita mal puesta, del día anterior

Al reescribir el pie de `mora.html` se arrastró una etiqueta del código viejo que
llamaba a la feria de enero «art. 257 CPCCN». **El art. 257 es el plazo de diez
días para interponer el recurso extraordinario** —así lo usa la propia `mora`
unas líneas más arriba, y así lo dice `documentacion.html`—. La feria de enero no
la fija el CPCCN. Quedó sin cita hasta confirmar cuál corresponde.

---

## El dominio, cerrado el 5/8

`javiercuneo.com.ar` registrado en NIC —tomó unos días porque el nombre coincide
con el de una persona y pidió DNI y revisión a mano—, DNS en Cloudflare **sin
proxy** (nube gris, para que GitHub pueda emitir el certificado), y configurado
como *custom domain* del repositorio. Enforce HTTPS tildado y andando.

Cosas que conviene tener escritas porque no son obvias:

- **Con dominio propio, un *project page* se sirve en la raíz del dominio.**
  Desapareció el `/herramientas-judiciales/` de la ruta:
  `javiercuneo.com.ar/calculadoras/tasa.html`. Como todos los enlaces internos
  son relativos, no se rompió nada.
- **El CNAME no va.** Se pensó agregarlo y está mal: el sitio se publica con un
  workflow propio de Actions, y para esa fuente la documentación de GitHub dice
  que no se crea ningún `CNAME`, que uno existente se ignora y que no hace
  falta. El dominio vive en la configuración de Pages. Un `CNAME` en `site/`
  sería un archivo que no hace nada y que la próxima sesión tendría que
  averiguar por qué está.
- **Los enlaces viejos no se rompieron**, a diferencia del renombre del 4/8.
  `javiercuneo.github.io/herramientas-judiciales/…` devuelve **301 al dominio
  conservando la ruta** —comprobado—, así que el enlace de LinkedIn siguió
  andando sin tocarlo.
- `www.javiercuneo.com.ar` **no resuelve**: no existe el registro. Si molesta,
  va un CNAME `www` → `javiercuneo.github.io` en Cloudflare, gris también.

El barrido de URL absolutas está hecho: eran 17 acá —15 en `README.md`, el
`og:image` de `index.html` y una en `INFORME_REFACTOR_SHARED_CSS.md`— más la
cadena de *User-Agent* de `distancia.html`. Comprobadas contra el destino nuevo.
En el repositorio de Honorio eran 4 y también están.

---

## Las calculadoras, cerradas el 5/8

Cada una es un HTML con su CSS y su JS adentro, escritas en momentos distintos.
`calculadoras/css/comun.css` define los tokens del sitio —cobalto `#1E45CE`,
neutro frío, `radius 0.375rem`, Archivo para títulos— más una base mínima de
controles, tablas y pie. **Las once lo cargan antes de su propio `<style>`**,
así que lo local sigue ganando y cada archivo conserva su layout.

**Lo que dejó probado [`INFORME_REFACTOR_SHARED_CSS.md`](INFORME_REFACTOR_SHARED_CSS.md)**
(31/7), y no hace falta rediscutir:

- La duplicación del 72 % es de **líneas de propiedad sueltas**, no de reglas.
  Reglas CSS completas idénticas en dos o más archivos: **9 %**.
- Los `<style>` no son copias sino **hermanos con variaciones hechas a mano**.
  Por eso **no existe extracción mecánica segura**: cualquier CSS compartido
  real obliga a normalizar, y normalizar cambia el aspecto de las páginas.
- Su plan de unificar sobre el degradé violeta `#667eea → #764ba2` con
  Montserrat **quedó viejo**: es anterior al rediseño de la landing. Del plan
  sirve todo lo procedimental.

### Las tres lecciones que dejó el trabajo

Se conservan porque las tres se van a repetir:

1. **Para que una tabla no estire la página, el contenedor con `overflow-x` no
   alcanza.** Un ítem de flex no baja de su contenido sin `min-width: 0`, y
   `flex: 0 0 400px` significa «no encogerse nunca». Son tres arreglos:
   envolver en `.tabla-scroll`, `min-width: 0`, y permitir que encoja. Medido en
   `prorrateo`: de 753 px de contenido en 406 de viewport a 406 = 406.
2. **Un control estático no sustituye una medición.** Ocho de las once habían
   pasado un control de «tokens aplicados, sin violeta, sin texto invisible» y
   daba verde. Un barrido de contraste sobre estilos computados encontró **27
   fallas en oscuro y 9 en claro** —hoy cero—, incluidos dos botones principales
   con **contraste 1.00**, blanco sobre blanco, en los dos temas y en
   producción. La causa fue un ciclo de variables CSS; está en las trampas de
   `ESTADO.md`.
3. **Medir con los paneles ocultos subestima.** Las pantallas 2 a 4 de
   `ejecucion-estado` arrancan en `display:none` y la primera pasada no las vio.
   Hay que forzarlas visibles. Ojo: eso mismo **inventa desbordes** —apila
   pantallas que nunca conviven—, así que el ancho se mide en una pasada
   aparte, sin tocar nada.

Y una de fondo: **el resto de las fallas vino de un reemplazo masivo, que no
puede ver el contexto.** `--border` usado como fondo de botón, grises planos que
la conversión no alcanzó, y el violeta `#667eea` que este documento daba por
erradicado, escrito `rgba(102,126,234)` en seis lugares porque la conversión
buscaba hex.

**Emojis:** salieron los 39 de contenido. Los iconos del timeline de
`ejecucion-estado` pasaron a números. **El `✓` del paso completado se queda:** es
una marca tipográfica monocroma, no un emoji.

---

## Los ocho documentos de dominio, cerrados el 7/8

Siete se reescribieron contra el motor; el `07` solo necesitó retoques.
**El detalle de qué decía mal cada uno está en el propio documento**, en su
sección final «Qué decía este documento y no era así». Acá va solo lo que no
cabe en ninguno de los ocho.

De paso salieron dos errores en Honorio, ya arreglados allá: la tarjeta de la
medida cautelar prometía el porcentaje contrario al que el motor aplicaba, y la
transformación se atribuía al art. 29 inc. e en vez de al 37.

### Por qué salieron mal

**La firma del error era clara.** Lo que estaba bien en los ocho era el relato
general —hay una escala, hay reducciones en tres etapas, el procurador sale del
patrocinante—. Lo que estaba mal era **todo lo que exigía mirar algo concreto**:
el número del artículo, el nombre de una clave, el orden de los pasos, si un
mecanismo existe. Y los artículos del `04` no estaban sueltos sino **corridos en
bloque**. Esa firma es inconfundible: **se generaron a partir de una descripción
del sistema, no del sistema.** Una descripción conserva la estructura y pierde
los datos, y por eso sonaban plausibles.

Hubo un segundo mecanismo, el de los inventos «útiles»: el control de mínimos
del `03` no salió de la nada, salió de que un sistema de honorarios con mínimos
legales **debería** verificarlos. Lo mismo el «total general» y el «25 % si la
cautelar se despacha».

**Y el más importante, porque explica por qué los docs salieron peor que el
código que describen:** el motor calcula bien y las validaciones estuvieron en
verde todo el tiempo. El código tiene compilador, tipos y 830 afirmaciones que
corren en cada push. **La prosa no tiene nada.** El mismo proceso produce código
que funciona y prosa confiadamente falsa, porque uno tiene realimentación y la
otra no.

La pasada del 5/8 **funcionó** —por eso el `07` no hubo que reescribirlo— pero
tuvo dos límites: se verificó contra la ley también las afirmaciones sobre el
código, que la ley no puede contestar; y se corrigió la instancia señalada en
vez de la clase, que es lo que dejó cuatro «50 % parcial / 100 % total» vivos en
el `05` con el encabezado declarándolos arreglados. **Una nota de verificación
que no es cierta es peor que ninguna**, porque el que la lee deja de mirar.

### El único error que cambiaba un número

`05_DEPENDENCIAS.md` decía, en cinco lugares y en su diagrama de orden general,
que las reducciones de los arts. 22 y 40 se aplican **sobre el monto de la
escala**. Se aplican sobre la base, antes de la escala. Como la escala es
progresiva, reducir la base puede hacerla caer a otro tramo:

```
demanda desestimada (-30 %, art. 22), base $50.000.000, UMA $102.076

MOTOR   base × 0,7 y después la escala  →  5ª escala: 61,93 UMA = $6.321.798
DOC 05  la escala y después × 0,7       →  6ª escala: 66,62 UMA = $6.800.776
                                            $478.978 de más — 7,6 %
```

**Quien hubiera regulado siguiendo ese documento habría dado casi medio millón
de más en ese caso.** Está anotado acá y no solo allá porque es la clase de cosa
que se puede volver a introducir sin darse cuenta.

### Qué se hizo para que no se repita

1. **La regla de fuentes, en [`AGENTS.md`](../AGENTS.md).** Tres tipos de
   afirmación y tres fuentes distintas: la ley se verifica contra el texto, la
   app contra el código leído, y una interpretación no se verifica —se declara—.
   Más las tres consecuencias: anclar cada afirmación a algo que se pueda abrir
   o correr, no tratar ninguna descripción secundaria como oráculo, y no firmar
   una nota de verificación que no sea cierta.
2. **`npm run verificar-docs`** (`scripts/verificar-docs.mjs`). **No verifica que
   los documentos sean ciertos —eso no se puede automatizar— pero caza la clase
   de error que salió más cara: la cita inventada.** Tres controles: normas
   (`Ley NN.NNN`, `Decreto NNN/AAAA`) contra el texto de la ley más una lista
   blanca con el motivo de cada una; artículos de la 27.423 contra los
   encabezados reales del texto; e identificadores y rutas entre backticks
   contra el código. **Corre en CI antes de armar el sitio**, así que una cita
   inventada no llega a producción.

**Tres cosas del script que costaron y conviene no volver a descubrir:**

- **Se auto-validaba.** `scripts/` está en el corpus, así que sus propios
  comentarios —que citan `escala_art21` como ejemplo de lo que hay que cazar—
  hacían que el control pasara. Pasó de verdad, en la primera corrida de la
  prueba de regresión. Ahora se excluye a sí mismo.
- **La sección «Qué decía este documento y no era así» cita normas falsas a
  propósito.** El `04` nombra un decreto inexistente justamente para decir que
  no existe. Esa sección se saltea, detectada por el encabezado.
- **`honorio/` no está en CI.** Los identificadores del motor salen como no
  verificables y no hacen fallar: un rojo que depende de si alguien clonó algo
  no sirve. Lo que sí falla en CI son las normas y los artículos, que es la
  clase de error más cara. `--sin-honorio` simula localmente lo que ve CI.

**Lo que no caza, para no confiarse:** artículos que existen pero se citan para
lo que no son —el `art. 51 inc. 8` del `05` pasa, porque el art. 51 existe—, y
cualquier afirmación de fondo. Eso sigue siendo leer el motor.

### Reparto entre documentos, para que no se dupliquen

El `01` va proceso por proceso: qué pregunta cada uno y qué hace con la
respuesta. El `02` va por lo que los ocho tienen en común: el recorrido y el
orden del cálculo. El `04` va por las cosas —cada entidad jurídica contra su
tipo real—. El `05` dice qué depende de cada pieza compartida y qué validación
corre qué. El `06` es la tabla comparativa. Cada uno remite al otro en vez de
repetirlo.

Dos aclaraciones que hubo que agregarles y conviene no borrar:

- **`08_DEUDA_TECNICA_FUNCIONAL.md` no es una lista de trabajo pendiente**: eso
  es [`PLAN_COBERTURA_LEY.md`](PLAN_COBERTURA_LEY.md). Y describe el motor
  clásico: donde dice `calculations.js` o `core.js` se habla de
  `asistente-honorarios-clasico/`. Está dicho en el encabezado en vez de
  reescribir 28 entradas que como catálogo de decisiones siguen valiendo.
- **La sección «Lo que la ley dice y el motor no hace» del `02` es lo primero
  que envejece.** Quedó vieja el mismo día en que se completó el plan que salió
  de ella. Ahora cada entrada dice qué se hizo, o por qué se decidió no hacerlo.

---

## Lo demás que se hizo, en orden

### `quien-soy.html` — 12/8

Página nueva, enlazada desde la sección «Autor» del index y desde los dos
colofones, y agregada a la allowlist de `pages.yml`. Sin ella en esa lista la
página existe en el repositorio y no en producción, que es lo que ya pasó con
PDF-studio.

**Por qué una página y no más texto en el index.** La sección `#autor` sostiene
la tesis del sitio —el código lo escribe un modelo, el criterio no— en tres
párrafos, y ese largo es el correcto ahí: quien entra a la landing viene a
buscar una calculadora. Pero esa tesis es también lo único que distingue este
trabajo de cualquier otro repositorio de calculadoras, y en tres párrafos no
entra lo que la sostiene: qué parte del trabajo es propia y cuál no, y cómo se
decide cuando la ley admite más de una lectura. El index quedó como estaba y
ahora enlaza a la versión larga.

**Lo que la página afirma de más que el index**, y que es el motivo de que
exista: que no se escribió el código, que no se eligió la arquitectura, y que
las decisiones técnicas se adoptaron preguntando. Declarado así, «hecho con IA»
deja de ser una frase que tapa y pasa a delimitar dónde está el aporte:
elegir el problema, decidir los puntos ambiguos, dejarlos escritos y darse
cuenta cuando el número está mal.

**No repite ninguna cifra.** Ni versiones, ni cantidad de validaciones, ni
cruces de la entrevista. Todas esas viven en el index y en Honorio, y una cifra
duplicada en una página sin build es una cifra que se desincroniza. Donde haría
falta un número, hay un enlace.

**Verificación.** Contraste sobre estilos computados, en los dos temas, con las
transiciones desactivadas —sin eso `getComputedStyle` devuelve el color a mitad
de la animación y da números inventados: la primera medición dio 1,15 en un
elemento que está en 18,15—. Todo pasa AA salvo `--faint`, que es del sistema
visual y no de esta página. A 390 px no hay scroll horizontal ni elementos
desbordados, y la línea de tiempo del recorrido colapsa a una columna.

**Un bug propio, encontrado midiendo.** `.btn-solid` había quedado con
`color: #fff`, que en tema oscuro es blanco sobre el acento aclarado: **2,68:1**,
reprueba AA. `index.html` ya lo tenía resuelto con `color: var(--bg)`, que se
invierte solo con el tema. Copiada esa solución, queda en 6,28 claro y 7,15
oscuro. Es exactamente la clase de error que un control «tokens aplicados, sin
colores planos» deja pasar.

### La landing decía mal lo que hace — 6/8

«Barre los **25.600 recorridos posibles** de la entrevista» era una cifra
correcta describiendo otra cosa: 25.600 no son recorridos sino **cruces**, cada
recorrido contra cada otro, que es lo que barre `retroceso.validation.ts`. Eso
es el **flujo hacia atrás**, el bug del 3/8: volver atrás y cambiar el tipo de
proceso dejaba pegada una respuesta que el recorrido nuevo ya no pregunta, y el
motor clásico tenía el mismo agujero —por eso `AGENTS.md` dice que no sirve de
oráculo—. Era peor que un error de redondeo: una cifra más impresionante que la real,
describiendo algo distinto, en la sección que sostiene la credibilidad del
sitio. Ante alguien del palo, no cerraba. Se corrigió también en `README.md`.
(Los números de hoy son otros: están en `ESTADO.md`.)

**Y «casos conocidos» daba a entender una autoridad externa que no hay.** Cada
caso es una entrada con su resultado esperado, escrito a mano en el archivo de
validación: no hay jurisprudencia ni tabla oficial detrás. **Lo que garantizan
las validaciones es consistencia, no corrección** —que el número de hoy sea el
de ayer salvo que alguien haya decidido cambiarlo y lo haya escrito—. Un usuario
puede decir «esto está mal» y tener razón, y la app no lo contradice. Ahora la
landing lo dice.

De paso se sacó el registro de la columna: «suites, una por concern», «no conoce
React ni el DOM», «función pura», «refactor». Si el que entra es abogado, esa
columna no le decía nada.

### La guía de uso — 5/8

`documentacion.html` estaba enlazada desde el hero y contradecía a la landing.
Reescrita entera sobre el sistema visual del sitio. **Lo que se conservó, porque
era lo que valía:** todo el contenido normativo y sobre todo las advertencias de
alcance, con **un bloque explícito de qué NO hace** por herramienta, que es lo
que decide si el resultado se puede usar.

De ahí sale una lección que se paga cara: **al documentar una herramienta, leer
lo que hace, no lo que su nombre sugiere.** La advertencia sobre la ampliación
por distancia se escribió mirando una sola de las dos pestañas de
`distancia.html`, y decía que mide en línea recta. Lo corrigió Javier el 5/8: el
segundo modo mide **por ruta** (OSRM, sobre la red de OpenStreetMap), que es el
que se acerca al criterio de la Corte. La guía ahora explica cuál usar —la de
ruta manda, la lineal sirve de piso— y que donde la Acordada 5/2010 fija la
distancia al asiento federal, manda la Acordada.

El 7/8 se le agregaron al bloque «qué no hace» de Honorio las dos previsiones
que el plan de cobertura decidió declarar y no implementar: el 4 % del art. 42
—que se calcula sobre los fondos disponibles en favor de terceros, un dato que
la entrevista no tiene— y el porcentaje mayor por labores altamente complejas
del art. 21, que es una facultad del juez por auto fundado. **Las dos van con el
motivo**, porque «no lo hace» sin el porqué se lee como una carencia y son
decisiones.

Ya no tiene emojis, así que la excepción que `AGENTS.md` anotaba está saldada.

---

## Decisiones cerradas, y por qué

Las que siguen gobernando trabajo del día a día están en `ESTADO.md`. Éstas ya
no se discuten, pero conviene saber contra qué se estaría discutiendo.

### El nombre y el dominio

`Herramientas-Judiciales-IA` pasó a **`herramientas-judiciales`** el 4/8. Lo que
se buscaba era sacar el `-IA`: en 2023 era una señal, hoy es el default y ubica
al autor del lado del que usa la herramienta de moda, no del que tiene el
dominio.

Ese renombre **rompió la URL vieja de Pages sin redirección** —404 duro,
verificado— y hubo que cambiar a mano cualquier enlace compartido antes, incluido
el de LinkedIn. GitHub redirige las URL del repositorio, pero no las del sitio.
**Ese fue el argumento más fuerte para pasar a dominio propio.**

`honorio.ar` es un dominio de *producto*, no el paraguas: si Javier construye
algo que no tenga que ver con honorarios, «Honorio» no lo contiene. Se evaluó un
nombre inventado para el conjunto (**`elsecretario`** era el candidato) y se
descartó por lo mismo: cualquier marca nueva vuelve a apretar el día que el
trabajo se corra de tema. **La decisión fue el nombre propio.** Una persona no
caduca ni cambia de rubro, y deja que cada producto tenga su nombre debajo.

### `calculadoras/honorarios.html` se dio de baja — 7/8

El 4/8 se la había dejado publicada, con la tarjeta «retirada» en el grupo
«Otras» de la landing. **El `ESTADO.md` de entonces decía que se había sacado de
la landing y era falso**: seguía ahí, con una descripción que la ofrecía como
estimación rápida.

El 7/8 se le encontró el error del grupo 4 —la reducción del art. 22 sobre la
escala en vez de sobre la base— y **se decidió darla de baja en vez de
corregirla**. El motivo no es el costo del arreglo, que igual no era una línea:
es que Honorio ya la reemplaza y el
[`PLAN_CALCULO_DIRECTO.md`](PLAN_CALCULO_DIRECTO.md) la reemplaza mejor. Una
herramienta superada dos veces no se parchea.

**Cómo quedó, y por qué así:**

- **El archivo sigue en el repositorio**, sin tocar. Es historia: fue el primer
  intento de regulador, antes del clásico y de Honorio.
- **La URL sigue viva.** `pages.yml` publica `redirects/honorarios-retirada/`
  encima de `site/calculadoras/honorarios.html`, con el mismo patrón que
  `redirects/honorio/`. Ningún enlace viejo muere en un 404 **y ninguno entrega
  un número equivocado.** Las dos cosas juntas, que era el punto.
- **La tarjeta de la landing lo dice**, con el motivo. El aviso también.

**El criterio, porque se va a repetir:** una herramienta publicada tiene que
estar bien o no estar publicada. Que esté «retirada» en la landing no la saca de
internet, y el que llega por un enlace no ve la tarjeta.

### Una interpretación se funda en jurisprudencia — 8/8

La regla de fuentes de [`AGENTS.md`](../AGENTS.md) decía que una interpretación
«se declara como tal, con el razonamiento». **Ahora dice que se funda en un fallo
o no se afirma.** El motivo, en una línea: un razonamiento propio deja a la app
diciendo «esto lo decidimos nosotros», y al que lee sólo le queda creer o no
creer; **un fallo cambia quién lo sostiene.**

No es un invento de esa sesión: es lo que `honorio/lib/legal/jurisprudencia.ts`
ya hacía para el 2 %-20 % de los incidentes —criterio que sale de una ley
derogada porque el art. 47 quedó observado— y que funcionó. La regla nueva lo
generaliza y reusa el mecanismo: un `Criterio` con su frase y sus `Fallo[]`,
consumido por la sección que corresponda.

**Y una advertencia que quedó escrita en `AGENTS.md` porque vale más que la
regla:** una cita de jurisprudencia inventada es el peor error posible acá. Es
indistinguible de una buena, `verificar-docs` **no la caza** —controla normas y
artículos, no fallos— y termina adentro de un documento que produce resoluciones
judiciales. Un fallo se transcribe de la sentencia leída o no se escribe.

### El material de `docs/modelos/` deja de versionarse — 8/8

`.gitignore` cubre `docs/modelos/jurisprudencia/` y todo `.pdf` o `.docx`
bajo `docs/modelos/`.



índice con `git rm --cached`: **siguen en disco y dejaron de estar en el árbol**.






alguna vez cambia el criterio, la herramienta es `git filter-repo` y conviene
sacar un bundle de respaldo antes.

**Las plantillas limpias en `.md` sí se versionan a propósito:** son la materia
prima de [`PLAN_REGULACION_EN_PROSA.md`](PLAN_REGULACION_EN_PROSA.md) y están sin
datos de nadie.

---

## Los planes, y el orden en que se hicieron

Cada uno tiene su documento **para que se puedan analizar en sesiones
distintas**. El orden se acordó el 7/8 y se cumplió tal cual:

1. ~~**Los bugs.**~~ **Hechos el 7/8.** Quedó solo el código muerto de
   `honorio/public/legacy/core.js`, que es del otro repositorio.
2. ~~**Cálculo directo.**~~ **Hecho el 7/8.** Y **el argumento con que se lo puso
   segundo se confirmó**: fijó la matriz de roles × etapas, creó el segundo
   consumidor de las funciones puras con su validación cruzada de 171
   afirmaciones, y de yapa terminó siendo la puerta de entrada propia que
   mediación necesitaba y que no hubo que construir.
3. ~~**Mediación.**~~ **Hecha el 8/8**, y el motivo de ponerla antes que prosa
   también se confirmó: agregó una sección al resultado y una fila al cálculo
   directo. Al revés habría que rehacer plantillas para meter al mediador.
4. ~~**Regulación en prosa.**~~ **Hecha el 10/8**, la más riesgosa y la que más
   se benefició de que el resto estuviera firme.

**La alternativa que se evaluó:** subir la prosa al segundo lugar, porque cambia
más el uso diario que una calculadora más. Se defiende; el costo era rehacer las
plantillas cuando entrara el mediador. Se eligió el orden de arriba y salió bien,
pero la decisión era de valor y no técnica.

### [`PLAN_MEDIACION.md`](PLAN_MEDIACION.md) — 7/8, implementado el 8/8, cerrado el 10/8

Motor, UHOM versionado, validación 16, las dos pantallas y el documento de
dominio [`09_MEDIACION.md`](domain/09_MEDIACION.md), que es el noveno y el único
que no documenta la Ley 27.423. **`calculadoras/honorarios-mediacion.html` se
deja viva por ahora**, decisión de Javier: da un número correcto, así que no es
el caso de `honorarios.html`. Queda barato corregirle el rótulo del tope. Lo que
el plan resolvió y sigue valiendo:

- **La escala está verificada** contra el Decreto 2536/2015 y contra la tabla
  oficial del Ministerio. Los siete tramos de la calculadora son correctos. El
  Decreto 696/2025 sustituyó el Anexo I entero pero **no tocó el Anexo III**:
  cambiaron los artículos —el régimen pasó del 28 al 31— y no la escala.
- **Va como bloque del resultado, al lado de auxiliares**, no como noveno
  proceso. El parentesco es real: los dos salen de la base y no del honorario
  del abogado.
- **La base es una sola, la del expediente**, con las reducciones de los
  arts. 22 y 40 ya aplicadas. Es una interpretación y va fundada: la doctrina
  de que «el juicio es una unidad jurídica… no pueden existir dos bases
  regulatorias diferentes, según sea letrado o auxiliar de la justicia» sale
  del **plenario `Murguía` (CNCiv. en pleno, 2/10/2001)**. **Y hay un fallo que
  resuelve el planteo exacto** —CNCiv., Sala K, expte. 2896/2021, 22/6/2026—:
  el apelante era un perito que sostenía que el −30 % del art. 22 no lo
  alcanzaba por ser auxiliar de la Justicia y no letrado, y la Sala lo rechazó
  porque «la ley arancelaria no contempla excepción ni distinción alguna» según
  el profesional. No es analogía.
- **No se agrega ninguna regla ni ninguna pregunta por el mediador**: ni
  adicionales por audiencia, ni descuento del provisional, ni desistimiento, ni
  reconvención. Todo el cálculo es una función pura de siete ramas sobre una
  cifra que Honorio ya tiene.
- **La numeración del Anexo III cerró el 10/8**, y la destrabó una observación
  de Javier sobre los modelos del juzgado, que citan el «Anexo I del 2536». Esa
  cita, que parecía una cuarta variante, **es exacta y explica las otras
  tres**: el art. 5° del 2536 sustituye el Anexo III «por el que como ANEXO I
  forma parte integrante del presente», así que son el mismo texto nombrado por
  su origen o por su destino. Ese texto numera la escala en su **art. 2°**,
  igual que las seis citas del 696/2025; el «4° y 5°» es una remisión que el
  propio decreto dejó vieja. **El dígito que quedaba —si el 2536 era de 2011 o
  de 2015— cerró el 18/8: es de 2015**, y lo dice el texto consolidado del
  1467/2011 que ya estaba en `docs/mediacion/`, con la nota «(Anexo sustituido
  por art. 5° del Decreto N° 2536/2015 B.O. 30/11/2015)» en la cabeza de su
  Anexo III. El 2011 había salido del nombre del archivo, `decreto 2536-11.md`,
  que se llama así por el decreto que modifica.

Y un dato del Paso 2 que se confirmó: **el UHOM se mueve todos los meses** —es
la UR-SINEP × 12, redondeada a la decena superior—, así que el `SALTO_MAXIMO`
del 60 % calibrado para la UMA no sirve; el módulo usa 15 % y un control de
forma —termina siempre en cero— que la UMA no puede tener.

### [`PLAN_CALCULO_DIRECTO.md`](PLAN_CALCULO_DIRECTO.md) — 7/8, hecho entero el mismo día

Motor, validación 15 con 171 afirmaciones y pantalla; el 8/8 se le sumó la fila
del mediador. La regla que lo gobierna y que conviene no deshacer: **«sin
reducciones» no es un caso, es la ausencia de caso**, así que compone las
funciones puras y **no arma un `WizardState` con respuestas por defecto** —cada
respuesta por defecto es una afirmación jurídica que nadie hizo—. **Cerrado**,
salvo una pregunta de producto anotada y no decidida: si el control de fracción
de etapa del dashboard debería ofrecer las dos cosas.

### [`PLAN_REGULACION_EN_PROSA.md`](PLAN_REGULACION_EN_PROSA.md) — 7/8, hecho el 10/8

Que la app devuelva el texto de la regulación para copiar y pegar. Era la feature
más riesgosa del proyecto: **produce prosa con forma de documento firmado, y
ninguna de las validaciones anteriores miraba prosa.** Lo que se resolvió:

- **El punto dentro de la banda lo elige el usuario, con un control**, rol por
  rol. Era la decisión que bloqueaba todo lo demás. Se descartó el valor por
  defecto en el medio de la banda: es una decisión jurisdiccional disfrazada de
  conveniencia. **El control arranca sin elegir**, por el mismo argumento.
- **Los ocho procesos tienen modelo**, así que la decisión de cobertura no hubo
  que tomarla. Los dos últimos llegaron ese día: el de sucesión es una plantilla
  de trabajo, y el de homologación de convenio de desocupación **no existía y se
  escribió desde el art. 40** —leído contra el motor: el 50 % y la reducción del
  20 % coinciden—. Los trece están en
  [`docs/modelos/plantillas limpias/`](modelos/); los de mediación, en
  [`docs/mediacion/`](mediacion/).
- **La estructura no es la que el plan suponía.** No hay encabezado —los trece
  empiezan en «AUTOS Y VISTOS»— así que lo que Honorio no tiene no está al
  principio sino **en el medio**, en la sección que narra quién intervino y qué
  hizo.
- **Y eso no va como hueco: no se escribe.** Decisión de Javier, y cambia la
  categoría entera del plan. **La prosa es minimalista, dice únicamente lo que
  Honorio atrapa**, y el usuario agrega el resto según su caso. El motivo es
  qué clase de herramienta es Honorio: **supone que el expediente está en
  condiciones de regularse**, porque salvo los provisorios y la sucesión con
  renuncia solo se regula cuando el procedimiento terminó —de ahí que el wizard
  tenga una sección dedicada al modo de terminación y pida la base como un dato
  que existe—. Un hueco donde va la valuación de los bienes de una sucesión
  afirmaría que ese párrafo es parte de lo que Honorio produce, y no lo es.
- **Notificación, elevación y apertura de cuenta quedan afuera.** Son texto
  fijo y por eso eran lo más barato de generar, pero **son prácticas del
  juzgado y no de la ley.** Decisión de Javier.
- **El generador está hecho y sus controles entraron con él**, no después: las
  dieciséis validaciones anteriores comparan números y **ninguna miraba prosa**,
  así que la prosa sin realimentación era el problema que esta feature creaba.
  Salieron tres controles y no dos —el tercero es que un punto fuera de la
  banda no se redacta— y **el de números encontró un error de sí mismo en la
  primera corrida**: `Decreto 2536` salía como importe inventado. Ahora lee solo
  números con dos decimales, que es como se escribe una cifra y como nunca se
  escribe un identificador. **Y una tercera cosa que se perdió y hoy tiene
  control propio: las tildes.** Los comentarios de `lib/legal/` se escriben sin
  ellas —convención del código— y la primera versión arrastró la costumbre a
  las cadenas de salida. Una resolución sin acentos no se puede pegar en un
  expediente.
- **Una vuelta de tuerca que no estaba en el plan:** la sección **pide los
  profesionales**, porque es lo único que el motor no sabe y no debería saber
  —la banda del art. 21 es la misma haya un letrado o cuatro, pero un texto de
  regulación lleva una línea por cada uno—. Idea de Javier.

---

## Bugs cerrados

### La caducidad podía vencer adentro de la feria de enero — cerrado el 26/8

El art. 311 CPCCN desoído, y por eso vale la pena entender cómo: **no estaba mal
ninguna de las dos reglas, estaba mal que se aplicaran en momentos distintos del
cálculo.**

- **enero** se saltea corriendo un mes en la etapa de los tramos, o sea **sobre
  el vencimiento nominal**;
- **la feria de invierno** se descuenta sumando días **al final**, cuando los
  tramos ya quedaron fijos.

Con eso, un tramo que termina en diciembre no pasa por el salteo —diciembre no
es enero— y después los días de feria de invierno lo empujan adentro de enero,
que no computa, sin que quede nadie mirando.

**El caso, de Javier:** último acto impulsor el **21/6/2025**, seis meses. Los
tramos van 21/7, 21/8, 21/9, 21/10, 21/11 y 21/12/2025; los doce días de la
feria de 2025 —21/7 al 1/8, Acordada 9/2025— lo corren al **2/1/2026**. La
pantalla lo afirmaba sin un solo aviso.

**Y el mismo inicio a cinco meses y a seis daba cosas distintas**, que es lo que
lo delató como bug y no como criterio: a seis meses el tramo aterriza en enero y
el salteo lo ve; a cinco aterriza en diciembre y no lo ve nadie.

**Cuánto era:** 67 de 10.956 cruces de fecha por plazo entre 2021 y 2025, el
0,61 %, y de dos formas nada más —seis meses desde fines de junio, o cinco desde
fines de julio—: los casos en que el tramo nominal cae en la segunda quincena de
diciembre.

Es el hermano del bug que el punto fijo cerró el 5/8/2026 para la feria de
invierno, por el otro lado: ahí el vencimiento nominal caía **dentro** de la
feria de julio y la iteración lo empujó afuera; acá lo que empujaba era la propia
feria de julio.

#### Por qué se corre un mes y no al primer día de febrero

Fue la parte que hubo que discutir, y la diferencia es de un día.

El plazo del ejemplo necesita **183 días corridos** —del 21/6 al 21/12, de fecha
a fecha, art. 6 CCyC—. Del 22/6 al 31/12/2025 hay 193 días de calendario y doce
fueron feria: **corrieron 181. Le faltaban dos.** Enero aporta cero, así que esos
dos corren el 1 y el 2 de febrero y el plazo vence el **2/2/2026**.

Vencerlo el 1 de febrero sería darlo por cumplido **sin haber servido los dos
días que se saltearon**, y le daría al plazo un día menos del que le
corresponde. Ese número sale de «salir de la feria» y no de contar —y de hecho
el 1/2/2026 es domingo, que es la pista—.

**Y no es una aproximación:** corriendo el plazo día por día desde el 21/6/2025 y
salteando todo día de feria —los doce de julio y los treinta y uno de enero— se
cae exactamente en el 2/2/2026. Sobre los 67 casos afectados el corrimiento
coincide con ese conteo literal **en 56**; los once que difieren, por un día, son
exactamente aquellos cuyo acto impulsor cae **adentro** de la feria de invierno,
y ahí lo que decide es otra pregunta —si el propio día de inicio cuenta como día
de feria—, que sigue abierta y no la contesta este arreglo.

#### El arreglo

Después del punto fijo, si el vencimiento quedó en enero se lo corre un mes
**respetando el ancla del día**, que es el **mismo** corrimiento que ya hacía el
salteo de los tramos. Se eligió ése y no uno nuevo por el motivo obvio: aplicar
dos correcciones distintas a la misma suspensión es lo que produjo el bug.

**Alcance medido antes de aplicarlo**, comparando el motor del commit anterior
contra el nuevo sobre los 10.956 cruces: **cambian 67, y los 67 son exactamente
los que antes caían en enero.** Ni uno de más. Y después del arreglo **ningún
vencimiento de caducidad cae en feria**, ni de invierno ni de enero.

**La pantalla lo dice**, porque explica un mes entero de diferencia: «El
vencimiento caía el 2/1/2026, adentro de la feria de enero 2026, y se corrió al
2/2/2026: el plazo no corre durante la feria (art. 311 CPCCN)». Sin esa línea el
usuario ve una fecha de febrero abajo de un plazo que termina en diciembre y no
tiene con qué reconstruirla.

#### Lo que dejó anotado

**El cómputo oculto de `caducidad.html` tiene su propia regla para salir de la
feria de enero** —`setMonth(+1, 1)`, el primer día del mes siguiente— distinta de
la que usa la cuenta visible. Dos reglas para la misma suspensión, y una de ellas
adentro de un `display:none`: es la misma forma del bug que se acaba de cerrar.
Está en `ESTADO.md`, junto con la decisión pendiente de si ese cómputo se muestra
o se saca.

### La regresiva contaba hacia atrás fuera de la ventana de cobertura — cerrado el 26/8

Lo encontró el barrido de invariantes que entró con la extracción de
`regresiva` a `plazos.js`, y es de antes de ella: la migración salió idéntica en
los 864 casos de su matriz.

**Qué pasaba.** `regresiva` leía la guarda de datos faltantes **sobre la fecha
objetivo y antes de empezar a contar**. El cómputo retrocede después, y
retrocediendo se salía de la ventana de cobertura sin que nada lo volviera a
mirar.

**El caso, verificado en pantalla antes de tocarlo:** objetivo **4/2/2021** con
**40 días de antelación** contestaba **10/11/2020**, sin un solo aviso. La
cobertura arranca en 2021: de 2020 no están cargados ni los feriados nacionales
ni los asuetos, así que días que fueron inhábiles se contaron como hábiles y el
plazo arrancaba más tarde de lo que arranca. Y 2020 es el peor año posible para
eso —encadenó once ferias extraordinarias entre marzo y agosto—.

**Por qué le pasaba a ésta y no a las otras, que es lo que vale la pena
guardar.** En `vencimientos` y en `mora` el cómputo **avanza** y la auditoría se
lee **al final**, así que anota todo lo que el cálculo llegó a tocar. Acá se leía
al principio, y **hacia atrás el cálculo toca años que en ese momento todavía no
existían para nadie**. La guarda no estaba mal escrita: estaba escrita para un
cómputo que va en la otra dirección.

**El arreglo son ocho líneas**: volver a leer `problemaDeDatos()` después del
bucle y, si dice algo, devolver el motivo y **ninguna fecha**. El motor ya venía
anotando los años —`obtenerMotivoInhabil` pasa por `esFeriaJudicial`, que audita—
así que no hubo que agregar ni una consulta: sólo mirarla.

Lo decidió Javier el mismo día, y con el criterio de las otras: *«si va fuera de
la ventana de cobertura debería avisar como cuando vas a 2027 y cae en julio que
te da error»*. Ahora contesta con la misma frase que ese caso, que es la única
que hay —vive en `problemaDeDatos()` y no se reescribe por pantalla—.

**El alcance, medido antes de aplicarlo:** sobre 10.955 conteos de 2021 a 2026,
**cambian 121, y los 121 son exactamente los que antes devolvían una fecha
anterior a 2021.** Ninguno de más. La guarda quedó fina y no gruesa: un objetivo
de marzo de 2021 con quince días no llega a 2020 y calcula igual, con la misma
fecha que antes.

**Y una cosa del arnés que conviene no repetir.** Comparando en el navegador, la
matriz de 864 casos marcó **22 diferencias** y sólo **6** eran reales: las otras
16 son casos cuyo objetivo es inhábil, que no escriben nada y **se quedan con el
resultado del caso anterior en el DOM**. Al cambiar los 6, cambió lo que las 16
tenían pegado atrás. Lo dejó a la vista comparar el motor contra sí mismo en
Node —el commit anterior contra el árbol de trabajo—, donde no hay DOM que
arrastre nada: **6 diferencias en la matriz, 121 en el barrido grande, todas del
mismo tipo.** Cuando un arnés lee una pantalla, una diferencia puede ser de la
pantalla y no del cálculo.

### Los diez documentos de dominio no tenían interruptor de tema — cerrado el 26/8

Abierto y cerrado el mismo día. Lo encontró `verificar-contraste`, que se
escribió esa mañana y exige que los tokens oscuros estén escritos dos veces
—el `@media` y el `[data-tema="oscuro"]`—: la plantilla de
`scripts/build-docs.mjs` tenía uno solo, y entró al control como excepción con
nombre y motivo para no mezclar dos cosas en el mismo commit.

**Qué pasaba.** Las diez páginas de `docs/domain/` no cargaban `assets/tema.js`,
no tenían el botón, y su único bloque oscuro era el del `@media`. O sea que
**seguían al sistema operativo y nada más**: quien había elegido claro en las
otras dieciséis páginas del sitio llegaba a `/docs/` y lo veía en oscuro igual,
sin nada en pantalla que le permitiera cambiarlo. Es el único lugar donde la
elección del usuario se perdía al navegar dentro del mismo sitio.

**Por qué faltaba ahí y no en otro lado, que es lo que vale la pena guardar:**
es la única de las páginas publicadas que **la genera un script**. Las demás se
editaron a mano el 5/8, cuando entró el interruptor, y ésta no se abrió porque
lo que se abre para cambiarla no es la página sino la plantilla. Es la misma
clase de olvido que dejó a esa plantilla con los valores de `--faint`
anteriores al 5/8 hasta que el control la midió: **lo que se genera no se mira.**

**El arreglo**, en la plantilla y no en las páginas: el `@media` pasó a
`:root:not([data-tema="claro"])`, se agregó el bloque `:root[data-tema="oscuro"]`
con los mismos valores, entraron las reglas de `.tema-boton` —las mismas de las
otras páginas, con su `@media print`— y el `<script src="../assets/tema.js">` en
el `<head>` y **sin `defer`**, que es lo que evita el destello del tema
equivocado. El botón no va en el marcado: lo inyecta `tema.js`.

**Y con eso se sacó la excepción de `verificar-contraste`**, que es la mitad que
importa: la regla de los dos bloques oscuros ahora corre sobre los seis archivos
sin ninguno declarado aparte. Probado al revés —rompiendo el bloque nuevo, el
control corta con la falla que corresponde.

**Verificado en pantalla**, con el sitio servido y rompe-caché, sobre 488 textos
de `03_REGLAS_DE_NEGOCIO.html`: con el sistema en oscuro y la elección en claro
la página sale clara —que es exactamente lo que no pasaba—, el botón cambia el
tema y lo persiste, y el contraste no baja de **4,78 en claro** ni de **5,35 en
oscuro**. Sin desborde horizontal a 375 px, y ahí el botón no pisa el
«← Herramientas», que es lo único que le queda cerca.

### La paleta de estados no llegaba a AA en tema claro — cerrado el 26/8

Abierto y cerrado el mismo día, y sólo porque el control de contraste que se
escribió esa mañana los midió de paso. Es el hermano del bug de `--faint` y
tiene la misma causa: **la paleta clara se calibró contra la tarjeta blanca.**

Lo que faltaba entender es cuál es la superficie que manda, y no es ninguna de
las tres: **es el tinte del propio estado compuesto encima de `--bg`**. Un aviso
casi nunca se escribe sobre la superficie pelada; se escribe sobre su tinte, que
es el mismo color al 8-13 % y por lo tanto más oscuro.

Medido: `--warn` `#9a6b12` no llegaba a 4,5 **sobre ninguna de las tres
superficies** —3,92 / 4,25 / 4,68— y daba 3,58 sobre su propio tinte encima de
`--bg`. `--ok` daba 4,45 sobre `--bg` y 3,98 sobre su tinte; `--error`, 4,28
sobre su tinte. En oscuro los tres pasaban con holgura, que es como sobrevivió.

Ya se había pagado una vez: el ámbar de los días de feria del calendario de
`vencimientos` salió midiendo 4,24 en claro y se corrigió antes de publicar sólo
porque alguien midió el tema en el que no estaba trabajando.

Se bajó la luminosidad de los tres conservando tono y saturación —`--ok` a
`#1c6e45`, `--warn` a `#815a0f`, `--error` a `#9f4429`, y los tintes con ellos—,
y el peor caso pasó a 4,64. `--ok` y `--error` se mueven tan poco que no se ven;
`--warn` sí se ve más ocre.

**Nacieron en el control como aviso y no como falla**, porque bajarlos era mover
la paleta y eso es una decisión, no un arreglo. La tomó Javier el mismo día
—*«los colores de la paleta los elegiste vos de todos modos»*— y con eso
`verificar-contraste` pasó a fallar con ellos, con el tinte incluido como fondo
a medir.

### `--faint` estaba calibrado contra la tarjeta y no contra el fondo — cerrado el 26/8

Abierto el 12/8 y arreglado tres veces a mano antes de arreglarse una vez de
raíz. El token del gris más claro daba **5,14 sobre `--card`** y **4,30 sobre
`--bg`**, o sea reprobaba AA —4,5 para texto chico— en el único texto que lo
usa: etiquetas de 11 px en mayúsculas, colofones, fechas.

**La causa no fue el valor, fue contra qué se lo midió.** El 5/8 el token se
bajó de `#8b93a0` a `#666e7c` midiendo sobre la tarjeta blanca, que es la
superficie más clara del tema claro y por lo tanto la más fácil. Nadie midió el
texto que va sobre el fondo de la página, que es más oscuro. **En claro la
superficie que manda es `--bg` y en oscuro es `--card`, y son opuestas**: la más
oscura en un tema, la más clara en el otro. Medir contra una sola alcanza para
que el token parezca bien en las dos.

Las tres veces que apareció se resolvió cambiando el token en esa pantalla
—`.cobertura` y `.colofon` de `vencimientos.html`, el badge de atajo del
tablero—, y el token seguía mal para las trece páginas. Es el modo de falla que
tiene un arreglo local: cierra el síntoma y deja el defecto.

Qué se hizo: `--faint` pasó a **`#5f6774`** (4,78 / 5,71 / 5,18 sobre
`--bg` / `--card` / `--sunk`) en los **seis** archivos donde están escritos los
tokens, los parches locales volvieron al token, y entró
`npm run verificar-contraste`, que corre en CI.

**Y el control encontró dos cosas que nadie había visto**, que es lo que
justifica que exista:

- **La plantilla de `scripts/build-docs.mjs` tenía los valores anteriores al
  5/8.** Los diez documentos de dominio se publicaron todo ese tiempo con
  `--faint: #8b93a0`, que da **2,59 sobre el fondo** —contra 4,5— justo en la
  etiqueta del índice lateral. En oscuro, `#6b7381` daba 3,68. Es peor que el
  bug que se estaba arreglando y **no se veía mirando ninguna de las trece
  páginas**, porque esas diez las genera un script.
- **`uma-uhom.html` ya tenía el arreglo** desde el 24/8 y las otras tres
  páginas sueltas no. Seis copias del mismo token no se mantienen iguales
  solas, y la deriva no aparece en ningún diff: cada archivo, por separado,
  se ve bien.

### Los feriados salían de una API en vivo, y podían no salir — cerrado el 14/8

Reportado como errores de CORS intermitentes en `vencimientos.html`. El CORS es
del lado del servidor y no se arregla desde acá, pero no era ése el problema:
**el problema era que la herramienta seguía calculando sin los feriados.**

`calendario-judicial.js` le pedía a `api.argentinadatos.com` un año por vez, en
el navegador de cada visitante, **con el `catch` vacío**: un año que fallaba no
dejaba rastro. Después `init()` hacía `_dataLoaded = _loadedYears.length > 0`,
así que alcanzaba con que cargara **un** año para declararse disponible.

Y el respaldo que se suponía que cubría esto no lo cubría:
`data/dias-inhabiles.json` tiene solo asuetos por Acordada, ni un feriado
nacional. Con la API caída, el 25 de mayo y el 9 de julio se contaban como
hábiles. **Un feriado contado como hábil adelanta el vencimiento**: el plazo
parece cumplirse antes de lo que se cumple. Del lado de quien controla si una
presentación fue tempestiva, ése es el sentido caro del error.

Qué se hizo:

- **`data/feriados.json`, versionado**, generado por
  `scripts/actualizar-feriados.mjs` (`npm run feriados`) contra la misma API,
  **en el build y no en el navegador**. Aborta entero si un año trae menos de 14
  feriados, si la fecha no tiene formato, o si viene una fecha de otro año: es
  preferible publicar con los de ayer que con un año a medias. Mismo movimiento
  que Honorio con la UMA en su 2.1.0.
- **No se agregó una segunda API a propósito.** Dos fuentes que discrepan en un
  feriado dan dos vencimientos distintos, y eso es peor que una sola: el error
  deja de ser visible. El archivo versionado cambia en un commit, con fecha y
  con diff.
- **Falta un año = no está cargado.** `dataLoaded` pasa a `false` e `init`
  devuelve `missingYears`, que dice cuáles.
- **`caducidad.html` informaba «2021 a 2027» mirando primero y último.** Con un
  hueco en el medio mentía. Ahora, si falta alguno, no calcula y los nombra.

Ningún número se movió: el archivo se generó de la misma fuente que se
consultaba antes. Verificado corriendo, no leyendo: 25 de mayo, 9 de julio,
carnaval y 24 de marzo de 2026 dan inhábil; un miércoles común da hábil; un año
ausente y el archivo ausente dan `dataLoaded=false` nombrando el faltante.

**La lección quedó en cómo se anotó, no en el código.** El mismo commit arregló
el bug y escribió la entrada en `ESTADO.md` **en presente y como «Abierto»**,
copiada del reporte. Nadie la dio vuelta, y quedó un día entero declarando roto
lo que ese commit acababa de arreglar. `AGENTS.md` pide verificar contra el
código y no contra otro documento: **eso incluye al `ESTADO.md` que uno mismo
escribió hace diez minutos.**

### Los tres del 7/8, cerrados el mismo día

**1. La lectura de la planilla por posición, en tres archivos.** `honorarios-mediacion.html`,
`prorrateo.html` y `asistente-honorarios-clasico/js/core.js` tomaban la fila por
número. Ahora los tres buscan **por clave**, respetando comillas —la fila
`Acordada` tiene comas adentro— y detectando el HTML que Google devuelve con
status 200 cuando la publicación se da de baja. Es el mismo criterio de
`honorio/scripts/actualizar-uma.mjs`.

El peligroso era el de mediación: leía la celda B2, así que una fila insertada
arriba le habría hecho tomar la UMA como si fuera el UHOM —$102.076 donde van
$12.960—, un honorario **ocho veces más alto sin ningún error visible**.
Verificado contra el CSV real y contra tres mutaciones —fila nueva arriba, filas
reordenadas, clave ausente—: los tres devuelven el valor correcto en las
primeras dos y `null` en la tercera, que es lo que activa la carga manual.

**El arreglo se propagó a `honorio/public/legacy/core.js`**, en el commit propio
de aquel repositorio. Y ahí hubo una corrección de criterio que conviene tener
escrita, porque la primera versión del `ESTADO.md` proponía lo contrario:

> Se había anotado «sacar `cargarUMA()` de la copia de Honorio, que es código
> muerto». **Eso estaba mal.** `AGENTS.md` dice que el motor legacy se arregla en
> su fuente y se propaga, y que **nunca se parchea una copia sola**; y
> `adapters.ts:74` ya había decidido a propósito no tocar esa función por ese
> mismo motivo. Lo correcto no era borrarla de la copia sino **propagarle el
> arreglo**, que es lo que se hizo. La copia volvió a ser fiel a su fuente
> —difieren solo en un `return` que ya estaba— y de paso dejó de leer por
> posición.
>
> **La lección:** antes de proponer una limpieza en `public/legacy/`, mirar si la
> decisión ya está tomada. Estaba, y con mejor razón.

**2. El art. 22 sobre la escala en `calculadoras/honorarios.html`.** Su `grupo4`
hacía `calcMinComp *= 0.7` sobre el resultado de la escala. **Es el mismo error
que tenía `05_DEPENDENCIAS.md`**: el art. 22 reduce la **base**, antes de la
escala (`aplicarReduccionesBase()`, `calculate.ts:270`). Con el ejemplo ya
escrito acá daba **7,6 % de más** y ni siquiera caía en el mismo tramo. Los
grupos 2, 3, 5 y 6 estaban bien: esos artículos sí reducen la escala.
**Se resolvió dando de baja la herramienta**, no corrigiéndola; el porqué está
arriba.

**3. El redondeo en los bordes de tramo**, en ese mismo archivo: `baseEnUMA` se
redondeaba si caía entre 15 y 16, 45 y 46, y así en los seis cortes. El motor no
redondea nada, comprobado. Se fue con la baja de la herramienta.

### Caducidad contaba mal la feria de julio — cerrado el 5/8

El código sumaba los días de feria **solapados con el vencimiento nominal**, no
los de la feria entera, y no volvía a mirar si la fecha nueva seguía cayendo
adentro. El art. 311 CPCCN descuenta enteros los plazos que corresponden a
ferias, así que el arreglo es una **iteración a punto fijo** —recalcular hasta
que la fecha deje de moverse—, el mismo patrón que ese archivo ya usaba unas
líneas más abajo para los inhábiles.

**Lo que importa:** de 8.760 combinaciones de fecha de inicio por plazo entre
2025 y 2028, cambiaban **298 (3,4 %)**. Solo una parte daba el absurdo visible
que reportó Javier —una fecha de vencimiento dentro de la feria que el propio
resultado decía haber atravesado—; **el resto daba una fecha equivocada pero
verosímil**, que nadie habría mirado dos veces. Un bug de cálculo de plazos se
busca con un barrido, no con el caso que lo destapó.

---

## Trampas que dejaron de serlo

- **`.gitattributes` estuvo en UTF-16 hasta el 5/8 y git nunca lo leyó.** Lo
  parsea como bytes, veía un nulo entre cada carácter y ninguna de sus reglas
  rigió. Por eso los HTML quedaron guardados con CRLF y `entre-fechas.html` con
  las dos cosas mezcladas —397 CRLF y 192 LF sueltos—, de modo que cualquier
  edición de una línea uniformaba el archivo y salía en el diff como si se
  hubiera reescrito entero. Ya está arreglado y el repositorio renormalizado.
  **Lo que sigue vivo de esto es la causa**, y está en `ESTADO.md`: el `>` de
  PowerShell escribe UTF-16.
- **Después de tocar la configuración de Pages, mirar `Age` antes de sacar
  conclusiones de un código de estado.** Al verificar Enforce HTTPS,
  `http://javiercuneo.com.ar/` devolvía 404 y se leyó como que la opción estaba
  sin tildar. Era **una respuesta cacheada en el borde de GitHub**, de cuando el
  dominio todavía no estaba configurado: la raíz venía con `age=3502` —casi una
  hora— mientras que `/index.html`, que nunca se había pedido por HTTP, salía con
  `age=0` y el 301 correcto. Un parámetro de cache-bust en la query **no sirve**,
  porque la variante ya estaba cacheada igual.
- **`npm run lint` no existe.** Se eliminó el 4/8: declaraba `eslint .` y
  `eslint` nunca estuvo instalado, así que era una promesa que fallaba.
- **Los días inhábiles tienen una sola fuente: `data/dias-inhabiles.json` más la
  API de `argentinadatos.com`.** Hasta el 5/8 `mora.html` leía un repositorio
  viejo y abandonado con 36 fechas de más; 35 ya las daba la API y la única
  huérfana estaba mal —era la fecha nominal de un feriado trasladable, no la
  vigente—. **Ante dos fuentes que difieren, no elegir la más larga:** comparar
  entrada por entrada contra la autoritativa.
- **Después de publicar en un lugar nuevo, mirar la pestaña de red, no solo si
  la página carga.** En `honorio.ar` recién publicado apareció un 404 a
  `/_vercel/insights/script.js`: era `@vercel/analytics`, resto de la plantilla
  de v0. La app declara que nada de lo que se escribe sale del navegador, y con
  ese paquete adentro la afirmación dependía de dónde estuviera alojada. **Una
  afirmación de privacidad no puede depender del hosting.**

---

## El frente grande del 25 al 28/8: el motor extraído y las once calculadoras

Cuatro días seguidos sobre el mismo frente, y el orden importa para leerlo: el
cómputo salió de adentro de los HTML, las cinco pantallas de plazos pasaron a
consumirlo y a dibujar el plazo, se rediseñó `vencimientos` y con ella el
tablero, y recién ahí se refundaron de cero las cuatro que no son de plazos
—`honorarios-mediacion`, `prorrateo`, `tasa` y `ejecucion-estado`—, cada una con
su red de pruebas puesta antes de tocarla.

**Lo que sigue está tal como se escribió cada día**, en orden cronológico. Lo
que de todo esto sigue vivo —las decisiones que no hay que contradecir y las
trampas que todavía muerden— está en [`ESTADO.md`](ESTADO.md); acá está el
detalle de cómo se llegó, que es lo que se busca cuando aparece la pregunta
«¿por qué esto quedó así?».

### Las pantallas consumen el motor — 26/8

**El 25/8 quedó lo peor de los dos mundos y conviene que quede escrito:** el
motor extraído y las pantallas con su copia, o sea dos implementaciones vivas de
una cuenta con consecuencia jurídica, mantenidas iguales sólo por haber sido
escritas el mismo día. Decisión de Javier el 26/8: hacer que las pantallas
consuman el motor.

Migradas las dos que `plazos.js` cubre:

- **`vencimientos.html`** — `calcular()` ya no tiene aritmética: lee el
  formulario, valida, llama a `Plazos.vencimiento()` y muestra.
  `calcularNotificacionAutomatica()` y `proximoDiaDeNota()` quedaron como
  delegaciones de una línea.
- **`mora.html`** — se fueron `nextBusinessDayStrict` y `countBusinessDaysFrom`.
  `isBusinessDay` se queda porque la usa el detalle día por día, que no calcula
  el vencimiento. Es el caso testigo del problema: hasta el 17/8 deducía la feria
  con una heurística propia distinta de la del motor, y **las dos estaban mal, en
  años distintos, durante años**.

**Cómo se probó que no se movió un número.** Antes de tocar nada se capturó la
salida de las pantallas: 12 casos de `vencimientos` y 6 de `mora` —éstos con la
línea de tiempo entera, no sólo la fecha final—. Después de migrar, los mismos
casos: **12 de 12 y 6 de 6 idénticos.**

**Y en el medio se pisó la trampa del caché**, que ya estaba anotada para los
iframes del tablero y vale igual acá: la primera corrida dio 12 de 12 **contra el
archivo viejo**, porque el servidor estático no manda `no-cache`. Salió a la luz
sólo porque el dibujo no aparecía. Una comparación cacheada da verde siempre:
**toda medición contra el sitio servido va con rompe-caché.**

**Y las tres que faltaban se migraron el mismo 26/8**, con el mismo método:
ver [abajo](#las-tres-que-faltaban-consumen-el-motor--268). Desde entonces
**ninguna de las cinco pantallas de plazos tiene aritmética adentro.**

---

### Las tres que faltaban consumen el motor — 26/8

**Con esto, ninguna de las cinco pantallas de plazos tiene aritmética adentro.**
Las tres se hicieron con el método de [Por dónde seguir](#por-dónde-seguir)
entero y una por una, sin cortar ninguna por la mitad. En total **6604 casos
capturados de la pantalla antes de tocar nada y vueltos a correr después:
idénticos, los 6604.**

| pantalla | casos | qué barre |
|---|---|---|
| `caducidad` | 1132 | 6 años × 12 meses × 4 días × 4 plazos |
| `entre-fechas` | 4608 | 6 × 12 × 2 días × 4 distancias × 4 combinaciones de puntas × hábiles y corridos |
| `regresiva` | 864 | 6 × 12 × 3 días × 4 plazos |

Y `plazos.js` pasó de dos funciones de cálculo a cinco. **Sigue sin decidir nada
nuevo**: es transcripción, y las tres convenciones de fecha conviven adentro sin
unificarse —mediodía UTC en `vencimientos`, medianoche local con `setHours` en
`mora`, medianoche local pelada en estas tres— porque unificarlas es elegante y
mueve un número de algún lado.

#### `caducidad`

**Qué se movió de lugar.** El cómputo del art. 310 vivía adentro del `submit` de
`caducidad.html`, entre `document.getElementById`: el ancla del día, el salteo
de enero, el punto fijo de la feria de invierno y el cómputo con inhábiles.
Ahora es `Plazos.caducidad()`, y la pantalla quedó en 77 líneas donde había 265:
lee el formulario, llama al motor y escribe. **Es transcripción**: no se
simplificó una línea, ni el bucle que arranca en `corrimientos = 0` ni la
iteración a doce vueltas.

**No comparte nada con `vencimiento()`, y eso está bien.** Es un plazo en meses
—de fecha a fecha, art. 6 CCyC— y los inhábiles corren adentro salvo los de
feria (art. 311 CPCCN). Vive al lado y no encima.

**Cómo se probó que no se movió un número.** Antes de tocar nada, la matriz:
seis años por doce meses por cuatro días por cuatro plazos, **1132 casos**,
capturados de la pantalla servida —con el detalle y el cómputo oculto, no sólo
la fecha—. Después de migrar, los mismos 1132 en el mismo orden: **idénticos**,
con el mismo SHA-256 de la corrida entera (`408fedbd…`). Y las 51 filas de
`pruebas-calculadoras.html` siguen en verde.

**La trampa del caché, otra vez, y ahora con la forma exacta:** el `?v=` del
HTML **no toca los subrecursos**. La primera corrida después de migrar encontró
el `plazos.js` **anterior** todavía en memoria —`Plazos.caducidad` no existía— y
sólo se vio porque el arnés lo comprueba antes de medir en vez de suponerlo. Lo
que sí funciona es `fetch(url, { cache: 'reload' })` sobre cada script y recién
después recargar: eso reemplaza la entrada de caché. **Toda medición contra el
sitio servido tiene que empezar comprobando que el código que corre es el que se
acaba de escribir**, y no que la URL llevaba un parámetro distinto.

**Lo único que cambió de salida, y cambia para bien.** Con «Plazo de
prescripción menor» elegido y el campo **vacío**, la calculadora seguía de largo
con un plazo `NaN`: el bucle de meses no corría ni una vez y la pantalla
contestaba que **la caducidad se produce el día del último acto impulsor**.
Verificado en pantalla antes de tocarlo: 15/3/2025 con el campo vacío devolvía
«15/3/2025». Ahora dice que falta el plazo. Es la única diferencia de las 1132 y
va de un número equivocado a una negativa.

**Y lo que quedó anotado sin tocar:** el **cómputo con inhábiles y feriados no
se muestra**, y no desde ahora. Vive en un `div.hidden-computation` con
`display:none` desde antes de la extracción: se calcula entero, se escribe en el
DOM y nadie lo ve. Se transcribió igual, con el motivo escrito en `plazos.js`.
**Hay que decidir si se muestra o se saca**, y las dos cosas son decisión de
Javier: mostrarlo agrega una segunda fecha a una pantalla que responde una sola
pregunta, y sacarlo tira una cuenta que alguien escribió a propósito.
**Y hay un argumento más para no dejarlo así**, que salió del arreglo de enero:
ese cómputo oculto tiene su **propia** regla para salir de la feria de enero
—`setMonth(+1, 1)`, o sea el primer día del mes siguiente— distinta de la que
usa la cuenta visible. Dos reglas para la misma suspensión, y una de ellas
invisible, es exactamente la forma del bug que se acaba de cerrar.

#### `entre-fechas`

**Es la única de las cinco que no computa un vencimiento: cuenta.** Y la única
que puede contestar con el calendario incompleto, porque los días corridos no
dependen de ningún feriado. Por eso la auditoría se reinicia **sólo** cuando se
cuentan hábiles: reiniciarla siempre haría que un conteo de corridos borrara la
auditoría de otro cálculo. Eso estaba así y se conservó.

La matriz son 4608 casos y cubre las dos puntas por separado —incluir el día de
inicio, el de cierre, los dos, ninguno—, que es donde una migración se
equivocaría sin que se note: un día de más o de menos en un extremo no cambia la
forma del resultado.

**Un cambio de texto y no de número:** el motivo de exclusión tenía un
`|| 'Inhabil'` sin tilde como último recurso, en texto que ve el usuario. Es
inalcanzable —si el día no es hábil, el motor siempre da un motivo— y por eso
sobrevivió. Quedó `'Inhábil'`. Ninguno de los 4608 casos lo produce, así que la
comparación no lo vio, y se anota acá para que no parezca una diferencia
escondida.

#### `regresiva`

Contesta al revés que las demás —hasta cuándo hay tiempo para algo que tiene que
estar N días hábiles **antes** de una fecha— y tiene una particularidad que hubo
que preservar con cuidado: **cuando se contaron todos los días, el cursor no
retrocede una vez más.** La fecha límite es el último día contado y no el
anterior a él. Escrito de otra forma, el resultado se va un día.

**Y el orden de los tres avisos importa, así que lo fija el motor y no la
pantalla:** primero el dato faltante, después el objetivo inhábil, y recién
después el plazo mal escrito. Al revés, una fecha de feria con el plazo vacío se
quejaría del plazo y no de la fecha, que es lo que el usuario tiene que
corregir. Por eso `regresiva()` **no lanza** cuando el objetivo es inhábil: eso
no es un error, es una respuesta.

**Y es la única de las tres que además se arregló**, el mismo día y por decisión
de Javier: contar hacia atrás se salía de la ventana de cobertura sin avisar.
Cambian 121 de 10.955 conteos y son exactamente los que antes devolvían una
fecha anterior a 2021. El detalle está en [`HISTORIA.md`](HISTORIA.md).

#### El banco pasó de 34 a 132 comprobaciones

Y ninguno de los testigos sale del motor: son los que las pantallas mostraban
antes de la extracción. Adentro van los diez de caducidad, el ancla que no se
arrastra —el bug del 18/8—, el salteo de enero, los días de feria descontados,
los totales de `entre-fechas` con y sin puntas, y las seis fechas límite de
`regresiva`. Y tres barridos con invariantes: que **ningún vencimiento de
caducidad cae en la feria de invierno** (4260 cruces), que los días corridos dan
la cuenta exacta y cada día del tramo está contado o excluido sin un tercer
estado (960 tramos), y que la regresiva cuenta exactamente los días pedidos y
deja el límite en un hábil anterior al objetivo (780 objetivos).

**Los dos bugs abiertos los encontraron esos barridos**, que es para lo que
existen.

#### Un testigo mío estaba mal, y conviene saber por qué

El primer bloque de pruebas de `regresiva` fijaba «40 hábiles antes del 1/2/2026
dan el 15/10/2025», copiado de la captura. **El 1/2/2026 es domingo**: la
pantalla no calcula, avisa que el objetivo es inhábil y **deja en el DOM el
resultado del caso anterior**. El valor copiado era el de otro caso.

La comparación no lo notó ni podía: compara la pantalla contra sí misma, y una
salida vieja es igual de vieja de los dos lados. Lo cazó correr las pruebas en
Node, donde no hay DOM que se quede con nada.

**De ahí la regla, que vale para cualquier arnés que lea una pantalla:** una
matriz sirve para comparar antes y después, pero **un testigo tiene que salir de
una corrida que efectivamente calculó**. Los días que la matriz barre —1, 15 y
28— caen todos en fin de semana en febrero y marzo de 2026, así que para esos
meses no hay ningún testigo posible; el caso que cruza enero quedó como
invariante —ningún día de enero se cuenta— y no como número copiado.

### El dibujo en las tres que faltaban — 26/8

**Lo primero fue no copiar el de `vencimientos`.** El pendiente lo decía y tenía
razón: las tres contestan otra pregunta, y un calendario que no explica nada es
peor que ninguno, porque un dibujo se lee con más confianza que una frase.

**El dibujo salió de `vencimientos.html` a dos archivos compartidos** —
`calculadoras/js/dibujo-plazo.js` y `calculadoras/css/dibujo-plazo.css` —. Cuatro
copias de la misma grilla en cuatro archivos sin build se desincronizan: es el
mismo argumento por el que `problemaDeDatos()` vive en el calendario y no en cada
pantalla.

**El módulo decide cómo se dibuja un día; no decide qué significa.** Recibe un
mapa de marcas ya armado —clase, número de orden y el texto del globo— y no mira
ni un resultado del motor. Si interpretara el cómputo, sería una segunda
implementación del cómputo. Lo que significa cada día lo arma cada pantalla, que
es donde está la diferencia.

**Verificado antes de tocar nada y después:** los mismos 10 casos de
`vencimientos` —cédula, automática, días de nota, ampliación, feria de julio y de
enero— **idénticos carácter por carácter**, comparados por longitud y suma de
control del HTML que produce el dibujo. La extracción movió el archivo y nada más.

Ahí apareció el único desvío, y vale anotarlo porque es la clase de cosa que se
publica sin que nadie la vea: en la primera pasada faltaban seis caracteres por
caso. Era la clase `fuera` del día de la notificación, que no está contado ni
salteado y por lo tanto no entraba en ninguna de las dos vueltas. Se veía como un
gris que faltaba en una celda; se encontró porque la comparación era por
longitud y no por «se ve igual».

#### `regresiva`: el dibujo reemplazó la traza

Contaba hacia atrás y ya listaba día por día: una fila por cada uno, con «OK
CONTADO» o «X NO CONTADO» al lado. **La lista es el dibujo sin la forma**, y
repetía el problema que en `vencimientos` ya se había resuelto agrupando: doce
renglones idénticos de feria tapando al feriado suelto.

**Qué explica el dibujo acá, que el número no:** hasta dónde tuvo que retroceder
el conteo. Un fin de semana y una feria **adelantan** la fecha límite —dan menos
tiempo, no más— y eso es lo contrario de lo que la intuición espera. El caso que
lo muestra: objetivo el 5/8/2026 con 10 días de antelación no da fines de julio,
da el **6 de julio**, porque la feria de la Acordada 11/2026 se come doce días.

Los días se numeran **desde el objetivo hacia atrás**: el 1 es el hábil anterior
al objetivo y el último es la fecha límite. Numerarlos al revés diría que el
cómputo empieza en la fecha límite, que es justo lo que todavía no se sabe.

**Esto sacó una pantalla y es una decisión, no una consecuencia.** Si la traza
hacía falta, vuelve: son veinte líneas y están en el historial.

De paso salieron de esa pantalla cuatro colores planos —`#fafdff`, `#e6edf4`,
`#1e7a44`, `#b13e3e`— más los dos del cartel de error, que en tema oscuro
pintaban una lista casi blanca con letra casi negra. Y el `@media` de 700 px
estaba escrito al revés: repetía `.container` con los mismos 40 px de relleno del
escritorio, así que en un teléfono la tarjeta seguía comiéndose el ancho.

#### `entre-fechas`: lo que el dibujo muestra son las dos casillas

No computa un vencimiento: cuenta. Así que lo que el número no contesta son dos
cosas, y las dos se ven en la grilla:

1. **Qué días entraron.** Las casillas de incluir el inicio y el fin mueven el
   total sin mover nada en pantalla: se destilda una, el número baja en uno, y no
   queda con qué saber cuál día se fue. Ahora **las dos fechas cargadas están
   siempre marcadas**, y se ve si quedaron adentro o afuera.
2. **Cuáles se descontaron y por qué**, cuando se cuenta en hábiles.

**Y la diferencia entre los dos modos se lee de un vistazo:** en días corridos el
bloque sale entero, porque el sábado también cuenta; en hábiles sale picado.
Atenuar el fin de semana en un conteo de corridos sería dibujar lo contrario de
lo que el número dice.

**`entreFechas()` ahora devuelve `contados`**, los días que entraron al conteo.
Es aditivo —no toca una sola cuenta— y existe por una razón concreta: si el
dibujo caminara el rango restando los excluidos, sería un segundo conteo, y el
último número de la grilla podría no coincidir con el total. Así coinciden porque
**son el mismo conteo**, y eso convierte al dibujo en un control: si alguna vez
discrepan, se ve sin abrir nada.

**El período no tiene tope, así que el dibujo sí:** arriba de doce meses no se
dibuja. Y acá **sí se escribe una línea diciéndolo**, a diferencia de
`vencimientos`, donde no dibujar coincide siempre con no tener resultado. Acá hay
un resultado y el dibujo desaparecería sin explicación.

#### `caducidad`: no es un calendario, y ésa es la decisión

**Es la única de las cuatro que no dibuja una grilla, y el motivo no es que
ocupara medio año.** Es un plazo en meses: se cuenta de fecha a fecha (art. 6
CCyC) y adentro corren todos los días salvo los de feria (art. 311 CPCCN). No hay
días salteados que mostrar.

**Y hay una razón más fuerte, que es la que decide.** Pintar el plazo día por día
diría que el cómputo avanza día por día, y no es lo que hace: avanza por tramos
mensuales anclados al día del acto impulsor, y después se corrige. El propio
motor deja escrito que las dos lecturas coinciden en 56 de 67 casos y **difieren
en los once cuyo acto impulsor cae adentro de la feria de invierno**. Un
calendario sería exacto casi siempre, que en esta materia no alcanza: mentiría
con la autoridad que tiene un dibujo, y justo en el caso raro.

Lo que sí hay que explicar es **la secuencia de correcciones**, y eso es una línea
de hitos. El caso de Javier, entero:

> 21/6/2025 · Último acto impulsor
> 21/12/2025 · 6 meses contados de fecha a fecha desde el acto impulsor (art. 6 CCyC)
> \+ 12 días · Feria judicial de invierno de 2025, del 21/7 al 1/8: el plazo no corre y el vencimiento se corre otro tanto (art. 311 CPCCN)
> 2/1/2026 · Caía adentro de la feria de enero 2026, que no computa: se corre un mes
> 2/2/2026 · Se produce la caducidad de la instancia

Reemplaza a las «Observaciones», que decían lo mismo en tres renglones sin orden,
sin las fechas intermedias y **sin una sola tilde** —«Se excluyo enero», «Se
atraveso la feria», «dias adicionados»—, que es texto que ve el usuario.

**`caducidad()` ahora devuelve `vencimientoNominal`**, dónde caen los meses antes
de sumarle la feria. Es aditivo y existe para no reconstruirlo restando días de
este lado, que sería una segunda cuenta.

Dos cosas que salieron de probar los casos raros y no de mirar la pantalla buena:

- **La negativa dejaba los hitos del cálculo anterior.** Un «No se puede
  calcular» con la explicación de otra fecha debajo es la peor variante posible,
  porque la explicación es lo que se lee con más confianza. Ahora se barren.
- **Sin feria de por medio, el hito de los meses y el final son la misma fecha**,
  y dos renglones seguidos con la misma fecha se leen como un error del programa.
  En ese caso la regla se dice en el último hito y el renglón no sale.

#### Qué se verificó

- **`scripts/pruebas-calculadoras.html`: 51 de 51 pasan**, incluidos los 21
  corridos otra vez adentro del tablero. **Ningún número se movió en ninguna
  pantalla**, que es lo único que este trabajo no podía hacer.
- Los siete bancos del repositorio en verde: `verificar-calculos`,
  `verificar-plazos`, `verificar-contraste`, `verificar-conectores`,
  `verificar-docs`, `verificar-series` y `verificar-escribiente`.
- **Sin desborde horizontal a 375 px** en las cuatro.
- Contraste de los hitos, calculado sobre la superficie real —`--accent-tint`
  sobre `--card`, que es donde vive el panel de resultado—: peor **5,33** en
  claro y **5,35** en oscuro.
---

### El paso (4): el plazo dibujado, adentro de la calculadora — 26/8

**Primero se hizo mal.** El 25/8 salió como `calculadoras/calendario.html`, una
pestaña aparte del tablero. Javier lo corrigió el 26/8: *«mi idea era que el
plazo dibujado fuera parte de la propia calculadora que se está usando y no una
tab aparte»*. Tiene razón y el motivo es el mismo que hace bueno el tablero: el
dibujo no es otra herramienta, **es la explicación del número que la
calculadora acaba de dar**. En una pestaña aparte había que volver a cargar la
fecha y el plazo para ver por qué el resultado era ése. El archivo se borró y la
pestaña se sacó; el tablero volvió a ocho.

Ahora vive adentro de `vencimientos.html`, abajo del resultado. Dibuja los meses
que el plazo abarca: el día de la notificación, cada día contado con su número
de orden, los salteados con el motivo de cada uno, y el vencimiento. **El fin de
semana se atenúa y lo que decidió un acto se marca** —feria, feriado, asueto—,
porque son los días que mueven el vencimiento y que nadie tiene en la cabeza.

Se arma de los tramos que devuelve el motor, **no recorriendo el calendario por
su cuenta**: si la grilla y el cómputo pudieran discrepar, la grilla mentiría con
la autoridad que tiene un dibujo. Y si falta un dato no dibuja nada, ni el
calendario vacío.

El caso que muestra para qué sirve: **20 días hábiles desde el 25/6/2026 no
vencen en julio, vencen el 11 de agosto.** El plazo se comió el Día de la
Independencia, un puente turístico y los diez días hábiles de la feria de la
Acordada 11/2026.

**Y de paso se limpió CSS muerto.** `vencimientos.html` tenía reglas `.calendar`,
`.calendar-day.counted` y `.calendar-day.ignored` escritas y **nunca usadas**
—nada del markup ni del JS producía un `.calendar`—, con colores planos
(`#d4edda`, `#f8d7da`) que el sistema visual no usa. Alguien pensó esta pantalla
antes y no la terminó.

**Un error que casi se publica.** La primera versión ponía el número de los días
de feria en `--warn` sobre `--warn-tint`: 12,7 en tema oscuro y **4,24 en
claro**, abajo de los 4,5 que pide AA a 12 px. Se vio midiendo contraste sobre
estilos computados en los dos temas, y sólo porque se midió el tema en el que no
se estaba trabajando. Ahora el ámbar va en el fondo y el borde, el número en
`--fg`, y lo peor de la grilla es 4,66 en claro y 5,06 en oscuro. Sin desborde
horizontal a 375 px.

### `vencimientos.html` rediseñada — 26/8

**El pedido de Javier, textual:** *«transformar desde un html hecho por una IA
que no le da para mucho a un dashboard que parezca hecho por Claude»*, y el
diagnóstico concreto que lo acompañaba: el selector de modalidad ocupaba el
ancho entero para decir «Por cédula», con un espacio en blanco cuatro veces más
grande que el texto. Sin jerarquía.

**El criterio que ordenó todo: cada control ocupa lo que mide su contenido.** Un
día son dos dígitos y entra en 4ch; el año en 6,8ch. La modalidad son dos
opciones y pasó a ser un **control segmentado**, no un desplegable: con dos
opciones un desplegable esconde la mitad de la elección detrás de un clic y no
ahorra nada. Los `radio` de adentro son el control real —teclado y lector de
pantalla—; la clase `.elegida` es sólo pintura.

Lo único grande de la página es el vencimiento. Antes eran seis tarjetas
apiladas del mismo peso, incluida la del resultado: seis bloques iguales para
seis datos que no valen lo mismo. Ahora hay tres alturas: la fecha, la tira de
cuatro datos, y el dibujo.

**No se cambió la paleta.** Cobalto sigue siendo el único acento y los tokens
son los de `comun.css`. Lo que cambió es densidad y jerarquía.

**Tres cosas del dibujo, pedidas por Javier:**

- **Sin título.** «El plazo, dibujado» arriba de un calendario dibujado no
  informa nada.
- **Sin lista de días no contados.** Los fines de semana se ven; escribir «el
  sábado no se cuenta» abajo de un dibujo que ya lo muestra es ruido. Lo que el
  dibujo no puede decir es **por qué** un martes está marcado, y eso —y sólo
  eso— se escribe.
- **La firma de la resolución se marca**, con notificación automática. Lleva
  `--ok`, que es un token de estado del sistema y no un acento nuevo, y va en el
  borde y no en el relleno para no competir con el vencimiento. El dibujo ahora
  arranca en la fecha cargada y no en la notificación, porque si no la firma
  quedaba fuera del lienzo.

**Y los motivos van agrupados por tramo.** La primera versión sacaba doce fichas
idénticas que decían «Feria judicial (Acordada CSJN 11/2026)» y **tapaban al
feriado suelto**, que es justamente la sorpresa que hay que ver. Ahora son tres:
el 9 de julio, el puente del 10, y «20 jul a 31 jul · Feria judicial · 10 días».
El agrupado admite hasta tres días de hueco porque la feria salta el fin de
semana, y un motivo que reaparece más lejos abre un tramo nuevo —2009 y 2020
tuvieron más de una feria—.

**Dos arreglos que salieron de medir, no de mirar:**

- `.cobertura` y `.colofon` daban **4,30 en tema claro**. Son los dos únicos
  textos que van sobre `--bg` en vez de `--card`, y ahí `--faint` reprobaba AA
  —el mismo token daba 5,14 sobre la tarjeta—. Ese día se eligió `--muted-fg`
  para no tocar trece páginas; **más tarde el token se arregló de raíz y los dos
  volvieron a `--faint`**, que es lo que semánticamente son.
- El rótulo de la fecha decía «Seleccione la fecha de la firma de la
  **resolucion**», **sin tilde**, en texto que ve el usuario. Venía del original.
  Ahora dice «Firma de la resolución», que además entra en una línea: el estilo
  es de etiqueta —once píxeles, mayúsculas, con espaciado— y una frase entera ahí
  se lee peor que en caja baja.

**Verificado:** los mismos 12 casos de antes de la migración, **12 de 12
idénticos** después del rediseño completo. Contraste sin excepciones en los dos
temas —peor 4,66 en claro, 5,06 en oscuro— y sin desborde a 375 px.

**Lo que faltaba de este frente ya no falta:** el dibujo se extendió a las otras
tres el mismo 26/8, y el de `vencimientos` salió a un módulo compartido sin mover
un carácter de lo que produce. Ver [el dibujo en las tres que
faltaban](#el-dibujo-en-las-tres-que-faltaban--268). Los otros dos que estaban
acá —el tablero rediseñado y sacar `honorarios`, `tasa` y `prorrateo` de la
barra— se hicieron el mismo día: ver [el
rediseño](#el-tablero-rediseñado-y-las-dos-regiones--268).

---

### `vencimientos` terminada: la devolución de Javier, punto por punto — 26/8

Seis observaciones sobre la pantalla ya rediseñada. Todas hechas, y ninguna
movió un número: **51 de 51 en el banco de pantallas, después de los cambios.**

**1. «Hay demasiadas líneas separando cosas, no sé qué vienen a mostrar.»**
Contadas: la de abajo de la barra de pestañas, el recuadro del tablero, la
línea de abajo del encabezado de la calculadora, y la de arriba de los botones.
**Cuatro divisiones para una sola cosa.** Salieron tres: el recuadro del
tablero —las once calculadoras traen su propio contenedor en `--card`, así que
no delimitaba nada que no estuviera ya delimitado—, la del encabezado y la de
los botones. Queda la de la barra de pestañas, que sí separa la navegación del
contenido. **Y salió también el margen lateral del `body` embebido**, que se
sumaba al de la página del tablero y dejaba la calculadora corrida hacia
adentro respecto del título de arriba: era un encierro más, sin borde que lo
mostrara.

**2. «Un espacio grande a la derecha vacío… me pregunto si el resultado se
debería mostrar ahí.»** Sí. **Ahora son dos columnas**: el formulario a la
izquierda, la respuesta a la derecha, y el dibujo abajo a ancho completo, que
es lo único de la pantalla que quiere todo el ancho que haya. A una sola
columna abajo de 900 px.

Y la columna derecha **no arranca vacía**: lleva un aviso que dice dónde va a
aparecer la respuesta. No es decoración —si estuviera vacía, calcular movería
el formulario de lugar—, y una caja vacía no dice qué va a pasar.

**3. «Ampliación por distancia debería ir junto a fuera de horario hábil,
porque en el fondo son como modificadores del cómputo, y permanecer oculto con
un checkbox.»** Hecho, y tenía razón por partida doble: los tres —el horario,
la ampliación y los días de nota— corren el vencimiento, ninguno se usa casi
nunca, y estaban en tres lugares distintos de la pantalla. Ahora son un solo
grupo, **Modificadores del cómputo**, cada uno detrás de una casilla.

**Y eso abrió un modo de falla que hubo que cerrar aparte.** Con el campo
escondido, un valor cargado antes seguía sumándose: el plazo salía con días de
más y nada en pantalla lo explicaba. Que el campo se limpie al ocultarse no
alcanza —alcanza con que alguien le escriba el `value` por código, que es
exactamente lo que hace el banco de pruebas—, así que **`calcular()` comprueba
de nuevo que la casilla esté tildada antes de leer el número.** El banco tuvo
que aprender a tildar la casilla, y los cuatro casos de ampliación lo prueban.

**4. «Si cambiás a notificación automática aparece un recuadro nuevo con otro
color de fondo.»** Era `.nota-caja`, con fondo `--sunk` y borde propio. Un
recuadro adentro de una tarjeta adentro de una página son tres encierros, y
además hacía parecer los días de nota de otra categoría que los otros dos
modificadores, cuando son lo mismo. Sin fondo ni borde: el rótulo y el espacio
alcanzan.

**5. «Los días de nota no se ven marcados en el calendario.»** Era cierto y era
el peor de los seis: el usuario tildaba diez fechas, esas fechas **movían el
vencimiento**, y el dibujo no las mostraba. Ahora llevan un punto, con su
entrada en las referencias. **Punto y no color de fondo, a propósito:** un día
de nota no es una categoría de día —puede ser además contado, o ser la
notificación— sino algo que pasó ese día. Las fechas salen del formulario y no
del motor: el motor las usa para elegir el día de notificación y no las
devuelve.

**6. «El calendario me está encantando… creo que le dejaría siempre el mismo
tamaño, el que tiene cuando se ve el mes completo, porque es demasiado grande
si no.»** El mes era `minmax(212px, 1fr)`, o sea se estiraba para llenar el
lienzo: un plazo de dos meses daba celdas de 62 px y uno de cinco, de 28. **El
mismo dibujo cambiaba de tamaño según cuánto durara el plazo**, que es justo lo
que un calendario no puede hacer. Ahora el mes mide 236 px fijos —celda de
30 px, el tamaño con el que se dibujó— y los meses se centran. Sobra aire a los
costados cuando son pocos, y es preferible al mes gigante.

**Y dos correcciones más, del mismo día, sobre la pantalla ya terminada:**

- **El botón dice «Calcular» y no «Calcular el vencimiento».** Está abajo de un
  formulario que no hace otra cosa: el resto de la frase no agregaba nada.
- **La muestra del día de nota no se veía.** La entrada de las referencias
  existía, pero el punto medía 4 px en `--muted-fg` adentro de un cuadrado
  vacío, al lado de muestras sólidas de color: la fila entera pasaba
  desapercibida. Javier la pidió creyendo que faltaba, que es la prueba de que
  no se veía. Ahora el punto va a 5 px y en `--fg`, y la muestra imita una
  celda cualquiera con la marca encima. **Una celda y no un color, a
  propósito:** el punto no es una categoría de día —un día de nota puede ser
  además contado, o ser la notificación— así que la muestra tiene que leerse
  como «un día con esta marca» y no como un estado.

**Verificado:** contraste sin excepciones en los dos temas, **midiendo cada
tema en una carga fresca y no cambiando `data-tema` en caliente** —ver la
trampa de las transiciones—: peor 4,78 en claro y 5,06 en oscuro, sobre 187
textos. Sin desborde horizontal a 375 px. Y `vencimientos` embebida en el
tablero da la misma fecha que suelta.

### El tablero rediseñado, y las dos regiones — 26/8

**Lo estructural: los plazos y lo que no es plazo dejaron de ser pestañas de la
misma barra.** Hasta hoy las ocho estaban en el mismo `tablist` separadas por
una etiqueta de grupo, y el criterio de Javier del 26/8 es que la etiqueta no
alcanza: dos pestañas una al lado de la otra son dos cosas del mismo rango, y
eso es justo lo que invita a leer un número de honorarios como si fuera de
plazos. Ahora hay **dos regiones independientes**: los plazos arriba con su
barra, y abajo —después de un corte y con título propio— «Honorarios y tasa».

**La segunda arranca sin nada elegido**, como dos tarjetas que hay que pedir.
Hace dos cosas: no carga dos páginas más al abrir el tablero, y se lee como otra
materia en vez de como una continuación de la barra.

Las dos regiones son independientes en serio: elegir la tasa **no cierra** el
plazo que quedó abierto arriba. Las flechas recorren su propia región y no
saltan a la otra —saltar volvería a decir que son lo mismo—, y los atajos 1-6
son sólo de plazos.

**El enlace directo sigue funcionando para las ocho**, y ahí hubo un bug que
costó encontrar y conviene no repetir: en el arranque hay que activar **primero**
la de plazos por defecto y **después** la del hash, porque cada `activar()`
reescribe el hash con `replaceState` y el último es el que queda. Al revés,
entrar por `#tasa` terminaba con la URL diciendo `#vencimientos`.

**El motor de iframes no se tocó.** La carga perezosa, la medición del alto
sobre el rect del `<body>`, la anulación de `min-height: 100vh` y la
sincronización de tema son las mismas líneas: es lo que costó encontrar y no
había motivo para reescribirlo.

**Y una medición que hizo falta tres veces para un badge de diez píxeles.** El
número de atajo daba **3,30** con `--faint` sobre `--border`; con `--muted-fg`
seguía en **3,96**, porque el relleno de `--border` oscurece el fondo. Quedó de
contorno y sin relleno, leyendo contra `--bg`: **5,16**. Fue la tercera aparición
del bug de `--faint` en el mismo día, y la que hizo que se arreglara de raíz esa
misma tarde: ver [el token, arreglado](#el-token---faint-arreglado-de-raíz--268).
El badge se queda en `--muted-fg` igual, por el tamaño y no por el token.

Verificado: contraste sin excepciones en los dos temas —peor 4,82 en claro,
5,06 en oscuro—, sin desborde a 375 px, y `vencimientos` embebida da la misma
fecha que suelta.

---

### El token `--faint`, arreglado de raíz — 26/8

**El bug estaba abierto desde el 12/8 y se había arreglado tres veces a mano.**
Javier: *«no lo veo... ni lo entiendo... arreglalo y listo»*, y tenía razón en
las dos cosas: no se ve, y se venía tratando como si fuera un problema de cada
pantalla.

**Qué era.** `--faint` es el gris de todo el texto chico —etiquetas de 11 px en
mayúsculas, colofones, fechas—. En tema claro daba **5,14 sobre `--card`** y
**4,30 sobre `--bg`**: pasaba AA sobre la tarjeta blanca y lo reprobaba sobre el
fondo de la página. O sea que el mismo texto, con el mismo color, cumplía o no
según arriba de qué estuviera.

**La causa no fue el valor: fue contra qué se lo midió.** El 5/8 se lo bajó
mirando la tarjeta, que en claro es la superficie **más clara** y por lo tanto la
más fácil. La regla que faltaba escrita, y que ahora está en `comun.css`:

> **en claro manda `--bg`, que es la superficie más oscura; en oscuro manda
> `--card`, que es la más clara.** Son opuestas. Medir contra una sola alcanza
> para que un token parezca bien en los dos temas y esté mal en uno.

**El arreglo.** `--faint: #5f6774` —4,78 / 5,71 / 5,18 sobre `--bg` / `--card` /
`--sunk`— en los **seis archivos donde viven los tokens**: `index.html`,
`documentacion.html`, `quien-soy.html`, `uma-uhom.html`,
`calculadoras/css/comun.css` y la plantilla de `scripts/build-docs.mjs`. Los dos
parches locales volvieron al token: `.cobertura` y `.colofon` de
`vencimientos.html`. En oscuro no se tocó nada: `#828a98` da 5,06 sobre `--card`,
que ahí es el piso.

### Y el control que hace que no vuelva: `npm run verificar-contraste`

`scripts/verificar-contraste.mjs`, en CI, sin red y sin `honorio/`. **Existe
porque un arreglo que se hizo tres veces no se arregla escribiendo bien la
cuarta.** Hace dos cosas, que son dos formas distintas de fallar:

1. **Contraste.** Cada token de texto —`--fg`, `--muted-fg`, `--faint`,
   `--accent`— contra **las tres superficies**, en los dos temas, con piso 4,5.
   Es exactamente lo que nadie hizo el 5/8.
2. **Deriva.** Los tokens están escritos seis veces porque son páginas sin
   build. El control exige que los seis archivos digan lo mismo, y que adentro
   de cada uno **los dos bloques oscuros coincidan** —el del `@media` y el de
   `[data-tema="oscuro"]`—, que es la regla que `comun.css` pide de palabra
   desde agosto y nada verificaba.

**Y encontró dos cosas que nadie había visto, que es lo que justifica que
exista:**

- **La plantilla de `build-docs.mjs` tenía los valores anteriores al 5/8.** Los
  diez documentos de dominio se publicaron todo ese tiempo con `--faint:
  #8b93a0`, que da **2,59 sobre el fondo** —contra 4,5— en la etiqueta del
  índice lateral, y `#6b7381` en oscuro, que da 3,68. **Peor que el bug que se
  estaba arreglando**, y no se veía mirando ninguna de las trece páginas porque
  esas diez las genera un script. Arreglado en el mismo commit.
- **`uma-uhom.html` ya tenía el valor nuevo** desde el 24/8 y las otras tres
  páginas sueltas no. Seis copias no se mantienen iguales solas y la deriva no
  aparece en ningún diff: cada archivo, por separado, se ve bien.

**Lo que el control mide y no hace fallar:** los tokens de estado. Ver
[Bugs abiertos](#bugs-abiertos).

**Lo que el control NO puede ver, y hay que seguir midiendo en pantalla:** que un
token esté bien no dice que esté usado sobre la superficie que se supone. El
badge del tablero pasó a 3,30 porque el relleno de `--border` oscureció el fondo,
y eso no está en ninguna declaración de token. El control cubre la paleta; el uso
se mide sobre estilos computados.

**Verificado en pantalla**, con `vencimientos.html` servida y con rompe-caché en
el `<link>` además del HTML —sin eso se mide el CSS anterior, que es la trampa
de siempre—: en oscuro no queda ni un texto abajo de AA, y en claro los que
quedaban por `--faint` —`.cobertura`, `.colofon` y los cuatro `<code>` del
colofón— pasaron de 4,30 a 4,78.

---

### La paleta de estados, bajada a AA — 26/8

El hermano de `--faint`, y con la misma causa: la paleta clara estaba calibrada
contra la tarjeta blanca. Decisión de Javier: *«corregí el bug de --warn, --ok
y --error… los colores de la paleta los elegiste vos de todos modos»*.

**La superficie que manda no es `--card` ni siquiera `--bg`: es el tinte del
propio estado encima de `--bg`**, porque un aviso casi nunca se escribe sobre
la superficie pelada, se escribe sobre su tinte, que es más oscuro. Ahí los
tres reprobaban, y `--warn` no llegaba **sobre ninguna de las tres
superficies**: 3,92 sobre `--bg`, 4,25 sobre `--sunk`, 4,68 sobre `--card`, y
3,58 sobre su tinte.

Se bajó la luminosidad conservando tono y saturación:

| token | antes | ahora | peor caso ahora |
|---|---|---|---|
| `--ok` | `#1f7a4d` | `#1c6e45` | 4,64 |
| `--warn` | `#9a6b12` | `#815a0f` | 4,64 |
| `--error` | `#a8482b` | `#9f4429` | 4,65 |

`--ok` y `--error` se mueven tan poco que no se ven; **`--warn` sí se ve más
ocre, y es el precio de que se lea.** En oscuro no se tocó nada: los tres
pasaban con holgura.

**Y `verificar-contraste` dejó de avisarlos y pasó a fallar con ellos**, con el
tinte incluido como fondo a medir. Probado al revés: devolviendo `--warn` al
valor viejo, el control corta con cuatro fallas y además delata la deriva
—`documentacion.html` diciendo una cosa y `comun.css` otra—.

---

### El tope de mediación era del ítem G, y no de la escala — 26/8

Estaba anotado desde el 8/8 como «el rótulo del tope está mal, el arreglo es
barato», y era lo único que mantenía a `honorarios-mediacion` afuera del
tablero.

**Qué decía mal.** La calculadora aplicaba el tope de 120 UHOM a toda la escala
y, cuando mordía, escribía «Aplicado tope máximo de 120 UHOM». El tope es del
**ítem G** —el que manda 2 % del monto cuando el reclamo pasa las 1000 UHOM—,
no de la escala: está en la tabla del Anexo III y en
[`09_MEDIACION.md`](domain/09_MEDIACION.md).

**Por qué vivió tanto, que es lo que vale la pena guardar:** los ítems A a F
topean en 20 UHOM, seis veces por debajo de 120, así que **el tope general
nunca podía morder**. La cuenta daba lo mismo con el error y sin él. Ninguna
comprobación aritmética podía cazarlo: lo único que estaba mal era lo que la
pantalla decía de su propia cuenta. En una herramienta que se usa para fundar
una regulación, eso no es cosmética —el que la usa copia la regla que la
pantalla nombra—, pero tampoco movía un peso, y por eso se dejó viva.

**Verificado que no movió un número:** un millón de pares (UHOM, monto)
—cinco valores de UHOM, el monto barrido de 0 a 20.000 UHOM en pasos de 0,1—
comparando la lógica vieja contra la nueva: **cero diferencias de importe**. Y
en pantalla, los cinco tramos: 20 UHOM da el ítem A, 500 el E, 2000 el G sin
tope (40 UHOM), 6000 justo en el borde (120 UHOM, sin aviso de tope porque no
lo supera) y 20.000 con el tope aplicado y dicho.

**Y con eso entró al tablero**, en la segunda región, con los otros dos que no
son plazos. Verificado: la tarjeta monta el iframe, mide alto, y el enlace
directo `#mediacion` en carga fría deja el hash donde corresponde —que es el
bug que costó encontrar al partir el tablero en dos regiones—.

---

### El banco de pruebas de las pantallas estuvo rojo desde el rediseño — 26/8

**Se descubrió corriéndolo**, que es la única forma: `pruebas-calculadoras.html`
no está en CI —maneja páginas reales por iframe y necesita el sitio servido—,
así que nada avisa cuando se rompe.

**26 de las 51 filas fallaban** con `Cannot set properties of null (setting
'value')`: las 13 de `vencimientos` sueltas y las mismas 13 adentro del tablero.
El motivo: el rediseño de esa misma mañana convirtió el `<select
id="modalidad">` en un control segmentado de dos `radio` con
`name="modalidad"`, y el driver seguía buscando el `<select>`. La lectura del
resultado estaba rota igual, por lo mismo: recortaba la fecha entre los rótulos
«Vencimiento del Plazo» y «Hora», que el rediseño se llevó.

**La lección, que es la parte que sirve:** las dos roturas son la misma. El
driver estaba anclado en **cómo se ve** la pantalla —el tipo de control, el
texto de los rótulos— y no en su estructura. Ahora hace click en el `radio` por
`value` —click y no `.checked = true`, porque el click es lo que dispara el
listener que pinta la etiqueta y esconde la ampliación— y lee la fecha de
`.veredicto .fecha`. **Un ancla estructural sobrevive a que cambie la
redacción; una sobre el texto visible, no.**

**Y lo que hay que hacer, aunque no se hizo:** el rediseño y el banco tienen que
correr juntos. Hoy hay que acordarse, y el 26/8 nadie se acordó durante las
horas que separaron el rediseño de esta corrida. **Verificado después del
arreglo: 51 de 51.**

---

### Pantalla contra motor, y la prueba de que el control controla — 26/8

**Qué prueba, que no es lo que prueban los otros bancos.** Desde este mismo día
las cinco pantallas de plazos consumen `js/plazos.js` y ninguna tiene aritmética
adentro, así que ya no puede haber dos cuentas distintas. Lo que sí puede haber,
y no lo controlaba nada, es **una pantalla que le pase al motor algo distinto de
lo que dice el formulario, o que muestre algo distinto de lo que el motor le
devolvió**. Un campo leído del `id` equivocado, un mes sin restarle uno, una
casilla que se ignora: el motor contesta perfecto y la pantalla miente igual.

Para cada caso ya escrito —los 21 verificados y los 3 fijados— se corre la
pantalla por su driver y **además se llama al motor a mano, en el mismo iframe y
por lo tanto con el mismo calendario cargado**, con lo que ese formulario debería
significar. Después se exige que las dos salidas coincidan, ya formateadas como
la pantalla las muestra.

**El mapeo de campos a opciones y el formato de la fecha están escritos otra vez
a propósito**, en vez de importarlos de algún lado. Un control que reusa el
código que controla no controla nada: lo que se comparan son dos lecturas
independientes del mismo formulario. Si una pantalla cambia cómo interpreta un
campo, este archivo tiene que cambiar también, y eso es la señal, no la molestia.

**Y se comprobó que falla cuando tiene que fallar**, que es lo único que
distingue un control de un sello verde. Se rompió `entre-fechas` a propósito
—`soloHabiles: false` fijo, o sea la casilla de días hábiles ignorada— y las dos
filas de hábiles se pusieron en rojo diciendo exactamente qué pasó: *«la pantalla
muestra 18 · el motor devuelve 3»*. Con el archivo revertido, **75 de 75**.

Un caso puede salir **«sin cruce»** y no es una falla: es una entrada para la que
el motor no afirma una fecha —año sin Acordada, objetivo inhábil, plazo mal
escrito— y entonces no hay dos valores que comparar. Hoy no hay ninguno.

**Lo que este cruce no prueba es que el motor esté bien.** Para eso están los
verificados, que comparan contra una fecha deducida a mano contra las Acordadas,
y `npm run verificar-calculos`.

---

### Tres arreglos que salieron de preguntar qué sale del navegador — 26/8

La pregunta la hizo Javier: *«no sé si en javiercuneo.com.ar prometemos que los
datos no salen del navegador o sólo en Honorio»*. **La respuesta era que no lo
prometemos** —la promesa está escrita en dos lugares y los dos son de
Escribiente, que es la única que la sostiene con la CSP—, así que no había
promesa incumplida. Pero leer las once para contestar dejó cosas para arreglar,
y se arreglaron todas.

> **Corregido el mismo 26/8, y conviene leer por qué.** Esta sección decía «dos
> arreglos» y eran tres: **`prorrateo` le pedía la UMA a la misma planilla de
> Google y el barrido no lo vio.** Se leyeron las once calculadoras una por una,
> y a `prorrateo` se la leyó por lo que calcula: la llamada está a cuatrocientas
> líneas del cálculo, adentro de un cargador de CSV con su propio parser. Un
> `grep` de `fetch(` sobre las once —que es lo que se hizo después— la encuentra
> en un segundo. **La lección no es «leer con más atención»: es que para una
> pregunta mecánica hay un control mecánico**, y usar el ojo donde va el `grep`
> es cómo se escribe una lista incompleta con toda confianza.

**`honorarios-mediacion` ya no le pide el UHOM a Google.** Lo lee de
`data/serie-uhom.json`. Dos problemas de distinto tamaño:

- **El chico, pero el que se ve:** abrir la calculadora le contaba a un tercero
  que alguien la abrió. Ningún dato del usuario salía —lo que se pedía era un
  valor— pero la IP y el momento sí.
- **El grande:** la planilla es una tabla suelta que se edita a mano y **nada la
  controla**. `data/serie-uhom.json` tiene los 67 valores leídos uno por uno de
  las 39 tablas oficiales, y `npm run verificar-series` le exige en cada commit
  que ninguna vigencia se repita, que la serie no baje y que cada valor tenga su
  tabla al lado. Es la misma serie que publica `uma-uhom.html`.

**Y elige el último valor cuya vigencia ya empezó, no el último del archivo.**
La diferencia aparece el día que se carga un valor por adelantado: el último del
archivo sería uno que todavía no rige, y esta calculadora fija honorarios de
hoy. **La pantalla dice desde cuándo rige** —«Rige desde agosto de 2026»— que es
lo que le permite a quien lo usa notar que la serie quedó corta. Y si el archivo
no se puede leer, no se inventa un valor ni se deja el anterior: se pide
cargarlo a mano.

**`prorrateo` ya no le pide la UMA a Google.** Lee `data/serie-uma.json`, con
la serie entera leída de los actos de la CSJN uno por uno. Es el mismo cambio y
por los mismos dos motivos. Y acá el efecto se nota además en la pantalla:
**la página ahora dice desde cuándo rige el valor y con qué resolución**
—«Rige desde el 01/07/2026 (Res. SGA 1930/2026)»—, donde antes el campo salía
con un número sin procedencia, o vacío.

Salió también el parser de CSV que leía la planilla, con su manejo de comillas
—estaba escrito dos veces, una en cada calculadora—. Era buen código y no hace
falta más: la fila que buscaba ya no existe.

**`distancia` ahora dice qué sale.** Con las otras dos arregladas es otra vez la
única del sitio que consulta afuera, y la única que siempre mandó algo escrito
por el usuario —las otras dos pedían un número público—: los nombres de localidad van a GEOREF,
a Open-Meteo Geocoding y a OSRM. Dos de los tres estaban nombrados abajo, en
«Método de Cálculo»; **OSRM no estaba en ninguna parte**. Ahora hay un aviso
arriba de todo que dice las tres cosas que importan: qué sale (el lugar), qué no
sale (fechas, plazos, nada del expediente), y que es la única del sitio que
consulta afuera.
**Neutro y no en `--warn`:** es información, no un peligro. Un aviso ámbar sobre
una herramienta que funciona bien enseña a ignorar los avisos ámbar.

**Y de paso se vio el efecto de la paleta bajada:** el bloque de advertencia
legal de esa página es `--warn` sobre `--warn-tint`, que hasta hoy daba **4,19**
en tema claro. Ahora da **5,52**, y es el peor de la página.

---

### `prorrateo` también le pedía la UMA a Google, y el control que lo caza — 26/8

**El barrido de «qué sale del navegador» de esta misma mañana dio una lista
incompleta, y la escribió con toda confianza.** Decía que las únicas dos
calculadoras que consultaban afuera eran `honorarios-mediacion` —arreglada ese
día— y `distancia`. Eran **tres**: `prorrateo.html` le pedía el valor de la UMA a
la misma planilla publicada de Google, en cada carga.

**Por qué no se vio, que es lo que importa.** Se leyeron las once una por una, y
a `prorrateo` se la leyó por lo que calcula. La llamada está a cuatrocientas
líneas del cálculo, adentro de un cargador de CSV con su propio parser de
comillas: un bloque que se lee como infraestructura y se saltea. **La lección no
es «leer con más atención». Es que para una pregunta mecánica —qué hosts aparecen
en estos archivos— hay un control mecánico**, y usar el ojo donde va el control
es exactamente cómo se produce una lista incompleta sin darse cuenta.

**El arreglo:** lee `data/serie-uma.json`, el mismo movimiento que se hizo con el
UHOM y por los mismos dos motivos —abrir la página dejaba de contarle a un
tercero que alguien la abrió, y la planilla es una tabla suelta que se edita a
mano y no la controla nada—. Elige el último valor **cuya vigencia ya empezó**, y
**ahora la pantalla dice desde cuándo rige y con qué resolución**: «Rige desde el
01/07/2026 (Res. SGA 1930/2026)». Antes el campo salía con un número sin
procedencia, o vacío. Si el archivo no se puede leer no se inventa nada: se pide
cargarlo a mano.

#### `npm run verificar-red`

`scripts/verificar-red.mjs`, en CI, sin red y sin `honorio/`. Busca cada host que
aparezca en **las quince páginas que se publican** y exige que esté en una lista
con **el motivo escrito al lado**. Hoy son trece hosts.

Dos listas y no una, porque no es lo mismo:

- **Desconocido** —«no está en la lista»— es «esto es nuevo, decidilo».
- **Prohibido** es «esto ya se sacó a propósito», y el mensaje dice cuándo y por
  qué. Hoy el único es `docs.google.com`.

**No mira si la llamada se ejecuta ni cuándo**, y es deliberado: un host
nombrado en un comentario cuenta igual que uno en un `fetch()`. La pregunta que
contesta es «a quién nombra este sitio», y afinarla para distinguir código de
prosa la volvería otra vez dependiente de leer bien, que es el problema que vino
a resolver.

**Una sola exclusión, escrita a la vista:** `calculadoras/honorarios.html`, que
se retiró el 7/8 y cuya URL publica el aviso de `redirects/honorarios-retirada/`.
El archivo tiene el `fetch` a la planilla y **no llega al sitio**.

**Comprobado que falla cuando tiene que fallar**, con las dos formas: se metió a
mano un `docs.google.com` y un host inventado en `tasa.html`, y salieron los dos
con mensajes distintos y salida 1.

**Y de paso, `*.yml text eol=lf` en `.gitattributes`.** Los workflows llevan
bloques `run: |` que el runner ejecuta como shell, y sin regla propia la copia de
trabajo en Windows se los lleva con CRLF: la próxima edición de una línea
aparece como el archivo entero. Es el mismo agujero que ya se había tapado para
`.sh` y `.mjs`.

---

### La red de las que no son de plazos, que va antes de refundarlas — 26/8

**`scripts/pruebas-no-plazos.html`, 18 casos sobre las cuatro que no comparten
(hoy 20: los de `prorrateo` se refijaron el 27/8 y entraron dos más)
motor.** Hasta hoy `prorrateo`, `tasa`, `honorarios-mediacion` y
`ejecucion-estado` **no tenían ni una comprobación**, y la decisión de Javier es
refundarlas de cero. Un refactor sin red no se distingue de un error: la red va
primero. Es el mismo orden que se usó con las de plazos, donde el banco de las
pantallas se construyó *antes* de extraer la aritmética.

**Son fijados y no verificados**, y la diferencia importa: no dicen que el número
esté bien, dicen que es el que la calculadora devuelve hoy. Cuando un caso se
derive a mano contra la norma se lo asciende y se escribe el porqué. Los casos
están escritos en **entradas y salidas, no en ids**: cuando la pantalla se
refunda hay que reescribir el driver, y eso es esperado.

Qué cubre cada una, y por qué esos casos:

- **`prorrateo`** (5): el art. 730 CCyC. Se leen los seis números de la pantalla
  **y el prorrateo de cada fila**, porque el total puede quedar bien con las
  filas repartidas mal. Hay un par deliberado —la misma base con la tasa dentro
  y fuera— que es el único que distingue las dos cosas que hace la casilla:
  suma la tasa a la base de comparación pero **no** al total que se reparte.
- **`honorarios-mediacion`** (6): los bordes de la escala. 30 UHOM exactos y un
  peso más, 1000 exactos, el 2 % del ítem G y el tope de 120. Un `<=` cambiado
  por `<` no se ve en ningún otro lado.
- **`tasa`** (3): los tres incisos del art. 4 de la Ley 23.898 que la pantalla
  arma distinto. El de desalojo existe por el multiplicador por seis cánones,
  que es lo que un refactor pierde sin que se note.
- **`ejecucion-estado`** (8 desde el 28/8): los cuatro cruces —antes o después
  del 31 de julio, con o sin la partida agotada— más el 31 exacto, que es el
  borde; los tres de la puerta de entrada, que llevan la misma notificación y
  sólo cambian la fecha de la obligación; y uno que no mira ningún número y fija
  las cinco normas que cita la línea de tiempo.

**Cada caso carga su propia UMA y su propio UHOM.** Las dos calculadoras que los
usan los leen de `data/`, así que un caso que no los fijara pondría el banco en
rojo el día que la CSJN publica un valor nuevo, sin que nada se haya roto.

**Comprobado que falla cuando tiene que fallar:** se movió el tope del ítem G de
120 a 130 UHOM y salieron dos casos en rojo. **Dos y no uno**, y ahí está lo
interesante: el segundo caso ni siquiera cambia de número —da 40 UHOM con
cualquiera de los dos topes— y falla igual, porque el fijado incluye **la frase
con la que la pantalla explica su propia cuenta**. Es exactamente el error del
tope del ítem G que vivió meses: la aritmética estaba bien y el rótulo mentía, y
ninguna comprobación numérica podía cazarlo.

**Y el hook de datos personales bloqueó el commit, con razón aparente.** Los
importes fijados —`1.500.000,00`— matchean el patrón de «número con forma de
DNI». Es texto copiado de la pantalla, así que no se les puede poner el signo de
peso adelante, que es la salida que el patrón ya preveía. **Se le agregó un
lookahead de centavos: un DNI no lleva decimales.** No es aflojar el patrón —no
deja pasar ninguna forma que un documento pueda tener— sino sacarle una que nunca
fue suya. Y como el archivo es la fuente única de los cuatro repositorios, el
cambio vale para los cuatro y se ve en un diff, que es como tiene que ser. Los
importes que sí eran prosa propia se escribieron con el signo, que además es
como se escriben.

#### Tres cosas que costaron encontrar, y las tres eran del driver

Van escritas porque el síntoma no se parece en nada a la causa, que es la marca
de las trampas que vale la pena anotar:

- **`resetCalculator()` de `prorrateo` limpia el monto del proceso.** Llamándolo
  después de cargar los campos, los honorarios sumaban bien y el tope, el 25 % y
  el porcentaje daban cero: se leía como un bug del prorrateo.
- **`honorarios-mediacion` escribe el UHOM del archivo en el campo cuando el
  `fetch` vuelve**, o sea después de que el driver puso el suyo. Fallaba **sólo
  el primer caso** —para el segundo ya había cargado— y el número salía
  plausible. Es la misma forma de falla que el predicado de «página lista» del
  otro banco, y se arregla igual: exigir el texto del estado final.
- **`ejecucion-estado` no lee sus campos al avanzar: lee su propio estado**, que
  mantiene un listener de `input`. Y el iframe se reusa entre casos, así que el
  asistente quedaba parado en el resultado del anterior. Corría el primer caso y
  los otros tres decían «no apareció el paso de la fecha».

---

### `honorarios-mediacion` rehecha, y qué explica esta pantalla — 27/8

**Es la primera de las cuatro que van de cero, y se empezó por acá a propósito:
es la más chica de las cuatro.** El patrón que salga sirve para las otras tres, y
el riesgo de estrenarlo es el más bajo posible.

**Qué estaba mal, y era de forma y no de cuenta.** Dos campos del mismo peso que
el resultado; el resultado adentro de un recuadro punteado, que lo hacía parecer
provisorio; y la regla aplicada escrita en una línea de prosa al pie. **La
escala, que es lo único que explica el número, no se veía por ningún lado.**

#### Qué explica esta pantalla, que no es lo mismo que explican las otras

En `vencimientos` el dibujo es un calendario y en `caducidad` una línea de hitos.
Acá la pregunta es otra: no *cómo se llegó a la fecha* sino **por qué ese importe
y no otro**, y la respuesta entera es la escala. Así que el equivalente del
dibujo es **la escala misma, con el tramo aplicado marcado y los otros seis al
lado**, cada uno con su importe en pesos al UHOM cargado.

**Y no es decoración, porque esta escala se lee mal con la intuición que uno
trae del art. 21 de la 27.423: no es progresiva.** Un asunto de 200 UHOM no paga
«lo del tramo anterior más el excedente»: paga 12 UHOM y punto. Viendo los siete
tramos juntos eso se entiende solo; con el importe suelto no hay forma de
saberlo. Va escrito además en una línea, una sola vez, abajo de la tabla.

Se agregó también **el monto del asunto expresado en UHOM**, que es el número que
decide el tramo y que hasta ahora era invisible: el usuario cargaba pesos y la
pantalla contestaba pesos, sin mostrar nunca la magnitud con la que la norma
razona.

#### La escala pasó de cadena de `if/else` a tabla, y por qué eso no es un refactor de gusto

La pantalla ahora **muestra los siete tramos**, y con la cadena de `if/else` habría
que escribirlos una segunda vez para dibujarlos. **Dos copias de una escala legal
en el mismo archivo es exactamente lo que no puede pasar**, así que la tabla es
la fuente única y el cómputo la recorre.

**No es una simplificación y el orden se conservó:** se recorre de arriba abajo
con la misma comparación `monto <= hasta * uhom` y en el mismo orden que tenían
las ramas, así que los bordes caen donde caían —30 UHOM exactos es el ítem A y no
el B—. El ítem G sigue siendo su propio caso, con `uhom: null`, que es la misma
forma que tiene `ESCALA_MEDIACION` en Honorio.

**Verificado con 32.352 pares (UHOM, monto)** cruzados entre la cadena vieja y la
tabla nueva —los bordes exactos de cada tramo con un centavo y un peso a cada
lado, más un barrido denso de medio UHOM en medio UHOM sobre ocho valores de
UHOM—: **idénticos el honorario, la letra del ítem y si se aplicó el tope**. La
implementación nueva no se copió al script de cruce: se lee del propio HTML, para
no estar comparando una copia contra sí misma.

#### El banco marcó cinco casos, y eso estuvo bien

`pruebas-no-plazos` puso en rojo los cinco de mediación. **Los cinco importes son
idénticos carácter por carácter**; lo único que cambió es la prosa de la regla,
que se reescribió a propósito. Se volvieron a fijar comprobando que el importe y
el valor en UHOM fueran los mismos que estaban.

**Es la primera vez que el banco sirvió para lo que se construyó**, un día
después de construirlo, y salió bien la parte difícil: no dijo «pasa» ni dijo
«falla», dijo **qué** cambió, y leyendo el detalle se ve en un segundo que ningún
número se movió.

El driver hubo que tocarlo en dos puntos, que es lo previsto cuando una pantalla
se refunda: el predicado de «página lista» —el texto del estado cambió— y la
lectura del resultado, que miraba el atributo `hidden` de un bloque que ya no
existe.

#### Y una trampa más del panel oculto

Probando la pantalla embebida en el tablero, el iframe medía 584 px con 1033 de
contenido: parecía que la refundación había roto el ajuste de alto. **No: con el
panel oculto el `ResizeObserver` tampoco dispara**, igual que
`requestAnimationFrame` y las transiciones. Se comprobó midiendo `vencimientos`
embebida en la misma corrida —642 contra 1092, el mismo desfase— y ésa no se
tocó. Está anotado en las trampas.

---

### `prorrateo` rehecha, y el tope que estaba escrito duro — 27/8

**Es la segunda de las cuatro que van de cero, y la primera que además movió un
número.** En `honorarios-mediacion` lo que estaba mal era de forma y ningún
importe cambió; acá había las dos cosas.

#### El 22 % estaba escrito duro, y por eso daba mal en dos casos que la propia pantalla ofrece

El HTML anterior calculaba el techo y el tope como dos constantes separadas:

```js
const percent25 = montoProcess * 0.25;   // el techo del art. 730
const tope730   = montoProcess * 0.22;   // lo que se reparte entre honorarios
```

**De dónde sale el 22 %:** el art. 730 topea las costas —«incluidos los
honorarios profesionales, de todo tipo»— en el 25 % de la condena, y la tasa de
justicia es costas. Con la tasa del 3 % del art. 2 de la Ley 23.898, a los
honorarios les quedan 22 puntos. **La cuenta es correcta en ese caso y sólo en
ése**, y la pantalla ofrece los otros dos:

- **Tasa cargada a mano distinta del 3 %.** Con la tasa reducida del art. 3
  inc. c —1,5 %, o sea $150.000 sobre un proceso de $10.000.000— el art. 730 le
  deja a los honorarios $2.350.000 y la pantalla los topeaba en $2.200.000:
  **prorrateaba $150.000 de menos.**
- **La casilla de la tasa destildada.** Si la tasa no integra la base no hay
  nada que descontarle al 25 %, y el tope seguía siendo el 22 %.

**Ahora el tope se deriva:** `tasaEnBase ? max(0, techo − tasa) : techo`. Con la
tasa del 3 % adentro de la base —que es como la pantalla arranca— da exactamente
el 22 % de siempre. **Decidido por Javier el 27/8**, planteado antes de escribir
una línea, porque cambia lo que una herramienta publicada le dice a un abogado.

**El `max` con cero no es defensivo por las dudas:** una tasa a mano mayor al
25 % de la condena hace la resta negativa, y un tope negativo repartido en
proporción devuelve honorarios **negativos**. Hay un fijado pegado a ese borde.

#### Qué explica esta pantalla, que no es lo mismo que explican las otras

En `vencimientos` el dibujo es un calendario, en `caducidad` una línea de hitos y
en `honorarios-mediacion` la escala. Acá la pregunta es otra otra vez: no *cómo
se llegó a la fecha* ni *por qué ese tramo*, sino **por qué no se cobra lo que se
reguló** —o por qué sí—, y eso es una comparación entre dos cantidades.

Así que el dibujo son **dos barras a la misma escala**: las costas reguladas
—tasa, honorarios que se cobran, y lo que el art. 730 recorta— contra el techo
del 25 % —tasa, honorarios usados, y el margen que sobra—. Una comparación entre
dos números que sólo se escriben es la clase de cosa que se lee tres veces;
puestos uno encima del otro se ve de una.

**Y el dibujo sirve para los dos desenlaces**, que es la prueba de que es el
dibujo correcto: cuando hay prorrateo la barra de arriba se pasa, y cuando no
hay, se queda corta. **Ese «quedarse corto» también es información** —dice cuánto
margen queda abajo del techo— y con el HTML anterior no se veía en ningún lado:
sin prorrateo la pantalla mostraba un cartel de advertencia y las columnas en
cero.

#### La columna «prorrateado» decía 0,00 cuando no había prorrateo

Es el único otro cambio visible de números, y es una corrección de forma. Cuando
las costas no llegaban al 25 %, la pantalla ponía **0,00** en la columna de cada
profesional. **Se lee como que ese profesional no cobra nada, y lo que pasa es
exactamente lo contrario**: cobra todo lo que le regularon. Ahora la columna
repite el importe regulado, que no es redundante —es la respuesta—.

#### El banco: 5 fijados pasaron a 7, y sólo uno cambió de número

De los cinco que había, **el reparto por fila de tres salió idéntico carácter
por carácter**, que es lo que había que probar: con la tasa del 3 % adentro de la
base el tope da 22 % y no se movió un centavo. El que cambia es el de la tasa a
mano, que es el arreglo. Se agregaron dos: la tasa fuera de la base —la otra
mitad del mismo arreglo, que no cubría ningún caso— y la tasa que se come el
techo entero.

**Y apareció una cosa que el banco no podía cazar solo.** El driver anterior
hacía `incluirTasaCheckbox.checked = !!campos.incluirTasa`, así que **tres de los
cinco casos corrían con la tasa fuera de la base** —que no es lo que la pantalla
muestra al abrirse— y la configuración por omisión **no la probaba nadie**. Ahora
el driver hace `!== false`: se prueba lo que se ve, y el otro camino se pide
explícito. Es la misma clase de error que el rompe-caché de los iframes: el banco
corría, pasaba, y no estaba mirando la pantalla que el usuario abre.

**Y el `porque` del quinto fijado estaba mal escrito.** Decía «acá NO llega al
25 % y no hay prorrateo» al lado de un `esperado` que prorrateaba $2.200.000.
$2.400.000 más $150.000 es 25,50 %: sí llega. La prosa contradecía al número
que estaba en la misma línea.

**Verificado:** 20 de 20 en `pruebas-no-plazos`, `npm run verificar-contraste` y
`npm run verificar-red` sin novedad, sin desborde horizontal a 375 px —la tabla
hace scroll adentro de su propia caja—, y embebida en el tablero con el alto
exacto y sin errores de consola.

#### Lo que queda abierto, y es del art. 730 y no de la pantalla

**El art. 730 in fine no se computa.** El último párrafo dice que para el cómputo
del 25 % *«no se tendrá en cuenta el monto de los honorarios de los profesionales
que hubieran representado, patrocinado o asistido a la parte condenada en
costas»*. La pantalla no tiene forma de marcar una regulación como del
profesional del condenado, así que **hoy todas entran en la base**, y en un
pleito donde el condenado tuvo letrado propio eso infla las costas computadas y
puede disparar un prorrateo que no corresponde. No se agregó porque es una
función nueva y no una refundación de la forma. **Va acá, que es donde va lo que
está abierto.**

---

### Los textos de las cinco de plazos, unificados contra `vencimientos` — 27/8

**Pedido de Javier el 27/8:** *«hay que hacer además una revisión exhaustiva de
los textos que muestran todas las calc con referencia a que la más actualizada es
vencimientos. ejemplo regresiva dice "años disponibles..." que es distinto de
como lo declara vencimientos»*.

#### Lo mismo se llamaba de cinco maneras, y tres tenían un defecto propio

| Pantalla | Lo que decía |
|---|---|
| `vencimientos` | «Calculadora disponible para los años 2021 - 2027, salvo los plazos que caigan en la feria de invierno de 2027: esa Acordada de la CSJN todavía no se dictó.» |
| `caducidad` | «Calculadora disponible (feriados 2021-2027, 7 años)» |
| `entre-fechas` | «Calculadora disponible para los **anios**: 2021, 2022, 2023, …» |
| `regresiva` | «Años disponibles: 2021, 2022, … (según feriados y **adicionales**)» |
| `mora` | «Años **soportados**: 2021 - 2026» |

- **`entre-fechas` decía «anios», sin tilde, en texto que ve el usuario**, y
  enumeraba los siete años uno por uno en vez de dar el rango. Su caso sin datos
  decía «La API de feriados no esta disponible» —sin tildes, y contándole al
  usuario que hay una API, que es implementación—.
- **`regresiva` decía «adicionales»**, que es el nombre de un archivo del
  repositorio y no una palabra del fuero.
- **`mora` decía «soportados»**, calco de *supported*.

#### Pero lo que importaba no era el rótulo

**El motor devuelve `missingFeriaYears` —los años cuya Acordada de feria todavía
no se dictó— y hasta hoy lo leía UNA SOLA de las cinco pantallas.** Las otras
cuatro tenían el dato disponible y prometían el año entero; el cómputo se negaba
recién en julio, con el caso ya cargado. Eso no es una diferencia de estilo: es
una pantalla que promete algo que la de al lado sabe que no puede cumplir.

Ahora las cinco arman el aviso con la fórmula de `vencimientos`, y las cinco
nombran la feria faltante. Verificado en las cinco pantallas servidas: dicen el
mismo renglón, carácter por carácter.

#### Dos cosas que salieron al hacerlo

**`mora` subdeclaraba su propia cobertura.** Anunciaba «2021 - <año actual>»
mientras `yearsToFetch` llega hasta `y0 + 1`: calcula el año que viene sin
problema y decía que no. Ahora anuncia lo mismo que las otras cuatro.

**Y `mora` es la única de las cinco que no carga el calendario al arrancar**: lo
carga al calcular, con los años que hagan falta según la fecha cargada. Un primer
intento puso el aviso completo en el arranque y leía una lista vacía. Por eso
el aviso se dice **en dos tiempos**: el rango primero, y la salvedad de la feria
después del `init`, desde `actualizarCobertura()`.

#### El banco de las pantallas se puso rojo, y estuvo bien

`pruebas-calculadoras` reportó **«regresiva: no terminó de cargar en 12 s»** en
las tres filas de esa pantalla. No era la pantalla: el predicado de «página
lista» buscaba `/Años disponibles/`, que era **el rótulo viejo de esa sola**.
El síntoma es el peor de todos —indistinguible de una pantalla rota— y es la
misma clase de trampa que el rompe-caché de los iframes. Ahora los cinco
predicados buscan la fórmula única.

#### Lo que queda de este barrido, y es una decisión de nombre

**`regresiva` se llama «Calculadora de plazos judiciales» y `vencimientos`
«Vencimiento de plazos judiciales».** Puestas al lado en el tablero no se
distinguen, y la que tiene el nombre genérico es la que hace lo menos común de
las dos. Es una decisión de Javier y no se tocó.

Y quedan las diferencias que son de rediseño y no de texto, que van con la
pasada de aspecto de cada pantalla:

- **Los títulos**: `vencimientos` dice «Vencimiento de plazos judiciales», sin la
  palabra «Calculadora», que en un sitio de calculadoras no agrega nada. Las
  otras cuatro la llevan.
- **Los botones**: `vencimientos` dice «Calcular» / «Limpiar». Las otras dicen
  «Calcular Vencimiento» —con mayúscula—, «Calcular fecha límite», y
  `entre-fechas` dice **«Resetear»**, que es calco.
- **`mora` tiene a la vista un botón «Forzar recarga (cache)»**, que es un
  control de depuración.
- **Los rótulos**: `caducidad` usa dos puntos («Meses (1-6):»), `regresiva` y
  `mora` usan asteriscos de obligatorio y el formato entre paréntesis
  («Fecha objetivo (DD/MM/AAAA) *»). `vencimientos` no usa ninguna de las tres
  cosas: el campo es de tres cajas y el formato no hace falta explicarlo.
- **Colores planos que el sistema no usa**, y que en tema oscuro pintan mal:
  `caducidad` tenía `#059669` y `#dc2626` en el aviso de cobertura —cambiados a
  `--ok` y `--error` de paso, que es un mapeo directo—; quedan `#ffe6e6`,
  `#fcf8e3`, `#8a6d3b` y `#5a6268` en `entre-fechas`, y `#ff4d4f`, `#fff0f0` y
  `#f8fdf8` en `mora`.

**Lo de `tasa` y `ejecucion-estado` no se tocó a propósito**: van de cero, así
que escribirles el texto ahora es escribirlo dos veces.

---

### `tasa`: el diagnóstico antes de refundarla, y un cero en silencio — 27/8

**Pedido de Javier el 27/8:** *«la de tasa quiero que antes pensemos un poco en
cómo se muestran los resultados, quiero que sea un aplicativo más cómodo y
especialmente cuando querés sumar varios cálculos de tasa se muestra muy
incómodo (ejemplo sucesión pedís inscripción de bien y automóvil)»*.

**No se escribió una línea de la pantalla nueva.** Esto es el relevamiento, para
decidir con el mapa a la vista.

#### El campo de titularidad devuelve cero sin que nadie haya escrito nada

En la pantalla de sucesiones cada bien lleva un campo de **titularidad** —qué
parte del bien era del causante— y la cuenta es
`valuación × titularidad × alícuota × (1 + sobretasa)`.

Probado en la pantalla servida, con un inmueble de CABA valuado en
$100.000.000:

| Qué hay en el campo | Tasa que muestra |
|---|---|
| **nada, como arranca la pantalla** | **$ 0,00** |
| `0` | $ 0,00 |
| `50`, `50%` o `1/2` | $ 787.500,00 |
| `100` | $ 1.575.000,00 |

**La primera fila es el problema y la segunda no.** Lo marcó Javier el 27/8 y
tiene razón: *«si dejas 0 de titularidad entonces el causante no es titular y
entonces no deberías tributar nada de tasa en ese caso»*. Escribir `0` y que dé
cero es correcto, y con más razón porque si ya se pagó se puede pedir la
devolución.

**Lo que está mal es que un campo que nadie tocó se lea igual que un cero
escrito.** Cargás la valuación, mirás el subtotal, dice $0,00, y vos no
declaraste nada todavía. La decisión ya tomada —que el campo vacío valga
100 %— arregla eso y **deja el caso de Javier intacto**: vacío da $1.575.000 y
`0` escrito sigue dando cero.

Ninguno de los tres casos de prueba de `tasa` lo cubre, porque los tres son de
la otra pantalla.

#### Por qué se siente incómoda: la pantalla modela mal el problema

Hoy hay **dos niveles de anidamiento**. Un desplegable de «objeto del juicio»
arriba; si la respuesta es «sucesión», cada tipo de bien abre una **sección
propia** con su segundo desplegable, su tabla y su `+`, y hay un tercer botón
para agregar otra sección. El ejemplo de Javier —un inmueble y un automóvil—
son hoy **dos secciones con dos desplegables**, y son dos renglones.

Lo que hay abajo de todo eso son **siete reglas**, y nada más:

| Regla | Base | Alícuota | Titularidad | Sobretasa |
|---|---|---|---|---|
| Sumas de dinero, art. 4 inc. a | reclamado con intereses | 3 % | — | — |
| Desalojo, art. 4 inc. b | valor del alquiler | 3 % **× 6 cánones** | — | — |
| Inmuebles, art. 4 inc. c | valuación fiscal o mayor valor | 3 % | — | — |
| Otros (incs. d, f, h) | según el inciso | 3 % | — | — |
| Sucesión · sumas de dinero | importe | 1,5 % (art. 3 inc. c) | — | — |
| Sucesión · inmueble CABA | valuación fiscal | 1,5 % (art. 3 inc. c) | sí | sí, 5 % |
| Sucesión · inmueble otras jurisdicciones | valuación fiscal | 0,75 % (art. 4 inc. g, 2ª parte) | sí | sí, 5 % |
| Sucesión · automóvil, sociedad, otros | valuación o certificación | 1,5 % (art. 3 inc. c) | sí | — |

Siete reglas y tres modificadores por renglón —el multiplicador del desalojo, la
titularidad y la sobretasa—. **Eso es una lista, no un árbol.**

#### La propuesta: una sola lista, como `prorrateo`

Un renglón por concepto: **descripción · regla · base · [titularidad] ·
[sobretasa] → tasa**, y el total grande arriba, que es lo que se vino a buscar.
La regla es un desplegable **por renglón**, con el inciso escrito al lado; los
dos campos que sólo tienen sentido en algunas reglas aparecen sólo ahí.

El caso de Javier queda en dos renglones de la misma tabla, con reglas distintas
y un total. Sin secciones, sin el segundo desplegable, sin los tres botones de
agregar.

Es la misma forma que ya funciona en `prorrateo` —tabla de filas con
modificadores por fila, veredicto grande— y **eso también contesta qué explica
esta pantalla**: no *por qué ese tramo* ni *por qué no se cobra lo regulado*,
sino **de dónde sale cada peso del total**. Con el inciso y la alícuota en cada
renglón, la tabla es la explicación, y es además exactamente la planilla que se
acompaña al expediente: encaja con el imprimible que Javier pidió el mismo día.

#### Decidido por Javier el 27/8

**La forma va: una sola lista.** Y con una corrección suya que mejora la
propuesta: *«la gracia de declarar el objeto del juicio antes es que te da una
suerte de hint del valor que tenés que ingresar»* —como hace Honorio en parte—,
con el ejemplo *«al elegir desalojo ya te dice que pongas un solo alquiler
porque el sistema está calculando los 6 meses que son la base»*.

**Eso no pelea con la lista: la mejora.** El hint es la función real del
desplegable global, y en la lista vive mejor, porque aparece **en el renglón que
se está cargando** y no arriba de toda la pantalla. Cada regla del desplegable
trae su hint pegado al campo de base. Y el ejemplo sale textual del inciso: el
art. 4 inc. b dice «el valor actualizado de seis (6) meses de alquiler», así que
la base legal son seis meses y la pantalla pide uno.

**La sobretasa se deja como está y no se escribe nada.** Javier: *«es más
costumbre judicial que norma pura (difícil de encontrar fallo al respecto) pero
nadie lo va a cuestionar y es opcional»*. O sea que **la ausencia de norma citada
es deliberada y no un olvido**, y por eso queda anotada acá: la próxima lectura
va a encontrar un 5 % sin artículo al lado y ésta es la explicación.

**La titularidad va con 100 % por omisión.** Con una aclaración que importa,
porque en el intercambio quedó al revés: **hoy vacío calcula CERO**, no 100 %.
No es que esté bien y haya que confirmarlo; es un arreglo.

**El permalink se toma de Honorio**, donde ya está resuelto sin que salga nada
del navegador. Deja de ser una pregunta abierta de diseño y pasa a ser copiar un
mecanismo que existe: hay que ir a leerlo a
[`javiercuneo/honorio`](https://github.com/javiercuneo/honorio) antes de inventar
nada.

#### Cuánto de la ley cubre hoy, que es la respuesta a «que no sea sólo civil»

Pedido de Javier el 27/8: *«en algún momento habría que hacer algo más piola y
cubrir toda la ley de tasa… para que sea una calculadora completa referencia
para todo y no solo civil»*. La ley está en
`C:/IA/knowledge/raw/normativa`, **con el número mal en el nombre del
archivo** —dice «Ley N° 23.889» y la de tasas judiciales es la **23.898**; el
contenido es el correcto—.

Leída entera, esto es lo que la pantalla **no** cubre:

- **Art. 3, la reducción del 50 %, casi entero.** Hoy sólo se usa el inc. c
  (sucesorios). Quedan el **b** (mensura y deslinde), el **d** (protocolización
  e inscripción de testamentos extendidos fuera de jurisdicción nacional), el
  **f** (reinscripción de hipotecas y prendas) y el **g** (recursos directos
  contra resoluciones del PEN, provincial o municipal).
- **Art. 4 inc. e — quiebras y concursos.** En la quiebra, el importe de la
  liquidación de bienes; en el concurso preventivo, los créditos verificados. Y
  la **Ley 25.972** pone alícuotas propias para los acuerdos homologados:
  **0,75 % y 0,25 %**, que no son la del art. 2 ni la reducida.
- **Art. 4 inc. i — laboral.** El monto de la condena según la primera
  liquidación firme; y el desalojo laboral, que también es de seis meses pero
  **del último salario**. **Este es el inciso que hace que hoy sea «sólo
  civil».**
- **Art. 4 inc. j** — el monto de la resolución que se apela, y si no tiene
  monto, indeterminable.
- **Art. 5 — monto indeterminable** y **art. 6 — juicios sin valor pecuniario**.
  El art. 6 no es una alícuota: es **una suma fija que actualiza la CSJN**.
  **Hoy son $4.700, fijados por la Acordada CSJN 15/2022, de mayo de 2022** —dato
  de Javier el 27/8—.

  **Y no hay que inventar nada para manejarlo, porque el problema ya se resolvió
  dos veces en este mismo repositorio.** Javier lo planteó así: *«no sé cómo
  podríamos manejar el input para cambiarlo manualmente de forma sencilla sin
  tocar código y sin hardcodearlo»*. La respuesta son las dos mitades que ya
  usan `honorarios-mediacion` con el UHOM y `prorrateo` con la UMA:

  1. **El valor vive en un archivo de datos, no en el código**: un
     `data/tasa-monto-fijo.json` con la misma forma que `data/serie-uma.json`
     —un valor, desde cuándo rige, y qué norma lo fijó—. Cambiarlo es editar
     tres líneas de texto, y queda versionado con la norma al lado.
  2. **La pantalla lo muestra en un campo que se puede pisar a mano**, para
     liquidar con el valor de otra fecha sin tocar el archivo.

  Que se actualice cada varios años lo hace **más fácil** que la UMA, no más
  difícil: es el mismo mecanismo con menos ediciones. Y hereda gratis el aviso
  que ya tienen las otras dos —dice desde cuándo rige el valor, que es lo que
  permite notar que quedó viejo—.

**Dos de esos no son «un inciso más»**: el art. 6 trae una serie nueva, y la
25.972 trae alícuotas que la pantalla hoy no sabe representar.

#### Sobre la entrevista previa, que Javier dejó abierta

Planteado por él: *«quizás hay que hacer una entrevista previa para llegar al
número final, no lo sé»*. **Mi recomendación es que no**, y el motivo es de uso y
no de gusto: una entrevista es buena la primera vez y estorba a partir de la
segunda, y la tasa se calcula seguido. Honorio puede permitírsela porque una
regulación es un acto ocasional. El hint en el renglón da lo mismo que la
entrevista —decirte qué número va— sin cobrar el peaje cada vez.
**Sin decidir.**

#### Los dos ejes de la ley, y el error que costó no verlos — 27/8

**Javier volteó el interruptor de sucesorio**, y con un argumento que resultó ser
la clave del diseño entero: *«no sé para qué hay que separar sucesión de todo el
resto, parece darle más jerarquía, y si elegís, no sé, quiebra, no hace el mismo
cálculo que sumas de dinero. No sé cuál es el beneficio de dividir en dos algo
que tiene más divisiones»*.

Tiene razón, y leyendo el art. 3 entero se ve por qué. **La reducción del 50 % no
es de los sucesorios: es de seis supuestos**, y el sucesorio es uno.

| Art. 3 | Supuesto |
|---|---|
| inc. b | Juicios de mensura y deslinde |
| inc. c | Juicios sucesorios |
| inc. d | Testamentos, declaratoria de herederos e hijuelas extendidos fuera de jurisdicción nacional |
| inc. f | Reinscripción de hipotecas o prendas |
| inc. g | Recursos directos contra resoluciones del PEN, provincial o municipal |
| inc. h | Tercerías |

(Los incs. a y e están derogados.) Partir la pantalla en «sucesión» y «el resto»
le da a un inciso una jerarquía que la ley no le da.

##### Y no verlo ya costó plata

La pantalla actual junta tres supuestos abajo del rótulo «Otros» y les aplica
3 % a los tres. Probado el 27/8 con $10.000.000:

| Supuesto | Lo que cobra hoy | Lo que manda la ley |
|---|---|---|
| Bienes muebles, art. 4 inc. d | 3 % → $300.000 | 3 % — correcto |
| Reinscripción de hipotecas, art. 4 inc. **f** | 3 % → $300.000 | **art. 3 inc. f: reducida — $150.000** |
| Tercerías, art. 4 inc. **h** | 3 % → $300.000 | **art. 3 inc. h: reducida — $150.000** |

**Cobra el doble en dos de los tres.** Y la ironía es exacta: los agrupó
*porque compartían la alícuota del 3 %*, que es lo que le impidió ver que dos de
los tres no la comparten. **Agrupó por el eje equivocado.**

##### La ley tiene dos ejes y hay que cruzarlos a mano

- **El art. 4 dice QUÉ NÚMERO SE TOMA**: el monto reclamado, seis meses de
  alquiler, la valuación fiscal, los créditos verificados, la condena laboral.
- **Los arts. 2 y 3 dicen QUÉ ALÍCUOTA SE LE APLICA**: 3 % general, o la mitad
  en los seis supuestos de arriba, o las especiales.

**Y las letras de los incisos no se corresponden entre los dos artículos**, así
que el cruce hay que hacerlo a mano y es donde se pierden cosas. La reinscripción
de hipotecas es el inc. f en los dos, y las tercerías el inc. h en los dos; pero
los sucesorios son el **art. 3 inc. c** y el **art. 4 inc. g**. Coincide a veces
y a veces no: no hay regla que ahorre leer.

##### La propuesta que sale de ahí: dos desplegables por renglón

En vez de un desplegable con la combinación ya hecha —que es lo que produce
«Inmuebles CABA en sucesión» y la explosión de casos—, cada renglón pregunta las
dos cosas por separado:

1. **Qué se toma** (art. 4): sumas de dinero · seis meses de alquiler ·
   valuación fiscal de inmueble · bienes muebles · créditos verificados ·
   condena laboral · suma garantizada · valor del crédito o del bien…
2. **Qué alícuota** (arts. 2 y 3, más las especiales): 3 % general · reducida
   50 % con el motivo elegido de la lista de seis · 0,75 % de extraña
   jurisdicción · las concursales.

**Diez opciones más ocho, en vez de ochenta combinaciones.** El segundo
desplegable arranca en «3 %, general — art. 2», que es el caso más común, así
que en el juicio corriente no se toca. Y **filtra según el primero**, porque hay
cruces imposibles: la reducción por extraña jurisdicción sólo existe en el
sucesorio, y las concursales sólo con créditos verificados.

**La sucesión deja de ser especial y pasa a ser una opción del segundo
desplegable**, al lado de mensura, testamentos, reinscripción de hipotecas,
recursos contra el PEN y tercerías. Que es lo que es en la ley.

**Y la repetición se resuelve sin partir nada:** un renglón nuevo hereda la
alícuota del anterior. En una sucesión con seis bienes se elige «reducida,
sucesorio» una vez y los otros cinco renglones ya vienen con eso.

##### Dos casos que no entran en los dos ejes, y hay que preverlos

- **El monto fijo de los arts. 5 y 6** no tiene base ni alícuota: es un importe.
  Ese renglón oculta el campo del monto y muestra el valor vigente.
- **La tasa concursal del art. 3 es una escala de dos tramos y SÍ es
  progresiva**, a diferencia de la de mediación: 0,75 % de los créditos
  verificados comprendidos en el acuerdo preventivo, y **0,25 % sobre el
  excedente** de $100.000.000. Un renglón con una alícuota sola no la
  representa. Conviene además mirar si ese piso de $100.000.000, escrito en
  2002, sigue vigente sin actualización.

#### El contraste que no dejaba leer, arreglado — 27/8

Reportado por Javier: *«en este momento la app genera un contraste que no
permite leer los campos»*. **Medido antes de tocar nada, en tema oscuro:**

| | Antes | Después | Mínimo AA |
|---|---|---|---|
| Encabezado de tabla | **1,03** | 16,17 | 4,5 |
| Cuadro de aviso | **1,04** | 12,43 | 4,5 |

**1,03 no es «poco legible»: es invisible.** Y el mecanismo vale escribirlo
porque se repite: el fondo estaba escrito a mano —`#f2f2f2` en los encabezados,
`#e9f7ef` en los avisos— y **el texto sí salía de un token del sistema**. En tema
claro los dos son claros y funciona de casualidad; al pasar a oscuro el texto se
vuelve casi blanco y el fondo se queda casi blanco. **Un color fijo no rompe
solo: rompe cuando está al lado de uno que sí sigue el tema.**

Salieron los diez colores fijos que tenía la pantalla, mapeados a los tokens:
`#f2f2f2` → `--sunk`, `#e9f7ef` → `--accent-tint`, `#598392` → `--accent`,
`#ccc` → `--border`, `#eee` → `--hair`, `#fafafa` → `--sunk`. **Y los campos de
carga no declaraban ni fondo ni color propios**: los venía pintando el navegador
por su cuenta, que acertaba de casualidad. Ahora salen de `--card` y `--fg`.

**Es un arreglo y no la refundación.** Verificado: los 20 casos de
`pruebas-no-plazos` pasan, incluidos los tres de `tasa`. Ninguna cuenta se movió.

#### La lectura de la ley de Javier, y tres artículos que faltaban — 27/8

Javier hizo su propia lectura, independiente. **Coincide con la de acá en los
dos ejes y en los seis supuestos de reducción**, y agrega cuatro cosas:

- **El art. 3 inc. d es sucesión internacional.** Los «juicios voluntarios sobre
  protocolización e inscripción de testamentos… extendidos fuera de jurisdicción
  nacional» no son una categoría suelta: *«para inscribir esos actos tenés que
  abrir la sucesión, no hay otra forma»*. Ese dato no está en el texto de la ley
  y decide cómo se rotula la opción.
- **El excedente concursal se toma textual.** Los $100.000.000 del art. 3 vienen
  de 2002 y quedaron congelados. Decisión de Javier: *«yo lo tomaría textual (no
  voy a buscar jurisprudencia de la Cámara Comercial ahora)»*. **La herramienta
  aplica la ley como está escrita y no interpreta la erosión del monto.**
- **La propiedad industrial no la declara la ley.** El art. 4 inc. d remite a lo
  que «la Dirección Nacional de la Propiedad Industrial perciba para la
  solicitud de registros», o sea a un arancel externo. No hay número que
  calcular desde acá.
- **El desalojo laboral no es un supuesto nuevo**: es el mismo «seis meses» del
  desalojo común, cambiando alquiler por salario. Una opción de la lista de
  bases, no una rama.

##### Art. 8: las ampliaciones y las reconvenciones son juicios aparte

*«Las ampliaciones de demanda y las reconvenciones estarán sujetas a la tasa,
como si fueran juicios independientes del principal.»* Javier: *«hace que en la
app debas poder combinar distintas pretensiones»*.

**Y la lista de renglones ya sirve para eso**, con una precisión que conviene no
perder: como se liquidan **por separado**, el renglón tiene que poder marcarse
como ampliación o reconvención. Sumarlas para saber el total es útil, pero el
imprimible tiene que mostrarlas distinguidas o dice algo que la ley no dice.

##### Art. 9: la calculadora dice cuánto y no dice cuándo

Ocho incisos de formas y oportunidades de pago, y **la pantalla puede decirlo
sola en cuanto se eligió el supuesto**, que es lo que propuso Javier. No es un
adorno: el momento cambia por completo según el caso.

| Supuesto | Cuándo se paga |
|---|---|
| Art. 4 incs. a, b, c, d y h | Todo al iniciar las actuaciones, con reajuste posterior si la liquidación definitiva da más |
| Quiebras y liquidaciones administrativas | Antes de cualquier pago o distribución de fondos de la venta |
| Concursos preventivos | Al notificarse la homologación del acuerdo, o la resolución que verifica créditos después |
| Reinscripción de hipotecas y prendas | Todo al iniciar |
| Sucesorios y testamentos de extraña jurisdicción | **Al inscribir la declaratoria de herederos o el testamento aprobado** |
| Separación de bienes | Al promover la liquidación de la sociedad conyugal, y **cada cónyuge puede pagar su cuota parte** |
| Petición de herencia | Al determinarse el valor de la parte del peticionario |
| Laboral | **Una vez firme la sentencia de condena y la primera liquidación** |
| Recurso directo (art. 3 inc. g) | Dentro del quinto día de recibidos los autos, previa intimación por cédula |

**Y el art. 9 trae dos supuestos que el art. 4 no tiene**: la separación de
bienes (inc. e) y la petición de herencia (inc. f). No aparecen en el mapa de
bases, y **la petición de herencia la resolvió Javier el 27/8**: la base es lo
que le toca al peticionario. *«Si para el heredero le corresponde, de los 3
bienes que hay, 1, ese es el valor.»* O sea que no hace falta una base nueva:
son los mismos bienes del art. 4, limitados a la porción del peticionario, que
es exactamente lo que ya hace el campo de titularidad. **Queda abierta sólo la
separación de bienes**, donde además cada cónyuge puede pagar su cuota parte.

##### Art. 13: las exenciones, con la forma que ya existe en Honorio

Diez incisos. Javier: *«así como en Honorio están los mínimos y el buscador de
mínimos por término literal, las exenciones: un resumen de ese artículo y
búsqueda textual»*. Beneficio de litigar sin gastos, habeas corpus y amparo no
denegados, derechos políticos, sede penal sin acción civil, trabajadores y
sindicatos, jubilaciones y pensiones, rectificación de partidas, quien alega no
ser parte, familia sin carácter patrimonial —alimentos y litisexpensas
incluidos—, y ejecuciones fiscales.

**El patrón ya está construido del otro lado**, así que acá hay que ir a mirarlo
antes de escribir, igual que con el permalink.

##### Y el hint del art. 5 que pidió Javier

Cuando el renglón sea de monto indeterminable, la pantalla tiene que decir que
**eso es a cuenta** y que la tasa se completa al terminar el proceso, dentro de
los cinco días de la sentencia o del modo anormal de terminación. Hoy no lo dice
nadie.

#### Las diez pruebas de la pantalla de sucesiones — 27/8

**Era la condición para tocar la pantalla, y ya está.** El banco pasó de 20 a 30
casos. Hasta hoy los tres de `tasa` eran todos de la otra pantalla, así que la
parte con más cuentas —tres alícuotas, la titularidad y la sobretasa— no la
miraba nadie.

Las cuentas están verificadas a mano una por una contra
`valuación × titularidad × alícuota × (1 + sobretasa)`:

| Caso | Da | Por qué está |
|---|---|---|
| Inmueble CABA, 100 %, con la sobretasa | $1.575.000 | Es lo que sale sin tocar nada: la sobretasa viene marcada de fábrica |
| El mismo con la sobretasa destildada | $1.500.000 | Los dos juntos aíslan el único número que no sale de la ley |
| **Campo de titularidad sin tocar** | **$0,00** | **Congela un error a propósito** |
| Titularidad `0` escrita | $0,00 | Acá cero está bien, y el par con el anterior marca la diferencia que hoy no existe |
| Titularidad `1/2` | $787.500 | Se escribe así en una hijuela |
| Titularidad `50%` | $787.500 | Las tres formas de escribir la mitad tienen que dar lo mismo |
| Inmueble fuera de jurisdicción nacional | $750.000 | La alícuota más fácil de romper: 3 % a la mitad, y a la mitad otra vez |
| Un automóvil | $300.000 | **Mira las columnas**: lleva titularidad y NO sobretasa |
| Sumas de dinero en la sucesión | $150.000 | El único de los cuatro sin titularidad ni sobretasa |
| **Inmueble + automóvil** | $1.875.000 | El caso que disparó todo esto |

##### Por qué el caso del cero se fija con el número equivocado

Porque fijar el número correcto dejaría el banco **rojo desde el día uno**, y un
banco que arranca en rojo deja de servir para lo único que sirve: avisar cuando
se rompe algo nuevo. Así que se anota el valor de hoy con el porqué al lado, y
el caso dice **qué esperado hay que poner cuando se arregle**: `total 1575000.00`.

El caso de al lado —titularidad `0` escrita— existe para el día del arreglo:
tiene que **seguir dando cero**. Es lo que va a probar que tratar el vacío como
100 % no se llevó puesto el cero legítimo, que es el que Javier defendió.

##### Dos casos miran las columnas y no sólo los números

Que a los muebles les falte la columna de sobretasa **no se ve en ningún
número**: si un refactor se la agrega, el total no cambia hasta que alguien la
marque, y para entonces ya está cobrando de más. Al revés en sumas de dinero: si
apareciera una titularidad, el campo vacío la pondría en cero y el resultado se
caería a $0,00. Por eso esos dos casos fijan también los encabezados.

##### El driver tuvo una trampa que conviene no volver a pisar

El iframe se reusa entre casos y queda armado con el anterior. Hay que **pasar
por la opción vacía del desplegable** antes de volver a elegir «Sucesión», que
es lo que vacía el contenedor. Sin ese paso, el segundo caso hereda las
secciones del primero y el total sale sumado: un síntoma que no se parece en
nada a la causa. Es el mismo tipo de trampa que ya había aparecido en el driver
de `ejecucion-estado`.

#### Los dos bugs de `tasa`, cerrados — 27/8

Los dos estuvieron abiertos unas horas: se encontraron preparando la
refundación, se cubrieron con casos de prueba y se arreglaron el mismo día. **El
banco pasó de 30 a 33 y las 33 pasan.** (Con la refundación de esa misma tarde quedó en 45.)

##### El cobro doble: «Otros» se partió en tres

La opción «Otros» juntaba tres supuestos y les aplicaba 3 % a los tres. Ahora son
tres opciones del desplegable, cada una con su base y su alícuota:

| Opción nueva | Base | Alícuota |
|---|---|---|
| Bienes muebles y otros derechos | art. 4 inc. d | **3 %** — la general |
| Reinscripción de hipotecas o prendas | art. 4 inc. f, la suma garantizada | **1,5 %** — art. 3 inc. f |
| Tercerías de dominio o de mejor derecho | art. 4 inc. h, el valor del crédito o del bien | **1,5 %** — art. 3 inc. h |

Una tercería de $10.000.000 pasó de $300.000 a $150.000. Hay un caso fijado por
cada una de las tres, y el de muebles está **para que el arreglo no baje de
más**.

**Y esto ya es un pedazo de la estructura nueva.** Separar por alícuota es
exactamente lo que van a hacer los dos desplegables; acá se hizo a mano para tres
supuestos porque estaban cobrando mal hoy.

##### La titularidad: vacío vale 100 %

`parseTitularidad()` es la función nueva, y la distinción está escrita en el
código para que no se pierda:

- **campo vacío → 1** (100 %). Antes daba `NaN`, el `|| 0` lo volvía cero, y un
  inmueble de $100.000.000 mostraba $0,00.
- **`0` escrito → 0.** No es un bug: si el causante no era titular no se tributa.
- **texto que no se puede leer como número → 0.** Eso sí es haber tocado el
  campo, y no se adivina.

El campo lleva ahora `placeholder="100 %"`, que dice qué se aplica si no se
escribe nada **sin cargar un valor**: un valor cargado obligaría a borrarlo para
poner otro.

**Los dos casos de prueba que estaban puestos hicieron exactamente su trabajo:**
el del campo vacío nació congelando el error con el esperado correcto escrito al
lado, y el del `0` escrito —que se agregó el mismo día— confirmó después del
arreglo que tratar el vacío como 100 % **no se llevó puesto el cero legítimo**.

---

### `tasa` refundada: los dos ejes en una lista — 27/8

**El pedido de Javier era de comodidad** —*«especialmente cuando querés sumar
varios cálculos de tasa se muestra muy incómodo (ejemplo sucesión pedís
inscripción de bien y automóvil)»*— **y abajo había un problema de modelo.** El
diagnóstico entero está [arriba](#tasa-el-diagnóstico-antes-de-refundarla-y-un-cero-en-silencio--278);
esto es lo que se construyó.

#### Qué es ahora la pantalla

Una **lista de renglones**, uno por pretensión, y cada renglón declara por
separado las dos cosas que la ley separa:

| | Qué contesta | De dónde sale |
|---|---|---|
| Primer desplegable | **qué número se toma** | art. 4, once bases |
| Segundo desplegable | **qué alícuota se le aplica** | arts. 2 y 3, nueve alícuotas |

**Once opciones más nueve, en vez de las ochenta combinaciones** que produce
tener la combinación ya hecha adentro de cada opción. El segundo desplegable
arranca en «3 %, general — art. 2», que es el caso corriente, así que en el
juicio común no se toca.

**El caso de Javier son dos renglones de la misma tabla** y da lo mismo que
antes: **$1.875.000**, comprobado en la pantalla servida y fijado en el banco.
Antes eran dos secciones con dos desplegables y un botón para agregar la
segunda.

**La sucesión dejó de ser una rama.** Es una opción del segundo desplegable, al
lado de mensura y deslinde, testamentos de extraña jurisdicción, reinscripción
de hipotecas, recursos directos contra el PEN y tercerías, que son los otros
cinco supuestos que el art. 3 reduce al 50 %. Es lo que argumentó Javier al
voltear el interruptor de sucesorio, y tenía razón.

#### El filtro es el arreglo del cobro doble, hecho estructural

El segundo desplegable **sólo ofrece los cruces que la ley admite**. Una tercería
ofrece una sola alícuota —la reducida del art. 3 inc. h— y no hay forma de
cobrarle el 3 %. Lo mismo la reinscripción de hipotecas, el recurso directo y los
créditos verificados del concurso.

**Eso es exactamente el bug del 27/8 a la mañana, pero cerrado por construcción
en vez de a mano.** Aquel cobro doble salió de agrupar tres supuestos *porque
compartían el 3 %*, que es lo que impidió ver que dos de los tres no lo comparten.
Con los dos ejes en desplegables distintos, agrupar por el eje equivocado ya no
es una opción disponible.

**Hay un caso de prueba que pide el cruce mal a propósito** —una tercería al 3 %—
y comprueba que la pantalla no se lo da: devuelve $150.000 y no $300.000.

#### La herencia entre renglones, y el bug que apareció al probarla

Un renglón nuevo **hereda la alícuota del anterior**: en una sucesión con seis
bienes se elige «reducida, sucesorio» una vez y los otros cinco ya vienen con
eso. Es lo que reemplaza a las secciones sin partir nada.

**Y heredar sólo la alícuota no funcionaba.** El renglón nuevo nacía con la base
por omisión —sumas de dinero, art. 4 inc. a—, que **no admite** la alícuota
sucesoria, así que el filtro la tiraba abajo antes de que la persona tocara nada
y el segundo bien de la sucesión aparecía al 3 %. **En el caso de Javier eso daba
$2.175.000 en vez de $1.875.000: el automóvil cobrado al doble.**

Lo encontró el caso de prueba de la herencia, escrito el mismo día. **Se hereda
también la base**, y con eso el segundo renglón nace idéntico al primero y sólo
hay que cambiarle lo que cambie.

Vale anotar por qué el caso lo cazó y el de al lado no: **el par está armado para
eso**. Un caso declara las dos alícuotas y el otro deja que la segunda se herede,
y los dos tienen que dar el mismo total. Si la herencia se rompe, el segundo salta
y el primero sigue verde.

#### El hint en el renglón, que era la función real del desplegable global

Cada base trae su pista pegada al campo del importe, que es la corrección de
Javier: *«la gracia de declarar el objeto del juicio antes es que te da una
suerte de hint del valor que tenés que ingresar… al elegir desalojo ya te dice
que pongas un solo alquiler porque el sistema está calculando los 6 meses que
son la base»*. **En la lista vive mejor que arriba de toda la pantalla**, porque
aparece en el renglón que se está cargando y cambia con el desplegable de al
lado.

**Los dos multiplicadores que la ley pone adentro de la base están declarados y
se aplican solos**: el desalojo son seis meses de alquiler (art. 4 inc. b) y el
desalojo laboral seis del último salario (art. 4 inc. i). Cuando el importe
cargado no es el imponible, el renglón escribe el imponible abajo del campo:
«Imponible $3.000.000 — × 6 meses».

#### La titularidad ahora se ve escrita, y cambió de eje

**Se decidió que sí**, que era la pregunta abierta: el renglón escribe
`× 100 % de titularidad` abajo del campo aunque nadie haya escrito nada. **Es el
campo que ya causó un cero en silencio**, y mostrar el factor que se está usando
es lo único que hace evidente que se aplicó un 100 % que nadie declaró. El campo
sigue vacío con `placeholder="100 %"`: cargarle el valor obligaría a borrarlo
para poner otro.

**Y colgó del eje correcto.** Antes la titularidad aparecía en tres de los cuatro
tipos de bien de la pantalla de sucesiones y no en el cuarto —las sumas de
dinero—, sin ninguna razón legal: el dinero del acervo puede ser ganancial igual
que el inmueble. Ahora **depende de la alícuota y no del tipo de bien**: aparece
en las tres sucesorias (art. 3 incs. c y d, y el 0,75 % del art. 4 inc. g) y en
ninguna otra. **De paso resuelve la petición de herencia del art. 9 inc. f**,
donde la base es la porción que le toca al peticionario, que es exactamente lo
que hace este campo.

**La sobretasa, en cambio, se dejó donde estaba**: sólo sobre inmuebles de una
sucesión, que es donde se usa. Hay un caso de prueba que mira qué modificadores
muestra cada renglón, porque que a los muebles les falte la sobretasa **no se ve
en ningún número**: si un refactor se la agrega, el total no cambia hasta que
alguien la marque, y para entonces ya está cobrando de más.

#### El dinero del acervo cambió de inciso, y el número no se movió

La pantalla anterior tenía «Sucesión · Sumas de dinero» como cuarto tipo de bien.
**El art. 4 inc. g dice que en los sucesorios el valor de los bienes «se
determinará como lo establece en los incisos c) y d)»**: la plata del acervo es
un bien mueble —inc. d—, no una suma de dinero reclamada —inc. a, que es una
pretensión contenciosa—. Ahora se carga como bien mueble.

Misma alícuota, mismo número —$150.000 sobre $10.000.000—, y la cita queda bien.
El caso de prueba se conservó con el número intacto y el porqué reescrito.

#### Dejó de ser sólo civil

Con los dos ejes separados, agregar un supuesto es agregar una fila a una de las
dos tablas. Entraron los que faltaban y no necesitaban maquinaria nueva:

| Qué entró | Dónde |
|---|---|
| Quiebra: el importe de la liquidación de los bienes | base, art. 4 inc. e |
| Concurso preventivo: los créditos verificados | base, art. 4 inc. e |
| Laboral: el monto de la condena según la primera liquidación firme | base, art. 4 inc. i |
| Desalojo laboral: seis meses del último salario | base, art. 4 inc. i |
| Recurso directo: el monto de la resolución que se apela | base, art. 4 inc. j |
| Mensura y deslinde, testamentos de extraña jurisdicción, recursos directos | alícuota, art. 3 incs. b, d y g |
| La concursal: 0,75 %, y 0,25 % sobre el excedente | alícuota, art. 3, Ley 25.563 |

**El inc. i era el que hacía que fuera «sólo civil»**, y era el pedido de Javier:
*«cubrir toda la ley de tasa… para que sea una calculadora completa referencia
para todo y no solo civil»*.

**La concursal sí necesitó maquinaria: es la única escala progresiva de la ley.**
0,75 % de los créditos verificados, y 0,25 % **sobre el excedente** de
$100.000.000. Una alícuota sola no la representa, así que la alícuota puede
declarar tramos. Con $200.000.000 son $750.000 más $250.000: **$1.000.000**.
Leerla como no progresiva —0,25 % sobre todo— daría $500.000, la mitad, que es el
error más probable y el que el caso de prueba caza. **El piso de $100.000.000 se
toma textual**, escrito en 2002 y sin actualizar, por decisión de Javier.

#### El art. 9 lo dice sola la pantalla

Un panel abajo de la lista dice **cuándo se paga cada renglón cargado**, que es
lo que propuso Javier y no es un adorno: el momento cambia por completo según el
caso. Sale de los renglones y se deduplica.

**Y depende del segundo eje, no del primero**, que es lo que hace que valga
tenerlo derivado: un inmueble se paga al iniciar las actuaciones si es un juicio
común (art. 9 inc. a) y **al inscribir la declaratoria de herederos** si es de una
sucesión (inc. d). El mismo número, dos momentos distintos.

#### Una red de seguridad que salió de una falla del banco

Si el desplegable de la alícuota queda en un valor que la base no admite —pasa
cuando algo le asigna un `value` que no existe entre las opciones: **el `<select>`
se va a la cadena vacía y no avisa**— el renglón dejaba de calcular en silencio y
el total no lo contaba. **Un renglón cargado que aporta cero es peor que un
error: parece una cuenta.** Ahora `calcular()` revisa cada renglón antes de leerlo
y lo resincroniza. Lo destapó el caso del cruce imposible.

#### El banco: de 33 a 37, y el driver reescrito

**El driver se reescribió entero, y eso estaba previsto**: es lo que pasa cuando
se refunda una pantalla, y no invalida los casos. Los dos drivers de antes
—`tasa` y `tasa-sucesion`, que existían porque la pantalla eran dos— son uno solo.

**Los casos no se reescribieron: se remapearon.** Los números esperados son los
mismos que fijaba el banco anterior, que es toda la gracia. Lo que cambió es cómo
se pide el caso —`{tipo:'inmueblesCABA'}` pasa a ser
`{base:'inmueble', alicuota:'sucesorio'}`— y el formato de la salida, porque la
pantalla nueva muestra los importes formateados en vez de `1575000.00` pelado.

Los cinco casos nuevos cubren lo que antes no existía: **la herencia de la
alícuota** —que encontró el cobro doble del automóvil—, **los dos tramos de la
escala concursal**, **el cruce imposible** y **el inmueble al 3 % en un juicio
común**, que es el par que hace visible que la reducción la trae el supuesto y no
el tipo de bien.

**Y una decisión de la pantalla la fijó un caso viejo:** con la titularidad en `0`
el total grande dice **$ 0,00 y no una raya**. La raya es «todavía no se cargó
nada»; acá se cargó todo y la respuesta es cero, que es la que defendió Javier.

#### Qué se tocó afuera de la calculadora

**La prosa que la describe envejeció con el cambio**, que es la lección de
[las cinco cifras](#las-cinco-cifras-que-este-repositorio-sigue-de-honorio). Tres
lugares decían «orientada a procesos civiles» y ya no es cierto: `index.html`,
`README.md` y `documentacion.html`. Los tres actualizados en el mismo commit.

---

### El monto fijo y el imprimible: lo que la lista desbloqueaba — 27/8

Los dos estaban esperando a que existiera la lista de renglones, que es lo que
decía el orden de trabajo. Con la lista hecha, los dos entraron el mismo día.

#### El monto fijo de los arts. 5 y 6

**No es una alícuota: es un importe, y no lo fija la ley sino la Corte.** El
art. 6 dice AUSTRALES 250.000 a junio de 1990 y manda a la CSJN actualizarlo;
hoy son **$4.700, Acordada 15/2022**, para las demandas y reconvenciones
presentadas desde el 1/7/2022.

**Javier lo planteó como un problema** —*«no sé cómo podríamos manejar el input
para cambiarlo manualmente de forma sencilla sin tocar código y sin
hardcodearlo»*— **y ya estaba resuelto dos veces en este repositorio.** Las dos
mitades son las mismas que usan `honorarios-mediacion` con el UHOM y `prorrateo`
con la UMA:

1. **El valor vive en `data/tasa-monto-fijo.json`**, con la misma forma que
   `data/serie-uma.json`: un valor, desde cuándo rige, qué norma lo fijó.
   Cambiarlo es editar tres líneas de texto y queda versionado con la norma al
   lado.
2. **La pantalla lo muestra en un campo que se puede pisar a mano**, para
   liquidar con el valor de otra fecha sin tocar el archivo.

**El campo aparece sólo cuando hay un renglón que lo usa.** Es un dato de la ley
que casi nadie va a tocar: tenerlo siempre a la vista lo pondría al mismo nivel
que los renglones, que es donde está el trabajo.

**El archivo arranca en 2022 y le falta un valor a propósito.** Hubo por lo
menos una adecuación anterior —la Acordada 41/2018, que la nota de Infoleg
nombra **sin decir el importe**— y no se cargó porque no se leyó el texto.
Cargar un número que no se vio es exactamente lo que este archivo existe para
evitar.

**`npm run verificar-series` controla las tres.** Los controles ya eran
genéricos, así que fue conectar la tercera: vigencia repetida, serie que baja,
acto imposible. **Y se probó rompiéndolo**, porque un control que nunca falló no
es un control: con un valor de 2020 pegado abajo del de 2022, el script marca las
dos fallas —el orden y el valor que baja— y sale con 1.

**Una diferencia con la UMA que hay que tener presente:** acá el acto es
**anterior** a la vigencia, y no al revés. La Corte publicó la acordada en mayo y
la aplicó desde julio. El control que exige que el acto no preceda a la vigencia
se saltea con `sin_demora`, que es el mismo campo que ya usaba la serie de la UMA
para sus tres casos raros.

**El art. 5 no agrega una cuenta, agrega un aviso**, y era un pedido de Javier:
la suma se paga **a cuenta**, y la tasa se completa al terminar el proceso,
dentro de los cinco días de la sentencia definitiva o del modo anormal de
terminación, con intimación por cédula. Vive en «Cuándo se paga», que es su lugar
natural: es un hecho sobre el momento, no sobre el monto.

**Y hubo que decidir qué hace la alícuota efectiva con esto.** Un renglón de
monto fijo no tiene monto imponible, así que dividir el total por el imponible
daría una alícuota que nadie aplicó: el numerador tendría plata que no salió de
ninguna base. **La tira dice «no aplica: hay una suma fija en el total»** en vez
de mostrar un número. El monto imponible del renglón se declara en cero a
propósito y no en el valor de la suma fija, por lo mismo.

#### El imprimible, que es la liquidación del art. 4 *in fine*

*«En todos los casos al momento de efectuarse el pago de la tasa se acompañará
la correspondiente liquidación detallada del monto imponible.»* **La planilla es
parte del pago, no un adorno de la calculadora**, y la lista de renglones ya
*era* esa planilla: lo único que faltaba era poder sacarla en papel.

**Se imprime la página, no se descarga un archivo.** `window.print()` deja elegir
impresora o PDF con el diálogo del sistema, y no hay que generar ni servir nada.
El bloque vive en el DOM, oculto en pantalla, y `@media print` apaga todo lo
demás. Se compone como un documento y no como una pantalla: negro sobre blanco,
sin tarjetas y sin acento. **Los colores fijos son correctos ahí y sólo ahí**
—el papel no tiene tema claro ni oscuro— y por eso viven adentro del `@media
print` y no en `:root`, que es donde el bug del 27/8 a la mañana enseñó que no
hay que ponerlos.

La hoja lleva, por renglón: **concepto · qué se toma con su inciso · importe
declarado · monto imponible · alícuota con su cita · tasa**, y abajo el total,
la tabla del art. 9 con los momentos de pago que correspondan y la aclaración de
que la sobretasa del 5 % es costumbre y no ley.

#### El art. 8, que no es un tercer eje sino una etiqueta del renglón

*«Las ampliaciones de demanda y las reconvenciones estarán sujetas a la tasa,
como si fueran juicios independientes del principal.»* Y el art. 7 dice lo mismo
de las tercerías.

**No cambia ningún número: cambia cómo se presentan.** Cada renglón declara si es
del juicio principal, una ampliación de demanda o una reconvención, y **el
imprimible agrupa por eso, con un subtotal por grupo**. El total sigue estando
—es lo que uno vino a buscar— pero con una línea al lado que dice que **no se
integra de una sola vez**. Sumarlas sin decirlo afirmaría algo que la ley no
dice: que se liquidan juntas.

**Se dejó para este paso a propósito**, y esa decisión quedó escrita el mismo
día: sin imprimible, la marca no hace nada visible.

**El caso de prueba de esto no mira el total, mira la agrupación**, y es lo que
lo hace valer: si la agrupación se pierde, los tres importes siguen siendo los
mismos y el total también. Fija los encabezados de grupo con su subtotal.

#### El banco: de 37 a 40

Tres casos nuevos: el juicio sin valor pecuniario del art. 6, el monto
indeterminable del art. 5 —**mismo número y por eso el par vale**: lo que cambia
no es el monto sino lo que la pantalla dice en «Cuándo se paga»— y el imprimible
con una reconvención.

**Y el driver ganó una espera que ya había hecho falta antes.** La página lee el
monto fijo con `fetch` y lo escribe en el campo cuando llega, o sea **después**
de que el driver puso el suyo: es la misma trampa que ya había pisado el driver
de `honorarios-mediacion` con el UHOM, y el síntoma es el peor posible —falla
sólo el primer caso, con un número plausible—. La condición de «listo» ahora
exige que el estado deje de decir que está buscando.

**El monto fijo lo fija el caso, siempre**, aunque no lo use: si se dejara el del
archivo, el banco se pondría en rojo el día que la Corte saque una acordada nueva
sin que nada se haya roto. Es el mismo criterio que ya tenían la UMA y el UHOM.

---

### Las exenciones del art. 13 y el permalink, los dos copiados de Honorio — 27/8

Los dos últimos pendientes de `tasa`, y los dos tenían la misma indicación
escrita: **el patrón está construido del otro lado, hay que ir a mirarlo antes
de escribir.** Se hizo así, y en los dos casos lo que se copió no fue el código
—Honorio es React y esto es un HTML suelto— sino **las decisiones**.

#### Las exenciones: una tabla de referencia, no un trámite

Pedido de Javier: *«así como en Honorio están los mínimos y el buscador de
mínimos por término literal, las exenciones: un resumen de ese artículo y
búsqueda textual»*.

Lo que se trajo de `minimos-view.tsx` y de `lib/minimos-buscar.ts`:

- **Se abre mostrando los diez incisos y se filtra escribiendo.** No hay que
  elegir una categoría para ver algo.
- **Búsqueda textual y no semántica, a propósito.** Son diez incisos fijos que
  sólo cambian cuando cambia la ley. Un índice semántico traería un modelo, un
  build y una desincronización posible, para resolver algo que se resuelve
  normalizando tildes.
- **Insensible a tildes, mayúsculas y orden de las palabras**, con una
  normalización que **conserva la posición de cada carácter**: es lo que permite
  resaltar la coincidencia sobre el texto original, con sus tildes puestas.
- **Tolerancia de raíz para el plural y el género**, que es casi toda la
  distancia entre cómo se busca y cómo está escrita la ley. Un token coincide
  entero o sin sus últimas una o dos letras, y cuanto más se recorta, más larga
  tiene que quedar la raíz: así `art` o `bis` no se vuelven comodines.
- **`alias`, sólo donde el nombre de tribunal no coincide con el de la ley.**

**Los alias son el mecanismo que más conviene entender, y hay un caso de prueba
que existe sólo para eso:** la palabra **«apremio» no aparece en ninguna parte
del art. 13** —el inc. j dice «ejecuciones fiscales»— y es como se lo llama en
el tribunal. Sin el alias, el buscador devuelve cero justo cuando alguien busca
bien. **Los alias no son contenido jurídico**: lo que el inciso dice lo dice su
texto, que está entero y a un clic.

**Con una búsqueda puesta los incisos se abren solos.** Si el que busca escribió
«alimentos», esconderle detrás de un clic el texto donde aparece la palabra es
hacerle buscar dos veces.

**Y hay un caso que fija que el buscador devuelva CERO**: buscar «sucesión» no
trae nada, y está bien. **Un sucesorio no está exento**: tiene la tasa reducida
del art. 3 inc. c, que es otra cosa. El art. 13 enumera diez exenciones y no
admite otras, y la pantalla lo dice con todas las letras en vez de mostrar una
lista vacía.

#### El permalink: el caso en el fragmento de la URL

Copiado de `lib/compartir.ts`, con su decisión central intacta:

> **Va en el fragmento (`#`) y no en la query (`?`) a propósito. El fragmento no
> viaja al servidor**: ningún request lleva el caso, ni al host que sirve el
> sitio ni a nadie en el camino.

Eso es lo que hace que compartir una liquidación **no contradiga** la promesa de
que nada de lo que se escribe sale del navegador. En la query, la misma
funcionalidad la rompería. Es además la única forma de que el enlace sea
compatible con
[la promesa que se demuestra y no se declara](#una-promesa-de-privacidad-se-demuestra-no-se-declara).

**El formato lleva versión (`t1`).** Si alguna vez cambia la forma de codificar,
el número sube y los enlaces viejos siguen abriendo con el lector viejo en vez de
decodificarse mal en silencio: **un enlace que se abre torcido es peor que uno
que no abre.**

**Se decodifica con desconfianza**, igual que allá: el fragmento lo escribe
cualquiera y puede venir cortado por un cliente de mail. Se descartan las bases
que no existen, y lo que se devuelve son renglones **candidatos**: que la base y
la alícuota se puedan cruzar no lo decide el decodificador sino el filtro, igual
que cuando los elige una persona.

**Dos cosas que acá se resolvieron distinto que en Honorio, y por qué:**

- **El enlace se mantiene al día solo**, con `history.replaceState` en cada
  cálculo, así que la barra de direcciones **siempre** tiene el caso y el botón
  sólo lo copia. Con `location.hash` directo quedaría una entrada de historial
  por cada tecla y volver atrás sería inusable.
- **El monto fijo del art. 6 viaja adentro del enlace.** Es un dato del sistema y
  no del caso, pero **una liquidación tiene fecha**: la del art. 6 que regía el
  día que se hizo. Si no viajara, el mismo enlace abierto después de la próxima
  acordada daría otro total, y el enlace existe justamente para que el que lo
  recibe vea el mismo número. Cuando el enlace trae un valor distinto del del
  archivo, la pantalla lo dice en vez de pisarlo en silencio.

**El enlace también se imprime**, al pie de la liquidación. Es la mitad del
permalink que importa en papel, y es el motivo que está escrito en Honorio: quien
lee la liquidación puede volver a la pantalla que la produjo y ver de dónde salió
cada peso.

#### El caso del enlace está armado para que pierda algo

Prueba la ida y la vuelta: se codifica, se borra todo y se vuelve a armar desde
el código. **Es la única forma de probar un permalink sin recargar la página**
—el iframe se reusa entre casos y recargarlo rompe el resto de la corrida—.

Y el caso lleva **dos renglones, una titularidad escrita como fracción, un
concepto con tilde y una alícuota heredada que el segundo renglón no declara**.
Cualquiera de esas cuatro cosas se puede caer sin que el total del primer renglón
se mueva.

**Se probó rompiéndolo**, y las dos veces:

| Qué se rompió | Qué dijo el banco |
|---|---|
| El concepto deja de viajar en el enlace | `conceptos Departamento, Automóvil` → `(sin nombre), (sin nombre)` |
| Se saca el alias «apremio» | `1 de 10 incisos · inc. j` → `0 de 10 incisos · ninguno` |

**El primero es el que vale la pena mirar**, porque el total no se movió: ida y
vuelta seguían dando $1.087.500 y los dos renglones seguían estando. Un caso que
mirara sólo la cifra habría pasado en verde con el enlace perdiendo la mitad de
lo que lleva.

#### El banco: de 40 a 45

Cinco casos nuevos: el enlace de ida y vuelta, y cuatro del buscador —lo que
está escrito en la ley, lo que llega por alias, el plural y el género, y lo que
tiene que devolver cero—.

**Con esto `tasa` cubre toda la ley 23.898.** Lo que queda abierto no es
cobertura sino criterio, y está abajo.

---

### `tasa` cerrada: las tres preguntas contestadas, y la titularidad cambió de eje — 27/8

**La lista de cuatro que tenía esta sección se hizo entera el 27/8**, y lo que
queda no es cobertura de la ley sino criterio. Los cuatro, para que la próxima
lectura no los busque:

1. **~~El imprimible del art. 4 *in fine*, con el art. 8 adentro.~~** y
   **~~el monto fijo de los arts. 5 y 6.~~** Ver
   [el monto fijo y el imprimible](#el-monto-fijo-y-el-imprimible-lo-que-la-lista-desbloqueaba--278).
2. **~~Las exenciones del art. 13.~~** y **~~el permalink.~~** Los dos con el
   patrón de Honorio, ido a mirar antes de escribir como decía la indicación.
   Ver [las exenciones y el permalink](#las-exenciones-del-art-13-y-el-permalink-los-dos-copiados-de-honorio--278).

**`tasa` cubre ahora toda la Ley 23.898**, y desde el cierre del 27/8 tampoco
le quedan preguntas abiertas: Javier contestó las tres que le habían quedado.

#### Las tres, contestadas

**1. El 0,75 % del art. 4 inc. g queda como está.** La duda era de redacción: el
texto dice que «el **valor** establecido en el artículo 3º, inciso c) se
reducirá a la mitad», y el art. 3 inc. c no establece un valor sino una
reducción, así que se lee de dos maneras. La calculadora lee que la alícuota ya
reducida se reduce otra vez —3 % → 1,5 % → 0,75 %—, y Javier: ***«es la
interpretación que se hace todos los días, está bien así»***. El comentario del
código dejó de pedir doctrina y dice eso.

**2. La entrevista previa se descarta.** Javier la había dejado abierta —*«quizás
hay que hacer una entrevista previa para llegar al número final, no lo sé»*— y
la cerró: **no**. La razón sigue siendo la que estaba escrita: una entrevista es
buena la primera vez y estorba a partir de la segunda, y la tasa se calcula
seguido. El hint del renglón da lo mismo sin cobrar el peaje cada vez.

**3. La separación de bienes NO necesitaba una base propia, y el que estaba mal
era el eje de la titularidad.** Esta es la que movió código.

#### La titularidad no es del sucesorio: es de la cosa común

**La sección anterior había dado la separación de bienes por «sin lugar»**, con
el argumento de que el art. 9 inc. e no está en el mapa de bases del art. 4.
Javier lo corrigió de un tirón: ***«la separación de bienes es lo mismo que la
petición de herencia, y cualquier otro caso de cosas comunes: es el valor de lo
que se divide y luego juega el porcentaje de titularidad de cada uno»***.

O sea que la base no falta —es el mismo inmueble del inc. c o el mismo mueble
del inc. d— y el reparto ya lo hace el campo de titularidad. **Lo que estaba mal
era de dónde colgaba ese campo.** La refundación lo había colgado del EJE DE LA
ALÍCUOTA —aparecía sólo con las tres alícuotas sucesorias— y lo había escrito
como una decisión pensada: *«no las marca por el tipo de bien sino por el
supuesto, que es el eje correcto»*. **Era el eje equivocado**, y el error
completo es más viejo: la pantalla anterior lo colgaba del tipo de bien pero
sólo adentro de la sucesión, así que las dos versiones tenían el mismo techo.

Ahora cuelga de la **base**: las dos que valúan una cosa —`inmueble` del inc. c
y `muebles` del inc. d— llevan `divisible: true`, y son las dos que pueden ser
de varios. El supuesto sigue gobernando lo que sí es suyo: **la sobretasa**
—costumbre del juzgado en las sucesiones, y sólo sobre inmuebles— y el momento
de pago del art. 9 inc. d.

**Lo que se podía cargar mal, en un renglón:** una separación de bienes con un
inmueble de $25.000.000 va al 3 % del art. 2 —la reducción del art. 3 es del
sucesorio y esto no lo es—, y el campo de titularidad no aparecía. La pantalla
cobraba **$750.000 a cada cónyuge en vez de $375.000**. Es el caso nuevo del
banco, y el banco pasó de 45 a 46.

**Ningún número existente se movió**, y esa es la parte que hacía segura la
operación: el campo vacío vale 100 %, así que el cambio sólo agrega el campo
donde antes no estaba.

#### Lo que la pantalla no puede saber, y lo dice

El art. 9 trae **dos supuestos que el art. 4 no tiene** —la separación de bienes
del inc. e y la petición de herencia del inc. f— y los dos se cargan igual que
un condominio común: el valor de la cosa, recortado por la titularidad.
**Ninguna de las dos se distingue de la otra desde los dos ejes**, así que
clavarles un momento de pago sería inventarlo. Cuando algún renglón tiene
titularidad menor al 100 %, «Cuándo se paga» agrega un renglón que dice los dos
—al promover la liquidación de la sociedad conyugal, y **cada cónyuge puede
pagar su cuota parte**; al determinarse el valor de la parte del peticionario— y
dice también que la pantalla no puede distinguirlos. Es la misma regla de la
casa: el número no se oculta y la duda se escribe.

#### Un renglón del colofón mentía

Decía que *«el imprimible que sale de esta lista todavía no está hecho»*, y está
hecho desde unas horas antes: es el botón «Imprimir la liquidación». Es el
riesgo de escribir el colofón antes que la función. Ahora nombra el botón.

**La única cosa de la ley que sigue sin lugar, y no por olvido:** la propiedad
industrial. El art. 4 inc. d remite a lo que «la Dirección Nacional de la
Propiedad Industrial perciba para la solicitud de registros», o sea a un arancel
externo. **No hay número que calcular desde acá.**

**Tres cosas para tener a mano si se vuelve al banco:**

- **La corrida se arrastra con el panel del navegador oculto** —de seis segundos
  a varios minutos— porque los iframes no dibujan. No es que esté roto.
- **Los renglones se arman de a uno y en orden**, y no todos primero: el renglón
  nuevo hereda del último que ya existe, así que crearlos todos al principio los
  haría heredar del renglón vacío del arranque y la herencia quedaría sin probar.
- **El `<select>` al que se le asigna un `value` inexistente se va a la cadena
  vacía y no avisa.** Es lo que hace que el caso del cruce imposible pruebe algo
  real, y es la razón de la red de seguridad de `calcular()`.

---

### `ejecucion-estado`: el diagnóstico antes de refundarla — 27/8

**Es la última de las cuatro que van de cero, y la única donde Javier avisó que
no tiene piso.** Textual: *«de esa calculadora es la que menos domino tengo
porque es un supuesto poco común en mi fuero… no tengo seniority sobre el tema
más que las reglas generales como abogado y se me pueden pasar cosas que sabe
quien litiga el tema todos los días. Pero eso también es justo lo que necesita
alguien ajeno al palo que puede ser usuario de la calculadora: que cuando le
toque tenga una aproximación al tema y no esté en bolas»*.

**Eso cambia qué es esta pantalla.** Las otras diez le dan un número a alguien
que ya sabe de qué se trata. Ésta le tiene que dar el mapa a alguien que entra
por primera vez, y por eso lo que más importa acá no es la cuenta —que es una
suma de años— sino **decir de qué régimen se trata y cuándo la respuesta no es
un número**.

**Todo lo que sigue está leído en el texto de las normas, no de memoria.**

#### La pantalla de hoy, en una línea

Cuatro pasos —advertencia, fecha de notificación, certificación de agotamiento,
resultado— y la cuenta entera es: si la notificación es **antes del 31 de julio**
suma dos años; si es **el 31 o después**, tres; y si hubo **certificación de
agotamiento**, uno más. Devuelve siempre el **1 de enero** de ese año. 917
líneas, la más grande de las cuatro, y las tres reglas están bien encadenadas.

#### Hallazgo 1: la cobertura está mal por una década, y contesta igual

**La pantalla dice cubrir todo lo posterior al 1 de abril de 1991**, y frena sólo
lo anterior, por la consolidación de la Ley 23.982. Pero hubo **una segunda
consolidación**: el art. 13 de la **Ley 25.344** consolidó *«las obligaciones
vencidas o de causa o título posterior al 31 de marzo de 1991 y anterior al 1° de
enero de 2000»*, y el **art. 58 de la Ley 25.725** corrió esa fecha de corte al
**31 de diciembre de 2001**.

**O sea que el régimen que esta calculadora modela empieza recién con las
obligaciones de causa o título posterior al 31/12/2001**, y no en abril del 91.
Entremedio hay **más de diez años** en los que la respuesta no es una fecha de
ejecutabilidad: es que la deuda está consolidada y se cobra como manda ese
régimen.

**Y el error es peor que un rango mal puesto, porque son dos fechas distintas.**
La consolidación mira la **causa o título de la obligación**; la pantalla pide y
valida la **fecha de notificación**, que es otra cosa y puede caer veinte años
después. Una sentencia notificada en 2024 por una obligación de 1998 está
consolidada, y la pantalla contesta «ejecutable el 01/01/2026» sin dudar.
**Es la peor forma de estar mal**: una respuesta plausible, con un número
redondo, dada a alguien que —por definición de para quién es esta pantalla— no
tiene cómo saber que no corresponde.

**Lo que se sigue de ahí, y es diseño y no texto:** hay una pregunta que la
pantalla no hace y tiene que hacer —**cuándo nació la obligación**—, y para
varias de las respuestas posibles el resultado no es una fecha.

#### Hallazgo 2: el 1 de enero no está en ninguna norma

La pantalla devuelve `01/01/AAAA` y no dice de dónde sale. El **art. 22 de la
Ley 23.982** —que es el que fija cuándo se puede ejecutar— dice otra cosa:

> *«El acreedor estará legitimado para solicitar la ejecución judicial de su
> crédito a partir de la **clausura del período de sesiones ordinario del
> Congreso de la Nación** en el que debería haberse tratado la ley de presupuesto
> que contuviese el crédito presupuestario respectivo.»*

Y la clausura de las sesiones ordinarias es el **30 de noviembre** (art. 63 CN).

> **Corregido el 28/8, al construir.** Este párrafo decía que la diferencia era
> «un mes entero de anticipo». **Son trece meses** —30/11/2024 contra
> 01/01/2026 para una condena notificada en marzo de 2024— y, sobre todo,
> **no son dos lecturas de lo mismo sino dos situaciones distintas**: el art. 22
> se dispara cuando el crédito NO entró en la ley de presupuesto, y el 1 de
> enero supone que entró y que el ejercicio pasó sin pago. Eso terminó
> ordenando el diseño: ver
> [la refundación](#ejecucion-estado-refundada-la-puerta-de-entrada-y-las-dos-fechas--288).

**La lectura del 1 de enero no es un invento**: es la conservadora —que el
ejercicio presupuestario tiene que haber transcurrido entero sin pago— y es la
que se usa. **Pero la pantalla la da como si fuera la única y no cita ninguna
norma para el día que devuelve.**

#### Hallazgo 3: tres citas mal puestas

- **El «carácter meramente declarativo» no es de la Ley 11.672**, que es lo que
  dice la pantalla. Es el **art. 7 de la Ley 3.952** de demandas contra la
  Nación, de 1900. Y decirlo sin lo que sigue deja al lector peor de lo que
  estaba: la CSJN en **«Pietranera» (1966)** resolvió que ese artículo **no es
  una autorización para no cumplir las sentencias**, y que cabe la intervención
  judicial cuando la demora es irrazonable. Alguien que entra sin saber nada se
  lleva de esta pantalla que contra el Estado no hay nada que hacer hasta la
  fecha que le muestra, y eso no es lo que dice la ley.
- **La certificación de agotamiento no sale del art. 22 de la Ley 23.982**, que
  es lo que la pantalla cita. Sale del **art. 170 de la Ley 11.672**: los
  recursos se aplican por orden de antigüedad *«hasta su agotamiento,
  atendiéndose el remanente con los recursos que se asignen en el siguiente
  ejercicio fiscal»*. El +1 año está bien; la cita, no.
- **El 31 de julio no es de la notificación**: el art. 170 pide que la
  jurisdicción demandada **tome conocimiento fehaciente de la condena** antes del
  31 de julio *«del año correspondiente al envío del proyecto»*. La notificación
  judicial es el vehículo normal, y por eso la aproximación funciona, pero son
  dos hechos distintos y el que cuenta es el del organismo.

#### Hallazgo 4: la ley de la que se llama no es la única

El título dice «Ley 11.672» y el tablero también. **El régimen son dos normas y
cada una hace una mitad**: el art. 170 de la Ley 11.672 dice **cómo entra la
condena al presupuesto** —el 31 de julio, el ejercicio siguiente, el orden de
antigüedad, el agotamiento— y el art. 22 de la Ley 23.982 dice **desde cuándo se
puede ejecutar**. La pantalla las mezcla y nombra una sola.

*(De paso: el banco de pruebas llama a estos cuatro casos «los cuatro cruces de
la Ley 25.344», y la 25.344 es justamente la ley de consolidación que la pantalla
no contempla. Es un rótulo mal puesto, no un caso mal calculado.)*

#### Las tres decisiones que faltan antes de escribir

1. **La fecha de la obligación entra como pregunta nueva**, y con ella las
   respuestas que no son una fecha. Es el arreglo del hallazgo 1 y no tiene
   alternativa; lo que hay que decidir es **cuánto cuenta la pantalla de los dos
   regímenes de consolidación**, o si sólo dice «acá no es esto».
2. **Qué fecha devuelve el número grande**: el 1 de enero del ejercicio
   siguiente, el 30 de noviembre del art. 22, o las dos con la explicación al
   lado.
3. **Hasta dónde explica.** Con el aviso de Javier sobre su propio piso, el
   criterio que se propone es que **esta pantalla explique más que las otras
   diez** y que cada número lleve su norma pegada, incluso donde las otras la
   darían por sabida.

**Las tres se contestaron y la pantalla se refundó el 28/8**, el día siguiente:
ver [abajo](#ejecucion-estado-refundada-la-puerta-de-entrada-y-las-dos-fechas--288).

---

### `ejecucion-estado` refundada: la puerta de entrada y las dos fechas — 28/8

**La cuarta y última de las que no son de plazos, y la única donde el problema
no era la forma.** El diagnóstico está [arriba](#ejecucion-estado-el-diagnóstico-antes-de-refundarla--278);
acá está lo que se hizo, y las dos decisiones de Javier que lo ordenaron.

#### Primero, una corrección de lo que este mismo documento decía ayer

**El diagnóstico decía que la diferencia entre el 30 de noviembre y el 1 de
enero era «un mes entero de anticipo». Está mal por dos motivos**, y los dos
salieron al construir:

- **No es un mes: son trece.** El art. 22 dispara en la clausura de las sesiones
  ordinarias del año en que *debía tratarse* la ley de presupuesto del ejercicio;
  el 1 de enero llega recién cuando ese ejercicio ya transcurrió entero. Para
  una condena notificada en marzo de 2024: **30/11/2024** contra **01/01/2026**.
- **Y no son dos lecturas de lo mismo: son dos situaciones distintas.** El art.
  22 se dispara cuando el crédito **no entró** en la ley de presupuesto —el
  propio artículo manda al Ejecutivo comunicar al Congreso los reconocimientos
  que «carezcan de créditos presupuestarios»—. El 1 de enero supone que **entró**
  y que el ejercicio pasó sin que le pagaran.

**Eso cambió el diseño**, y para mejor: no hay que elegir entre dos lecturas ni
mostrarlas como una duda doctrinaria. Se muestran las dos **con la situación que
abre cada una**, que es un hecho del expediente y no una cuenta. La pantalla
pregunta lo que puede saber y no finge saber lo que no.

#### Las dos decisiones de Javier

Con el aviso de que éste es el tema donde menos piso tiene, se le pusieron dos
preguntas y contestó las dos:

1. **Con la deuda consolidada, la pantalla frena y explica en dos párrafos**:
   qué régimen es, por qué ahí no hay fecha de ejecutabilidad, y que el crédito
   se cobra por el procedimiento de esa ley. No calcula nada. La alternativa
   —modelar los dos regímenes de consolidación, con bonos, prelación y plazos de
   16 y 10 años— es una calculadora entera aparte.
2. **El número grande son las dos fechas, cada una con su norma.** No una
   presentada como la respuesta y la otra como nota al pie.

#### Lo que se construyó

**Dejó de ser un asistente.** Eran cuatro pasos con una pantalla de advertencia
adelante; ahora es una hoja sola, como las otras diez. La razón es la misma que
en `tasa` —una entrevista es buena la primera vez y estorba a partir de la
segunda— y acá hay una más fuerte: **cambiar la fecha de la obligación y ver
saltar el régimen es lo que más enseña de esta pantalla**, y en un asistente eso
queda tres pasos atrás.

**Tres campos, y el primero es el que no existía:** cuándo nació la obligación,
cuándo se notificó la condena firme, y una casilla para la partida agotada. Los
tres regímenes salen del primero:

| Causa o título de la obligación | Régimen | Respuesta |
|---|---|---|
| Anterior al 1/4/1991 | Consolidada, Ley 23.982 art. 1 | **No hay fecha** |
| Del 1/4/1991 al 31/12/2001 | Consolidada, Ley 25.344 art. 13, con el corte corrido por la Ley 25.725 art. 58 | **No hay fecha** |
| Posterior al 31/12/2001 | Pasivo corriente, art. 170 Ley 11.672 y art. 22 Ley 23.982 | Dos fechas |

**Los tres tramos no dejan hueco, y no es casualidad:** la 23.982 consolida lo
«anterior al 1 de abril de 1991» y la 25.344 lo «posterior al 31 de marzo de
1991», que es el día siguiente. Encastran, y está escrito al lado del corte para
que la próxima lectura no lo tenga que descubrir.

**Y abajo del veredicto, la línea de tiempo con la norma de cada hito.** Es la
mitad de lo que esta pantalla da: para el usuario que se describió —alguien que
no litiga esto y que necesita saber en qué está parado— **el mapa importa más
que el número**. Cinco normas desplegables cierran la página, y la primera es la
que la pantalla anterior citaba mal.

#### Las tres citas, arregladas

- **El «carácter meramente declaratorio» es el art. 7 de la Ley 3.952**, no la
  11.672. Y **no se puede citar solo**: va con «Pietranera» (1966), donde la
  CSJN resolvió que ese artículo no es una autorización para no cumplir las
  sentencias. Dicho a secas, el lector se lleva que contra el Estado no hay nada
  que hacer, que es lo contrario de lo que dice la ley.
- **La partida agotada sale del art. 170 de la Ley 11.672**, no del art. 22 de
  la 23.982. Y dejó de llamarse «certificación de agotamiento», que sonaba a un
  acto formal que hay que conseguir: es que los recursos se aplican por orden de
  antigüedad «hasta su agotamiento», y el remanente va al ejercicio siguiente.
- **El 31 de julio es del conocimiento fehaciente del organismo**, no de la
  notificación. La notificación es el vehículo normal y por eso la aproximación
  funciona, pero la pantalla ahora dice cuál es cuál —y de paso dice que esa
  fecha importa **dos veces**: fija el ejercicio y fija el lugar en la cola.

#### El banco, de 46 a 50, y uno se puso rojo con razón

Los cuatro casos viejos se reescribieron —la aritmética es la misma y las fechas
del 1 de enero no se movieron, que era la prueba de que la cuenta seguía
igual— y entraron cuatro nuevos: **los tres de la puerta de entrada**, que
llevan la misma notificación y sólo cambian la fecha de la obligación, y uno que
**no mira ningún número** y fija las cinco normas que cita la línea de tiempo.
Ese último existe porque una cita que se despega no mueve ninguna fecha.

**Y el caso de la deuda consolidada se puso rojo, y estaba bien.** La tira de
datos se escondía pero **se quedaba con el contenido del caso anterior adentro**:
para una obligación de 1998 mostraba, oculto en el DOM, el ejercicio
presupuestario de otra cuenta. Se arreglaron las dos puntas —la pantalla ahora
vacía además de esconder, y el driver pregunta por `hidden` en vez de contar
nodos—. **La lección se repite**: esconder no es limpiar, y lo que queda en el
DOM lo lee todo lo que no mire el `hidden`.

#### Lo que queda expresamente afuera, y está escrito en el colofón

Las deudas **previsionales**, que tienen fechas de corte propias en los dos
regímenes de consolidación y otro régimen de pago. Las **provincias y los
municipios**, cada uno con su ley. Y lo que no sea una condena a **dar sumas de
dinero**. Nada de eso se aproxima: se dice que no está.

**Sigue marcada «en desarrollo» en el tablero**, y a propósito: el bug está
cerrado y la cobertura declarada es la que la pantalla cumple, pero es el tema
donde Javier avisó que no puede dar fe, y bajarle el cartel es una decisión suya.

---

### Las cinco cifras de Honorio: las dos veces que el mecanismo falló

Se escribió porque el mecanismo ya había fallado dos veces:

- **El 14/8 ninguna de las cuatro estaba al día**, y la de validaciones estaba
  mal de tres formas distintas: `index.html` decía 11 en el tile, `README.md` 16
  y `documentacion.html` dieciséis, cuando son 17 —contados sobre los archivos—.
  **El chip del propio `index.html` ya decía 17**, así que la landing se
  contradecía a sí misma a setecientas líneas de distancia.
- **El 21/8 el exhorto pasó de dos preguntas a seis** —la 3.4.0 de Honorio— y
  con él los recorridos de 168 a 173 y los cruces de 28.224 a 29.929. De este
  lado no lo notó nadie hasta el 25/8: la landing pasó cuatro días publicando una
  cifra que ninguna corrida produce, con la versión del chip clavada en 3.1.1 y
  Honorio en 3.4.1.

Mediación y la prosa, en cambio, no movieron recorridos ni cruces, y eso era el
resultado buscado: ninguna de las dos agrega una pregunta a la entrevista.

---

## `tasa` despejada: el ruido que la pantalla correcta seguía teniendo — 31/8

La pantalla estaba **bien de modelo desde el 27/8** —los dos ejes de la ley
separados, el cobro doble arreglado, los fijados en verde— y seguía siendo
incómoda de usar. Javier lo mandó entero, y el pedido no era una lista de
retoques sino una frase:

> «El que quiere leer, lee y el que no, va directo a sacar el número.»

Es el mismo criterio con el que se ordenó Honorio —los números no se ocultan
nunca, las frases siempre, y el «por qué» es un único signo— y esta pantalla no
lo cumplía en ningún lado: todo lo que la ley obliga a explicar estaba **a la
vista y al mismo tiempo**.

### Lo que estaba de más, en el orden en que lo señaló

- **«Tasa de justicia» decía dos veces.** El `<h1>` y, tres centímetros abajo, el
  rótulo de la caja grande: «Tasa de justicia a integrar». Se fue el segundo. Una
  cifra grande arriba de todo no necesita que le digan qué es.
- **El párrafo de cobertura al lado del título** —qué artículos cubre, qué
  fueros— es documentación y se fue al desplegable del final. Arriba quedó una
  línea: «Ley 23.898 · tribunales nacionales».
- **La palabra «renglón».** Javier: *«nadie nunca jamás preguntó cuántos
  renglones tenía una liquidación de tasa»*. Con la palabra se fue la columna
  «Concepto», que era texto libre numerado como «Renglón 3».
- **La columna «Titularidad · sobretasa»**, que en la mayoría de los casos estaba
  vacía y ocupaba 150 px igual. *«La titularidad debería aparecer SOLO si se
  trata de casos susceptibles de titularidad»*: el campo ya aparecía sólo en las
  dos bases que valúan una cosa, pero **su rótulo estaba siempre**.
- **El desplegable de alícuota con una sola opción.** *«No tiene sentido, el
  sistema ya solito te dice la alícuota; está bien que te la muestre pero no que
  te permita (pero impida) elegir.»*
- **La fila de monto indeterminable decía `$ 4.700` dos veces y «art. 6» tres**,
  entre la columna de importe, el desplegable y la nota de abajo.

### Lo que se agregó, que no es una simplificación

**«Pretensión» en lugar de «renglón», y es un cambio de modelo y no de palabra.**
Lo razonó Javier solo, en el mismo mensaje: el juicio principal se da por sentado
y no se dice; lo que se suma aparte es la **ampliación de demanda**; y lo que de
verdad se suma en una misma liquidación son **pretensiones distintas del mismo
actor** —*«reclama sumas de dinero por daños pero también reclama la restitución
de un inmueble: son cosas distintas, la alícuota la misma pero las bases
distintas»*—.

**Y la reconvención se sacó de la lista, razonándola en voz alta:** *«es en
realidad un juicio principal para el demandado y no tiene sentido sumarlo; la que
paga el actor y la que paga el demandado son distintas y no van en la misma
liquidación»*. Es correcto y el art. 8 no lo contradice: la norma dice que la
reconvención tributa como juicio independiente, no que se liquide en la planilla
de la contraparte. **El artículo se sigue citando** en el desplegable del final;
lo que se sacó es la opción de cargarla donde no va.

### La alícuota: cuándo preguntar y cuándo no

De las trece bases del art. 4, **once determinan la alícuota solas**: una
tercería sólo puede ir al 1,5 % del art. 3 inc. h, y ofrecer un desplegable de
una opción es una decisión ya tomada disfrazada de pregunta. En esas once ahora
se escribe el número con su cita, y no se pregunta nada.

**Las dos que sí preguntan son las dos que valúan una cosa** —el inmueble del
inc. c y el mueble del inc. d—, y ahí la elección es real: el mismo inmueble va
al 3 % en un juicio común, al 1,5 % en una sucesión o una mensura y al 0,75 % si
está en extraña jurisdicción. Eso no lo puede adivinar la pantalla.

**Los dos ejes siguen separados por dentro y eso no se tocó**, que era el riesgo
del cambio: el cobro doble del 27/8 salió justamente de agrupar bases por la
alícuota que compartían. El desplegable **sigue existiendo siempre en el DOM** y
sigue siendo la única fuente del dato; cuando tiene una sola opción se esconde y
en su lugar se escribe el número. Un segundo camino para decidir la alícuota
sería un segundo lugar donde se puede perder.

**Es el mismo arreglo que el desplegable de modalidad de `vencimientos` el 17/8**,
y conviene verlo como un patrón y no como dos casos sueltos: ahí el casillero de
la hora pasó a aparecer sólo cuando el día es hábil, *que es cuando la hora
decide algo*. Acá la alícuota se pregunta sólo cuando hay algo que elegir, y la
titularidad aparece sólo cuando hay una cosa que dividir.

### El importe: lo único que cambió por dentro

Era el otro pedido: *«asegurate que parsee todas las posibilidades —la gente
copia y pega montos, a veces vienen con comas, a veces con puntos— y los
decimales admitidos. Además una frase de error si está mal»*.

El lector viejo tenía **dos agujeros y los dos eran silenciosos**:

- **`1,234,567.89` daba `$ 0,04`.** Borraba los puntos —o sea el separador
  decimal— y después cambiaba la primera coma por un punto: `$1.234.567,89` se
  volvía `$1,23`. Un importe pegado de un sistema en inglés entraba **mil veces
  más chico** y la pantalla no decía nada.
- **`diez mil` valía cero**, igual que `1.234.56` valía `1,234`. La fila quedaba
  cargada, aportaba nada, y el total parecía completo. **Una fila que aporta cero
  es peor que un error, porque parece una cuenta.**

Ahora hay una regla sola que ordena todos los formatos: **el separador decimal es
el último que aparece, y sólo si aparece una vez.** Un separador repetido
—`$1.234.567`, `$1,234,567`— es de miles por definición: ningún número tiene dos
comas decimales. Los grupos de miles se verifican —el primero de uno a tres
dígitos, los demás de tres exactos—, y por eso `1.234.56` es **un error y no
`123.456`**: ese texto no es un número en ningún formato, y adivinarle uno es
exactamente lo que no hay que hacer con un importe que va a una boleta.

**La única lectura ambigua que queda se resuelve como se escribe acá:** un punto
con tres dígitos atrás es de miles —`10.800`— y con menos es decimal —`10.8`—.
Hay un caso de prueba pegado a cada uno de los dos.

**Cinco fijados nuevos, de 50 a 55**, y son los únicos del banco que miran cómo se
lee un importe: los dos formatos que tienen que dar lo mismo, los dos que
resuelven la ambigüedad del punto, y el que tiene que avisar.

### Lo que se midió, y lo que no se movió

- **Los 50 fijados anteriores siguen dando el mismo número.** Es lo que había que
  probar: el despeje es de forma, y el único cambio de cálculo —el lector de
  importes— no toca ningún caso escrito con dígitos pelados.
- **Contraste sobre estilos computados**, en los dos temas, sobre los elementos
  nuevos: el signo, el aviso de error, la alícuota escrita, el rótulo de
  titularidad, el chip de sobretasa y los tres desplegables. El más bajo da 4,78
  y el umbral es 4,5.
- **A 390 px la página no se corre de costado**, y hubo que arreglarlo para que no
  lo hiciera: un `<select>` con opciones largas no baja de su contenido adentro de
  un flex, y empujaba la página 60 px. Es el `min-width: 0` que `comun.css` avisa.
  La tabla además pasa a tarjetas, con el rótulo de cada dato sacado del
  `data-rotulo` de la celda: así no hay una segunda lista de rótulos que se pueda
  desincronizar de los encabezados.

**Y una trampa de medición que costó tiempo, para no volver a pisarla:** el signo
abierto parecía no pintarse —`getComputedStyle` devolvía el color viejo mientras
el borde sí cambiaba—. No era la cascada: `button` lleva `transition: background,
color`, y **una transición no avanza con el panel del navegador oculto, porque la
página no dibuja**. Es lo mismo que hace lentos a los dos bancos de pruebas con
el panel cerrado. Lo que no transiciona —el borde— sí se actualizaba, y ese
contraste es lo que delata el caso.

### La pregunta invertida, y las dos regresiones silenciosas — 31/8, a la tarde

**El despeje de la mañana mejoró la pantalla y le rompió dos cosas**, y las dos
las encontró Javier usándola. Ninguna se veía en un número, que es exactamente
por qué son las peores:

- **El nombre del bien.** Sacar la columna de concepto junto con la palabra
  «renglón» dejó la liquidación impresa sin dónde escribir cuál bien es cuál.
  *«Vos tenés que presentar esa liquidación y no tenés dónde poner que lo que
  pagaste en una parte es por el inmueble de tal y lo que pagaste en otra por el
  automóvil.»* La planilla del art. 4 *in fine* va al expediente: una sucesión
  con dos inmuebles imprimía dos líneas idénticas.
- **El dinero de una sucesión.** *«Se fue silenciosa una regresión: para la
  sucesión ya no es posible calcular montos de sumas de dinero con tasa
  reducida.»* Acá la mitad de la respuesta era que sí se podía —va por el
  inc. d, y había un fijado que lo cubría desde el 27/8— y la otra mitad, la que
  importa, es que **había dejado de ser encontrable**: lo único que lo decía era
  un hint, y esa mañana los hints se habían escondido detrás de un signo.

**De ahí salió la regla que ahora gobierna el texto de esa pantalla:** un hint
que dice a qué inciso corresponde lo que estás cargando **no es prosa opcional,
es parte de la respuesta**, y va a la vista. Lo que se esconde es la explicación
larga, nunca el mapeo. Corrige al criterio de la mañana, que había mandado todas
las frases detrás de un signo por igual.

#### Y el modelo estaba al revés

*«Siento que invertimos el modelo anterior, que el usuario elegía sucesión y
luego eso definía qué pagar… iría al revés: elegiría el tipo de juicio o lo que
se reclama y luego eso gobierna los números.»* Tenía razón, y el argumento que
lo cierra es de vocabulario: **«pretensión» en un sucesorio, que es voluntario,
no se puede sostener**. Nadie llega pensando «art. 4 inc. c»; llega pensando
«tengo una sucesión».

**Lo que hay que entender para no deshacerlo:** esto **vuelve sobre la versión
de julio, que era la que tenía el bug del cobro doble**, y no la repite. Ahí la
combinación estaba *escrita a mano* adentro de cada opción, y por eso se podía
escribir mal: tres supuestos agrupados abajo de «Otros» porque compartían el
3 %, cuando a dos de los tres el art. 3 les reduce la alícuota a la mitad.
Ahora el supuesto **nombra** un par (base, alícuota) de las dos tablas de la
ley, que siguen intactas y separadas; `liquidar()` recibe una base del art. 4 y
una alícuota de los arts. 2 y 3 y **no sabe que existen los supuestos**.
Agrupar dos bases que comparten alícuota no es representable: cada ítem trae la
suya. El caso de la quiebra y el concurso preventivo lo fija —salen del **mismo**
inc. e del art. 4 y llevan alícuotas distintas—.

Y el cruce imposible dejó de necesitar un filtro: **no existe la manera de pedir
una tercería al 3 %**, porque la alícuota sale del supuesto. El fijado que
probaba el filtro se reescribió para probar eso.

#### Las decisiones de Javier sobre la lista de supuestos

- **Testamento e hijuela de extraña jurisdicción (art. 3 inc. d): absorbido por
  sucesión.** El argumento es de derecho internacional privado y lo dio con la
  norma: el art. 2609 inc. a del CCyCN da jurisdicción **exclusiva** a los jueces
  argentinos sobre derechos reales de inmuebles situados en la República, así que
  *«no podés meter una inscripción de declaratoria extranjera como exequátur»*:
  si hay que inscribir bienes, se abre la sucesión acá. **Y con una casilla que
  avisa que no mueve ningún número**, idea suya: la reducción del inc. d es la
  misma que la del inc. c, así que se marca sólo para que el imprimible cite el
  inciso correcto. Hay un fijado que existe justamente para que ese total **no**
  se mueva.
- **Mensura y deslinde: juicio propio.** *«Es lo que es. Agregar subopciones a
  bienes creo que no ayuda.»*
- **Monto indeterminable y sin valor pecuniario: un supuesto solo.** *«Muestran
  exactamente lo mismo»* —y lo muestran porque **pagan** lo mismo—. Lo único que
  los separa es cuándo, así que el hint es doble y «Cuándo se paga» trae los dos
  momentos. Hay un fijado sobre eso, porque si un día la pantalla dice uno solo
  ningún número se mueve y el que lee elige mal sin saberlo.
- **El botón de tema.** Abrió las otras diez y la landing: en ninguna tapa texto,
  porque el cuerpo queda más angosto y centrado. *«Asumo que el cambio más barato
  es que la calc de tasa quede con un cuerpo un poco más chico y centrado.»* Es
  lo que se hizo —de 1040 a 940 px, como `vencimientos` y `mediación`— en vez de
  mover un botón que está en las once. Adentro del tablero el problema no existe:
  ahí el botón de cada iframe se esconde.

#### Los dos bugs de la captura

- **El campo de titularidad medía 450 px**, se salía de su celda y se montaba
  encima de la cita de la alícuota de al lado: en la captura, «art. 2» aplastado
  adentro del recuadro del porcentaje. **No era la cita la que estaba mal
  ubicada** —está debajo de Alícuota, que es donde va—: era el campo de al lado
  tapándola. La causa es de especificidad y vale anotarla: la regla general de la
  lista es `table.filas input[type="text"]` y pesa (0,2,2); un
  `.titularidad input[type="text"]` pesa (0,2,1) y **pierde**, así que ganaba el
  `width: 100%`. Ahora la regla lleva el `table.filas` adelante.
- **A 390 px la página se corría 60 px de costado**, y era un `<select>` con
  opciones largas que no baja de su contenido adentro de un flex. Es el
  `min-width: 0` que `comun.css` avisa.

#### Lo que se midió

- **Los fijados pasaron de 55 a 60 y ninguno de los anteriores se movió.** Es la
  tercera vez que los casos de `tasa` se remapean —27/8, 31/8 a la mañana y 31/8
  a la tarde— y los números esperados son los mismos que fijaba el banco de
  julio. Si un remapeo mueve un número, no es un remapeo: es un error.
- **Los diez nuevos** cubren cómo se lee un importe pegado, las tres reducciones
  del art. 3 que no tenían ninguno —mensura, recurso directo, y quiebra contra
  concurso preventivo— y las dos cosas que no se ven en ningún importe: la
  casilla del testamento y los dos momentos de la suma fija.
- **El permalink subió a `t2` y los enlaces `t1` se siguen abriendo**, traducidos
  por una tabla inversa. Se probó con un enlace del formato viejo armado a mano:
  abre en Sucesión, con el nombre puesto y el mismo total, y la barra de
  direcciones se actualiza sola al formato nuevo. Un enlace que no abre es lo
  único peor que uno que abre torcido.
- **Contraste sobre estilos computados**, veintitrés elementos, los dos temas: el
  más bajo da 4,78 y el umbral es 4,5. **A 390 px no hay desborde horizontal.**

---

## Los atajos, la barra de lo que queda y el barrido del CPCCN — cerrado el 31/8

Sesión de pedidos sueltos de Javier sobre tres pantallas. Lo que la ordenó no
fue ninguno de los pedidos: fue darse cuenta de que dos de ellos —los atajos de
plazo y el buscador— eran el mismo, y que hacerlos por separado dejaba los días
de un traslado escritos en dos lugares.

### Lo chico primero: la fecha de hoy y los dos atajos de fecha

`vencimientos.html` no decía en ningún lado qué día era. Javier: «se me ocurre
que muestre la fecha de hoy arriba de todo, como ubicando al usuario dónde
está». Se puso, y se le agregó lo único que la página sabe de hoy y el usuario
puede no saber: **si hoy cuenta**. Cuando es inhábil lo dice con el motivo, y el
motivo sale del mismo calendario que dibuja el plazo abajo, así que la cabecera y
el dibujo no pueden decir cosas distintas del mismo día.

Se pinta dos veces a propósito: la fecha sola apenas carga la página, y otra vez
cuando llegó el calendario, recién ahí con el hábil o inhábil. Al revés la
cabecera arranca vacía por lo que tarde un `fetch`, y la fecha de hoy no depende
de ningún dato.

Los botones **Hoy** y **Ayer** llenan los tres campos de la fecha de
notificación. Es la fecha que más se carga —la cédula que llegó hoy o ayer— y no
valida nada: una fecha armada del reloj de la máquina siempre existe.

### Los atajos de plazo, y por qué no van escritos en el HTML

El pedido eran cuatro botones que llenaran el campo del plazo: 15 para el
traslado del ordinario, 10 para el del recurso extraordinario, 5 para apelación
y traslados, 3 para revocatoria y sumarísimo.

Escribir esos números adentro de `vencimientos.html` habría sido diez líneas.
**No se hizo, y ése es el punto de toda la sesión:** el buscador que Javier pidió
en el mismo mensaje iba a necesitar la misma tabla, y dos listas del mismo plazo
se desincronizan. Cuántos días tiene un traslado no puede depender de cuál de las
dos miraste. Así que los atajos leen `data/plazos-cpccn.json` desde el día uno,
que es el archivo que va a alimentar el buscador, y la página **no tiene ningún
número de plazo escrito adentro**. Si el archivo no carga, la fila de atajos no
aparece y el campo se escribe a mano: es una comodidad, no el cálculo.

Cada entrada del archivo lleva los días, el artículo y **la oración literal**
del Código. El botón afirma cuántos días tiene un plazo, así que al elegirlo la
pantalla dice de qué artículo sale, a la vista y no detrás de un globo. Es el
mismo criterio que el 31/8 a la mañana rescató los hints de `tasa`: lo que se
esconde es la explicación larga, nunca el mapeo.

**Una corrección al pedido, y es de fondo.** Javier había puesto «excepciones»
en el botón de 5 días. Contra el texto: los cinco días de excepciones son los
del **ejecutivo** (art. 542); en el ordinario las excepciones van en el mismo
escrito que la contestación de la demanda (art. 346), o sea dentro de los quince
del art. 338. El rótulo del botón no tiene lugar para esa distinción, así que
quedó en «Apelación, traslados y vistas» y la precisión entera va en la línea
que aparece al elegirlo. **Un rótulo que dice de menos no miente; uno que
redondea una regla, sí.**

### La barra de lo que queda

Javier: «si se calcula un plazo de 15 días, una barra podría mostrar un tercio
de completada si faltan 10 días… desde el lado del abogado le está diciendo
cuánto tiempo te queda».

Se hizo, con un ajuste: **la barra sola es decoración.** Lo que vale es el número
que la calculadora no contestaba —*quedan 11 días hábiles de los 15*—, que es una
pregunta distinta de «cuándo vence». El número va grande y la barra al lado.

**No cuenta nada por su cuenta.** Los días restantes salen de filtrar
`diasContados` —el array que devolvió el motor— contra la fecha de hoy. Recorrer
el calendario ahí habría sido una segunda implementación del conteo, que es el
modo de falla que produjo el bug de la feria.

Tres estados, y están separados porque los tres se leen distinto:

- **vencido** — hoy pasó el día del vencimiento *con* gracia. Recién ahí el plazo
  está muerto: hasta las 9:30 de ese día todavía se presenta, así que cortar en
  el vencimiento sin gracia daría por vencido un plazo que no lo está.
- **último** — no queda ningún día contado por delante y el día de gracia todavía
  no pasó. Es el único estado donde «quedan cero días» diría menos que la fecha,
  así que dice «vence hoy» o «queda el plazo de gracia».
- **corriendo** — el caso normal.

**No dice hace cuánto venció**, y lo decidió Javier: «sin calcular hace cuánto
venció». El dato no cambia lo que hay que hacer y convierte un aviso en un
reproche. Dos colores y no tres: vivo en `--accent`, que es el color de «día
contado» en el dibujo de abajo, así que la barra y la grilla hablan del mismo
tramo con el mismo color; vencido en `--error`, que es lo único de la pantalla
que hay que ver aunque se esté mirando otra cosa.

### El barrido del CPCCN, y el modelo que tenía razón

Javier había hecho una pasada previa con otro modelo y avisó: «conociéndote
seguro vas a querer auditarlo». La primera reacción fue no necesitarlo: el
repositorio hermano `indice` tiene `cpccn.jsonl`, los 805 artículos con el texto
exacto, y barrer eso con una expresión regular da la oración literal al lado de
cada plazo. Un modelo devuelve la tabla completa y bien ordenada, y ahí está el
problema: una fila inventada es indistinguible de una buena.

**Ese barrido encontró 112 artículos, y estaba mal.** Cruzarlo contra la pasada
del otro modelo mostró 63 artículos que él tenía y el barrido no. La causa: el
Código escribe los plazos de cuatro formas y la expresión regular cubría una.

1. `QUINCE (15) días` — palabra y numeral entre paréntesis.
2. `será de cinco días` — el número con letras y sin numeral.
3. `dentro de tercero día` — el ordinal en singular, que es como el Código
   escribe los plazos cortos de trámite.
4. `dentro de las DOS (2) primeras horas` — con un adjetivo metido entre el
   número y la unidad.

**Entre lo que perdía estaba el art. 150**, que es *el* plazo de traslados y uno
de los cuatro atajos, y el art. 124, que es el plazo de gracia que esta misma
calculadora cita en cada resultado. Cubriendo las cuatro formas: **165 artículos
y 205 menciones**.

La moraleja no es la que uno esperaría. El barrido mecánico tiene mejor precisión
—cada fila arrastra la oración del artículo, así que una fila mal leída se ve al
leerla— y el modelo tenía **mejor cobertura**, porque lee «dentro de tercero día»
como un plazo sin que nadie le enseñe la forma. Los dos hacían falta, y ninguno
de los dos solo alcanzaba.

Después de arreglarlo quedan tres artículos que el otro modelo declara y el
barrido no: el art. 183 —«máximo 5 por parte», que son testigos y no un plazo—,
el art. 285 —que remite al plazo del art. 282 y no lo escribe— y el art. 453,
que directamente no tiene ningún número. Las tres son inferencias, no texto.

Y una que costó ver: sin `\b` al final de cada unidad, «en un **dia**rio de los
de mayor circulación» del art. 146 sale como un plazo de un día. Es la clase de
fila que en una tabla de doscientas parece un plazo más.

El barrido quedó en `scripts/barrer-plazos-cpccn.mjs` (`npm run barrer-plazos`).
**No corre en CI** —la fuente vive en otro repositorio— y lo que se versiona es
el resultado curado.

### La UMA y el UHOM dejaron de hablar de demoras

Javier: «quiero eliminar toda la referencia a demoras: suena como que le critico
a la Corte lo que tardó en actualizarla y prefiero no caer en esa».

Salieron la columna «Demora» de la tabla de UMA, su nota al pie, la frase de
Procedencia que la explicaba, y las tres cifras grandes de la franja, que eran
las tres sobre lo mismo: cuántos valores salieron tarde, la mediana y la peor.
En su lugar van tres neutrales, derivadas del JSON en cada carga —67 + 67
valores, 49 normas de la Corte, 38 tablas del Ministerio—, que dicen el mismo
argumento que la página siempre quiso decir: *esto está leído de las fuentes*.

**La fecha del acto se quedó.** Es un dato y no una demora, y sirve para lo único
para lo que hace falta: saber si un valor ya existía el día en que se dictó una
regulación. El dato crudo sigue entero en `data/serie-uma.json`.

Y apareció algo que no se resolvió: las cifras derivadas dan **49 normas y 38
tablas**, y `ESTADO.md` venía diciendo «50 PDF de la CSJN» y «39 tablas». Se
dejaron las derivadas, porque no pueden mentir sobre el archivo, y la
discrepancia quedó anotada como abierta.

### El nombre de la línea en `tasa`, atado a la cosa correcta

Javier: «creo que hay que eliminar el campo nombre cuando no es una sucesión. O
bien, evaluar agregarlo sólo en los casos que es necesario identificar, o si no
un + que permita "agregar campo para identificar la pretensión". ¿Cómo la ves?».

Ninguna de las dos. El «+» es un mecanismo más que aprender para un campo de
texto que vacío no cuesta nada. Y atarlo a «es sucesión o no» lo ata a la cosa
equivocada: dejaría el campo en la sucesión de una sola línea y lo sacaría del
ejecutivo de tres.

**La regla que quedó sale de para qué existe el campo.** El nombre existe para
distinguir dos líneas en la liquidación que va al expediente —el inmueble de tal
calle y el automóvil—. Con una sola línea no hay nada que distinguir, sea una
sucesión o sea un ordinario. Así que el campo aparece cuando hay más de una
línea, y se autoadministra: apretás «Agregar» y aparecen solos.

Esto **no deshace la regresión del 31/8 a la mañana**. Ahí el problema fue que no
había *ningún* lugar donde escribir qué era cada línea cuando había varias. El
lugar sigue estando, y aparece cuando hay varias.

**El valor no se borra al esconderse: se deja de leer.** Borrarlo castigaría un
clic —agregás una línea, la sacás, y perdiste lo que habías escrito en la otra—.
Lo que no puede pasar es que un nombre invisible salga impreso o viaje en el
permalink, así que la condición se vuelve a comprobar al *leer* y no se confía en
que el campo esté oculto. Es el mismo criterio con el que `vencimientos.html` lee
la ampliación por distancia, y por el mismo motivo.

Y la columna «Detalle» sale de la liquidación impresa cuando ninguna línea tiene
nombre: un encabezado sobre una fila de guiones no es información, y es el
criterio que la propia pantalla ya aplicaba —un campo que no aplica no ocupa
lugar, ni siquiera el de su rótulo—.

### Lo que quedó anotado y no hecho

**Plazos en horas**, a pedido de Javier, en `IDEAS.md`. No es «lo mismo con otra
unidad»: un plazo en horas tiene hora de arranque, y con eso entran tres
preguntas que el motor hoy puede ignorar —si el reloj se detiene de noche y el
fin de semana, qué pasa fuera del horario de tribunal, si el plazo de gracia se
aplica igual—. Ninguna la contesta el código que hay, y las tres mueven la
respuesta. Además obliga a revisar que las fechas viajen como `AAAA-MM-DD`, que
hoy es lo que evita que un conector devuelva una hora con un huso que el que la
lee no conoce.

---

## Escribiente: las seis fugas que encontró un documento largo — cerrado el 21/8

Estuvo en `ESTADO.md` hasta el 31/8, marcado como crónica que le correspondía a
este archivo. No se mudaba porque el control de datos personales del
`pre-commit` bloquea el commit: los cuatro valores de ejemplo que documenta —un
DNI sin puntos, uno con puntos y dos matrículas— son exactamente las formas que
ese control busca, y al mudarlos aparecen como líneas nuevas acá. **No entró
nada nuevo al repositorio**: los cuatro estaban versionados desde el 21/8 y son
sintéticos. Javier autorizó la mudanza el 31/8 —«no le veo daño»— y se hizo con
`git commit --no-verify`.

**El 21/8 pasó un documento largo y encontró tres fugas.**
un documento largo —hasta ese día lo más largo que había pasado por la herramienta
eran 5 fojas sintéticas—. El `.md` se revisó línea por línea contra el PDF. Las
tres están arregladas, con las cadenas exactas como regresión, y cada una lleva
en el código el comentario de dónde salió:

- **La constancia publicaba los nombres.** La clave del conteo de cada reemplazo
  elegido era `elegido: ${nombre}`, y la constancia imprime las claves: el `.md`
  terminaba con varios nombres y la cantidad de apariciones de cada uno.
  **El archivo anonimizado traía abajo el diccionario para deshacerlo.** Es el
  mismo bug que `documento.js` fue escrito para evitar —el nombre del archivo en
  el título— una función más abajo y en el otro extremo del `.md`. Ahora la
  clave lleva la etiqueta (`nombre propio → [TESTIGO]: 4`) y el detalle por
  nombre queda en la pantalla, que es donde no sale de la máquina. **Ninguna
  clave del conteo puede llevar texto del documento**, y eso está escrito arriba
  de `anonimizar()`.
- **Un nombre de dos palabras no se ofrecía nunca.** Los cuatro patrones de
  candidatos exigían tres palabras o una coma, así que un nombre de dos palabras
  —diez apariciones en claro, más cuatro sin tilde y una en mayúsculas— no se
  vio ni una vez en la lista. No es que se dejó pasar: no se ofreció. Y
  «Nombre Apellido» es la forma más frecuente que hay, porque el nombre completo
  aparece una vez y ése aparece en cada foja. Entraron dos patrones de dos
  palabras, y con ellos tres cosas que los hacen usables: `NO_SON_PERSONAS` casi
  duplicada, el recorte de las palabras de los extremos que no son nombre
  —«Compareció Hector Ernesto» perdía el nombre entero por el verbo de adelante—
  y el descarte del candidato que es pedazo de otro.
- **El DNI sin puntos no tenía regla.** La única que había exigía el formato
  `30.119.078` porque tiene que distinguirse de un monto. Un informe del
  un formulario oficial lo escribe sin puntos, y **cinco documentos
  de identidad salieron enteros y rotulados** (`DNI: 5432109`). La regla nueva
  se ancla en la palabra, que es lo que la hace segura: siete dígitos pelados no
  tienen forma propia, pero lo que viene después de «DNI» es un DNI.

**Y una decisión que cambió: los candidatos ya no vienen tildados.** Salvo las
dos partes de la carátula, que salen de una forma fija y no son una adivinanza.
El argumento es el mismo expediente: con todo tildado de fábrica se procesó con
40 reemplazos elegidos, de los cuales **27 no eran nombres de nadie** —
encabezados de tabla («Responsable Inscripto Fecha», 15 veces), títulos en
mayúsculas, un monto en letras—, y el texto quedó con «SOLICITA SE `[PERSONA]`»
y «PERSONAL DE LA `[PERSONA]` Y AFINES». Nadie destildó nada, y era esperable:
con cuarenta casillas ya tildadas gana el default. **Lo que decide es el modo de
fallar**: tildado de fábrica falla en silencio y corrompe el documento; sin
tildar falla a la vista, porque el nombre queda en el texto *y* la constancia lo
nombra.

**El segundo pase sobre el mismo expediente, el 21/8, cerró las otras tres.**
Salieron de la misma revisión y no eran fugas de una regla: eran materia que el
motor no miraba.

- **Los formularios `Etiqueta: valor`, que es donde estaba lo más sensible.** El
  motor estaba escrito para prosa, y la ficha del Registro Nacional de las
  Personas adjunta al exhorto no es prosa: `Apellidos:`, `Nombres:`,
  `Fecha Nac:`, `Clase:`, `Domicilio: Calle :…`, `Datos del Trámite:`, cada uno
  en su renglón. De todo eso el motor anonimizaba el teléfono. **Se reemplazan
  solos, y eso no contradice la regla de preguntar por los nombres**: la
  etiqueta hace inequívoca la forma, que es el criterio de siempre —detrás de
  `Apellidos:` no hay una cita de doctrina—, y es el mismo argumento que sostiene
  la regla de la firma. Tampoco le esconden nada a la lista de candidatos, que
  se arma sobre el texto crudo. **Las dos guardas son lo que las hace seguras:**
  los dos puntos son obligatorios —en prosa no hay— y el valor tiene que empezar
  en mayúscula, sin lo cual «Nombres: los que surgen del poder» quedaba como
  `Nombres: [PERSONA]`.
- **El domicilio sin piso.** La regla exigía piso o departamento después de la
  altura, y así se escribe la minoría: «Av. San Juan 640 CABA» y «Rivera 3120 CABA»
  pasaban enteras. Ahora hay dos reglas: la vieja, donde el piso es lo que acota,
  y una nueva anclada en la palabra —«domicilio», «sito», «calle»—. **El ancla no
  es un adorno:** sin ella la regla dice «cualquier palabra capitalizada seguida
  de un número», y eso también describe «el expediente 48210» y «el art. 431».
  De paso se arregló que el bloque de piso cortaba la palabra al medio
  (`[DOMICILIO]amento 2`).
- **La matrícula aceptaba una sola forma de escribirse.** Entran los dos puntos
  (`T: 62 F: 415`), la `O` que deja el OCR donde va el ordinal (`T°22 FO371`), el
  tomo con la palabra entera, y el campo de formulario `Matrícula N°: XXXV,
  FOLIO 271`.
- Y con ellas, **el tratamiento en mayúsculas y con dos puntos**: `SR :RODOLFO
  CÓRDOBA`, de una cédula, fallaba por las dos cosas a la vez. La regla pasó a
  correr con `i`, así que ahora también agarra «el perito Juan Pérez» en medio de
  la prosa. Como `i` apaga la distinción de mayúsculas, la guarda se mudó a una
  función: el nombre tiene que empezar en mayúscula y no puede llevar ninguna
  palabra de `NO_SON_PERSONAS`.

Sobre el mismo `.md` ya anonimizado —o sea, sobre un piso— las reglas nuevas
hacen **82 reemplazos más**, y no queda a la vista ni un DNI, ni una matrícula,
ni una calle con altura.

---

## El buscador de plazos del CPCCN, publicado en desarrollo — 31/8

Javier: «agregá la búsqueda de plazos, y ponele un botoncito, o chip que diga
"en desarrollo" así lo voy verificando en producción. Igual dudo que le
erremos… es texto de ley, a lo sumo podrá faltar un plazo».

**Ese es exactamente el riesgo que tiene y el que no**, y por eso se pudo
publicar sin curar. Los 198 plazos salen de un barrido mecánico sobre el texto
exacto del Código: un número mal es improbable, una ausencia no. El chip dice
justamente eso, y cambia qué hace el que no encuentra su plazo —sigue buscando
en el Código— en vez de concluir que no existe.

**Lo que el barrido no distingue es de quién es el plazo.** El art. 34 fija los
plazos en que el juez tiene que dictar resoluciones, y el art. 469 los del
perito para aceptar el cargo: son plazos, pero no son los de la parte. Por eso
cada resultado muestra **la oración literal del artículo**, entera y sin
recortar. Leída, no se confunde con nada; un resultado que dijera «10 días,
art. 34» y nada más estaría contestando otra pregunta. Media oración de una
norma dice otra cosa que la oración entera, así que tampoco se recorta con
puntos suspensivos.

**Sólo los plazos en días llenan el campo.** De los 198, hay nueve en meses
—las caducidades de instancia del art. 310— y cinco en horas. Se muestran y no
se pueden apretar, con el motivo escrito al lado: esta pantalla cuenta días
hábiles, y escribirle 6 a un plazo de seis *meses* daría una fecha plausible y
equivocada, que es la peor clase de resultado que puede dar.

**Los años y los minutos no entran al archivo, y no es un descuido.** Los siete
casos de años son edades —arts. 234 y 426—, antigüedad de matrícula —art. 563—
y términos que nadie escribe en un campo de días hábiles; el único de minutos es
la media hora de espera en una audiencia del art. 125. Están en el barrido en
markdown, que es donde se los mira.

**La búsqueda normaliza tildes y mayúsculas de los dos lados.** Hacía falta por
una razón concreta: la rúbrica de cada artículo —que es el mejor nombre para
buscarlo— viene en el Código en mayúsculas y sin acentuar, «CITACION». Sirve de
clave de búsqueda y **no se muestra como rótulo**, porque este repositorio no
publica texto sin acentuar. Lo que se muestra es la oración, que sí viene
acentuada porque es el texto de la ley. Todas las palabras tienen que estar, en
cualquier orden: «traslado demanda» encuentra el art. 338 y no los ciento y pico
que dicen «traslado».

**El resaltado se arma con nodos de texto y no con `innerHTML`.** La oración es
texto de la ley y no markup, y pegarla como HTML sería la única forma de que un
archivo de datos escribiera etiquetas en esa página.

### El archivo se regenera, no se parchea

`npm run barrer-plazos-json` rehace `data/plazos-cpccn.json` entero desde el
texto del Código. Lo único escrito a mano es la constante `CURADO` del script
—los cuatro atajos y dos notas—, que se aplica por `cita|cantidad|unidad`. **Si
una entrada curada deja de matchear ninguna fila, el script aborta** en vez de
seguir: una curación que apunta a un texto que cambió es un atajo que se pierde,
y perdido en silencio no se vería.

De paso el campo `dias` pasó a ser `cantidad` más `unidad`. Un campo llamado
`dias` con un 6 adentro que significa seis meses es exactamente la clase de cosa
que después mueve un número.

### Dos afirmaciones falsas en la guía publicada

Aparecieron al pasar por `documentacion.html` para describir el buscador, y las
dos eran sobre cosas que habían cambiado hacía semanas:

- **«El receso de invierno es estimado: doce días corridos desde el tercer lunes
  de julio».** Dejó de ser cierto el 17/8, cuando la feria pasó a salir de
  `data/feria-judicial.json` con la acordada citada. La guía seguía describiendo
  la fórmula que se había sacado *porque estaba mal*: contra las acordadas
  cargadas acierta poco más de la mitad de las veces y no puede producir 2020,
  cuando la feria se suspendió.
- **«Si la API de feriados no responde, esos días no se excluyen y el resultado
  puede quedar corrido».** Tampoco: los feriados están versionados en el
  repositorio y no se le pide nada a nadie durante el uso, y si falta un año la
  herramienta **no calcula** y dice cuál falta.

Las dos describían el comportamiento anterior con la misma seguridad con la que
habrían descrito el actual, que es lo que las hacía peligrosas. **Una guía no
tiene control automático que la contraste con el motor**, y `verificar-docs`
sólo comprueba que las normas y los artículos que nombra existan.

---

## El rediseño de `caducidad`, `entre-fechas` y `regresiva` — cerrado el 31/8

Era lo último que quedaba del pedido de uniformar las once calculadoras. Las
tres habían migrado al motor compartido el 26/8 sin que se les tocara la forma,
así que seguían con la de antes: una tarjeta centrada de 700 u 900 px, cajas
hundidas por grupo de campos, títulos de 28 px y botones que decían «Resetear».

**Las tres tomaron la forma de `vencimientos.html`**, con sus mismos criterios:
cada control ocupa lo que mide su contenido, lo único grande de la página es el
resultado, el formulario a la izquierda y la respuesta a la derecha, y nada se
separa con una línea si alcanza con el espacio.

### La regla que ordenó el trabajo: forma sí, comportamiento no

**Antes de tocar una línea se leyó qué selectores usa
`scripts/pruebas-calculadoras.html` sobre cada pantalla**, porque romperlos es
la forma fácil de arruinar un rediseño sin que se note. El contrato es por `id`
y hay que conservarlo entero: `#calculatorForm` recibe un `submit` en
`caducidad`, `#availableYears` tiene que seguir diciendo «disponible para» en
`entre-fechas`, `#infoAnios` tiene que seguir diciendo «Calculadora disponible»
en `regresiva`, y las tres tienen que seguir devolviendo el resultado en el
mismo elemento.

De ahí sale la única decisión de fondo del trabajo: **los errores siguen
saliendo por `alert()`**. Un cuadro de diálogo tapa la pantalla, no se puede
releer y no señala el campo, así que es peor que el error al lado del campo que
usa `vencimientos`. Pero el banco captura el `alert()` para distinguir «no
calcula» de un resultado: cambiarlo es un cambio coordinado de dos pantallas y
del banco, o sea comportamiento, y esto era forma. Quedó anotado como abierto.

**Que el banco siga en 75 de 75 es la prueba de que no se movió un número**, y
eso incluye las 21 filas que corren las mismas pantallas embebidas en el
tablero. Los iframes miden ahora 647, 738 y 659 px contra 647, 737 y 658 de
contenido: el mecanismo de alto no se rompió con el cambio de layout.

### Lo que se fue de cada una, y por qué

**`entre-fechas`.** Tres `.section` con fondo `--sunk`: la página parecía tres
formularios y no uno. Los `<input>` de 50 px fijos, que ahora miden lo que mide
su contenido. Y dos elementos **muertos**: `#apiWarning`, que existía en el
markup con su CSS y al que ningún JavaScript le escribía nunca, y `.api-fallback`,
que sólo existía en el CSS. Con ellos se fueron dos colores planos, `#fcf8e3` y
`#8a6d3b`. Los otros dos que quedaban eran `#ffe6e6` —el fondo del campo con
error, que en tema oscuro pintaba rosa claro debajo de texto casi blanco— y
`#5a6268`, el hover del botón de limpiar.

El número grande ahora dice **en qué se contó**: «58 · días corridos» o «18 ·
días hábiles». Son respuestas distintas a preguntas distintas y el número solo
no lo decía.

**`regresiva`.** El `.panel` hundido para el único grupo de campos que hay, y
los inputs con `flex: 1 1 250px` —un campo que pide un número de días no mide
250 px—. Se fue `#errorGlobal`, que sólo se usaba para repetir lo que el aviso
de cobertura ya decía cuando el calendario no cargaba: dos carteles para un
problema. Y `.badge`, que estaba en el CSS sin que ningún elemento la usara.

**`caducidad`.** `body { display: flex; align-items: center }` — era la única de
las once centrada verticalmente, y con el resultado abierto la página saltaba,
porque el contenido crecía y el centrado lo reacomodaba. Los rótulos «Día»,
«Mes» y «Año» debajo de cada casillero, que eran seis palabras para explicar un
formato que el placeholder ya dice. Y `.date-input-group { flex: 1 }`, que
estiraba tres campos de dos dígitos hasta el ancho de la tarjeta.

**Los hitos de `caducidad` no se tocaron**, comentario incluido. Son lo mejor
que tiene esa pantalla y explican por qué es la única de las cuatro que no
dibuja un calendario. Lo que sí se hizo fue mudarlos abajo y a ancho completo,
que es donde va el «porqué» en las otras tres.

Y una cosa que el rediseño **agregó**: la negativa de `caducidad` ya no se pinta
como un resultado. Antes «No se puede calcular» salía en la misma caja de acento
y con la misma tipografía grande que una fecha, o sea que una negativa se leía
con la autoridad de una respuesta.

### Dos bugs que aparecieron al probar, y no antes

- **La columna derecha quedaba vacía después de «Limpiar»** en `caducidad`. El
  handler escondía el resultado y no devolvía el aviso de espera, así que el
  formulario se corría de lugar y no quedaba nada diciendo dónde iba a salir la
  respuesta: peor que antes del rediseño. Se encontró probando el ciclo entero
  —calcular, limpiar— y no mirando la pantalla recién cargada, que es donde se
  ve bien.
- **El `<title>` de `vencimientos` era el nombre genérico.** Decía «Calculadora
  de Plazos Judiciales», que es además el `<h1>` de `regresiva`: en una pestaña
  y en el historial las dos se llamaban casi igual, y la genérica era la que
  hace lo más común. Ahora dice lo mismo que su propio `<h1>`. La decisión de
  nombre de fondo sigue abierta.

### Y una que no se hizo a propósito

`vencimientos` es la única de las seis sin el pie de autoría. Las otras cinco lo
llevan. El rediseño se lo dejó a las tres que tocó: sacárselo a tres para
emparejar con la que puede estar equivocada es la forma más cara de uniformar.

---

## Limpieza del repositorio y la imagen de enlace de la UMA — 31/8

Javier: «me gustaría hacer limpieza profunda del repo: los planes tiene sentido
guardarlos? un ejemplo es lo que acaba de ocurrir con el plan de cobertura de la
ley, ya estaba».

**El ejemplo que dio es exactamente el diagnóstico.** `PLAN_COBERTURA_LEY.md`
está hecho entero desde el 7/8 y lo dice en su propio encabezado; `ESTADO.md`
igual pedía «los seis puntos que quedan», que era al revés —seis hechos y cuatro
anotados sin fecha—. **Un documento cerrado que vive junto a los vivos se lee
como cola de trabajo**, y basta con que nadie vuelva a abrirlo para que la
confusión dure meses.

- **Los cuatro planes** —cobertura, cálculo directo, mediación y regulación en
  prosa, 2.024 líneas— pasaron a `docs/planes-cerrados/` con un `LEEME.md` que
  dice de cada uno qué decidió y cuándo se cerró. **Se archivan y no se borran
  porque lo que valen no es la lista de tareas sino el razonamiento**: por qué
  se resolvió cada punto de una forma y no de otra. La regla que queda escrita
  en `AGENTS.md`: un plan nuevo va en `docs/`, y se muda el día que se cierra.
- **`INFORME_REFACTOR_SHARED_CSS.md` se borró.** Era un análisis del 31/7 que
  nunca se ejecutó, sin una sola referencia, y describía los `h1` de 26-28 px y
  los `container` de 700-900 px de las once calculadoras. O sea: era el plan del
  rediseño que se terminó ese mismo día por otro camino. Un documento que
  describe un estado del código que ya no existe sólo puede confundir.
- **Cuatro de los cinco PDF de `docs/mediacion/` se fueron**, 1,6 MB. Cada uno
  tenía su `.md` al lado con el texto, y además el de la ley está en el
  repositorio `indice`. **Quedó la tabla 39 del Ministerio**, que no tiene `.md`
  y es de la que se lee el UHOM de agosto: sacarla sería perder la evidencia de
  un número que el sitio publica.

**De ahí salió una excepción escrita a una regla de `AGENTS.md`.** La regla dice
que los binarios ofimáticos no entran porque viajan con metadatos del documento
de origen. **Ese motivo no aplica a un decreto bajado de Infoleg**, así que la
regla queda con su excepción y sus dos condiciones: que no haya un `.md` al lado
que diga lo mismo, y que el archivo sea la evidencia de un número que el
repositorio publica. Una regla cuyo motivo no se cumple en un caso concreto se
afloja *ahí* y se escribe por qué; lo que no se puede es ignorarla en silencio.

**Lo que se revisó y se queda.** Las trece plantillas limpias de
`docs/modelos/`: el `.gitignore` ya documentaba que se versionan a propósito
—son la materia prima de la regulación en prosa y están sin datos de nadie—, y
los nombres que llevan adentro son citas de jurisprudencia publicada, que
`AGENTS.md` permite expresamente. `pruebas-locales/` sólo tiene un `LEEME.md`: el
material real está ignorado y fuera del árbol, como corresponde. Y `site/` es
salida de build, ignorada: los assets no están duplicados en git, que era la
duda.

### La imagen de enlace de la UMA

`uma-uhom.html` era la única página del sitio sin `og:image`, y a propósito: la
que le corresponde es su propio número grande, y poner la captura de Honorio
sería anunciar otra cosa.

La arma `npm run og-uma` desde `data/serie-uma.json` y `data/serie-uhom.json`,
así que sale de la misma fuente que la página. **Lleva la vigencia pegada al
número**, y ésa es la decisión que importa: la UMA se mueve casi todos los
meses, así que la imagen queda vieja sola. Con la vigencia al lado, una imagen
vieja compartida en un chat sigue diciendo algo cierto —«rige desde julio de
2026»— en vez de un número equivocado con cara de actual.

**El PNG se escribe a mano, sin dependencias**: el script arma la grilla de
píxeles, la comprime con `zlib` —que viene en Node— y le pone las cabeceras del
formato. **La contra, y es real: la tipografía no es Archivo.** Dibujar texto
con la tipografía del sitio necesita un motor de fuentes en Node o un paso por
el navegador, y para una imagen de vista previa ninguna de las dos cosas parecía
valer una dependencia nueva. Se probó la vía del navegador —un `<canvas>` con
Archivo de verdad— y salía mejor, pero el archivo sólo se puede sacar de ahí a
mano. Queda como alternativa si la letra molesta.

---

## El tablero pasó a ser la puerta, y las once dejaron de ser once links — 31/8

Hasta ese día el tablero era una comodidad nombrada en una línea del párrafo de
la landing. Javier: «yo apunto a que todo viva en el tablero. Que no es tablero
de plazos sino **tablero de herramientas** —mucho de plazos, pero también tasa,
honorarios del mediador, prorrateo—. Ese es el fin: ahí debe vivir todo, y no
herramientas sueltas en links sueltos. Las podemos mantener como referencia sí,
pero quiero que todos vayan a una misma pantalla, como centralizando el tráfico
ahí».

Lo que se hizo, todo en la misma sesión:

- **Se llama «Tablero de herramientas»**, `<title>`, `<h1>` y el título de cada
  pestaña. Se llamaba «de plazos» con tasa, prorrateo y mediación adentro.
- **Las dos mitades tienen nombre.** Arriba «Plazos», que antes era una barra de
  pestañas colgando del título; abajo, **«Honorarios y otros»** ---se llamaba
  «Honorarios y tasa»---, que es donde vive todo lo que no es plazo hasta que
  aparezca algo que permita agrupar de otra manera.
- **`ejecucion-estado` entró**, en la región de abajo. Era la única de las diez
  vivas que había quedado afuera y no había ningún motivo escrito. Va abajo y no
  arriba porque la fila de arriba son las seis que se usan todos los días y
  tienen atajo numérico.
- **Escribiente y `uma-uhom` entraron como enlace**, en pestaña nueva, con icono
  propio ---un documento y una serie, dos SVG inline--- y la flecha que avisa
  antes del click. Ninguna de las dos calcula. Y la promesa de Escribiente
  ---que el documento no sale de la máquina, con `connect-src 'none'`
  declarado--- se lee peor adentro de un marco ajeno, no mejor. Javier lo había
  pedido así: «no embebida, sino como enlace… quizás le podemos hacer una
  gráfica propia, un icono».
- **`index.html` lo pone arriba del listado, en bloque propio.** Las tarjetas
  sueltas se quedan abajo y ninguna URL se rompe, pero dejaron de ser el camino.
  El botón del encabezado que decía «Ver todas las herramientas» ahora abre el
  tablero.
- **El pie de autoría se oculta adentro de los marcos.** Es el mismo CSS
  inyectado que ya anulaba el `min-height: 100vh`, con una línea más:
  `.firma { display: none !important; }`. Para que alcanzara con un selector,
  los pies de `mora` y de `distancia` ---dos `div` con estilos en línea y sin
  clase--- llevan ahora `class="firma"`, que en esas dos páginas no está
  definida y por lo tanto no cambia cómo se ven sueltas. Verificado midiendo: el
  marco de `mora` pasó de 1101 a 996 px.

### Los dos nombres que se parecían

`regresiva` y `vencimientos` decían casi lo mismo en el `<h1>` y puestas al lado
en el tablero no se distinguían. Javier las nombró: **`vencimientos` es la
«Calculadora de plazos judiciales»** ---«es en realidad la más útil de todas, y
la más genérica: abarca más opciones y de hecho tiene un filtro de plazos que te
permite leer cualquier término»--- **y `regresiva` es la «Calculadora
regresiva»**, «tiene el nombre de lo que hace y además porque tiene una función
casi residual, un caso único descrito de utilidad y alguna que se le ocurra al
usuario». Se cambiaron el `<title>` y el `<h1>` de las dos, y los nombres en
`index.html`, `README.md` y `documentacion.html`. Las direcciones no cambian.

### Que embeber no mueve un número se comprobó, no se supuso

`scripts/pruebas-calculadoras.html` corrió entero después de todo: **75 de 75**,
los 21 casos verificados contra las páginas sueltas y otra vez contra las
embebidas. `verificar-calculos` dio 673 comprobaciones sin fallas y
`verificar-contraste` pasó AA en los dos temas.

Lo único que quedó abierto del tablero es lo que no se sabe probar: **no tiene
banco de pruebas de navegación**. Que los números no cambien está cubierto; que
las pestañas, el `#pestania` y las teclas sigan andando no lo prueba nadie.

### Las dos cuentas de `uma-uhom` que no coincidían, despejadas

La página decía 49 normas y 38 tablas, y `ESTADO.md` decía 50 PDF y 39 tablas.
Estaba anotado como «una de las dos está mal». **Las dos estaban bien**: cuentan
cosas distintas ---documentos leídos contra documentos que aportan un escalón---
y la diferencia es de un documento en cada serie. Javier aportó dónde vivían los
originales; se abrieron los dos:

- **Acordada 13/2018** no fija ningún valor: hace saber los de las acordadas
  3/2018 y 11/2018 ---$540 hasta el 31/12/2017, $567 y $624---, y esos importes
  los reemplazó después la 27/2018 con $1.350, $1.417 y $1.559, que son los que
  la serie tiene. Citarla habría metido un número que la propia Corte dejó sin
  efecto.
- **La tabla 05 del Ministerio, de marzo de 2018**, declara UHOM 390: el mismo
  valor que ya traía la 04 desde agosto de 2017. No abre un escalón; el cambio
  siguiente es mayo de 2018, en la tabla 06.

Los dos se leyeron del PDF, no se dedujeron.

---

## La devolución del tablero: la portada, las dos que faltaban y el 33 % — 31/8

Javier miró el tablero recién hecho y mandó una devolución larga. Lo que sigue
es lo que salió de ahí, y la pregunta que la abría es la que más importa.

### «¿Esto no se debe a forzar que el tablero sean HTML embebidos?»

Textual: *«analiza si esto no se debe a forzar que el tablero sean html
embebidos. porque si es eso, entonces no tengo miedo a decirlo: prefiero armar
todo denuevo y tirar una bomba nuclear para que quede bien, y no algo hecho
porque arrastramos de antes un formato. y aca, no te permito sesgos ni que me
digas "costo hundido" o fue mucho laburo»*.

**La respuesta es que no, y se comprobó abriendo `mora.html` sola:** tiene
exactamente los mismos defectos que adentro del marco. El título entero en
violeta y centrado, los tres campos de fecha apilados, el resultado como una
lista de renglones del mismo color, el mensaje de estado invisible. **El iframe
no causó ninguno.** Lo que hizo el tablero fue ponerlas una al lado de la otra,
que es literalmente para lo que se construyó: hacer visible una divergencia que
llevaba meses ahí y que nadie tenía por qué notar abriendo una sola pestaña.

Los defectos eran de dos clases y ninguna tiene que ver con el contenedor:

- **`mora` y `distancia` eran las dos que nunca habían recibido el rediseño.**
  Las otras ocho ya seguían el patrón de `vencimientos`.
- **Colores escritos a mano.** El mensaje de estado de `mora` se pintaba con
  `background: '#f8fdf8'` y el texto en `--fg`: en tema oscuro era blanco sobre
  blanco. Y `distancia` tenía un `@media (max-width: 640px)` que era una copia
  pegada de las reglas de escritorio ---volvía a poner `padding: 40px`,
  `max-width: 900px` y el `h1` centrado--- justo en el ancho donde había que
  hacer lo contrario.

**Lo que sí es un techo real del iframe, y conviene tenerlo escrito:** cada
herramienta trae su propio cromo ---cabecera, línea de cobertura, pie--- y el
tablero lo tapaba con CSS inyectado. Esa lista de selectores iba a crecer una
entrada por pantalla. Se resolvió al revés: **una sola clase, `solo-suelta`, que
ponen las calculadoras** sobre lo que sólo tiene sentido con la página abierta
por su cuenta. El tablero oculta esa clase y nada más.

Fusionar los diez HTML en un documento sigue descartado por lo de siempre: hay
colisiones de `id` reales y cada una es una oportunidad de mover un número. Y la
prueba de que embeber no cambia nada ---los 21 casos corridos dos veces--- deja
de existir el día que no haya dos cosas que comparar.

### La portada del tablero

Salió de un pedido concreto: *«arriba de todo, independientemente de en qué
herramienta estás, te muestra la fecha de hoy… ahí además ponemos el valor del
uma y el valor del uhom, visibles siempre junto a la fecha»*, más botones a
Honorio, a la landing, a la guía y al correo.

La fecha vivía adentro de `vencimientos` y sólo ahí; los dos valores, en
`uma-uhom.html`, que es otra página. **Ninguno de los tres depende de qué
pestaña estés mirando**, así que ahora se dicen una vez arriba. Con ellos subió
la línea de cobertura del calendario, que las cinco pantallas de plazos repetían
—*«me parece demasiado ruido que todas lo mencionen»*—.

**Lo que NO subió, y es la distinción que importa:** el aviso que sale *al
calcular* cuando el plazo toca un año sin Acordada de feria. Ése frena un número
y tiene que estar donde se pide el número. La línea de arriba es informativa; el
otro es una negativa a contestar.

### Se fue todo lo que explicaba cómo está armada la herramienta

Javier sobre el párrafo que decía de qué archivos salen los días inhábiles:
*«esto tampoco suma nada, nadie entiende de que va y el que llega al tablero no
quiere saber como esta armado, esa persona sera dev o un lawyer muy curioso o un
lawyer dev que no va ahi, va a ir a GitHub directo»*.

Se fueron: la bajada del tablero, el aviso de «recién estrenado», la línea que
explicaba los atajos, el colofón que pedía disculpas por si un número no
coincidía, y el párrafo de procedencia en `vencimientos`, `regresiva` y
`entre-fechas`.

**Y los atajos 1-6 no funcionaban**, cosa que Javier notó: *«además tocar 1 o 2
no hace nada»*. El motivo es que un evento de teclado no cruza de un iframe al
documento de arriba: el foco vivía adentro del marco y el oyente estaba afuera.
Se enganchó el mismo oyente adentro de cada marco al montarlo. El badge del
número decía algo que no pasaba, que es peor que no decir nada.

### `mora`, rehecha entera

Es la que estaba peor. Además del título y de los campos:

- **El botón «Forzar recarga (cache)»** era herencia de cuando los feriados se
  pedían a una API en vivo. Desde el 13/8 salen de un archivo versionado: no hay
  caché que forzar.
- **El mensaje de éxito enumeraba los años de feriados cargados** y de qué
  archivo salían. Además de no informarle nada a nadie, era el del contraste
  invisible.
- **El «detalle del cómputo» era una lista de fechas**, día por día, con el
  motivo al lado. Lo reemplaza el calendario dibujado, el mismo módulo que usan
  las otras tres.

**El dibujo de `mora` contesta algo que los otros tres no:** acá hay DOS conteos
pegados con reglas distintas. El primero saltea los inhábiles ---son días
hábiles--- y el segundo no saltea nada ---son corridos---. Una lista de fechas no
muestra eso; el calendario sí, porque el tramo de corridos se ve pasar por
arriba de un sábado sin detenerse. Por eso se agregó `.celda.corrido` al módulo
compartido, en tinte de `--ok`: otro conteo, otro color.

**Para dibujarlo, `Plazos.mora()` devuelve ahora `evaluados`**, el recorrido día
por día del tramo de hábiles. Se anota **mientras se cuenta**, adentro del mismo
bucle: armar la lista después, desde la pantalla, sería recorrer el calendario
una segunda vez con la convención de conteo copiada a mano, que es el modo de
falla que ya produjo el bug de la feria. El bucle no cambió; sólo se llena un
array. Los tres casos de `mora` del banco siguen dando lo mismo.

Y el dibujo va en su propio `try`: **una falla del calendario no puede llevarse
puesta una fecha que ya está calculada y bien.** Se pierde el dibujo y nada más.

### Los errores salieron del `alert()`

En `entre-fechas` y en `regresiva`, que eran las dos que quedaban. Van abajo del
formulario y marcan el campo que los causó. **Es un cambio de comportamiento y
no de forma**, y por eso fue junto con el lector de esas dos pantallas en
`scripts/pruebas-calculadoras.html`, que hasta ese día pisaba `window.alert`
para distinguir «no calcula» de un resultado y ahora lee la caja.

### El cómputo que `caducidad` no mostraba, eliminado

Vivía adentro de un `div` con `display:none`: la pantalla no lo mostraba y el
motor lo calculaba igual, en cada consulta, iterando a punto fijo dos veces. Se
fue entero ---la pantalla, `caducidadConInhabiles()` en `js/plazos.js` y las dos
aserciones de `verificar-plazos`---. **Un número que nadie ve no se puede
verificar ni desmentir**, y estas mismas pruebas llegaron a validarlo alguna vez,
porque un elemento oculto responde igual a `getElementById`.

### `prorrateo`: el 33 %, el imprimible y el enlace

El aviso de qué no entra en la base está al lado de la tabla, y dice las dos
cosas: que los honorarios de la parte condenada en costas quedan fuera por el
art. 730 *in fine*, y que con el honorario del mediador hay dos criterios ---«todo
concepto» de costas contra honorarios de la mediación *prejudicial*--- y elige el
que firma.

El 33 % es una tercera barra: **cuánto se le recorta a cada regulación**, con la
marca del tercio dibujada encima y un aviso cuando lo pasa. Es el umbral con el
que se argumenta confiscatoriedad, **no es una regla de la ley, y por eso se
muestra y no se aplica**: el importe prorrateado sale del art. 730 y es el mismo
lo pase o no lo pase. El porcentaje se calcula en el motor y no en la pantalla
porque ahora lo leen tres lugares ---la nota, la barra y el imprimible--- y tres
cuentas del mismo número se desincronizan.

Y salió el imprimible, con el enlace del caso abajo, que es lo que lo hace
auditable: el que recibe el papel puede abrirlo y ver las mismas entradas. **El
caso va en el fragmento (`#…`), que no sale del navegador**, igual que en `tasa`
desde el 27/8. La UMA **no** va en el enlace: es un dato del sistema y no del
caso, y guardarla congelaría un valor viejo adentro de un enlace que se abre
meses después.

### La landing

*«Prefiero dar a entender que lo que eran links sueltos son historia. ahora es
el tablero»*, y sobre el listado: *«los links "sueltos" no se si dejarlos o no.
vale la pena?»*.

- **El bloque del tablero pregunta antes de explicar**, con las preguntas que
  Javier escribió: cuándo vence un plazo, si corresponde ampliarlo por la
  distancia, cuánto hay que integrar de tasa, cómo se prorratea.
- **Las once tarjetas con enlace se fueron.** En su lugar hay un índice de
  contenido ---nombres y una línea cada uno, sin enlace---: si el tablero es la
  puerta, once links son once puertas de servicio. Las direcciones siguen vivas.
  Lo único que sigue enlazado es **lo que no está adentro del tablero**:
  Escribiente, `uma-uhom`, el asistente clásico, el cálculo directo y Bandejito.
- **El tablero tiene dibujo propio**, un plano en SVG con las dos regiones, la
  fila de pestañas y el plazo sobre el calendario. **No es una captura a
  propósito:** una captura envejece con cada cambio de la pantalla y hay que
  acordarse de rehacerla ---ya pasó dos veces con las de Honorio---. El plano
  dibuja la estructura, que es lo que no cambia. La captura se hace cuando el
  tablero deje de moverse.
- **«La exactitud del número es el producto» dejó de ser sólo de Honorio.**
  Javier: *«queda raro porque va referido principalmente a honorio y mezcla un
  poco todo… además ahora las demás herramientas tienen banco de pruebas
  propios»*. Ahora las tres columnas son de todo el repositorio: los diez
  controles que corren antes de publicar, las dos veces que se corre cada caso
  de plazos ---suelto y embebido---, y los cero cambios de resultado sin
  documentar. Las cifras de Honorio siguen ahí, atribuidas a Honorio, porque
  `verificar-honorio` las compara contra el motor.

