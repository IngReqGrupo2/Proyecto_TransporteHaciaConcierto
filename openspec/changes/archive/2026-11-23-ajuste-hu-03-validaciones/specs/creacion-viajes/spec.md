# Spec Delta — creacion-viajes (ajuste de validaciones)

## Purpose

Permite al administrador registrar y publicar viajes a conciertos con sus datos de evento, traslado y vehículo, de modo que la oferta quede disponible en la cartelera sin afiches ni publicaciones manuales.

## ADDED Requirements

### Requirement: Validar los nombres del conductor y del asistente

El sistema DEBE rechazar la creación de un viaje cuando el nombre del conductor o el del asistente no contenga al menos una letra. En ese caso no DEBE registrar el evento, el vehículo ni el viaje, y DEBE indicar el mensaje correspondiente junto al campo del nombre inválido.

#### Scenario: Nombre del conductor solo con números

- **GIVEN** que el administrador ingresa `12345` como nombre del conductor
- **WHEN** intenta publicar el viaje
- **THEN** el sistema impide la creación
- **AND** muestra `El nombre del conductor debe contener al menos una letra.` junto al campo del conductor
- **AND** el viaje no se crea

#### Scenario: Nombre del asistente solo con números

- **GIVEN** que el administrador ingresa `98765` como nombre del asistente
- **WHEN** intenta publicar el viaje
- **THEN** el sistema impide la creación
- **AND** muestra `El nombre del asistente debe contener al menos una letra.` junto al campo del asistente
- **AND** el viaje no se crea

### Requirement: Validar el orden entre la fecha del viaje y la del evento

El sistema DEBE rechazar la creación de un viaje cuando la fecha del viaje sea posterior a la fecha del evento. La misma fecha para el evento y el viaje DEBE aceptarse.

#### Scenario: Fecha del viaje posterior a la fecha del evento

- **GIVEN** que el administrador ingresa una fecha del viaje posterior a la fecha del evento
- **WHEN** intenta publicar el viaje
- **THEN** el sistema impide la creación
- **AND** muestra `La fecha del viaje no puede ser posterior a la fecha del evento.` junto al campo de la fecha del viaje
- **AND** el viaje no se crea

#### Scenario: Fecha del viaje el mismo día del evento

- **GIVEN** que el administrador ingresa la misma fecha para el evento y para el viaje
- **WHEN** intenta publicar el viaje
- **THEN** el sistema crea el viaje y lo publica en la cartelera

### Requirement: Señalar los campos con error en el formulario

Cuando una validación impide crear el viaje, el sistema DEBE mostrar el mensaje de error junto al campo afectado y marcar ese campo como inválido, además del mensaje general del formulario. Si falta más de un campo obligatorio, DEBE marcar cada uno de los campos faltantes.

#### Scenario: Campo con formato inválido señalado en el formulario

- **GIVEN** que el administrador ingresa `AB1234` como patente y completa el resto de los campos requeridos
- **WHEN** intenta publicar el viaje
- **THEN** el sistema impide la creación
- **AND** muestra el mensaje de la patente junto al campo de la patente
- **AND** marca el campo de la patente como inválido
- **AND** mantiene el mensaje general del formulario

#### Scenario: Campos faltantes señalados en el formulario

- **GIVEN** que el administrador no ingresa alguno de los campos requeridos
- **WHEN** intenta publicar el viaje
- **THEN** el sistema impide la creación
- **AND** marca como inválido cada campo faltante
- **AND** el viaje no se crea
