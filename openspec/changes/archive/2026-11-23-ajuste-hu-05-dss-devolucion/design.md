# Design — Ajuste documental de HU-05

## Context

La implementación de HU-05 ya existe y está verificada en el cambio archivado `hu-05-pagar-reserva` (135 pruebas y chequeo de tipos reportados en `.cin324/validaciones/VER-HU-05-implementacion.md`). El código relevante es `src/dominio/pago.ts`, `src/rutas/pagos.ts`, `src/integraciones/pasarela-pago.ts` y la migración `src/db/migrations/006_crear_pago.sql`.

El desfase estaba solo en los documentos del curso: el Gherkin publicado, DSS-02 y EST-02 no describían la devolución ni la aprobación tardía que el sistema ya procesa. Ver `proposal.md - Why`. No hay cambio de comportamiento, por lo que este diseño no propone código nuevo; describe cómo quedan concordantes los artefactos y cómo se verifica esa concordancia.

## Goals / Non-Goals

**Goals:**

- Dejar `07`, `10`/`dss-02.mmd`, `11`/`est-02.puml` y `12` concordantes entre sí y con la ficha HU-05 confirmada.
- Reflejar en los diagramas el comportamiento ya implementado: retenciones por asiento, pago total, aprobación vigente, aprobación tardía, solicitud y confirmación de devolución, rechazo/cancelación, reintento e impedimento de pago vencido.
- Verificar que la implementación existente sigue satisfaciendo los diez escenarios sin modificarla.

**Non-Goals:**

- Cambiar el BPMN TO-BE (decisión del estudiante).
- Tocar código, migraciones, rutas, vistas o pruebas de la aplicación.
- Publicar o reescribir el delta de `pagos-reservas` (ya está en el cambio archivado).

## Decisions

**1. Marcar `skip_specs: true` en lugar de crear un delta de requisitos.**
El comportamiento no cambia: ya está especificado en el delta archivado de `pagos-reservas` e implementado. Crear un delta duplicaría requisitos o sugeriría un cambio funcional inexistente. Alternativa descartada: re-declarar `pagos-reservas` para publicarlo en `openspec/specs/`; el estudiante ya eligió archivar `hu-05-pagar-reserva` sin sincronizar la especificación principal.

**2. Modelar `Aprobado` con dos salidas mutuamente excluyentes en EST-02.**
- `Aprobado → Final` con guarda «reserva Pagada y sin devolución solicitada».
- `Aprobado → Devuelto` con guarda «reserva Vencida y devolución completa confirmada».
- `Aprobado → Aprobado` con `solicitarDevolucion` (mantiene el pago Aprobado mientras se espera).
Como una reserva no puede estar Pagada y Vencida a la vez, las salidas nunca se habilitan juntas; no se agrega un estado «Devolución pendiente». Alternativa descartada: dejar `Aprobado` como terminal, que impediría representar la devolución de CA5/CA6.

**3. Completar DSS-02 sin cambiar los actores.**
Se mantienen `Pasajero`, `Sistema` y `Pasarela de pago (externa)`; la pasarela es el único sistema externo de la historia y se simula con `PasarelaPagoSimulada` (interfaz + adaptador), ya existente. Se agregan los mensajes de solicitud y confirmación de devolución dentro de la rama de aprobación tardía.

### Concordancia Gherkin ↔ DSS-02 ↔ EST-02

| Escenario Gherkin (`07`) | Rama DSS-02 (`10`/`dss-02.mmd`) | Estado (`11`/`est-02.puml`) |
|---|---|---|
| Redirección a pasarela | Verificación inicial + redirección | `Pendiente` creado |
| Monto total de la reserva | Cálculo `costo × asientos` | — |
| Pago exitoso | `alt` aprobado con retenciones vigentes | `Pendiente → Aprobado`; `Aprobado → Final` (reserva Pagada) |
| Pago fallido o cancelado | `alt` rechazo/cancelación | `Pendiente → Rechazado / Cancelado` |
| Reintento dentro del plazo original | `opt` reintento | Nuevo `Pendiente` |
| Vencimiento de una reserva pendiente | `par` seguimiento de retenciones | Reserva `Pendiente de pago → Vencida` (EST-01) |
| Impedir un nuevo intento de pago de una reserva vencida | `alt` reserva vencida al iniciar | Sin transición de `Pago` |
| Pago aprobado después del vencimiento | `alt` aprobación tardía + solicitud de devolución | `Pendiente → Aprobado` + `solicitarDevolucion` |
| Devolución solicitada aún no confirmada | `Note` mientras el pago sigue Aprobado | `Aprobado` (sin cambio) |
| Devolución completa confirmada | `opt` confirmación de devolución | `Aprobado → Devuelto → Final` |

**4. Integraciones externas simuladas.** La Pasarela de pago se simula mediante `PasarelaPago`/`PasarelaPagoSimulada`: acepta crédito o débito, comunica aprobación, rechazo o cancelación, registra la solicitud de devolución y confirma la devolución completa. No participa el Servicio de correo en HU-05.

## Risks / Trade-offs

- **Imagen desalineada con la fuente** → regenerar `diagramas/est-02.png` desde `est-02.puml`; `dss-02.png` ya fue regenerado por el estudiante. Verificar visualmente antes de cerrar.
- **Diferencia con el BPMN TO-BE (C1/S8)** → se mantiene registrada como pendiente acordada; no se toca por decisión del estudiante.
- **Duplicación conceptual con el delta archivado** → tratada como no-goal: este cambio no publica specs y se limita a documentación.
- **Pruebas existentes dependientes de mensajes** → los textos alineados usan los mensajes ya implementados («El pago no fue completado», «Devuelto»); si alguna prueba espera otro texto, se detecta al ejecutar `npm test`.
