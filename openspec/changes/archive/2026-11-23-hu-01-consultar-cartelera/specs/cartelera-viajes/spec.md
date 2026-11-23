# Spec Delta — cartelera-viajes

## Purpose

Permite al pasajero consultar por sí mismo la cartelera de viajes publicados a conciertos y conocer la disponibilidad de cupos de un viaje antes de reservar.

## ADDED Requirements

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
