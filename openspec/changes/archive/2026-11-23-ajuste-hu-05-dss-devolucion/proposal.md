# Propuesta — Ajuste HU-05: DSS-02, Gherkin y EST-02 (devolución)

## Why

Los artefactos publicados de **HU-05 — Pagar reserva** quedaron rezagados respecto de la ficha confirmada (`.cin324/historias/HU-05.md`) y del comportamiento ya implementado y verificado en el cambio archivado `hu-05-pagar-reserva`. El Gherkin de `07` conservaba tres escenarios, DSS-02 no representaba la devolución y EST-02 no tenía el estado Devuelto. Se alinean esos documentos para que la documentación del curso sea concordante con el sistema real, sin cambiar su comportamiento.

## What Changes

- `07-criterios-aceptacion.md`: se reemplazan los tres escenarios de HU-05 por los **diez escenarios alineados** de la ficha (redirección, monto total, pago exitoso, fallo/cancelación, reintento, vencimiento, impedir pago vencido, aprobación tardía, devolución solicitada y devolución confirmada).
- `10-diagramas-secuencia.md` y `diagramas/dss-02.mmd`: DSS-02 se completa con retenciones por asiento, verificación y cálculo del total, aprobación vigente, **aprobación tardía con solicitud de devolución**, **confirmación de devolución (`Pago → Devuelto`)**, rechazo/cancelación, reintento e impedimento de pago de una reserva vencida.
- `11-diagramas-estado.md` y `diagramas/est-02.puml`: se agrega el estado **Devuelto** y las transiciones `Aprobado → Devuelto` (devolución confirmada) y la finalización normal de `Aprobado` cuando la reserva quedó Pagada. Las salidas de `Aprobado` son mutuamente excluyentes por guarda.
- `12-trazabilidad.md`: se actualizan las observaciones de DSS-02 para incluir aprobación tardía y devolución.
- `.cin324/proyecto.md`: se registra la decisión y el ajuste documental.
- **Sin cambios de código:** la implementación de `hu-05-pagar-reserva` ya cubre pago total, reintentos, vencimiento completo, aprobación tardía, solicitud y confirmación de devolución, con atomicidad e idempotencia.

### Fuera de alcance

- **No se modifica el BPMN TO-BE** por decisión expresa del estudiante. La diferencia C1/S8 (el BPMN manda «pago no recibido» a «Cancelar reserva y notificar», mientras HU-05 y EST-01 conservan la reserva hasta su vencimiento) queda registrada como pendiente.
- Cambios en código, migraciones, rutas, vistas o pruebas de la aplicación.
- Modificar otras historias o el modelo de dominio.
- Devoluciones por motivos distintos de una aprobación tardía de una reserva vencida.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

Ninguna. El comportamiento ya está especificado en el delta archivado de `pagos-reservas` (`hu-05-pagar-reserva`) e implementado en el código. Este cambio solo corrige documentos del curso para que sean concordantes con ese comportamiento; no introduce ni modifica requisitos de comportamiento. Por eso el cambio declara `skip_specs: true`.

## Impact

- **Documentación del curso:** `07-criterios-aceptacion.md`, `10-diagramas-secuencia.md`, `diagramas/dss-02.mmd`, `11-diagramas-estado.md`, `diagramas/est-02.puml`, `12-trazabilidad.md`.
- **Estado del proyecto:** `.cin324/proyecto.md`.
- **Imágenes:** `diagramas/dss-02.png` (ya regenerado por el estudiante) y `diagramas/est-02.png` (pendiente de regenerar desde el `.puml`).
- **Código, base de datos y pruebas:** sin impacto; se verifica que la implementación existente siga pasando.
