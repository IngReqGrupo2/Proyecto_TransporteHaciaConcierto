# Informe de validación — HU-03 · Crear un viaje en el sistema

**Fecha:** 2026-11-18 · **Cambio de OpenSpec validado:** `hu-03-crear-viaje` · **Estado:** pendiente de actualización de artefactos

## Resumen

| Obs. | Lo que observaste | Tipo | Artefacto principal a modificar | También revisar |
|------|-------------------|------|----------------------------------|------------------|
| OBS-1 | La fecha acepta 31 de febrero y años como 200000 | B. Brecha de especificación | `07-criterios-aceptacion.md` (HU-03, Gherkin) | `04-historias-usuario.md` (HU-03 CA1), `.cin324/historias/HU-03.md` |

**Lo que sí funcionó:** validación de campos obligatorios, costo y patente; transacción sin registros parciales; reutilización del vehículo por patente; cupos derivados de la capacidad del vehículo.

## Detalle por observación

### OBS-1 — Fechas inválidas aceptadas

- **Lo que dijiste:** esperabas que el sistema rechazara fechas inexistentes o absurdas; pasó que las aceptó.
- **Qué dicen hoy los artefactos:** el Gherkin de HU-03 (`07-criterios-aceptacion.md:59-74`) solo cubre creación exitosa y campos faltantes; CA1 (`04-historias-usuario.md:33`) solo dice «permite ingresar … fecha»; la especificación generada exige validar obligatorios, costo, patente y capacidad, pero no fechas.
- **Diagnóstico:** tipo B. El sistema cumple los artefactos porque no hay regla de fecha escrita. Evidencia: `src/dominio/viaje.ts:156-184` no valida fechas; `src/dominio/viaje.ts:229` guarda el texto tal cual; SQLite `DATE` no valida calendario.
- **Decisión del estudiante (2026-11-18):** fecha real del calendario, no anterior a hoy y como máximo 100 años hacia el futuro (relativo al año actual), para la fecha del evento y la fecha del viaje.
- **Para mantener la consistencia, revisa:**
  - `04-historias-usuario.md`: HU-03, criterios de aceptación.
  - `07-criterios-aceptacion.md`: HU-03, nuevo escenario de fecha inválida.
  - `.cin324/historias/HU-03.md`: registrar la decisión.
  - `08-modelo-dominio.md`, `09-casos-de-uso.md` y `12-trazabilidad.md`: sin cambios de tipos ni vínculos; solo verificar.

## Orden sugerido de edición

1. `04-historias-usuario.md` (HU-03, criterios de aceptación)
2. `07-criterios-aceptacion.md` (HU-03, nuevo escenario)
3. `.cin324/historias/HU-03.md` (registrar la decisión)

## Cómo trabajamos los cambios

Opción elegida: **B) el agente propone cada cambio y el estudiante aprueba, modifica o descarta cada uno.**

## Cómo sabrás que terminaste

- [ ] Se actualizó el artefacto principal de OBS-1.
- [ ] Se revisaron los artefactos afectados.
- [ ] Se revisó la consistencia final y la trazabilidad.
- [ ] Se regeneró el sistema con `/cin324-generar-app`.

## Siguiente paso

Hacer commit de los artefactos y ejecutar `/cin324-generar-app` para generar el ajuste. Después, volver a ejecutar `/cin324-validar-sistema`.
