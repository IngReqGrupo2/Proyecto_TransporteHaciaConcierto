# Tasks

## 1. Modelo persistente y conservación de datos

- [x] 1.1 Crear `src/db/migrations/005_reserva_multiple.sql`: reconstruir Reserva con modalidad y lugar de regreso, crear DetalleReserva con claves compuestas al mismo viaje y agregar retención/asignación vigente a Asiento; verificar en `tests/migraciones.test.ts` columnas, CHECK, claves foráneas, composición y rechazo de detalles de otro viaje, sin reescribir 001–004.
- [x] 1.2 Migrar las reservas anteriores a un detalle por reserva conservando códigos, IDs, pasajeros, estados y vencimientos pendientes; agregar una prueba 004→005 con reservas pendientes, pagadas y vencidas, incluido un asiento con historial y asignación posterior; verificar `PRAGMA foreign_key_check` y que reaplicar migraciones no cambie los datos.
- [x] 1.3 Documentar en README la migración automática y conservación de reservas previas; comprobar que las instrucciones no exigen borrar `data/app.db` y que distinguen el nuevo esquema del anterior.

## 2. Retenciones, registro múltiple y vencimientos de dominio

- [x] 2.1 Actualizar los tipos de Asiento, Reserva, DetalleReserva y datos de entrada en `src/dominio/reserva.ts`, y la consulta por código para devolver todos los detalles; adaptar las pruebas de consulta del repositorio y verificar que una reserva histórica de un detalle y una múltiple exponen sus pasajeros y modalidad.
- [x] 2.2 Implementar `retenerAsiento` transaccional con cliente, viaje publicado, vencimiento desde selección y descuento único; agregar pruebas de dos clientes sobre el mismo asiento, selección propia repetida, viaje inexistente/no publicado y asiento ajeno; verificar plazo original y un único cupo descontado.
- [x] 2.3 Implementar la función central de transiciones de Reserva y el barrido de vencimientos con reloj inyectado: liberar retenciones sin reserva y vencer reservas completas al primer plazo; probar instante exacto, repetición del barrido, reserva Pagada, estado/evento inválido y reocupación posterior sin liberación por detalles históricos.
- [x] 2.4 Implementar registro transaccional de una reserva y sus detalles validando colección no vacía, IDs únicos, titularidad, vigencia, datos por pasajero y modalidad/lugar de regreso; adaptar `tests/reserva-repositorio.test.ts` y verificar rechazo completo sin nuevos pasajeros ni detalles, conservación de plazos/cupos y códigos consecutivos.
- [x] 2.5 Mantener normalización y reutilización por RUT, incluidos varios detalles con el mismo pasajero, y conservar lugar opcional cuando no hay ida y vuelta; verificar con pruebas del repositorio que no se duplican/sobrescriben pasajeros y que no se crea una reserva al reenviar una confirmación ya consumida.
- [x] 2.6 Actualizar `src/db/seed.ts` para que repetir el seed preserve retenciones y asignaciones y recalcule los cupos libres; probar en `tests/seed.test.ts` dos ejecuciones con retención vigente y reserva existente, además del caso de vencimiento; documentar en README el efecto idempotente sobre cupos.

## 3. Cliente de demostración, rutas, formularios y correo

- [x] 3.1 Incorporar cookie `clienteReserva`, extracción validada de formularios anidados y reloj opcional en `crearApp`; verificar con supertest dos agentes independientes, que un identificador de cliente enviado en el formulario no cambie la titularidad y que los cuerpos mal formados respondan con error de validación sin registros parciales ni 500.
- [x] 3.2 Agregar `POST /cartelera/:idViaje/retenciones` y adaptar GET/POST de reserva a la selección propia y datos por asiento; verificar redirección 303 al seleccionar, respuesta 201 al confirmar, 400 en errores y 404 para viaje inexistente/no publicado. Comprobar que se puede confirmar la selección propia aunque no queden cupos libres.
- [x] 3.3 Actualizar `reserva-nueva.ejs` y estilos con selección por asiento, vencimientos individuales, bloques de pasajeros, modalidad y lugar de regreso; verificar renderizado con dos asientos y conservación de datos/errores por campo sin reiniciar retenciones.
- [x] 3.4 Actualizar las vistas de confirmación y consulta con todos los detalles, código único, estado y modalidad, mostrando lugar de regreso cuando incluye ida y vuelta; verificar respuestas HTML de reservas múltiples, de un detalle, vencidas y códigos no encontrados.
- [x] 3.5 Adaptar ServicioCorreo y su implementación simulada para notificar por pasajero único con código y asientos; verificar en `integraciones_log` dos pasajeros/dos llamadas, un mismo pasajero en dos detalles/una llamada con sus asientos y cero llamadas para confirmaciones rechazadas.
- [x] 3.6 Documentar en README la nueva ruta y contratos de formularios, la cookie de cliente y el correo simulado; contrastar la tabla de rutas con las respuestas HTTP verificadas.

## 4. Integración por escenario Gherkin de HU-02

- [x] 4.1 Implementar `HU-02 · Retención de un asiento al seleccionarlo` en `tests/reservas.test.ts`: verificar vencimiento a 8 minutos desde selección, cupo descontado y bloqueo a un segundo agente antes de confirmar.
- [x] 4.2 Implementar `HU-02 · Confirmación de una reserva con uno o varios asientos`: cubrir uno y varios asientos seleccionados en instantes distintos; verificar una reserva/código, un detalle por pasajero/asiento, plazos intactos, ausencia de redescuento y notificaciones por pasajero.
- [x] 4.3 Implementar `HU-02 · Selección de cupo no disponible`: verificar el mensaje, rechazo de un asiento retenido por otro cliente o ya asignado y ausencia de cambios en cupos/retenciones ajenas.
- [x] 4.4 Implementar `HU-02 · Consultar una reserva registrada`: verificar que la consulta por código muestra viaje, todos los pasajeros/asientos, estado, modalidad y lugar de regreso cuando corresponde.
- [x] 4.5 Implementar `HU-02 · Rechazo de la operación por pérdida de disponibilidad`: hacer vencer un asiento de la selección original o cambiar su titularidad; verificar rechazo total sin pasajeros, reserva, detalles ni correos parciales, y sin renovación de otras retenciones.
- [x] 4.6 Implementar `HU-02 · Vencimiento de una reserva con varios asientos`: avanzar el reloj al primer vencimiento y verificar reserva Vencida, liberación de todos sus asientos, restitución de cupos una sola vez y estado actualizado en consulta/cartelera.
- [x] 4.7 Implementar `HU-02 · Registro del lugar de regreso`: verificar registro y consulta del lugar ingresado para una reserva de ida y vuelta con retenciones válidas.
- [x] 4.8 Implementar `HU-02 · Falta el lugar de regreso en una reserva de ida y vuelta`: verificar el mensaje junto al campo, respuesta 400, ausencia de registros parciales y retenciones originales sin reiniciar.
- [x] 4.9 Implementar `HU-02 · Reserva sin ida y vuelta`: verificar creación sin exigir lugar de regreso y modalidad correcta en la consulta; conservar cobertura previa de RUT, campos obligatorios, códigos en minúsculas y reserva inexistente adaptada al nuevo flujo.

## 5. Ciclo de ejecución y verificación integrada

- [x] 5.1 Integrar barrido al iniciar, antes de atender disponibilidad/reservas y en un temporizador de un segundo del servidor con cierre y `unref()`; verificar arranque con pendientes vencidas y, en una base temporal, liberación sin tráfico seguida de consulta consistente. No usar la base real del estudiante para pruebas.
- [x] 5.2 Ejecutar `npm test` y `npm run typecheck`; resolver fallos y verificar que pasan los nueve escenarios, migraciones, seed y regresiones de HU-01/HU-03, sin conservar expectativas obsoletas sobre un pasajero directo en Reserva.
- [x] 5.3 Recorrer en una base temporal selección de dos asientos, conflicto con otro navegador, confirmación con/sin regreso, consulta y vencimiento; registrar los resultados y actualizar `.cin324/proyecto.md` como ajuste implementado pendiente de validación del estudiante, sin marcar aceptación final.
- [x] 5.4 Consolidar el README con instalación, ejecución, pruebas y recorrido manual de los nueve escenarios, datos de V-001, migración, retenciones y simulación del correo; verificar los comandos documentados y que la guía explica que las pestañas comparten cliente y un perfil privado representa otro cliente.

## Workflow follow-up

- Presentar al estudiante el resultado y la guía para validar el sistema como cliente; recoger observaciones mediante `cin324-validar-sistema`.
- Tras aceptación explícita y sin observaciones pendientes, reconciliar la especificación histórica `hu-02-registrar-reserva` con la vigente antes de sincronizar/archivar, para no reinstalar reglas de un asiento por reserva.
- Archivar el ajuste mediante `openspec-archive-change` y actualizar el estado del proyecto.
