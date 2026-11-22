# Clasificación de requisitos

Los requisitos de producto se asocian explícitamente a actividades que cambian del proceso AS-IS al TO-BE, según la tabla definida en `02-rediseno-to-be.md`.

## Requisitos de producto

| ID | Requisito | Tipo (funcional/no funcional) | Actividad TO-BE asociada |
|----|-----------|--------------------------------|---------------------------|
| RP-01 | El sistema debe permitir al administrador crear y publicar un viaje registrando la información necesaria para ofrecerlo a los clientes. | Funcional | Publicar viaje con su costo, hora de salida y lugar de encuentro |
| RP-02 | El sistema debe permitir al cliente consultar la cartelera de viajes y seleccionar un viaje para revisar su información y disponibilidad. | Funcional | Seleccionar viaje |
| RP-03 | El sistema debe validar automáticamente la disponibilidad de cada asiento al seleccionarlo y la vigencia de sus retenciones al confirmar la reserva, evitando que se supere la capacidad máxima de 17 pasajeros. Cada asiento seleccionado debe quedar retenido para el cliente durante 8 minutos desde su selección, con el vencimiento registrado en el asiento, impidiendo su selección por otros clientes durante ese plazo. Confirmar la reserva no debe reiniciar las retenciones. | Funcional | Verificar cupo |
| RP-04 | El sistema debe informar automáticamente al cliente cuando un viaje no tenga cupos disponibles y bloquear nuevas reservas para ese viaje. | Funcional | Notificar que no hay cupos disponibles |
| RP-05 | El sistema debe permitir registrar una única reserva con un único código para uno o varios asientos del mismo viaje, identificando mediante cada detalle de reserva al pasajero correspondiente y almacenando los datos requeridos para la nómina. Debe registrar si la reserva incluye ida y vuelta y exigir, únicamente en ese caso, el lugar de regreso ingresado por el pasajero. Si alguno de los asientos pierde su disponibilidad para el cliente o su retención vence antes de confirmar, debe impedir el registro completo, sin crear una reserva parcial. Si vence la retención de cualquier asiento de una reserva pendiente de pago, debe marcar toda la reserva como vencida y liberar todos sus asientos. | Funcional | Reservar cupos seleccionados y actualizar cupos |
| RP-06 | El sistema debe permitir al pasajero realizar el pago en línea de su reserva mediante los medios de pago habilitados en la plataforma. | Funcional | Rellenar y enviar datos de pagos |
| RP-07 | El sistema debe generar automáticamente una lista digital de los pasajeros que poseen una reserva para cada viaje. | Funcional | Generar lista digital de pasajeros |
| RP-08 | El sistema debe permitir al administrador consultar la lista digital de pasajeros correspondiente al viaje para realizar el control de abordaje. | Funcional | Recibir lista de pasajeros y pasar lista |
| RP-09 | La interfaz destinada al cliente debe ser compatible con dispositivos móviles, permitiendo consultar la cartelera y seleccionar viajes desde un teléfono. | No funcional | Seleccionar viaje |
| RP-10 | La interfaz de reserva debe ser utilizable desde dispositivos móviles, permitiendo al pasajero completar el proceso sin depender de la atención manual del administrador. | No funcional | Seleccionar cupos e ingresar datos de pasajeros |
| RP-11 | La información de disponibilidad de cupos presentada al cliente debe mantenerse consistente con las reservas registradas, de manera que no se muestre como disponible un cupo que ya fue reservado. | No funcional | Verificar cupo |
| RP-12 | La información de reservas y pasajeros debe mantenerse íntegra y sin duplicidades durante el registro, evitando que la automatización introduzca inconsistencias en la nómina del viaje. | No funcional | Reservar cupos seleccionados y actualizar cupos |
| RP-13 | El procesamiento del pago en línea debe preservar la integridad del estado de la reserva, de modo que una reserva no sea identificada como pagada si el pago no ha sido confirmado. | No funcional | Verificar realización del pago |
| RP-14 | La lista digital consultada por el administrador debe reflejar la información vigente de las reservas registradas para el viaje. | No funcional | Recibir lista de pasajeros y pasar lista |

## Requisitos de proyecto

| ID | Requisito |
|----|-----------|
| RY-01 | El proyecto deberá considerar enero de 2027 como fecha objetivo para la implementación de la solución. |
| RY-02 | El alcance de la primera etapa del proyecto deberá contemplar la cartelera de viajes a conciertos, la reserva autónoma de cupos y el registro automatizado de pasajeros y asientos reservados. |

## Requisito derivado

**Requisito origen:** RP-03 — El sistema debe validar automáticamente la disponibilidad de cada asiento al seleccionarlo y la vigencia de sus retenciones al confirmar la reserva, evitando que se supere la capacidad máxima de 17 pasajeros. Cada asiento seleccionado debe quedar retenido para el cliente durante 8 minutos desde su selección, con el vencimiento registrado en el asiento, impidiendo su selección por otros clientes durante ese plazo. Confirmar la reserva no debe reiniciar las retenciones.

**Requisito derivado:** RP-D01 — El sistema debe actualizar automáticamente los cupos disponibles del viaje al retener o liberar asientos, antes de procesar una nueva solicitud. Cada asiento retenido debe consumir exactamente un cupo; registrar la reserva o aprobar su pago no debe descontarlo nuevamente. Al liberar un asiento, su cupo debe volver a estar disponible.

**Justificación:** RP-03 exige validar la disponibilidad desde la selección del asiento y respetar las retenciones vigentes sin superar la capacidad máxima. Para ello, los cupos deben actualizarse al retener o liberar asientos, evitando descuentos duplicados al registrar o pagar la reserva. Por lo tanto, RP-D01 se deriva de RP-03 y mantiene coherencia entre las retenciones, las reservas y la disponibilidad presentada.
