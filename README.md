# Transporte hacia Concierto

Aplicación web del proyecto de Ingeniería de Requisitos (CIN 324). Se genera historia por historia desde los artefactos del repositorio; los cambios implementados son **HU-01 — Consultar la cartelera de viajes** y **HU-03 — Crear un viaje en el sistema**.

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
| `V-001` | `LKPW42` · Mercedes-Benz Sprinter (17) | Publicado | 12 | Aparece en la cartelera |
| `V-002` | `BJYR68` · Hyundai H1 (10) | Publicado | 0 | No aparece en la cartelera, pero su detalle muestra 0 cupos |
| `V-003` | `LKPW42` · Mercedes-Benz Sprinter (17) | Borrador | 17 | No aparece y su detalle responde 404 |

## Ejecutar

```bash
npm run db:seed && npm run dev
```

Abre <http://localhost:3000>.

## Rutas

| Método y ruta | Qué hace |
|---------------|----------|
| `GET /` | Redirige a `/cartelera` |
| `GET /cartelera` | Lista los viajes publicados con cupos disponibles; si no hay, muestra «No hay viajes disponibles» |
| `GET /cartelera/:idViaje` | Muestra el detalle y los cupos del viaje; responde 404 si no existe o no está publicado |
| `GET /admin/viajes/nuevo` | Formulario para crear y publicar un viaje con el rol de demostración «Administrador» |
| `POST /admin/viajes` | Valida y crea el evento, el vehículo y el viaje; responde 201 con la confirmación o 400 con los errores |

No hay autenticación real: la cabecera indica «Rol de demostración: Pasajero» y las rutas `/admin` muestran «Administrador». Esta aplicación no integra sistemas externos.

### Validaciones al crear un viaje

- Todos los campos del formulario son obligatorios; si falta alguno, se marca cada campo faltante y no se registra nada.
- El costo debe ser un monto numérico mayor que cero.
- La patente debe tener el formato chileno actual: cuatro letras y dos dígitos (`AABB11`, por ejemplo `LKPW42`).
- Las fechas del evento y del viaje deben existir en el calendario, no ser anteriores a hoy y no superar el 31 de diciembre del año actual más 100 años.
- La fecha del viaje no puede ser posterior a la fecha del evento; el mismo día está permitido.
- El nombre del conductor y el del asistente deben contener al menos una letra (no pueden ser solo números).
- Cuando una validación falla, el mensaje aparece junto al campo afectado y el campo queda marcado como inválido, además del mensaje general.
- La capacidad se toma del vehículo y no puede superar los 17 pasajeros; los cupos disponibles iniciales son iguales a la capacidad.
- Si la patente ya existe, se reutiliza el vehículo registrado.
- El identificador del viaje es consecutivo: `V-001`, `V-002`, etc.

## Pruebas

```bash
npm test
npm run typecheck
```

Las pruebas usan una base SQLite en memoria y cubren los escenarios de HU-01 y HU-03 (campos faltantes y señalados, costo inválido, patente válida e inválida, fechas inválidas, nombres con al menos una letra, fecha del viaje no posterior a la del evento, capacidad, vehículo reutilizado e identificador consecutivo), además de las migraciones y los datos de ejemplo.

## Estructura

```text
src/
  app.ts                  # fábrica de la aplicación Express
  server.ts               # arranque del servidor
  db/
    conexion.ts           # conexión SQLite y migraciones
    migrations/           # 001_evento, 002_viaje, 003_vehiculo_y_asignaciones
    seed.ts               # datos de ejemplo idempotentes
  dominio/
    viaje.ts              # tipos y repositorio de Evento/Vehiculo/Viaje
  rutas/
    cartelera.ts          # rutas de HU-01 / CU-01
    admin-viajes.ts       # rutas de HU-03 / CU-04
  util/formato.ts         # formato de montos
  vistas/                 # plantillas EJS (cartelera, detalle y admin)
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
- **HU-03** · Actividad TO-BE «Publicar viaje con su costo, hora de salida y lugar de encuentro» · CU-04 «Crear viaje» · RP-01 (RP-03 y RP-11 como contexto) · ficha `.cin324/historias/HU-03.md` · cambio `openspec/changes/hu-03-crear-viaje/`
- Historias: `04-historias-usuario.md`
- Gherkin: `07-criterios-aceptacion.md`
