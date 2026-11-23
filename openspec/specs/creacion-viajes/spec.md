# creacion-viajes Specification

## Purpose
Permite al administrador registrar y publicar viajes a conciertos con sus datos de evento, traslado y vehículo, de modo que la oferta quede disponible en la cartelera sin afiches ni publicaciones manuales.

## Requirements

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
