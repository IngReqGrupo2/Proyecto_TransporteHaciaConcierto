# Criterios de aceptación (Gherkin)
 
## HU-01 — Consultar la cartelera de viajes
Como pasajero, quiero explorar la cartelera y seleccionar un viaje disponible, para conocer las alternativas de traslado a conciertos sin tener que consultar por mensaje al administrador.

```gherkin
Característica: [Mostrar viajes]

  Escenario: [Viajes disponibles]
    Dado que haya viajes disponibles,
    Cuando el pasajero ingresa a la cartelera,
    Entonces el sistema muestra los viajes publicados que estén disponibles.
 
  Escenario: [No hay viajes disponibles]
    Dado que no existan viajes disponibles,
    Cuando el pasajero ingresa a la cartelera,
    Entonces el sistema no le mostrará ningún viaje
    Y en su lugar le mostrará un mensaje señalando que no hay viajes disponibles.
```
 
 
## HU-02 — Registrar reserva y pasajero

Como pasajero, quiero ingresar mis datos para reservar un asiento en el viaje seleccionado, para retener mi cupo temporalmente

```gherkin
Característica: [Seleccionar asiento]

  Escenario: [Asiento disponible]
    Dado que el pasajero ha seleccionado un viaje con cupos disponibles, 
    Cuando selecciona un asiento disponible, 
    Entonces el sistema reserva dicho asiento 
    Y no podrá ser seleccionado por otros pasajeros temporalmente.

  Escenario: [Asiento no disponible]
    Dado que un asiento se encuentra bloqueado temporalmente o reservado,
    Cuando un pasajero intente seleccionarlo,
    Entonces el sistema no lo dejará 
    Y le mostrará un mensaje señalando que el asiento no se encuentra disponible.

Característica: [Realizar reserva]
  
  Escenario: [Confirmación de reserva]
    Dado que el pasajero ha ingresado sus datos,
    Cuando confirma la reserva, 
    Entonces el sistema debe asociarlo al viaje seleccionado
    Y enviarle automáticamente una notificación por un servicio de correos externo al pasajero indicando que el registro fue exitoso.
```
   
## HU-03 — Crear un viaje en el sistema

Como administrador, quiero crear un viaje en el sistema con sus datos correspondientes, para publicarlo en la cartelera.

```gherkin
    Característica: [Crear viajes]

  Escenario: [Creación exitosa]
    Dado que el administrador completa correctamente todos los campos requeridos en la creación de viajes,
    Cuando confirma su creación,
    Entonces el viaje se publica
    Y se visualizará en la cartelera.

  Escenario: [Faltan campos]
    Dado que el administrador no ingresa alguno de los campos requeridos en la creación de viajes,
    Cuando intente publicarlo,
    Entonces el sistema lo impedirá 
    Y el viaje no se creará.

```
## HU-04 — Visualizar pasajeros

Como adminsitrador, quiero visualizar una lista de pasajeros que tienen pasajero un viaje, para saber qué pasajeros asistieron

```gherkin
Característica: [Ver pasajeros de un viaje]

  Escenario: [Viaje con pasajeros confirmados]
    Dado que un viaje tiene al menos una reserva confirmada,
    Cuando el administrador accede a la información del viaje 
    Y solicita una lista de pasajeros registrados en ese viaje,
    Entonces el sistema muestra los pasajeros con reservas pagadas asociados a ese viaje.
   
  Escenario: [Viaje sin pasajeros confirmados]
    Dado que un viaje no tiene reservas confirmadas,
    Cuando el administrador solicite una lista de pasajeros de ese viaje,
    Entonces no se mostrarán pasajeros que no hayan realizado el pago
    Y se le mostrará un mensaje señalando que no hay pasajeros confirmados en ese viaje.
```
## HU-05 — Pagar reserva

Como pasajero, quiero pagar mi reserva de forma online utilizando distintos métodos de pago (tarjeta de crédito o débito), para confirmar mi asiento sin tener que coordinar transferencias manuales.


```gherkin
Característica: [Conexión con pasarela de pago]

  Escenario: [Redirección a pasarela]
    Dado que el cliente ha completado sus datos de reserva,
    Cuando confirma el registro,
    Entonces el sistema lo redirige de forma segura a una pasarela de pago externa.

Característica: [Realizar pago y actualizar estado de asiento]
 
  Escenario: [Pago exitoso]
    Dado que el pasajero realiza la transacción en la pasarela, 
    Cuando el pago es aprobado,
    Entonces el sistema actualiza automáticamente el estado de la reserva a "Pagada"
    Y descuenta definitivamente el cupo del viaje.

  Escenario: [Pago fallido]
    Dado que el cliente intenta pagar,
    Cuando la pasarela de pago rechaza la transacción o el usuario cancela la operación,
    Entonces el sistema mantiene el cupo retenido solo por un tiempo límite antes de liberarlo
    Y se envía un mensaje al pasajero señalando que la reserva no se ha realizado.
```
