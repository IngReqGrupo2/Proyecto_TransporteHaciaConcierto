# Historias de usuario
 
## HU-01 — Consultar la cartelera de viajes

Como **cliente/pasajero**, quiero **explorar la cartelera y seleccionar un viaje disponible**, para **conocer las alternativas de traslado a conciertos sin tener que consultar por mensaje al administrador**.

**Actividad TO-BE asociada:** Seleccionar viaje.

**Criterios de aceptación:**
- CA1: Dado que el administrador ha registrado viajes, cuando el cliente ingresa a la cartelera, entonces el sistema muestra los viajes publicados.
- CA2: Dado que el cliente está en la cartelera, cuando selecciona un viaje, entonces el sistema muestra la información correspondiente al viaje.
- CA3: Dado que el cliente consulta un viaje, cuando se muestra su información, entonces puede conocer su disponibilidad de cupos sin solicitar una respuesta manual al administrador.
 
## HU-02 — Registrar reserva y pasajero

Como pasajero, quiero ingresar mis datos para reservar un asiento en el viaje seleccionado.

**Actividad TO-BE asociada:** Seleccionar cupos e ingresar datos de pasajeros.

**Criterios de aceptación:**
- CA1: Dado que el cliente ha seleccionado un viaje con cupos disponibles, cuando inicia el proceso de reserva, entonces el sistema debe permitir ingresar los datos requeridos del pasajero.
- CA2: Dado que el cliente ha ingresado correctamente sus datos, cuando confirma la reserva, entonces el sistema debe registrar al pasajero y asociarlo al viaje seleccionado.
- CA3: Dado que la reserva fue registrada correctamente, cuando el cliente consulta su reserva, entonces el sistema debe mostrar que se encuentra asociado al viaje seleccionado.
- CA4: Dado que se generó la reserva pendiente, cuando el sistema guarda el registro, entonces se conecta con un servicio de correos externo para enviar automáticamente una notificación al pasajero indicando que su cupo fue registrado exitosamente.

## HU-03 — Crear un viaje en el sistema

Como **administrador**, quiero **crear y registrar un viaje en el sistema con sus datos correspondientes**, para **publicarlo en la cartelera y gestionar los viajes sin depender de afiches y registros manuales**.

**Actividad TO-BE asociada:** Publicar viaje con su costo, hora de salida y lugar de encuentro.

**Criterios de aceptación:**
- CA1: Dado que el administrador desea crear un viaje, cuando accede al registro de viajes, entonces el sistema permite ingresar el nombre del evento, fecha, hora de salida y regreso, conductor, asistente, modelo del vehículo y patente.
- CA2: Dado que el administrador completa los datos requeridos del viaje, cuando confirma su creación, entonces el sistema registra el viaje.
- CA3: Dado que el viaje fue registrado correctamente, cuando se publica, entonces el sistema lo incorpora a la cartelera para que pueda ser consultado por los clientes.

## HU-04 — Visualizar pasajeros

Como **administrador**, quiero **visualizar la lista de pasajeros confirmados de un viaje**, para **saber qué pasajeros asistieron y quiénes no**.

**Actividad TO-BE asociada:** Generar lista digital de pasajeros y pasar lista.

**Criterios de aceptación:**
- CA1: Dado que es el día del viaje, cuando el administrador accede al viaje y solicita la lista, entonces el sistema muestra los pasajeros con reserva pagada asociados a ese viaje.
- CA2: Dado que el administrador tiene la lista, cuando registra quiénes asistieron, entonces el sistema guarda la asistencia de cada pasajero y deja un registro de las ausencias.
- CA3: Dado que el viaje está en el trayecto de regreso desde el concierto, cuando el administrador accede a la lista, entonces puede confirmar en el sistema que todos los pasajeros están a bordo.

## HU-05 — Pagar reserva

Como **pasajero**, quiero **pagar mi reserva de forma online utilizando distintos métodos de pago (tarjeta de crédito o débito)**, para **confirmar mi cupo y asegurar mi asiento sin tener que coordinar transferencias manuales**.

**Actividad TO-BE asociada:** Pagar viaje.

**Criterios de aceptación:**
- CA1: Dado que el cliente ha completado sus datos de reserva, cuando confirma el registro, entonces el sistema lo redirige de forma segura a una pasarela de pago externa.
- CA2: Dado que el cliente realiza la transacción en la pasarela, cuando el pago es aprobado, entonces el sistema actualiza automáticamente el estado de la reserva a "Pagada" y descuenta definitivamente el cupo del viaje.
- CA3: Dado que el cliente intenta pagar, cuando la pasarela de pago rechaza la transacción o el usuario cancela la operación, entonces el sistema muestra un mensaje de error y mantiene el cupo retenido solo por un tiempo límite de 8 minutos antes de liberarlo.
