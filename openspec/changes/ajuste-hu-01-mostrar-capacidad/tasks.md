# Tasks — Ajuste HU-01: mostrar la capacidad junto con los cupos disponibles

## 1. Mostrar la capacidad en las pantallas

- [x] 1.1 Actualizar `src/vistas/cartelera.ejs` para mostrar «Cupos disponibles: X de Y» (`X = cuposDisponibles`, `Y = capacidad`); verificar a mano en `/cartelera` que cada tarjeta muestra ambas cifras.
- [x] 1.2 Actualizar `src/vistas/detalle.ejs` con el mismo formato; verificar a mano en `/cartelera/:idViaje` que se muestran la capacidad y los cupos, incluso cuando los cupos son 0.
- [x] 1.3 Agregar en `src/vistas/detalle.ejs` el aviso «No hay cupos disponibles para este viaje.» cuando `cuposDisponibles` sea 0; verificar a mano que el detalle de un viaje lleno se abre, muestra la capacidad, 0 cupos y el aviso.

## 2. Pruebas de los escenarios

- [x] 2.1 Ampliar la prueba `HU-01 · Existen viajes disponibles` en `tests/cartelera.test.ts` para verificar la capacidad mostrada (por ejemplo, «de 17») junto con los cupos; ejecutar `npx vitest run tests/cartelera.test.ts` y confirmar que pasa.
- [x] 2.2 Ampliar las pruebas `HU-01 · Verificar disponibilidad de un viaje` y `HU-01 · Detalle de un viaje publicado con 0 cupos` para verificar capacidad, cupos y el aviso «No hay cupos disponibles para este viaje.»; ejecutar la suite de cartelera y confirmar que pasa.
- [x] 2.3 Ejecutar `npm test` completo y `npm run typecheck`; confirmar que no hay regresiones.

## 3. Documentación

- [x] 3.1 Actualizar `README.md` para indicar que la cartelera y el detalle muestran la capacidad y los cupos disponibles, y verificar que los comandos documentados (`npm run db:seed`, `npm run dev`, `npm test`) siguen siendo correctos.

## Workflow follow-up

- Archivar el cambio con `/opsx-archive` cuando el estudiante valide el sistema.
- Actualizar `.cin324/proyecto.md` con el cambio `ajuste-hu-01-mostrar-capacidad`.
