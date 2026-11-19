# Modelo de dominio

## Diagrama

![MD-01 — Modelo de dominio: Transporte a Conciertos](./diagramas/modelo-dominio.png)

Archivo fuente: [`./diagramas/modelo-dominio.puml`](./diagramas/modelo-dominio.puml)

## Descripción de las clases

| Clase | Qué representa en el negocio | Atributos |
|---|---|---|
| **Evento** | Concierto o evento al que se dirige el transporte. | `nombre: Texto`, `fechaEvento: Fecha` |
| **Vehiculo** | Vehículo utilizado para prestar el servicio de traslado. | `modelo: Texto`, `patente: Texto`, `capacidadPasajeros: Número` |
| **Administrador** | Persona responsable de crear los viajes ofrecidos. | `rut: Texto`, `correoElectronico: Texto`, `telefono: Texto`, `fechaContratacion: Fecha` |
| **Viaje** | Traslado organizado hacia un evento, con su información de salida, regreso y disponibilidad. | `idViaje: Texto`, `fechaViaje: Fecha`, `horaSalida: Hora`, `horaRegreso: Hora`, `lugarEncuentro: Texto`, `costo: Monto`, `capacidad: Número`, `cuposDisponibles: Número`, `estado: EstadoViaje`, `conductorAsignado: Texto`, `asistenteAsignado: Texto` |
| **Asiento** | Asiento físico ofrecido en un viaje; la reserva ocupa uno de estos asientos y con ello consume un cupo. | `numero: Número` |
| **Pasajero** | Persona que reserva un cupo en un viaje. | `rut: Texto`, `nombres: Texto`, `apellidos: Texto`, `telefono: Texto`, `correoElectronico: Texto` |
| **Reserva** | Registro que vincula al pasajero con un viaje y conserva el estado de su cupo. | `codigoReserva: Texto`, `fechaRegistro: FechaHora`, `vencimientoRetencion: FechaHora`, `estado: EstadoReserva` |
| **Pago** | Pago o intento de pago asociado a una reserva. | `idPago: Texto`, `monto: Monto`, `medioPago: Texto`, `fechaPago: FechaHora`, `estado: EstadoPago` |
| **RegistroAsistencia** | Registro de la asistencia del pasajero en la ida y el regreso del viaje. | `asistenciaIda: EstadoAsistencia`, `asistenciaRegreso: EstadoAsistencia` |

## Asociaciones

| Asociación | Clases | Multiplicidades | Justificación |
|---|---|---|---|
| **corresponde a** | Evento – Viaje | `1` – `1` | El viaje corresponde al evento al que se transportará a los pasajeros. |
| **se utiliza en** | Vehiculo – Viaje | Cada viaje: `1` vehículo; cada vehículo: `0..*` viajes | El viaje utiliza un vehículo para realizar el traslado; un mismo vehículo puede utilizarse en varios viajes. |
| **contiene** | Viaje – Asiento | Cada viaje: `1..*` asientos; cada asiento: `1` viaje | Composición: cada viaje contiene sus asientos físicos (máximo 17 por la capacidad de los vehículos disponibles) y un asiento no existe sin su viaje. |
| **se asigna a** | Asiento – Reserva | Cada asiento: `0..*` reservas (histórico, una vigente a la vez); cada reserva: `1` asiento | La reserva incluye un asiento físico del mismo viaje y, al ocuparlo, consume un cupo. Un asiento no puede tener más de una reserva vigente simultánea. |
| **crea** | Administrador – Viaje | Cada viaje: `1` administrador; cada administrador: `0..*` viajes | El administrador crea y registra viajes para publicarlos. |
| **recibe** | Viaje – Reserva | Cada reserva: `1` viaje; cada viaje: `0..*` reservas | Un viaje recibe las reservas efectuadas por los pasajeros. |
| **realiza** | Pasajero – Reserva | Cada reserva: `1` pasajero; cada pasajero: `0..*` reservas | Cada reserva está asociada al pasajero que la realiza. |
| **registra** | Reserva – Pago | Cada pago: `1` reserva; cada reserva: `0..*` pagos | Una reserva puede registrar un pago, y este queda asociado a dicha reserva. |
| **documenta abordaje** | Reserva – RegistroAsistencia | Cada registro de asistencia: `1` reserva; cada reserva: `0..1` registros de asistencia | Se documenta la asistencia de ida y regreso correspondiente a la reserva del pasajero. |

## Decisiones de modelado

- **Evento y Viaje se modelan de forma separada:** el evento corresponde al concierto y el viaje al traslado ofrecido hacia él.
- **Asiento se modela como clase independiente y composición:** cada viaje contiene asientos físicos numerados que la reserva ocupa de a uno; un asiento no existe sin su viaje (`*--`). La disponibilidad de un asiento se deriva de si tiene o no una reserva vigente, aunque conserva el histórico de reservas. Ocupar un asiento consume exactamente un cupo del viaje, por lo que la capacidad máxima es de 17 pasajeros/asientos. La reserva debe ocupar un asiento perteneciente al mismo viaje con el que se asocia.
- **Administrador se modela como clase:** además de crear viajes, el diagrama registra sus datos propios (RUT, correo electrónico, teléfono y fecha de contratación), por lo que representa información del negocio y no solamente un actor.
- **RegistroAsistencia se modela como clase independiente y composición:** registra la asistencia de ida y regreso asociada a una reserva; se modela como una composición fuerte (`*--`) desde `Reserva`, ya que el registro de abordaje no existe de manera autónoma sin una reserva asociada.
- **Conductor y asistente asignados se representan como atributos de Viaje:** el diagrama no los define como clases independientes.
- **Relaciones del modelo:** las relaciones son asociaciones simples binarias, con excepción de las composiciones `Viaje–Asiento` y `Reserva–RegistroAsistencia`.
