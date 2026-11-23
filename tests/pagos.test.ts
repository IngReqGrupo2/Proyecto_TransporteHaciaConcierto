import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { crearApp } from '../src/app';
import type { BaseDeDatos } from '../src/db/conexion';
import { PagoRepositorio, type MedioPago, type ResultadoPago } from '../src/dominio/pago';
import { cargarDatosEjemplo } from '../src/db/seed';
import { crearBaseDePrueba } from './ayudas';
import { formularioReserva } from './ayudas-pagos';

describe('HU-05 · Pagar reserva', () => {
  let db: BaseDeDatos;
  let fecha: Date;
  let app: ReturnType<typeof crearApp>;
  let cliente: ReturnType<typeof request.agent>;
  let pagos: PagoRepositorio;
  beforeEach(() => {
    db = crearBaseDePrueba();
    fecha = new Date('2026-11-22T12:00:00Z');
    cargarDatosEjemplo(db, () => fecha);
    app = crearApp(db, { ahora: () => fecha });
    cliente = request.agent(app);
    pagos = new PagoRepositorio(db);
  });
  afterEach(() => db.close());
  async function registrar(ids = [1, 2], idaYVuelta = false) {
    for (const id of ids) await cliente.post('/cartelera/V-001/retenciones').type('form').send({ idAsiento: id }).expect(303);
    const registro = await cliente.post('/cartelera/V-001/reservar').type('form').send(formularioReserva(ids, idaYVuelta)).expect(303);
    const pago = pagos.listarPorReserva(1)[0]!;
    return { registro, pago, sesion: registro.headers.location as string };
  }
  const resultadoDe = (id: string, resultado: ResultadoPago, medioPago: MedioPago | '' = 'Tarjeta de débito') =>
    cliente.post(`/simulacion/pasarela/${id}/resultado`).type('form').send({ resultado, medioPago });
  const cupos = () => (db.prepare("SELECT cupos_disponibles AS cupos FROM viaje WHERE id_viaje='V-001'").get() as { cupos: number }).cupos;

  it('HU-05 · Redirección a pasarela', async () => {
    const { sesion, pago } = await registrar();
    expect(sesion).toBe(`/simulacion/pasarela/${pago.idPago}`);
    const vista = await cliente.get(sesion).expect(200);
    for (const texto of ['Pasarela de pago simulada', 'R-001', 'Camila Rojas', 'José Rojas', 'Asiento 1', 'Asiento 2']) {
      expect(vista.text).toContain(texto);
    }
    expect(pago.estado).toBe('Pendiente');
    expect(db.prepare('SELECT COUNT(*) AS total FROM reserva').get()).toEqual({ total: 1 });
    expect(db.prepare('SELECT vencimiento_retencion FROM asiento WHERE id_asiento=1').get())
      .toEqual({ vencimiento_retencion: '2026-11-22T12:08:00.000Z' });
  });

  it.each([{ ids: [1], vuelta: false, monto: 15000 }, { ids: [1, 2], vuelta: false, monto: 30000 },
    { ids: [1, 2], vuelta: true, monto: 30000 }])('HU-05 · Monto total de la reserva ($monto, vuelta: $vuelta)', async ({ ids, vuelta, monto }) => {
    const { sesion, pago } = await registrar(ids, vuelta);
    const vista = await cliente.get(sesion).expect(200);
    expect(pago.monto).toBe(monto);
    expect(vista.text).toContain(monto === 30000 ? '30.000' : '15.000');
    expect(vista.text).toContain('Tarjeta de crédito');
    expect(vista.text).toContain('Tarjeta de débito');
    expect(vista.text).toContain('value="Aprobado"');
    expect(vista.text).toContain('value="Rechazado"');
    expect(vista.text).toContain('value="Cancelado"');
    if (vuelta) expect(vista.text).toContain('Terminal Norte');
  });

  it.each(['Tarjeta de crédito', 'Tarjeta de débito'] as const)('HU-05 · Pago exitoso (%s)', async (medio) => {
    const { pago } = await registrar();
    fecha = new Date('2026-11-22T12:07:00Z');
    await resultadoDe(pago.idPago, 'Aprobado', medio).expect(303).expect('Location', '/reservas/R-001');
    const vista = await cliente.get('/reservas/R-001').expect(200);
    expect(vista.text).toContain('El pago confirmó la reserva.');
    expect(vista.text).toContain('Pagada');
    expect(vista.text).toContain(medio);
    expect(pagos.buscar(pago.idPago)?.estado).toBe('Aprobado');
    fecha = new Date('2026-11-22T12:09:00Z');
    await cliente.get('/reservas/R-001').expect(200);
    expect(cupos()).toBe(15);
    expect(db.prepare('SELECT * FROM asiento WHERE id_reserva_vigente=1').all()).toHaveLength(2);
  });

  it.each(['Rechazado', 'Cancelado'] as const)('HU-05 · Pago fallido o cancelado (%s)', async (resultado) => {
    const { pago } = await registrar();
    const plazos = db.prepare('SELECT vencimiento_retencion FROM asiento WHERE id_reserva_vigente=1').all();
    fecha = new Date('2026-11-22T12:03:00Z');
    await resultadoDe(pago.idPago, resultado, resultado === 'Cancelado' ? '' : 'Tarjeta de débito').expect(303);
    const vista = await cliente.get('/reservas/R-001').expect(200);
    expect(vista.text).toContain('El pago no fue completado');
    expect(vista.text).toContain('Pendiente de pago');
    expect(pagos.buscar(pago.idPago)?.estado).toBe(resultado);
    expect(cupos()).toBe(15);
    expect(db.prepare('SELECT vencimiento_retencion FROM asiento WHERE id_reserva_vigente=1').all()).toEqual(plazos);
  });

  it('HU-05 · Reintento dentro del plazo original', async () => {
    const { pago } = await registrar();
    const plazos = db.prepare('SELECT vencimiento_retencion FROM asiento WHERE id_reserva_vigente=1').all();
    await resultadoDe(pago.idPago, 'Rechazado').expect(303);
    fecha = new Date('2026-11-22T12:05:00Z');
    expect((await cliente.get('/reservas/R-001').expect(200)).text).toContain('Reintentar pago');
    const intento = await cliente.post('/reservas/R-001/pagos').type('form').send({ monto: 1 }).expect(303);
    const historial = pagos.listarPorReserva(1);
    expect(historial.map((p) => p.estado)).toEqual(['Rechazado', 'Pendiente']);
    expect(historial[1]?.monto).toBe(30000);
    expect(intento.headers.location).toBe(`/simulacion/pasarela/${historial[1]?.idPago}`);
    await cliente.post('/reservas/R-001/pagos').expect(303).expect('Location', intento.headers.location);
    expect(pagos.listarPorReserva(1)).toHaveLength(2);
    expect(db.prepare('SELECT vencimiento_retencion FROM asiento WHERE id_reserva_vigente=1').all()).toEqual(plazos);
    expect(cupos()).toBe(15);
  });

  it('HU-05 · Vencimiento de una reserva pendiente', async () => {
    await cliente.post('/cartelera/V-001/retenciones').type('form').send({ idAsiento: 1 }).expect(303);
    fecha = new Date('2026-11-22T12:02:00Z');
    await cliente.post('/cartelera/V-001/retenciones').type('form').send({ idAsiento: 2 }).expect(303);
    await cliente.post('/cartelera/V-001/reservar').type('form').send(formularioReserva([1, 2])).expect(303);
    expect(db.prepare('SELECT vencimiento_retencion FROM asiento WHERE id_reserva_vigente=1').all()).toEqual([
      { vencimiento_retencion: '2026-11-22T12:08:00.000Z' }, { vencimiento_retencion: '2026-11-22T12:10:00.000Z' },
    ]);
    fecha = new Date('2026-11-22T12:08:00Z');
    const vista = await cliente.get('/reservas/R-001').expect(200);
    expect(vista.text).toContain('Todos sus asientos fueron liberados');
    expect(vista.text).toContain('Vencida');
    expect(cupos()).toBe(17);
    await cliente.get('/reservas/R-001').expect(200);
    expect(cupos()).toBe(17);
    expect(db.prepare('SELECT * FROM asiento WHERE id_reserva_vigente=1').all()).toHaveLength(0);
  });

  it('HU-05 · Impedir un nuevo intento de pago de una reserva vencida', async () => {
    const { pago } = await registrar();
    await resultadoDe(pago.idPago, 'Rechazado').expect(303);
    fecha = new Date('2026-11-22T12:08:00Z');
    const error = await cliente.post('/reservas/R-001/pagos').expect(400);
    expect(error.text).toContain('La reserva está vencida');
    const vista = await cliente.get('/reservas/R-001').expect(200);
    expect(vista.text).not.toContain('Reintentar pago');
    expect(pagos.listarPorReserva(1)).toHaveLength(1);
    expect(cupos()).toBe(17);
  });

  it('HU-05 · Pago aprobado después del vencimiento', async () => {
    const { pago, sesion } = await registrar();
    fecha = new Date('2026-11-22T12:08:00Z');
    const otro = request.agent(app);
    await otro.post('/cartelera/V-001/retenciones').type('form').send({ idAsiento: 1 }).expect(303);
    const asientoDeOtro = db.prepare('SELECT * FROM asiento WHERE id_asiento=1').get();
    await cliente.get(sesion).expect(200); // La sesión existente puede comunicar una aprobación tardía.
    await resultadoDe(pago.idPago, 'Aprobado').expect(303);
    const vista = await cliente.get('/reservas/R-001').expect(200);
    expect(vista.text).toContain('Vencida');
    expect(vista.text).toContain('la devolución fue solicitada');
    expect(vista.text).not.toContain('El pago confirmó la reserva.');
    expect(pagos.buscar(pago.idPago)).toMatchObject({ estado: 'Aprobado', claveDevolucion: `devolucion:${pago.idPago}` });
    expect(db.prepare("SELECT * FROM integraciones_log WHERE mensaje='Solicitud de devolución completa'").all()).toHaveLength(1);
    expect(db.prepare('SELECT * FROM asiento WHERE id_asiento=1').get()).toEqual(asientoDeOtro);
    expect(cupos()).toBe(16);
  });

  it('HU-05 · Devolución solicitada aún no confirmada', async () => {
    const { pago } = await registrar();
    fecha = new Date('2026-11-22T12:09:00Z');
    await resultadoDe(pago.idPago, 'Aprobado').expect(303);
    const vista = await cliente.get('/reservas/R-001').expect(200);
    expect(vista.text).toContain('la devolución fue solicitada');
    expect(vista.text).not.toContain('el monto fue devuelto');
    expect(pagos.buscar(pago.idPago)).toMatchObject({ estado: 'Aprobado', devolucionConfirmadaEn: null });
  });

  it('HU-05 · Devolución completa confirmada', async () => {
    const { pago } = await registrar();
    fecha = new Date('2026-11-22T12:09:00Z');
    await resultadoDe(pago.idPago, 'Aprobado').expect(303);
    const otro = request.agent(app);
    await otro.post('/cartelera/V-001/retenciones').type('form').send({ idAsiento: 1 }).expect(303);
    const asientoDeOtro = db.prepare('SELECT * FROM asiento WHERE id_asiento=1').get();
    expect((await cliente.get('/reservas/R-001').expect(200)).text).toContain('Simular confirmación de devolución completa');
    await cliente.post(`/simulacion/pasarela/${pago.idPago}/confirmar-devolucion`).expect(303).expect('Location', '/reservas/R-001');
    const vista = await cliente.get('/reservas/R-001').expect(200);
    expect(vista.text).toContain('La reserva venció y el monto fue devuelto.');
    expect(vista.text).toContain('Devuelto');
    expect(vista.text).toContain('Vencida');
    expect(vista.text).not.toContain('Simular confirmación de devolución completa');
    expect(pagos.buscar(pago.idPago)?.estado).toBe('Devuelto');
    expect(db.prepare('SELECT * FROM asiento WHERE id_asiento=1').get()).toEqual(asientoDeOtro);
    expect(cupos()).toBe(16);
  });

  it.each([
    'resultado=otro&medioPago=Tarjeta+de+d%C3%A9bito',
    'resultado=Aprobado&medioPago=transferencia',
    'resultado=Aprobado&medioPago=',
    'resultado=Aprobado&resultado=Rechazado&medioPago=Tarjeta+de+d%C3%A9bito',
    'resultado=Aprobado&medioPago[x]=Tarjeta+de+d%C3%A9bito',
  ])('HU-05 · Formulario de pago inválido sin efectos (%s)', async (cuerpo) => {
    const { pago } = await registrar();
    const antes = pagos.buscar(pago.idPago);
    await cliente.post(`/simulacion/pasarela/${pago.idPago}/resultado`).type('form').send(cuerpo).expect(400);
    expect(pagos.buscar(pago.idPago)).toEqual(antes);
    expect(cupos()).toBe(15);
    expect(db.prepare("SELECT * FROM integraciones_log WHERE mensaje='Resultado de pago'").all()).toHaveLength(0);
  });

  it('HU-05 · Referencias inexistentes, devolución inválida y consulta sin aprobación', async () => {
    const { pago, sesion } = await registrar();
    await cliente.get('/simulacion/pasarela/inexistente').expect(404);
    await resultadoDe('inexistente', 'Aprobado').expect(404);
    await cliente.post('/simulacion/pasarela/inexistente/confirmar-devolucion').expect(404);
    await cliente.post('/reservas/R-999/pagos').expect(404);
    await cliente.post(`/simulacion/pasarela/${pago.idPago}/confirmar-devolucion`).expect(400);
    await cliente.get('/reservas/R-001?resultado=Aprobado').expect(200);
    await cliente.get(`${sesion}?resultado=Aprobado`).expect(200);
    expect(pagos.buscar(pago.idPago)?.estado).toBe('Pendiente');
    await resultadoDe(pago.idPago, 'Aprobado').expect(303);
    await resultadoDe(pago.idPago, 'Aprobado').expect(303);
    await resultadoDe(pago.idPago, 'Rechazado').expect(400);
    await cliente.post(`/simulacion/pasarela/${pago.idPago}/confirmar-devolucion`).expect(400);
    await cliente.post('/reservas/R-001/pagos').expect(400);
    expect(pagos.listarPorReserva(1)).toHaveLength(1);
  });

  it('HU-05 · Vencimiento entre registro e inicio conserva la reserva y lleva a su consulta', async () => {
    app = crearApp(db, { ahora: () => new Date(db.prepare('SELECT 1 FROM reserva LIMIT 1').get()
      ? '2026-11-22T12:08:00Z' : '2026-11-22T12:00:00Z') });
    cliente = request.agent(app);
    await cliente.post('/cartelera/V-001/retenciones').type('form').send({ idAsiento: 1 }).expect(303);
    await cliente.post('/cartelera/V-001/reservar').type('form').send(formularioReserva([1]))
      .expect(303).expect('Location', '/reservas/R-001');
    const vista = await cliente.get('/reservas/R-001').expect(200);
    expect(vista.text).toContain('Vencida');
    expect(vista.text).toContain('Camila Rojas');
    expect(pagos.listarPorReserva(1)).toEqual([]);
    expect(cupos()).toBe(17);
    expect(db.prepare('SELECT COUNT(*) AS total FROM reserva').get()).toEqual({ total: 1 });
  });
});
