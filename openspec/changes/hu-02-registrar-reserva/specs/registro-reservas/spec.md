# Spec Delta — registro-reservas

## Purpose

Permite al pasajero reservar un asiento de un viaje, registrar sus datos, retener el cupo y consultar el estado de su reserva sin depender de la atención manual del administrador.

## ADDED Requirements

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
