import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { abrirBaseDeDatos } from '../src/db/conexion';
import { ServicioPagos } from '../src/dominio/pago';
import { ReservaRepositorio } from '../src/dominio/reserva';
import { PasarelaPagoSimulada } from '../src/integraciones/pasarela-pago';
import { sembrarViaje } from './ayudas';

describe('HU-05 · Atomicidad', () => {
  it('HU-05 · Fallo antes de completar el procesamiento de una aprobación', () => {
    const directorio = fs.mkdtempSync(path.join(os.tmpdir(), 'hu05-rollback-'));
    const ruta = path.join(directorio, 'app.db');
    const db = abrirBaseDeDatos(ruta);
    const lector = abrirBaseDeDatos(ruta);
    const ahora = () => new Date('2026-11-22T12:00:00Z');
    try {
      sembrarViaje(db, { cuposDisponibles: 17 });
      const repo = new ReservaRepositorio(db, ahora);
      repo.retenerAsiento('V-001', '1', 'A');
      const r = repo.registrarReserva('V-001', 'A', { pasajeros: [{ idAsiento: '1', rut: '123K', nombres: 'Ana',
        apellidos: 'Rojas', telefono: '123', correoElectronico: 'ana@ejemplo.cl' }], idaYVuelta: false, lugarRegreso: '' });
      const servicio = new ServicioPagos(db, new PasarelaPagoSimulada(db, ahora), ahora);
      const { pago } = servicio.iniciarPago(r.codigoReserva);
      const tablas = ['reserva', 'asiento', 'viaje', 'pago', 'integraciones_log'];
      const leer = () => tablas.map((t) => lector.prepare(`SELECT * FROM ${t}`).all());
      const antes = leer();
      db.exec(`CREATE TRIGGER falla_confirmacion AFTER UPDATE OF estado ON reserva
        WHEN NEW.estado='Pagada' BEGIN SELECT RAISE(ABORT, 'fallo antes del commit'); END;`);
      expect(() => servicio.simularResultado(pago.idPago, 'Aprobado', 'Tarjeta de débito')).toThrow('fallo antes del commit');
      expect(leer()).toEqual(antes);
      db.exec('DROP TRIGGER falla_confirmacion');
      servicio.simularResultado(pago.idPago, 'Aprobado', 'Tarjeta de débito');
      servicio.simularResultado(pago.idPago, 'Aprobado', 'Tarjeta de débito');
      expect(lector.prepare('SELECT estado FROM reserva').get()).toEqual({ estado: 'Pagada' });
      expect(lector.prepare("SELECT * FROM integraciones_log WHERE mensaje='Resultado de pago'").all()).toHaveLength(1);
      expect(lector.prepare('SELECT cupos_disponibles FROM viaje').get()).toEqual({ cupos_disponibles: 16 });
    } finally { lector.close(); db.close(); fs.rmSync(directorio, { recursive: true, force: true }); }
  });
});
