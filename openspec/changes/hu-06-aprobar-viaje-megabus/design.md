# Diseño

## Context

`src/dominio/viaje.ts` publica al registrar y las migraciones actuales limitan a 17 tanto la capacidad como la numeración de `asiento`. Cartelera, detalle público y reservas ya usan `viaje.estado = 'Publicado'` como condición de acceso. La ficha confirmada de HU-06 distingue el estado operativo de la aprobación.

## Goals / Non-Goals

**Objetivos:** conservar los filtros públicos y los datos históricos; registrar cada decisión y su efecto sobre la publicación en una única operación.

**Fuera del diseño:** cambiar las retenciones, agregar autenticación real o crear un servicio de notificaciones. No intervienen integraciones externas ni se agregan simuladores de servicios.

## Decisions

1. **Persistencia.** Agregar `vehiculo.tipo`, `viaje.estado_aprobacion` y una referencia opcional al `gerente` que resolvió el viaje. Usar un gerente de demostración identificado por el sistema. No crear una tabla de solicitudes: la bandeja consulta viajes con megabús pendientes. Mantener separado `viaje.estado`: el pendiente y el rechazado permanecen no publicados; aprobar fija `Publicado`.
2. **Registro y capacidad.** Seleccionar el tipo en el formulario y derivar la capacidad inicial de 17 o 45 en el servidor. Reutilizar el vehículo por patente compatible, sin modificarlo. Ajustar los límites de las tablas `vehiculo`, `viaje` y `asiento`; preservar los datos de los viajes anteriores sin rellenar cupos ni renumerar asientos. El registro sigue usando las validaciones vigentes.
3. **Resolución.** Aplicar una actualización condicionada a que el viaje siga pendiente y sea con megabús. Guardar la decisión, el gerente y el estado operativo en la misma operación. Si el viaje ya fue resuelto, mostrar «El viaje ya fue resuelto» sin modificarlo. La condición en SQLite evita que dos decisiones simultáneas sobrescriban el resultado; ocultar botones por sí solo no lo garantiza.
4. **Rutas y vistas.** Mantener `POST /admin/viajes`, agregar `GET /admin/viajes/:idViaje` para el estado y usar `GET /gerente/viajes/pendientes` y `POST /gerente/viajes/:idViaje/decision` para revisar y decidir. Mostrar el acceso en la navegación de demostración, siguiendo las rutas y el encabezado actuales. No extender el detalle público a viajes no publicados.

## Risks / Trade-offs

- Reconstruir tablas SQLite puede afectar las referencias de reservas y pagos → conservar claves, índices y restricciones; verificar `foreign_key_check` y datos históricos con una base migrada.
- Dos decisiones simultáneas pueden llegar sobre la misma pantalla → la actualización condicionada permite una sola decisión; las demás obtienen el aviso de viaje resuelto.
- La documentación indica cifras distintas → usar 45 para megabús y 17 para minibús según la ficha confirmada; anotar la alineación documental sin tocar el TO-BE.

## Migration Plan

Hacer una copia de `data/app.db` antes de migrar. Verificar una base nueva y una existente con reservas y pagos. Clasificar los vehículos históricos como minibuses y normalizar su capacidad registrada a 17, según la decisión del estudiante. Los viajes históricos conservan su capacidad, sus asientos, sus cupos y su estado operativo; quedan fuera de la revisión de megabuses. Si la migración falla, revertir la transacción o restaurar la copia antes de reintentar.
