# Verificación — ajuste documental de HU-05 (DSS-02, Gherkin y EST-02)

**Fecha:** 2026-11-23
**Cambio OpenSpec:** `ajuste-hu-05-dss-devolucion`
**Tipo:** alineación documental; sin cambios de código (`skip_specs: true`).

## Alcance verificado

- `07-criterios-aceptacion.md`: HU-05 contiene los **10 escenarios** alineados con la ficha.
- `10-diagramas-secuencia.md` y `diagramas/dss-02.mmd`: DSS-02 incluye retenciones por asiento, cálculo del total, aprobación vigente, aprobación tardía con solicitud de devolución, confirmación de devolución (`Pago → Devuelto`), rechazo/cancelación, reintento e impedimento de pago vencido.
- `11-diagramas-estado.md` y `diagramas/est-02.puml`: estado `Devuelto`; `Aprobado → Devuelto` por devolución confirmada y finalización normal de `Aprobado` por reserva Pagada, con guardas mutuamente excluyentes.
- `12-trazabilidad.md`: observación de DSS-02 actualizada con `solicitarDevolucion`, `confirmarDevolucion` y `Devuelto`.
- Imágenes: `diagramas/dss-02.png` y `diagramas/est-02.png` regeneradas y concordantes con sus fuentes.

## Concordancia

| Chequeo | Resultado |
|---|---|
| C7/C8 (estados del Gherkin existen y sus transiciones coinciden) | Correcto |
| C9 (mensajes del DSS aparecen como acciones del Gherkin) | Correcto |
| C10 (cada `alt`/`opt` del DSS tiene escenario) | Correcto: 10 escenarios cubren las ramas |
| C11 (sistema externo del DSS es actor del caso de uso) | Correcto: Pasarela de pago en CU-03 |

## Comandos ejecutados

```
npm.cmd test
  Test Files  17 passed (17)
  Tests      140 passed (140)

npm.cmd run typecheck
  tsc --noEmit sin errores
```

## Observaciones

- La implementación de HU-05 ya existía y no se modificó; las pruebas confirman que sigue satisfaciendo la documentación alineada.
- Persiste la diferencia acordada con el BPMN TO-BE (C1/S8): no se modificó por decisión del estudiante.
- Este informe es verificación técnica; no reemplaza la aceptación del sistema por el estudiante.
