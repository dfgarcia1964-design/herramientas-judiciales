# Herramientas judiciales — Colombia

Calculadoras estáticas para consultar términos procesales, validar radicados y
trabajar con valores expresados en pesos colombianos. Todo se ejecuta en el
navegador; no hay backend para los datos que ingresa la persona.

## Herramientas

- [Tablero](calculadoras/tablero.html)
- [Acción de tutela](calculadoras/tutela.html): 10 días calendario para fallar
  y hasta 48 horas para cumplir la orden.
- [Procesos civiles](calculadoras/plazos-civiles.html): referencia de los
  términos documentados del Código General del Proceso.
- [Prescripciones](calculadoras/prescripciones-colombia.html): laboral y
  disciplinaria.
- [Radicado judicial](calculadoras/radicado.html): valida la estructura de
  23 dígitos.

## Fuentes y límites

La base normativa está en
[`docs/domain-colombia/00_NORMAS_BASE.md`](docs/domain-colombia/00_NORMAS_BASE.md).
Cada resultado debe verificarse contra la norma vigente y el expediente. La
validación de un radicado sólo comprueba su formato; no consulta la existencia
del proceso.

## Verificación

```bash
npm run verificar-colombia
```

El control cubre el calendario de festivos, tutela, términos hábiles,
prescripciones, radicados y formato COP. Las pruebas de navegador requieren
servir el repositorio desde su raíz.

## Licencia

Este repositorio se distribuye bajo [MIT](LICENSE).
