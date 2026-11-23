# Informe de validación — HU-02 · Registrar reserva y pasajero

**Fecha:** 2026-11-22 · **Cambio de OpenSpec relacionado:** `ajuste-hu-02-reserva-multiple` · **Estado:** validada sin observaciones

## Resumen

El estudiante recorrió el sistema como cliente y confirmó que todos los escenarios se comportaron como indica la documentación. No hubo observaciones: no hay artefactos que cambiar ni defectos de generación que reportar.

| Obs. | Lo que observaste | Tipo | Artefacto principal a modificar | También revisar |
|------|-------------------|------|----------------------------------|------------------|
| — | Sin observaciones | — | Ninguno | Ninguno |

**Lo que sí funcionó:** los ocho recorridos probados (ver abajo) coincidieron con la ficha `.cin324/historias/HU-02.md`, `07-criterios-aceptacion.md`, EST-01 y DSS-01.

## Recorridos probados

| Recorrido | Resultado observado |
|---|---|
| Retención al seleccionar | Bloque de pasajero con vencimiento a 8 minutos y un cupo menos antes de confirmar |
| Confirmación con varios asientos | Una sola reserva «Pendiente de pago», un código, varios asientos/pasajeros y los mismos vencimientos |
| Cupo no disponible | El segundo cliente recibe «No hay cupos disponibles para el asiento seleccionado.» sin alterar la selección del primero |
| Consultar reserva | Viaje, asientos con sus pasajeros, estado y modalidad; lugar de regreso cuando corresponde |
| Pérdida de disponibilidad | «La selección ya no está disponible o alguna retención venció. Revisa tu selección.» sin registro parcial |
| Vencimiento completo | Al vencer el primer asiento, toda la reserva queda «Vencida» y se liberan todos sus cupos |
| Modalidad de regreso | Ida y vuelta con `Terminal Norte`, falta del lugar impedida y reserva sin ida y vuelta correcta |
| Datos inválidos y casos límite | Datos inválidos rechazados; último cupo y viaje sin cupos se comportan como indica la documentación |

## Diagnóstico

- No se identificaron observaciones de tipo A, B, C ni D.
- No se modificó ningún artefacto de especificación ni el código.
- La verificación técnica previa sigue vigente: `.cin324/validaciones/VER-HU-02-implementacion.md`.

## Siguiente paso

La aceptación del sistema queda registrada. Como el cambio `ajuste-hu-02-reserva-multiple` ya está implementado y aceptado, corresponde archivarlo con `/opsx-archive` (decidiendo si se sincronizan sus especificaciones con `openspec/specs/`) o continuar con la siguiente historia.
