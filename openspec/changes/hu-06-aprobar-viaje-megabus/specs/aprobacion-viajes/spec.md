# Delta: aprobación de viajes

## Purpose

Permite al Gerente revisar viajes con megabús antes de su publicación y conservar el resultado de cada decisión.

## ADDED Requirements

### Requirement: Mostrar los viajes con megabús pendientes

El sistema DEBE (MUST) mostrar al Gerente los datos de los viajes con megabús en estado de aprobación «Pendiente» y excluir los minibuses y viajes ya resueltos.

#### Scenario: Solicitudes pendientes visibles para el gerente
- **GIVEN** que el Administrador registró un viaje con megabús pendiente
- **WHEN** el Gerente accede a las solicitudes pendientes
- **THEN** el sistema muestra el viaje, sus datos y el estado «Pendiente»

#### Scenario: Los minibuses no requieren aprobación
- **GIVEN** que existe un viaje con minibús y un viaje con megabús pendiente
- **WHEN** el Gerente accede a las solicitudes pendientes
- **THEN** el sistema muestra únicamente el megabús pendiente

### Requirement: Aprobar y publicar un viaje con megabús

El sistema DEBE (MUST) permitir al Gerente aprobar un viaje pendiente con megabús y publicarlo como resultado de esa decisión.

#### Scenario: Aprobación de un viaje con megabús
- **GIVEN** que el viaje con megabús está «Pendiente»
- **WHEN** el Gerente lo aprueba
- **THEN** su estado de aprobación cambia a «Aprobado» y el viaje se incorpora a la cartelera

### Requirement: Rechazar sin publicar un viaje con megabús

El sistema DEBE (MUST) permitir al Gerente rechazar un viaje pendiente con megabús, conservando su registro fuera de la cartelera.

#### Scenario: Rechazo de un viaje con megabús
- **GIVEN** que el viaje con megabús está «Pendiente»
- **WHEN** el Gerente lo rechaza
- **THEN** su estado de aprobación cambia a «Rechazado»
- **AND** el registro se conserva sin publicar

### Requirement: Impedir una nueva decisión sobre un viaje resuelto

El sistema DEBE (MUST) impedir que una segunda decisión cambie un viaje aprobado o rechazado e informar al Gerente que el viaje ya fue resuelto.

#### Scenario: Nueva decisión sobre un viaje ya resuelto
- **GIVEN** que un viaje con megabús ya está «Aprobado» o «Rechazado»
- **WHEN** el Gerente intenta aprobarlo o rechazarlo nuevamente
- **THEN** el sistema informa que el viaje ya fue resuelto y conserva su estado de aprobación y publicación
