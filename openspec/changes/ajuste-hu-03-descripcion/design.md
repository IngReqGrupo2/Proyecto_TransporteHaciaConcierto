# Design — Ajuste HU-03: registrar una descripción opcional del viaje

## Context

Ver `proposal.md`. La tabla `viaje` se crea en `src/db/migrations/002_crear_viaje.sql` y se reconstruye en `003_crear_vehiculo_y_asignaciones.sql`; ninguna de las dos tiene una columna para la descripción. `ViajeRepositorio.crearViaje` (`src/dominio/viaje.ts`) normaliza los datos, valida los campos obligatorios a partir de `ETIQUETAS`, inserta el viaje dentro de una transacción y devuelve el registro mediante `COLUMNAS_VIAJE`. El formulario (`src/vistas/admin/viaje-nuevo.ejs`) envía los campos a `src/rutas/admin-viajes.ts`, que los extrae y los pasa al repositorio. El modelo de dominio ya define `descripcion: Texto` como atributo opcional de `Viaje`.

## Goals / Non-Goals

**Goals:**

- Agregar la columna `descripcion` a `viaje` sin reescribir las migraciones existentes.
- Capturar la descripción en el formulario de creación y guardarla con el viaje cuando se ingrese.
- Aceptar la creación cuando la descripción esté vacía o solo tenga espacios.
- Cubrir los dos escenarios de la especificación con pruebas automáticas y actualizar los datos de ejemplo.

**Non-Goals:**

- Mostrar la descripción en la cartelera o en el detalle del viaje.
- Editar, despublicar o listar viajes por descripción.
- Cambiar las validaciones existentes, el estado «Publicado», la capacidad o los cupos.
- Implementar autenticación real o integraciones externas.

## Decisions

1. **Migración nueva y columna nullable.** Se agrega `src/db/migrations/005_agregar_descripcion_viaje.sql` con `ALTER TABLE viaje ADD COLUMN descripcion TEXT;`. Las migraciones anteriores no se modifican porque ya pudieron aplicarse en bases existentes y el sistema las registra en `schema_migrations`. Alternativa descartada: editar `003_crear_vehiculo_y_asignaciones.sql`, que no actualizaría las bases ya creadas.

2. **La ausencia de descripción se representa con `NULL`.** En el dominio, `Viaje.descripcion` es `string | null` y `DatosNuevoViaje.descripcion` es `string`. En `normalizarDatosNuevoViaje` se aplica `trim()`; al insertar, una cadena vacía se convierte en `null`. Alternativa descartada: guardar `''`, que no distingue entre «sin descripción» y «descripción vacía» y complica las consultas.

3. **La descripción queda fuera de los campos obligatorios.** Se define `type CampoObligatorio = Exclude<keyof DatosNuevoViaje, 'descripcion'>`; `ETIQUETAS` se tipa como `Record<CampoObligatorio, string>` y `CAMPOS_OBLIGATORIOS` se deriva de sus claves. Así el compilador impide que `descripcion` se exija por accidente. Alternativa descartada: filtrar la clave en tiempo de ejecución, que deja abierta la posibilidad de un error de tipado.

4. **Persistencia y lectura en el repositorio.** `COLUMNAS_VIAJE` incluye `v.descripcion AS descripcion`; el `INSERT` de `crearViaje` agrega la columna y el valor normalizado. `ViajeConEvento` hereda el atributo de `Viaje`. La cartelera y el detalle no se modifican: seguirán mostrando solo los datos que ya usan.

5. **Campo opcional en el formulario.** En el fieldset «Traslado» se agrega un `<textarea name="descripcion">` sin `required`, con el valor escapado y el mismo tratamiento de errores por campo que los demás controles. `VALORES_VACIOS` y `extraerValores` en `src/rutas/admin-viajes.ts` incorporan `descripcion` para conservar lo ingresado cuando otra validación falle.

6. **Datos de ejemplo con descripción.** Se agrega `descripcion` a `ViajeEjemplo`, a la sentencia `INSERT ... ON CONFLICT` del seed y a los tres viajes de ejemplo. El seed es idempotente: al ejecutarlo sobre una base existente actualiza las descripciones de `V-001`, `V-002` y `V-003`.

7. **Pruebas por escenario.** Se agregan pruebas HTTP en `tests/admin-viajes.test.ts` para «Descripción ingresada al crear el viaje» y «Descripción vacía al crear el viaje», comprobando la respuesta 201 y el valor guardado en `viaje.descripcion`. En `tests/crear-viaje.test.ts` se agrega una prueba del repositorio para el recorte de espacios y la conversión a `null`. Los ayudantes `datos()` de ambas pruebas incluyen `descripcion` para satisfacer el tipo `DatosNuevoViaje`.

8. **Sin integraciones externas.** Este ajuste no llama a ningún sistema externo; no se agregan adaptadores ni simulaciones.

## Risks / Trade-offs

- **Migración sobre bases existentes** → `ALTER TABLE ... ADD COLUMN` con una columna nullable es compatible con SQLite y no requiere reconstruir la tabla; la migración se aplica automáticamente al abrir la base.
- **Viajes existentes sin descripción** → Quedan con `NULL`, lo que es válido porque el atributo es opcional; el seed actualiza los datos de ejemplo.
- **Pruebas tipadas** → El ayudante `datos()` de `tests/crear-viaje.test.ts` debe incluir `descripcion`; el compilador lo exige y evita que la suite quede desactualizada.
- **Campo opcional mal marcado** → Si se agregara `required` al `<textarea>`, el navegador bloquearía envíos válidos; la tarea de la vista lo verifica explícitamente.

## Migration Plan

1. Aplicar `005_agregar_descripcion_viaje.sql` al abrir la base (el mecanismo existente de `aplicarMigraciones` la ejecuta una sola vez).
2. Ejecutar `npm run db:seed` para cargar las descripciones de los viajes de ejemplo.
3. Reversión: restaurar la base desde un respaldo o eliminar la columna con `ALTER TABLE viaje DROP COLUMN descripcion`; no hay datos obligatorios que dependan de ella.
