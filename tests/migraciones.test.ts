import Database from 'better-sqlite3';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { aplicarMigraciones } from '../src/db/conexion';
import { crearBaseDePrueba, sembrarViaje } from './ayudas';

interface Columna {
  name: string;
  type: string;
}

describe('Migraciones de base de datos', () => {
  it('crea las tablas con tipos DATE y TIME y no reaplica migraciones', () => {
    const db = crearBaseDePrueba();

    const tablas = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
      .all() as Array<{ name: string }>;
    const nombres = tablas.map((tabla) => tabla.name);

    expect(nombres).toEqual(
      expect.arrayContaining([
        'evento',
        'viaje',
        'vehiculo',
        'pasajero',
        'asiento',
        'reserva',
        'integraciones_log',
        'schema_migrations',
      ]),
    );

    const indices = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'index'")
      .all() as Array<{ name: string }>;
    expect(indices.map((indice) => indice.name)).toEqual(
      expect.arrayContaining([
        'ux_asiento_viaje_id',
        'ux_reserva_asiento_activa',
      ]),
    );

    const columnasEvento = db
      .prepare('PRAGMA table_info(evento)')
      .all() as Columna[];
    expect(
      columnasEvento.find((columna) => columna.name === 'fecha_evento')?.type,
    ).toBe('DATE');

    const columnasViaje = db
      .prepare('PRAGMA table_info(viaje)')
      .all() as Columna[];
    expect(
      columnasViaje.find((columna) => columna.name === 'fecha_viaje')?.type,
    ).toBe('DATE');
    expect(
      columnasViaje.find((columna) => columna.name === 'hora_salida')?.type,
    ).toBe('TIME');

    const nombresColumnasViaje = columnasViaje.map((columna) => columna.name);
    expect(nombresColumnasViaje).toEqual(
      expect.arrayContaining([
        'id_vehiculo',
        'conductor_asignado',
        'asistente_asignado',
      ]),
    );

    const columnasVehiculo = db
      .prepare('PRAGMA table_info(vehiculo)')
      .all() as Columna[];
    expect(columnasVehiculo.map((columna) => columna.name)).toEqual(
      expect.arrayContaining([
        'id_vehiculo',
        'modelo',
        'patente',
        'capacidad_pasajeros',
      ]),
    );

    const vehiculoPorDefecto = db
      .prepare('SELECT patente FROM vehiculo WHERE id_vehiculo = 1')
      .get() as { patente: string } | undefined;
    expect(vehiculoPorDefecto?.patente).toBe('LKPW42');

    const rechazaCapacidadMayor = db
      .prepare(`
        INSERT INTO vehiculo (modelo, patente, capacidad_pasajeros)
        VALUES ('Bus grande', 'ZZZZ99', 18)
      `);
    expect(() => rechazaCapacidadMayor.run()).toThrow();

    const migracionesAntes = db
      .prepare('SELECT COUNT(*) AS total FROM schema_migrations')
      .get() as { total: number };

    aplicarMigraciones(db);

    const migracionesDespues = db
      .prepare('SELECT COUNT(*) AS total FROM schema_migrations')
      .get() as { total: number };
    expect(migracionesDespues.total).toBe(migracionesAntes.total);

    db.close();
  });

  it('completa con asientos los viajes existentes y recalcula sus cupos', () => {
    const directorio = fs.mkdtempSync(
      path.join(os.tmpdir(), 'cin324-migraciones-'),
    );
    const db = new Database(':memory:');
    db.pragma('foreign_keys = ON');

    try {
      for (const archivo of [
        '001_crear_evento.sql',
        '002_crear_viaje.sql',
        '003_crear_vehiculo_y_asignaciones.sql',
      ]) {
        fs.copyFileSync(
          path.join(process.cwd(), 'src', 'db', 'migrations', archivo),
          path.join(directorio, archivo),
        );
      }

      aplicarMigraciones(db, directorio);

      db.prepare(`
        INSERT INTO evento (id_evento, nombre, fecha_evento)
        VALUES (1, 'Evento previo', '2027-01-15')
      `).run();
      db.prepare(`
        INSERT INTO viaje (
          id_viaje, id_evento, id_vehiculo, fecha_viaje, hora_salida,
          hora_regreso, lugar_encuentro, costo, capacidad, cupos_disponibles,
          estado, conductor_asignado, asistente_asignado
        )
        VALUES (
          'V-001', 1, 1, '2027-01-15', '18:30', '02:00',
          'Plaza', 15000, 10, 10, 'Publicado', 'Carlos', 'Ana'
        )
      `).run();

      aplicarMigraciones(db);

      const asientos = db
        .prepare(`
          SELECT numero
          FROM asiento
          WHERE id_viaje = 'V-001'
          ORDER BY numero ASC
        `)
        .all() as Array<{ numero: number }>;
      const viaje = db
        .prepare(`
          SELECT cupos_disponibles AS cupos, capacidad
          FROM viaje
          WHERE id_viaje = 'V-001'
        `)
        .get() as { cupos: number; capacidad: number };

      expect(asientos.map((asiento) => asiento.numero)).toEqual(
        Array.from({ length: 10 }, (_, indice) => indice + 1),
      );
      expect(viaje).toEqual({ cupos: 10, capacidad: 10 });
    } finally {
      db.close();
      fs.rmSync(directorio, { recursive: true, force: true });
    }
  });

  it('permite una sola reserva vigente por asiento', () => {
    const db = crearBaseDePrueba();

    try {
      sembrarViaje(db, { capacidad: 17, cuposDisponibles: 17 });
      db.prepare(`
        INSERT INTO pasajero (rut, nombres, apellidos, telefono, correo_electronico)
        VALUES ('123456785', 'Camila', 'Rojas', '+56912345678', 'camila@ejemplo.cl')
      `).run();

      const asiento = db
        .prepare(`
          SELECT id_asiento AS idAsiento
          FROM asiento
          WHERE id_viaje = 'V-001' AND numero = 1
        `)
        .get() as { idAsiento: number };

      const insertar = db.prepare(`
        INSERT INTO reserva (
          codigo_reserva, id_pasajero, id_viaje, id_asiento,
          fecha_registro, vencimiento_retencion, estado
        )
        VALUES (?, 1, 'V-001', ?, '2026-11-19T12:00:00.000Z',
          '2026-11-19T12:08:00.000Z', ?)
      `);

      insertar.run('R-001', asiento.idAsiento, 'Pendiente de pago');
      expect(() =>
        insertar.run('R-002', asiento.idAsiento, 'Pagada'),
      ).toThrow();

      insertar.run('R-003', asiento.idAsiento, 'Vencida');
      const reservas = db
        .prepare('SELECT COUNT(*) AS total FROM reserva')
        .get() as { total: number };
      expect(reservas.total).toBe(2);
    } finally {
      db.close();
    }
  });
});
