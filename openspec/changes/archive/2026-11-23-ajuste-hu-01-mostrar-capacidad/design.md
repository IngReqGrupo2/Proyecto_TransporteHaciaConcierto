# Design — Ajuste HU-01: mostrar la capacidad junto con los cupos disponibles

## Context

Ver `proposal.md` — Why. HU-01 ya está implementada y cuenta con las vistas `src/vistas/cartelera.ejs` y `src/vistas/detalle.ejs`, que hoy muestran solo `Cupos disponibles: <cuposDisponibles>`. El repositorio de viajes ya selecciona la columna `capacidad` (`src/dominio/viaje.ts:177`) y la interfaz de administración ya usa el formato «Cupos disponibles: X de Y» (`src/vistas/admin/viaje-creado.ejs:31`).

## Goals / Non-Goals

**Goals:**

- Mostrar la capacidad total del viaje junto con los cupos disponibles en la cartelera y en el detalle.
- Mantener el mismo formato visual que ya usa la vista de viaje creado.
- Cubrir el cambio con pruebas de los escenarios de la especificación.

**Non-Goals:**

- Cambiar el filtrado de la cartelera, las rutas, el esquema de la base de datos o el repositorio.
- Mostrar vehículo, conductor o asistente.
- Alterar el manejo actual de viajes inexistentes o no publicados.

## Decisions

1. **Formato «Cupos disponibles: X de Y».** Se reutiliza el formato de `src/vistas/admin/viaje-creado.ejs:31`, donde `X` es `cuposDisponibles` e `Y` es `capacidad`. Evita inventar una etiqueta nueva y mantiene coherencia entre pantallas. Alternativa descartada: mostrar dos líneas separadas («Capacidad: Y» y «Cupos disponibles: X»), que agrega ruido visual sin aportar información distinta.

2. **Sin cambios en datos ni en el repositorio.** `Viaje.capacidad` ya existe en el modelo de dominio (`08-modelo-dominio.md`) y ya se consulta en `listarDisponibles()` y `buscarPublicadoPorId()` (`src/dominio/viaje.ts:176-178`). No se requieren migraciones ni nuevas consultas.

3. **Cambio acotado a las vistas.** Solo se modifican `src/vistas/cartelera.ejs` y `src/vistas/detalle.ejs`; las rutas y el resto del flujo de CU-01 quedan intactos.

4. **Pruebas por escenario.** Se actualizan las pruebas de `tests/cartelera.test.ts` para verificar que la capacidad se muestra en la lista y en el detalle, incluido el caso de 0 cupos y su aviso. Se conservan las aserciones existentes sobre el mensaje «No hay viajes disponibles» y el filtrado.

5. **Aviso de viaje sin cupos en el detalle.** `src/vistas/detalle.ejs` mostrará «No hay cupos disponibles para este viaje.» cuando `cuposDisponibles` sea 0, sin cambiar la ruta ni responder 404. Alternativa descartada: 404, porque el estudiante confirmó que la página debe abrirse e informar la situación.

## Risks / Trade-offs

- **Aserciones existentes que buscan «Cupos disponibles: 12»** → El nuevo texto «Cupos disponibles: 12 de 17» sigue conteniendo esa cadena; además se agregan aserciones explícitas sobre la capacidad.
- **Duplicación del formato entre vistas** → Es una cadena simple y el proyecto no tiene un helper de formato para cupos; si aparecen más pantallas, se podrá extraer un parcial o helper en otra historia.
- **Sin diagrama de secuencia para CU-01** → El cambio no altera el flujo ni las rutas, por lo que no hay mensajes nuevos que modelar.
