# Normas base — Colombia

Referencia de las normas colombianas que gobiernan los procedimientos incluidos
en la aplicación. Cada regla calculable debe tener artículo, fuente oficial y
caso de prueba. Una norma derogada no se presenta como vigente.

## 1. Acción de tutela — Decreto Ley 2591 de 1991

La tutela protege derechos fundamentales y tiene trámite preferencial y sumario.

| Concepto | Plazo | Fuente |
|---|---|---|
| Fallo de primera instancia | 10 días calendario desde la presentación | Decreto 2591/91, art. 29; criterio confirmado para esta aplicación |
| Cumplimiento de la orden | El plazo que fije el fallo, hasta 48 horas | Decreto 2591/91, art. 29 |

Son dos plazos distintos y no se suman. La calculadora conserva el criterio
confirmado de contar el primer término en días calendario; para el cumplimiento
permite cargar el plazo concreto fijado por el juez entre 1 y 48 horas.

Fuentes: [Decreto 2591 de 1991](https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=5304) y [Decreto 306 de 1992](https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=6061).

## 2. Código General del Proceso — Ley 1564 de 2012

Regula los procesos civiles, comerciales, de familia y agrarios.

| Concepto | Regla | Fuente |
|---|---|---|
| Términos | Perentorios e improrrogables, salvo norma en contrario | Arts. 117 y 118 |
| Cómputo | Se cuentan desde el momento procesal que corresponda; se excluyen vacancia judicial y cierre del juzgado en los casos previstos | Art. 118 |
| Duración del proceso | Máximo un año en primera instancia y seis meses en segunda, con excepciones legales | Art. 121 |

Fuente: [Ley 1564 de 2012](https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=48425).

## 3. CPACA — Ley 1437 de 2011

Regula las actuaciones administrativas y el proceso contencioso administrativo.

| Concepto | Regla | Fuente |
|---|---|---|
| Petición general | 15 días | Art. 14 |
| Petición de documentos | 10 días | Art. 14 |
| Recursos | El término depende del trámite aplicable | Arts. 79 y 80 |
| Caducidad | Depende del medio de control | Art. 164 |

Fuente: [Ley 1437 de 2011](https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=41249).

## 4. Procedimiento penal — Ley 906 de 2004

Los términos penales sólo se calculan después de identificar el supuesto
procesal y sus excepciones.

| Concepto | Regla documentada | Fuente |
|---|---|---|
| Indagación | Términos del art. 175, con reglas especiales | Ley 906/04 |
| Delitos priorizados contra menores | 8 meses, prorrogables una vez hasta por 6 meses en los supuestos legales | Ley 2205/22 |
| Audiencia preparatoria e inicio del juicio | 45 días en los supuestos legales | Ley 906/04 |

La aplicación no calcula un plazo penal aislado si falta el supuesto que lo
activa. Fuente: [Ley 906 de 2004](https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=14787).

## 5. Procedimiento laboral

El régimen parte del Decreto 2158 de 1948 y sus reformas. La regla general de
prescripción de acciones laborales es de tres años desde que la obligación es
exigible, con las reglas de interrupción del artículo 151.

La Ley 2452 de 2025 expidió un nuevo Código Procesal del Trabajo y de la
Seguridad Social. Su vigencia y régimen transitorio deben comprobarse antes de
usarlo como fuente exclusiva.

Fuentes: [Decreto 2158 de 1948](https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=5259) y [Ley 2452 de 2025](https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=259639).

## 6. Régimen disciplinario

La Ley 1952 de 2019, modificada parcialmente por la Ley 2094 de 2021, sustituyó
el régimen anterior en lo pertinente.

| Concepto | Regla | Fuente |
|---|---|---|
| Acción disciplinaria | 5 años como regla general; 12 años para las faltas del art. 52 | Ley 1952/19, art. 33 |
| Sanción disciplinaria | 5 años desde la ejecutoria del fallo | Ley 1952/19, art. 36 |

Fuentes: [Ley 1952 de 2019](https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=90324) y [Ley 2094 de 2021](https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=165113).

## 7. Calendario y días festivos

La Ley 51 de 1983 enumera los días de descanso remunerado y traslada ciertas
festividades al lunes siguiente. El motor debe distinguir la fecha de la
festividad de la fecha trasladada.

No se presume una feria judicial nacional equivalente a la feria argentina. Un
cierre específico debe cargarse como dato con su acto fuente.

Fuente: [Concepto 131731 de 2023 — Función Pública](https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=212788), que transcribe el artículo 1 de la Ley 51 de 1983.

## 8. UVT y pesos colombianos

La UVT no reemplaza al peso colombiano. Para 2026, la Resolución DIAN 000238
de 2025 fijó la UVT en **$52.374 COP**.

Fuente: [Resolución DIAN 000238 de 2025](https://normograma.dian.gov.co/dian/compilacion/docs/resolucion_dian_0238_2025.htm).

## 9. Radicado judicial

El radicado tiene 23 dígitos con bloques `5 + 2 + 2 + 3 + 4 + 5 + 2`:

`código geográfico + corporación + especialidad + despacho + año + proceso + instancia/recurso`.

La validación de formato no prueba que el proceso exista. En tribunales y
consejos, las posiciones del despacho pueden requerir `000` según la regla
aplicable.

Fuente: [Manual de composición del número de radicación — Rama Judicial](https://consultaprocesos.ramajudicial.gov.co/manual/numRadicacion.html).
