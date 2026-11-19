# Design — Ajuste HU-03: nombres válidos, orden de fechas y error junto al campo

## Context

Ver `proposal.md`. `ViajeRepositorio.crearViaje` (`src/dominio/viaje.ts`) ya normaliza los datos y lanza `ErrorValidacion(campos, mensaje)` con la lista de campos culpables; la ruta `src/rutas/admin-viajes.ts` la convierte en un 400 que vuelve a renderizar el formulario y descarta `campos`. La vista `src/vistas/admin/viaje-nuevo.ejs` muestra un único `<p class="mensaje-error">` al inicio y no marca los campos. `conductor_asignado` y `asistente_asignado` son texto libre en SQLite y `fecha_viaje`/`fecha_evento` son texto `AAAA-MM-DD`.

## Goals / Non-Goals

**Goals:**

- Rechazar nombres sin al menos una letra y fechas del viaje posteriores a la del evento antes de abrir la transacción.
- Mostrar el mensaje junto al campo culpable y marcarlo como inválido, conservando la entrada y el mensaje general.
- Cubrir los escenarios nuevos del Gherkin con pruebas automáticas.

**Non-Goals:**

- Cambiar el modelo de dominio, el esquema de la base de datos o la cartelera.
- Validar horas, coherencia entre hora de salida y regreso, ni reescribir viajes existentes.
- Rediseñar el formulario o validar en el navegador las reglas nuevas.

## Decisions

1. **Reglas en el dominio.** En `crearViaje`, después de validar el calendario de ambas fechas: (a) comparar `limpios.fechaViaje > limpios.eventoFecha` como cadenas `AAAA-MM-DD` ya validadas (el orden lexicográfico coincide con el cronológico en ese formato) y lanzar `ErrorValidacion(['fechaViaje'], 'La fecha del viaje no puede ser posterior a la fecha del evento.')`; (b) exigir `/[a-záéíóúüñ]/i` en `conductor` y `asistente`, con mensajes `El nombre del conductor debe contener al menos una letra.` y `El nombre del asistente debe contener al menos una letra.` respectivamente. Alternativa descartada: `CHECK` en SQLite, que no puede expresar el orden entre columnas de tablas distintas ni dar mensajes por campo.

2. **Orden de validaciones.** Obligatorios → calendario de fechas → orden entre fechas → nombres → costo → patente. Así, una fecha inexistente se informa como fecha y no como error de orden, y los escenarios de nombres y de orden reciben datos por lo demás válidos.

3. **Trasladar `campos` a la vista.** La ruta arma `errores: Record<string, string>` mapeando cada campo de `error.campos` al `error.message` y lo pasa a `admin/viaje-nuevo`, junto con `error` (mensaje general). En la vista, cada `<input>` agrega `class="campo-invalido"` y `aria-invalid="true"` cuando su campo está en `errores`, y después del input se renderiza `<span class="mensaje-campo" role="alert">`. Alternativa descartada: un solo mensaje general, que es justamente lo que la observación OBS-3 rechaza.

4. **Estilos por campo.** En `public/estilos.css` se agregan `.formulario-viaje .campo-invalido` (borde y fondo rojizos) y `.formulario-viaje .mensaje-campo` (texto pequeño en rojo), coherentes con la paleta actual; no se reestructura el formulario.

5. **Mensaje repetido en errores múltiples.** Cuando faltan varios campos obligatorios, el mismo mensaje general aparece bajo cada campo faltante. Se acepta por simplicidad; el marcado de cada campo es lo que exige CA7. Alternativa descartada: mensajes por campo en el dominio, que obligaría a cambiar la estructura de `ErrorValidacion` y de las pruebas existentes.

6. **Pruebas por escenario.** En `tests/admin-viajes.test.ts` se agregan pruebas HTTP nombradas `HU-03 · <escenario>`: conductor numérico, asistente numérico, fecha del viaje posterior, mismo día aceptado, patente marcada y campos faltantes marcados. En `tests/crear-viaje.test.ts` se agregan pruebas del repositorio para nombres con solo números y para el límite del mismo día, además de verificar que no se creó el evento ni el vehículo.

## Risks / Trade-offs

- **Mismo mensaje bajo varios campos** → Aceptado; se documenta en la decisión 5.
- **Marcado solo del lado del servidor** → El navegador no resalta el campo antes de enviar; la regla se aplica igualmente en el servidor y las pruebas HTTP lo verifican.
- **Comparación lexicográfica de fechas** → Solo es válida con el formato `AAAA-MM-DD` estricto, que `validarFechaCalendario` ya garantiza antes de comparar.

## Migration Plan

Sin migraciones ni cambios de datos. Las pruebas y la aplicación usan el mismo esquema; no hay pasos de reversión.
