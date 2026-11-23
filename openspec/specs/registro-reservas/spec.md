# registro-reservas Specification

## Purpose
Permite al pasajero reservar un asiento de un viaje, registrar sus datos, retener el cupo y consultar el estado de su reserva sin depender de la atención manual del administrador.

## Requirements

### Requirement: Registrar una reserva sobre un asiento disponible

El sistema DEBE permitir al pasajero seleccionar un asiento disponible de un viaje publicado, ingresar sus datos y registrar una reserva en estado «Pendiente de pago», asociando un pasajero y un asiento, descontando un cupo del viaje y solicitando la notificación al Servicio de correo. La reserva DEBE ocupar exactamente un asiento y consumir un cupo.

#### Scenario: Selección de cupo disponible y confirmación de reserva

- **GIVEN** que el pasajero ha seleccionado un viaje con cupos disponibles
- **WHEN** ingresa sus datos y confirma su selección
- **THEN** el sistema retiene dicho cupo temporalmente
- **AND** el asiento no puede ser seleccionado por otros pasajeros
- **AND** asocia al pasajero al viaje seleccionado
- **AND** registra la reserva en estado «Pendiente de pago»
- **AND** solicita al Servicio de correo el envío de la notificación de registro exitoso

### Requirement: Impedir la reserva cuando el asiento no está disponible

El sistema DEBE impedir la reserva cuando el asiento esté retenido o reservado por otro pasajero o cuando el viaje no tenga cupos, sin crear una reserva y mostrando un mensaje que indique que no hay cupos disponibles. Un asiento DEBE tener como máximo una reserva vigente en estado «Pendiente de pago» o «Pagada».

#### Scenario: Selección de cupo no disponible

- **GIVEN** que los cupos de un viaje se encuentran bloqueados temporalmente o agotados
- **WHEN** un pasajero intente seleccionarlos
- **THEN** el sistema impedirá el proceso
- **AND** le mostrará un mensaje señalando que no hay cupos disponibles
- **AND** no se crea la reserva

### Requirement: Consultar el estado de una reserva registrada

El sistema DEBE permitir consultar una reserva por su código y mostrar el pasajero, el viaje, el asiento y su estado actual, incluyendo «Pendiente de pago» al momento de registrarse.

#### Scenario: Consultar estado de la reserva registrada

- **GIVEN** que el pasajero ha registrado exitosamente una reserva
- **WHEN** consulta los datos de su reserva
- **THEN** el sistema muestra que se encuentra asociado al viaje seleccionado en estado pendiente de pago

### Requirement: Reutilizar al pasajero por RUT

El sistema DEBE identificar al pasajero por su RUT: si ya existe, DEBE reutilizar sus datos sin duplicarlo; si no existe, DEBE crearlo con RUT, nombres, apellidos, teléfono y correo electrónico. Todos esos datos son obligatorios.

#### Scenario: Pasajero existente reutilizado

- **GIVEN** que existe un pasajero registrado con el RUT ingresado
- **WHEN** el pasajero confirma una nueva reserva
- **THEN** el sistema reutiliza el pasajero existente
- **AND** no crea un pasajero duplicado

### Requirement: Retener cada asiento desde su selección

El sistema DEBE (MUST) retener cada asiento disponible para el cliente que lo selecciona durante 8 minutos desde esa selección y guardar su vencimiento en Asiento. Cada retención DEBE consumir exactamente un cupo e impedir la selección por otros clientes. Repetir una selección vigente del mismo cliente NO DEBE reiniciar su plazo ni descontar otro cupo.

#### Scenario: Retención de un asiento al seleccionarlo
- **GIVEN** que un asiento del viaje está disponible
- **WHEN** el cliente lo selecciona
- **THEN** el sistema lo retiene para ese cliente durante 8 minutos desde la selección y registra su vencimiento en el asiento
- **AND** bloquea su selección por otros clientes mientras la retención esté vigente
- **AND** descuenta exactamente un cupo desde la selección

### Requirement: Registrar una única reserva con sus pasajeros y asientos

El sistema DEBE (MUST) registrar una reserva Pendiente de pago, con un código único y uno o varios DetalleReserva del mismo viaje, identificando un pasajero por asiento. DEBE conservar los vencimientos originales, no volver a descontar cupos y solicitar al Servicio de correo simulado una notificación de registro exitoso por pasajero después del registro correcto.

#### Scenario: Confirmación de una reserva con uno o varios asientos
- **GIVEN** que el cliente seleccionó uno o varios asientos del mismo viaje con retenciones vigentes y completó los datos obligatorios, incluyendo un pasajero por asiento
- **WHEN** confirma la operación
- **THEN** el sistema crea una única reserva pendiente de pago con un solo código, asociada al viaje y a todos los asientos con sus respectivos pasajeros, sin reiniciar las retenciones
- **AND** solicita al servicio de correos externo una notificación de registro exitoso para cada pasajero
- **AND** no vuelve a descontar los cupos retenidos

### Requirement: Impedir la selección de cupos no disponibles

El sistema DEBE (MUST) impedir seleccionar un asiento retenido por otro cliente o asignado a una reserva vigente, así como superar los cupos del viaje. DEBE informar «No hay cupos disponibles para el asiento seleccionado.» sin modificar retenciones ajenas ni crear una reserva.

#### Scenario: Selección de cupo no disponible
- **GIVEN** que los cupos de un viaje se encuentran bloqueados temporalmente o agotados
- **WHEN** un pasajero intente seleccionarlos
- **THEN** el sistema impedirá el proceso
- **AND** le mostrará un mensaje señalando que no hay cupos disponibles
- **AND** no crea una reserva ni modifica la selección de otro cliente

### Requirement: Consultar todos los datos de la reserva por código

El sistema DEBE (MUST) permitir consultar por código el viaje, todos los asientos con sus respectivos pasajeros, el estado y si la reserva incluye ida y vuelta. En ese caso DEBE mostrar el lugar de regreso ingresado. DEBE conservar la consulta de las reservas históricas y responder que no se encontró la reserva si el código no existe.

#### Scenario: Consultar una reserva registrada
- **GIVEN** que existe una reserva pendiente de pago con uno o varios asientos
- **WHEN** el cliente la consulta mediante su código
- **THEN** el sistema muestra el viaje, los asientos con sus respectivos pasajeros, el estado y si la reserva incluye ida y vuelta
- **AND** muestra el lugar de regreso ingresado cuando la reserva es de ida y vuelta

### Requirement: Rechazar toda confirmación con retenciones inválidas

El sistema DEBE (MUST) validar que cada asiento corresponde al viaje, está retenido para el cliente que confirma y no ha vencido. Si falla alguno, DEBE rechazar toda la reserva, sin registrar pasajeros ni detalles parciales, e informar «La selección ya no está disponible o alguna retención venció. Revisa tu selección.». No DEBE renovar ni adquirir retenciones al confirmar.

#### Scenario: Rechazo de la operación por pérdida de disponibilidad
- **GIVEN** que el cliente seleccionó varios asientos y alguno dejó de estar disponible para él o su retención venció
- **WHEN** intenta confirmar la operación
- **THEN** el sistema impide crear la reserva completa, sin registrar parcialmente los asientos
- **AND** solicita al cliente revisar su selección
- **AND** no guarda pasajeros nuevos ni solicita notificaciones de esa operación fallida

### Requirement: Vencer la reserva completa al primer vencimiento

El sistema DEBE (MUST) marcar como Vencida una reserva Pendiente de pago cuando vence la retención de cualquiera de sus asientos sin pago aprobado, liberar todos sus asientos y restituir sus cupos una sola vez. Una reserva Pagada NO DEBE vencer por sus antiguas retenciones. El instante de vencimiento se considera incluido en la expiración.

#### Scenario: Vencimiento de una reserva con varios asientos
- **GIVEN** que existe una reserva pendiente de pago con varios asientos
- **WHEN** vence la retención de cualquiera de ellos sin haberse aprobado el pago
- **THEN** el sistema marca toda la reserva como vencida y libera todos sus asientos
- **AND** restituye exactamente un cupo por asiento liberado aunque se revise el vencimiento varias veces

### Requirement: Guardar el lugar de regreso de una reserva de ida y vuelta

El sistema DEBE (MUST) guardar en Reserva si incluye ida y vuelta y el lugar de regreso ingresado por el cliente cuando corresponda. La modalidad pertenece a la reserva completa.

#### Scenario: Registro del lugar de regreso
- **GIVEN** que el cliente indica que su reserva es de ida y vuelta
- **WHEN** completa el lugar de regreso y confirma con los demás datos válidos y las retenciones vigentes
- **THEN** el sistema registra la reserva incluyendo el lugar de regreso ingresado

### Requirement: Exigir lugar de regreso cuando incluye ida y vuelta

El sistema DEBE (MUST) impedir registrar una reserva de ida y vuelta si su lugar de regreso está vacío o contiene solo espacios, e indicar «El lugar de regreso es obligatorio para una reserva de ida y vuelta.» junto al campo. La operación NO DEBE crear reservas, detalles ni pasajeros parciales.

#### Scenario: Falta el lugar de regreso en una reserva de ida y vuelta
- **GIVEN** que el cliente indicó que su reserva es de ida y vuelta y completó los demás datos válidos con retenciones vigentes
- **WHEN** intenta confirmarla sin ingresar el lugar de regreso
- **THEN** el sistema impide el registro e indica que el lugar de regreso es obligatorio

### Requirement: Permitir reserva sin lugar de regreso cuando no incluye ida y vuelta

El sistema DEBE (MUST) permitir registrar una reserva sin lugar de regreso cuando no incluye ida y vuelta, siempre que los demás datos sean válidos y las retenciones estén vigentes. Si el cliente ingresa un lugar de regreso opcional, DEBE conservarlo, sin mostrarlo como un regreso contratado.

#### Scenario: Reserva sin ida y vuelta
- **GIVEN** que el cliente indica que su reserva no incluye ida y vuelta
- **WHEN** confirma con los demás datos válidos y las retenciones vigentes
- **THEN** el sistema registra la reserva sin exigir un lugar de regreso

### Requirement: Identificar al pasajero por RUT y exigir sus datos

El sistema DEBE (MUST) exigir RUT, nombres, apellidos, teléfono y correo electrónico por asiento. DEBE normalizar el RUT eliminando puntos, guiones y espacios y convirtiéndolo a mayúsculas; si existe, DEBE reutilizar al pasajero conservando sus datos, y si no, crearlo. Datos incompletos o inválidos DEBEN impedir todo el registro y señalar los campos afectados.

#### Scenario: Pasajero existente reutilizado
- **GIVEN** que existe un pasajero registrado con el RUT ingresado
- **WHEN** el cliente confirma otra reserva con datos obligatorios y retenciones válidas
- **THEN** el sistema asocia al pasajero existente al detalle correspondiente sin duplicarlo ni sobrescribir sus datos

#### Scenario: Datos obligatorios de un pasajero incompletos
- **GIVEN** que el cliente tiene retenciones vigentes y falta algún dato obligatorio de uno de los pasajeros
- **WHEN** confirma la operación
- **THEN** el sistema indica los campos afectados y no registra ninguna parte de la reserva ni nuevos pasajeros
- **AND** conserva los vencimientos originales de las retenciones que sigan vigentes

### Requirement: Liberar retenciones vencidas antes del registro

El sistema DEBE (MUST) liberar un asiento cuya retención venció y que no pertenece a una reserva vigente, restituir su cupo una sola vez y permitir que otro cliente lo seleccione con un nuevo plazo. DEBE actualizar los vencimientos antes de procesar una nueva consulta de disponibilidad o solicitud de reserva; abandonar el formulario NO DEBE prolongar una retención.

#### Scenario: Retención vencida sin reserva registrada
- **GIVEN** que un cliente seleccionó un asiento y no registró una reserva antes de vencer su retención
- **WHEN** se alcanza su vencimiento
- **THEN** el sistema libera el asiento y restituye su cupo sin crear una reserva
- **AND** una nueva selección válida puede retenerlo para otro cliente durante sus propios 8 minutos

### Requirement: Conservar las reservas anteriores durante la actualización

El sistema DEBE (MUST) conservar los códigos, estados, identificadores y asociaciones a viajes, asientos y pasajeros de las reservas existentes. Cada reserva anterior DEBE consultarse como una reserva de un detalle, sin ida y vuelta por defecto. Para las pendientes DEBE conservar el vencimiento guardado, sin otorgar un nuevo plazo.

#### Scenario: Consulta de una reserva creada antes del ajuste
- **GIVEN** que existe una reserva registrada con la versión anterior del sistema
- **WHEN** se actualiza el sistema y se consulta su código
- **THEN** se muestran el mismo código, viaje, asiento y pasajero, con un único detalle y sin ida y vuelta por defecto
- **AND** su estado respeta el vencimiento original si estaba pendiente, sin reocupar asientos de reservas vencidas
