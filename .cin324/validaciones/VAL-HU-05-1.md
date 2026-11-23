# Informe de revalidación — HU-05 · Pagar reserva

**Fecha:** 2026-11-22 · **Cambio de OpenSpec relacionado:** `hu-05-pagar-reserva` (archivado) · **Estado:** revalidada sin observaciones

## Resumen

El estudiante recorrió el flujo de pago como pasajero y confirmó que todo ocurrió como indica la ficha confirmada de HU-05. No hubo observaciones sobre el sistema.

| Obs. | Lo que observaste | Tipo | Artefacto principal a modificar | También revisar |
|------|-------------------|------|----------------------------------|------------------|
| — | Sin observaciones | — | Ninguno | Ninguno |

**Lo que sí funcionó:** los nueve casos comprobados (ver abajo) coincidieron con `.cin324/historias/HU-05.md`, EST-01/EST-02 y DSS-02.

## Casos comprobados

| Caso | Resultado observado |
|---|---|
| Redirección a pasarela | Se abre la pasarela simulada con el código de reserva y todos sus asientos |
| Monto total | $15.000 por un asiento y $30.000 por dos; ida y vuelta no cambia el precio |
| Pago exitoso | Reserva «Pagada», pago «Aprobado» y asientos confirmados sin otro descuento de cupos |
| Pago fallido o cancelado | «El pago no fue completado»; la reserva sigue pendiente con sus plazos originales |
| Reintento | Nuevo intento por el total, conservando el historial y los vencimientos |
| Vencimiento completo | Al vencer un asiento, toda la reserva queda «Vencida» y se liberan sus cupos |
| Impedir pago de vencida | No se ofrece otro intento y se informa que la reserva está vencida |
| Aprobación tardía | Pago «Aprobado», reserva «Vencida» y devolución completa solicitada |
| Devolución completa | El pago pasa a «Devuelto», la reserva sigue «Vencida» y se informa la devolución |

## Diagnóstico

- No se identificaron observaciones de tipo A, B, C ni D sobre el sistema.
- No se modificó ningún artefacto de especificación ni el código.
- Sigue pendiente, por decisión previa del estudiante, la alineación documental opcional del BPMN TO-BE, el Gherkin publicado en `07-criterios-aceptacion.md`, DSS-02 y EST-02 con las reglas confirmadas de la ficha. No es un defecto del sistema.

## Siguiente paso

El cambio `hu-05-pagar-reserva` ya está archivado. Si el estudiante quiere cerrar la diferencia documental, corresponde proponer los cambios de alineación uno por uno; si no, se puede continuar con HU-04.
