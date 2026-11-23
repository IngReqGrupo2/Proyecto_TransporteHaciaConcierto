# cartelera-viajes Specification

## Purpose
Permite al pasajero consultar por sí mismo la cartelera de viajes publicados a conciertos y conocer la disponibilidad de cupos de un viaje antes de reservar.

## Requirements

### Requirement: Mostrar los viajes publicados disponibles

El sistema DEBE listar en la cartelera únicamente los viajes en estado «Publicado» que tengan `cuposDisponibles` mayor que cero, mostrando nombre del evento, fecha, hora de salida, hora de regreso, lugar de encuentro, costo y cupos disponibles.

#### Scenario: Existen viajes disponibles

- **GIVEN** que existen viajes publicados con cupos disponibles
- **WHEN** el pasajero ingresa a la cartelera
- **THEN** el sistema muestra los viajes publicados que estén disponibles
- **AND** cada viaje muestra su evento, fecha, horas de salida y regreso, lugar de encuentro, costo y cupos disponibles

### Requirement: Excluir de la cartelera los viajes no disponibles

El sistema DEBE omitir de la cartelera los viajes publicados que no tengan cupos disponibles y los viajes que no estén en estado «Publicado».

#### Scenario: Viaje publicado sin cupos

- **GIVEN** que existe un viaje publicado con 0 cupos disponibles
- **WHEN** el pasajero ingresa a la cartelera
- **THEN** ese viaje no aparece en la lista de viajes

#### Scenario: Viaje no publicado

- **GIVEN** que existe un viaje que no está en estado «Publicado»
- **WHEN** el pasajero ingresa a la cartelera
- **THEN** ese viaje no aparece en la lista de viajes

### Requirement: Informar cuando no hay viajes disponibles

El sistema DEBE mostrar el mensaje «No hay viajes disponibles» y no listar ningún viaje cuando no existan viajes publicados con `cuposDisponibles` mayor que cero.

#### Scenario: No hay viajes disponibles

- **GIVEN** que no existen viajes publicados con cupos disponibles
- **WHEN** el pasajero ingresa a la cartelera
- **THEN** el sistema no le mostrará ningún viaje
- **AND** en su lugar le mostrará el mensaje «No hay viajes disponibles»

### Requirement: Mostrar el detalle y la disponibilidad de un viaje

El sistema DEBE mostrar la información detallada del viaje seleccionado y la cantidad de cupos disponibles vigente, aunque esta sea cero.

#### Scenario: Verificar disponibilidad de un viaje

- **GIVEN** que el pasajero se encuentra explorando la cartelera
- **WHEN** selecciona un viaje específico
- **THEN** el sistema muestra la información detallada del viaje
- **AND** muestra la cantidad de cupos disponibles

### Requirement: Rechazar el detalle de un viaje no disponible

El sistema DEBE responder con estado 404 y sin datos del viaje cuando se solicite el detalle de un viaje inexistente o que no esté en estado «Publicado».

#### Scenario: Detalle de un viaje inexistente

- **GIVEN** que no existe un viaje con el identificador solicitado
- **WHEN** se solicita el detalle de ese viaje
- **THEN** el sistema responde con estado 404 y no muestra datos de ningún viaje

#### Scenario: Detalle de un viaje no publicado

- **GIVEN** que existe un viaje que no está en estado «Publicado»
- **WHEN** se solicita el detalle de ese viaje
- **THEN** el sistema responde con estado 404 y no muestra datos del viaje

### Requirement: Mostrar la capacidad y los cupos disponibles en la cartelera

El sistema DEBE mostrar, para cada viaje listado en la cartelera, la capacidad total y los cupos disponibles vigentes, además del evento, la fecha, las horas de salida y regreso, el lugar de encuentro y el costo.

#### Scenario: Viajes disponibles con capacidad y cupos

- **GIVEN** que existen viajes publicados con cupos disponibles
- **WHEN** el pasajero ingresa a la cartelera
- **THEN** cada viaje muestra su capacidad total
- **AND** cada viaje muestra sus cupos disponibles

### Requirement: Mostrar la capacidad y los cupos disponibles en el detalle

El sistema DEBE mostrar en el detalle del viaje seleccionado la capacidad total y la cantidad de cupos disponibles vigente, aunque esta sea cero. Cuando el viaje no tenga cupos disponibles, DEBE mostrar además un mensaje indicando que no hay cupos disponibles.

#### Scenario: Detalle de un viaje con capacidad y cupos

- **GIVEN** que el pasajero se encuentra explorando la cartelera
- **WHEN** selecciona un viaje específico
- **THEN** el sistema muestra la capacidad total del viaje
- **AND** muestra la cantidad de cupos disponibles

#### Scenario: Detalle de un viaje publicado sin cupos

- **GIVEN** que existe un viaje publicado con 0 cupos disponibles
- **WHEN** el pasajero solicita el detalle de ese viaje
- **THEN** el sistema muestra su capacidad total
- **AND** muestra 0 cupos disponibles
- **AND** muestra un mensaje indicando que no hay cupos disponibles

### Requirement: Mostrar la descripción del viaje en la cartelera

El sistema DEBE mostrar la descripción de cada viaje listado en la cartelera cuando el viaje tenga una. Si el viaje no tiene descripción, DEBE listarlo sin mostrar texto de descripción.

#### Scenario: Existen viajes disponibles con descripción

- **GIVEN** que existen viajes publicados con cupos disponibles y con descripción
- **WHEN** el pasajero ingresa a la cartelera
- **THEN** el sistema muestra los viajes publicados que estén disponibles
- **AND** muestra la descripción de cada viaje que la tenga

### Requirement: Mostrar la descripción del viaje en el detalle

El sistema DEBE mostrar la descripción del viaje seleccionado cuando el viaje tenga una. Si el viaje no tiene descripción, DEBE mostrar el detalle sin texto de descripción.

#### Scenario: Verificar disponibilidad de un viaje

- **GIVEN** que el pasajero se encuentra explorando la cartelera
- **WHEN** selecciona un viaje específico
- **THEN** el sistema muestra la información detallada del viaje
- **AND** muestra la cantidad de cupos disponibles
- **AND** muestra la descripción del viaje cuando la tenga

### Requirement: Mostrar la descripción sin restricción de rol

El sistema DEBE mostrar la descripción del viaje en la cartelera y en el detalle sin restringir su visualización por rol.

#### Scenario: La descripción se muestra sin restricción de rol

- **GIVEN** que existe un viaje publicado con descripción
- **WHEN** se consulta la cartelera o el detalle del viaje
- **THEN** el sistema muestra la descripción del viaje
