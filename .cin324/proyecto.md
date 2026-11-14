# Estado del proyecto — generación de la aplicación

## Proyecto
- Nombre: Transporte hacia Concierto
- Repositorio de documentación: esta carpeta
- Última auditoría: 2026-11-14 — resultado: con supuestos

## Mapa de artefactos (rutas detectadas)
| Artefacto | Ruta(s) | Estado |
|-----------|---------|--------|
| BPMN AS-IS | `01-proceso-as-is.md`, `diagramas/as-is.bpmn`, `diagramas/as-is.png` | completo |
| BPMN TO-BE | `02-rediseno-to-be.md`, `diagramas/to-be.bpmn`, `diagramas/to-be.png` | completo |
| Historias de usuario | `04-historias-usuario.md` (HU-01 a HU-05) | completo |
| Criterios Gherkin | `07-criterios-aceptacion.md` | completo |
| Modelo de dominio | `08-modelo-dominio.md`, `diagramas/modelo-dominio.puml`. `.png` | completo |
| Casos de uso | `09-casos-de-uso.md`, `diagramas/casos-de-uso.drawio`, `.png` | completo |
| Diagramas de estado | `11-diagramas-estado.md`, `diagramas/est-01.puml`, `est-02.puml` | completo |
| Diagramas de secuencia | `10-diagramas-secuencia.md`, `diagramas/dss-01.mmd`, `dss-02.mmd` | completo |
| Requisitos y atributos de calidad | `03-requisitos.md`, `06-atributos-calidad.md` | completo |

## Supuestos acordados (por elementos faltantes o dudosos)
- 2026-11-14, confirmado por el estudiante:
  - Las actividades TO-BE «Generar lista digital de pasajeros y pasar lista» (HU-04) y «Pagar viaje» (HU-05) se consideran equivalentes a «Recibir lista de pasajeros y pasar lista» y «Rellenar y enviar datos de pago / Verificar realización del pago», respectivamente.
  - Pasar lista es una actividad manual; el sistema solo registra la asistencia y la confirmación de abordaje del administrador.
  - El asistente de viaje no forma parte del sistema: el administrador concentra la gestión de nómina y registro de abordaje (RP-08 no se implementa como rol aparte).
  - El servicio de correo y la pasarela de pago se simulan como sistemas externos (interfaz + implementación simulada).
  - Se corrigió `12-trazabilidad.md`: se eliminó la referencia obsoleta a `CU-05` en `DSS-02`.

## Stack (se define una sola vez)
- Lenguaje y framework: TypeScript + Express + EJS
- Base de datos: SQLite con `better-sqlite3` — archivo `data/app.db`
- Pruebas: Vitest + supertest
- Cómo instalar: `npm install`
- Cómo ejecutar: `npm run db:seed && npm run dev` — URL: http://localhost:3000
- Cómo probar: `npm test`

## Historias
| Historia | Estado | Cambio de OpenSpec | Fecha | Observaciones |
|----------|--------|--------------------|-------|----------------|
| HU-01 | generada, pendiente de validación | `hu-01-consultar-cartelera` | 2026-11-14 | Consultar cartelera (CU-01). Implementada; 15 pruebas pasan. Ficha `.cin324/historias/HU-01.md` |
| HU-02 | pendiente | — | — | Registrar reserva y pasajero (CU-02, DSS-01, EST-01) |
| HU-03 | pendiente | — | — | Crear viaje (CU-04) |
| HU-04 | pendiente | — | — | Visualizar pasajeros (CU-05) |
| HU-05 | pendiente | — | — | Pagar reserva (CU-03, DSS-02, EST-01/02) |

## Validaciones
| Historia | Informe | Estado | Fecha |
|----------|---------|--------|-------|
| — | — | — | — |

## Cambios posteriores
| Cambio | Historia afectada | Motivo | Fecha |
|--------|-------------------|--------|-------|
| — | — | — | — |
