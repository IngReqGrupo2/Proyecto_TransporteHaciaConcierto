# Proposal

## Why

HU-02 — Registrar reserva y pasajero cambió en los artefactos del commit `8bb3d96`: ahora una reserva agrupa varios asientos y pasajeros, y la retención comienza en cada selección. El código todavía registra un asiento por reserva y calcula su vencimiento al confirmar; este ajuste implementa la ficha confirmada `.cin324/historias/HU-02.md` y sus nueve escenarios Gherkin.

La trazabilidad corresponde a CU-02 — Reservar asiento y a las actividades TO-BE «Seleccionar cupos e ingresar datos de pasajeros», «Verificar cupo» y «Reservar cupos seleccionados y actualizar cupos»; intervienen RP-03, RP-04, RP-05, RP-D01, DSS-01 y EST-01.

## What Changes

- Retener cada asiento durante 8 minutos desde su selección para el cliente que lo selecciona, guardar el vencimiento en Asiento y descontar exactamente un cupo.
- Registrar una única reserva con un código y uno o varios DetalleReserva, cada uno con su asiento y pasajero del mismo viaje; conservar los plazos y no volver a descontar cupos.
- Validar la operación completa sin guardar pasajeros, reservas o detalles parciales si falla la confirmación.
- Liberar retenciones vencidas sin reserva; si vence cualquier asiento de una reserva pendiente, vencer toda la reserva y restituir todos sus cupos una sola vez.
- Registrar la modalidad `idaYVuelta` y exigir `lugarRegreso` únicamente cuando corresponda.
- Mostrar todos los pasajeros y asientos en confirmación y consulta por código; solicitar una notificación simulada por pasajero.
- Migrar las reservas existentes conservando sus códigos, estados, identificadores, pasajeros y asientos como reservas de un detalle.
- **BREAKING**: sustituir el contrato interno y del formulario que recibe un único `idAsiento` y pasajero por una selección retenida y datos de pasajero por asiento. `Reserva` deja de tener `idPasajero`, `idAsiento` y `vencimientoRetencion` directos. Se conservan las URLs de reserva y consulta existentes.

## Capabilities

### New Capabilities

- `registro-reservas`: especificación vigente completa de retención, registro múltiple, consulta, modalidad y vencimiento de HU-02. Se reutiliza el nombre de capacidad del cambio anterior. El inventario `openspec list --specs` está vacío: no existe una especificación principal que permita declarar un delta MODIFIED.

### Modified Capabilities

Ninguna capacidad publicada en `openspec/specs/`. Este cambio reemplaza el comportamiento anterior del cambio aún sin archivar `hu-02-registrar-reserva`; no se editarán sus artefactos históricos. Al cerrar el ciclo deberá reconciliarse el orden de sincronización para no publicar después reglas antiguas incompatibles.

## Impact

- Datos: nueva migración `005_reserva_multiple.sql`; reconstrucción de Reserva, creación de DetalleReserva y campos de retención/asignación vigente en Asiento. No se reescriben migraciones aplicadas ni se reinicia `data/app.db`.
- Dominio: `src/dominio/reserva.ts`, función central de transición de Reserva y actualización transaccional de cupos; integración con creación/lectura de viajes y seed según necesidad.
- HTTP y pantallas: `src/app.ts`, `src/server.ts`, `src/rutas/reservas.ts`, vistas de reserva y estilos existentes; formularios EJS con identidad de cliente de demostración en cookie, sin autenticación real ni nuevas dependencias previstas.
- Integración externa: `src/integraciones/correo.ts`, conservando la interfaz y el adaptador simulado que registra llamadas en `integraciones_log`.
- Verificación: pruebas de los nueve escenarios, migración desde versión 004, aislamiento entre clientes, atomicidad, idempotencia del vencimiento y regresiones de HU-01/HU-03.
- Fuera de alcance: pagos y devoluciones de HU-05, nómina/asistencia de HU-04, cambios funcionales de HU-01/HU-03, autenticación real y requisitos no funcionales. Las lecturas de cartelera sí deben reflejar los cupos liberados por HU-02.
