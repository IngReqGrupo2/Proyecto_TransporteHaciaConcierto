# Spec Delta — cartelera-viajes (ajuste: mostrar capacidad)

## ADDED Requirements

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
