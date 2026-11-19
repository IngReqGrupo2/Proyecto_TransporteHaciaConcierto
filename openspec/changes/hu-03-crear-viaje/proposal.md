# Propuesta — HU-03 Crear un viaje en el sistema

## Why

Hoy el administrador crea los viajes a conciertos con afiches externos y publicaciones manuales en redes sociales, sin un registro centralizado de los datos del traslado. Esta historia le permite registrar un viaje en la plataforma y publicarlo automáticamente en la cartelera, eliminando trabajo manual y dejando la oferta disponible para los pasajeros (RP-01).

## What Changes

- Se agrega una pantalla de administración para **crear y publicar viajes** en la cartelera.
- El formulario registra nombre y fecha del evento, fecha del viaje, horas de salida y regreso, lugar de encuentro, costo, conductor, asistente, modelo del vehículo y patente.
- El sistema valida los campos obligatorios, el costo y el formato chileno de la patente; si algo no es válido, no crea nada y muestra los errores.
- El sistema crea el `Evento` y el `Vehiculo` (o reutiliza el vehículo si la patente ya existe) y registra el `Viaje` en estado «Publicado».
- La capacidad y los cupos disponibles se asignan desde el vehículo, con un máximo de 17 pasajeros.
- Se agrega la tabla `vehiculo` y las columnas de vehículo, conductor y asistente en `viaje`.
- Se actualizan los datos de ejemplo para incluir vehículos y los nuevos datos del viaje.

**Fuera del alcance:** reservar cupos o registrar pasajeros (HU-02), pagar (HU-05), visualizar pasajeros y registrar asistencia (HU-04), consultar la cartelera (HU-01, ya implementada), autenticación real, edición o eliminación de viajes, y requisitos no funcionales (RP-03, RP-09, RP-10 y RP-11 solo se leen como contexto).

## Capabilities

### New Capabilities

- `creacion-viajes`: registro y publicación de viajes por parte del administrador, incluyendo evento, vehículo, datos del traslado y disponibilidad inicial.

### Modified Capabilities

- Ninguna.

## Impact

- **Trazabilidad:** HU-03, actividad TO-BE «Publicar viaje con su costo, hora de salida y lugar de encuentro», CU-04 «Crear viaje», RP-01 (RP-03 y RP-11 como contexto).
- **Código nuevo:** repositorio de creación de viajes, rutas `GET /admin/viajes/nuevo` y `POST /admin/viajes`, vistas EJS del formulario y la confirmación, y pruebas por escenario.
- **Base de datos:** nueva tabla `vehiculo`; nuevas columnas `id_vehiculo`, `conductor_asignado` y `asistente_asignado` en `viaje`. La migración reconstruye `viaje` para mantener las claves foráneas y las restricciones de capacidad.
- **Datos de ejemplo:** se agregan vehículos y se completan los viajes existentes con vehículo, conductor y asistente.
- **Dependencias:** se mantienen las del stack actual; no se agregan dependencias.
- **Sistemas externos:** ninguno en esta historia.
