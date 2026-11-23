# Design

## Context

Ver `proposal.md` para motivación y alcance y `.cin324/historias/HU-02.md` para la ficha confirmada. El diseño es necesario por el cambio de modelo, la migración de datos existentes y la coordinación entre disponibilidad, formularios y vencimiento.

Estado observado:
- `src/dominio/reserva.ts` inserta una Reserva con `id_pasajero`, `id_asiento` y `vencimiento_retencion`; descuenta el cupo al confirmar. No hay retención previa ni proceso de expiración.
- La migración 004 impone una reserva vigente por asiento mediante un índice parcial. `aplicarMigraciones` ejecuta cada nueva migración en una transacción con claves foráneas activas.
- `src/rutas/reservas.ts` recibe datos planos de un único pasajero y las vistas muestran un único asiento. `crearApp` usa formularios sin estructuras anidadas ni identidad de cliente.
- El adaptador de correo recibe una reserva de un asiento y guarda una llamada simulada.
- La cartelera lee `cupos_disponibles` persistidos. El seed vuelve a escribir los cupos iniciales al ejecutarse, aunque existan reservas: debe pasar a conservar la ocupación real.
- Los cambios anteriores no están archivados y `openspec/specs/` no contiene capacidades publicadas. Se conserva el nombre `registro-reservas` con un delta ADDED completo, sin alterar los cambios históricos.

## Goals / Non-Goals

**Goals:**
- Mantener el monolito Express/EJS con SQLite y las convenciones en español, sin nuevas dependencias previstas.
- Conservar los datos existentes, el historial de detalles y las URLs de consulta.
- Centralizar transiciones y asegurar transacciones atómicas y vencimientos comprobables con reloj inyectado.
- Representar la pertenencia de una retención a su cliente mediante un dato técnico de demostración.

**Non-Goals:**
- No agregar clases de negocio para sesiones, cobros o borradores; la identificación de retenciones es infraestructura mínima.
- No introducir servicios externos reales, autenticación, colas, cron ni frontend separado.
- No implementar eventos de pago, devoluciones ni asistencia; se respetan las reservas Pagadas ya presentes.

## Decisions

### 1. Reserva y DetalleReserva derivados del modelo vigente

Agregar `src/db/migrations/005_reserva_multiple.sql` sin modificar las migraciones 001–004.

| Tabla | Estructura y restricciones |
|---|---|
| `reserva` | Conservar `id_reserva`, `codigo_reserva` único, `id_viaje`, `fecha_registro` y `estado`. Agregar `ida_y_vuelta` (0/1, por defecto 0) y `lugar_regreso` opcional. Estados restringidos a Pendiente de pago, Pagada y Vencida. CHECK para lugar no vacío si `ida_y_vuelta = 1`. Índice único `(id_viaje, id_reserva)` para referencias compuestas. |
| `detalle_reserva` | `id_detalle_reserva`, `id_reserva`, `id_viaje`, `id_asiento` e `id_pasajero` obligatorios. Único `(id_reserva, id_asiento)`. Claves compuestas a Reserva y Asiento mediante `id_viaje` impiden mezclar viajes. Composición desde Reserva con `ON DELETE CASCADE`; referencia a Pasajero restrictiva. |
| `asiento` | Conservar identificación, viaje y número. Agregar `vencimiento_retencion` opcional, `cliente_retencion` opcional e `id_reserva_vigente` opcional con referencia a Reserva. Índices para localizar vencimientos y asignaciones vigentes. |

`cliente_retencion` y `id_reserva_vigente` son columnas técnicas para resolver la retención y asignación única actual; no son nuevas entidades ni atributos de negocio. Cada fila de Asiento es la única fuente de ocupación actual; DetalleReserva conserva las asignaciones históricas. No se mantiene el antiguo índice de Reserva por asiento porque esa relación pasa a los detalles.

Al confirmar se enlaza `id_reserva_vigente` en cada asiento y se conserva su vencimiento, retirando la titularidad de borrador. Un asiento ya asignado a una reserva vigente nunca puede adquirirse como retención libre. La inserción de detalles y el enlace de todos los asientos ocurren dentro de una misma transacción; la capa de dominio comprueba que no exista otra asignación vigente.

Alternativa descartada: guardar listas de asientos/pasajeros en JSON o mantener un pasajero principal en Reserva. Ambas ocultan las asociaciones y multiplicidades del modelo.

### 2. Identidad de cliente de demostración y selección incremental

Generar un identificador aleatorio de cliente con `crypto.randomUUID()` en una cookie de sesión `clienteReserva`, con `Path=/`, `HttpOnly` y `SameSite=Lax`. Leerla mediante un pequeño helper, sin dependencia de sesiones ni autenticación. La titularidad procede de la cookie, nunca de un identificador recibido en el formulario. Navegadores o perfiles privados distintos representan clientes distintos; pestañas del mismo navegador comparten cliente y selección del mismo viaje.

Seleccionar un asiento equivale a enviar un formulario al endpoint de retención; no basta con marcar un control local. El servidor retiene inmediatamente y redirige al formulario que muestra los asientos propios retenidos con sus vencimientos. Repetir la selección propia vigente es idempotente y no renueva el plazo. La selección termina al confirmar o vencer; no se agrega una funcionalidad de cancelación de reserva o liberación voluntaria no documentada.

Alternativa descartada: retener todos los asientos únicamente al pulsar «Confirmar reserva», porque contradice el inicio del plazo en DSS-01.

### 3. Dominio transaccional y comprobación de titularidad

Extender `ReservaRepositorio` y sus tipos en `src/dominio/reserva.ts`:
- Asiento expone el vencimiento; Reserva expone modalidad y no contiene un asiento/pasajero directo; su consulta incluye una colección de detalles con sus pasajeros y asientos.
- `retenerAsiento` valida viaje publicado, asiento del mismo viaje, disponibilidad y cupo; asigna al cliente y guarda `ahora + 8 minutos`, con descuento dentro de la misma transacción. Si ya está retenido por ese cliente, devuelve el vencimiento original.
- `registrarReserva` recibe cliente, viaje, modalidad, lugar de regreso y una colección de datos de pasajeros identificada por asiento. Rechaza colección vacía, asientos repetidos, ajenos al viaje, asignados o retenidos por otro cliente, o cualquier vencimiento `<= ahora`.
- Se validan todos los datos antes de insertar; luego se crean/reutilizan pasajeros, se genera un código consecutivo, se crea la reserva con sus detalles y se asignan sus asientos. No se cambian cupos ni vencimientos al confirmar.
- Se conservan la normalización de RUT y la reutilización de datos existentes. No se agrega una nueva regla que prohíba el mismo RUT en distintos detalles; si aparece, se reutiliza el pasajero.
- La selección enviada se valida explícitamente: no se omite silenciosamente un asiento vencido para registrar una reserva más pequeña.
- Reenviar una confirmación cuyos asientos ya están asignados se rechaza sin otra reserva ni notificaciones.

Las operaciones de selección y confirmación usan transacciones de escritura serializadas de SQLite. Inyectar `ahora: () => Date` y obtener un único instante por operación. Procesar vencimientos antes de la transacción de confirmación, de modo que un rechazo no revierta accidentalmente liberaciones ya debidas.

Alternativa descartada: registrar una reserva por asiento y agrupar códigos en pantalla, porque no cumple el código único ni la atomicidad de una sola reserva.

### 4. Transiciones y vencimientos centralizados

Una función central de dominio aplica las transiciones de Reserva usadas en HU-02, con origen, evento, guarda y acción:

| Origen | Evento | Guarda y acción | Destino |
|---|---|---|---|
| Inicial | `registrarReserva` | Todos los datos y retenciones válidos; insertar reserva, detalles y enlaces sin redescuento | Pendiente de pago |
| Pendiente de pago | `vencerRetencion` | Algún asiento alcanza su vencimiento; liberar todos los asientos todavía asignados a esa reserva y restituir sus cupos | Vencida |

Un evento no permitido se rechaza con mensaje claro. El barrido solo envía `vencerRetencion` a reservas pendientes que cumplen la guarda; no cambia reservas Pagadas ni vuelve a liberar reservas Vencidas.

El barrido procesa primero reservas pendientes cuyo primer asiento venció y luego retenciones sin reserva vencidas. Solo libera asientos que aún pertenezcan a esa reserva o retención; limpia titularidad, vencimiento y asignación, y restituye exactamente los cupos realmente liberados. Así, un detalle histórico no puede liberar un asiento ya retomado por otro cliente.

Ejecutar el mismo barrido:
1. Al iniciar el servidor, después de las migraciones.
2. En un temporizador de un segundo en `src/server.ts`, con liberación del temporizador al cerrar y `unref()`.
3. Antes de atender las consultas de cartelera/detalle y el flujo de reserva, y desde las operaciones relevantes de repositorio. Las solicitudes no dependen de que haya transcurrido el siguiente tick.

El temporizador es un mecanismo técnico propuesto; la regla de negocio sigue siendo exactamente el límite de 8 minutos. Si el proceso estaba detenido, los vencimientos se regularizan al arrancar antes de mostrar disponibilidad. La liberación lógica se considera desde `vencimiento <= ahora`.

Alternativa descartada: solo comprobar vencimientos al pagar, ya que HU-02 exige liberar cupos incluso si el cliente abandona la reserva.

### 5. Rutas y formularios derivados de DSS-01

| Ruta | Mensaje de DSS-01 / respuesta |
|---|---|
| `GET /cartelera/:idViaje/reservar` | Presentar asientos disponibles y propios retenidos, con formulario de un pasajero por asiento. Permitir continuar con retenciones propias aunque ya no queden cupos libres. |
| `POST /cartelera/:idViaje/retenciones` | «Selecciona un asiento del viaje». Recibir `idAsiento`, retener para la cookie del cliente y responder 303 a la pantalla de reserva; en error responder 400 con mensaje visible. |
| `POST /cartelera/:idViaje/reservar` | «Confirma la operación». Recibir datos por asiento y modalidad; responder 201 con reserva única o 400 con errores por campo; 404 para viaje inexistente/no publicado. |
| `GET /reservas/:codigoReserva` | «Consulta la reserva mediante su código». Mostrar todos los detalles y modalidad; 404 si no existe, conservando normalización del código. |

Usar `express.urlencoded({ extended: true })` para datos `pasajeros[<idAsiento>][rut]`, `nombres`, `apellidos`, `telefono`, `correoElectronico`, más `idaYVuelta` y `lugarRegreso`. Validar su estructura en el servidor; IDs y campos repetidos o tipos inesperados no deben producir una confirmación parcial o un error 500.

Actualizar `reserva-nueva.ejs`, `reserva-creada.ejs` y `reserva-detalle.ejs`. Formularios HTML renderizados en servidor: botones para seleccionar asientos, vencimientos visibles, un bloque de datos por asiento retenido, selector de modalidad y lugar de regreso con indicación de obligatoriedad condicional validada por servidor. Los errores conservan valores válidos y retenciones no vencidas sin prolongarlas. No es necesario un framework ni JavaScript para retener un asiento.

Mensajes propuestos para aprobar junto con las especificaciones:
- Sin disponibilidad: «No hay cupos disponibles para el asiento seleccionado.» (se conserva).
- Selección inválida/vencida: «La selección ya no está disponible o alguna retención venció. Revisa tu selección.».
- Falta lugar de regreso: «El lugar de regreso es obligatorio para una reserva de ida y vuelta.».
- Selección vacía: «Selecciona al menos un asiento para registrar la reserva.».
- Datos de pasajero: conservar la indicación de campos obligatorios y localizarla en el asiento/pasajero correspondiente.

### 6. Correo simulado por pasajero

Conservar la interfaz ServicioCorreo y su implementación simulada. Ajustar el mensaje para incluir el código único y el asiento/detalle del destinatario. Después del commit de la reserva, la ruta solicita la notificación para cada pasajero identificado, sin abortar las demás si falla una llamada simulada. Si un pasajero aparece en varios detalles, se solicita una notificación por pasajero único con sus asientos. Una confirmación rechazada no genera llamadas.

Alternativa descartada: integrar un proveedor real de correo o una cola; la documentación acordada solo exige la simulación. No se define reintento automático ni se promete entrega real.

### 7. Migración, seed y verificación

La migración usa una copia temporal transaccional de las filas antiguas para reconstruir Reserva sin sus campos de asiento/pasajero, crear DetalleReserva y copiar un detalle por cada reserva anterior. Conserva IDs y códigos; establece `ida_y_vuelta = 0` y `lugar_regreso = NULL`. Las reservas pendientes conservan su vencimiento original en Asiento; las pagadas mantienen asignación sin vencimiento activo; las vencidas conservan detalles históricos sin ocupar asientos. Una reserva histórica vencida no debe sobrescribir el asiento usado por una reserva posterior vigente.

Actualizar el seed para que repetirlo no reponga cupos ocupados: conservar retenciones/asignaciones y calcular los cupos desde los asientos efectivamente libres, con normalización previa de vencimientos. No crear reservas de ejemplo sobre las del usuario; se utilizan los viajes existentes, especialmente V-001, para la prueba manual.

Actualizar las pruebas anteriores que suponen una reserva por asiento. Mantener la cobertura de RUT, códigos, campos, 404, atomicidad y disponibilidad. Agregar una prueba de integración con nombre exacto `HU-02 · <escenario>` por cada uno de los nueve escenarios de `07`; usar clientes `request.agent` distintos y reloj inyectado en `crearApp` para vencimientos sin esperas reales. Verificar además migración 004→005 en memoria, vencimiento sin reserva, límite exacto, plazo idempotente, reservas pagadas, reocupación posterior y seed repetido con asientos ocupados.

## Risks / Trade-offs

- Reconstrucción de Reserva con datos existentes → usar la transacción del migrador, conservar copia temporal hasta terminar y verificar claves foráneas, historiales y códigos en pruebas de migración. No ejecutar pruebas sobre `data/app.db` del estudiante.
- Barrido seguido de un error de confirmación → separar la regularización de vencimientos de la transacción que puede rechazarse.
- Dos clientes intentan seleccionar el mismo asiento → validación y asignación transaccionales sobre la fila única de Asiento; probar que solo uno obtiene el cupo.
- Pérdida de la cookie o abandono del formulario → los asientos se liberan al vencer; no se reinicia el plazo ni se implementa recuperación de una selección anónima.
- Cambio histórico `hu-02-registrar-reserva` aún sin archivar → antes de sincronizar al cierre, reconciliar los deltas para que las reglas antiguas no vuelvan a publicarse sobre las nuevas; no se archiva durante la planificación.

## Migration Plan

1. Implementar y verificar el ajuste usando SQLite en memoria o una base temporal, sin modificar el archivo real durante las pruebas.
2. Al arrancar la versión actualizada, aplicar 005 con el migrador existente y ejecutar el primer barrido antes de atender consultas. No se requiere borrar ni volver a sembrar la base.
3. Verificar con una reserva previa y otra nueva que ambas se consultan por código, y comprobar cupos/retenciones con dos clientes.
4. Si la migración falla, la transacción revierte y no registra 005 como aplicada. Tras una migración exitosa, el código antiguo no es compatible con el nuevo esquema; una reversión operativa requiere restaurar una copia previa de la base junto con el código anterior, sin descartar nuevas reservas silenciosamente.
5. Tras la aceptación del estudiante, archivar y sincronizar mediante el flujo de cierre, resolviendo primero el delta histórico de HU-02. Mantener `.cin324/proyecto.md` actualizado.
