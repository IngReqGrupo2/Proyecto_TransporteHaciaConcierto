# Proposal — Ajuste HU-03: registrar y mostrar una descripción opcional del viaje

## Why

El modelo de dominio incorporó `descripcion` como atributo de `Viaje` (`08-modelo-dominio.md` y `diagramas/modelo-dominio.puml`), y la validación de HU-03 confirmó que el administrador puede ingresarla de forma opcional al crear el viaje. La aplicación ya la captura y guarda, pero no la muestra en la cartelera ni en el detalle. La validación del sistema del 2026-11-22 confirmó que debe verse en ambas pantallas, sin restricción de rol (informe `.cin324/validaciones/VAL-HU-03-2.md`). Es un ajuste sobre HU-03 ya generada, con efecto en HU-01.

## What Changes

- Se mantiene el campo opcional «Descripción» en el formulario de creación y su guardado en `Viaje.descripcion`.
- Se muestra `descripcion` en la cartelera y en el detalle del viaje cuando el viaje la tenga; si no tiene, no se muestra texto adicional.
- No se restringe la visualización por rol: Pasajero y Administrador ven la misma cartelera y el mismo detalle.
- Se agregan pruebas para los escenarios Gherkin de visualización y se actualiza el README.
- No cambian los campos obligatorios, las validaciones existentes, el estado «Publicado», la capacidad ni los cupos.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `creacion-viajes`: se mantiene el registro de una descripción opcional del viaje al crearlo.
- `cartelera-viajes`: se agrega la visualización de la descripción del viaje en la cartelera y en el detalle, sin restricción de rol.

## Impact

- **Historias:** HU-03 (principal, crear viaje) y HU-01 (afectada, consultar cartelera y detalle). Actividad TO-BE: «Publicar viaje con su costo, hora de salida y lugar de encuentro» y «Seleccionar viaje». Casos de uso: CU-04 y CU-01.
- **Artefactos de origen:** `04-historias-usuario.md` (CA1/CA2 de HU-01), `07-criterios-aceptacion.md` (Gherkin de HU-01), `.cin324/historias/HU-01.md` y `.cin324/historias/HU-03.md`; commit `5e8d3f0`; informe `.cin324/validaciones/VAL-HU-03-2.md`.
- **Código:** `src/vistas/cartelera.ejs` y `src/vistas/detalle.ejs`; `ViajeRepositorio` ya expone `descripcion` (`src/dominio/viaje.ts`); pruebas en `tests/cartelera.test.ts`.
- **Datos:** sin migraciones nuevas; la columna `viaje.descripcion` ya existe y puede ser `NULL`.
- **Fuera de alcance:** editar o despublicar viajes, mostrar la descripción en otras pantallas, autenticación real, requisitos no funcionales y cambios en las validaciones de creación.
