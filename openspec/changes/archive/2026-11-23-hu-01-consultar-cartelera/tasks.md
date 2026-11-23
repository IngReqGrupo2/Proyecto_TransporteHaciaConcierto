# Tasks — HU-01 Consultar la cartelera de viajes

## 1. Preparar el proyecto

- [x] 1.1 Crear `package.json` con dependencias (express, ejs, better-sqlite3), dependencias de desarrollo (typescript, tsx, vitest, supertest, @types/*), scripts `dev`, `test`, `db:seed` y `typecheck`, y `tsconfig.json` en modo estricto; verificar con `npm install` y `npm run typecheck`.
- [x] 1.2 Crear la estructura base `src/app.ts`, `src/server.ts`, `src/db/`, `src/rutas/`, `src/vistas/`, `tests/` y `.gitignore` para `data/*.db` y `node_modules`; verificar que `npm run dev` levante el servidor en http://localhost:3000 y que `npm test` ejecute Vitest.

## 2. Base de datos y datos de ejemplo

- [x] 2.1 Crear las migraciones `001_crear_evento.sql` y `002_crear_viaje.sql` (fechas `DATE`, horas `TIME`) y el ejecutor de migraciones con `schema_migrations` según `design.md`; verificar que al arrancar se creen las tablas, que `PRAGMA table_info` muestre los tipos `DATE`/`TIME` y que una segunda ejecución no reaplique migraciones.
- [x] 2.2 Crear el `seed` idempotente con tres eventos y tres viajes (publicado con cupos, publicado con 0 cupos, no publicado); verificar ejecutando `npm run db:seed` dos veces que los conteos no cambian.

## 3. Dominio y repositorio de viajes

- [x] 3.1 Definir los tipos `Evento` y `Viaje` (fechas como cadena ISO) y el repositorio con `listarDisponibles()` y `buscarPublicadoPorId(idViaje)`; verificar con pruebas que se listen solo viajes publicados con `cuposDisponibles > 0`, que se excluyan los publicados con 0 cupos y los no publicados, y que el detalle de un publicado con 0 cupos se encuentre.
- [x] 3.2 Crear `src/app.ts` como fábrica de aplicación que recibe la conexión SQLite, registra las rutas y las vistas EJS; verificar con una prueba de humo de supertest que `GET /cartelera` responde 200 usando una base en memoria.

## 4. Pantallas de cartelera y detalle

- [x] 4.1 Implementar `GET /` → redirección a `/cartelera` y `GET /cartelera` con la lista de viajes disponibles y el mensaje «No hay viajes disponibles» cuando corresponda; verificar con las pruebas `HU-01 · Existen viajes disponibles`, `HU-01 · No hay viajes disponibles`, `HU-01 · Viaje publicado sin cupos`, `HU-01 · Viaje no publicado` y una prueba de la redirección de `/`.
- [x] 4.2 Implementar `GET /cartelera/:idViaje` con el detalle, la cantidad de cupos disponibles y respuesta 404 para viajes inexistentes o no publicados; verificar con las pruebas `HU-01 · Verificar disponibilidad de un viaje`, `HU-01 · Detalle de un viaje inexistente`, `HU-01 · Detalle de un viaje no publicado` y una prueba de detalle de viaje publicado con 0 cupos.
- [x] 4.3 Crear el layout con «Rol de demostración: Pasajero» y las vistas `cartelera.ejs` y `detalle.ejs` con evento, fecha, horas, lugar de encuentro, costo y cupos; verificar que las pruebas de escenario pasen y que las páginas rendericen los datos del seed.

## 5. Integración y documentación

- [x] 5.1 Ejecutar la suite completa (`npm test`) y el chequeo de tipos (`npm run typecheck`); verificar que todo pase sin errores.
- [x] 5.2 Arrancar con `npm run db:seed && npm run dev` y recorrer a mano `/cartelera` y `/cartelera/:idViaje`; verificar la lista, el mensaje sin viajes y el detalle con cupos.
- [x] 5.3 Actualizar `README.md` con instalación, datos de ejemplo, ejecución, rutas y pruebas; verificar que los comandos documentados funcionen tal como están escritos.

## Workflow follow-up

- Archivar el cambio después de que el estudiante valide el sistema.
