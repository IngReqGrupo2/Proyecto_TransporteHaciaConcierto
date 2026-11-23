# Proposal — Ajuste HU-03: validar las fechas del evento y del viaje

## Why

Al crear un viaje, el sistema acepta fechas imposibles (como el 29 de febrero de un año no bisiesto) o absurdas (como el año 200000000). La especificación de HU-03 no definía ninguna regla de fecha, por lo que el comportamiento no era un defecto de generación sino una brecha de especificación, detectada como OBS-1 en `.cin324/validaciones/VAL-HU-03-1.md`. El 2026-11-18 el estudiante decidió la regla y se actualizaron los artefactos de origen.

## What Changes

- La creación de un viaje rechaza la fecha del evento o la fecha del viaje cuando no existe en el calendario, es anterior a la fecha actual o es posterior al 31 de diciembre del año actual más 100 años.
- Se incorpora el criterio de aceptación CA4 de HU-03 y el esquema de escenario Gherkin «Fechas inválidas en la creación del viaje», con tres ejemplos relativos: el 29 de febrero de un año no bisiesto, una fecha anterior a hoy y el 1 de enero del año actual más 101 años.
- El formulario de creación muestra un mensaje de error cuando alguna fecha no cumple la regla, conservando lo ingresado, sin crear el evento, el vehículo ni el viaje.
- No cambian los datos almacenados, la cartelera ni el resto de las validaciones de HU-03.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `creacion-viajes`: se agrega la validación del calendario y del rango permitido para las fechas del evento y del viaje al registrar un viaje (CA4 de HU-03).

## Impact

- **Historia:** HU-03 — Crear un viaje en el sistema. Actividad TO-BE: «Publicar viaje con su costo, hora de salida y lugar de encuentro». Caso de uso: CU-04.
- **Artefactos de origen:** `04-historias-usuario.md` (HU-03, CA4), `07-criterios-aceptacion.md` (HU-03, esquema de fechas inválidas) y `.cin324/historias/HU-03.md`.
- **Código:** validación en `src/dominio/viaje.ts`, entrega del error en `src/rutas/admin-viajes.ts` y en la vista del formulario de creación, y pruebas en `tests/crear-viaje.test.ts`.
- **Datos:** sin migraciones; `evento.fecha_evento` y `viaje.fecha_viaje` se mantienen como texto en formato `AAAA-MM-DD`.
- **Fuera de alcance:** editar o despublicar viajes, validar horas de salida y regreso, zonas horarias, disponibilidad de fechas en la cartelera y requisitos no funcionales.
