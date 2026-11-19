# Design — HU-03 Crear un viaje en el sistema

## Context

La aplicación ya tiene la cartelera y el detalle de viajes de HU-01 (Express + EJS + SQLite). La fuente de este cambio es la ficha confirmada `.cin324/historias/HU-03.md`, el modelo de dominio (`08-modelo-dominio.md`), CU-04 (`09-casos-de-uso.md`) y la especificación `specs/creacion-viajes/spec.md`; la motivación está en `proposal.md`.

CU-04 no tiene diagrama de secuencia ni `Viaje` tiene diagrama de estado: el flujo se reconstruyó desde el Gherkin y la transición a «Publicado» es una decisión confirmada.

## Goals / Non-Goals

**Goals:**

- Registrar un viaje publicado con su evento y vehículo en una sola operación.
- Validar campos obligatorios, costo y capacidad máxima de 17 pasajeros.
- Reutilizar vehículos por patente y generar identificadores consecutivos.
- Exponer una pantalla de administración accesible con el rol de demostración «Administrador».

**Non-Goals:**

- Editar, despublicar o eliminar viajes.
- Reservas, pagos, pasajeros o asistencia.
- Autenticación real y permisos por rol.
- Cambiar la cartelera de HU-01 o los documentos del curso.
- Requisitos no funcionales RP-03, RP-09, RP-10 y RP-11.

## Decisions

1. **Migración con reconstrucción de `viaje`.** La tabla `vehiculo` se crea con `id_vehiculo`, `modelo`, `patente` única y `capacidad_pasajeros` restringida a `1..17`. Para que `viaje` tenga `id_vehiculo NOT NULL`, `conductor_asignado NOT NULL` y `asistente_asignado NOT NULL`, la migración `003` crea `viaje_nuevo`, copia los datos existentes asignando un vehículo por defecto (patente `LKPW42`) y cadenas vacías a conductor/asistente, elimina la tabla anterior y renombra la nueva. Se recrea el índice `idx_viaje_disponibles`. Alternativa descartada: agregar columnas nullable con `ALTER TABLE`, que dejaría el modelo menos fiel y permitiría viajes sin vehículo.

2. **Un vehículo por viaje mediante clave foránea.** El modelo declara `Vehiculo–Viaje 1..*–1..*`; la historia confirma un vehículo por viaje y se implementa con `viaje.id_vehiculo`. Se documenta como supuesto y no se modifica el diagrama. Alternativa descartada: tabla intermedia, que no aporta a esta historia.

3. **Evento propio por viaje.** La asociación `Evento–Viaje 1–1` se mantiene con `id_evento UNIQUE`. Cada creación inserta un `Evento` nuevo con el nombre y la fecha del evento; no se reutilizan eventos existentes.

4. **Capacidad y cupos derivados del vehículo.** El formulario no pide capacidad. Para un vehículo nuevo se usa capacidad 17. Si la patente ya existe, se usa la capacidad registrada. El viaje se crea con `cupos_disponibles = capacidad` y ambas columnas se validan con `CHECK` (capacidad entre 1 y 17; cupos entre 0 y capacidad). Si una capacidad supera 17, el repositorio rechaza la operación con un error de validación. Alternativa descartada: capacidad editable, que permitiría contradecir RP-03.

5. **Repositorio `ViajeRepositorio.crearViaje` transaccional.** Recibe los datos del formulario, valida y ejecuta en una transacción: inserta el evento, normaliza la patente (mayúsculas, sin espacios ni guiones), valida su formato chileno, busca el vehículo por patente o lo inserta, calcula el siguiente identificador y registra el viaje con estado «Publicado». Si algo falla, no queda ningún registro parcial. La búsqueda del siguiente identificador lee los `id_viaje` con formato `V-<número>` y usa el máximo + 1, con relleno a tres dígitos.

6. **Rutas derivadas de CU-04 y del Gherkin** (CU-04 no tiene DSS):
   - `GET /admin/viajes/nuevo` → formulario de creación con el rol de demostración «Administrador».
   - `POST /admin/viajes` → valida y crea; en éxito responde 201 con la confirmación y los datos del viaje; en error responde 400 con el formulario y los mensajes, conservando lo ingresado.
   La cartelera no cambia: el viaje aparece por su estado «Publicado» y sus cupos.

7. **Validación en el servidor.** Los campos obligatorios se validan sin confiar solo en los atributos HTML. Los mensajes propuestos son:
   - Campos faltantes: «Completa los campos obligatorios: …».
   - Costo inválido: «El costo debe ser un monto mayor que cero.».
   - Patente inválida: «La patente debe tener el formato chileno actual: cuatro letras y dos dígitos (AABB11).».
   - Capacidad: «La capacidad del vehículo no puede superar los 17 pasajeros.».
   - Patente duplicada con otro modelo: se reutiliza el vehículo registrado; no se actualiza su modelo.
   La patente se valida con la expresión `^[A-Z]{4}[0-9]{2}$` después de convertirla a mayúsculas y quitar espacios y guiones; se rechaza el formato antiguo de dos letras y cuatro dígitos. Los datos de ejemplo usan patentes como `LKPW42` y `BJYR68`.

8. **Rol de demostración.** No se agrega autenticación. El encabezado recibe el rol desde `res.locals` (por defecto «Pasajero») y las rutas de administración lo fijan en «Administrador». Se agrega un enlace visible «Crear viaje» para poder recorrer el flujo en la demo.

9. **Pruebas por escenario y de repositorio.** Una prueba de integración por cada escenario de la especificación, nombrada `HU-03 · <escenario>`, con base en memoria. Se agregan pruebas del repositorio para la transacción, la reutilización de vehículo, la generación del identificador y el rechazo de capacidad mayor que 17.

## Risks / Trade-offs

- **Migración con tabla existente** → La reconstrucción asigna el vehículo por defecto a los viajes de ejemplo; el `seed` actualizado vuelve a cargar los datos completos. En desarrollo se puede borrar `data/app.db` y ejecutar `npm run seed`.
- **Desviación de la multiplicidad del modelo** → Se documenta el supuesto de un vehículo por viaje; si una historia futura requiere varios vehículos, se agrega la tabla intermedia.
- **Sin DSS ni EST para CU-04/Viaje** → El flujo y la transición a «Publicado» se derivan de la ficha confirmada y quedan registrados como supuestos.
- **Identificadores consecutivos** → El cálculo por máximo + 1 es suficiente para una aplicación de un solo proceso; no se diseña para concurrencia alta.
- **Sin edición de viajes** → Un error de digitación requerirá una historia posterior de ajuste; está fuera del alcance de HU-03.

## Migration Plan

1. `003_crear_vehiculo_y_asignaciones.sql` crea `vehiculo`, reconstruye `viaje` y recrea el índice.
2. `src/db/seed.ts` se actualiza para insertar vehículos y completar los viajes de ejemplo con vehículo, conductor y asistente.
3. Al arrancar, las migraciones pendientes se aplican en orden y se registran en `schema_migrations`.
4. Retroceso en desarrollo: borrar `data/app.db` y ejecutar `npm run db:seed`; no hay datos productivos.
5. Las historias siguientes agregan migraciones nuevas sin reescribir las anteriores.
