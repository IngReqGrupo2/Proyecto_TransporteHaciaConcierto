# Delta: creación de viajes

## MODIFIED Requirements

### Requirement: Registrar un viaje con sus datos obligatorios

El sistema DEBE (MUST) permitir al Administrador registrar un viaje ingresando el nombre y fecha del evento, fecha del viaje, horas de salida y regreso, lugar de encuentro, costo, conductor, asistente, modelo, patente y tipo de vehículo. El minibús DEBE quedar «Aprobado» y publicado al registrarse; el megabús DEBE quedar «Pendiente» y sin publicar.

#### Scenario: Creación exitosa de un viaje
- **GIVEN** que el Administrador completa los datos obligatorios y selecciona un tipo de vehículo válido
- **WHEN** confirma el registro
- **THEN** el sistema registra el evento, el vehículo y el viaje
- **AND** aplica la regla de publicación correspondiente al tipo de vehículo

#### Scenario: Creación exitosa de un viaje con minibús
- **GIVEN** que el Administrador completa los datos obligatorios válidos e indica minibús
- **WHEN** confirma el registro
- **THEN** el sistema registra el evento, vehículo y viaje con 17 asientos, lo deja «Aprobado» y lo publica

#### Scenario: Creación exitosa de un viaje con megabús
- **GIVEN** que el Administrador completa los datos obligatorios válidos e indica megabús
- **WHEN** confirma el registro
- **THEN** el sistema registra el evento, vehículo y viaje con 45 asientos, lo deja «Pendiente» y no lo publica

### Requirement: Asignar la capacidad y los cupos desde el vehículo

El sistema DEBE (MUST) asignar a los nuevos viajes 17 asientos para minibús y 45 para megabús, con igual número inicial de cupos disponibles. Los viajes existentes conservan sus asientos y sus cupos vigentes.

#### Scenario: Capacidad inicial según tipo de vehículo
- **GIVEN** que el Administrador indica un tipo de vehículo válido
- **WHEN** registra el viaje
- **THEN** el sistema asigna 17 asientos y cupos iniciales para minibús o 45 para megabús

#### Scenario: Viaje con la capacidad máxima permitida
- **GIVEN** que el Administrador selecciona megabús con los demás datos válidos
- **WHEN** registra el viaje
- **THEN** el sistema registra 45 asientos y 45 cupos iniciales, el máximo permitido para un viaje nuevo

#### Scenario: Vehículo de menor capacidad
- **GIVEN** que un viaje histórico tiene capacidad para 10 pasajeros y cupos disponibles ya registrados
- **WHEN** se habilita el registro por tipo de vehículo
- **THEN** el viaje histórico conserva su capacidad, sus asientos y sus cupos vigentes

#### Scenario: Vehículo que supera la capacidad máxima
- **GIVEN** que el Administrador registra un vehículo clasificado como minibús o megabús
- **WHEN** el registro recibe una capacidad superior a la permitida para su tipo
- **THEN** esa capacidad no se aplica: el sistema deriva 17 o 45 asientos del tipo, sin superar su límite

### Requirement: Reutilizar el vehículo cuando la patente ya existe

El sistema DEBE (MUST) reutilizar un vehículo registrado cuando coincida la patente normalizada y el tipo, sin duplicarlo ni modificarlo. Si la patente existe con otro tipo, DEBE impedir el registro e indicar la incompatibilidad.

#### Scenario: Vehículo reutilizado por patente
- **GIVEN** que existe un vehículo con la patente y el tipo indicados
- **WHEN** el Administrador registra un viaje con esos datos
- **THEN** el sistema reutiliza el vehículo existente sin duplicarlo

#### Scenario: Patente registrada con un tipo distinto
- **GIVEN** que la patente existe con otro tipo de vehículo
- **WHEN** el Administrador intenta registrar el viaje
- **THEN** el sistema informa que el tipo no coincide y no registra el viaje ni cambia el vehículo

### Requirement: Validar el orden entre la fecha del viaje y la del evento

El sistema DEBE (MUST) rechazar la creación de un viaje cuando la fecha del viaje sea posterior a la fecha del evento. La misma fecha para el evento y el viaje DEBE aceptarse.

#### Scenario: Fecha del viaje posterior a la fecha del evento
- **GIVEN** que el administrador ingresa una fecha del viaje posterior a la fecha del evento
- **WHEN** intenta registrar el viaje
- **THEN** el sistema impide la creación
- **AND** muestra `La fecha del viaje no puede ser posterior a la fecha del evento.` junto al campo de la fecha del viaje
- **AND** el viaje no se crea

#### Scenario: Fecha del viaje el mismo día del evento
- **GIVEN** que el administrador ingresa la misma fecha para el evento y para el viaje con los demás datos válidos
- **WHEN** confirma el registro
- **THEN** el sistema registra el viaje y aplica la regla de publicación según el tipo de vehículo

### Requirement: Registrar una descripción opcional del viaje

El sistema DEBE (MUST) permitir al administrador ingresar una descripción libre al crear un viaje y DEBE guardarla con el viaje. La descripción DEBE ser opcional: si no se ingresa, la creación DEBE completarse igualmente y el viaje DEBE quedar sin descripción.

#### Scenario: Descripción ingresada al crear el viaje
- **GIVEN** que el administrador ingresa una descripción junto con los demás datos válidos
- **WHEN** confirma la creación del viaje
- **THEN** el sistema registra el viaje con la descripción ingresada y aplica la regla de publicación según el tipo de vehículo

#### Scenario: Descripción vacía al crear el viaje
- **GIVEN** que el administrador no ingresa una descripción o ingresa solo espacios
- **WHEN** confirma la creación con los demás datos válidos
- **THEN** el sistema registra el viaje sin descripción y aplica la regla de publicación según el tipo de vehículo

## ADDED Requirements

### Requirement: Consultar el estado de aprobación de un viaje

El sistema DEBE (MUST) permitir al Administrador consultar el estado de aprobación de un viaje registrado, aunque todavía no esté publicado o haya sido rechazado.

#### Scenario: Consulta del estado de aprobación de un viaje con megabús
- **GIVEN** que existe un viaje registrado con megabús
- **WHEN** el Administrador lo consulta
- **THEN** el sistema muestra su estado actual: «Pendiente», «Aprobado» o «Rechazado»
