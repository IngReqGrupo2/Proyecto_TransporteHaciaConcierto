# Diagramas de secuencia de sistema

## DSS-01 — Reservar asiento y registrar pasajero

- Caso de uso: [CU-02](./09-casos-de-uso.md#cu-02)
- Historia: [HU-02](./04-historias-usuario.md#hu-02-registrar-reserva-y-pasajero)
- Sistemas externos que participan: Servicio de correo (caja negra)

![DSS-01](./diagramas/dss-01.png)

Archivo fuente: [`./diagramas/dss-01.mmd`](./diagramas/dss-01.mmd)

Variantes representadas:

- `alt` Asiento disponible: el sistema bloquea el asiento de forma temporal, recibe los datos del pasajero, registra la reserva asociándola al viaje y solicita al servicio de correo externo el envío de la notificación de registro exitoso.
- `alt` Asiento bloqueado temporalmente o reservado: el sistema impide la selección e informa al pasajero que el asiento no está disponible.

## DSS-02 — Pagar reserva

- Caso de uso: [CU-03](./09-casos-de-uso.md#cu-03)
- Historia: [HU-05](./04-historias-usuario.md#hu-05-pagar-reserva)
- Sistemas externos que participan: Pasarela de pago (caja negra)

![DSS-02](./diagramas/dss-02.png)

Archivo fuente: [`./diagramas/dss-02.mmd`](./diagramas/dss-02.mmd)

Variantes representadas:

- `alt` Pago aprobado: la pasarela notifica la aprobación, el sistema cambia la reserva a Pagada, confirma definitivamente el cupo retenido e informa al pasajero.
- `alt` Pago rechazado o cancelado: la pasarela notifica el rechazo o la cancelación, el sistema mantiene el cupo retenido por un tiempo límite (8 minutos), informa que el pago no fue completado y libera el cupo al vencer ese plazo.
