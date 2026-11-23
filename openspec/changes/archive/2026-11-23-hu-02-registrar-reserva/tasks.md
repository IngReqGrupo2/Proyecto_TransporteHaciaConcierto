# Tasks 窶・HU-02 Registrar reserva y pasajero

## 1. Base de datos y datos de ejemplo

- [x] 1.1 Crear `src/db/migrations/004_crear_pasajero_asiento_reserva.sql` con las tablas `pasajero`, `asiento`, `reserva` e `integraciones_log`, la clave forﾃ｡nea compuesta `(id_viaje, id_asiento)`, el ﾃｭndice parcial de reserva vigente y los `CHECK` de estado y nﾃｺmero de asiento; verificar con `PRAGMA table_info` y con una prueba de migraciﾃｳn que las tablas, ﾃｭndices y restricciones existan.
- [x] 1.2 Completar la migraciﾃｳn con el backfill de asientos `1..capacidad` para los viajes existentes y el recﾃ｡lculo de `cupos_disponibles = capacidad - reservas vigentes`; verificar con una prueba que un viaje existente queda con sus asientos y con los cupos esperados.
- [x] 1.3 Actualizar `src/db/seed.ts` para generar los asientos de cada viaje y dejar `V-001` con 17 cupos y `V-002` en estado ﾂｫBorradorﾂｻ; verificar con `npm run db:seed` ejecutado dos veces que los conteos de viajes, vehﾃｭculos, asientos y reservas no cambian.
- [x] 1.4 Extender `ViajeRepositorio.crearViaje` para insertar los asientos `1..capacidad` dentro de la misma transacciﾃｳn del viaje; verificar con una prueba de repositorio que un viaje nuevo queda con la cantidad de asientos igual a su capacidad y que al fallar la creaciﾃｳn no quedan asientos parciales.

## 2. Dominio y Servicio de correo simulado

- [x] 2.1 Crear `src/dominio/reserva.ts` con los tipos `Pasajero`, `Asiento`, `Reserva`, la normalizaciﾃｳn de RUT y la validaciﾃｳn de los datos obligatorios; verificar con pruebas de que un pasajero sin campos obligatorios o un RUT vacﾃｭo se rechazan con un mensaje claro.
- [x] 2.2 Implementar `ReservaRepositorio.registrarReserva` de forma transaccional: buscar el viaje publicado con cupos, verificar el asiento del mismo viaje y sin reserva vigente, reutilizar o crear el pasajero por RUT, generar `R-00n`, calcular `vencimientoRetencion` (8 minutos) e insertar la reserva en ﾂｫPendiente de pagoﾂｻ descontando un cupo; verificar con pruebas de reserva exitosa, asiento ocupado, viaje sin cupos y pasajero reutilizado.
- [x] 2.3 Crear `src/integraciones/correo.ts` con la interfaz `ServicioCorreo` y `ServicioCorreoSimulado`, que registra la llamada en `integraciones_log` y devuelve ﾃｩxito; verificar con una prueba que la notificaciﾃｳn se registra una vez por reserva confirmada.

## 3. Rutas, pantallas y pruebas por escenario

- [x] 3.1 Crear `src/rutas/reservas.ts` con `GET /cartelera/:idViaje/reservar`, `POST /cartelera/:idViaje/reservar` y `GET /reservas/:codigoReserva`, registrarlo en `src/app.ts`, y crear las vistas del formulario, la confirmaciﾃｳn y el detalle de la reserva; verificar que el formulario responde 200 con los asientos libres, la creaciﾃｳn responde 201 y los errores responden 400 con su mensaje.
- [x] 3.2 Agregar el enlace ﾂｫReservar asientoﾂｻ en `src/vistas/detalle.ejs` cuando el viaje tenga cupos y mostrar en la confirmaciﾃｳn el cﾃｳdigo, el asiento y el estado ﾂｫPendiente de pagoﾂｻ; verificar que el enlace aparece y que la confirmaciﾃｳn muestra los datos.
- [x] 3.3 Implementar la prueba `HU-02 ﾂｷ Selecciﾃｳn de cupo disponible y confirmaciﾃｳn de reserva` y verificar que la reserva queda en ﾂｫPendiente de pagoﾂｻ, el asiento deja de estar disponible, el cupo disminuye y se registra la notificaciﾃｳn al Servicio de correo.
- [x] 3.4 Implementar la prueba `HU-02 ﾂｷ Selecciﾃｳn de cupo no disponible` y verificar que responde 400, muestra el mensaje de falta de cupos y no crea reserva ni modifica la disponibilidad.
- [x] 3.5 Implementar la prueba `HU-02 ﾂｷ Consultar estado de la reserva registrada` y verificar que la consulta por cﾃｳdigo muestra el viaje, el asiento y el estado ﾂｫPendiente de pagoﾂｻ.
- [x] 3.6 Implementar la prueba `HU-02 ﾂｷ Pasajero existente reutilizado` y verificar que dos reservas con el mismo RUT comparten el pasajero y que no se crea un duplicado.

## 4. Integraciﾃｳn y documentaciﾃｳn

- [x] 4.1 Ejecutar `npm test` y `npm run typecheck`; verificar que toda la suite pase sin errores.
- [x] 4.2 Actualizar `README.md` con las rutas de reserva y consulta, los datos de ejemplo, los campos obligatorios del pasajero, la retenciﾃｳn de 8 minutos, la simulaciﾃｳn del correo y la trazabilidad de HU-02; verificar que los comandos documentados funcionen tal como estﾃ｡n escritos.
- [x] 4.3 Arrancar con `npm run db:seed && npm run dev` y recorrer a mano la reserva de un asiento, el intento de reservar el mismo asiento y la consulta de la reserva por su cﾃｳdigo.

## Workflow follow-up

- Archivar el cambio despuﾃｩs de que el estudiante valide el sistema.

