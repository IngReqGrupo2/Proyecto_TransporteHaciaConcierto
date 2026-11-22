import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { aplicarMigraciones } from '../src/db/conexion';
import { ReservaRepositorio } from '../src/dominio/reserva';
import { crearBaseDePrueba, sembrarViaje } from './ayudas';

describe('HU-02 · Migración de reserva múltiple', () => {
  it('deriva columnas, restricciones y composición del modelo de dominio', () => {
    const db = crearBaseDePrueba();
    try {
      sembrarViaje(db, { cuposDisponibles: 17 });
      sembrarViaje(db, { idViaje: 'V-002', idEvento: 2, cuposDisponibles: 17 });
      const columnas = (tabla: string) =>
        (db.prepare(`PRAGMA table_info(${tabla})`).all() as Array<{ name: string }>)
          .map((fila) => fila.name);
      expect(columnas('reserva')).toEqual(expect.arrayContaining(['ida_y_vuelta', 'lugar_regreso']));
      expect(columnas('reserva')).not.toContain('id_pasajero');
      expect(columnas('asiento')).toEqual(expect.arrayContaining([
        'vencimiento_retencion', 'cliente_retencion', 'id_reserva_vigente',
      ]));
      db.exec(`INSERT INTO pasajero VALUES (1, '123K', 'Ana', 'Rojas', '123', 'ana@ejemplo.cl')`);
      const crear = db.prepare(`INSERT INTO reserva
        (codigo_reserva, id_viaje, fecha_registro, ida_y_vuelta, lugar_regreso)
        VALUES (?, 'V-001', '2026-11-22T12:00:00.000Z', ?, ?)`);
      expect(() => crear.run('R-001', 1, ' ')).toThrow();
      expect(() => crear.run('R-001', 2, null)).toThrow();
      const id = crear.run('R-001', 1, 'Plaza').lastInsertRowid;
      const detalle = db.prepare(`INSERT INTO detalle_reserva
        (id_reserva, id_viaje, id_asiento, id_pasajero) VALUES (?, ?, ?, 1)`);
      expect(() => detalle.run(id, 'V-002', 18)).toThrow();
      expect(() => detalle.run(id, 'V-001', 18)).toThrow();
      detalle.run(id, 'V-001', 1);
      expect(() => detalle.run(id, 'V-001', 1)).toThrow();
      db.prepare('DELETE FROM reserva WHERE id_reserva = ?').run(id);
      expect(db.prepare('SELECT * FROM detalle_reserva').all()).toEqual([]);
      expect(db.pragma('foreign_key_check')).toEqual([]);
    } finally { db.close(); }
  });

  it('conserva reservas 004, vencimientos y asignación posterior de un asiento histórico', () => {
    const db = new Database(':memory:');
    db.pragma('foreign_keys = ON');
    try {
      db.exec('CREATE TABLE schema_migrations (nombre TEXT PRIMARY KEY, aplicada_en TEXT NOT NULL)');
      for (const nombre of [
        '001_crear_evento.sql', '002_crear_viaje.sql',
        '003_crear_vehiculo_y_asignaciones.sql', '004_crear_pasajero_asiento_reserva.sql',
      ]) {
        db.exec(fs.readFileSync(path.join(process.cwd(), 'src/db/migrations', nombre), 'utf8'));
        db.prepare('INSERT INTO schema_migrations VALUES (?, ?)').run(nombre, '2026-11-19');
      }
      sembrarViaje(db, { cuposDisponibles: 17 });
      db.exec(`INSERT INTO pasajero VALUES (1, '123K', 'Ana', 'Rojas', '123', 'ana@ejemplo.cl')`);
      const insertar = db.prepare(`INSERT INTO reserva
        (id_reserva, codigo_reserva, id_pasajero, id_viaje, id_asiento,
         fecha_registro, vencimiento_retencion, estado)
        VALUES (?, ?, 1, 'V-001', ?, '2026-11-22T12:00:00.000Z', ?, ?)`);
      insertar.run(1, 'R-001', 1, '2026-11-22T12:08:00.000Z', 'Vencida');
      insertar.run(2, 'R-002', 1, '2026-11-22T12:09:00.000Z', 'Pendiente de pago');
      insertar.run(3, 'R-003', 2, '2026-11-22T12:10:00.000Z', 'Pagada');
      insertar.run(4, 'R-004', 3, '2026-11-22T12:11:00.000Z', 'Vencida');
      aplicarMigraciones(db);
      const reservas = db.prepare('SELECT * FROM reserva ORDER BY id_reserva').all();
      expect(reservas).toHaveLength(4);
      expect(reservas[1]).toMatchObject({ id_reserva: 2, codigo_reserva: 'R-002',
        estado: 'Pendiente de pago', ida_y_vuelta: 0, lugar_regreso: null });
      expect(db.prepare('SELECT * FROM detalle_reserva').all()).toHaveLength(4);
      expect(db.prepare('SELECT * FROM asiento WHERE numero = 1').get()).toMatchObject({
        id_reserva_vigente: 2, vencimiento_retencion: '2026-11-22T12:09:00.000Z',
      });
      expect(db.prepare('SELECT * FROM asiento WHERE numero = 2').get()).toMatchObject({
        id_reserva_vigente: 3, vencimiento_retencion: null,
      });
      expect(db.prepare('SELECT * FROM asiento WHERE numero = 3').get()).toMatchObject({
        id_reserva_vigente: null, vencimiento_retencion: null,
      });
      expect(db.prepare('SELECT cupos_disponibles FROM viaje').get()).toEqual({ cupos_disponibles: 15 });
      expect(db.pragma('foreign_key_check')).toEqual([]);
      aplicarMigraciones(db);
      expect(db.prepare('SELECT * FROM reserva ORDER BY id_reserva').all()).toEqual(reservas);
      const repo = new ReservaRepositorio(db, () => new Date('2026-11-22T12:01:00.000Z'));
      expect(repo.buscarPorCodigo('R-002')).toMatchObject({
        codigoReserva: 'R-002', idaYVuelta: false, lugarRegreso: null,
        detalles: [{ asiento: { numero: 1 }, pasajero: { nombres: 'Ana' } }],
      });
    } finally { db.close(); }
  });
});
