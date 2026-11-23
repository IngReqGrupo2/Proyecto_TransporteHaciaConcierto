# Verificación técnica — HU-05: Pagar reserva

**Fecha:** 2026-11-22 · **Cambio:** `hu-05-pagar-reserva` · **Caso de uso:** CU-03.

| Comando | Resultado |
|---|---|
| `npm.cmd test` | 135 pruebas correctas en 17 archivos |
| `npm.cmd run typecheck` | Correcto |
| `openspec.cmd validate hu-05-pagar-reserva --strict` | Cambio válido |

- `tests/pagos.test.ts`: los diez escenarios de la ficha se ejercitan por HTTP con los datos de ejemplo y un reloj controlado en SQLite en memoria. Incluye redirección, monto, crédito/débito, reintento, vencimiento y devolución, además de errores de entrada y referencias inexistentes.
- `tests/pago-atomicidad.test.ts`: fallo inyectado antes del commit; otra conexión comprueba el rollback y el reintento deja un solo resultado.
- `tests/pago-concurrencia.test.ts`: dos conexiones independientes a una misma SQLite temporal en disco, contención comprobada en ambos órdenes de aprobación y vencimiento, aprobaciones y confirmaciones repetidas, y persistencia al cerrar y reabrir la base.
- `tests/pago-migracion.test.ts` y `tests/seed.test.ts`: migración aditiva y carga repetida de los datos de ejemplo sin perder reservas, retenciones ni historial de pagos. Se ajustó el fixture de la prueba de migración HU-02 para sembrar datos con el esquema 004 que pretende verificar.

La pasarela no realiza cobros ni devoluciones reales. Tras la verificación técnica, el estudiante confirmó la aceptación del sistema y solicitó archivar el cambio sin sincronizar la especificación principal.
