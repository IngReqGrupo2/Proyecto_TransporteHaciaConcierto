# Propuesta — HU-01 Consultar la cartelera de viajes

## Why

Hoy el pasajero debe preguntar por mensaje al administrador qué viajes existen y cuántos cupos quedan, lo que genera demoras y respuestas manuales. Esta historia centraliza la oferta en una cartelera consultable y muestra la disponibilidad sin intervención del administrador (RP-02).

## What Changes

- Se crea la aplicación web base (TypeScript + Express + EJS + SQLite) con una primera pantalla pública: **Cartelera de viajes**.
- La cartelera lista únicamente los viajes en estado «Publicado» con `cuposDisponibles > 0`, mostrando evento, fecha, hora de salida, hora de regreso, lugar de encuentro, costo y cupos disponibles.
- Si no hay viajes disponibles, se muestra el mensaje «No hay viajes disponibles».
- El pasajero puede seleccionar un viaje y ver su detalle con la cantidad de cupos disponibles.
- Se agregan migraciones SQL y datos de ejemplo de eventos y viajes publicados para poder probar la cartelera.

**Fuera del alcance:** reservar cupos e ingresar datos del pasajero (HU-02), crear o publicar viajes (HU-03), pagar (HU-05), listar pasajeros (HU-04), mostrar vehículo/conductor/asistente, autenticación real y requisitos no funcionales (RP-09 y RP-11 solo se leen como contexto).

## Capabilities

### New Capabilities

- `cartelera-viajes`: consulta pública de viajes publicados con cupos disponibles y visualización del detalle y la disponibilidad de un viaje seleccionado.

### Modified Capabilities

- Ninguna.

## Impact

- **Trazabilidad:** HU-01, actividad TO-BE «Seleccionar viaje», CU-01 «Consultar cartelera de viajes», RP-02 (RP-09 como contexto no implementado).
- **Código nuevo:** estructura del proyecto, conexión SQLite con migraciones, repositorio de `Viaje` y `Evento`, rutas y vistas EJS de cartelera y detalle, datos de ejemplo y pruebas.
- **Base de datos:** tablas `evento` y `viaje` derivadas del modelo de dominio (solo las columnas que esta historia usa).
- **Dependencias:** Express, EJS, better-sqlite3, Vitest, supertest, tsx y TypeScript.
- **Sistemas externos:** ninguno en esta historia.
