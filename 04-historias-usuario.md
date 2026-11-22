# Historias de usuario
 
## HU-01 — Consultar la cartelera de viajes

Como **pasajero**, quiero **explorar la cartelera y seleccionar un viaje disponible**, para **conocer las alternativas de traslado a conciertos sin tener que consultar por mensaje al administrador**.

**Actividad TO-BE asociada:** Seleccionar viaje.

**Criterios de aceptación:**
- CA1: Dado que el administrador ha registrado viajes, cuando el cliente ingresa a la cartelera, entonces el sistema muestra los viajes publicados.
- CA2: Dado que el cliente está en la cartelera, cuando selecciona un viaje, entonces el sistema muestra la información correspondiente al viaje.
- CA3: Dado que el cliente consulta un viaje, cuando se muestra su información, entonces puede conocer su disponibilidad de cupos sin solicitar una respuesta manual al administrador.
 
## HU-02 — Registrar reserva y pasajero

Como pasajero, quiero seleccionar uno o varios asientos del mismo viaje e ingresar los datos de un pasajero por asiento, para registrar todos los cupos seleccionados en una única reserva.

**Actividad TO-BE asociada:** Seleccionar cupos e ingresar datos de pasajeros.

**Criterios de aceptación:**
- CA1: Dado que el cliente ha seleccionado un viaje con cupos disponibles, cuando inicia el proceso de reserva, entonces el sistema debe permitir seleccionar uno o varios asientos disponibles e ingresar los datos requeridos de un pasajero por cada asiento.
- CA2: Dado que un asiento está disponible, cuando el cliente lo selecciona, entonces el sistema debe retenerlo durante 8 minutos desde ese momento, registrar el vencimiento de la retención en el asiento e impedir que otro cliente lo seleccione durante ese plazo.
- CA3: Dado que todos los datos de los pasajeros son válidos y todas las retenciones siguen vigentes para el cliente que confirma, cuando este confirma la operación, entonces el sistema debe registrar una única reserva en estado pendiente de pago, generar un único código y asociar a ella el viaje y todos los asientos seleccionados, identificando al pasajero correspondiente a cada asiento y sin reiniciar sus plazos de retención.
- CA4: Dado que la reserva fue registrada correctamente, cuando el cliente la consulta mediante su código, entonces el sistema debe mostrar el viaje, todos los asientos incluidos, el pasajero correspondiente a cada asiento, el estado de la reserva y si esta incluye ida y vuelta; en ese último caso, también debe mostrar el lugar de regreso ingresado.
- CA5: Dado que se generó la reserva pendiente, cuando el sistema guarda el registro, entonces se conecta con un servicio de correos externo para enviar automáticamente a cada pasajero una notificación indicando que su cupo fue registrado exitosamente.
- CA6: Dado que alguno de los asientos seleccionados ya no está disponible para el cliente o su retención venció antes de confirmar, cuando el cliente intenta registrar la reserva, entonces el sistema no debe crear la reserva ni registrar parcialmente los asientos y debe informar que es necesario revisar la selección.
- CA7: Dado que existe una reserva pendiente de pago con varios asientos, cuando vence la retención de cualquiera de ellos sin que se haya aprobado el pago, entonces el sistema debe marcar la reserva completa como vencida y liberar todos sus asientos.
- CA8: Dado que el cliente está completando su reserva, cuando indica que esta incluye ida y vuelta, entonces el sistema debe solicitar que ingrese el lugar de regreso y guardarlo como parte de la reserva.
- CA9: Dado que la reserva es de ida y vuelta, cuando el cliente intenta confirmarla sin ingresar el lugar de regreso, entonces el sistema debe impedir el registro e indicar que ese campo es obligatorio.
- CA10: Dado que la reserva no incluye ida y vuelta, cuando el cliente confirma la operación con los demás datos válidos y las retenciones vigentes, entonces el sistema debe permitir registrar la reserva sin exigir un lugar de regreso.

## HU-03 — Crear un viaje en el sistema

Como **administrador**, quiero **crear y registrar un viaje en el sistema con sus datos correspondientes**, para **publicarlo en la cartelera y gestionar los viajes sin depender de afiches y registros manuales**.

**Actividad TO-BE asociada:** Publicar viaje con su costo, hora de salida y lugar de encuentro.

**Criterios de aceptación:**
- CA1: Dado que el administrador desea crear un viaje, cuando accede al registro de viajes, entonces el sistema permite ingresar el nombre del evento, fecha, hora de salida y regreso, conductor, asistente, modelo del vehículo y patente.
- CA2: Dado que el administrador completa los datos requeridos del viaje, cuando confirma su creación, entonces el sistema registra el viaje.
- CA3: Dado que el viaje fue registrado correctamente, cuando se publica, entonces el sistema lo incorpora a la cartelera para que pueda ser consultado por los clientes.
- CA4: Dado que el administrador ingresa la fecha del evento o del viaje, cuando confirma la creación, entonces el sistema rechaza la fecha si no existe en el calendario, si es anterior a la fecha actual o si es posterior al 31 de diciembre del año actual más 100 años.
- CA5: Dado que el administrador ingresa el nombre del conductor o del asistente, cuando confirma la creación, entonces el sistema rechaza el nombre si no contiene al menos una letra.
- CA6: Dado que el administrador ingresa la fecha del viaje, cuando confirma la creación, entonces el sistema rechaza la fecha si es posterior a la fecha del evento; se permite el mismo día.
- CA7: Dado que el sistema detecta datos inválidos, cuando muestra los errores de creación, entonces indica el mensaje junto al campo afectado y lo marca como inválido, además del mensaje general.

## HU-04 — Visualizar pasajeros

Como **administrador**, quiero **visualizar la lista de pasajeros confirmados de un viaje**, para **saber qué pasajeros asistieron y quiénes no**.

**Actividad TO-BE asociada:** Generar lista digital de pasajeros y pasar lista.

**Criterios de aceptación:**
- CA1: Dado que es el día del viaje, cuando el administrador accede al viaje y solicita la lista, entonces el sistema muestra los pasajeros con reserva pagada asociados a ese viaje.
- CA2: Dado que el administrador tiene la lista, cuando registra quiénes asistieron, entonces el sistema guarda la asistencia de cada pasajero y deja un registro de las ausencias.
- CA3: Dado que el viaje está en el trayecto de regreso desde el concierto, cuando el administrador accede a la lista, entonces puede confirmar en el sistema que todos los pasajeros están a bordo.

## HU-05 — Pagar reserva

Como **pasajero**, quiero **pagar mi reserva de forma online utilizando distintos métodos de pago (tarjeta de crédito o débito)**, para **confirmar los asientos incluidos en mi reserva sin tener que coordinar transferencias manuales**.

**Actividad TO-BE asociada:** Pagar viaje.

**Criterios de aceptación:**
- CA1: Dado que el cliente ha completado sus datos de reserva, cuando confirma el registro, entonces el sistema lo redirige de forma segura a una pasarela de pago externa.
- CA2: Dado que la reserva está pendiente de pago y todas sus retenciones siguen vigentes, cuando la pasarela aprueba el pago, entonces el sistema actualiza la reserva a "Pagada" y confirma todos sus asientos sin descontar cupos nuevamente.
- CA3: Dado que la reserva está pendiente de pago, cuando la pasarela rechaza la transacción o el usuario cancela la operación, entonces el sistema informa que el pago no fue completado y conserva los vencimientos originales de los asientos, sin reiniciar sus plazos.
- CA4: Dado que existe una reserva pendiente de pago, cuando vence la retención de cualquiera de sus asientos sin pago aprobado, entonces el sistema marca toda la reserva como "Vencida", libera todos sus asientos y restituye sus cupos.
- CA5: Dado que una reserva ha vencido, cuando el sistema recibe una aprobación de pago para ella, entonces registra el pago aprobado y solicita automáticamente a la pasarela la devolución del monto completo, manteniendo la reserva vencida y sin volver a ocupar sus asientos.
- CA6: Dado que se solicitó la devolución de un pago aprobado para una reserva vencida, cuando la pasarela confirma la devolución completa, entonces el sistema actualiza el pago a "Devuelto" e informa al pasajero que su reserva venció y el monto fue devuelto.
