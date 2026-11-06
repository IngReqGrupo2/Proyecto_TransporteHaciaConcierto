# Criterios de aceptación (Gherkin)
 
## HU-01 — Consultar la cartelera de viajes
Como pasajero, quiero explorar la cartelera y seleccionar un viaje disponible, para conocer las alternativas de traslado a conciertos sin tener que consultar por mensaje al administrador.

```gherkin
Característica: Consultar cartelera y disponibilidad de viajes

  Escenario: Existen Viajes disponibles
    Dado que haya viajes disponibles,
    Cuando el pasajero ingresa a la cartelera,
    Entonces el sistema muestra los viajes publicados que estén disponibles.
 
  Escenario: No hay viajes disponibles
    Dado que no existan viajes disponibles,
    Cuando el pasajero ingresa a la cartelera,
    Entonces el sistema no le mostrará ningún viaje
    Y en su lugar le mostrará un mensaje señalando que no hay viajes disponibles.

  Escenario: Verificar disponibilidad de un viaje
    Dado que el pasajero se encuentra explorando la cartelera,
    Cuando selecciona un viaje específico,
    Entonces el sistema muestra la información detallada del viaje
    Y muestra la cantidad de cupos disponibles.
```
 
 
## HU-02 — Registrar reserva y pasajero

Como pasajero, quiero ingresar mis datos para reservar un asiento en el viaje seleccionado, para retener mi cupo temporalmente

```gherkin
Característica: Registrar reserva y retener cupo

  Escenario: Selección de cupo disponible y confirmación de reserva
    Dado que el pasajero ha seleccionado un viaje con cupos disponibles, 
    Cuando ingresa sus datos y confirma su selección, 
    Entonces el sistema retiene dicho cupo temporalmente
    Y no puede ser seleccionado por otros pasajeros
    Y asocia al pasajero al viaje seleccionado
    Y envía automáticamente una notificación mediante un servicio de correos externo indicando que el registro fue exitoso.

  Escenario: Selección de cupo no disponible
    Dado que los cupos de un viaje se encuentran bloqueados temporalmente o agotados,
    Cuando un pasajero intente seleccionarlos,
    Entonces el sistema impedirá el proceso
    Y le mostrará un mensaje señalando que no hay cupos disponibles.
```
   
## HU-03 — Crear un viaje en el sistema

Como administrador, quiero crear un viaje en el sistema con sus datos correspondientes, para publicarlo en la cartelera.

```gherkin
Característica: Crear y publicar viajes

  Escenario: Creación exitosa de un viaje
    Dado que el administrador completa correctamente todos los campos requeridos en la creación de viajes,
    Cuando confirma su creación,
    Entonces el viaje se publica
    Y se visualizará en la cartelera.

  Escenario: Faltan campos para crear el viaje
    Dado que el administrador no ingresa alguno de los campos requeridos en la creación de viajes,
    Cuando intente publicarlo,
    Entonces el sistema lo impedirá 
    Y el viaje no se creará.

```
## HU-04 — Visualizar pasajeros

Como administrador, quiero visualizar una lista de pasajeros confirmados en un viaje, para saber qué pasajeros asistieron

```gherkin
Característica: Consultar nomina de pasajeros

  Escenario: Viaje con pasajeros confirmados
    Dado que un viaje tiene al menos una reserva confirmada,
    Cuando el administrador accede a la información del viaje 
    Y solicita una lista de pasajeros registrados en ese viaje,
    Entonces el sistema muestra los pasajeros con reservas pagadas asociados a ese viaje.
   
  Escenario: Viaje sin pasajeros confirmados
    Dado que un viaje no tiene reservas confirmadas,
    Cuando el administrador solicite una lista de pasajeros de ese viaje,
    Entonces no se mostrarán pasajeros que no hayan realizado el pago
    Y se le mostrará un mensaje señalando que no hay pasajeros confirmados en ese viaje.

  Escenario: Registrar la asistencia de un pasajero
    Dado que el administrador se encuentra visualizando la lista digital de pasajeros el día del viaje,
    Cuando marca a un pasajero como presente,
    Entonces el sistema guarda el registro de asistencia correspondiente a ese pasajero.
```
## HU-05 — Pagar reserva

Como pasajero, quiero pagar mi reserva de forma online utilizando distintos métodos de pago (tarjeta de crédito o débito), para confirmar mi asiento sin tener que coordinar transferencias manuales.


```gherkin
Característica: Procesar pagos y actualizar reservas

  Escenario: Redirección a pasarela
    Dado que el cliente ha completado sus datos de reserva,
    Cuando confirma el registro,
    Entonces el sistema lo redirige de forma segura a una pasarela de pago externa.
 
  Escenario: Pago exitoso
    Dado que el pasajero realiza la transacción en la pasarela, 
    Cuando el pago es aprobado,
    Entonces el sistema actualiza automáticamente el estado de la reserva a "Pagada"
    Y descuenta definitivamente el cupo del viaje.

  Escenario: Pago fallido
    Dado que el cliente se encuentre en la pasarela de pagos,
    Cuando la pasarela rechaza la transacción o el usuario cancela la operación,
    Entonces el sistema mantiene el cupo retenido solo por el tiempo límite restante
    Y se envía un mensaje al pasajero señalando que la reserva no se ha realizado.
```
