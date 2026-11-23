# Propuesta — HU-05: Pagar reserva

## Why

Las reservas ya agrupan pasajeros y asientos, pero no existe un flujo de pago que permita confirmarlas. **HU-05 — Pagar reserva**, validada en `.cin324/historias/HU-05.md`, permite completar ese recorrido con una pasarela simulada y devolver automáticamente los pagos aprobados después del vencimiento.

## What Changes

- Incorporar **CU-03 — Pagar reserva**, con el **Pasajero** como actor principal y la **Pasarela de pago** como sistema externo simulado. Corresponde a **Pagar viaje**, equivalente a **Rellenar y enviar datos de pagos** (usuario) y **Verificar realización del pago** (servicio) del TO-BE; sustituye el cobro manual del AS-IS.
- Iniciar un intento y redirigir a la pasarela al registrar una reserva. Habilitar tarjeta de crédito o débito, con un pago total igual al costo del viaje por cantidad de asientos y sin recargo por ida y vuelta.
- Persistir intentos y resultados **Pendiente**, **Aprobado**, **Rechazado**, **Cancelado** y **Devuelto**, con su asociación a la reserva y el historial de reintentos.
- Confirmar la reserva completa y todos sus asientos solo si la aprobación llega con todas las retenciones vigentes; no descontar cupos nuevamente. Mantener los plazos originales tras rechazos, cancelaciones y reintentos.
- Conservar y comprobar los vencimientos por asiento al registrar la reserva. El código observado en `src/dominio/reserva.ts` actualmente los deja en `NULL`; corregir ese punto es un prerrequisito acotado del flujo de pago, no un cambio de regla de HU-02.
- Vencer toda reserva pendiente al primer vencimiento y devolver el monto completo de aprobaciones tardías, sin reactivar la reserva ni alterar asignaciones posteriores de los asientos.
- Coordinar aprobación y vencimiento mediante transacciones inmediatas de SQLite y cambios condicionados al estado Pendiente de pago. La decisión, el resultado del pago y los efectos sobre reserva, asientos y cupos se confirman de forma atómica: una reserva Pagada no puede pasar a Vencida ni una Vencida reactivarse como Pagada.
- Procesar cada aprobación de forma idempotente usando la referencia persistida del intento. Una clave estable y única de devolución por pago impide repetir la devolución simulada; repetir aprobaciones o confirmaciones, incluso concurrentemente o después de reiniciar, devuelve el estado guardado sin duplicar confirmaciones, solicitudes ni restituciones de cupos. Devuelto no retrocede a Aprobado.
- Mostrar resultado, monto, medio, intentos y situación de devolución en la consulta de la reserva. La simulación permitirá verificar por separado la aprobación tardía, la solicitud y la confirmación de devolución.
- **BREAKING — respuesta HTTP del registro:** `POST /cartelera/:idViaje/reservar` exitoso pasará de `201` con `reserva-creada` a `303` hacia la sesión de pasarela simulada. La reserva, sus pasajeros, su código y su consulta se conservan; las pruebas HTTP de HU-02 deben seguir la redirección. Es la conexión entre historias confirmada en la ficha.

### Fuente y diferencias documentales resueltas

Se usan los seis criterios de HU-05 en `04-historias-usuario.md` y los diez escenarios alineados de la ficha aprobada. Esta última registra las decisiones que completan el Gherkin publicado, el BPMN, DSS-02 y EST-02: reserva previa al pago, rechazo sin cancelación inmediata, varios asientos, reintentos y **Aprobado → Devuelto**. La alineación material de esos documentos del curso sigue pendiente de solicitud del estudiante.

El estudiante confirmó además el refuerzo de atomicidad e idempotencia de esta propuesta. Se agregan siete escenarios de concurrencia, rollback y mensajes duplicados, sin cambiar los diez escenarios de la ficha.

### Fuera de alcance

- HU-04, asistencia y nómina administrativa.
- Pasarela real, dinero real, transferencias, pago parcial y recargos adicionales.
- Devoluciones por motivos distintos de una aprobación tardía de una reserva vencida.
- Autenticación real, implementación independiente de requisitos no funcionales y nuevos envíos por correo por resultados de pago.
- Cambiar otras historias, reconstruir retenciones históricas sin vencimiento conocido o editar los artefactos del curso.

## Capabilities

### New Capabilities

- `pagos-reservas`: inicio y cálculo del pago total, medios habilitados, resultados de pasarela, confirmación completa de la reserva, reintentos con plazos originales y devolución completa por aprobación tardía.

### Modified Capabilities

Ninguna capacidad principal: `openspec list --specs` no contiene especificaciones publicadas. Los deltas aún sin archivar de `hu-02-registrar-reserva` y `ajuste-hu-02-reserva-multiple` documentan `registro-reservas`; se mantienen sus reglas de retención, reserva múltiple y consulta. Esta propuesta documenta expresamente la conexión HTTP nueva y la corrección de implementación sin duplicar esa capacidad.

## Impact

- **Persistencia:** nueva migración `006_crear_pago.sql`, posterior a las dos migraciones `005` ya existentes; tabla `pago`, clave única y registro de solicitudes de devolución, y mensajes simulados en `integraciones_log`. No se renombra ni reescribe una migración aplicada.
- **Dominio:** nuevo módulo `src/dominio/pago.ts`, coordinación con `ReservaRepositorio`, transición de aprobación con guardas y preservación de vencimientos al registrar la reserva.
- **Integración:** interfaz y adaptador `PasarelaPagoSimulada` en `src/integraciones/pasarela-pago.ts`, siguiendo el patrón del Servicio de correo; sin proveedor ni dependencias nuevas.
- **HTTP y vistas:** registro de reservas, rutas de pago y simulación, composición de `crearApp`, consulta de reserva y plantillas EJS de pasarela y resultado.
- **Verificación:** una prueba por cada uno de los diez escenarios de la ficha y los siete escenarios adicionales, parametrización de crédito/débito y rechazo/cancelación, dos conexiones a una SQLite temporal para competir entre aprobación y vencimiento en ambos órdenes, mensajes duplicados antes/después de reiniciar, rollback, migración aditiva y regresión de HU-01/02/03.
- **Uso:** datos de ejemplo con V-001 a $15.000 por asiento, instrucciones de simulación y actualización del README. Se preserva `data/app.db` y su historial al actualizar.
