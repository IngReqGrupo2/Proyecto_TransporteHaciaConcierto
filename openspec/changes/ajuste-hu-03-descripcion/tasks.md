# Tasks — Ajuste HU-03: registrar y mostrar una descripción opcional del viaje

## 1. Datos y migración

- [x] 1.1 Crear `src/db/migrations/005_agregar_descripcion_viaje.sql` con `ALTER TABLE viaje ADD COLUMN descripcion TEXT;` y verificar que una base nueva creada con `crearBaseDePrueba()` tiene la columna `descripcion` en `viaje`.
- [x] 1.2 Agregar `descripcion` a `ViajeEjemplo`, a la sentencia `INSERT ... ON CONFLICT` y a los viajes `V-001`, `V-002` y `V-003` de `src/db/seed.ts`; verificar con `npm run db:seed` y una consulta a `viaje` que las tres descripciones quedan guardadas.

## 2. Dominio y persistencia

- [x] 2.1 Agregar `descripcion: string | null` a `Viaje`, `descripcion: string` a `DatosNuevoViaje` y el recorte con `trim()` en `normalizarDatosNuevoViaje`; verificar con `npm run typecheck` que los tipos son coherentes.
- [x] 2.2 Excluir `descripcion` de los campos obligatorios con `type CampoObligatorio = Exclude<keyof DatosNuevoViaje, 'descripcion'>` y tipar `ETIQUETAS`/`CAMPOS_OBLIGATORIOS` con ese tipo; verificar que un envío sin descripción no produce un error de campo faltante.
- [x] 2.3 Incluir `v.descripcion AS descripcion` en `COLUMNAS_VIAJE` y agregar la columna al `INSERT` de `crearViaje`, convirtiendo una cadena vacía en `NULL`; verificar con una prueba del repositorio que el valor se guarda y se devuelve.
- [x] 2.4 Agregar en `tests/crear-viaje.test.ts` una prueba del repositorio para la descripción con espacios recortados y para la descripción vacía convertida en `null`; verificar que pasa con `npm test`.

## 3. Ruta y formulario

- [x] 3.1 Agregar `descripcion: ''` a `VALORES_VACIOS` y `descripcion: valor('descripcion')` a `extraerValores` en `src/rutas/admin-viajes.ts`; verificar con `npm run typecheck` y con un envío HTTP que el valor llega al repositorio.
- [x] 3.2 Agregar un `<textarea name="descripcion">` opcional en el fieldset «Traslado» de `src/vistas/admin/viaje-nuevo.ejs`, sin `required`, con el valor escapado y el mismo tratamiento de errores por campo; verificar a mano que el formulario se envía con y sin descripción.

## 4. Pruebas de los escenarios

- [x] 4.1 Agregar en `tests/admin-viajes.test.ts` la prueba `HU-03 · Descripción ingresada al crear el viaje`: envío con descripción, respuesta 201 y valor guardado en `viaje.descripcion`; verificar que pasa.
- [x] 4.2 Agregar en `tests/admin-viajes.test.ts` la prueba `HU-03 · Descripción vacía al crear el viaje`: envío sin descripción y con solo espacios, respuesta 201 y `viaje.descripcion` en `NULL`; verificar que pasa.
- [x] 4.3 Agregar `descripcion` a los ayudantes `datos()` de `tests/admin-viajes.test.ts` y `tests/crear-viaje.test.ts`; verificar con `npm run typecheck` y `npm test` que la suite completa sigue pasando.

## 5. Documentación y verificación final

- [x] 5.1 Actualizar `README.md` con el campo opcional «Descripción» en la creación de viajes y con su efecto en la persistencia; verificar que los comandos documentados (`npm run db:seed`, `npm run dev`, `npm test`) siguen siendo correctos.
- [x] 5.2 Ejecutar `npm test` y `npm run typecheck`; verificar que toda la suite y el chequeo de tipos pasan sin errores.

## 6. Visualización de la descripción en cartelera y detalle

- [x] 6.1 Mostrar la descripción en `src/vistas/cartelera.ejs` dentro de cada tarjeta de viaje cuando `viaje.descripcion` no sea null ni vacía.
- [x] 6.2 Mostrar la descripción en `src/vistas/detalle.ejs` cuando `viaje.descripcion` no sea null ni vacía.
- [x] 6.3 Agregar pruebas en `tests/cartelera.test.ts` para los tres escenarios de visualización (cartelera con descripción, detalle con descripción y visualización sin restricción de rol) y verificar que no se muestre cuando el viaje no tenga descripción.
- [x] 6.4 Actualizar `README.md` para documentar la visualización de la descripción en cartelera y detalle, y verificar con `npm test` y `npm run typecheck`.

## Workflow follow-up

- Revisar las especificaciones con el estudiante y obtener su confirmación antes de implementar.
- Implementar con la skill `openspec-apply-change`, validar el sistema con `cin324-validar-sistema`, archivar el cambio y actualizar `.cin324/proyecto.md`.
