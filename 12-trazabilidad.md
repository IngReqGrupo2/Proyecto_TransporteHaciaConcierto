# Trazabilidad

## Criterio de construcción

Se incluye **una fila por requisito de producto de la Entrega 1** (`RP-01` a `RP-14`) y una fila adicional para el requisito derivado `RP-D01`. Se incluyen las cinco historias de usuario (`HU-01` a `HU-05`). Los requisitos de proyecto `RY-01` y `RY-02` son restricciones de calendario y alcance y no se presentan como requisitos de producto en esta matriz.

**Importante:** al momento de la revisión, el repositorio tiene publicados los requisitos y las historias, pero todavía no contiene los archivos `09-casos-de-uso.md` y `10-diagramas-secuencia.md`. Por eso, los códigos **CU-xx y DSS-xx son propuestas de coordinación**, no referencias ya verificadas. No deben considerarse cerradas hasta que el equipo cree esos documentos con los mismos identificadores y eventos.

### Correspondencia propuesta para coordinación

| Código propuesto | Caso de uso / secuencia que debe existir | Historia de origen |
|---|---|---|
| CU-01 | Consultar cartelera y disponibilidad de viajes | HU-01 |
| CU-02 | Registrar reserva de un pasajero | HU-02 |
| CU-03 | Crear y publicar viaje | HU-03 |
| CU-04 | Consultar nómina y registrar abordaje | HU-04 |
| CU-05 | Pagar reserva en línea | HU-05 |
| DSS-01 | Registrar reserva, retener cupo y solicitar notificación mediante servicio externo de correos | HU-02 / CU-02 |
| DSS-02 | Solicitar pago y recibir aprobación, rechazo o cancelación desde la pasarela externa | HU-05 / CU-05 |

## Matriz de trazabilidad

| Requisito (Entrega 1) | Historia | Caso de uso (propuesto) | Secuencia (propuesta) | Estado | Clases del dominio |
|---|---|---|---|---|---|
| RP-01 | HU-03 | CU-03 | — | EST-02 | `Evento`, `Viaje`, `Vehiculo` |
| RP-02 | HU-01 | CU-01 | — | EST-02 | `Evento`, `Viaje` |
| RP-03 | HU-02 | CU-02 | DSS-01 | EST-01, EST-02 | `Viaje`, `Reserva` |
| RP-04 | HU-01, HU-02 | CU-01, CU-02 | DSS-01 | EST-02 | `Viaje`, `Reserva` |
| RP-05 | HU-02 | CU-02 | DSS-01 | EST-01 | `Viaje`, `Pasajero`, `Reserva` |
| RP-06 | HU-05 | CU-05 | DSS-02 | EST-01 | `Reserva`, `Pago` |
| RP-07 | HU-04 | CU-04 | — | — | `Viaje`, `Reserva`, `Pasajero` |
| RP-08 | HU-04 | CU-04 | — | EST-02 | `Viaje`, `Reserva`, `Pasajero`, `RegistroAsistencia` |
| RP-09 | HU-01 | CU-01 | — | — | `Evento`, `Viaje` |
| RP-10 | HU-02 | CU-02 | DSS-01 | EST-01 | `Viaje`, `Pasajero`, `Reserva` |
| RP-11 | HU-01, HU-02 | CU-01, CU-02 | DSS-01 | EST-02 | `Viaje`, `Reserva` |
| RP-12 | HU-02 | CU-02 | DSS-01 | EST-01 | `Pasajero`, `Reserva` |
| RP-13 | HU-05 | CU-05 | DSS-02 | EST-01 | `Reserva`, `Pago` |
| RP-14 | HU-04 | CU-04 | — | — | `Viaje`, `Reserva`, `Pasajero`, `RegistroAsistencia` |
| RP-D01 | HU-02 | CU-02 | DSS-01 | EST-01, EST-02 | `Viaje`, `Reserva` |

## Observaciones

1. **Sin DSS para CU-01, CU-03 y CU-04:** las dos secuencias obligatorias de la rúbrica se priorizan para las historias con sistemas externos: HU-02 (servicio de correos) y HU-05 (pasarela de pagos). Las historias de consulta, publicación y control de abordaje no tienen, en la documentación actual, una integración externa obligatoria para representar como DSS.
2. **RP-07, RP-09 y RP-14 sin estado propio:** generar la lista, soportar móviles y mantenerla actualizada no constituye por sí solo una transición de ciclo de vida; sí se relacionan con las clases indicadas. `RP-08` se vincula con `EST-02` por el estado `En curso` que habilita el control de abordaje.
3. **HU-01 a HU-05 cubiertas:** todas las historias aparecen como mínimo en una fila. Una historia puede satisfacer más de un requisito y viceversa.
4. **Integridad de los 17 cupos:** `RP-03`, `RP-11`, `RP-12` y `RP-D01` deben mantener el mismo criterio: contabilizar reservas `Pagada` y `Pendiente de pago` cuya retención siga vigente. Las `Vencida` dejan de ocupar un cupo. La confirmación del pago **no debe descontar nuevamente** el cupo retenido.
5. **Discrepancia en la nómina:** `RP-07` habla de pasajeros que *poseen una reserva*, mientras `HU-04` habla de *pasajeros confirmados*; el equipo debe decidir si la nómina muestra solo reservas `Pagada` o también las `Pendiente de pago`. Para el control de abordaje se recomienda usar las pagadas, pero esta regla **requiere validación**.
6. **Información de correo por definir:** HU-02 incluye notificación por correo; sin embargo, el listado de campos obligatorios en `05-elicitacion.md` no incluye dirección de correo electrónico. Acordar la captura de ese dato y documentar el resultado.
7. **Mensajes y eventos por sincronizar:** `DSS-01` debe incluir al menos `registrarReserva`, validación de cupo, retención y solicitud de notificación, y sus variantes sin cupo o error del servicio de correo. `DSS-02` debe incluir `pagoAprobado`, `pagoRechazado` y `pagoCancelado` desde la pasarela; la expiración de 8 minutos (`vencerRetencion`) debe coincidir con `EST-01`.
8. **Términos uniformes:** usar `Registrado`, `Publicado con cupos`, `Sin cupos`, `En curso`, `Finalizado` para `Viaje`, y `Pendiente de pago`, `Pagada`, `Vencida`, `Finalizada` para `Reserva`. No alternar sin aclaración con estados como *Confirmada*, *Reservada* o *Cupo descontado*.
9. **Coherencia con TO-BE:** las actividades `Publicar viaje`, `Seleccionar viaje`, `Verificar cupo`, `Notificar que no hay cupos disponibles`, `Reservar cupos seleccionados y actualizar cupos`, `Rellenar y enviar datos de pago`, `Verificar realización del pago` y `Recibir lista de pasajeros y pasar lista` quedan cubiertas por las clases e historias vinculadas.
10. **Pendiente antes de entregar:** después de crear `09-casos-de-uso.md` y `10-diagramas-secuencia.md`, contrastar todos los IDs y reemplazar cualquier correspondencia propuesta que no coincida; actualizar esta matriz y las relaciones declaradas en los documentos de estado.
