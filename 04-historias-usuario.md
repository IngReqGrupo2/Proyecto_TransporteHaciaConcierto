# Historias de usuario
 
## HU-01 — Consultar la cartelera de viajes

Como **cliente/pasajero**, quiero **explorar la cartelera y seleccionar un viaje disponible**, para **conocer las alternativas de traslado a conciertos sin tener que consultar por mensaje al administrador**.

**Actividad TO-BE asociada:** Seleccionar viaje.

**Criterios de aceptación:**
- CA1: Dado que el administrador ha registrado viajes, cuando el cliente ingresa a la cartelera, entonces el sistema muestra los viajes publicados.
- CA2: Dado que el cliente está en la cartelera, cuando selecciona un viaje, entonces el sistema muestra la información correspondiente al viaje.
- CA3: Dado que el cliente consulta un viaje, cuando se muestra su información, entonces puede conocer su disponibilidad de cupos sin solicitar una respuesta manual al administrador.
 
## HU-02 — Registrar reserva y pasajero

Como **cliente/pasajero**, quiero **registrar mi reserva y mis datos en el viaje seleccionado**, para **asegurar mi cupo sin depender de que el administrador registre manualmente mi información**.

**Actividad TO-BE asociada:** Seleccionar cupos e ingresar datos de pasajeros.

**Criterios de aceptación:**
- CA1: Dado que el cliente ha seleccionado un viaje con cupos disponibles, cuando inicia el proceso de reserva, entonces el sistema debe permitir ingresar los datos requeridos del pasajero.
- CA2: Dado que el cliente ha ingresado correctamente sus datos, cuando confirma la reserva, entonces el sistema debe registrar al pasajero y asociarlo al viaje seleccionado.
- CA3: Dado que la reserva fue registrada correctamente, cuando el cliente consulta su reserva, entonces el sistema debe mostrar que se encuentra asociado al viaje seleccionado.

## HU-03 — Crear un viaje en el sistema

Como **administrador**, quiero **crear y registrar un viaje en el sistema con sus datos correspondientes**, para **publicarlo en la cartelera y gestionar los viajes sin depender de afiches y registros manuales**.

**Actividad TO-BE asociada:** Publicar viaje con su costo, hora de salida y lugar de encuentro.

**Criterios de aceptación:**
- CA1: Dado que el administrador desea crear un viaje, cuando accede al registro de viajes, entonces el sistema permite ingresar el nombre del evento, fecha, hora de salida y regreso, conductor, asistente, modelo del vehículo y patente.
- CA2: Dado que el administrador completa los datos requeridos del viaje, cuando confirma su creación, entonces el sistema registra el viaje.
- CA3: Dado que el viaje fue registrado correctamente, cuando se publica, entonces el sistema lo incorpora a la cartelera para que pueda ser consultado por los clientes.

## HU-04 — Visualizar pasajeros

Como **asistente de viaje**, quiero **tener disponible la lista de pasajeros confirmados**, para **poder saber qué pasajeros asistieron y quiénes no**.

**Actividad TO-BE asociada:** Recibir lista de pasajeros y pasar lista.

**Criterios de aceptación:**
- CA1: Dado que el asistente de viaje está en el día del viaje, cuando acceda a la página, el sistema deberá mostrar la lista de pasajeros registrados para el viaje.
- CA2: Dado que el asistente de viaje tiene la lista, cuando haya confirmado quiénes asistieron, entonces debe poder crearse un registro de las ausencias de la lista.
- CA3: Dado que el asistente de viaje tiene que volver desde el concierto, cuando acceda a la lista, entonces debe poder confirmar en el sistema que estén todos los pasajeros a bordo.
