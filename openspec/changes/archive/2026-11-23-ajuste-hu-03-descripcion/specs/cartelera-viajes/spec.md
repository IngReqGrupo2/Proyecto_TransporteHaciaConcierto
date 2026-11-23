# Spec Delta — cartelera-viajes (ajuste: mostrar la descripción)

## ADDED Requirements

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
