# Estado del proyecto — generación de la aplicación

## Proyecto
- Nombre: Transporte hacia Concierto
- Repositorio de documentación: esta carpeta
- Última auditoría: 2026-11-22 — revisión focalizada de los artefactos modificados de HU-02 (commit `8bb3d96`); sin bloqueantes para el ajuste. Informe confirmado por el estudiante.

## Mapa de artefactos (rutas detectadas)
| Artefacto | Ruta(s) | Estado |
|-----------|---------|--------|
| BPMN AS-IS | `01-proceso-as-is.md`, `diagramas/as-is.bpmn`, `diagramas/as-is.png` | completo |
| BPMN TO-BE | `02-rediseno-to-be.md`, `diagramas/to-be.bpmn`, `diagramas/to-be.png` | completo |
| Historias de usuario | `04-historias-usuario.md` (HU-01 a HU-05) | completo |
| Criterios Gherkin | `07-criterios-aceptacion.md` | completo |
| Modelo de dominio | `08-modelo-dominio.md`, `diagramas/modelo-dominio.puml`. `.png` | completo |
| Casos de uso | `09-casos-de-uso.md`, `diagramas/casos-de-uso.drawio`, `.png` | completo |
| Diagramas de estado | `11-diagramas-estado.md`, `diagramas/est-01.puml`, `est-02.puml` | completo |
| Diagramas de secuencia | `10-diagramas-secuencia.md`, `diagramas/dss-01.mmd`, `dss-02.mmd` | completo |
| Requisitos y atributos de calidad | `03-requisitos.md`, `06-atributos-calidad.md` | completo |

## Supuestos acordados (por elementos faltantes o dudosos)
- 2026-11-14, confirmado por el estudiante:
  - Las actividades TO-BE «Generar lista digital de pasajeros y pasar lista» (HU-04) y «Pagar viaje» (HU-05) se consideran equivalentes a «Recibir lista de pasajeros y pasar lista» y «Rellenar y enviar datos de pago / Verificar realización del pago», respectivamente.
  - Pasar lista es una actividad manual; el sistema solo registra la asistencia y la confirmación de abordaje del administrador.
  - El asistente de viaje no forma parte del sistema: el administrador concentra la gestión de nómina y registro de abordaje (RP-08 no se implementa como rol aparte).
  - El servicio de correo y la pasarela de pago se simulan como sistemas externos (interfaz + implementación simulada).
  - Se corrigió `12-trazabilidad.md`: se eliminó la referencia obsoleta a `CU-05` en `DSS-02`.
- 2026-11-16, confirmado por el estudiante (auditoría de seguimiento):
  - «Asiento» y «cupo» son conceptos diferentes pero relacionados. *(Superado el 2026-11-18: se agregó la entidad `Asiento` al modelo de dominio.)*
  - Se mantienen los supuestos del 2026-11-14 sobre las actividades de HU-04 y HU-05.
  - El asistente de viaje sigue sin ser un rol del sistema.
  - La multiplicidad `Evento–Viaje` se mantiene como `1–1`.
  - `Viaje` se crea directamente en estado «Publicado» (HU-03).
  - La capacidad máxima de un viaje es 17 pasajeros, porque los vehículos disponibles tienen esa capacidad.
  - El repositorio ya tiene HU-01 implementada; la documentación del curso no cambió desde el 2026-11-14.
- 2026-11-17, a pedido del estudiante (HU-03):
  - La patente del vehículo usa solo el formato chileno actual: cuatro letras y dos dígitos (`AABB11`); se rechaza el formato antiguo (`AB1234`).
- 2026-11-18, confirmado por el estudiante (auditoría de seguimiento):
  - La reserva incluye un asiento físico y consume exactamente un cupo. Se agregó la entidad `Asiento` (`numero`) al modelo con `Viaje 1–1..17 Asiento` y `Reserva 1–1 Asiento`.
  - Se corrigió la inconsistencia de responsable de nómina: `RP-08` y `RP-14` ahora asignan la consulta al administrador, igual que HU-04/CU-05. El asistente de viaje no es un rol del sistema.
  - La relación `Vehiculo`–`Viaje` se mantiene como ya está implementada; no se modifica.
  - El control de acceso y roles no se modela en el dominio; queda como supuesto de implementación.
  - Capacidad máxima de pasajeros/asientos por viaje: 17.
  - Fuente de verdad de historias y criterios: `04-historias-usuario.md` y `07-criterios-aceptacion.md`.
  - `cambios_pendientes_main.md` se ignora: es una lista histórica cuyos puntos ya fueron resueltos.
- 2026-11-19, a pedido del estudiante (ajuste del modelo de dominio):
  - El diagrama se actualizó a `Vehiculo 1–0..* Viaje`, `Viaje *-- 1..* Asiento` (composición, «contiene») y `Asiento 1–0..* Reserva` («se asigna en»). Se alineó `08-modelo-dominio.md`.
  - Un asiento puede acumular reservas históricas, pero solo una vigente a la vez, y debe pertenecer al mismo viaje de la reserva.
  - La capacidad máxima de asientos por viaje sigue siendo 17.
- 2026-11-19, validación histórica de HU-02 (reglas de agrupación, vencimiento y alcance de expiración superadas por la revisión del 2026-11-22):
  - Una reserva equivale a un asiento y a un pasajero; varios cupos implican varias reservas (el TO-BE no se modifica).
  - La retención del asiento ocurre al seleccionarlo (DSS-01); los «datos» del Gherkin son los datos del pasajero y los datos de pago pertenecen a HU-05 (DSS-02).
  - El pasajero se identifica por RUT: si existe se reutiliza; todos los campos de `Pasajero` son obligatorios.
  - `codigoReserva` lo genera el sistema y `vencimientoRetencion = fechaRegistro + 8 minutos`.
  - La reserva se crea en estado «Pendiente de pago»; el Servicio de correo se simula.
  - Ficha confirmada: `.cin324/historias/HU-02.md`.
- 2026-11-22, revisión de HU-02 confirmada por el estudiante (informe y cinco puntos de validación):
  - Fuente de verdad vigente: `04-historias-usuario.md`, `07-criterios-aceptacion.md`, modelo de dominio actualizado, DSS-01 y EST-01; cambios documentados en el commit `8bb3d96`.
  - Una reserva agrupa uno o varios asientos del mismo viaje con un único código y un `DetalleReserva` por asiento y pasajero.
  - La retención se registra en `Asiento`, dura 8 minutos desde su selección y consume un cupo. Confirmar la reserva no reinicia plazos ni vuelve a descontar cupos.
  - HU-02 incluye liberar retenciones vencidas sin reserva y vencer toda reserva pendiente cuando vence cualquiera de sus asientos, restituyendo todos sus cupos.
  - Se registra `idaYVuelta` y se exige `lugarRegreso` únicamente si incluye ida y vuelta.
  - Se mantienen los datos obligatorios del pasajero, su identificación por RUT y el Servicio de correo simulado con una notificación por pasajero.
  - Ficha y especificaciones confirmadas; implementación de `ajuste-hu-02-reserva-multiple` autorizada explícitamente por el estudiante y completada. Verificación: 89 pruebas y tipos correctos; recorrido HTTP con dos clientes en SQLite temporal en memoria. Aceptación del sistema confirmada sin observaciones el 2026-11-22 (`.cin324/validaciones/VAL-HU-02-1.md`).
- 2026-11-22, revalidación de HU-01 confirmada por el estudiante:
  - Se muestran la `capacidad` y los `cuposDisponibles` en la cartelera y en el detalle del viaje.
  - No se agrega al Gherkin un escenario de viaje inexistente o no publicado porque la historia no ofrece filtrado de viajes.
  - La implementación ya muestra `capacidad` y `cuposDisponibles`; el ajuste se validó en el sistema sin observaciones el 2026-11-22 (`.cin324/validaciones/VAL-HU-01-2.md`).
  - Ficha confirmada: `.cin324/historias/HU-01.md`.
- 2026-11-22, validación de HU-03 confirmada por el estudiante:
  - Se confirmaron la actividad TO-BE, CU-04, las entidades, la transición a «Publicado» y el flujo de interacción.
  - `descripcion` es un campo opcional de `Viaje`: se alineó `08-modelo-dominio.md` con el `.puml`; no se modifica la historia ni el Gherkin por este campo (decisión 4B). La implementación ya lo captura y lo muestra en la cartelera y el detalle; se validó en el sistema sin observaciones el 2026-11-22 (`.cin324/validaciones/VAL-HU-03-3.md`).
  - Se actualizaron los mensajes de fecha del Gherkin de HU-03 al texto preciso de la implementación (decisión 3A).
  - Las validaciones de patente, costo y capacidad quedan registradas en la ficha como decisiones, sin cambios en `CA1` ni en el Gherkin (decisión 4B).
  - Ficha confirmada: `.cin324/historias/HU-03.md`.

- 2026-11-22, validación de HU-05 confirmada por el estudiante:
  - Se confirmaron los cinco puntos de validación y la ficha completa: `.cin324/historias/HU-05.md`.
  - CU-03 con Pasajero y Pasarela de pago simulada; medios habilitados: crédito y débito.
  - Un pago por el total de la reserva: costo del viaje por cantidad de asientos, sin recargo por ida y vuelta. Se permiten reintentos tras rechazo o cancelación mientras todas las retenciones originales sigan vigentes, conservando el historial.
  - Aprobar dentro del plazo confirma todos los asientos sin descontar cupos nuevamente. Rechazo o cancelación no reinician plazos ni cancelan inmediatamente la reserva; vence toda la reserva pendiente al vencer cualquiera de sus asientos.
  - La aprobación tardía registra el pago aprobado y solicita devolución completa, manteniendo la reserva vencida sin recuperar asientos. El pago permanece Aprobado hasta que la pasarela confirme la devolución y pase a Devuelto.
  - Se aceptó usar las reglas vigentes de la historia y las decisiones de la ficha ante las diferencias documentales. La alineación de Gherkin, DSS-02 y EST-02 se incorporó el 2026-11-23; solo el BPMN TO-BE permanece sin alinear por decisión del estudiante.
  - Cambio implementado: `hu-05-pagar-reserva`. La aprobación y el vencimiento se coordinan mediante transacciones SQLite; repetir aprobaciones o devoluciones no duplica sus efectos. El estudiante confirmó la aceptación y el cambio se archivó; la spec principal `pagos-reservas` se sincronizó el 2026-11-23. Revalidado en el sistema sin observaciones el 2026-11-22 (`.cin324/validaciones/VAL-HU-05-1.md`).
- 2026-11-23, a pedido del estudiante (alineación documental de HU-05):
  - Se alineó `DSS-02` (`diagramas/dss-02.mmd` y `10-diagramas-secuencia.md`) con las decisiones C9/C10 de la ficha HU-05: retenciones por asiento, aprobación tardía, solicitud y confirmación de devolución (`Pago → Devuelto`), reintento e impedimento de pago de una reserva vencida.
  - Se reemplazaron en `07-criterios-aceptacion.md` los tres escenarios de HU-05 por los diez escenarios alineados de la ficha.
  - Se agregó `Aprobado → Devuelto` en `11-diagramas-estado.md` y `diagramas/est-02.puml`.
  - Se actualizó `12-trazabilidad.md` para reflejar la devolución.
  - `diagramas/dss-02.png` y `diagramas/est-02.png` regenerados desde sus fuentes; HU-05 revalidada y ajuste documental archivado en OpenSpec como `2026-11-23-ajuste-hu-05-dss-devolucion`. Se incorporó la spec principal `pagos-reservas` a `openspec/specs/`; el BPMN TO-BE se mantiene sin cambios por decisión del estudiante.

## Stack (se define una sola vez)
- Lenguaje y framework: TypeScript + Express + EJS
- Base de datos: SQLite con `better-sqlite3` — archivo `data/app.db`
- Pruebas: Vitest + supertest
- Cómo instalar: `npm install`
- Cómo ejecutar: `npm run db:seed && npm run dev` — URL: http://localhost:3000
- Cómo probar: `npm test`

## Historias
| Historia | Estado | Cambio de OpenSpec | Fecha | Observaciones |
|----------|--------|--------------------|-------|----------------|
| HU-01 | implementada, validada y archivada | `hu-01-consultar-cartelera`; `ajuste-hu-01-mostrar-capacidad` (vigente) | 2026-11-22 | Consultar cartelera (CU-01). Revalidada: mostrar `capacidad` y `cuposDisponibles`; implementado y aceptado sin observaciones (`.cin324/validaciones/VAL-HU-01-2.md`). Ficha `.cin324/historias/HU-01.md` |
| HU-02 | implementada, validada y archivada | `hu-02-registrar-reserva` (versión anterior); `ajuste-hu-02-reserva-multiple` (vigente) | 2026-11-22 | Reserva múltiple, retenciones desde selección, vencimiento completo y modalidad de regreso. Nueve escenarios vigentes cubiertos; 89 pruebas y tipos correctos. Migración conserva reservas anteriores. Aceptación del sistema confirmada sin observaciones (`.cin324/validaciones/VAL-HU-02-1.md`). Verificación `.cin324/validaciones/VER-HU-02-implementacion.md`; guía en README. |
| HU-03 | implementada, validada y archivada | `hu-03-crear-viaje`, `ajuste-hu-03-fechas`, `ajuste-hu-03-validaciones`, `ajuste-hu-03-descripcion` | 2026-11-22 | Crear viaje (CU-04). Patente solo formato actual `AABB11`. Fechas, validaciones y `descripcion` opcional implementadas y aceptadas sin observaciones (`.cin324/validaciones/VAL-HU-03-3.md`). Ficha `.cin324/historias/HU-03.md` |
| HU-04 | pendiente | — | — | Visualizar pasajeros (CU-05) |
| HU-05 | implementada, revalidada y archivada | [`hu-05-pagar-reserva`](../openspec/changes/archive/2026-11-22-hu-05-pagar-reserva/) | 2026-11-22 | Pagar reserva (CU-03, DSS-02, EST-01/02). Pasarela simulada, reintentos, devolución por aprobación tardía y pruebas de concurrencia e idempotencia. 140 pruebas correctas y chequeo de tipos aprobado. Revalidada sin observaciones (`.cin324/validaciones/VAL-HU-05-1.md`). Spec `pagos-reservas` incorporada a `openspec/specs/`. |
| HU-06 | implementada; pendiente de validación del estudiante | [`hu-06-aprobar-viaje-megabus`](../openspec/changes/hu-06-aprobar-viaje-megabus/) | 2026-11-25 | CU-06, DSS-03, EST-03. Capacidad por tipo: 17 o 45; migración conserva los viajes históricos. 149 pruebas y comprobación de tipos correctas. [Ficha confirmada](historias/HU-06.md). |

## Validaciones
| Historia | Informe | Estado | Fecha |
|----------|---------|--------|-------|
| HU-01 | `.cin324/historias/HU-01.md` | confirmada (revalidación) | 2026-11-22 |
| HU-01 | `.cin324/validaciones/VAL-HU-01-2.md` | validada sin observaciones; ajuste archivado el 2026-11-23 | 2026-11-22 |
| HU-02 | `.cin324/historias/HU-02.md` | ficha y especificaciones confirmadas; implementación autorizada; no equivale a aceptación del sistema | 2026-11-22 |
| HU-02 | `.cin324/validaciones/VER-HU-02-implementacion.md` | verificación técnica correcta; aceptación del sistema confirmada | 2026-11-22 |
| HU-02 | `.cin324/validaciones/VAL-HU-02-1.md` | validada sin observaciones; cambio archivado el 2026-11-23 | 2026-11-22 |
| HU-03 | `.cin324/historias/HU-03.md` | confirmada | 2026-11-22 |
| HU-03 | `.cin324/validaciones/VAL-HU-03-3.md` | validada sin observaciones; ajustes archivados el 2026-11-23 | 2026-11-22 |
| HU-05 | `.cin324/historias/HU-05.md` | cinco puntos y ficha completa confirmados | 2026-11-22 |
| HU-05 | `.cin324/validaciones/VER-HU-05-implementacion.md` | verificación técnica correcta; aceptación confirmada por el estudiante | 2026-11-22 |
| HU-05 | `.cin324/validaciones/VAL-HU-05-1.md` | revalidada sin observaciones; alineación documental completada el 2026-11-23; queda solo el BPMN TO-BE por decisión del estudiante | 2026-11-22 |
| HU-06 | `.cin324/historias/HU-06.md` | ficha confirmada por el estudiante | 2026-11-25 |


## Cambios posteriores
| Cambio | Historia afectada | Motivo | Fecha |
|--------|-------------------|--------|-------|
| `ajuste-hu-03-fechas` | HU-03 | OBS-1 de `VAL-HU-03-1.md`: rechazar fechas inexistentes, pasadas o posteriores a 100 años | 2026-11-18 |
| `ajuste-hu-02-reserva-multiple` | HU-02 | Artefactos actualizados en `8bb3d96`: reserva con varios detalles, retención por selección, vencimiento completo y lugar de regreso. Implementado, verificado y aceptado por el estudiante; archivado el 2026-11-23. | 2026-11-22 |
| `ajuste-hu-01-mostrar-capacidad` | HU-01 | Revalidación: mostrar `capacidad` junto con `cuposDisponibles` en la cartelera y el detalle. Implementado y aceptado sin observaciones; archivado el 2026-11-23. | 2026-11-22 |
| `ajuste-hu-03-validaciones` | HU-03 | Validaciones de patente, costo y capacidad según la ficha. Implementado y aceptado sin observaciones; archivado el 2026-11-23. | 2026-11-22 |
| `ajuste-hu-03-descripcion` | HU-03 | `descripcion` opcional de `Viaje`, guardada y visible en la cartelera y el detalle. Implementado y aceptado sin observaciones; archivado el 2026-11-23. | 2026-11-22 |
| `ajuste-hu-05-dss-devolucion` (documental) | HU-05 | Alineación de DSS-02, Gherkin de HU-05, EST-02 y trazabilidad con las decisiones C9/C10 de la ficha. PNG regenerados; cambio OpenSpec archivado como `2026-11-23-ajuste-hu-05-dss-devolucion`; 140 pruebas correctas y typecheck sin errores (`VER-HU-05-ajuste-dss-devolucion.md`). | 2026-11-23 |
