# Verificación técnica de HU-02 — Reserva múltiple

**Fecha:** 2026-11-22  
**Cambio:** `ajuste-hu-02-reserva-multiple`  
**Estado:** implementación verificada; pendiente de validación de aceptación del estudiante.

## Autorización y trazabilidad

El estudiante confirmó el informe, los cinco puntos de validación, la ficha y
las especificaciones; después autorizó «si, implementa». Fuente: ficha
`.cin324/historias/HU-02.md` y artefactos actualizados en el commit `8bb3d96`.
Se implementaron CU-02, DSS-01 y las transiciones de EST-01 correspondientes a
HU-02: registro Pendiente de pago y vencimiento completo de la reserva.

## Comprobaciones ejecutadas

- `npm test` (invocado con `npm.cmd` en PowerShell): **89/89 pruebas**, 10 archivos.
- `npm run typecheck` (invocado con `npm.cmd`): correcto.
- Migración 004→005 en SQLite en memoria: conserva IDs, códigos, pasajeros,
  asientos, estados, vencimientos pendientes e historial de un asiento
  reutilizado; claves foráneas correctas y migración no reaplicada.
- Dos clientes de demostración no pueden seleccionar el mismo asiento ni
  confirmar retenciones ajenas mediante un identificador enviado en el formulario.
- El primer vencimiento libera toda la reserva pendiente una sola vez, sin
  afectar asientos reocupados posteriormente ni reservas Pagadas.
- Temporizador real del servidor probado con reloj controlado: regularización
  al arrancar y liberación sin tráfico HTTP; cierre limpia temporizador y conexión.

## Recorrido HTTP integrado

Se inició el servidor en puerto libre con SQLite temporal en memoria y los datos
de V-001. Dos clientes con cookies independientes simularon dos navegadores.
Se verificó la secuencia completa mediante solicitudes HTTP reales:

1. Primer cliente retiene asiento 1; segundo cliente intenta el mismo y recibe 400.
2. Dos minutos después el primer cliente retiene asiento 2.
3. La confirmación de ida y vuelta sin lugar de regreso devuelve 400.
4. La confirmación corregida con `Terminal Norte` devuelve 201 y un código único
   R-001 con los dos asientos y sus pasajeros.
5. La consulta por código muestra el lugar de regreso.
6. Al primer vencimiento, la consulta muestra Vencida y V-001 recupera sus 17 cupos.
7. El segundo cliente registra una reserva de un asiento sin ida y vuelta y sin
   lugar de regreso; devuelve 201.
8. Se registran tres solicitudes al Servicio de correo simulado, una por pasajero.

La comprobación no usó ni migró el archivo `data/app.db` del estudiante. El
recorrido visual en navegador y la aceptación del cliente corresponden al
estudiante: la guía de los nueve escenarios está en `README.md`.

## Próximo paso

Probar la interfaz como cliente con `/cin324-validar-sistema` y registrar cualquier
observación. Archivar y sincronizar solo después de la aceptación, reconciliando
el cambio histórico de HU-02 para no publicar reglas antiguas sobre las nuevas.
