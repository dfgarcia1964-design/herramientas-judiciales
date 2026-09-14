# Instrucciones para agentes

Referencia canónica para cualquier agente que trabaje en este repositorio:
Claude Code, Codex, Cursor, opencode o el que venga. `CLAUDE.md` apunta acá y no
repite nada.

**Antes de tocar código, leé [`docs/ESTADO.md`](docs/ESTADO.md):** en qué punto
está el trabajo, qué está abierto, qué se sabe roto y qué trampas ya costaron
tiempo. Se actualiza en el mismo commit que el trabajo que describe, así que no
miente. Si cerrás una sesión, actualizalo.

**Con este archivo y ése alcanza para empezar.** Lo que ya se cerró vive en
[`docs/HISTORIA.md`](docs/HISTORIA.md), que **no se lee al arrancar**: se abre
cuando hace falta saber por qué algo quedó como quedó, si algo ya se probó, o de
dónde salió una regla.

## Modo de contestar en el chat al usuario:
Se breve y directo. El usuario es abogado, no dev y entiende de temas legales, no de software. Si tenes que responder sobre código, esforzate por hablar claro.

## Los límites, para cualquier agente

Método completo en `C:\IA\Pipeline drafter\METODO.md`. Lo que no se negocia:

1. **La arquitectura no se decide acá.** Si el trabajo la toca, se para y se pregunta.
2. **El criterio jurídico y la interpretación no son de ningún agente.** Son de Javier.
3. **Los archivos constitutivos no se tocan** salvo indicación expresa: `AGENTS.md`,
   `ESTADO.md`, `HISTORIA.md`, `HERMANOS.md`, `METODO.md`, `IDEAS.md`.
4. **`ESTADO.md` lo leen todos y lo escriben Javier y los agentes de razonamiento.**
   Un agente de ejecución reporta en `HANDOFF.md` y en el commit; no escribe la memoria.
5. **Un agente de ejecución trabaja sólo desde un `HANDOFF.md` con línea de verificación**,
   corre esa verificación, y **no decide si está terminado**: ejecuta y reporta.
6. **Ante una duda de criterio, se para y se escribe.** No se resuelve por analogía.
7. **Nada de datos personales ni material de causas propias**, en ningún archivo,
   comentario ni mensaje de commit. El hook global bloquea lo que puede; no reemplaza
   el criterio.
8. **Antes de escribir un cálculo, un parser de citas o una serie de índices**, fijate si
   ya existe en un repo hermano.

> Estas ocho líneas están copiadas textual de `METODO.md` y son las mismas en los cinco
> repos. Es la única duplicación deliberada del sistema: un límite tiene que estar visible
> donde uno está parado, y un agente bajo presión de tokens puede no seguir un puntero.
> **Si cambian, cambian en los cinco.**

En este repositorio hay además una regla que manda sobre todas: ningún cambio puede mover
un número sin que sea exactamente lo que se pidió. Está abajo, en «La regla que gobierna
todo lo demás», y es la que hace que casi nada de lo que toca cálculo sea delegable.

---

### `ESTADO.md` tiene presupuesto, y hay un control que lo hace cumplir

**`ESTADO.md` se lee entero al empezar cada sesión, así que cada línea de más se
paga en todas las sesiones que vengan.** El 28/8 tenía 3766 líneas y 223 KB
—unos 56 mil tokens por sesión—, y casi todo era crónica de trabajo ya cerrado,
acumulada día por día sin que nadie la sacara.

**La causa no es que nadie limpie: es que limpiar no tiene momento.** Cada sesión
agrega su sección al final y ninguna tiene motivo para sacar la de la sesión
anterior. Un documento que crece con cada commit y se poda cuando alguien se
acuerda sólo puede crecer. Por eso hay un techo, y no una recomendación.

`npm run verificar-estado` —en el `pre-commit` cuando el commit toca `docs/`, y
en CI antes de publicar— controla cinco cosas:

1. **El presupuesto: 1000 líneas**, con aviso a partir de 900. Pasado el techo,
   falla. Lo que hay que mudar es siempre lo mismo: lo que ya se cerró.
2. **Nada tachado.** Un `~~así~~` es algo cerrado que quedó escrito «para que se
   vea que se hizo». Eso es historia: **se muda, no se tacha.** Es la forma más
   común de engordar el archivo, porque cuesta cero y no se siente como agregar.
3. **Ningún título con fecha.** Un encabezado que termina en `— 27/8` es la
   crónica de una jornada, y **una crónica es historia desde que la jornada
   termina**, aunque sea la de hoy. Es lo que llevó el archivo de 900 a 3766.
4. **Ningún enlace interno roto**, y ningún enlace a un archivo que no existe.
   Mudar una sección deja atrás los `](#ancla)` que le apuntaban.

**Cómo se escribe entonces el trabajo de una sesión.** La crónica —qué se hizo,
qué se rompió, qué se discutió, con las frases de Javier y el detalle— va a
`HISTORIA.md`, en el mismo commit. En `ESTADO.md` va **sólo lo que el próximo
que llegue necesita saber para seguir**: lo abierto, lo roto, la decisión que no
hay que contradecir, la trampa que muerde. Si al escribir una línea en
`ESTADO.md` no sabés a cuál de esas cuatro cosas pertenece, va en `HISTORIA.md`.

---

## Repos hermanos

Este repositorio no vive solo. Son **cinco** y se reparten el trabajo: `knowledge`
(corpus crudo y wiki de jurisprudencia), `indice` (texto exacto por artículo y
doctrina), `herramientas-judiciales` (calculadoras y calendario judicial),
`pipeline-drafter` (el motor que redacta, y que consume a los otros tres) y
`redactor` (redacción asistida en una pasada, que consume a los cuatro).

**El mapa completo —quién le da qué a quién, por qué no se fusionaron y las reglas
de frontera— vive en `C:\IA\Pipeline drafter\HERMANOS.md`.** Es la fuente única y acá no se copia, para que no
se desincronice. Abrilo antes de tomar una decisión que cruce de repo.

Lo que hay que saber sin abrirlo:

- **Éste es el único de los cinco que es público y está desplegado.** Por eso
  los otros cuatro no se fusionan con él, y por eso nada que venga de un repo
  privado entra sin barrer antes comentarios, nombres de variables, fixtures
  y mensajes de error: son los que arrastran ejemplos de documentos reales.
- **El pedido de `pipeline-drafter` está cerrado desde el 2/9:** `conectores/`
  expone el calendario judicial y el cómputo de plazos por HTTP local y por MCP,
  y de aquel lado `pipeline/plazos.py` ya los consume. **Cambiar la forma de una
  respuesta rompe a alguien**, así que el contrato de `conectores/` no se toca
  sin mirar allá. Detalle en [`docs/ESTADO.md`](docs/ESTADO.md).
- **Y hay un cuarto consumidor, que no pasa por `conectores/`:** desde el 11/9
  el repositorio `ledger` —privado, fuera de los cinco— **carga
  `calendario-judicial.js` y `plazos.js` desde el sitio publicado**, con los
  tres JSON de `data/`, y los consulta en el navegador. Para él el contrato es
  la API de `window` de los motores —`CalendarioJudicial.CONFIG` reescribible,
  `init`, `Plazos.caducidad` y `Plazos.vencimiento`—, las rutas publicadas y,
  desde el 14/9, el enlace con que abre `vencimientos.html`
  (`#modalidad=automatica&fecha=AAAA-MM-DD&plazo=N`).
  **No se cambian sin avisar al ledger**: si se rompen no da error, deja de
  mostrar vencimientos —o muestra uno equivocado— sin decir por qué. Qué usa
  exactamente, en [`docs/ESTADO.md`](docs/ESTADO.md).

Y la regla que más ahorra trabajo: **antes de escribir un cálculo, un parser de
citas o una serie de índices, fijate si ya existe en un hermano.**

## La regla que gobierna todo lo demás

Esto no es software donde un bug se descubre en producción y se arregla el
martes. Un cálculo de honorarios puede terminar fundando una resolución
judicial, y una fecha de vencimiento mal computada hace perder un derecho.
**La exactitud del número es el producto.** El código es el vehículo.

De ahí una sola regla, de la que se derivan casi todas las demás:

> **Ningún cambio puede mover un número sin que eso sea exactamente lo que se
> pidió, esté justificado en la norma y quede escrito.**

Un refactor que mejora el código y cambia un resultado no es un refactor
mejorado: es un error. Los resultados actuales se consideran correctos y son
la referencia a preservar, salvo que se demuestre lo contrario con el caso
concreto.

Lo que se sigue de eso:

- **No cambies escalas, porcentajes, coeficientes ni reglas normativas** sin
  pedido explícito. Si creés que algo está mal, decilo con el caso: qué
  entrada, qué da hoy, qué debería dar, y qué artículo o criterio lo funda.
  Después esperá confirmación.
- **No "simplifiques" una fórmula legal.** Lo que parece una redundancia suele
  ser una distinción de la ley. El orden de los pasos importa: aplicar una
  quita sobre la base no es lo mismo que aplicarla sobre la escala.
- **No elimines validaciones** porque parezcan defensivas de más.
- **No confíes en el motor clásico como oráculo.** Es la referencia histórica,
  no la verdad. Ya se encontró un caso donde el clásico y Honorio compartían el
  mismo agujero. Que dos implementaciones coincidan prueba que son consistentes,
  no que están bien.

**Lo que sí podés hacer sin preguntar:** cambios de interfaz, texto, estilos,
tipos, estructura de archivos, documentación y cualquier cosa que no toque un
resultado. No hace falta un plan aprobado para renombrar una variable. El
riesgo acá no es el tamaño del cambio, es si un número se movió.

Orden de prioridades cuando entran en conflicto:
**1) exactitud legal, 2) claridad, 3) mantenibilidad, 4) funcionalidad nueva,
5) performance.** La performance va última en serio: son calculadoras que
corren en milisegundos.

---

## Cada afirmación contra su fuente

Antes de afirmar algo, fijate **de qué tipo es la afirmación**, porque cada una
tiene su fuente y son distintas:

| La afirmación es sobre… | Se verifica contra… |
|---|---|
| **Qué dice la ley** | El texto: [`docs/domain/00_LEY_27423.md`](docs/domain/00_LEY_27423.md) |
| **Qué hace la aplicación** | El código, leído. No un documento que lo describa |
| **Una interpretación** | La jurisprudencia que la sostiene. Sin un fallo detrás, no se afirma |

Confundirlas fue el error que dejó los ocho documentos de `docs/domain/`
describiendo mal el motor que documentaban —un decreto inventado, artículos
corridos en bloque, y uno que aplicaba las reducciones en el orden equivocado:
medio millón de diferencia en el caso que se probó—. Salieron así porque **se
generaron a partir de una descripción del sistema y no del sistema**, y después
se «verificaron» leyendo el propio documento. La estructura sobrevive a ese
proceso; los datos no. El detalle está en [`docs/HISTORIA.md`](docs/HISTORIA.md).

De ahí tres cosas que sí funcionan:

- **Anclá cada afirmación a algo que se pueda abrir o correr.** No «el wizard
  pregunta esto» sino «`PROCESS_STEP_MAP`, una constante». No «la escala
  funciona así» sino un ejemplo con los números que la app muestra en pantalla.
  Una afirmación anclada se puede desmentir; una general no.
- **Ninguna descripción secundaria es oráculo.** Ni el motor clásico, ni un
  documento anterior, ni el documento que estás corrigiendo. Si hay que arreglar
  una afirmación, buscá **la clase**, no la instancia que te señalaron: en
  `05_DEPENDENCIAS.md` se corrigió una y quedaron cuatro iguales en los
  diagramas, con el encabezado declarando el arreglo como hecho.
- **Una nota de verificación que no es cierta es peor que ninguna**, porque el
  que la lee deja de mirar. Si decís «verificado contra X», tuvo que ser contra
  X y entero.

**`npm run verificar-docs`** controla lo que se puede controlar solo: que las
normas, los artículos y los identificadores que los documentos nombran existan.
Corre en CI antes de publicar. No dice que un documento sea cierto —eso se
verifica leyendo el motor— pero una cita inventada no llega a producción.

### Una interpretación se funda en un fallo, no se declara

Un razonamiento propio, por bueno que sea, deja a la app diciendo «esto lo
decidimos nosotros», y al que lee no le queda más que creer o no creer. **Un
fallo cambia quién lo sostiene:** ya no es Honorio, es un tribunal que resolvió
el punto en un documento de prueba, con carátula y fecha, que se puede leer y
discutir.

- El fallo va en `honorio/lib/legal/jurisprudencia.ts`, dentro de un `Criterio`
  con su frase y sus `Fallo[]`. Son datos puros: la presentación decide cómo se
  ven.
- La cita lleva **tribunal y sala, expediente, carátula y fecha**, y `url` a la
  sentencia publicada cuando exista. Sin expediente no es una cita: es una
  referencia.
- **Si no hay fallo, la interpretación no se afirma.** Se declara abierta, en el
  bloque de «qué no hace» y con el motivo. Si hay **doctrina** —un autor, una
  obra, una página— vale como fundamento de segunda mejor calidad, y se cita
  como lo que es: no se disfraza de jurisprudencia.

**Esta regla todavía no se cumple en todas partes, y conviene saberlo antes de
apoyarse en ella.** `jurisprudencia.ts` tiene fallos para algunos criterios y no
para otros: la elección entre el art. 22 y el art. 25 para la caducidad, por
ejemplo, no tiene ninguno cargado y sin embargo la aplicación adopta un
criterio. El barrido completo —listar cada punto donde Honorio decide algo que
la ley no resuelve sola y anotar con qué está fundado— está pendiente. Hasta que
se haga, **esta sección describe a dónde va el proyecto y no dónde está**, y no
hay que citarla como si fuera lo segundo.

**Y una advertencia que vale más que la regla.** Una cita de jurisprudencia
inventada es el peor error que este proyecto puede cometer: es indistinguible de
una buena, `verificar-docs` **no la caza** —controla normas y artículos, no
fallos— y termina adentro de un documento que produce resoluciones judiciales.
**Un fallo se transcribe de la sentencia leída, o no se escribe.** Nunca de
memoria, nunca reconstruido, nunca «debe existir uno que diga esto».

---

## Qué hay acá

No es una aplicación: son varios proyectos independientes, en distinto grado
de madurez, conviviendo en un repositorio. Tratalos como tales — un cambio en
`calculadoras/` no tiene por qué mirar `escribiente/`.

```
asistente-honorarios-clasico/   El motor original en JS vanilla del que salió Honorio.
                                  Referencia histórica. Sigue publicado y funcionando.
                                  Es la FUENTE del motor legacy que Honorio todavía carga.
calculadoras/                   Herramientas de un solo archivo HTML con JS embebido
                                  (plazos, mora, tasa, prorrateo, caducidad...).
                                  Sin build, sin bundler: se editan directo.
                                  js/calendario-judicial.js es la dependencia compartida
                                  de todo lo que calcula fechas, y js/plazos.js es la
                                  aritmetica de plazos --vencimiento, mora, caducidad,
                                  dias entre fechas y plazo regresivo--. Desde el 26/8
                                  las CINCO pantallas de plazos la CONSUMEN y ninguna
                                  tiene aritmetica adentro: leen el formulario, llaman
                                  y escriben. Una cuenta con consecuencia juridica
                                  escrita dos veces es el modo de falla que produjo el
                                  bug de la feria, asi que no se vuelve a copiar.
                                  js/distancia.js es el computo del art. 158 --la
                                  regla de los 200 km, la linea recta y la busqueda
                                  en la tabla de la Acordada 5/2010-- y sale del
                                  mismo criterio: es codigo puro, corre en Node y
                                  lo cubre npm run verificar-distancia.
                                  js/dibujo-plazo.js y css/dibujo-plazo.css son el
                                  plazo dibujado, por el mismo motivo: cuatro copias
                                  de la misma grilla se desincronizan.
                                  js/enlace.js lee el caso que viene en el enlace
                                  (#fecha=...&plazo=...) para las cinco de plazos:
                                  completa el formulario y no calcula.
conectores/                     El calendario y el computo de plazos, consultables desde
                                  codigo. nucleo.mjs carga los motores de navegador en
                                  Node; http.mjs y mcp.mjs son transportes finos encima
                                  y no calculan nada. Salio de un pedido de
                                  pipeline-drafter.
data/feriados.json              Feriados nacionales, versionados. Los genera
                                  scripts/actualizar-feriados.mjs (npm run feriados).
data/feria-judicial.json        Feria de invierno, una linea por anio con su
                                  Acordada de la CSJN. Se carga a mano: no hay API.
data/dias-inhabiles.json        Asuetos por Acordada. Este sí se edita a mano.
data/acordada-5-2010-distancias.json
                                La tabla del ANEXO de la Acordada 5/2010 de la CSJN:
                                  45 asientos federales con su distancia por ruta y
                                  por via ferrea desde la Capital Federal, y los dias
                                  del art. 158. El anexo NO esta en Infoleg --el texto
                                  se corta donde la tabla empieza-- y en
                                  argentina.gob.ar esta como imagen: se transcribio de
                                  ahi. La regla de la Corte es tomar LA MAS LARGA de
                                  las dos medidas, no la ruta. Lo controla
                                  npm run verificar-acordada.
data/contorno-argentina.json    El contorno de las 24 jurisdicciones, para DIBUJAR
                                  el mapa de distancia.html. Sale de la capa
                                  ign:provincia del IGN, simplificado por
                                  scripts/armar-contorno-argentina.mjs
                                  (npm run contorno). No sirve para decidir de que
                                  lado de un limite cae un punto: la simplificacion
                                  mueve la linea hasta unos 2 km, y el archivo lo
                                  dice de si mismo.
escribiente/                    PDF a Markdown y anonimizacion, en el navegador.
                                  Estatico, sin build y sin dependencias: se abre y
                                  se edita. El motor (js/motor/) es codigo puro, no
                                  toca el DOM y corre en Node: por eso se puede
                                  probar con `npm run verificar-escribiente`, que
                                  corre en CI. Antes se llamaba PDF-studio.
                                  Las librerias van versionadas en vendor/ y la
                                  pagina declara `connect-src 'none'`: las dos
                                  cosas sostienen la promesa de que el documento
                                  no sale de la maquina. No las saques.
docs/domain/                    Documentación del dominio (01 a 09): tipos de proceso,
                                  reglas de negocio, modelo, glosario, deuda técnica,
                                  y el honorario del mediador, que es el único que
                                  no sale de la Ley 27.423. El "por qué" de las reglas.
                                  Lo comparten el clásico y Honorio; por eso quedó acá.
assets/                         Capturas y material de la landing.
redirects/                      Redirecciones de URL viejas que no pueden morir en 404.
scripts/build-docs.mjs          Renderiza docs/domain/ a HTML para publicarlo.
index.html, documentacion.html  Landing y guía de uso, publicadas en GitHub Pages.
proyectos finalizados/          Trabajos cerrados, conservados como muestra.
```

Antes de tocar lógica legal en cualquier lado, pasá por
[`03_REGLAS_DE_NEGOCIO.md`](docs/domain/03_REGLAS_DE_NEGOCIO.md) y
[`07_GLOSARIO.md`](docs/domain/07_GLOSARIO.md) para el razonamiento normativo, y
por [`08_DEUDA_TECNICA_FUNCIONAL.md`](docs/domain/08_DEUDA_TECNICA_FUNCIONAL.md)
por si el problema ya está anotado.

### Honorio no vive acá

Se mudó el 4/8/2026 a [`javiercuneo/honorio`](https://github.com/javiercuneo/honorio),
con su historia completa, y se publica en [honorio.ar](https://honorio.ar). Ese
repositorio tiene su propio `AGENTS.md`, su `ESTADO.md` y sus validaciones.
**Cualquier cambio al motor de honorarios va allá.**

En la copia de trabajo hay un `honorio/`, ignorado por `.gitignore`: es un clon
del repositorio nuevo, con su propio `.git`. `git remote -v` antes de commitear,
y cada uno se commitea por separado.

Lo que quedó acá y sigue compartido:

- **`asistente-honorarios-clasico/`** es la FUENTE del motor legacy que Honorio
  todavía carga por `<script>` (`public/legacy/*.js` allá). Si hay que arreglar
  algo de ese motor, **se arregla acá** y se propaga al otro repositorio a
  propósito. **Nunca se parchea una copia sola.**
- **`docs/domain/`** documenta la Ley 27.423 para los dos. Si algún día el
  clásico se retira, esos nueve documentos se van con Honorio.
- **Los planes de features de Honorio** —`PLAN_COBERTURA_LEY.md` y los tres que
  salieron de él— viven de este lado, porque la materia prima —calculadoras,
  textos legales— está acá. Acá va la decisión; allá el código. **Los cuatro
  están cerrados y desde el 31/8/2026 viven en
  [`docs/planes-cerrados/`](docs/planes-cerrados/LEEME.md)**: sueltos en `docs/`
  se leían como cola de trabajo, y eso ya hizo que `ESTADO.md` pidiera «los seis
  puntos que quedan» de un plan que estaba hecho. **Un plan nuevo va en `docs/`,
  y se muda el día que se cierra.**
- **Las cifras de Honorio que este repositorio publica** —la versión, las
  validaciones, los tipos de proceso, los recorridos de la entrevista y los
  cruces del barrido— están escritas a mano en `index.html`, `README.md`,
  `documentacion.html` y la tabla de
  [`01_PROCESOS.md`](docs/domain/01_PROCESOS.md). Ninguna de esas páginas tiene
  build, así que envejecen en silencio: ya pasó dos veces.
  **`npm run verificar-honorio` las compara contra el motor** y dice qué
  archivo quedó viejo y en qué número. Necesita el clon de `honorio/`, así que
  **no corre en CI** —allá no existe— y hay que acordarse de correrlo cuando
  sale una versión de Honorio. Y se revisa la prosa, no sólo el dígito: la
  enumeración de al lado envejece igual.

---

## Las calculadoras

Un archivo HTML cada una, con su CSS y su JS adentro. Sin build y sin bundler:
se abren, se editan y se guardan. Esa simplicidad es deliberada: duran años sin
mantenimiento.

Comparten cuatro cosas, y las cuatro afectan a varias herramientas a la vez:

- **`calculadoras/js/calendario-judicial.js`**, del que depende todo lo que
  computa fechas. Lo usan las **cinco** de plazos: `caducidad`, `entre-fechas`,
  `mora`, `regresiva` y `vencimientos`. Un cambio ahí se verifica con
  `npm run verificar-calculos` **y** abriendo las cinco: el script cubre el
  motor, no las pantallas.

  Ahí vive también `problemaDeDatos()`, la frase que explica por qué una
  herramienta no calcula. **No se reescribe en cada calculadora**: cinco copias
  de la misma prosa en cinco archivos sin build se desincronizan.
- **`calculadoras/js/dibujo-plazo.js` y `calculadoras/css/dibujo-plazo.css`**,
  el plazo dibujado sobre el calendario. Los consumen `vencimientos`,
  `entre-fechas` y `regresiva`; `caducidad` no, y el motivo está en su `<style>`.
  **El módulo decide cómo se dibuja un día y no qué significa:** recibe un mapa
  de marcas ya armado y no mira un resultado del motor. Lo que significa cada día
  lo arma cada pantalla, porque las cuatro contestan preguntas distintas.
- **`calculadoras/js/enlace.js`**, el caso que viene en el enlace. Lo usan las
  cinco de plazos. **El módulo decide cómo se lee y cómo se avisa; qué nombre va
  a qué campo lo pone cada pantalla**, en su esquema. Las tres decisiones —el
  fragmento y no la consulta, completar sin calcular, y con un dato inválido no
  completar ninguno— están en su cabecera. **Los nombres de `vencimientos` son
  contrato con el `ledger`**: la lista entera está en `ESTADO.md`.
- **`calculadoras/css/comun.css`**, que define los tokens del sistema visual y
  una base mínima. Cada archivo lo carga *antes* de su propio `<style>`, así que
  lo local sigue ganando y cada uno resuelve su layout. **No redefinas un token
  del sistema dentro de un `<style>`:** `--accent: var(--accent)` es un ciclo,
  deja la variable en la cadena vacía y no da ningún error visible. Ya dejó dos
  calculadoras con el botón invisible; está en `ESTADO.md`.

Un cambio visual se verifica midiendo, no mirando: contraste sobre estilos
computados, en tema claro y oscuro, y ancho a 390 px. Un control estático
—«tokens aplicados, sin colores planos»— ya dio verde sobre páginas ilegibles.

**Los feriados no se le piden a nadie en tiempo de uso.** Salen de
`data/feriados.json`, versionado. Si falta un año, la herramienta **no calcula y
dice cuál falta**: no hay medio resultado. El archivo se regenera con
`npm run feriados`, que consulta la API en el build y aborta entero si un año
viene incompleto.

**Y un día inhábil tampoco se deduce con una fórmula.** La feria judicial de
invierno la fija la CSJN por Acordada cada año, y hasta el 17/8/2026 el código
la calculaba —el penúltimo lunes de julio—. Contra las 21 Acordadas cargadas esa
fórmula acierta 12 veces, y no puede producir 2020, cuando la feria se
**suspendió**: habría inventado doce días inhábiles que no existieron. Ahora sale
de `data/feria-judicial.json`, con la Acordada citada al lado de cada año.

De ahí la regla general: **una regla que la ley fija por acto, va en datos con la
cita del acto; una que la ley fija por criterio, va en código.** Si dudás de cuál
es, la pregunta que decide es si alguien puede cambiarla sin cambiar la ley.

**El único control automático sobre resultados de cálculo es
`npm run verificar-calculos`.** Cubre el motor de días hábiles, no las pantallas
ni la aritmética propia de cada calculadora. Correlo antes y después de tocar
cualquier cosa que mueva fechas, y si un número cambia, que sea porque decidiste
cambiarlo.

---

## Datos: qué no entra a este repositorio

Este repositorio es público. Todo lo que entra —código, comentarios, `docs/` y
**los mensajes de commit**— lo lee cualquiera, y no se saca después: un commit que
borra algo lo deja igual de accesible y encima señala dónde estaba.

`scripts/verificar-datos.sh` corre como hook de `pre-commit` y bloquea lo de abajo.
Está para atajar el olvido, no para reemplazar el criterio. Los términos propios que
verifica se leen de una lista privada, fuera del árbol: `git config datos.listaPrivada`.

**Y no corre sólo acá: es el verificador de todos los repositorios de la
máquina.** Desde el 25/8/2026 `core.hooksPath` global apunta a un hook compartido
—la fuente está en `scripts/hooks/pre-commit` y la instala
`scripts/instalar-hooks.sh`— que corre este archivo en cualquier repositorio,
incluidos los que todavía no existen. Antes había una lista de repositorios
escrita a mano, y uno nuevo no quedaba cubierto sin que nada avisara.

Tres consecuencias que hay que tener presentes:

- **Este archivo es la fuente única y lo lee otro repositorio en vivo.** Un patrón
  que se afloja acá se afloja para todos. Hubo dos copias hasta el 25/8 y se
  desincronizaron: la de afuera tenía un arreglo que ésta no.
- **`core.hooksPath` global desactiva `.git/hooks/` en toda la máquina.** Lo que
  sea propio de un repositorio va en su `.githooks/pre-commit`, al que el hook
  compartido encadena. Acá eso es el aviso de las cifras de Honorio.
- **No pongas `core.hooksPath` por repositorio:** pisa al global y el control de
  datos personales deja de correr, en silencio.

**No entra:**

- Nombres de personas, domicilios, teléfonos, correos, DNI, CUIT/CUIL, CBU ni
  matrículas. Ni en archivos, ni en comentarios, ni en mensajes de commit.
- Carátulas ni números de expediente de causas propias. Las citas de jurisprudencia
  publicada sí —con tribunal, sala, expediente, carátula y fecha—, pero **sin anotar
  la relación de la causa con esta oficina**: esa anotación no funda nada y ubica todo.
- Binarios ofimáticos: `.docx`, `.pdf`, `.xlsx`. Viajan con metadatos, encabezados e
  identificadores del documento de origen que no se ven al abrir el archivo.
  **La excepción, escrita el 31/8/2026: una norma oficial publicada sí puede
  entrar** —un decreto de Infoleg, una tabla del Ministerio—, porque el motivo de
  la regla es el metadato del documento *de la oficina*, y eso no existe en un
  PDF que cualquiera baja de un sitio público. **Con dos condiciones:** que no
  haya un `.md` al lado que diga lo mismo, y que el archivo sea la evidencia de
  un número que el repositorio publica. Ese mismo día se sacaron cuatro PDF de
  `docs/mediacion/` que sí tenían su `.md`, y quedó sólo la tabla del Ministerio
  de la que se lee el UHOM.
- Enlaces al visor de expedientes, ni vocabulario de sistemas internos.
- El material de trabajo del que salen las plantillas. Vive fuera del árbol, no
  ignorado adentro: un `.gitignore` no saca lo que ya entró.

**Los datos de prueba son inventados: la forma del caso, el contenido de nadie.**
Un tomo y folio cualquiera prueba exactamente lo mismo que la matrícula de alguien.
Vale igual para las regresiones y para los comentarios que las explican.

**Los mensajes de commit son texto publicado**, y no se editan sin reescribir la
historia. La regla es más estricta ahí que en cualquier archivo: ni nombres, ni
cantidad de fojas, ni fechas de actuaciones, ni la palabra «real».

**Se describe la forma, no el caso.** «Un documento largo» en vez de la cantidad de
fojas; «un formulario oficial» en vez de nombrar el organismo. Un dato que no
identifica a nadie por separado identifica igual cuando va con otros tres.

**Si falta una referencia que parece que debería estar, falta a propósito.** No completarla.

---

## Convenciones del repositorio

- **Español rioplatense, con tildes**, en interfaz, documentación y commits.
  No "tú", no "vosotros", no texto sin acentuar. **Los comentarios de código sí
  pueden ir sin tildes; el texto que ve el usuario, no** —y eso incluye los
  mensajes de error que arma el código, que es donde se cuela—. Escribiente
  salió entera sin acentuar en su primera versión, del 17/8, y por eso
  `verificar-escribiente` ahora comprueba la acentuación de los mensajes del
  motor.
- **Sin emojis, ni en documentación ni en interfaz.** `ESTADO.md`, `README.md` y
  `CONTRIBUTING.md` marcan el registro: directo, con las razones dichas, sin
  decoración.
- **Commits en español**, con prefijo tipo `feat:`, `fix:`, `docs:`,
  `chore:`. Miralos con `git log --oneline` antes de escribir el tuyo.
- **`git commit -m` con here-string falla** en este entorno. Usá
  `git commit -F <archivo>`.
- **Licencia MIT** para todo lo que hay acá. La excepción —Honorio, bajo
  AGPL— se fue con él; el CLA de `CONTRIBUTING.md` aplica en aquel
  repositorio, no en este.
- **La landing publica lo que la allowlist de `pages.yml` nombra.** Si agregás
  algo al sitio, va ahí *y* se enlaza desde `index.html`. Si no, no existe para
  nadie: ya pasó con PDF-studio, que estuvo meses publicado y sin figurar.

---

## Trampas conocidas

Las vivas están en la sección final de [`docs/ESTADO.md`](docs/ESTADO.md), con el
detalle de qué pasa y por qué. No se duplican acá para que no se desincronicen.
Si te chocaste con una nueva, agregala ahí; si una dejó de aplicar, mandala a
[`docs/HISTORIA.md`](docs/HISTORIA.md) en vez de borrarla.
