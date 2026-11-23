import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { BaseDeDatos } from '../src/db/conexion';
import { ServicioPagos } from '../src/dominio/pago';
import { ReservaRepositorio } from '../src/dominio/reserva';
import { PasarelaPagoSimulada } from '../src/integraciones/pasarela-pago';
import { crearBaseDePrueba, sembrarViaje } from './ayudas';

describe('HU-05 · Coordinador de pagos', () => {
  let db: BaseDeDatos;
  let fecha: Date;
  let reservas: ReservaRepositorio;
  let servicio: ServicioPagos;
  beforeEach(() => {
    db = crearBaseDePrueba();
    sembrarViaje(db, { cuposDisponibles: 17 });
    fecha = new Date('2026-11-22T12:00:00Z');
    reservas = new ReservaRepositorio(db, () => fecha);
    servicio = new ServicioPagos(db, new PasarelaPagoSimulada(db, () => fecha), () => fecha);
  });
  afterEach(() => db.close());
  function registrar(idaYVuelta = false) {
    for (const id of [1, 2]) reservas.retenerAsiento('V-001', String(id), 'A');
    return reservas.registrarReserva('V-001', 'A', { idaYVuelta, lugarRegreso: idaYVuelta ? 'Terminal' : '',
      pasajeros: [1, 2].map((id) => ({ idAsiento: String(id), rut: `${id}23K`, nombres: 'Ana', apellidos: 'Rojas',
        telefono: '123', correoElectronico: `ana${id}@ejemplo.cl` })) });
  }

  it.each([false, true])('calcula el total sin recargo y reutiliza la sesión pendiente (ida y vuelta: %s)', (modalidad) => {
    const r = registrar(modalidad);
    const primero = servicio.iniciarPago(r.codigoReserva);
    expect(primero.pago.monto).toBe(30000);
    expect(servicio.iniciarPago(r.codigoReserva)).toEqual(primero);
    db.prepare("UPDATE pago SET estado='Rechazado' WHERE id_pago=?").run(primero.pago.idPago);
    const segundo = servicio.iniciarPago(r.codigoReserva);
    expect(segundo.pago.idPago).not.toBe(primero.pago.idPago);
    expect(servicio.pagos.listarPorReserva(r.idReserva).map((p) => p.estado)).toEqual(['Rechazado', 'Pendiente']);
    db.prepare("UPDATE pago SET estado='Cancelado' WHERE id_pago=?").run(segundo.pago.idPago);
    expect(servicio.iniciarPago(r.codigoReserva).pago.monto).toBe(30000);
    expect(reservas.buscarPorCodigo(r.codigoReserva)?.detalles[0]?.asiento.vencimientoRetencion)
      .toBe('2026-11-22T12:08:00.000Z');
  });

  it('impide iniciar después de vencer, mantiene la liberación y no inventa plazos nulos', () => {
    const r = registrar();
    fecha = new Date('2026-11-22T12:08:00Z');
    expect(() => servicio.iniciarPago(r.codigoReserva)).toThrow('vencida');
    expect(reservas.buscarPorCodigo(r.codigoReserva)?.estado).toBe('Vencida');
    expect(servicio.pagos.listarPorReserva(r.idReserva)).toEqual([]);
    expect(db.prepare('SELECT cupos_disponibles FROM viaje').get()).toEqual({ cupos_disponibles: 17 });
    expect(() => servicio.iniciarPago('no-existe')).toThrow('No se encontró');
    fecha = new Date('2026-11-22T12:10:00Z');
    const otra = registrar();
    db.exec('UPDATE asiento SET vencimiento_retencion=NULL WHERE id_reserva_vigente IS NOT NULL');
    expect(() => servicio.iniciarPago(otra.codigoReserva)).toThrow('plazo vigente');
    db.exec("UPDATE reserva SET estado='Pagada'");
    expect(() => servicio.iniciarPago(otra.codigoReserva)).toThrow('ya está pagada');
  });

  it('confirma la reserva completa antes del límite sin volver a descontar y no vence después', () => {
    const r = registrar();
    const { pago } = servicio.iniciarPago(r.codigoReserva);
    fecha = new Date('2026-11-22T12:07:59.999Z');
    expect(servicio.simularResultado(pago.idPago, 'Aprobado', 'Tarjeta de crédito').estado).toBe('Aprobado');
    fecha = new Date('2026-11-22T12:20:00Z');
    reservas.procesarVencimientos();
    expect(reservas.buscarPorCodigo(r.codigoReserva)?.estado).toBe('Pagada');
    expect(db.prepare('SELECT cupos_disponibles FROM viaje').get()).toEqual({ cupos_disponibles: 15 });
    expect(db.prepare('SELECT * FROM asiento WHERE id_reserva_vigente=?').all(r.idReserva)).toHaveLength(2);
    expect(() => reservas.transicionarReserva({ tipo: 'vencerRetencion', idReserva: r.idReserva })).toThrow();
  });

  it.each(['Rechazado', 'Cancelado'] as const)('conserva plazos tras resultado %s', (resultado) => {
    const r = registrar();
    const antes = reservas.buscarPorCodigo(r.codigoReserva);
    const { pago } = servicio.iniciarPago(r.codigoReserva);
    fecha = new Date('2026-11-22T12:03:00Z');
    expect(servicio.simularResultado(pago.idPago, resultado, 'Tarjeta de débito').estado).toBe(resultado);
    expect(reservas.buscarPorCodigo(r.codigoReserva)).toEqual(antes);
  });

  it('solicita devolución al límite exacto una sola vez y protege un asiento reasignado', () => {
    const r = registrar();
    const { pago } = servicio.iniciarPago(r.codigoReserva);
    fecha = new Date('2026-11-22T12:08:00Z');
    reservas.retenerAsiento('V-001', '1', 'B');
    const asientoDeB = db.prepare('SELECT * FROM asiento WHERE id_asiento=1').get();
    const aprobado = servicio.simularResultado(pago.idPago, 'Aprobado', 'Tarjeta de débito');
    expect(aprobado).toMatchObject({ estado: 'Aprobado', monto: 30000,
      claveDevolucion: `devolucion:${pago.idPago}`, solicitudDevolucionEn: fecha.toISOString(), devolucionConfirmadaEn: null });
    expect(servicio.simularResultado(pago.idPago, 'Aprobado', 'Tarjeta de débito')).toEqual(aprobado);
    expect(reservas.buscarPorCodigo(r.codigoReserva)?.estado).toBe('Vencida');
    expect(db.prepare('SELECT * FROM asiento WHERE id_asiento=1').get()).toEqual(asientoDeB);
    expect(db.prepare("SELECT * FROM integraciones_log WHERE mensaje='Solicitud de devolución completa'").all()).toHaveLength(1);
    expect(db.prepare('SELECT cupos_disponibles FROM viaje').get()).toEqual({ cupos_disponibles: 16 });
  });

  it('confirma solo una devolución completa solicitada y la conserva al recrear el coordinador', () => {
    const r = registrar();
    const { pago } = servicio.iniciarPago(r.codigoReserva);
    expect(() => servicio.confirmarDevolucion(pago.idPago)).toThrow('No existe');
    fecha = new Date('2026-11-22T12:09:00Z');
    servicio.simularResultado(pago.idPago, 'Aprobado', 'Tarjeta de débito');
    servicio = new ServicioPagos(db, new PasarelaPagoSimulada(db), () => fecha);
    expect(() => servicio.confirmarDevolucion(pago.idPago, 1)).toThrow('monto y clave');
    expect(() => servicio.confirmarDevolucion(pago.idPago, 30000, 'otra')).toThrow('monto y clave');
    const devuelto = servicio.confirmarDevolucion(pago.idPago);
    expect(devuelto).toMatchObject({ estado: 'Devuelto', devolucionConfirmadaEn: fecha.toISOString() });
    expect(servicio.confirmarDevolucion(pago.idPago)).toEqual(devuelto);
    expect(reservas.buscarPorCodigo(r.codigoReserva)?.estado).toBe('Vencida');
    expect(db.prepare('SELECT cupos_disponibles FROM viaje').get()).toEqual({ cupos_disponibles: 17 });
    expect(db.prepare("SELECT * FROM integraciones_log WHERE mensaje='Confirmación de devolución completa'").all()).toHaveLength(1);
  });

  it('rechaza referencias, montos y resultados contradictorios y no regresa Devuelto a Aprobado', () => {
    const r = registrar();
    const { pago } = servicio.iniciarPago(r.codigoReserva);
    const mensaje = { referenciaPasarela: pago.referenciaPasarela, monto: pago.monto,
      resultado: 'Aprobado' as const, medioPago: 'Tarjeta de débito' as const };
    expect(() => servicio.procesarResultado({ ...mensaje, referenciaPasarela: 'ajena' })).toThrow('No se encontró');
    expect(() => servicio.procesarResultado({ ...mensaje, monto: 1 })).toThrow('no es válido');
    fecha = new Date('2026-11-22T12:09:00Z');
    servicio.procesarResultado(mensaje);
    const devuelto = servicio.confirmarDevolucion(pago.idPago);
    const antes = db.prepare('SELECT * FROM integraciones_log').all();
    expect(servicio.procesarResultado(mensaje)).toEqual(devuelto);
    expect(() => servicio.procesarResultado({ ...mensaje, resultado: 'Rechazado' })).toThrow('contradice');
    expect(() => servicio.procesarResultado({ ...mensaje, medioPago: 'Tarjeta de crédito' })).toThrow('contradice');
    expect(db.prepare('SELECT * FROM integraciones_log').all()).toEqual(antes);
    expect(servicio.pagos.buscar(pago.idPago)?.estado).toBe('Devuelto');
  });
});
