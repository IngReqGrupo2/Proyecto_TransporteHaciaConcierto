# Design — HU-02 Registrar reserva y pasajero

## Context

La aplicación ya tiene la cartelera y el detalle de viajes (HU-01) y la creación de viajes con evento, vehículo y capacidad máxima de 17 (HU-03), sobre Express + EJS + SQLite. La fuente de este cambio es la ficha confirmada `.cin324/historias/HU-02.md`, el modelo de dominio (`08-modelo-dominio.md`), CU-02 (`09-casos-de-uso.md`), DSS-01 (`10-diagramas-secuencia.md`) y EST-01 (`11-diagramas-estado.md`); la motivación está en `proposal.md`.

El modelo confirma `Viaje *-- 1..* Asiento`, `Asiento 1–0..* Reserva` (histórico, una vigente) y `Reserva 1–1 Asiento`, con una reserva = un asiento = un pasajero. El TO-BE y el Gherkin no se modifican.

## Goals / Non-Goals

**Goals:**

- Registrar una reserva con un asiento disponible, un pasajero identificado por RUT y estado «Pendiente de pago», actualizando la disponibilidad del viaje.
- Impedir la reserva de un asiento ocupado o de un viaje sin cupos, sin dejar registros parciales.
- Consultar el estado de una reserva por su código.
- Generar los asientos de cada viaje y simular el Servicio de correo.

**Non-Goals:**

- Procesar el pago y confirmar la reserva como «Pagada».
- Liberar automáticamente la retención a los 8 minutos (HU-05).
- Lista de pasajeros y registro de asistencia (HU-04).
- Autenticación real, cancelación o modificación de reservas, envío real de correos.
- Requisitos no funcionales RP-09 y RP-10.

## Decisions

1. **Migración `004_crear_pasajero_asiento_reserva.sql`.** Crea `pasajero` (`id_pasajero`, `rut` único, `nombres`, `apellidos`, `telefono`, `correo_electronico`), `asiento` (`id_asiento`, `id_viaje` con `ON DELETE CASCADE`, `numero`, `UNIQUE(id_viaje, numero)`, `CHECK numero BETWEEN 1 AND 17`) y `reserva` (`id_reserva`, `codigo_reserva` único, `id_pasajero`, `id_viaje`, `id_asiento`, `fecha_registro`, `vencimiento_retencion`, `estado` restringido a «Pendiente de pago», «Pagada» y «Vencida»).

2. **Una sola reserva vigente por asiento con índice parcial.** `CREATE UNIQUE INDEX ux_reserva_asiento_activa ON reserva(id_asiento) WHERE estado IN ('Pendiente de pago', 'Pagada')` garantiza que un asiento no tenga dos reservas vigentes simultáneas, a la vez que conserva el histórico de reservas vencidas. Alternativa descartada: controlar la unicidad solo en la aplicación, que no protege ante dos solicitudes concurrentes.

3. **El asiento pertenece al mismo viaje de la reserva.** `reserva` guarda `id_viaje` e `id_asiento` con una clave foránea compuesta `(id_viaje, id_asiento)` hacia `asiento(id_viaje, id_asiento)` (con un índice único que la respalde). Así se respeta la asociación `Viaje 1–0..* Reserva` sin permitir que una reserva apunte a un asiento de otro viaje. Alternativa descartada: guardar solo `id_asiento` y derivar el viaje, que debilita la trazabilidad directa del modelo.

4. **Generación de asientos al crear el viaje.** Se extiende `ViajeRepositorio.crearViaje` para insertar los asientos `1..capacidad` dentro de la misma transacción del viaje. La migración `004` completa los viajes existentes con sus asientos y recalcula `cupos_disponibles = capacidad - reservas vigentes` (sin reservas, queda igual a la capacidad). El `seed` genera los asientos de sus viajes y deja `V-001` disponible con 17 cupos; `V-002` pasa a «Borrador» para conservar un solo viaje disponible de ejemplo y evitar cupos incoherentes con sus asientos libres.

5. **Repositorio `ReservaRepositorio.registrarReserva` transaccional.** Normaliza y valida los datos del pasajero (todos obligatorios), busca el viaje publicado con cupos, verifica que el asiento pertenezca al viaje y no tenga reserva vigente, reutiliza o crea el pasajero por RUT, genera `codigoReserva` con formato `R-00n`, fija `fechaRegistro` y `vencimientoRetencion = fechaRegistro + 8 minutos`, inserta la reserva en «Pendiente de pago» y descuenta un cupo con `UPDATE ... WHERE cupos_disponibles > 0`. Si algo falla, la transacción no deja reserva, asiento ni pasajero parcial. Alternativa descartada: descontar cupos en un paso separado, que puede dejar la disponibilidad inconsistente.

6. **Una sola transición de estado en esta historia.** Según EST-01, la reserva pasa de `Inicial` a «Pendiente de pago» con el evento `registrarReserva` cuando el asiento está disponible y los datos son válidos. Las transiciones a «Pagada» y «Vencida» se implementan en HU-05; aquí solo se guarda `vencimientoRetencion` (8 minutos) sin un proceso automático de liberación.

7. **Rutas derivadas de DSS-01 y del Gherkin:**
   - `GET /cartelera/:idViaje/reservar`: formulario con los asientos disponibles del viaje y los datos del pasajero.
   - `POST /cartelera/:idViaje/reservar`: registra la reserva; en éxito responde 201 con la confirmación; si el asiento o los cupos no están disponibles responde 400 con el formulario y el mensaje; si faltan datos, responde 400 con los campos inválidos.
   - `GET /reservas/:codigoReserva`: estado de la reserva registrada.
   El detalle del viaje (`detalle.ejs`) agrega el enlace «Reservar asiento» cuando `cuposDisponibles > 0`.

8. **Servicio de correo simulado.** Se define la interfaz `ServicioCorreo` con `solicitarNotificacionRegistroExitoso(destinatario, reserva)` y la implementación `ServicioCorreoSimulado`, que registra la llamada en la tabla `integraciones_log` (`sistema`, `mensaje`, `detalle`, `creada_en`) y devuelve éxito. La notificación se solicita después de confirmar la transacción y no revierte la reserva si falla; se informa en la interfaz que la integración está simulada. Alternativa descartada: llamar al correo dentro de la transacción, que acoplaría la reserva a un servicio externo.

9. **Rol de demostración.** No se agrega autenticación: el encabezado mantiene el rol «Pasajero» y las rutas de reserva no exigen credenciales. El administrador no participa en esta historia.

10. **Validaciones y mensajes.** Campos obligatorios del pasajero: «Completa los datos del pasajero: …». Asiento ya ocupado o sin cupos: «No hay cupos disponibles para el asiento seleccionado.». Viaje inexistente o no publicado: 404 «El viaje no existe o no está disponible.». RUT normalizado a mayúsculas y sin puntos ni guiones.

11. **Pruebas por escenario y de repositorio.** Una prueba de integración por cada escenario de la especificación, nombrada `HU-02 · <escenario>`, con base en memoria. Se agregan pruebas de repositorio y migración para la generación de asientos, la unicidad de la reserva vigente, la reutilización de pasajero por RUT y la generación de `R-00n`.

## Risks / Trade-offs

- **Retención sin expiración automática** → Hasta implementar HU-05, una reserva «Pendiente de pago» mantiene el asiento ocupado indefinidamente. Se documenta en la guía; para reiniciar la demo se puede borrar `data/app.db` y ejecutar `npm run seed`.
- **Recálculo de cupos en la migración** → Los viajes existentes quedan con `cupos_disponibles = capacidad` al no haber reservas. El `seed` ajusta `V-002` a «Borrador» para mantener un solo viaje disponible de ejemplo; se verifica con las pruebas.
- **Backfill de asientos** → Se generan `capacidad` asientos por viaje (máximo 17). Si un viaje tuviera una capacidad inconsistente, el `CHECK` de `asiento` la rechaza; los datos actuales están dentro del rango.
- **Sin autenticación** → Cualquier visitante puede reservar; es una decisión del taller y se mantiene el rol de demostración.
- **Concurrencia** → SQLite serializa las escrituras y el índice parcial más la transacción evitan la doble reserva; no se diseña para alta concurrencia.
- **Correo simulado** → No hay envío real ni reintentos; solo se registra la llamada en `integraciones_log`.

## Migration Plan

1. Aplicar `004_crear_pasajero_asiento_reserva.sql`: crear `pasajero`, `asiento`, `reserva` e `integraciones_log`, generar los asientos de los viajes existentes y recalcular `cupos_disponibles`.
2. Actualizar `src/dominio/viaje.ts` para generar asientos al crear un viaje.
3. Actualizar `src/db/seed.ts` para generar asientos y dejar datos coherentes (`V-001` con 17 cupos, `V-002` en «Borrador»).
4. Retroceso en desarrollo: borrar `data/app.db` y ejecutar `npm run db:seed`; no hay datos productivos.
5. Las historias siguientes agregan migraciones nuevas sin reescribir las anteriores.
