# Propuesta

## Why

Hoy, el registro de un viaje lo publica de inmediato y la aplicación limita la capacidad a 17 pasajeros. HU-06 necesita que el Gerente pueda decidir sobre los viajes con megabús antes de publicarlos.

## What Changes

- Incorporar CU-06: el Gerente consulta megabuses pendientes, aprueba o rechaza cada viaje una sola vez y recibe un aviso si ya fue resuelto.
- Adaptar CU-04 y CU-07 en lo necesario para HU-06: los nuevos viajes se registran con 17 asientos para minibús (publicación directa) o 45 para megabús (pendiente); el Administrador consulta la aprobación sin exponer los pendientes y rechazados en la cartelera pública.
- Mantener la referencia TO-BE «Publicar viaje con su costo, hora de salida y lugar de encuentro», sin editar el TO-BE.
- Fuera de alcance: autenticación real, notificaciones externas, reapertura de decisiones y cambios a las reglas de retención, reservas o pagos.

## Capabilities

### New Capabilities

- `aprobacion-viajes`: revisión, aprobación y rechazo de viajes con megabús, incluida la protección frente a una segunda decisión.

### Modified Capabilities

- `creacion-viajes`: registro según tipo, capacidad inicial, publicación condicionada y consulta del estado de aprobación.

## Impact

- Migración SQLite para tipo, aprobación y asientos; se preservan los viajes existentes, sus capacidades y sus reservas.
- Cambios en dominio de viajes, formulario y consulta del Administrador, y nueva vista de revisión del Gerente. La cartelera y el detalle público mantienen su filtro de viajes publicados.
- La ficha HU-06 confirma 45 asientos para megabús; el modelo que aún dice 47 y RP-03 con máximo general de 17 requieren alineación documental. EST-03 y DSS-03 deben reflejar el flujo confirmado. Las ediciones de documentos del curso se reservan para autorización explícita.
