import { describe, expect, it } from 'vitest';
import { PagoRepositorio } from '../src/dominio/pago';
import { PasarelaPagoSimulada } from '../src/integraciones/pasarela-pago';
import { crearBaseDePrueba, sembrarViaje } from './ayudas';

describe('HU-05 · Pasarela simulada', () => {
  it('correlaciona mensajes y persiste una sola aceptación y confirmación por clave', () => {
    const db = crearBaseDePrueba();
    try {
      sembrarViaje(db);
      db.exec("INSERT INTO reserva (codigo_reserva,id_viaje,fecha_registro) VALUES ('R-001','V-001','2026-11-22')");
      const repo = new PagoRepositorio(db);
      const pago = repo.crearPendiente(1, 30000, new Date('2026-11-22T12:00:00Z'));
      const pasarela = new PasarelaPagoSimulada(db);
      expect(pasarela.iniciarPago(pago, 'R-001')).toBe(`/simulacion/pasarela/${pago.idPago}`);
      pasarela.iniciarPago(pago, 'R-001');
      expect(pasarela.notificarResultado(pago, 'Aprobado', 'Tarjeta de débito')).toMatchObject({
        referenciaPasarela: pago.referenciaPasarela, monto: 30000, resultado: 'Aprobado',
      });
      expect(() => pasarela.solicitarDevolucion(pago)).toThrow('No existe');
      db.prepare(`UPDATE pago SET estado='Aprobado',medio_pago='Tarjeta de débito',fecha_pago='2026-11-22',
        clave_devolucion=?,solicitud_devolucion_en='2026-11-22' WHERE id_pago=?`)
        .run(`devolucion:${pago.idPago}`, pago.idPago);
      const solicitado = repo.buscar(pago.idPago)!;
      pasarela.solicitarDevolucion(solicitado);
      new PasarelaPagoSimulada(db).solicitarDevolucion(solicitado);
      const logs = () => db.prepare("SELECT mensaje FROM integraciones_log WHERE sistema='Pasarela de pago'").all();
      expect(logs()).toHaveLength(3);
      expect(repo.buscar(pago.idPago)?.estado).toBe('Aprobado');
      pasarela.confirmarDevolucion(solicitado);
      pasarela.confirmarDevolucion(solicitado);
      expect(logs()).toHaveLength(4);
      expect(() => pasarela.iniciarPago({ ...pago, monto: 1 }, 'R-001')).toThrow('monto');
      expect(() => pasarela.notificarResultado(pago, 'Rechazado', 'Tarjeta de débito')).toThrow('contradice');
    } finally { db.close(); }
  });
});
