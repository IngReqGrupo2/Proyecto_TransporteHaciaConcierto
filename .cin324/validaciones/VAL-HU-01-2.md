# Informe de validación — HU-01 · Consultar la cartelera de viajes

**Fecha:** 2026-11-22 · **Cambio de OpenSpec relacionado:** `ajuste-hu-01-mostrar-capacidad` · **Estado:** validada sin observaciones

## Resumen

El estudiante recorrió la cartelera y el detalle como cliente y confirmó que todo ocurrió como indica la documentación. No hubo observaciones: no hay artefactos que cambiar ni defectos de generación que reportar.

| Obs. | Lo que observaste | Tipo | Artefacto principal a modificar | También revisar |
|------|-------------------|------|----------------------------------|------------------|
| — | Sin observaciones | — | Ninguno | Ninguno |

**Lo que sí funcionó:** los siete casos comprobados (ver abajo) coincidieron con la ficha `.cin324/historias/HU-01.md`, `07-criterios-aceptacion.md` y el cambio `ajuste-hu-01-mostrar-capacidad`.

## Casos comprobados

| Caso | Resultado observado |
|---|---|
| Cartelera con datos y descripción | V-001 muestra evento, fecha, horas, lugar, costo, capacidad, cupos y descripción |
| Capacidad y cupos juntos | La tarjeta y el detalle muestran «Cupos disponibles: 17 de 17», no solo los cupos |
| Detalle del viaje | Información completa, incluida la capacidad y la descripción |
| Viaje no publicado | `/cartelera/V-002` responde 404 «El viaje no existe o no está disponible.» |
| Viaje sin cupos | El detalle muestra 0 cupos y «No hay cupos disponibles para este viaje.» |
| Sin restricción de rol | Pasajero y Administrador ven la misma información y descripción |
| Cartelera vacía | «No hay viajes disponibles» y no se listan viajes |

## Diagnóstico

- No se identificaron observaciones de tipo A, B, C ni D.
- No se modificó ningún artefacto de especificación ni el código.
- El ajuste pendiente de la revalidación (mostrar `capacidad`) ya está implementado y ahora queda aceptado.

## Siguiente paso

Archivar el cambio `ajuste-hu-01-mostrar-capacidad` con `/opsx-archive` (decidiendo si se sincronizan sus especificaciones con `openspec/specs/`) o continuar con otra historia.
