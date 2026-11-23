# Tasks — Ajuste HU-03: validar las fechas del evento y del viaje

## 1. Validación de fechas en el dominio

- [x] 1.1 Agregar `validarFechaCalendario(valor, referencia)` en `src/dominio/viaje.ts`: formato estricto `AAAA-MM-DD`, comprobación de los componentes de la fecha en hora local y rango entre hoy y el 31 de diciembre de `añoActual + 100`; verificar con las pruebas unitarias de límites (29/02 bisiesto, `31/12/(año+100)`, `1/1/(año+101)`).
- [x] 1.2 Invocar la validación en `crearViaje` después de los campos obligatorios y antes de la transacción, informando `eventoFecha` o `fechaViaje` en `ErrorValidacion` con el mensaje del diseño; verificar con `npm test` que no queden registros parciales en `evento`, `vehiculo` ni `viaje`.

## 2. Pruebas de los escenarios Gherkin

- [x] 2.1 Prueba de integración `HU-03 · Fecha inexistente en el calendario` en `tests/admin-viajes.test.ts` calculando dinámicamente un año no bisiesto (el primero posterior al año actual que no sea bisiesto) y usando su 29 de febrero; verificar respuesta 400, mensaje de fecha y que no se cree el viaje.
- [x] 2.2 Prueba de integración `HU-03 · Fecha anterior a hoy` con una fecha calculada `hoy - 1 día`; verificar respuesta 400, mensaje de fecha y que no se cree el viaje.
- [x] 2.3 Prueba de integración `HU-03 · Fecha posterior al límite de 100 años` calculando el `1 de enero del año actual más 101 años`; verificar respuesta 400, mensaje con el año límite (`año actual + 100`) y que no se cree el viaje.
- [x] 2.4 Confirmar que las pruebas existentes de creación exitosa, patente, costo y capacidad siguen pasando con `npm test`.

## 3. Documentación

- [x] 3.1 Actualizar `README.md` con la regla de fechas de la creación de viajes y verificar que los comandos documentados (`npm run db:seed`, `npm run dev`, `npm test`) siguen siendo correctos.

## Workflow follow-up

- Archivar el cambio con `/opsx-archive` cuando el estudiante valide el sistema.
- Actualizar `.cin324/proyecto.md` con el cambio `ajuste-hu-03-fechas` y volver a validar con `/cin324-validar-sistema`.
