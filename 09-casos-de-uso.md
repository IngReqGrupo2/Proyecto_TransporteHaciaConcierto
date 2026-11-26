# Casos de uso

## Actores
| Actor | Tipo (humano / sistema externo) | Descripción |
|-------|----------------------------------|-------------|
| Pasajero | Humano | Consulta los viajes disponibles y realiza una reserva para asistir a un concierto. |
| Administrador | Humano | Persona encargada de crear y publicar viajes y gestionar la información de sus pasajeros. |
| Gerente | Humano | Revisa y aprueba o rechaza los viajes que utilizan megabús antes de su publicación en la cartelera. |
| Pasarela de pago | Sistema externo | Servicio que procesa los pagos en línea realizados por los pasajeros. |
| Servicio de correo | Sistema externo | Servicio que envía al pasajero la confirmación de su reserva. |

## Diagrama de casos de uso
![Casos de uso](diagramas/casos-de-uso.png)

Archivo fuente: [`./diagramas/casos-de-uso.drawio`](./diagramas/casos-de-uso.drawio)

## Casos de uso y su origen
| ID | Caso de uso (objetivo del actor) | Actor principal | Historia de origen |
|----|-----------------------------------|-----------------|---------------------|
| <a id="cu-01"></a>CU-01 | Consultar cartelera de viajes | Pasajero | [HU-01](./04-historias-usuario.md#hu-01-consultar-la-cartelera-de-viajes) |
| <a id="cu-02"></a>CU-02 | Reservar asiento | Pasajero | [HU-02](./04-historias-usuario.md#hu-02-registrar-reserva-y-pasajero) |
| <a id="cu-03"></a>CU-03 | Pagar reserva | Pasajero | [HU-05](./04-historias-usuario.md#hu-05-pagar-reserva) |
| <a id="cu-04"></a>CU-04 | Crear viaje | Administrador | [HU-03](./04-historias-usuario.md#hu-03-crear-un-viaje-en-el-sistema) |
| <a id="cu-05"></a>CU-05 | Ver listado de pasajeros de un viaje | Administrador | [HU-04](./04-historias-usuario.md#hu-04-visualizar-pasajeros) |
| <a id="cu-06"></a>CU-06 | Aprobar o rechazar viaje con megabús | Gerente | [HU-06](./04-historias-usuario.md#hu-06--aprobar-o-rechazar-un-viaje-con-megabús) |
| <a id="cu-07"></a>CU-07 | Ver estado de aprobación de un viaje | Administrador | [HU-03](./04-historias-usuario.md#hu-03-crear-un-viaje-en-el-sistema) |

> Nota: el diagrama de casos de uso usa las etiquetas abreviadas «Aprobar viajes con Megabuses» y «Ver estado de un viaje». En esta tabla se mantienen los nombres precisos de los casos de uso; el diagrama se alineará cuando se actualice su archivo fuente.
