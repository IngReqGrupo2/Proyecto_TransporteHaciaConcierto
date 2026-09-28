# Clasificación de requisitos

Los requisitos de producto se asocian explícitamente a actividades que cambian del proceso AS-IS al TO-BE, según la tabla definida en `02-rediseno-to-be.md`.

## Requisitos de producto

| ID | Requisito | Tipo (funcional/no funcional) | Actividad TO-BE asociada |
|----|-----------|--------------------------------|---------------------------|
| RP-01 | El sistema debe permitir al administrador crear y publicar un viaje registrando la información necesaria para ofrecerlo a los clientes. | Funcional | Publicar viaje con su costo, hora de salida y lugar de encuentro |
| RP-02 | El sistema debe permitir al cliente consultar la cartelera de viajes y seleccionar un viaje para revisar su información y disponibilidad. | Funcional | Seleccionar viaje |
| RP-03 | El sistema debe validar automáticamente la disponibilidad de cupos antes de permitir una reserva y evitar que se supere la capacidad máxima de 17 pasajeros. | Funcional | Verificar cupo |
| RP-04 | El sistema debe informar automáticamente al cliente cuando un viaje no tenga cupos disponibles y bloquear nuevas reservas para ese viaje. | Funcional | Notificar que no hay cupos disponibles |
| RP-05 | El sistema debe permitir registrar una reserva asociando al pasajero con el viaje seleccionado y almacenando los datos requeridos para la nómina. | Funcional | Reservar cupos seleccionados y actualizar cupos |
| RP-06 | El sistema debe permitir al pasajero realizar el pago en línea de su reserva mediante los medios de pago habilitados en la plataforma. | Funcional | Rellenar y enviar datos de pagos |
| RP-07 | El sistema debe generar automáticamente una lista digital de los pasajeros que poseen una reserva para cada viaje. | Funcional | Generar lista digital de pasajeros |
| RP-08 | El sistema debe permitir al asistente de viaje consultar la lista digital de pasajeros correspondiente al viaje para realizar el control de abordaje. | Funcional | Recibir lista de pasajeros y pasar lista |
| RP-09 | La interfaz destinada al cliente debe ser compatible con dispositivos móviles, permitiendo consultar la cartelera y seleccionar viajes desde un teléfono. | No funcional | Seleccionar viaje |
| RP-10 | La interfaz de reserva debe ser utilizable desde dispositivos móviles, permitiendo al pasajero completar el proceso sin depender de la atención manual del administrador. | No funcional | Seleccionar cupos e ingresar datos de pasajeros |
| RP-11 | La información de disponibilidad de cupos presentada al cliente debe mantenerse consistente con las reservas registradas, de manera que no se muestre como disponible un cupo que ya fue reservado. | No funcional | Verificar cupo |
| RP-12 | La información de reservas y pasajeros debe mantenerse íntegra y sin duplicidades durante el registro, evitando que la automatización introduzca inconsistencias en la nómina del viaje. | No funcional | Reservar cupos seleccionados y actualizar cupos |
| RP-13 | El procesamiento del pago en línea debe preservar la integridad del estado de la reserva, de modo que una reserva no sea identificada como pagada si el pago no ha sido confirmado. | No funcional | Verificar realización del pago |
| RP-14 | La lista digital consultada por el asistente de viaje debe reflejar la información vigente de las reservas registradas para el viaje. | No funcional | Recibir lista de pasajeros y pasar lista |

## Requisitos de proyecto

| ID | Requisito |
|----|-----------|
| RY-01 | El proyecto deberá considerar enero de 2027 como fecha objetivo para la implementación de la solución. |
| RY-02 | El alcance de la primera etapa del proyecto deberá contemplar la cartelera de viajes a conciertos, la reserva autónoma de cupos y el registro automatizado de pasajeros y asientos reservados. |

## Requisito derivado

**Requisito origen:** RP-03 — El sistema debe validar automáticamente la disponibilidad de cupos antes de permitir una reserva y evitar que se supere la capacidad máxima de 17 pasajeros.

**Requisito derivado:** RP-D01 — Cada vez que una reserva sea registrada correctamente, el sistema debe actualizar automáticamente la cantidad de cupos disponibles del viaje antes de procesar una nueva solicitud de reserva.

**Justificación:** RP-03 exige que la disponibilidad se valide automáticamente y que nunca se supere la capacidad máxima de 17 pasajeros. Para que esa validación utilice información vigente, la disponibilidad debe actualizarse después de cada reserva confirmada. Por lo tanto, RP-D01 se deriva directamente de RP-03 y permite mantener coherencia entre las reservas registradas y los cupos que el sistema presenta como disponibles.
