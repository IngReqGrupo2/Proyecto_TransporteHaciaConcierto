# Propuesta — Ajuste HU-01: mostrar la capacidad junto con los cupos disponibles

## Why

La cartelera y el detalle de HU-01 muestran solo los cupos disponibles, pero el estudiante confirmó en la revalidación del 2026-11-22 que también debe mostrarse la capacidad total del viaje para que el pasajero pueda interpretar la disponibilidad. La ficha `.cin324/historias/HU-01.md` ya registra la decisión; falta reflejarla en la especificación y en la aplicación.

## What Changes

- La cartelera muestra la `capacidad` de cada viaje junto con los `cuposDisponibles`.
- El detalle del viaje muestra la `capacidad` y los `cuposDisponibles`.
- Cuando el viaje seleccionado no tiene cupos disponibles, su detalle muestra la capacidad, 0 cupos y un aviso de que no hay cupos disponibles.
- No cambian el filtrado de la cartelera (estado «Publicado» y `cuposDisponibles > 0`), el mensaje «No hay viajes disponibles», las rutas ni los datos almacenados.
- No cambia el manejo actual de viajes inexistentes o no publicados.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `cartelera-viajes`: se amplía la información mostrada del viaje para incluir la `capacidad` junto con los `cuposDisponibles` en la cartelera y en el detalle.

## Impact

- **Historia:** HU-01 — Consultar la cartelera de viajes. Actividad TO-BE: «Seleccionar viaje». Caso de uso: CU-01.
- **Artefactos de origen:** `.cin324/historias/HU-01.md` (revalidación del 2026-11-22); `04-historias-usuario.md` y `07-criterios-aceptacion.md` no cambian.
- **Código:** `src/vistas/cartelera.ejs` y `src/vistas/detalle.ejs`; el repositorio ya expone `capacidad` en `Viaje` (`src/dominio/viaje.ts`).
- **Datos:** sin migraciones; `viaje.capacidad` ya existe.
- **Pruebas:** se actualizan las pruebas de HU-01 para verificar que se muestran ambas cifras.
- **Fuera del alcance:** reservas (HU-02), creación de viajes (HU-03), pagos (HU-05), nómina de pasajeros (HU-04), vehículo/conductor/asistente, viajes inexistentes o no publicados como escenario de negocio y requisitos no funcionales.
