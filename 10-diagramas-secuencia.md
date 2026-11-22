# Diagramas de secuencia de sistema

## DSS-01 — Reservar asiento y registrar pasajero

- Caso de uso: [CU-02](./09-casos-de-uso.md#cu-02)
- Historia: [HU-02](./04-historias-usuario.md#hu-02-registrar-reserva-y-pasajero)
- Sistemas externos que participan: Servicio de correo (caja negra)

![DSS-01](./diagramas/dss-01.png)

Archivo fuente: [`./diagramas/dss-01.mmd`](./diagramas/dss-01.mmd)

Flujo y variantes representadas:

- `loop` Selección de asientos: el cliente puede seleccionar uno o varios asientos del mismo viaje.
- `alt` Asiento disponible: el sistema retiene el asiento durante 8 minutos desde su selección, guarda el vencimiento en `Asiento`, descuenta un cupo y confirma la retención.
- `alt` Asiento retenido por otro cliente o reservado: el sistema impide la selección e informa que el asiento no está disponible.
- Registro de datos: el cliente ingresa los datos de un pasajero por asiento e indica si la reserva incluye ida y vuelta.
- `opt` Reserva de ida y vuelta: el sistema solicita el lugar de regreso obligatorio y el cliente lo ingresa.
- `alt` Datos válidos y retenciones vigentes para el cliente: el sistema registra una única reserva pendiente de pago con un único código y un `DetalleReserva` por asiento con su pasajero. Conserva los vencimientos originales y no vuelve a descontar cupos.
- `alt` Pérdida de disponibilidad o retención vencida: el sistema impide el registro completo, sin crear una reserva parcial, y solicita revisar la selección.
- `alt` Datos obligatorios incompletos o inválidos: el sistema impide el registro e indica los campos que deben completarse o corregirse.
- `loop` Notificación por pasajero: el sistema solicita al Servicio de correo externo una notificación de registro exitoso para cada pasajero.
- `opt` Consulta de la reserva: mediante su código, el cliente consulta el viaje, los asientos, sus pasajeros, el estado y la modalidad; si incluye ida y vuelta, también se muestra el lugar de regreso.

## DSS-02 — Pagar reserva

- Caso de uso: [CU-03](./09-casos-de-uso.md#cu-03)
- Historia: [HU-05](./04-historias-usuario.md#hu-05-pagar-reserva)
- Sistemas externos que participan: Pasarela de pago (caja negra)

![DSS-02](./diagramas/dss-02.png)

Archivo fuente: [`./diagramas/dss-02.mmd`](./diagramas/dss-02.mmd)

Variantes representadas:

- `alt` Pago aprobado: la pasarela notifica la aprobación, el sistema cambia la reserva a Pagada, confirma definitivamente el cupo retenido e informa al pasajero.
- `alt` Pago rechazado o cancelado: la pasarela notifica el rechazo o la cancelación, el sistema mantiene el cupo retenido por un tiempo límite (8 minutos), informa que el pago no fue completado y libera el cupo al vencer ese plazo.
