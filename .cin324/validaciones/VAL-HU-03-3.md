# Informe de validación — HU-03 · Crear un viaje en el sistema

**Fecha:** 2026-11-22 · **Cambios de OpenSpec relacionados:** `hu-03-crear-viaje`, `ajuste-hu-03-fechas`, `ajuste-hu-03-validaciones` y `ajuste-hu-03-descripcion` · **Estado:** validada sin observaciones

## Resumen

El estudiante recorrió el formulario de creación como administrador y confirmó que todo ocurrió como indica la documentación. No hubo observaciones: no hay artefactos que cambiar ni defectos de generación que reportar.

| Obs. | Lo que observaste | Tipo | Artefacto principal a modificar | También revisar |
|------|-------------------|------|----------------------------------|------------------|
| — | Sin observaciones | — | Ninguno | Ninguno |

**Lo que sí funcionó:** los siete casos comprobados (ver abajo) coincidieron con la ficha `.cin324/historias/HU-03.md`, `07-criterios-aceptacion.md` y los cuatro cambios de OpenSpec de la historia.

## Casos comprobados

| Caso | Resultado observado |
|---|---|
| Creación exitosa | Viaje publicado con sus datos y visible en la cartelera |
| Faltan campos | Se impide; cada campo faltante se marca como inválido y no se crea el viaje |
| Fechas inválidas | 29/02 de año no bisiesto, fecha pasada y año actual + 101 rechazados con el mensaje junto al campo |
| Nombres inválidos | Conductor o asistente solo numérico rechazado con su mensaje |
| Viaje después del evento | «La fecha del viaje no puede ser posterior a la fecha del evento.» y no se crea |
| Descripción opcional | Con texto se guarda y se muestra; vacía crea el viaje sin descripción |
| Patente, costo y vehículo | Patente existente reutiliza el vehículo; costo 0 y patente `AB1234` se rechazan |

## Diagnóstico

- No se identificaron observaciones de tipo A, B, C ni D.
- No se modificó ningún artefacto de especificación ni el código.
- Los ajustes de fechas, validaciones y descripción están implementados y ahora quedan aceptados.

## Siguiente paso

Archivar los cambios de HU-03 con `/opsx-archive` (decidiendo si se sincronizan sus especificaciones con `openspec/specs/`) o continuar con otra historia.
