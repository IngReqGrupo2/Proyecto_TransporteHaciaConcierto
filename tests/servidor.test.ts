import { once } from 'node:events';
import { describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { iniciarServidor } from '../src/server';
import { ReservaRepositorio } from '../src/dominio/reserva';
import { crearBaseDePrueba, sembrarViaje } from './ayudas';

describe('HU-02 · Vencimientos del servidor', () => {
  it('regulariza al arrancar y libera sin tráfico, manteniendo las consultas consistentes', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    const db = crearBaseDePrueba();
    sembrarViaje(db, { cuposDisponibles: 17 });
    let fecha = new Date('2026-11-22T12:00:00.000Z');
    const repo = new ReservaRepositorio(db, () => fecha);
    repo.retenerAsiento('V-001', '1', 'A');
    repo.registrarReserva('V-001', 'A', { pasajeros: [{ idAsiento: '1', rut: '123K', nombres: 'Ana',
      apellidos: 'Rojas', telefono: '123', correoElectronico: 'ana@ejemplo.cl' }], idaYVuelta: false, lugarRegreso: '' });
    fecha = new Date('2026-11-22T12:08:00.000Z');
    const servidor = iniciarServidor(db, 0, () => fecha);
    try {
      await once(servidor, 'listening');
      expect(db.prepare('SELECT estado FROM reserva').get()).toEqual({ estado: 'Vencida' });
      repo.retenerAsiento('V-001', '2', 'B');
      fecha = new Date('2026-11-22T12:16:00.000Z');
      await vi.advanceTimersByTimeAsync(1000);
      // Estas lecturas SQL no disparan el barrido: lo hizo el temporizador sin tráfico.
      expect(db.prepare('SELECT cliente_retencion FROM asiento WHERE id_asiento = 2').get())
        .toEqual({ cliente_retencion: null });
      expect(db.prepare('SELECT cupos_disponibles FROM viaje').get()).toEqual({ cupos_disponibles: 17 });
      const pagina = await request(servidor).get('/cartelera/V-001').expect(200);
      expect(pagina.text).toContain('17');
    } finally {
      await new Promise<void>((resolve, reject) => servidor.close((error) => error ? reject(error) : resolve()));
      expect(vi.getTimerCount()).toBe(0);
      vi.useRealTimers();
    }
  });
});
