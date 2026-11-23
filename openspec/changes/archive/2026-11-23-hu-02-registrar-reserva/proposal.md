# Propuesta — HU-02 Registrar reserva y pasajero

## Why

Hoy el pasajero debe escribir por mensaje al administrador para conseguir un cupo y la disponibilidad se anota en una libreta, lo que produce esperas, errores y riesgo de sobreventa. Esta historia permite que el pasajero seleccione un asiento disponible, registre sus datos y retenga el cupo de forma autónoma, manteniendo la disponibilidad del viaje actualizada (RP-03, RP-05, RP-11, RP-12 y RP-D01).

## What Changes

- Se agrega una pantalla, desde el detalle del viaje, para **seleccionar un asiento disponible** y registrar los datos del pasajero.
- Se crean las entidades `Pasajero`, `Asiento` y `Reserva` en la base de datos. Cada viaje genera sus asientos al ser creado, hasta un máximo de 17, y los viajes existentes se completan con sus asientos.
- Al confirmar, el sistema registra la reserva en estado **Pendiente de pago**, ocupa el asiento, asocia al pasajero y descuenta un cupo del viaje dentro de una misma transacción.
- Se impide reservar si el asiento ya está retenido/reservado o si el viaje no tiene cupos, mostrando el mensaje correspondiente.
- El pasajero se identifica por **RUT**: si ya existe se reutiliza; si no, se crea con sus datos obligatorios.
- Se genera un `codigoReserva` con formato `R-00n` y un `vencimientoRetencion` de **8 minutos** desde el registro.
- Se agrega una pantalla para **consultar el estado de una reserva** por su código.
- El **Servicio de correo** se implementa como adaptador simulado que registra el envío en `integraciones_log`.
- Se actualiza la creación de viajes (HU-03) para que genere los asientos del viaje, y los datos de ejemplo para que sean coherentes con la disponibilidad.
- No se modifica el TO-BE ni el Gherkin del curso.

**Fuera del alcance:** procesar el pago y confirmar la reserva como «Pagada» (HU-05), liberar automáticamente la retención a los 8 minutos (HU-05), la lista de pasajeros y el registro de asistencia (HU-04), crear viajes (HU-03) y consultar la cartelera (HU-01), cancelar o modificar reservas, autenticación real, envío real de correos y requisitos no funcionales (RP-09 y RP-10 solo se leen como contexto).

## Capabilities

### New Capabilities

- `registro-reservas`: selección de un asiento disponible, registro del pasajero y de la reserva, retención del cupo y consulta del estado de la reserva.

### Modified Capabilities

- Ninguna. La disponibilidad de la cartelera (HU-01) y la creación de viajes (HU-03) se mantienen; solo se agrega la generación de asientos como consecuencia del modelo de dominio confirmado.

## Impact

- **Trazabilidad:** HU-02; actividades TO-BE «Seleccionar cupos e ingresar datos de pasajeros» y «Reservar cupos seleccionados y actualizar cupos»; CU-02 «Reservar asiento»; RP-03, RP-05, RP-11, RP-12 y RP-D01; DSS-01; EST-01.
- **Código nuevo:** `src/dominio/reserva.ts` (pasajero, asiento y reserva), `src/rutas/reservas.ts` (reserva y consulta) y `src/integraciones/correo.ts` (interfaz y versión simulada).
- **Código modificado:** `src/dominio/viaje.ts` (generar asientos al crear un viaje), `src/app.ts` (registrar rutas y el servicio de correo), `src/vistas/detalle.ejs` (enlace de reserva) y nuevas vistas de reserva.
- **Base de datos:** migración `004_crear_pasajero_asiento_reserva.sql` con `pasajero`, `asiento`, `reserva`, `integraciones_log`, restricciones de unicidad y el backfill de asientos para los viajes existentes.
- **Datos de ejemplo:** se generan asientos para los viajes y se ajustan los cupos disponibles para que coincidan con los asientos libres.
- **Sistemas externos:** Servicio de correo simulado; no se agregan dependencias.
