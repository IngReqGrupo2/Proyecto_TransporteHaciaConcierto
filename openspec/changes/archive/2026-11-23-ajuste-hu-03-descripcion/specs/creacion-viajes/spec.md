# Spec Delta — creacion-viajes (ajuste de descripción)

## ADDED Requirements

### Requirement: Registrar una descripción opcional del viaje

El sistema DEBE permitir al administrador ingresar una descripción libre al crear un viaje y DEBE guardarla con el viaje. La descripción DEBE ser opcional: si no se ingresa, la creación DEBE completarse igualmente y el viaje DEBE quedar sin descripción.

#### Scenario: Descripción ingresada al crear el viaje

- **GIVEN** que el administrador ingresa una descripción junto con los demás datos válidos
- **WHEN** confirma la creación del viaje
- **THEN** el sistema registra el viaje con la descripción ingresada
- **AND** el viaje queda publicado en la cartelera

#### Scenario: Descripción vacía al crear el viaje

- **GIVEN** que el administrador no ingresa una descripción o ingresa solo espacios
- **WHEN** confirma la creación con los demás datos válidos
- **THEN** el sistema registra el viaje sin descripción
- **AND** el viaje queda publicado en la cartelera
