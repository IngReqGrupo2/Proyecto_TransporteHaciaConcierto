import { describe, expect, it } from 'vitest';
import { PagoRepositorio } from '../src/dominio/pago';
import { crearBaseDePrueba, sembrarViaje } from './ayudas';

describe('HU-05 · PagoRepositorio', () => {
  it('persiste referencias únicas y consulta el historial sin crear pagos para reservas antiguas', () => {
    const db = crearBaseDePrueba();
    try {
      sembrarViaje(db);
      db.exec(`INSERT INTO reserva (codigo_reserva,id_viaje,fecha_registro,estado)
        VALUES ('R-001','V-001','2026-11-22','Pagada'), ('R-002','V-001','2026-11-22','Pendiente de pago')`);
      const repo = new PagoRepositorio(db);
      expect(repo.listarPorReserva(1)).toEqual([]);
      const primero = repo.crearPendiente(2, 30000, new Date('2026-11-22T12:00:00Z'));
      expect(repo.buscarPorReferencia(primero.referenciaPasarela)).toEqual(primero);
      expect(primero).toMatchObject({ idReserva: 2, monto: 30000, estado: 'Pendiente', medioPago: null });
      db.prepare("UPDATE pago SET estado = 'Cancelado' WHERE id_pago = ?").run(primero.idPago);
      const segundo = repo.crearPendiente(2, 30000, new Date('2026-11-22T12:01:00Z'));
      expect(segundo.idPago).not.toBe(primero.idPago);
      expect(segundo.referenciaPasarela).not.toBe(primero.referenciaPasarela);
      expect(repo.listarPorReserva(2).map((p) => p.estado)).toEqual(['Cancelado', 'Pendiente']);
      expect(repo.buscar('inexistente')).toBeUndefined();
      expect(repo.listarPorReserva(1)).toEqual([]);
    } finally { db.close(); }
  });
});
