# Trazabilidad

## Criterios de construcción

La matriz de trazabilidad se elaboró tomando como referencia los requisitos de la Entrega 1 y los artefactos de especificación de la Entrega 2 publicados en el repositorio.

1. **Cobertura de requisitos:** se incluye una fila por cada requisito de producto (`RP-01` a `RP-14`) y una fila adicional para el requisito derivado (`RP-D01`). Los requisitos de proyecto (`RY-01` y `RY-02`) no se incluyen porque corresponden a plazo y alcance, no a funcionalidades trazadas en esta matriz.
2. **Vinculación con historias de usuario:** cada requisito se relaciona con la historia que expresa el objetivo de negocio correspondiente, usando los identificadores reales de `04-historias-usuario.md`. Las cinco historias (`HU-01` a `HU-05`) están cubiertas.
3. **Vinculación con casos de uso:** se respeta la numeración publicada en `09-casos-de-uso.md`: `CU-01` (Consultar cartelera), `CU-02` (Reservar asiento), `CU-03` (Pagar reserva), `CU-04` (Crear viaje) y `CU-05` (Ver listado de pasajeros).
4. **Vinculación con secuencias y estados:** se asigna `DSS-01` a la reserva y `DSS-02` al pago cuando el requisito participa de esos intercambios. `EST-01` se utiliza para transiciones del ciclo de vida de `Reserva` y `EST-02` para las de `Pago`; no se asocian diagramas de estado a clases que no tienen uno documentado.
5. **Vinculación con clases del dominio:** se emplean exclusivamente los nombres definidos en `08-modelo-dominio.md` (`Evento`, `Vehiculo`, `Administrador`, `Viaje`, `Pasajero`, `Reserva`, `Pago` y `RegistroAsistencia`). Se incluyen las clases que participan conceptualmente en cada requisito, sin añadir nuevas clases.
6. **Ausencias justificadas:** el símbolo `—` indica que no existe una secuencia o un diagrama de estado aplicable al requisito dentro de los artefactos entregados. Las razones se explican en **Observaciones**, sin inventar diagramas faltantes.
7. **Coherencia documental:** se priorizan las correspondencias que constan en los documentos de origen; las discrepancias entre ellos, como la referencia a `CU-05` en `DSS-02`, la responsabilidad de la nómina y la contabilización de cupos, se registran expresamente en lugar de ocultarlas.

## Matriz de trazabilidad

| Requisito (Entrega 1) | Historia | Caso de uso | Secuencia | Estado | Clases del dominio |
|---|---|---|---|---|---|
| [RP-01](./03-requisitos.md) | [HU-03](./04-historias-usuario.md#hu-03--crear-un-viaje-en-el-sistema) | CU-04 | — | — | `Administrador`, `Viaje`, `Evento`, `Vehiculo` |
| [RP-02](./03-requisitos.md) | [HU-01](./04-historias-usuario.md#hu-01--consultar-la-cartelera-de-viajes) | CU-01 | — | — | `Evento`, `Viaje` |
| [RP-03](./03-requisitos.md) | [HU-02](./04-historias-usuario.md#hu-02--registrar-reserva-y-pasajero) | CU-02 | DSS-01 | EST-01 | `Viaje`, `Reserva` |
| [RP-04](./03-requisitos.md) | [HU-02](./04-historias-usuario.md#hu-02--registrar-reserva-y-pasajero) | CU-02 | DSS-01 | — | `Viaje`, `Reserva` |
| [RP-05](./03-requisitos.md) | [HU-02](./04-historias-usuario.md#hu-02--registrar-reserva-y-pasajero) | CU-02 | DSS-01 | EST-01 | `Pasajero`, `Reserva`, `Viaje` |
| [RP-06](./03-requisitos.md) | [HU-05](./04-historias-usuario.md#hu-05--pagar-reserva) | CU-03 | DSS-02 | EST-01, EST-02 | `Reserva`, `Pago` |
| [RP-07](./03-requisitos.md) | [HU-04](./04-historias-usuario.md#hu-04--visualizar-pasajeros) | CU-05 | — | — | `Viaje`, `Reserva`, `Pasajero` |
| [RP-08](./03-requisitos.md) | [HU-04](./04-historias-usuario.md#hu-04--visualizar-pasajeros) | CU-05 | — | — | `Viaje`, `Reserva`, `Pasajero`, `RegistroAsistencia` |
| [RP-09](./03-requisitos.md) | [HU-01](./04-historias-usuario.md#hu-01--consultar-la-cartelera-de-viajes) | CU-01 | — | — | `Viaje`, `Evento` |
| [RP-10](./03-requisitos.md) | [HU-02](./04-historias-usuario.md#hu-02--registrar-reserva-y-pasajero) | CU-02 | DSS-01 | EST-01 | `Pasajero`, `Reserva`, `Viaje` |
| [RP-11](./03-requisitos.md) | [HU-02](./04-historias-usuario.md#hu-02--registrar-reserva-y-pasajero) | CU-02 | DSS-01 | EST-01 | `Viaje`, `Reserva` |
| [RP-12](./03-requisitos.md) | [HU-02](./04-historias-usuario.md#hu-02--registrar-reserva-y-pasajero) | CU-02 | DSS-01 | EST-01 | `Pasajero`, `Reserva`, `Viaje` |
| [RP-13](./03-requisitos.md) | [HU-05](./04-historias-usuario.md#hu-05--pagar-reserva) | CU-03 | DSS-02 | EST-01, EST-02 | `Reserva`, `Pago` |
| [RP-14](./03-requisitos.md) | [HU-04](./04-historias-usuario.md#hu-04--visualizar-pasajeros) | CU-05 | — | — | `Viaje`, `Reserva`, `Pasajero`, `RegistroAsistencia` |
| [RP-D01](./03-requisitos.md) | [HU-02](./04-historias-usuario.md#hu-02--registrar-reserva-y-pasajero) | CU-02 | DSS-01 | EST-01 | `Viaje`, `Reserva` |

## Observaciones

1. **Cobertura.** La matriz considera los 14 requisitos de producto (`RP-01` a `RP-14`) y el requisito derivado (`RP-D01`) de la Entrega 1. Incluye todas las historias de usuario (`HU-01` a `HU-05`). Los requisitos de proyecto `RY-01` y `RY-02` no se incluyen como filas porque la pauta solicita una fila por requisito `RP-xx`.
2. **Identificadores de casos de uso.** Se usa la numeración de `09-casos-de-uso.md`: `CU-01` (Consultar cartelera), `CU-02` (Reservar asiento), `CU-03` (Pagar reserva), `CU-04` (Crear viaje) y `CU-05` (Ver listado de pasajeros). Los casos de uso se enlazan a las historias correspondientes sin renumerarlos.
3. **Secuencias.** `DSS-01` detalla `HU-02` / `CU-02` e incluye la validación del asiento, su retención temporal, el registro del pasajero y la solicitud de notificación al servicio externo de correo. `DSS-02` representa `HU-05` / `CU-03` e incluye la respuesta de la pasarela de pago en los escenarios aprobado y rechazado/cancelado. En el documento `10-diagramas-secuencia-sistema.md`, `DSS-02` todavía declara `CU-05`: esa referencia debe cambiarse a `CU-03`; la matriz ya refleja la correspondencia correcta definida en `09-casos-de-uso.md`.
4. **Filas sin secuencia.** `RP-01`, `RP-02`, `RP-07`, `RP-08`, `RP-09` y `RP-14` carecen de DSS específico: las dos secuencias entregadas modelan únicamente la reserva con correo externo y el pago con pasarela externa. Esas actividades están cubiertas por sus historias, casos de uso y clases del dominio.
5. **Filas sin estado.** `RP-01`, `RP-02`, `RP-04`, `RP-07`, `RP-08`, `RP-09` y `RP-14` no se asocian directamente a una transición de los diagramas actuales: `EST-01` modela el ciclo de vida de `Reserva` y `EST-02` el de `Pago`. En particular, el rechazo inicial por falta de cupo (`RP-04`) ocurre antes de registrar una reserva, por lo que no genera una transición en `EST-01`. La generación de nóminas y el registro de asistencia no tienen diagramas de estado propios.
6. **Control de pasajeros.** `HU-04` y `CU-05` asignan la visualización de pasajeros al `Administrador`, pero `RP-08`, `RP-14` y la actividad TO-BE «Recibir lista de pasajeros y pasar lista» la asocian al asistente de viaje. La matriz enlaza estos artefactos por su objetivo compartido, pero el responsable de esta actividad debe unificarse en los documentos del equipo.
7. **Reservas y disponibilidad de cupos.** `DSS-01` retiene temporalmente un asiento y `DSS-02` confirma el pago. `EST-01` representa la reserva `Pendiente de pago`, `Pagada` o `Vencida`, y su liberación tras 8 minutos sin aprobación. Para cumplir `RP-03`, `RP-11` y `RP-D01`, una retención vigente debe impedir que otro pasajero ocupe el mismo cupo; al aprobarse el pago, la retención se vuelve definitiva sin descontar una segunda vez el cupo. La formulación «descuenta definitivamente» de `HU-05` y `DSS-02` debe interpretarse o aclararse con esta regla.
8. **Correspondencia entre mensajes y estados.** `DSS-01` origina la creación de la reserva pendiente de pago, representada en `EST-01` por `registrarReserva`; `DSS-02` comunica la aprobación, rechazo o cancelación del pago, representados por `pagoAprobado`, `pagoRechazado` y `pagoCancelado` en `EST-01`, y por `resultadoPasarela` / `cancelacionPago` en `EST-02`. `vencerRetencion` representa la expiración de los 8 minutos. Los mensajes descriptivos de los DSS y los eventos de estado usan distinto nivel de detalle, pero describen los mismos acontecimientos del negocio.
9. **Clases y alcance.** Las clases nombradas corresponden al modelo de dominio `MD-01`: `Evento`, `Vehiculo`, `Administrador`, `Viaje`, `Pasajero`, `Reserva`, `Pago` y `RegistroAsistencia`. `RegistroAsistencia` respalda la funcionalidad de `HU-04` aunque no cuenta con un diagrama de estados propio. Los requisitos no funcionales de uso en móviles (`RP-09` y `RP-10`) se vinculan a las mismas clases y casos de uso que las funcionalidades cuya interfaz condicionan; no constituyen por sí mismos estados del negocio.
10. **Aspectos a revisar en los artefactos originales.** `08-modelo-dominio.md` registra algunas multiplicidades UML incompletas (`0..`, `1..`) que deben corregirse en el diagrama y el texto. También es necesario conciliar las denominaciones de responsable de la nómina y el momento exacto en que se contabilizan los cupos retenidos o pagados. Esta matriz documenta las relaciones existentes, pero no sustituye esas correcciones en sus fuentes.
