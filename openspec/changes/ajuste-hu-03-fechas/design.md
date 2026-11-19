# Design — Ajuste HU-03: validar las fechas del evento y del viaje

## Context

Ver `proposal.md`. La aplicación ya registra viajes con `ViajeRepositorio.crearViaje` (`src/dominio/viaje.ts`), que normaliza y valida los campos dentro de una transacción. Las columnas `evento.fecha_evento` y `viaje.fecha_viaje` son texto `AAAA-MM-DD`: SQLite no valida el calendario ni aplica rango, por lo que la regla debe implementarse en el dominio. El formulario (`src/vistas/admin/viaje-nuevo.ejs`) ya usa `input type="date"` y muestra un solo mensaje de error general.

## Goals / Non-Goals

**Goals:**

- Rechazar fechas inexistentes o fuera del rango decidido antes de abrir la transacción.
- Devolver un mensaje claro y conservar lo ingresado en el formulario.
- Cubrir los tres escenarios del Gherkin con pruebas automáticas.

**Non-Goals:**

- Validar horas de salida y regreso, zonas horarias o coherencia entre fechas del evento y del viaje.
- Reescribir viajes existentes con fechas pasadas.
- Cambiar la interfaz, la cartelera o el esquema de la base de datos.

## Decisions

1. **Validación en el dominio, no en SQL ni solo en HTML.** Se agrega una función pura `validarFechaCalendario(valor, referencia)` en `src/dominio/viaje.ts` y se invoca en `crearViaje` después de comprobar los campos obligatorios y antes de la transacción. Alternativa descartada: `CHECK` con funciones de fecha de SQLite, que no valida el calendario de forma fiable.

2. **Parseo estricto `AAAA-MM-DD`.** Se comprueba con la expresión `^\d{4}-\d{2}-\d{2}$`, se construye la fecha con `new Date(anio, mes - 1, dia)` en hora local y se verifica que `getFullYear`, `getMonth` y `getDate` coincidan. Así se detecta el 29 de febrero de años no bisiestos, que `new Date('2027-02-29')` convertiría en el 1 de marzo. Alternativa descartada: confiar en `Date.parse`, que acepta el desbordamiento de día.

3. **Rango permitido relativo a hoy.** La fecha debe ser mayor o igual que la fecha local actual y menor o igual que el 31 de diciembre de `añoActual + 100` (para 2026, `2126-12-31`). Se comparan fechas a medianoche local, sin convertir a UTC, para no desplazar un día según la zona horaria. El límite se calcula en cada validación, no se almacena.

4. **Un error por campo de fecha.** Si la fecha del evento falla se informa `eventoFecha`; si falla la del viaje, `fechaViaje`; si fallan ambas, se informa el primer campo con error y un mensaje conjunto. Los mensajes propuestos son:
   - `La fecha del evento debe ser una fecha real del calendario, no anterior a hoy y no posterior al 31 de diciembre de <año límite>.`
   - `La fecha del viaje debe ser una fecha real del calendario, no anterior a hoy y no posterior al 31 de diciembre de <año límite>.`
   El mensaje se muestra en el bloque `error` ya existente del formulario; no se rediseña la pantalla.

5. **Sin cambios en rutas ni en la vista.** `src/rutas/admin-viajes.ts` ya convierte `ErrorValidacion` en una respuesta 400 con los valores ingresados; basta con que el error provenga del repositorio. El atributo `required` del formulario se mantiene como ayuda del navegador, pero la regla se valida en el servidor.

6. **Pruebas por escenario y por límites.** Se agregan tres pruebas de integración nombradas `HU-03 · <escenario>` (una por fila del esquema Gherkin) y pruebas del repositorio para: 29 de febrero de un año bisiesto aceptado, límite exacto `31/12/(año+100)` aceptado y `1/1/(año+101)` rechazado. Se mantienen los datos de ejemplo de 2027.

## Risks / Trade-offs

- **Datos de ejemplo con fechas relativas** → Las pruebas existentes usan fechas futuras fijas (2027) y las nuevas se calculan a partir del año actual (el 29/02 de un año no bisiesto determinado dinámicamente, `hoy - 1 día`, `1/1/(año+101)`), para no depender del día en que se ejecuten.
- **Cambio de regla por paso del tiempo** → Un viaje válido hoy puede quedar en el pasado; no se revalida lo ya registrado, porque está fuera del alcance.
- **Mensaje único** → El formulario no resalta cada campo; si se quisiera, sería un ajuste de interfaz posterior.
