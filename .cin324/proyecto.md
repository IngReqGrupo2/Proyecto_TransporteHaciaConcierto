# Estado del proyecto — generación de la aplicación

## Proyecto
- Nombre: Transporte hacia Concierto
- Repositorio de documentación: esta carpeta
- Última auditoría: 2026-11-19 — resultado: sin bloqueantes, con supuestos

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
- 2026-11-19, validación de HU-02 confirmada por el estudiante:
  - Una reserva equivale a un asiento y a un pasajero; varios cupos implican varias reservas (el TO-BE no se modifica).
  - La retención del asiento ocurre al seleccionarlo (DSS-01); los «datos» del Gherkin son los datos del pasajero y los datos de pago pertenecen a HU-05 (DSS-02).
  - El pasajero se identifica por RUT: si existe se reutiliza; todos los campos de `Pasajero` son obligatorios.
  - `codigoReserva` lo genera el sistema y `vencimientoRetencion = fechaRegistro + 8 minutos`.
  - La reserva se crea en estado «Pendiente de pago»; el Servicio de correo se simula.
  - Ficha confirmada: `.cin324/historias/HU-02.md`.
- 2026-11-22, revalidación de HU-01 confirmada por el estudiante:
  - Se muestran la `capacidad` y los `cuposDisponibles` en la cartelera y en el detalle del viaje.
  - No se agrega al Gherkin un escenario de viaje inexistente o no publicado porque la historia no ofrece filtrado de viajes.
  - La implementación actual muestra solo `cuposDisponibles`; queda pendiente el ajuste para mostrar también `capacidad`.
  - Ficha confirmada: `.cin324/historias/HU-01.md`.

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
| HU-01 | validada; pendiente de ajuste (mostrar capacidad) | `hu-01-consultar-cartelera` | 2026-11-22 | Consultar cartelera (CU-01). Revalidada: mostrar `capacidad` y `cuposDisponibles`. Implementación actual muestra solo cupos. Ficha `.cin324/historias/HU-01.md` |
| HU-02 | generada, pendiente de validación | `hu-02-registrar-reserva` | 2026-11-19 | Registrar reserva y pasajero (CU-02, DSS-01, EST-01). Una reserva = un asiento = un pasajero. 66 pruebas pasan. Ficha `.cin324/historias/HU-02.md` |
| HU-03 | generada; ajuste de fechas implementado, pendiente de validación | `hu-03-crear-viaje`, `ajuste-hu-03-fechas` | 2026-11-18 | Crear viaje (CU-04). Patente solo formato actual `AABB11`. Ajuste OBS-1: fechas reales del calendario, no anteriores a hoy y máximo 31/12/(año+100). 43 pruebas pasan. Ficha `.cin324/historias/HU-03.md` |
| HU-04 | pendiente | — | — | Visualizar pasajeros (CU-05) |
| HU-05 | pendiente | — | — | Pagar reserva (CU-03, DSS-02, EST-01/02) |

## Validaciones
| Historia | Informe | Estado | Fecha |
|----------|---------|--------|-------|
| HU-01 | `.cin324/historias/HU-01.md` | confirmada (revalidación) | 2026-11-22 |
| HU-02 | `.cin324/historias/HU-02.md` | confirmada (validación directa) | 2026-11-19 |

## Cambios posteriores
| Cambio | Historia afectada | Motivo | Fecha |
|--------|-------------------|--------|-------|
| `ajuste-hu-03-fechas` | HU-03 | OBS-1 de `VAL-HU-03-1.md`: rechazar fechas inexistentes, pasadas o posteriores a 100 años | 2026-11-18 |
