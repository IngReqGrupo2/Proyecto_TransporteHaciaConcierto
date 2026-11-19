# Tasks — HU-03 Crear un viaje en el sistema

## 1. Base de datos y datos de ejemplo

- [x] 1.1 Crear `src/db/migrations/003_crear_vehiculo_y_asignaciones.sql` con la tabla `vehiculo`, el vehículo por defecto con patente chilena `LKPW42`, la reconstrucción de `viaje` (vehículo, conductor, asistente, restricciones de capacidad) y el índice `idx_viaje_disponibles`; verificar que las pruebas de migraciones pasen y que `PRAGMA table_info` muestre las columnas nuevas.
- [x] 1.2 Actualizar `src/db/seed.ts` con vehículos de ejemplo con patentes chilenas realistas (`LKPW42`, `BJYR68`) y los datos de vehículo, conductor y asistente de cada viaje; verificar con `npm run db:seed` ejecutado dos veces que los conteos no cambian.

## 2. Dominio y repositorio

- [x] 2.1 Extender los tipos de `src/dominio/viaje.ts` con `Vehiculo` y los nuevos atributos de `Viaje`, e implementar `crearViaje()` transaccional (evento, vehículo, viaje publicado); verificar con una prueba de repositorio que se crean las tres entidades y que no quedan registros parciales si falla la validación.
- [x] 2.2 Implementar la reutilización de vehículo por patente, la capacidad máxima de 17 y la generación de `V-00n` consecutivo; verificar con pruebas de repositorio de vehículo reutilizado, capacidad rechazada y siguiente identificador.

## 3. Rutas, pantallas y pruebas por escenario

- [x] 3.1 Crear `src/rutas/admin-viajes.ts` con `GET /admin/viajes/nuevo` y `POST /admin/viajes`, registrar las rutas en `src/app.ts` y validar los campos obligatorios, el costo, el formato chileno de la patente y la capacidad; verificar con pruebas que el formulario responde 200, la creación responde 201 y los errores responden 400.
- [x] 3.2 Crear las vistas `admin/viaje-nuevo.ejs` y `admin/viaje-creado.ejs`, agregar el enlace «Crear viaje» y mostrar el rol de demostración «Administrador»; verificar que las páginas rendericen los campos y los mensajes de error.
- [x] 3.3 Implementar la prueba `HU-03 · Creación exitosa de un viaje` y verificar que el viaje creado aparece en la cartelera con estado «Publicado» y 17 cupos disponibles.
- [x] 3.4 Implementar la prueba `HU-03 · Faltan campos para crear el viaje` y verificar que responde 400, muestra los campos faltantes y no registra evento, vehículo ni viaje.
- [x] 3.5 Agregar pruebas de los escenarios adicionales: patente válida, patente inválida, costo inválido, viaje con capacidad 17, vehículo de menor capacidad, vehículo que supera 17, vehículo reutilizado por patente e identificador consecutivo; verificar que todas pasen.

## 4. Integración y documentación

- [x] 4.1 Ejecutar `npm test` y `npm run typecheck`; verificar que toda la suite pase sin errores.
- [x] 4.2 Actualizar `README.md` con la ruta de creación de viajes, los datos de ejemplo de vehículos, los mensajes de validación y la trazabilidad de HU-03; verificar que los comandos documentados funcionen tal como están escritos.
- [x] 4.3 Arrancar con `npm run db:seed && npm run dev` y recorrer a mano el formulario, la creación, el error por campos faltantes y la aparición del viaje en la cartelera.

## Workflow follow-up

- Archivar el cambio después de que el estudiante valide el sistema.
