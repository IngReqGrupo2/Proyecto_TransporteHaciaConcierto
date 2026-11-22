# Proposal — Ajuste HU-03: registrar una descripción opcional del viaje

## Why

El modelo de dominio incorporó `descripcion` como atributo de `Viaje` (`08-modelo-dominio.md` y `diagramas/modelo-dominio.puml`), y la validación de HU-03 confirmó que el administrador debe poder ingresarla de forma opcional al crear el viaje. La aplicación actual no la captura ni la guarda, por lo que falta un dato que el modelo ya contempla. Es un ajuste sobre HU-03 ya generada, no una historia nueva.

## What Changes

- Se agrega el campo opcional «Descripción» al formulario de creación de viaje. No es obligatorio: si queda vacío, la creación sigue siendo válida.
- El sistema guarda la descripción en `Viaje.descripcion` cuando el administrador la ingresa y la deja vacía cuando no.
- Se agrega la columna `descripcion` a la tabla `viaje` mediante una migración nueva, sin modificar las migraciones anteriores.
- Se actualizan los datos de ejemplo con descripciones para los viajes existentes.
- Se agregan pruebas para la descripción ingresada y para la descripción vacía.
- No cambian los campos obligatorios, las validaciones existentes, el estado «Publicado», la cartelera ni el detalle del viaje.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `creacion-viajes`: se agrega el registro de una descripción opcional del viaje al crearlo, sin alterar las reglas de creación ya especificadas.

## Impact

- **Historia:** HU-03 — Crear un viaje en el sistema. Actividad TO-BE: «Publicar viaje con su costo, hora de salida y lugar de encuentro». Caso de uso: CU-04.
- **Artefactos de origen:** `.cin324/historias/HU-03.md`, `08-modelo-dominio.md` y `diagramas/modelo-dominio.puml`. No se modifican `04-historias-usuario.md` ni `07-criterios-aceptacion.md` para este campo, según la decisión 4B de la validación del 2026-11-22.
- **Código:** migración nueva en `src/db/migrations/`, tipos y persistencia en `src/dominio/viaje.ts`, extracción del campo en `src/rutas/admin-viajes.ts`, campo opcional en `src/vistas/admin/viaje-nuevo.ejs`, datos de ejemplo en `src/db/seed.ts` y pruebas en `tests/`.
- **Datos:** la columna `viaje.descripcion` es texto opcional; los viajes existentes quedan sin descripción.
- **Fuera de alcance:** mostrar la descripción en la cartelera o en el detalle del viaje, editar o despublicar viajes, autenticación real, requisitos no funcionales y cambios en las validaciones ya implementadas.
