# Spec Delta — creacion-viajes

## Purpose

Permite al administrador registrar y publicar viajes a conciertos con sus datos de evento, traslado y vehículo, de modo que la oferta quede disponible en la cartelera sin afiches ni publicaciones manuales.

## ADDED Requirements

### Requirement: Registrar un viaje con sus datos obligatorios

El sistema DEBE permitir al administrador registrar un viaje ingresando el nombre y la fecha del evento, la fecha del viaje, las horas de salida y regreso, el lugar de encuentro, el costo, el conductor, el asistente, el modelo del vehículo y la patente.

#### Scenario: Creación exitosa de un viaje

- **GIVEN** que el administrador completa correctamente todos los campos requeridos en la creación de viajes
- **WHEN** confirma su creación
- **THEN** el sistema registra el evento, el vehículo y el viaje
- **AND** el viaje queda en estado «Publicado»
- **AND** el viaje se visualiza en la cartelera

### Requirement: Validar el formato chileno actual de la patente

El sistema DEBE aceptar solo patentes con el formato chileno actual: cuatro letras y dos dígitos (`AABB11`). La patente DEBE normalizarse a mayúsculas y sin espacios ni guiones, y rechazarse si no cumple ese formato.

#### Scenario: Patente con formato válido

- **GIVEN** que el administrador ingresa la patente `LKPW42`
- **WHEN** confirma la creación del viaje
- **THEN** el sistema acepta la patente y registra el vehículo

#### Scenario: Patente con formato inválido

- **GIVEN** que el administrador ingresa una patente que no cumple el formato actual (por ejemplo, `AB1234` del formato antiguo)
- **WHEN** intenta publicar el viaje
- **THEN** el sistema impide la creación
- **AND** muestra un mensaje indicando que el formato esperado es cuatro letras y dos dígitos (`AABB11`)
- **AND** el viaje no se crea

### Requirement: Impedir la creación con campos obligatorios faltantes

El sistema DEBE rechazar la creación de un viaje cuando falte al menos uno de los campos obligatorios, sin registrar el evento, el vehículo ni el viaje, y mostrando un mensaje que indique los campos faltantes.

#### Scenario: Faltan campos para crear el viaje

- **GIVEN** que el administrador no ingresa alguno de los campos requeridos en la creación de viajes
- **WHEN** intenta publicarlo
- **THEN** el sistema impide la creación
- **AND** el viaje no se crea
- **AND** se muestra un mensaje con los campos faltantes

### Requirement: Validar el costo del viaje

El sistema DEBE rechazar la creación cuando el costo no sea un monto numérico mayor que cero, mostrando un mensaje de error y sin registrar el viaje.

#### Scenario: Costo inválido

- **GIVEN** que el administrador ingresa un costo vacío, no numérico o menor o igual a cero
- **WHEN** intenta publicar el viaje
- **THEN** el sistema impide la creación
- **AND** muestra un mensaje indicando que el costo no es válido
- **AND** el viaje no se crea

### Requirement: Asignar la capacidad y los cupos desde el vehículo

El sistema DEBE asignar al viaje la capacidad del vehículo y la misma cantidad de cupos disponibles, sin superar los 17 pasajeros. Si el vehículo supera esa capacidad, la creación DEBE rechazarse.

#### Scenario: Viaje con la capacidad máxima permitida

- **GIVEN** que el vehículo registrado tiene capacidad para 17 pasajeros
- **WHEN** el administrador crea el viaje
- **THEN** el viaje queda con capacidad 17
- **AND** queda con 17 cupos disponibles

#### Scenario: Vehículo de menor capacidad

- **GIVEN** que el vehículo registrado tiene capacidad para 10 pasajeros
- **WHEN** el administrador crea el viaje
- **THEN** el viaje queda con capacidad 10
- **AND** queda con 10 cupos disponibles

#### Scenario: Vehículo que supera la capacidad máxima

- **GIVEN** que se intenta registrar un vehículo con capacidad mayor que 17 pasajeros
- **WHEN** el administrador crea el viaje
- **THEN** el sistema rechaza la creación
- **AND** muestra un mensaje indicando que se supera la capacidad máxima de 17 pasajeros
- **AND** el viaje no se crea

### Requirement: Reutilizar el vehículo cuando la patente ya existe

El sistema DEBE reutilizar el vehículo registrado cuando la patente ingresada, ya normalizada, coincida con una existente, sin crear un vehículo duplicado ni modificar sus datos.

#### Scenario: Vehículo reutilizado por patente

- **GIVEN** que existe un vehículo registrado con la patente ingresada
- **WHEN** el administrador crea un nuevo viaje con esa patente
- **THEN** el sistema asocia el viaje al vehículo existente
- **AND** no crea un vehículo duplicado

### Requirement: Generar un identificador de viaje consecutivo

El sistema DEBE generar el identificador del viaje con el formato `V-00n`, continuando la numeración de los viajes existentes.

#### Scenario: Identificador consecutivo

- **GIVEN** que existen los viajes `V-001` y `V-002`
- **WHEN** el administrador crea un nuevo viaje
- **THEN** el sistema asigna el identificador `V-003`
