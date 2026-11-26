# Tareas

## 1. Persistencia y datos de demostración

- [x] 1.1 Agregar la migración numerada para los tipos, la aprobación, el Gerente y los límites de capacidad y numeración. Probar la migración en base nueva y con datos históricos: conservar identificadores, cupos, asientos, reservas y pagos; ejecutar `PRAGMA foreign_key_check`.
- [x] 1.2 Actualizar los datos de ejemplo con un Gerente, un minibús publicado y un megabús pendiente; probar que el seed conserva datos coherentes al ejecutarse nuevamente.

## 2. Registro y consulta del Administrador

- [x] 2.1 Adaptar dominio, formulario y confirmación de registro para seleccionar el tipo y derivar los asientos en el servidor. Probar los dos escenarios de registro: minibús con 17 asientos publicado y megabús con 45 asientos pendiente y fuera de la cartelera.
- [x] 2.2 Conservar las validaciones actuales y la reutilización de patente compatible. Probar que una patente con otro tipo se rechaza sin cambios y que los errores del formulario no crean registros parciales.
- [x] 2.3 Agregar la consulta de estado en CU-07 y su enlace desde la confirmación. Probar que el Administrador ve `Pendiente`, `Aprobado` y `Rechazado`, incluidos viajes no publicados.

## 3. Revisión y decisión del Gerente

- [x] 3.1 Implementar la bandeja y su acceso en la navegación de demostración. Probar los escenarios «Solicitudes pendientes visibles para el gerente» y «Los minibuses no requieren aprobación», verificando también que no se muestren megabuses resueltos.
- [x] 3.2 Implementar el registro atómico de la decisión y su efecto en la publicación. Probar «Aprobación de un viaje con megabús» y «Rechazo de un viaje con megabús»: el aprobado aparece en la cartelera y el rechazado se conserva fuera de ella.
- [x] 3.3 Probar «Nueva decisión sobre un viaje ya resuelto» para ambos estados finales y verificar que dos decisiones concurrentes no cambian el resultado de la primera ni su publicación.

## 4. Integración y guía de uso

- [x] 4.1 Verificar el flujo completo desde registro hasta revisión y consulta; comprobar que el detalle público y la reserva no admiten pendientes ni rechazados, y que un megabús aprobado permite seleccionar asientos superiores al 17. Ejecutar `npm test` y `npm run typecheck`.
- [x] 4.2 Actualizar el README con instalación, ejecución, pruebas y el recorrido de demostración para Administrador y Gerente; verificar los comandos y rutas documentados.

## Seguimiento documental

- Alinear EST-03, DSS-03, el modelo de dominio y RP-03 con las decisiones de la ficha cuando se autorice esa edición documental. El TO-BE se conserva tal cual.
