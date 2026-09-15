# Escribiente

Pasa escritos, resoluciones y expedientes en PDF a Markdown, y anonimiza los
datos personales antes de que el texto salga del expediente.

Nace de un problema concreto: tengo el documento en PDF y lo necesito en texto
—para citarlo, para compartir un fragmento, para archivarlo liviano sin las
cuarenta capas de un PDF del sistema de gestión— y no puedo hacer nada de eso
llevándome puestos los nombres de las partes.

**Todo corre dentro del navegador.** El documento no se sube a ningún servidor,
no hay backend, y no existe la posibilidad de que lo haya: ver
[Cómo se sostiene esa promesa](#cómo-se-sostiene-esa-promesa).

Publicado en <https://javiercuneo.com.ar/escribiente/>.

---

## Qué hace

**Convertir a Markdown.** Reconstruye líneas y párrafos desde las coordenadas
del PDF, une palabras cortadas por el margen, detecta columnas, marca títulos,
y saca el ruido: membretes repetidos, numeración de páginas, sellos y los
códigos del sistema de gestión (`#12345#`).

**Anonimizar, en dos niveles.** El primero es automático y reemplaza lo que
tiene forma inequívoca —DNI, CUIT, CBU, CVU, teléfonos, correos, expedientes,
matrícula tomo/folio, domicilios, patentes, y el nombre de quien firma
conservando el cargo—, más **los campos de formulario**, donde la etiqueta hace
inequívoco lo que sigue: `Apellidos:`, `Nombres:`, `Domicilio:`, `Fecha Nac:`,
`Matrícula N°:`. Ahí es donde vienen las fichas de identidad adjuntas a un
expediente, que es lo más sensible que pasa por la herramienta. El segundo son **los nombres propios, que se te
muestran para que decidas uno por uno**, con la cantidad de apariciones y una
etiqueta a elegir (`[ACTOR]`, `[DEMANDADO]`, `[PERITO]`...). **Vienen sin
tildar**, salvo las dos partes de la carátula: una casilla tildada de fábrica no
es una pregunta, y lo que se ofrece son candidatos, no certezas. Los que dejes
sin tildar quedan en el texto y la constancia los nombra.

Ese segundo nivel no es una comodidad, es el diseño. Ninguna regla puede
distinguir sola `Pérez, Juan Carlos` —la parte, hay que ocultarla— de
`Llambías, Jorge Joaquín` —doctrina, hay que conservarla— ni de
`Buenos Aires, Astrea`, que es una editorial. Reemplazar por adivinanza corrompe
el texto; no reemplazar filtra. Preguntar es lo correcto, y son treinta segundos
de casillas.

**Rechazar lo que no puede trabajar.** Un PDF que es una imagen pura no tiene
texto que extraer. Se rechaza con el motivo y la cuenta de caracteres por
página, en vez de devolver un `.md` vacío. Y si el documento tiene texto pero
con **fojas escaneadas intercaladas** —lo normal en un expediente digitalizado
por partes— se procesa igual y se avisa **qué fojas salieron en blanco**, tanto
en pantalla como al pie del archivo.

**Unir, separar y rotar** PDF, con los errores dichos: qué archivo falló, si
estaba protegido con contraseña, y qué páginas del rango pedido no existían.

## Qué no hace

**OCR.** Traer un motor de OCR al navegador son varios megabytes de modelo para
resolver algo que Acrobat, el escáner de la oficina o cualquier herramienta de
escritorio ya resuelven mejor. Escribiente detecta que hace falta y lo dice.

**Garantizar la anonimización.** Es automática y la revisás vos. Un nombre
escrito de una forma que las reglas no contemplan puede quedar. Cada archivo
sale con una constancia al pie que dice qué se reemplazó, cuántas veces y qué
quedó sin ocultar. Antes de mandarlo a un tercero, leelo.

La constancia cuenta **por etiqueta y nunca por nombre**: dice
«nombre propio → `[TESTIGO]`: 4», no cuál era. Un archivo anonimizado que abajo
lista los nombres que sacó no está anonimizado.

---

## Cómo se sostiene esa promesa

Que el documento no salga de la máquina es lo que hace útil a esta herramienta,
y una promesa escrita en una pantalla no vale nada. Acá está apoyada en tres
cosas que se pueden verificar:

1. **Una `Content-Security-Policy` con `connect-src 'none'`**, declarada en el
   `<head>` de [`index.html`](index.html). El navegador le prohíbe a la página
   abrir cualquier conexión: `fetch`, `XMLHttpRequest`, WebSocket y
   `sendBeacon` quedan bloqueados y anotados en la consola. No es una intención
   del código: es el navegador impidiéndolo.

2. **pdf.js y pdf-lib están en [`vendor/`](vendor/)**, versionados dentro del
   repositorio. La versión anterior los pedía a `cdnjs.cloudflare.com` en cada
   uso, o sea que el código que abría el expediente lo servía un tercero, sin
   verificación de integridad. Ahora no hay JavaScript de terceros en la cadena.

3. **No se carga la tipografía del sitio.** El resto de las páginas piden
   Archivo a `fonts.googleapis.com`. Acá no: sería contarle a Google que alguien
   abrió el anonimizador, y obligaría a agujerear el punto 1. La fuente cae en
   la del sistema y la diferencia se nota poco.

## Cómo está hecho

Sin build, sin bundler y sin dependencias en tiempo de ejecución. Se abre, se
edita y se guarda, igual que las calculadoras del repositorio.

```
index.html          marcado y la CSP
css/escribiente.css layout propio; los colores y controles salen de
                      ../calculadoras/css/comun.css, el sistema visual del sitio
js/app.js           la pantalla: conecta controles con el motor, y nada mas
js/motor/           el motor, codigo puro y con pruebas
  extraer.js          lectura del PDF y diagnostico de OCR
  markdown.js         de los fragmentos de pdf.js al Markdown
  anonimizar.js       las reglas y los candidatos a nombre propio
  documento.js        armado del .md y su constancia
  pdf.js              unir, separar, rotar, y el analisis de rangos
vendor/             pdf.js 3.11.174 y pdf-lib 1.17.1
sw.js               funcionamiento sin conexion
icono-*.png         generados por codigo, no dibujados
```

El motor no toca el DOM, así que corre igual en Node. De ahí que se pueda
probar:

```bash
npm run verificar-escribiente
```

Son 214 comprobaciones sobre el motor, e incluyen como regresión los seis bugs
que tenía la versión anterior —o que aparecieron al probar esta contra PDF
reales—. Corre en CI antes de publicar.

Para levantarlo local alcanza cualquier servidor estático **desde la raíz del
repositorio**, porque la hoja de estilos compartida y el interruptor de tema
están en `../`:

```bash
python -m http.server 4180
```

Y después entrar a <http://localhost:4180/escribiente/>.

## De dónde salen las reglas de anonimización

De otra herramienta propia, anterior a esta y fuera de este repositorio, donde
llevan tiempo en uso. Los comentarios de cada regla vinieron con ellas y **no
son decoración**: cada uno anota una fuga o una corrupción de texto que
efectivamente pasó. Casi todos los patrones parecen mejorables hasta que se
entiende qué evitan.

Tres cosas se corrigieron al portarlas:

- el orden de las dos reglas de expediente estaba invertido, y dejaba
  `Expte. 56.[EXPTE]` con los primeros dígitos a la vista;
- el patrón de DNI solo se protegía del signo `$`, así que
  `la suma de 1.500.000` se convertía en `[DNI]`;
- el patrón de email se comía el punto final de la oración.

## Licencia

MIT, como todo lo demás del repositorio.
