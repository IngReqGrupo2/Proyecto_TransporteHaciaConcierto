# Criterios de aceptación (Gherkin)
 
## HU-01 — Consultar la cartelera de viajes
Como pasajero, quiero explorar la cartelera y seleccionar un viaje disponible, para conocer las alternativas de traslado a conciertos sin tener que consultar por mensaje al administrador.

```gherkin
Característica: Consultar cartelera y disponibilidad de viajes

  Escenario: Existen Viajes disponibles
    Dado que haya viajes disponibles,
    Cuando el pasajero ingresa a la cartelera,
    Entonces el sistema muestra los viajes publicados que estén disponibles
    Y muestra la descripción de cada viaje cuando la tenga.
 
  Escenario: No hay viajes disponibles
    Dado que no existan viajes disponibles,
    Cuando el pasajero ingresa a la cartelera,
    Entonces el sistema no le mostrará ningún viaje
    Y en su lugar le mostrará un mensaje señalando que no hay viajes disponibles.

  Escenario: Verificar disponibilidad de un viaje
    Dado que el pasajero se encuentra explorando la cartelera,
    Cuando selecciona un viaje específico,
    Entonces el sistema muestra la información detallada del viaje
    Y muestra la cantidad de cupos disponibles
    Y muestra la descripción del viaje cuando la tenga.

  Escenario: La descripción se muestra sin restricción de rol
    Dado que existe un viaje publicado con descripción,
    Cuando se consulta la cartelera o el detalle del viaje,
    Entonces el sistema muestra la descripción del viaje.
```
 
 
## HU-02 — Registrar reserva y pasajero

Como pasajero, quiero seleccionar uno o varios asientos del mismo viaje e ingresar los datos de un pasajero por asiento, para registrar todos los cupos seleccionados en una única reserva.

```gherkin
Característica: Registrar una reserva y retener sus asientos

  Escenario: Retención de un asiento al seleccionarlo
    Dado que un asiento del viaje está disponible,
    Cuando el cliente lo selecciona,
    Entonces el sistema lo retiene para ese cliente durante 8 minutos desde la selección y registra su vencimiento en el asiento
    Y bloquea su selección por otros clientes mientras la retención esté vigente.

  Escenario: Confirmación de una reserva con uno o varios asientos
    Dado que el cliente seleccionó uno o varios asientos del mismo viaje con retenciones vigentes y completó los datos obligatorios, incluyendo un pasajero por asiento,
    Cuando confirma la operación,
    Entonces el sistema crea una única reserva pendiente de pago con un solo código, asociada al viaje y a todos los asientos con sus respectivos pasajeros, sin reiniciar las retenciones
    Y solicita al servicio de correos externo una notificación de registro exitoso para cada pasajero.

  Escenario: Selección de cupo no disponible
    Dado que los cupos de un viaje se encuentran bloqueados temporalmente o agotados,
    Cuando un pasajero intente seleccionarlos,
    Entonces el sistema impedirá el proceso
    Y le mostrará un mensaje señalando que no hay cupos disponibles.

  Escenario: Consultar una reserva registrada
    Dado que existe una reserva pendiente de pago con uno o varios asientos,
    Cuando el cliente la consulta mediante su código,
    Entonces el sistema muestra el viaje, los asientos con sus respectivos pasajeros, el estado y si la reserva incluye ida y vuelta
    Y muestra el lugar de regreso ingresado cuando la reserva es de ida y vuelta.

  Escenario: Rechazo de la operación por pérdida de disponibilidad
    Dado que el cliente seleccionó varios asientos y alguno dejó de estar disponible para él o su retención venció,
    Cuando intenta confirmar la operación,
    Entonces el sistema impide crear la reserva completa, sin registrar parcialmente los asientos
    Y solicita al cliente revisar su selección.

  Escenario: Vencimiento de una reserva con varios asientos
    Dado que existe una reserva pendiente de pago con varios asientos,
    Cuando vence la retención de cualquiera de ellos sin haberse aprobado el pago,
    Entonces el sistema marca toda la reserva como vencida y libera todos sus asientos.

  Escenario: Registro del lugar de regreso
    Dado que el cliente indica que su reserva es de ida y vuelta,
    Cuando completa el lugar de regreso y confirma con los demás datos válidos y las retenciones vigentes,
    Entonces el sistema registra la reserva incluyendo el lugar de regreso ingresado.

  Escenario: Falta el lugar de regreso en una reserva de ida y vuelta
    Dado que el cliente indicó que su reserva es de ida y vuelta y completó los demás datos válidos con retenciones vigentes,
    Cuando intenta confirmarla sin ingresar el lugar de regreso,
    Entonces el sistema impide el registro e indica que el lugar de regreso es obligatorio.

  Escenario: Reserva sin ida y vuelta
    Dado que el cliente indica que su reserva no incluye ida y vuelta,
    Cuando confirma con los demás datos válidos y las retenciones vigentes,
    Entonces el sistema registra la reserva sin exigir un lugar de regreso.
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
    Y cada campo faltante se marcará como inválido
    Y el viaje no se creará.

  Esquema del escenario: Fechas inválidas en la creación del viaje
    Dado que el administrador ingresa como fecha del evento o del viaje <fecha>,
    Cuando intente publicar el viaje,
    Entonces el sistema lo impedirá
    Y mostrará "La fecha del evento debe ser una fecha real del calendario, no anterior a hoy y no posterior al 31 de diciembre del año actual más 100 años." o "La fecha del viaje debe ser una fecha real del calendario, no anterior a hoy y no posterior al 31 de diciembre del año actual más 100 años." junto al campo correspondiente
    Y el viaje no se creará.

    Ejemplos:
      | fecha                                  |
      | 29 de febrero de un año no bisiesto    |
      | una fecha anterior a hoy               |
      | 1 de enero del año actual más 101 años |

  Esquema del escenario: Nombre del conductor o del asistente inválido
    Dado que el administrador ingresa como nombre del <campo> el valor "<valor>",
    Cuando intente publicar el viaje,
    Entonces el sistema lo impedirá
    Y mostrará "<mensaje>" junto al campo <campo>
    Y el viaje no se creará.

    Ejemplos:
      | campo     | valor | mensaje                                                   |
      | conductor | 12345 | El nombre del conductor debe contener al menos una letra. |
      | asistente | 98765 | El nombre del asistente debe contener al menos una letra. |

  Escenario: Fecha del viaje posterior a la fecha del evento
    Dado que el administrador ingresa una fecha del viaje posterior a la fecha del evento,
    Cuando intente publicar el viaje,
    Entonces el sistema lo impedirá
    Y mostrará "La fecha del viaje no puede ser posterior a la fecha del evento." junto al campo de la fecha del viaje
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

  Escenario: Confirmar abordaje en el trayecto de regreso
    Dado que el viaje está en el trayecto de regreso desde el concierto,
    Cuando el administrador accede a la lista digital de pasajeros,
    Entonces puede confirmar en el sistema que todos los pasajeros están a bordo.
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
    Y confirma definitivamente el cupo retenido del viaje sin volver a descontarlo.

  Escenario: Pago fallido o cancelado
    Dado que el cliente se encuentre en la pasarela de pagos,
    Cuando la pasarela rechaza la transacción o el usuario cancela la operación,
    Entonces el sistema informa que el pago no fue completado
    Y mantiene el cupo retenido solo por el tiempo límite de 8 minutos antes de liberarlo.
```
