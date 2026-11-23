# Spec Delta — pagos-reservas

## Purpose

Permitir al pasajero pagar el total de una reserva con uno o varios asientos mediante una pasarela simulada, confirmar todos sus cupos dentro del plazo original y recibir la devolución completa si la aprobación llega después del vencimiento. Fuente: HU-05, CU-03 y ficha `.cin324/historias/HU-05.md` confirmada el 2026-11-22, incluidos sus supuestos documentales.

## ADDED Requirements

### Requirement: Redirigir a la pasarela al registrar la reserva

El sistema DEBE (MUST) iniciar un intento de pago Pendiente al registrar una reserva Pendiente de pago con todas sus retenciones vigentes y redirigir al pasajero a la pasarela simulada. DEBE permitir tarjeta de crédito o débito y conservar el código, los pasajeros, los asientos y los vencimientos originales de la reserva.

#### Scenario: Redirección a pasarela
- **GIVEN** que el cliente ha completado los datos de una reserva con uno o varios asientos del mismo viaje y todas sus retenciones siguen vigentes
- **WHEN** confirma el registro
- **THEN** el sistema registra una única reserva pendiente de pago e inicia un intento de pago por su monto total
- **AND** lo redirige de forma segura a una pasarela de pago externa simulada que permite tarjeta de crédito o débito
- **AND** conserva su código, pasajeros, asientos y vencimientos originales

### Requirement: Cobrar el monto total de los asientos incluidos

El sistema DEBE (MUST) calcular el monto total como el costo del viaje multiplicado por la cantidad de asientos incluidos mediante los detalles de la reserva. NO DEBE agregar un recargo por ida y vuelta ni dividir el pago por asiento. DEBE informar el monto al pasajero y conservar el monto correspondiente a cada intento.

#### Scenario: Monto total de la reserva
- **GIVEN** que una reserva incluye uno o varios asientos del mismo viaje
- **WHEN** el sistema inicia el pago
- **THEN** el monto es el costo del viaje multiplicado por la cantidad de asientos incluidos
- **AND** no agrega un recargo por la modalidad de ida y vuelta
- **AND** presenta al pasajero ese total y lo conserva asociado al intento

### Requirement: Confirmar todos los asientos solo con aprobación vigente

El sistema DEBE (MUST) registrar la aprobación y confirmar la reserva y todos sus asientos de forma atómica, solo desde Pendiente de pago y con todas las retenciones vigentes, sin descontar cupos otra vez. Una reserva Pagada NO DEBE vencer por sus antiguas retenciones. Repetir la misma aprobación, incluso simultáneamente o tras reiniciar, DEBE devolver el estado persistido sin otra confirmación.

#### Scenario: Pago exitoso
- **GIVEN** que la reserva está pendiente de pago y todas sus retenciones siguen vigentes
- **WHEN** la pasarela aprueba el pago
- **THEN** el sistema registra el pago como "Aprobado" y actualiza la reserva a "Pagada"
- **AND** confirma todos sus asientos sin volver a descontar cupos
- **AND** informa al pasajero que el pago confirmó la reserva

#### Scenario: Aprobación repetida de un pago que confirmó la reserva
- **GIVEN** que una aprobación ya confirmó el pago y la reserva con todos sus asientos
- **WHEN** el sistema recibe de nuevo la misma aprobación, simultáneamente con otra copia o después de reiniciar
- **THEN** devuelve el estado persistido del mismo pago y mantiene la reserva "Pagada"
- **AND** existe una sola confirmación de la reserva y no se descuentan cupos ni se solicita devolución por esas repeticiones

#### Scenario: Fallo antes de completar el procesamiento de una aprobación
- **GIVEN** que una reserva está pendiente con todas sus retenciones vigentes y su intento de pago está pendiente
- **WHEN** ocurre un fallo al persistir la aprobación antes de completar la operación
- **THEN** no queda un resultado parcial: el pago y la reserva conservan sus estados previos y los asientos y cupos no cambian
- **AND** volver a procesar la misma aprobación puede completar la operación una sola vez si las retenciones aún siguen vigentes

### Requirement: Conservar los plazos tras rechazo o cancelación

El sistema DEBE (MUST) registrar el intento como Rechazado o Cancelado según el resultado de la pasarela e informar «El pago no fue completado». Mientras todas las retenciones sigan vigentes DEBE conservar la reserva Pendiente de pago y los vencimientos originales, sin cancelarla inmediatamente, liberar asientos ni conceder un nuevo plazo.

#### Scenario: Pago fallido o cancelado
- **GIVEN** que el cliente se encuentra en la pasarela y todas las retenciones de su reserva siguen vigentes
- **WHEN** la pasarela rechaza la transacción o el usuario cancela la operación
- **THEN** el sistema registra el pago como "Rechazado" o "Cancelado", según corresponda
- **AND** muestra "El pago no fue completado"
- **AND** conserva la reserva pendiente y los vencimientos originales de todos sus asientos, sin reiniciar sus plazos

### Requirement: Permitir reintentos con historial dentro del plazo original

El sistema DEBE (MUST) permitir un nuevo intento por el total después de rechazo o cancelación solo si la reserva sigue Pendiente de pago y todas sus retenciones siguen vigentes. DEBE conservar el historial de intentos y los vencimientos originales. La consulta por código DEBE presentar los intentos con su monto, medio cuando se haya elegido, estado y situación de devolución.

#### Scenario: Reintento dentro del plazo original
- **GIVEN** que un intento fue rechazado o cancelado y la reserva sigue pendiente con todas sus retenciones vigentes
- **WHEN** el pasajero reintenta el pago
- **THEN** el sistema inicia otro intento por el monto total de la reserva
- **AND** conserva el historial de intentos y los vencimientos originales de los asientos
- **AND** permite consultar el historial junto a la reserva mediante su código

### Requirement: Vencer toda reserva pendiente al primer vencimiento

El sistema DEBE (MUST) vencer toda reserva pendiente al alcanzar cualquier vencimiento sin pago aprobado, liberar sus asientos y restituir sus cupos una sola vez, sin reiniciar plazos. Ante aprobación y vencimiento concurrentes DEBE conservar un único resultado terminal: Pagada con todos sus asientos confirmados, o Vencida con sus asientos liberados. NO DEBE convertir una reserva Pagada en Vencida ni reactivar una Vencida como Pagada.

#### Scenario: Vencimiento de una reserva pendiente
- **GIVEN** que existe una reserva pendiente de pago con uno o varios asientos
- **WHEN** vence la retención de cualquiera de ellos sin pago aprobado
- **THEN** el sistema marca toda la reserva como "Vencida"
- **AND** libera todos sus asientos y restituye sus cupos
- **AND** repetir el procesamiento no restituye cupos nuevamente ni modifica retenciones posteriores de otro cliente

#### Scenario: Aprobación vigente completada antes de procesar el vencimiento concurrente
- **GIVEN** que una reserva pendiente tiene todas sus retenciones vigentes cuando se decide su aprobación
- **WHEN** se completa la aprobación y una operación concurrente de vencimiento continúa después
- **THEN** la reserva permanece "Pagada" con todos sus asientos confirmados
- **AND** la operación de vencimiento no libera sus asientos ni restituye cupos ni solicita devolución

#### Scenario: Vencimiento completado antes de procesar la aprobación concurrente
- **GIVEN** que una reserva pendiente alcanzó el vencimiento de una de sus retenciones
- **WHEN** se completa su vencimiento y una aprobación concurrente continúa después
- **THEN** la reserva permanece "Vencida" y sus asientos no se vuelven a ocupar
- **AND** el pago se registra "Aprobado" con una única solicitud de devolución completa
- **AND** los cupos se restituyen una sola vez y se conservan las asignaciones posteriores a otros clientes

### Requirement: Impedir iniciar pagos para reservas vencidas

El sistema DEBE (MUST) comprobar el estado y todas las retenciones antes de iniciar cada intento. Si la reserva ya venció o alcanzó cualquier vencimiento mientras seguía pendiente, DEBE mantener o aplicar el vencimiento completo e impedir el nuevo intento, informando que la reserva está vencida. NO DEBE registrar otro intento ni iniciar otra sesión de pago para esa operación.

#### Scenario: Impedir un nuevo intento de pago de una reserva vencida
- **GIVEN** que una reserva venció o alguna de sus retenciones alcanzó su vencimiento mientras seguía pendiente
- **WHEN** el pasajero intenta iniciar otro pago
- **THEN** el sistema mantiene o aplica el vencimiento de toda la reserva
- **AND** impide iniciar el nuevo intento e informa que la reserva está vencida
- **AND** no registra un nuevo intento ni inicia una nueva sesión de pasarela

### Requirement: Solicitar devolución completa de una aprobación tardía

El sistema DEBE (MUST) registrar como Aprobado un pago aprobado después del vencimiento y solicitar automáticamente su devolución total, conservando la reserva Vencida y la solicitud persistida. DEBE informar el resultado sin recuperar asientos. Las copias de la misma aprobación, incluso simultáneas o después de reiniciar, DEBEN devolver el estado guardado sin generar otra solicitud ni otra devolución del mismo pago.

#### Scenario: Pago aprobado después del vencimiento
- **GIVEN** que la reserva venció o alguna de sus retenciones venció mientras seguía pendiente
- **WHEN** el sistema recibe una aprobación de pago para ella
- **THEN** registra el pago como "Aprobado" y mantiene o aplica el vencimiento completo de la reserva
- **AND** solicita automáticamente a la pasarela la devolución del monto completo, dejando registrada la solicitud
- **AND** informa al pasajero que la reserva venció y la devolución fue solicitada
- **AND** no reactiva la reserva ni vuelve a ocupar sus asientos

#### Scenario: Aprobación tardía duplicada sin otra devolución
- **GIVEN** que una aprobación tardía ya generó una solicitud de devolución completa para el mismo pago
- **WHEN** se recibe otra vez la misma aprobación, simultáneamente con otra copia o después de reiniciar
- **THEN** el sistema conserva el pago "Aprobado" y su única solicitud de devolución mientras no se confirme la devolución
- **AND** no produce una segunda solicitud ni otra devolución, confirmación de reserva o restitución de cupos

### Requirement: Distinguir una devolución solicitada de una confirmada

El sistema DEBE (MUST) mantener el pago Aprobado y la solicitud registrada mientras la pasarela no confirme la devolución completa. DEBE presentar la devolución como solicitada y NO DEBE informar que el monto ya fue devuelto ni alterar la reserva Vencida o las asignaciones actuales de sus asientos.

#### Scenario: Devolución solicitada aún no confirmada
- **GIVEN** que se solicitó la devolución de un pago aprobado para una reserva vencida
- **WHEN** la pasarela aún no ha confirmado la devolución completa
- **THEN** el pago permanece "Aprobado" con la solicitud registrada
- **AND** el sistema no informa que el monto ya fue devuelto

### Requirement: Registrar la devolución completa confirmada

El sistema DEBE (MUST) pasar el pago de Aprobado a Devuelto solo al confirmar la devolución completa solicitada por vencimiento, informando el resultado y manteniendo la reserva Vencida. Repetir la confirmación o la aprobación original, incluso tras reiniciar, DEBE devolver el estado Devuelto sin otra devolución, restitución de cupos ni recuperación de asientos. Devuelto NO DEBE retroceder a Aprobado.

#### Scenario: Devolución completa confirmada
- **GIVEN** que se solicitó la devolución de un pago aprobado para una reserva vencida
- **WHEN** la pasarela confirma la devolución completa
- **THEN** el sistema actualiza el pago a "Devuelto"
- **AND** mantiene la reserva "Vencida" y sus asientos liberados, sin alterar asignaciones posteriores a otros clientes
- **AND** informa al pasajero que su reserva venció y el monto fue devuelto

#### Scenario: Confirmación de devolución repetida
- **GIVEN** que la pasarela ya confirmó la devolución completa y el pago está "Devuelto"
- **WHEN** se repite la confirmación, simultáneamente con otra copia o después de reiniciar
- **THEN** el sistema devuelve el estado "Devuelto" y conserva una sola devolución completa confirmada
- **AND** no modifica la reserva "Vencida", sus cupos ni las asignaciones actuales de sus asientos

#### Scenario: Aprobación repetida después de la devolución completa
- **GIVEN** que una aprobación tardía ya fue devuelta completamente y el pago está "Devuelto"
- **WHEN** se recibe otra vez la aprobación original, incluso después de reiniciar
- **THEN** el sistema devuelve el estado "Devuelto" sin volver a registrar el pago como "Aprobado"
- **AND** no confirma la reserva ni genera otra solicitud o devolución ni modifica asientos o cupos
