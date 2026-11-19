# Proposal — Ajuste HU-03: nombres válidos, orden de fechas y error junto al campo

## Why

En la segunda ronda de validación del sistema (OBS-1, OBS-2 y OBS-3 de `.cin324/validaciones/VAL-HU-03-2.md`) el estudiante encontró que la creación de viajes acepta nombres de conductor o asistente compuestos solo por números, permite una fecha del viaje posterior a la del evento y no señala en el formulario cuál campo causó el error. Eran brechas de especificación de HU-03, no defectos de generación. El 2026-11-18 el estudiante decidió las reglas y se actualizaron los artefactos de origen.

## What Changes

- La creación de un viaje rechaza el nombre del conductor o del asistente cuando no contiene al menos una letra (CA5 de HU-03).
- La creación de un viaje rechaza una fecha del viaje posterior a la fecha del evento; el mismo día está permitido (CA6 de HU-03).
- Todos los errores de validación se muestran junto al campo afectado y ese campo queda marcado como inválido, además del mensaje general (CA7 de HU-03).
- Se incorporan los escenarios Gherkin «Nombre del conductor o del asistente inválido» (esquema con dos ejemplos) y «Fecha del viaje posterior a la fecha del evento», y se amplían «Faltan campos» y «Fechas inválidas» con el marcado del campo.
- No cambian los datos almacenados, el modelo de dominio, la cartelera ni las reglas de negocio ya implementadas.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `creacion-viajes`: se agregan la validación de nombres con al menos una letra, la relación de orden entre la fecha del viaje y la del evento y la indicación del campo con error al registrar un viaje (CA5, CA6 y CA7 de HU-03).

## Impact

- **Historia:** HU-03 — Crear un viaje en el sistema. Actividad TO-BE: «Publicar viaje con su costo, hora de salida y lugar de encuentro». Caso de uso: CU-04.
- **Artefactos de origen:** `04-historias-usuario.md` (HU-03, CA5 a CA7), `07-criterios-aceptacion.md` (HU-03, escenarios de nombres y de orden de fechas) y `.cin324/historias/HU-03.md`.
- **Código:** validaciones en `src/dominio/viaje.ts`, entrega de los campos con error en `src/rutas/admin-viajes.ts`, marcado y mensaje por campo en `src/vistas/admin/viaje-nuevo.ejs` y `public/estilos.css`, y pruebas en `tests/crear-viaje.test.ts` y `tests/admin-viajes.test.ts`.
- **Datos:** sin migraciones ni cambios en el esquema; `08-modelo-dominio.md` no se modifica.
- **Fuera de alcance:** editar o despublicar viajes, validar horas, zonas horarias, autenticación real y requisitos no funcionales.
