# Design — HU-01 Consultar la cartelera de viajes

## Context

Primer cambio del proyecto: aún no existe código de aplicación. La fuente es la ficha confirmada `.cin324/historias/HU-01.md`, el modelo de dominio (`08-modelo-dominio.md`), CU-01 (`09-casos-de-uso.md`) y la especificación `specs/cartelera-viajes/spec.md`; la motivación está en `proposal.md`.

Esta historia no tiene diagrama de secuencia (CU-01) ni diagrama de estado de `Viaje`; el flujo se reconstruyó desde el Gherkin y el estado «Publicado» es un supuesto confirmado.

## Goals / Non-Goals

**Goals:**
- Dejar la base mínima de la aplicación web (TypeScript + Express + EJS + SQLite + Vitest).
- Implementar la cartelera y el detalle de viajes como consultas de solo lectura.
- Persistir `Evento` y `Viaje` con migraciones y datos de ejemplo.

**Non-Goals:**
- Reservas, pagos, creación/publicación de viajes o lista de pasajeros.
- Autenticación real; solo se identifica el rol de demostración «Pasajero».
- Mostrar vehículo, conductor o asistente.
- Requisitos no funcionales RP-09 y RP-11.

## Decisions

1. **Aplicación monolítica con renderizado en el servidor.** Express + EJS sirve HTML y formularios; se evita un SPA para mantener el alcance del taller. Alternativa descartada: frontend separado con API, que agrega complejidad sin necesidad para esta historia.

2. **Esquema derivado del modelo de dominio.** Se crean solo las tablas que esta historia usa:
   - `evento(id_evento INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT NOT NULL, fecha_evento DATE NOT NULL)`.
   - `viaje(id_viaje TEXT PRIMARY KEY, id_evento INTEGER NOT NULL UNIQUE REFERENCES evento(id_evento) ON DELETE RESTRICT, fecha_viaje DATE NOT NULL, hora_salida TIME NOT NULL, hora_regreso TIME NOT NULL, lugar_encuentro TEXT NOT NULL, costo REAL NOT NULL, capacidad INTEGER NOT NULL, cupos_disponibles INTEGER NOT NULL CHECK (cupos_disponibles >= 0), estado TEXT NOT NULL)`.
   - `Evento` no tiene identificador en el modelo; se agrega `id_evento` como clave subrogada de implementación. La asociación `Evento 1 – 1 Viaje` se representa con `UNIQUE` en `viaje.id_evento`.
   - `id_viaje` se mantiene como texto, tal como lo define el modelo (`idViaje: Texto`).

3. **Estado del viaje como texto.** No existe EST-01 para `Viaje`; se usa el valor «Publicado» como supuesto confirmado y el repositorio filtra por ese valor. No se restringe con `CHECK` para no inventar estados que definirá HU-03; esa historia agregará la migración correspondiente si hace falta.

4. **Consultas de solo lectura.** El repositorio expone `listarDisponibles()` (estado «Publicado» y `cupos_disponibles > 0`, ordenado por `fecha_viaje`, `hora_salida`) y `buscarPublicadoPorId(idViaje)`. El detalle solo es accesible para viajes publicados, incluso si tienen 0 cupos.

5. **Rutas derivadas de CU-01 y del Gherkin** (CU-01 no tiene DSS):
   - `GET /` → redirige a `/cartelera`.
   - `GET /cartelera` → lista de viajes disponibles o mensaje «No hay viajes disponibles».
   - `GET /cartelera/:idViaje` → detalle del viaje y cupos disponibles; 404 si no existe o no está publicado.

6. **Fábrica de aplicación para pruebas.** `src/app.ts` crea la app Express recibiendo la conexión SQLite, sin escuchar el puerto; `src/server.ts` arranca el servidor real. Las pruebas usan una base `:memory:` con las migraciones aplicadas.

7. **Fechas y horas con tipos `DATE` y `TIME`.** Las columnas de fecha se declaran `DATE` y las de hora `TIME`, según lo solicitado. SQLite las almacena como texto en formato ISO (`YYYY-MM-DD` y `HH:MM`) y se muestran tal cual; en TypeScript se manejan como cadenas ISO, sin conversiones de zona horaria. El costo se muestra con formato local y símbolo `$`; la moneda no está definida en los requisitos.

8. **Rol de demostración.** El layout muestra «Rol de demostración: Pasajero»; no hay autenticación. Las pantallas de administración se agregarán en sus historias.

9. **Datos de ejemplo idempotentes.** El `seed` inserta tres eventos y tres viajes: uno publicado con cupos, uno publicado con 0 cupos y uno no publicado, para evidenciar el filtrado; cada viaje referencia su propio evento para respetar la asociación 1–1. Se ejecuta con `npm run db:seed`.

10. **Pruebas por escenario y casos adicionales.** Vitest + supertest con una prueba por cada escenario Gherkin y por cada escenario adicional de la especificación, nombradas `HU-01 · <escenario>`, preparando los datos en la base en memoria. Se agregan pruebas de borde: exclusión de viajes publicados sin cupos, exclusión de viajes no publicados, detalle de viaje inexistente (404), detalle de viaje no publicado (404) y detalle de viaje publicado con 0 cupos.

## Risks / Trade-offs

- **Valores de `estado` no modelados** → Se usa «Publicado» como supuesto; si HU-03 define otros estados, se agrega una migración y se ajusta el filtro.
- **`better-sqlite3` requiere módulo nativo** → Si falla en Node 26, usar Node 20/22 LTS o evaluar `node:sqlite` con aprobación del estudiante.
- **Sin DSS para CU-01** → El flujo y las rutas se derivan del Gherkin y del caso de uso; no hay integraciones externas que simular.
- **Fechas como texto** → Suficiente para mostrar la cartelera; si una historia futura necesita cálculos de fecha, se normalizará en esa historia.

## Migration Plan

1. `001_crear_evento.sql` crea `evento`.
2. `002_crear_viaje.sql` crea `viaje` con su clave foránea.
3. Al arrancar, se aplican en orden las migraciones pendientes y se registran en `schema_migrations`.
4. En desarrollo, el retroceso consiste en borrar `data/app.db` y volver a ejecutar el `seed`; no hay datos productivos.
5. Las historias siguientes agregan migraciones nuevas sin reescribir las anteriores.
