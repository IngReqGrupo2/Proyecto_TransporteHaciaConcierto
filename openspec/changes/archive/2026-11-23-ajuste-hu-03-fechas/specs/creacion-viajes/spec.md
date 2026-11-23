# Spec Delta — creacion-viajes (ajuste de fechas)

## Purpose

Permite al administrador registrar y publicar viajes a conciertos con sus datos de evento, traslado y vehículo, de modo que la oferta quede disponible en la cartelera sin afiches ni publicaciones manuales.

## ADDED Requirements

### Requirement: Validar las fechas del evento y del viaje

El sistema DEBE rechazar la creación de un viaje cuando la fecha del evento o la fecha del viaje no exista en el calendario, sea anterior a la fecha actual o sea posterior al 31 de diciembre del año actual más 100 años. En ese caso no DEBE registrar el evento, el vehículo ni el viaje.

#### Scenario: Fecha inexistente en el calendario

- **GIVEN** que el administrador ingresa el `29 de febrero de un año no bisiesto` como fecha del evento o del viaje
- **WHEN** intenta publicar el viaje
- **THEN** el sistema impide la creación
- **AND** muestra un mensaje indicando que la fecha no es válida
- **AND** el viaje no se crea

#### Scenario: Fecha anterior a hoy

- **GIVEN** que el administrador ingresa como fecha del evento o del viaje una fecha anterior a la fecha actual
- **WHEN** intenta publicar el viaje
- **THEN** el sistema impide la creación
- **AND** muestra un mensaje indicando que la fecha no puede ser anterior a hoy
- **AND** el viaje no se crea

#### Scenario: Fecha posterior al límite de 100 años

- **GIVEN** que el administrador ingresa el `1 de enero del año actual más 101 años` como fecha del evento o del viaje, superando en más de 100 años el año actual
- **WHEN** intenta publicar el viaje
- **THEN** el sistema impide la creación
- **AND** muestra un mensaje indicando que la fecha supera el límite permitido
- **AND** el viaje no se crea
