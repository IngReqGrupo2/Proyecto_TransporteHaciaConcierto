# Tasks

## 1. Dominio: nombres y orden de fechas

- [x] 1.1 En `src/dominio/viaje.ts`, agregar la exigencia de al menos una letra (`/[a-záéíóúüñ]/i`) para `conductor` y `asistente`, después de las validaciones de fecha, con los mensajes `El nombre del conductor debe contener al menos una letra.` y `El nombre del asistente debe contener al menos una letra.`; verificar que las pruebas del repositorio pasan.
- [x] 1.2 En `crearViaje`, rechazar con `ErrorValidacion(['fechaViaje'], 'La fecha del viaje no puede ser posterior a la fecha del evento.')` cuando `fechaViaje` sea posterior a `eventoFecha`, comparando las cadenas `AAAA-MM-DD` ya validadas; verificar con una prueba del repositorio que el mismo día sí se acepta.
- [x] 1.3 Agregar pruebas del repositorio en `tests/crear-viaje.test.ts`: conductor y asistente solo numéricos rechazados con su campo, fecha posterior rechazada y mismo día aceptada; verificar además que en los rechazos no se insertan filas en `evento`, `vehiculo` ni `viaje`.

## 2. Mensaje y marcado por campo en el formulario

- [x] 2.1 En `src/rutas/admin-viajes.ts`, construir `errores` a partir de `error.campos` y `error.message` y pasarlo a la vista `admin/viaje-nuevo` junto con `error`; verificar que las pruebas HTTP existentes siguen respondiendo 400 con el mensaje general.
- [x] 2.2 En `src/vistas/admin/viaje-nuevo.ejs`, marcar cada `<input>` con `campo-invalido` y `aria-invalid="true"` cuando su campo tenga error, y renderizar `<span class="mensaje-campo" role="alert">` con el mensaje bajo el campo; verificar que un envío con patente `AB1234` muestra el mensaje junto al campo de la patente.
- [x] 2.3 En `public/estilos.css`, agregar estilos para `.campo-invalido` y `.mensaje-campo`; verificar a mano que el campo inválido se distingue visualmente sin romper el diseño del formulario.

## 3. Pruebas de los escenarios Gherkin

- [x] 3.1 En `tests/admin-viajes.test.ts`, agregar la prueba `HU-03 · Nombre del conductor o del asistente inválido` recorriendo las dos filas del esquema (`conductor`/`12345`, `asistente`/`98765`) y comprobando el mensaje junto al campo y que el viaje no se crea; verificar que ambas filas pasan.
- [x] 3.2 En `tests/admin-viajes.test.ts`, agregar la prueba `HU-03 · Fecha del viaje posterior a la fecha del evento` (400, mensaje exacto, campo marcado) y la prueba `HU-03 · Fecha del viaje el mismo día del evento` (201 y viaje publicado); verificar que ambas pasan.
- [x] 3.3 En `tests/admin-viajes.test.ts`, agregar la prueba `HU-03 · Campos faltantes señalados en el formulario` comprobando que cada campo faltante aparece marcado; verificar que pasa y que el escenario «Faltan campos» existente sigue pasando.

## 4. Documentación y cierre

- [x] 4.1 Actualizar `README.md` con el comportamiento nuevo (nombre con al menos una letra, fecha del viaje no posterior a la del evento, error junto al campo) y verificar que los comandos de instalación, ejecución y pruebas documentados funcionan.
- [x] 4.2 Ejecutar `npm test` y `npx tsc --noEmit`; verificar que toda la suite y el chequeo de tipos pasan sin errores.

## Workflow follow-up

- Archivar el cambio con la skill `openspec-archive-change` cuando el estudiante valide el sistema.
- Actualizar `.cin324/proyecto.md` con el cambio `ajuste-hu-03-validaciones` y la fecha.
