# Transporte hacia Concierto

Aplicación web del proyecto de Ingeniería de Requisitos (CIN 324). Se genera historia por historia desde los artefactos del repositorio; los cambios implementados son **HU-01 — Consultar la cartelera de viajes**, **HU-02 — Registrar reserva y pasajero** y **HU-03 — Crear un viaje en el sistema**.

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

## Ejecutar

```bash
npm run db:seed && npm run dev
```

Abre <http://localhost:3000>.

## Rutas

| Método y ruta | Qué hace |
|---------------|----------|
| `GET /` | Redirige a `/cartelera` |
| `GET /cartelera` | Lista los viajes publicados con cupos disponibles y muestra la capacidad y los cupos de cada uno; si no hay, muestra «No hay viajes disponibles» |
| `GET /cartelera/:idViaje` | Muestra el detalle, la capacidad y los cupos del viaje; si no tiene cupos, muestra «No hay cupos disponibles para este viaje.»; responde 404 si no existe o no está publicado |
| `GET /cartelera/:idViaje/reservar` | Muestra el formulario para elegir un asiento disponible y registrar al pasajero; responde 400 si el viaje no tiene cupos |
| `POST /cartelera/:idViaje/reservar` | Registra la reserva en estado «Pendiente de pago», ocupa el asiento, descuenta un cupo y solicita la notificación simulada; responde 201 o 400 con los errores |
| `GET /reservas/:codigoReserva` | Muestra el pasajero, el viaje, el asiento y el estado de la reserva; responde 404 si no existe |
| `GET /admin/viajes/nuevo` | Formulario para crear y publicar un viaje con el rol de demostración «Administrador» |
| `POST /admin/viajes` | Valida y crea el evento, el vehículo y el viaje; responde 201 con la confirmación o 400 con los errores |

No hay autenticación real: la cabecera indica «Rol de demostración: Pasajero» y las rutas `/admin` muestran «Administrador». El Servicio de correo se simula: cada notificación de registro exitoso queda en la tabla `integraciones_log`, pero no se envía un correo real.

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

- El asiento debe pertenecer al viaje seleccionado y estar libre.
- Un asiento admite una sola reserva vigente («Pendiente de pago» o «Pagada»); las reservas vencidas quedan como histórico.
- Si el asiento ya está retenido o el viaje no tiene cupos, no se crea la reserva y se muestra «No hay cupos disponibles para el asiento seleccionado.».
- Todos los datos del pasajero son obligatorios: RUT, nombres, apellidos, teléfono y correo electrónico.
- El RUT se normaliza a mayúsculas y sin puntos, guiones ni espacios; si el pasajero ya existe se reutiliza sin duplicarlo.
- La reserva queda en estado «Pendiente de pago», con código consecutivo `R-001`, `R-002`, etc. y una retención de 8 minutos (`fechaRegistro + 8 minutos`).
- La reserva, el pasajero, el asiento ocupado y el descuento del cupo se guardan en una sola transacción.

## Pruebas

```bash
npm test
npm run typecheck
```

Las pruebas usan una base SQLite en memoria y cubren los escenarios de HU-01, HU-02 y HU-03 (campos faltantes y señalados, costo inválido, patente válida e inválida, fechas inválidas, nombres con al menos una letra, fecha del viaje no posterior a la del evento, descripción ingresada y vacía, capacidad, vehículo reutilizado, identificador consecutivo, reserva de un asiento disponible, rechazo de un asiento ocupado o de un viaje sin cupos, consulta de la reserva, reutilización del pasajero por RUT, retención de 8 minutos y unicidad de la reserva vigente), además de las migraciones y los datos de ejemplo.

## Estructura

```text
src/
  app.ts                  # fábrica de la aplicación Express
  server.ts               # arranque del servidor
  db/
    conexion.ts           # conexión SQLite y migraciones
    migrations/           # 001_evento, 002_viaje, 003_vehiculo, 004_reserva, 005_descripcion
    seed.ts               # datos de ejemplo idempotentes
  dominio/
    viaje.ts              # tipos y repositorio de Evento/Vehiculo/Viaje
    reserva.ts            # tipos y repositorio de Pasajero/Asiento/Reserva
  integraciones/
    correo.ts             # Servicio de correo simulado
  rutas/
    cartelera.ts          # rutas de HU-01 / CU-01
    reservas.ts           # rutas de HU-02 / CU-02
    admin-viajes.ts       # rutas de HU-03 / CU-04
  util/formato.ts         # formato de montos y fechas
  vistas/                 # plantillas EJS (cartelera, detalle, reservas y admin)
public/estilos.css
tests/                    # pruebas por escenario y casos de borde
```

## Reiniciar la base de datos

Borra `data/app.db` y vuelve a ejecutar:

```bash
npm run db:seed
```

## Trazabilidad

- **HU-01** · Actividad TO-BE «Seleccionar viaje» · CU-01 «Consultar cartelera de viajes» · RP-02 · ficha `.cin324/historias/HU-01.md` · cambio `openspec/changes/hu-01-consultar-cartelera/`
- **HU-02** · Actividades TO-BE «Seleccionar cupos e ingresar datos de pasajeros» y «Reservar cupos seleccionados y actualizar cupos» · CU-02 «Reservar asiento» · RP-03, RP-05, RP-11, RP-12 y RP-D01 · DSS-01 y EST-01 · ficha `.cin324/historias/HU-02.md` · cambio `openspec/changes/hu-02-registrar-reserva/`
- **HU-03** · Actividad TO-BE «Publicar viaje con su costo, hora de salida y lugar de encuentro» · CU-04 «Crear viaje» · RP-01 (RP-03 y RP-11 como contexto) · ficha `.cin324/historias/HU-03.md` · cambio `openspec/changes/hu-03-crear-viaje/`
- Historias: `04-historias-usuario.md`
- Gherkin: `07-criterios-aceptacion.md`
