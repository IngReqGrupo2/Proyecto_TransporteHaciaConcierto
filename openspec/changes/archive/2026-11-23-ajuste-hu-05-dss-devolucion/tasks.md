# Tasks

## 1. Alineación documental

- [x] 1.1 Reemplazar en `07-criterios-aceptacion.md` los tres escenarios de HU-05 por los diez escenarios alineados de la ficha; verificar que la sección HU-05 contiene exactamente diez `Escenario:` y que los bloques ```gherkin``` quedan balanceados.
- [x] 1.2 Reescribir `diagramas/dss-02.mmd` con retenciones por asiento, cálculo del total, aprobación vigente, aprobación tardía con solicitud de devolución, confirmación de devolución (`Pago → Devuelto`), rechazo/cancelación, reintento e impedimento de pago vencido; verificar que los fragmentos `alt`/`opt`/`par` y sus `end` están balanceados.
- [x] 1.3 Actualizar la sección DSS-02 de `10-diagramas-secuencia.md` para que sus viñetas coincidan con las ramas del `.mmd`; verificar que menciona devolución, reintento y retenciones por asiento.
- [x] 1.4 Agregar `Devuelto`, `Aprobado → Devuelto` y la finalización normal de `Aprobado` en `11-diagramas-estado.md` y `diagramas/est-02.puml`; verificar que las salidas de `Aprobado` son mutuamente excluyentes por guarda y que la tabla de transiciones coincide con el `.puml`.
- [x] 1.5 Actualizar las observaciones de DSS-02 en `12-trazabilidad.md` para incluir aprobación tardía y devolución; verificar que la observación 8 nombra `solicitarDevolucion`, `confirmarDevolucion` y `Devuelto`.
- [x] 1.6 Registrar la decisión y el ajuste documental en `.cin324/proyecto.md`; verificar la nueva entrada del 2026-11-23 y la fila `ajuste-hu-05-dss-devolucion` en «Cambios posteriores».

## 2. Concordancia y verificación del sistema existente

- [x] 2.1 Regenerar `diagramas/est-02.png` desde `diagramas/est-02.puml` y comprobar visualmente que muestra `Devuelto`, `Aprobado → Devuelto` y la finalización de `Aprobado`; confirmar que `diagramas/dss-02.png` ya está regenerado.
- [x] 2.2 Contrastar la tabla de concordancia de `design.md` con los artefactos: cada uno de los diez escenarios debe tener su rama en DSS-02 y, cuando corresponda, su transición en EST-02/EST-01; verificar C7/C8, C9/C10 y C11 sin hallazgos pendientes.
- [x] 2.3 Ejecutar `npm.cmd test` y `npm.cmd run typecheck` para confirmar que la implementación existente sigue satisfaciendo la documentación alineada; registrar el resultado real en `.cin324/validaciones/`.
- [x] 2.4 Revisar el `README.md` y confirmar que sigue describiendo instalación, ejecución y pruebas, y que la guía de HU-05 cubre pago, rechazo, reintento, vencimiento y devolución; actualizarlo si algún texto contradice el Gherkin alineado.

## Workflow follow-up

- Revisar y confirmar las especificaciones (este cambio no incluye delta de specs: `skip_specs: true`).
- Archivar el cambio cuando la validación esté confirmada y actualizar `.cin324/proyecto.md`.
