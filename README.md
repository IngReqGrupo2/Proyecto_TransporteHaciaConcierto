# Transporte hacia Concierto

Aplicación web del proyecto de Ingeniería de Requisitos (CIN 324). Se genera historia por historia desde los artefactos del repositorio; este primer cambio implementa **HU-01 — Consultar la cartelera de viajes**.

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

Si el entorno bloquea los scripts de instalación de paquetes, aprueba la compilación de `better-sqlite3`:

```bash
npm install-scripts approve better-sqlite3
npm rebuild better-sqlite3
```

## Datos de ejemplo

```bash
npm run db:seed
```

El script es idempotente y carga tres eventos y tres viajes:

| Viaje | Estado | Cupos | Uso |
|-------|--------|-------|-----|
| `V-001` | Publicado | 12 | Aparece en la cartelera |
| `V-002` | Publicado | 0 | No aparece en la cartelera, pero su detalle muestra 0 cupos |
| `V-003` | Borrador | 17 | No aparece y su detalle responde 404 |

## Ejecutar

```bash
npm run dev
```

Abre <http://localhost:3000>.

## Rutas

| Método y ruta | Qué hace |
|---------------|----------|
| `GET /` | Redirige a `/cartelera` |
| `GET /cartelera` | Lista los viajes publicados con cupos disponibles; si no hay, muestra «No hay viajes disponibles» |
| `GET /cartelera/:idViaje` | Muestra el detalle y los cupos del viaje; responde 404 si no existe o no está publicado |

No hay autenticación real: la cabecera indica «Rol de demostración: Pasajero». Esta historia no integra sistemas externos.

## Pruebas

```bash
npm test
npm run typecheck
```

Las pruebas usan una base SQLite en memoria y cubren los escenarios de HU-01, los filtros de disponibilidad y los casos 404.

## Estructura

```text
src/
  app.ts                  # fábrica de la aplicación Express
  server.ts               # arranque del servidor
  db/
    conexion.ts           # conexión SQLite y migraciones
    migrations/           # 001_crear_evento.sql, 002_crear_viaje.sql
    seed.ts               # datos de ejemplo idempotentes
  dominio/
    viaje.ts              # tipos y repositorio de Viaje/Evento
  rutas/
    cartelera.ts          # rutas de HU-01 / CU-01
  util/formato.ts         # formato de montos
  vistas/                 # plantillas EJS
public/estilos.css
tests/                    # pruebas por escenario y casos de borde
```

## Reiniciar la base de datos

Borra `data/app.db` y vuelve a ejecutar:

```bash
npm run db:seed
```

## Trazabilidad

- Historia: `04-historias-usuario.md` (HU-01)
- Gherkin: `07-criterios-aceptacion.md`
- Actividad TO-BE: «Seleccionar viaje»
- Caso de uso: CU-01 «Consultar cartelera de viajes»
- Requisito funcional: RP-02
- Ficha confirmada: `.cin324/historias/HU-01.md`
- Cambio de OpenSpec: `openspec/changes/hu-01-consultar-cartelera/`
