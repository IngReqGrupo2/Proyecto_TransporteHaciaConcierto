# Informe de validación — HU-03 · Crear un viaje en el sistema

**Fecha:** 2026-11-22 · **Cambio de OpenSpec relacionado:** `ajuste-hu-03-descripcion` · **Estado:** artefactos actualizados

## Resumen

| Obs. | Lo que observaste | Tipo | Artefacto principal a modificar | También revisar |
|------|-------------------|------|----------------------------------|------------------|
| OBS-1 | La descripción se guarda al crear el viaje, pero no se ve en la cartelera ni en el detalle; debe verla todo rol | A. Cambio de requisito | `.cin324/historias/HU-01.md` y `07-criterios-aceptacion.md` (HU-01) | `.cin324/historias/HU-03.md`, CA de HU-01 en `04-historias-usuario.md`, `08`/`09`/`10`/`11`/`12` (verificar sin cambios) |

**Lo que sí funcionó:** la descripción se captura en el formulario y se guarda (`src/dominio/viaje.ts:349`); una descripción vacía se guarda como `NULL`; el viaje se publica en la cartelera.

## Detalle por observación

### OBS-1 — La descripción no se muestra

- **Lo que dijiste:** al crear un viaje con descripción, esta no aparece en la cartelera ni en el detalle; debe ser visible para todos los roles.
- **Qué decían los artefactos:** `HU-03.md:146,157` y `openspec/changes/ajuste-hu-03-descripcion/proposal.md` excluían mostrar la descripción; `HU-01.md:19-22` no la incluía entre los datos mostrados; `src/vistas/cartelera.ejs` y `src/vistas/detalle.ejs` no la renderizaban.
- **Diagnóstico:** tipo **A**. El sistema cumplía los artefactos; el requisito cambió. No es un defecto de generación.
- **Decisión confirmada (2026-11-22):** mostrar la descripción en la cartelera y en el detalle cuando el viaje tenga texto; Pasajero y Administrador ven la misma información, sin restricción de rol.
- **Artefactos modificados:**
  - `04-historias-usuario.md`: CA1 y CA2 de HU-01 incluyen la descripción cuando la tengan.
  - `07-criterios-aceptacion.md`: los escenarios de cartelera y detalle de HU-01 muestran la descripción cuando la tenga, y se agregó «La descripción se muestra sin restricción de rol».
  - `.cin324/historias/HU-01.md`: entidades, flujo, Gherkin y decisiones actualizados.
  - `.cin324/historias/HU-03.md`: se quitó la exclusión de mostrar la descripción; se aclaró que su visualización corresponde a HU-01 y que la implementación ya la captura.
- **Para mantener la consistencia, revisa:**
  - `08-modelo-dominio.md`: sin cambios; `descripcion` sigue siendo opcional y no participa en las validaciones.
  - `09-casos-de-uso.md`: sin cambios; se reformuló el escenario para no introducir un actor nuevo en CU-01.
  - `10`, `11` y `12`: sin cambios; la descripción es un atributo de `Viaje`.

## Orden aplicado de edición

1. `04-historias-usuario.md` (HU-01, CA1 y CA2)
2. `07-criterios-aceptacion.md` (HU-01, escenarios Gherkin)
3. `.cin324/historias/HU-01.md` (entidades, flujo, Gherkin y decisiones)
4. `.cin324/historias/HU-03.md` (decisiones, supuestos y fuera de alcance)
5. `12-trazabilidad.md` (verificado, sin cambios)

## Cómo trabajamos los cambios

Opción B: el agente propuso cada cambio y el estudiante aprobó, modificó, descartó o lo hizo él. El cambio 1 lo editó el estudiante; los cambios 2 a 4 los aplicó el agente con aprobación explícita.

## Cómo sabrás que terminaste

- [x] Se actualizó el artefacto principal de OBS-1.
- [x] Se revisaron los artefactos afectados.
- [x] No hay diagramas modificados que reexportar.
- [x] Se revisó la consistencia final y la trazabilidad.
- [x] Se regeneró el sistema con `/cin324-generar-app`.
- [ ] Se verificó el resultado en el sistema con `/cin324-validar-sistema`.

## Siguiente paso

Hacer commit de los artefactos y ejecutar `/cin324-generar-app` para extender el cambio `ajuste-hu-03-descripcion` y mostrar la descripción en la cartelera y el detalle. Después, volver a ejecutar `/cin324-validar-sistema`.
