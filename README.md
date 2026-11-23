# Transporte hacia Concierto

Aplicación web del proyecto de Ingeniería de Requisitos (CIN 324). Historias implementadas: **HU-01 — Consultar la cartelera de viajes**, **HU-02 — Registrar reserva y pasajero**, **HU-03 — Crear un viaje en el sistema** y **HU-05 — Pagar reserva**. Para probar los pagos, sigue la [guía de HU-05](#validación-manual-de-hu-05).

## Stack

- TypeScript + Express + EJS
- SQLite con `better-sqlite3` (archivo `data/app.db`)
- Vitest + supertest

## Requisitos

- Node.js 20.19 o superior
- npm

## Instalación

```bash
npm install
```

Si la instalación intenta compilar `better-sqlite3` y falla porque no hay Visual Studio C++, instala sin scripts: el paquete incluye binarios precompilados y funciona igual.

```bash
npm install --ignore-scripts
```

## Datos de ejemplo

```bash
npm run db:seed
```

El script es idempotente y carga tres eventos, dos vehículos y tres viajes:

| Viaje | Vehículo | Estado | Cupos | Uso |
|-------|----------|--------|-------|-----|
| `V-001` | `LKPW42` · Mercedes-Benz Sprinter (17) | Publicado | 17 | Aparece en la cartelera y permite reservar sus asientos |
| `V-002` | `BJYR68` · Hyundai H1 (10) | Borrador | 10 | No aparece; su detalle responde 404 |
| `V-003` | `LKPW42` · Mercedes-Benz Sprinter (17) | Borrador | 17 | No aparece; su detalle responde 404 |

Cada viaje genera sus asientos al ser creado y el seed también los crea: `V-001` tiene 17 asientos, `V-002` tiene 10 y `V-003` tiene 17. Los tres viajes de ejemplo incluyen una descripción.

Repetir el seed conserva las retenciones, reservas e historial de pagos existentes. Los cupos se
recalculan desde los asientos libres después de procesar los vencimientos;
no se vuelve a ofrecer un asiento que siga retenido o asignado.

## Ejecutar

```bash
npm run db:seed && npm run dev
```

Abre <http://localhost:3000>.

En **Windows PowerShell 5.1**, usa los ejecutables `.cmd` y este comando de
preparación y arranque (compatible con la política de scripts de Windows):

```powershell
npm.cmd run db:seed; if ($?) { npm.cmd run dev }
```

Si necesitas instalar dependencias por primera vez, ejecuta `npm.cmd install`.
Para arrancar con tus datos existentes sin volver a sembrar, usa `npm.cmd run dev`.
Al abrir la aplicación verás la cartelera con el rol de demostración Pasajero;
«Crear viaje» abre el formulario del rol Administrador.

## Rutas

| Método y ruta | Qué hace |
|---------------|----------|
| `GET /` | Redirige a `/cartelera` |
| `GET /cartelera` | Lista los viajes publicados con cupos disponibles y muestra la capacidad y los cupos de cada uno; si no hay, muestra «No hay viajes disponibles» |
| `GET /cartelera/:idViaje` | Muestra el detalle, la capacidad y los cupos del viaje; si no tiene cupos, muestra «No hay cupos disponibles para este viaje.»; responde 404 si no existe o no está publicado |
| `GET /cartelera/:idViaje/reservar` | Muestra asientos libres y la selección retenida del cliente, con un formulario de pasajero por asiento; permite continuar con retenciones propias aunque no queden cupos libres |
| `POST /cartelera/:idViaje/retenciones` | Recibe `idAsiento`, retiene el asiento para el cliente durante 8 minutos y descuenta un cupo; redirige con 303 al formulario o responde 400 con el error |
| `POST /cartelera/:idViaje/reservar` | Registra la reserva y solicita el correo simulado sin renovar plazos. Ahora responde 303 (antes 201) hacia la pasarela; si vence entre el registro y el inicio del pago, redirige a la consulta. Responde 400 si los datos de registro son inválidos |
| `GET /reservas/:codigoReserva` | Muestra viaje, pasajeros, asientos, modalidad, estado e historial de intentos con monto, medio y resultado; responde 404 si la reserva no existe |
| `POST /reservas/:codigoReserva/pagos` | Inicia o reintenta el pago de una reserva pendiente con todas sus retenciones vigentes; responde 303 hacia la pasarela, 400 si no admite un intento o 404 si no existe |
| `GET /simulacion/pasarela/:idPago` | Muestra el resumen, total y controles de la pasarela simulada para el intento existente; responde 404 si no existe |
| `POST /simulacion/pasarela/:idPago/resultado` | Procesa aprobación, rechazo o cancelación simulados; responde 303 a la consulta, 400 si el resultado o medio es inválido o contradictorio, o 404 si no existe el intento |
| `POST /simulacion/pasarela/:idPago/confirmar-devolucion` | Simula la confirmación externa de una devolución ya solicitada; responde 303 a la consulta, 400 si no corresponde o 404 si no existe el intento |
| `GET /admin/viajes/nuevo` | Formulario para crear y publicar un viaje con el rol de demostración «Administrador» |
| `POST /admin/viajes` | Valida y crea el evento, el vehículo y el viaje; responde 201 con la confirmación o 400 con los errores |

No hay autenticación real: la cabecera indica «Rol de demostración: Pasajero» y las rutas `/admin` muestran «Administrador». El Servicio de correo se simula: cada notificación de registro exitoso queda en la tabla `integraciones_log`, pero no se envía un correo real.

En la pasarela no se ingresan datos bancarios. Cada intento empieza **Pendiente**. Un pago **Aprobado** dentro del plazo confirma toda la reserva; un intento **Rechazado** o **Cancelado** mantiene los plazos originales. Una aprobación tardía deja la reserva **Vencida** y el pago **Aprobado** con devolución solicitada. Solo la confirmación simulada cambia el pago a **Devuelto**. Los mensajes de la integración se registran en `integraciones_log` bajo «Pasarela de pago».

La cookie de sesión `clienteReserva` identifica al cliente de demostración que
retuvo los asientos. Las pestañas del mismo navegador comparten cliente y
selección del viaje; otro navegador o perfil privado representa otro cliente.
El servidor toma la titularidad de la cookie, no de los campos del formulario.

La confirmación envía `idaYVuelta` (`0` o `1`), `lugarRegreso` y, por cada asiento,
`pasajeros[<idAsiento>][idAsiento]`, `[rut]`, `[nombres]`, `[apellidos]`, `[telefono]`
y `[correoElectronico]`. El campo oculto `idAsiento` conserva el identificador al
interpretar las claves numéricas del formulario. No se admite la confirmación
antigua con un pasajero plano sin retención previa.

### Validaciones al crear un viaje

- Todos los campos del formulario son obligatorios, excepto la descripción; si falta uno obligatorio, se marca cada campo faltante y no se registra nada.
- La descripción es opcional: si se ingresa, se guarda con el viaje; si queda vacía o solo con espacios, el viaje se crea sin descripción (`NULL`).
- El costo debe ser un monto numérico mayor que cero.
- La patente debe tener el formato chileno actual: cuatro letras y dos dígitos (`AABB11`, por ejemplo `LKPW42`).
- Las fechas del evento y del viaje deben existir en el calendario, no ser anteriores a hoy y no superar el 31 de diciembre del año actual más 100 años.
- La fecha del viaje no puede ser posterior a la fecha del evento; el mismo día está permitido.
- El nombre del conductor y el del asistente deben contener al menos una letra (no pueden ser solo números).
- Cuando una validación falla, el mensaje aparece junto al campo afectado y el campo queda marcado como inválido, además del mensaje general.
- La capacidad se toma del vehículo y no puede superar los 17 pasajeros; los cupos disponibles iniciales son iguales a la capacidad.
- Si la patente ya existe, se reutiliza el vehículo registrado.
- El identificador del viaje es consecutivo: `V-001`, `V-002`, etc.
- El viaje genera sus asientos `1..capacidad` (máximo 17).

### Validaciones al reservar

- Los asientos deben pertenecer al mismo viaje publicado y estar libres al seleccionarlos.
- Cada selección retiene un asiento durante 8 minutos, guarda su vencimiento en `asiento` y descuenta exactamente un cupo. Repetir una selección vigente del mismo cliente conserva el plazo y no descuenta de nuevo.
- Un asiento admite una sola retención o asignación vigente. Las reservas vencidas conservan sus detalles históricos.
- Si otro cliente retuvo el asiento, ya está asignado o no quedan cupos, se muestra «No hay cupos disponibles para el asiento seleccionado.».
- Todos los datos de cada pasajero son obligatorios: RUT, nombres, apellidos, teléfono y correo electrónico.
- El RUT se normaliza a mayúsculas y sin puntos, guiones ni espacios; si el pasajero ya existe se reutiliza sin duplicarlo.
- La reserva queda en estado «Pendiente de pago», con un único código consecutivo `R-001`, `R-002`, etc. y un `detalle_reserva` por asiento/pasajero, conservando los vencimientos originales.
- Se valida toda la selección antes de guardar. Reserva, detalles, pasajeros nuevos y asignaciones se guardan en una transacción; confirmar no vuelve a descontar cupos. Si falla un asiento o un dato obligatorio, no se registra parcialmente la operación.
- Si incluye ida y vuelta, el lugar de regreso es obligatorio; si no, es opcional. El lugar solo se presenta como regreso de la reserva cuando incluye ida y vuelta.
- Si vence una retención sin reserva, se libera ese asiento. Si vence cualquiera de una reserva pendiente, vence toda la reserva y se liberan todos sus asientos/cupos una sola vez. Las reservas pagadas no vencen por sus antiguas retenciones.
- Se solicita una notificación simulada por pasajero; si el mismo pasajero ocupa varios detalles, recibe una sola notificación con sus asientos.

El servidor procesa vencimientos al arrancar, cada segundo y antes de las
solicitudes de disponibilidad o reserva. Al alcanzar el vencimiento, la retención
ya no es válida; no depende de que el usuario vuelva al formulario. Las páginas
abiertas muestran su última respuesta: recárgalas para ver los cupos o el estado
actualizado. Si el servidor estuvo detenido, regulariza los plazos al arrancar.

## Validación manual de HU-02

Abre <http://localhost:3000/cartelera/V-001/reservar>. V-001 corresponde a
«Concierto Rock en el Parque», con 17 asientos inicialmente. Usa asientos libres
para cada recorrido y **selecciona todos antes de completar los pasajeros**.
Las pestañas normales comparten selección; abre una ventana privada o un
navegador distinto para representar un segundo cliente.

Datos de ejemplo para los formularios:

| Pasajero | RUT | Nombres | Apellidos | Teléfono | Correo |
|---|---|---|---|---|---|
| 1 | `12.345.678-5` | Camila | Rojas | `+56912345678` | `camila@ejemplo.cl` |
| 2 | `11.111.111-1` | José | Pérez | `+56987654321` | `jose@ejemplo.cl` |

| Escenario Gherkin | Qué hacer | Resultado esperado |
|---|---|---|
| Retención de un asiento al seleccionarlo | Pulsa «Seleccionar Asiento N» y revisa el formulario. | Aparece un bloque de pasajero para ese asiento con su vencimiento a 8 minutos desde la selección; los cupos bajan en uno antes de confirmar. |
| Confirmación de una reserva con uno o varios asientos | Selecciona dos asientos, ingresa un pasajero por cada uno y confirma antes del primer vencimiento. | Una reserva Pendiente de pago, un código, dos pasajeros/asientos y los mismos vencimientos; no se descuentan cupos nuevamente. También se permite confirmar solo uno. |
| Selección de cupo no disponible | Abre el formulario en ambos navegadores antes de seleccionar. Selecciona un asiento en el primero y pulsa el mismo botón en la página aún abierta del segundo. | El segundo recibe «No hay cupos disponibles para el asiento seleccionado.» y no altera la selección del primero. |
| Consultar una reserva registrada | En la confirmación pulsa «Consultar esta reserva», o abre `/reservas/<codigo>` con el código mostrado. | Se muestran el viaje, todos los asientos con sus pasajeros, estado y modalidad; si es ida y vuelta, también el lugar de regreso. |
| Rechazo de la operación por pérdida de disponibilidad | Selecciona dos asientos dejando un intervalo entre ellos. Completa los datos y deja el formulario abierto hasta que venza el primero; entonces confirma esa selección original. | Se informa «La selección ya no está disponible o alguna retención venció. Revisa tu selección.» sin crear parcialmente la reserva. |
| Vencimiento de una reserva con varios asientos | Registra una reserva con dos asientos y espera al vencimiento más temprano. Recarga su consulta y el detalle del viaje. | Toda la reserva aparece Vencida y todos sus asientos/cupos vuelven a estar disponibles, aunque otro asiento tuviera un plazo posterior. |
| Registro del lugar de regreso | Selecciona al menos un asiento, completa sus pasajeros, elige «Sí, incluye ida y vuelta», ingresa `Terminal Norte` y confirma. | La confirmación y consulta muestran ida y vuelta y `Terminal Norte`. |
| Falta el lugar de regreso en una reserva de ida y vuelta | Completa pasajeros válidos, elige ida y vuelta y confirma sin lugar de regreso. | El registro se impide con «El lugar de regreso es obligatorio para una reserva de ida y vuelta.» junto al campo; se conservan los datos y plazos vigentes. |
| Reserva sin ida y vuelta | Completa los pasajeros, deja «No incluye ida y vuelta», no ingreses lugar de regreso y confirma. | Se registra correctamente y la consulta indica «No incluye ida y vuelta». |

La integración de correo **está simulada**: las solicitudes quedan en
`data/app.db`, tabla `integraciones_log`, con el destinatario, código único y
asientos del pasajero. No llegan mensajes a las direcciones de ejemplo.

## Validación manual de HU-05

Abre <http://localhost:3000/cartelera/V-001/reservar> con los datos de ejemplo cargados. Usa asientos libres y los datos de Camila y José de la sección anterior. Cada asiento de V-001 cuesta $15.000. Anota el código que aparece en la pasarela y crea una reserva nueva para cada recorrido que lo requiera.

| Escenario | Qué hacer | Resultado esperado |
|---|---|---|
| Redirección a pasarela | Selecciona asientos, completa el formulario y confirma antes del primer vencimiento. | Se abre «Pasarela de pago simulada», con un código de reserva y todos sus asientos. |
| Monto total de la reserva | Compara un asiento con dos; repite con ida y vuelta y lugar de regreso. | $15.000 por un asiento y $30.000 por dos; ida y vuelta no cambia el precio. |
| Pago exitoso | Elige crédito o débito y pulsa «Simular pago aprobado» antes del primer vencimiento. | Reserva **Pagada**, intento **Aprobado** y todos los asientos confirmados, sin otro descuento de cupos. |
| Pago fallido o cancelado | Elige un medio y pulsa «Simular pago rechazado», o pulsa «Cancelar operación». | «El pago no fue completado»; se conserva la reserva pendiente con sus plazos originales. |
| Reintento dentro del plazo original | Tras rechazar o cancelar, pulsa «Reintentar pago» antes del vencimiento. | Se abre otro intento por el total; la consulta conserva el anterior y los vencimientos no se reinician. |
| Vencimiento de una reserva pendiente | Selecciona dos asientos en momentos distintos, registra la reserva y espera hasta el primer vencimiento sin pagar. Recarga la consulta. | Toda la reserva queda **Vencida** y se liberan ambos asientos. |
| Impedir un nuevo intento de pago de una reserva vencida | Tras rechazar un intento, deja vencer la reserva y recarga. También puedes intentar el reintento desde una pestaña que quedó abierta. | No se ofrece otro intento en la consulta actualizada; si envías el formulario antiguo, se informa que la reserva está vencida. |
| Pago aprobado después del vencimiento | Deja abierta la pasarela hasta alcanzar el vencimiento y recién entonces simula la aprobación. | Reserva **Vencida**, intento **Aprobado** y devolución completa solicitada automáticamente. |
| Devolución solicitada aún no confirmada | Después de la aprobación tardía, recarga la consulta sin presionar el control de confirmación. | Se muestra la solicitud; el pago aún es **Aprobado** y el monto no se presenta como devuelto. |
| Devolución completa confirmada | Pulsa «Simular confirmación de devolución completa». | El pago pasa a **Devuelto**, la reserva sigue **Vencida** y se informa que el monto fue devuelto. |

Las pruebas automáticas ejercitan estos recorridos con un reloj controlado y también verifican la competencia entre aprobación y vencimiento, los mensajes duplicados y el rollback. La pasarela es simulada y su registro queda en `integraciones_log`.

## Pruebas

```bash
npm test
npm run typecheck
```

En Windows PowerShell: `npm.cmd test` y `npm.cmd run typecheck`.

La [verificación de HU-05](.cin324/validaciones/VER-HU-05-implementacion.md) obtuvo **135 pruebas correctas en 17 archivos**, además del chequeo de tipos. Las pruebas usan SQLite en memoria o en archivos temporales aislados.

- `tests/reservas.test.ts`: una prueba con el nombre de cada uno de los nueve escenarios Gherkin de HU-02, más RUT reutilizado, formularios mal formados, titularidad entre clientes, último cupo y errores de consulta.
- `tests/reserva-repositorio.test.ts`: plazos desde selección, idempotencia, rollback completo, guardas de transición y protección de asientos reocupados.
- `tests/reserva-migracion.test.ts` y `tests/migraciones.test.ts`: esquema, restricciones y migración 004→005 conservando reservas y sus historiales.
- `tests/servidor.test.ts`: regularización al arrancar y liberación por el temporizador sin solicitudes del usuario.
- `tests/seed.test.ts`: repetir el seed preservando reservas y retenciones.
- `tests/pagos.test.ts`: recorridos HTTP de pago con pasarela simulada.
- `tests/pago-atomicidad.test.ts` y `tests/pago-concurrencia.test.ts`: rollback, competencia entre aprobación y vencimiento, mensajes duplicados y reapertura de la base.
- Cobertura de escenarios de HU-01, HU-02 y HU-03 (incluidas validaciones de creación de viajes, fechas, patente, nombres, capacidad y reutilización del vehículo): campos faltantes y señalados, costo inválido, patente válida e inválida, fechas inválidas, nombres con al menos una letra, fecha del viaje no posterior a la del evento, descripción ingresada y vacía, capacidad, vehículo reutilizado, identificador consecutivo, reserva de un asiento disponible, rechazo de un asiento ocupado o de un viaje sin cupos, consulta de la reserva, reutilización del pasajero por RUT, retención de 8 minutos y unicidad de la reserva vigente, además de migraciones y datos de ejemplo.

## Estructura

```text
src/
  app.ts                  # fábrica de la aplicación Express
  server.ts               # arranque del servidor
  db/
    conexion.ts           # conexión SQLite y migraciones
    migrations/           # 001–004: modelo original; 005: descripción y reserva múltiple; 006: pagos
    seed.ts               # datos de ejemplo idempotentes
  dominio/
    viaje.ts              # tipos y repositorio de Evento/Vehiculo/Viaje
    reserva.ts            # Pasajero/Asiento/Reserva/DetalleReserva, retenciones y vencimientos
    pago.ts               # intentos de pago, resultados y devoluciones
  integraciones/
    correo.ts             # Servicio de correo simulado
    pasarela-pago.ts      # pasarela de pago simulada
  rutas/
    cartelera.ts          # rutas de HU-01 / CU-01
    reservas.ts           # rutas de HU-02 / CU-02
    admin-viajes.ts       # rutas de HU-03 / CU-04
    pagos.ts              # rutas de HU-05 / CU-03
  util/formato.ts         # formato de montos y fechas
  vistas/                 # plantillas EJS (cartelera, detalle, reservas y admin)
public/estilos.css
tests/                    # pruebas por escenario y casos de borde
```

## Actualización y reinicio de la base de datos

### Actualización de HU-02 sin perder reservas

Al arrancar se aplica automáticamente `005_reserva_multiple.sql`, después de las
migraciones anteriores. No es necesario borrar ni volver a sembrar `data/app.db`.
Cada reserva anterior conserva su identificador, código, viaje, pasajero y asiento
como una reserva con un detalle y sin ida y vuelta por defecto. Las pendientes
conservan su vencimiento original; las pagadas siguen ocupando su asiento y las
vencidas permanecen como historial. El nuevo esquema guarda los pasajeros y
asientos en `detalle_reserva` y el vencimiento en `asiento`, en lugar de los
campos directos de la antigua tabla `reserva`.

### Actualización de HU-05

Al arrancar, `006_crear_pago.sql` agrega la tabla de pagos y sus restricciones sin borrar `data/app.db` ni resembrar los datos. Conserva las reservas y los vencimientos que ya estén registrados. Una reserva antigua con un vencimiento faltante no puede iniciar un pago; el sistema no inventa un plazo nuevo.

### Reinicio opcional de los datos de demostración

Borra `data/app.db` y vuelve a ejecutar:

```bash
npm run db:seed
```

## Trazabilidad

- **HU-01** · Actividad TO-BE «Seleccionar viaje» · CU-01 «Consultar cartelera de viajes» · RP-02 · ficha `.cin324/historias/HU-01.md` · cambio `openspec/changes/hu-01-consultar-cartelera/`
- **HU-02** · Actividades TO-BE «Seleccionar cupos e ingresar datos de pasajeros», «Verificar cupo» y «Reservar cupos seleccionados y actualizar cupos» · CU-02 «Reservar asiento» · RP-03, RP-04, RP-05 y RP-D01 (RP-11/RP-12 como contexto) · DSS-01 y EST-01 · ficha `.cin324/historias/HU-02.md` · versión inicial `openspec/changes/hu-02-registrar-reserva/` y ajuste vigente `openspec/changes/ajuste-hu-02-reserva-multiple/`
- **HU-03** · Actividad TO-BE «Publicar viaje con su costo, hora de salida y lugar de encuentro» · CU-04 «Crear viaje» · RP-01 (RP-03 y RP-11 como contexto) · ficha `.cin324/historias/HU-03.md` · cambio `openspec/changes/hu-03-crear-viaje/`
- **HU-05** · Actividad TO-BE «Pagar viaje» · CU-03 · RP-06 · DSS-02 y EST-01/02 · ficha `.cin324/historias/HU-05.md` · [cambio archivado](openspec/changes/archive/2026-11-22-hu-05-pagar-reserva/)
- Historias: `04-historias-usuario.md`
- Gherkin: `07-criterios-aceptacion.md`
