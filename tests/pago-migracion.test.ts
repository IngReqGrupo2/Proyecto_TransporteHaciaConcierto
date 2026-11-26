import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { aplicarMigraciones } from '../src/db/conexion';
import { ReservaRepositorio } from '../src/dominio/reserva';
import { crearBaseDePrueba, sembrarViaje } from './ayudas';

describe('HU-05 · Migración aditiva de Pago', () => {
  it('preserva reservas al aplicar 006 a una base sin pagos', () => {
    const db = crearBaseDePrueba();
    try {
      expect(db.prepare("SELECT * FROM schema_migrations WHERE nombre = '006_crear_pago.sql'").all()).toHaveLength(1);
      expect(db.prepare('SELECT * FROM pago').all()).toEqual([]);
    } finally { db.close(); }
  });

  it('conserva viajes, reservas y pagos existentes tras la migración 007', () => {
    const db = new Database(':memory:');
    db.pragma('foreign_keys = ON');
    try {
      db.exec('CREATE TABLE schema_migrations (nombre TEXT PRIMARY KEY, aplicada_en TEXT NOT NULL)');
      const directorio = path.join(process.cwd(), 'src/db/migrations');
      for (const nombre of fs.readdirSync(directorio).filter((n) => n.endsWith('.sql') && n < '007').sort()) {
        db.exec(fs.readFileSync(path.join(directorio, nombre), 'utf8'));
        db.prepare('INSERT INTO schema_migrations VALUES (?, ?)').run(nombre, '2026-11-22');
      }
      sembrarViaje(db, { cuposDisponibles: 17 });
      const repo = new ReservaRepositorio(db, () => new Date('2026-11-22T12:00:00Z'));
      repo.retenerAsiento('V-001', '1', 'A');
      repo.registrarReserva('V-001', 'A', { pasajeros: [{ idAsiento: '1', rut: '123K', nombres: 'Ana',
        apellidos: 'Rojas', telefono: '123', correoElectronico: 'ana@ejemplo.cl' }], idaYVuelta: false, lugarRegreso: '' });
      repo.retenerAsiento('V-001', '2', 'B');
      db.exec(`UPDATE vehiculo SET capacidad_pasajeros = 10;
        UPDATE viaje SET capacidad = 10, cupos_disponibles = 8;
        DELETE FROM asiento WHERE numero > 10;
        INSERT INTO pago (id_pago,id_reserva,monto,creado_en,referencia_pasarela)
        VALUES ('P1',1,15000,'2026-11-22','REF-1');`);
      const tablas = ['reserva', 'detalle_reserva', 'pasajero', 'asiento', 'pago'];
      const historial = () => tablas.map((t) => db.prepare(`SELECT * FROM ${t}`).all());
      const antes = historial();
      aplicarMigraciones(db);
      aplicarMigraciones(db);
      expect(historial()).toEqual(antes);
      expect(db.prepare('SELECT id_viaje, capacidad, cupos_disponibles, estado_aprobacion FROM viaje').get())
        .toEqual({ id_viaje: 'V-001', capacidad: 10, cupos_disponibles: 8, estado_aprobacion: 'Aprobado' });
      expect(db.prepare('SELECT tipo, capacidad_pasajeros FROM vehiculo').get())
        .toEqual({ tipo: 'Minibús', capacidad_pasajeros: 17 });
      expect(db.prepare("SELECT * FROM schema_migrations WHERE nombre = '006_crear_pago.sql'").all()).toHaveLength(1);
      expect(db.prepare("SELECT * FROM schema_migrations WHERE nombre = '007_aprobacion_viajes.sql'").all()).toHaveLength(1);
      expect(db.pragma('foreign_key_check')).toEqual([]);
    } finally { db.close(); }
  });

  it('restringe referencia, reserva, estado, monto, clave y confirmación de devolución', () => {
    const db = crearBaseDePrueba();
    try {
      sembrarViaje(db);
      db.exec("INSERT INTO reserva (codigo_reserva,id_viaje,fecha_registro) VALUES ('R-001','V-001','2026-11-22')");
      const insertar = db.prepare(`INSERT INTO pago (id_pago,id_reserva,monto,creado_en,referencia_pasarela)
        VALUES (?, ?, ?, '2026-11-22', ?)`);
      insertar.run('P1', 1, 30000, 'S1');
      expect(() => insertar.run('P2', 1, 30000, 'S2')).toThrow();
      expect(() => insertar.run('P3', 999, 30000, 'S3')).toThrow();
      expect(() => insertar.run('P4', 1, 0, 'S4')).toThrow();
      expect(() => db.exec("UPDATE pago SET estado='otro'")).toThrow();
      expect(() => db.exec("UPDATE pago SET clave_devolucion='devolucion:P1'")).toThrow();
      db.exec("UPDATE pago SET estado='Aprobado',medio_pago='Tarjeta de débito',fecha_pago='2026-11-22'");
      expect(() => db.exec("UPDATE pago SET estado='Devuelto'")).toThrow();
      db.exec("UPDATE pago SET clave_devolucion='devolucion:P1',solicitud_devolucion_en='2026-11-22'");
      expect(() => db.exec("UPDATE pago SET clave_devolucion='otra'")).toThrow();
      db.exec("UPDATE pago SET estado='Devuelto',devolucion_confirmada_en='2026-11-22'");
      expect(() => insertar.run('P2', 1, 30000, 'S1')).toThrow();
      insertar.run('P2', 1, 30000, 'S2');
      expect(() => db.exec("DELETE FROM reserva WHERE id_reserva=1")).toThrow();
      expect(db.prepare('SELECT estado FROM pago WHERE id_pago=?').get('P1')).toEqual({ estado: 'Devuelto' });
    } finally { db.close(); }
  });
});
