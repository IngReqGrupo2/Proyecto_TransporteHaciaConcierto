import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { crearApp } from '../src/app';
import type { BaseDeDatos } from '../src/db/conexion';
import { ReservaRepositorio, type DatosPasajero } from '../src/dominio/reserva';
import { crearBaseDePrueba, sembrarViaje } from './ayudas';

type Cliente = ReturnType<typeof request.agent>;

describe('HU-02 · Registrar reserva y pasajero', () => {
  let db: BaseDeDatos;
  let ahora: Date;
  let app: ReturnType<typeof crearApp>;
  let cliente: Cliente;
  let otro: Cliente;
  let repo: ReservaRepositorio;
  beforeEach(() => {
    db = crearBaseDePrueba();
    sembrarViaje(db, { cuposDisponibles: 17 }, 'Concierto Rock');
    ahora = new Date('2026-11-22T12:00:00.000Z');
    app = crearApp(db, { ahora: () => ahora });
    repo = new ReservaRepositorio(db, () => ahora);
    cliente = request.agent(app);
    otro = request.agent(app);
  });
  afterEach(() => db.close());

  const avanzar = (minutos: number) => { ahora = new Date(ahora.getTime() + minutos * 60_000); };
  const seleccionar = (id: number, agente = cliente, viaje = 'V-001') => agente
    .post(`/cartelera/${viaje}/retenciones`).type('form').send({ idAsiento: String(id) });
  const cantidad = (tabla: string) => (db.prepare(`SELECT COUNT(*) AS total FROM ${tabla}`).get() as { total: number }).total;
  const cupos = () => (db.prepare("SELECT cupos_disponibles AS cupos FROM viaje WHERE id_viaje = 'V-001'").get() as { cupos: number }).cupos;
  const p = (id: number, cambios: Partial<DatosPasajero> = {}): DatosPasajero => ({
    idAsiento: String(id), rut: `${id}.234.567-k`, nombres: id === 1 ? 'Camila' : 'José',
    apellidos: 'Rojas', telefono: '+56912345678', correoElectronico: `pasajero${id}@ejemplo.cl`, ...cambios,
  });
  function cuerpo(pasajeros: DatosPasajero[], idaYVuelta = false, lugarRegreso = '') {
    const valores = new URLSearchParams({ idaYVuelta: idaYVuelta ? '1' : '0', lugarRegreso });
    for (const pasajero of pasajeros) {
      for (const [campo, valor] of Object.entries(pasajero)) {
        valores.append(`pasajeros[${pasajero.idAsiento}][${campo}]`, valor);
      }
    }
    return valores.toString();
  }
  const confirmar = (pasajeros: DatosPasajero[], idaYVuelta = false, lugarRegreso = '', agente = cliente) => agente
    .post('/cartelera/V-001/reservar').type('form').send(cuerpo(pasajeros, idaYVuelta, lugarRegreso));
  const llamadas = () => (db.prepare('SELECT detalle FROM integraciones_log ORDER BY id_log').all() as Array<{ detalle: string }>)
    .map((f) => JSON.parse(f.detalle));

  it('HU-02 · Retención de un asiento al seleccionarlo', async () => {
    const formulario = await cliente.get('/cartelera/V-001/reservar').expect(200);
    expect(formulario.headers['set-cookie']?.[0]).toContain('clienteReserva=');
    expect(formulario.headers['set-cookie']?.[0]).toContain('HttpOnly');
    expect(formulario.text).toContain('8 minutos desde ese momento');
    await seleccionar(1).expect(303).expect('Location', '/cartelera/V-001/reservar');
    const retenido = db.prepare('SELECT * FROM asiento WHERE id_asiento = 1').get();
    expect(retenido).toMatchObject({ vencimiento_retencion: '2026-11-22T12:08:00.000Z' });
    expect(cupos()).toBe(16);
    expect(cantidad('reserva')).toBe(0);
    await seleccionar(1, otro).expect(400);
    avanzar(1);
    await seleccionar(1).expect(303);
    expect(db.prepare('SELECT * FROM asiento WHERE id_asiento = 1').get()).toEqual(retenido);
    const siguiente = await cliente.get('/cartelera/V-001/reservar').expect(200);
    expect(siguiente.text).toContain('pasajeros[1][rut]');
    expect(siguiente.text).toContain('2026-11-22T12:08:00.000Z');
  });

  it('HU-02 · Confirmación de una reserva con uno o varios asientos', async () => {
    await seleccionar(1).expect(303);
    avanzar(2);
    await seleccionar(2).expect(303);
    avanzar(1);
    const respuesta = await confirmar([p(1), p(2)]).expect(201);
    expect(respuesta.text).toContain('Reserva registrada');
    expect(respuesta.text).toContain('R-001');
    expect(respuesta.text).toContain('Asiento 1');
    expect(respuesta.text).toContain('Asiento 2');
    expect(respuesta.text).toContain('Camila Rojas');
    expect(respuesta.text).toContain('José Rojas');
    expect(cantidad('reserva')).toBe(1);
    expect(cantidad('detalle_reserva')).toBe(2);
    expect(cupos()).toBe(15);
    expect(repo.buscarPorCodigo('R-001')?.detalles.map((d) => d.asiento.vencimientoRetencion))
      .toEqual(['2026-11-22T12:08:00.000Z', '2026-11-22T12:10:00.000Z']);
    expect(llamadas()).toEqual([
      expect.objectContaining({ destinatario: 'pasajero1@ejemplo.cl', codigoReserva: 'R-001', asientos: [{ idAsiento: 1, numero: 1 }] }),
      expect.objectContaining({ destinatario: 'pasajero2@ejemplo.cl', codigoReserva: 'R-001', asientos: [{ idAsiento: 2, numero: 2 }] }),
    ]);
    await confirmar([p(1), p(2)]).expect(400);
    expect(cantidad('reserva')).toBe(1);
    expect(llamadas()).toHaveLength(2);
  });

  it('HU-02 · Selección de cupo no disponible', async () => {
    await seleccionar(1).expect(303);
    const original = db.prepare('SELECT * FROM asiento WHERE id_asiento = 1').get();
    const rechazo = await seleccionar(1, otro).expect(400);
    expect(rechazo.text).toContain('No hay cupos disponibles para el asiento seleccionado.');
    expect(db.prepare('SELECT * FROM asiento WHERE id_asiento = 1').get()).toEqual(original);
    await confirmar([p(1)]).expect(201);
    await seleccionar(1, otro).expect(400);
    expect(cupos()).toBe(16);
    expect(cantidad('reserva')).toBe(1);
  });

  it('HU-02 · Consultar una reserva registrada', async () => {
    await seleccionar(1).expect(303);
    await seleccionar(2).expect(303);
    await confirmar([p(1), p(2)], true, 'Plaza de regreso').expect(201);
    const consulta = await request(app).get('/reservas/r-001').expect(200);
    for (const texto of ['Estado de la reserva', 'R-001', 'Concierto Rock', 'Camila Rojas',
      'José Rojas', 'Asiento 1', 'Asiento 2', 'Pendiente de pago', 'Sí, incluye ida y vuelta', 'Plaza de regreso']) {
      expect(consulta.text).toContain(texto);
    }
  });

  it('HU-02 · Rechazo de la operación por pérdida de disponibilidad', async () => {
    await seleccionar(1).expect(303);
    avanzar(2);
    await seleccionar(2).expect(303);
    avanzar(6);
    await seleccionar(1, otro).expect(303); // El primer asiento ya pertenece a otro cliente.
    const respuesta = await confirmar([p(1), p(2)]).expect(400);
    expect(respuesta.text).toContain('Revisa tu selección.');
    for (const tabla of ['reserva', 'detalle_reserva', 'pasajero', 'integraciones_log']) expect(cantidad(tabla)).toBe(0);
    expect(cupos()).toBe(15);
    expect(db.prepare('SELECT vencimiento_retencion FROM asiento WHERE id_asiento = 2').get())
      .toEqual({ vencimiento_retencion: '2026-11-22T12:10:00.000Z' });
  });

  it('HU-02 · Vencimiento de una reserva con varios asientos', async () => {
    await seleccionar(1).expect(303);
    avanzar(2);
    await seleccionar(2).expect(303);
    await confirmar([p(1), p(2)]).expect(201);
    avanzar(6);
    const consulta = await cliente.get('/reservas/R-001').expect(200);
    expect(consulta.text).toContain('Vencida');
    expect(consulta.text).toContain('Todos sus asientos fueron liberados');
    expect(cupos()).toBe(17);
    expect(repo.listarAsientosDisponibles('V-001')).toHaveLength(17);
    await cliente.get('/cartelera').expect(200);
    await cliente.get('/reservas/R-001').expect(200);
    expect(cupos()).toBe(17);
    await seleccionar(1, otro).expect(303);
    await cliente.get('/reservas/R-001').expect(200);
    expect(cupos()).toBe(16);
  });

  it('HU-02 · Registro del lugar de regreso', async () => {
    await seleccionar(1).expect(303);
    const respuesta = await confirmar([p(1)], true, ' Terminal Norte ').expect(201);
    expect(respuesta.text).toContain('Terminal Norte');
    expect(repo.buscarPorCodigo('R-001')).toMatchObject({ idaYVuelta: true, lugarRegreso: 'Terminal Norte' });
  });

  it('HU-02 · Falta el lugar de regreso en una reserva de ida y vuelta', async () => {
    await seleccionar(1).expect(303);
    avanzar(2);
    const respuesta = await confirmar([p(1)], true, ' ').expect(400);
    expect(respuesta.text).toMatch(/name="lugarRegreso"[^>]*aria-invalid="true"/);
    expect(respuesta.text).toContain('El lugar de regreso es obligatorio para una reserva de ida y vuelta.');
    expect(respuesta.text).toContain('value="Camila"');
    expect(respuesta.text).toContain('value="1" selected');
    for (const tabla of ['reserva', 'detalle_reserva', 'pasajero', 'integraciones_log']) expect(cantidad(tabla)).toBe(0);
    expect(db.prepare('SELECT vencimiento_retencion FROM asiento WHERE id_asiento = 1').get())
      .toEqual({ vencimiento_retencion: '2026-11-22T12:08:00.000Z' });
  });

  it('HU-02 · Reserva sin ida y vuelta', async () => {
    await seleccionar(1).expect(303);
    const r = await confirmar([p(1)]).expect(201);
    expect(r.text).toContain('No incluye ida y vuelta');
    expect(repo.buscarPorCodigo('R-001')).toMatchObject({ idaYVuelta: false, lugarRegreso: null });
    expect(repo.buscarPorCodigo('R-001')?.detalles).toHaveLength(1);
    expect(cupos()).toBe(16);
  });

  it('HU-02 · Pasajero existente reutilizado y notificado una sola vez por reserva', async () => {
    await seleccionar(1).expect(303);
    await seleccionar(2).expect(303);
    await confirmar([p(1), p(2, { rut: '1234567K', nombres: 'Otro nombre' })]).expect(201);
    expect(cantidad('pasajero')).toBe(1);
    expect(llamadas()).toHaveLength(1);
    expect(llamadas()[0].asientos).toHaveLength(2);
    await seleccionar(3).expect(303);
    await confirmar([p(3, { rut: '1.234.567-k', nombres: 'Cambio' })]).expect(201);
    expect(repo.buscarPorCodigo('R-002')?.detalles[0]?.pasajero.nombres).toBe('Camila');
    expect(cantidad('pasajero')).toBe(1);
  });

  it('HU-02 · Datos obligatorios del pasajero sin registro parcial', async () => {
    await seleccionar(1).expect(303);
    await seleccionar(2).expect(303);
    const respuesta = await confirmar([p(1), p(2, { nombres: '', rut: '' })]).expect(400);
    expect(respuesta.text).toContain('Completa los datos del pasajero');
    expect(respuesta.text).toMatch(/name="pasajeros\[2\]\[nombres\]"[^>]*aria-invalid="true"/);
    expect(respuesta.text).toContain('value="Camila"');
    expect(cantidad('pasajero')).toBe(0);
    expect(cantidad('reserva')).toBe(0);
    expect(llamadas()).toHaveLength(0);
  });

  it('HU-02 · Titularidad procede de la cookie y no de datos del formulario', async () => {
    await seleccionar(1).expect(303);
    const fila = db.prepare('SELECT cliente_retencion AS cliente FROM asiento WHERE id_asiento = 1').get() as { cliente: string };
    const respuesta = await otro.post('/cartelera/V-001/reservar').type('form')
      .send(`${cuerpo([p(1)])}&clienteReserva=${fila.cliente}&cliente=${fila.cliente}`).expect(400);
    expect(respuesta.text).toContain('Revisa tu selección');
    expect(cantidad('reserva')).toBe(0);
    await confirmar([p(1)]).expect(201);
  });

  it.each([
    'pasajeros=texto', 'pasajeros[1]=texto', 'pasajeros[1][idAsiento]=1&pasajeros[1][rut]=a&pasajeros[1][rut]=b',
    'idaYVuelta=1&idaYVuelta=0', 'idaYVuelta=incorrecto', 'lugarRegreso[a]=texto',
    'pasajeros[1][idAsiento]=1&pasajeros[1][idAsiento]=2',
  ])('HU-02 · Formulario mal formado responde 400 (%s)', async (formulario) => {
    await seleccionar(1).expect(303);
    await cliente.post('/cartelera/V-001/reservar').type('form').send(formulario).expect(400);
    expect(cantidad('reserva')).toBe(0);
    expect(cantidad('pasajero')).toBe(0);
    expect(cupos()).toBe(16);
  });

  it('HU-02 · Solo uno de dos clientes adquiere el último asiento', async () => {
    await cliente.get('/cartelera/V-001/reservar').expect(200);
    await otro.get('/cartelera/V-001/reservar').expect(200);
    db.prepare("UPDATE viaje SET cupos_disponibles = 1 WHERE id_viaje = 'V-001'").run();
    const respuestas = await Promise.all([seleccionar(1), seleccionar(1, otro)]);
    expect(respuestas.map((r) => r.status).sort()).toEqual([303, 400]);
    expect(cupos()).toBe(0);
    const ganador = respuestas[0]!.status === 303 ? cliente : otro;
    await ganador.get('/cartelera/V-001/reservar').expect(200);
    await confirmar([p(1)], false, '', ganador).expect(201);
    expect(cupos()).toBe(0);
  });

  it('HU-02 · Sin cupos, viajes no publicados y reserva inexistente', async () => {
    db.prepare("UPDATE viaje SET cupos_disponibles = 0 WHERE id_viaje = 'V-001'").run();
    const r = await cliente.get('/cartelera/V-001/reservar').expect(400);
    expect(r.text).toContain('No hay cupos disponibles para el viaje seleccionado.');
    await seleccionar(1).expect(400);
    await seleccionar(1, cliente, 'NO-EXISTE').expect(404);
    db.prepare("UPDATE viaje SET estado = 'Borrador' WHERE id_viaje = 'V-001'").run();
    await seleccionar(1).expect(404);
    await confirmar([p(1)]).expect(404);
    await cliente.get('/reservas/R-999').expect(404);
  });
});
