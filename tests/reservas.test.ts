import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { crearApp } from '../src/app';
import type { BaseDeDatos } from '../src/db/conexion';
import type { Viaje } from '../src/dominio/viaje';
import { ReservaRepositorio } from '../src/dominio/reserva';
import { crearBaseDePrueba, sembrarViaje } from './ayudas';

describe('HU-02 · Registrar reserva y pasajero', () => {
  let db: BaseDeDatos;

  afterEach(() => {
    db.close();
  });

  function appConViaje(overrides: Partial<Viaje> = {}) {
    db = crearBaseDePrueba();
    sembrarViaje(
      db,
      { capacidad: 17, cuposDisponibles: 17, ...overrides },
      'Concierto Rock',
    );
    return crearApp(db);
  }

  function idAsiento(numero: number): number {
    const fila = db
      .prepare(`
        SELECT id_asiento AS idAsiento
        FROM asiento
        WHERE id_viaje = 'V-001' AND numero = ?
      `)
      .get(numero) as { idAsiento: number } | undefined;

    if (!fila) {
      throw new Error(`No existe el asiento ${numero}`);
    }

    return fila.idAsiento;
  }

  function datosPasajero(overrides: Record<string, string> = {}) {
    return {
      rut: '12.345.678-5',
      nombres: 'Camila',
      apellidos: 'Rojas',
      telefono: '+56912345678',
      correoElectronico: 'camila@ejemplo.cl',
      ...overrides,
    };
  }

  function reservar(
    app: ReturnType<typeof crearApp>,
    numeroAsiento: number,
    overrides: Record<string, string> = {},
  ) {
    return request(app)
      .post('/cartelera/V-001/reservar')
      .type('form')
      .send({
        idAsiento: String(idAsiento(numeroAsiento)),
        ...datosPasajero(),
        ...overrides,
      });
  }

  it('HU-02 · Selección de cupo disponible y confirmación de reserva', async () => {
    const app = appConViaje();

    const detalle = await request(app).get('/cartelera/V-001').expect(200);
    expect(detalle.text).toContain('href="/cartelera/V-001/reservar"');

    const formulario = await request(app)
      .get('/cartelera/V-001/reservar')
      .expect(200);
    expect(formulario.text).toContain('Asiento 1');
    expect(formulario.text).toContain('name="rut"');

    const respuesta = await reservar(app, 1).expect(201);

    expect(respuesta.text).toContain('Reserva registrada');
    expect(respuesta.text).toContain('R-001');
    expect(respuesta.text).toContain('Pendiente de pago');
    expect(respuesta.text).toContain('Asiento 1');
    expect(respuesta.text).toContain('Concierto Rock');

    const reserva = db
      .prepare(`
        SELECT
          r.estado AS estado,
          r.codigo_reserva AS codigo,
          v.cupos_disponibles AS cupos
        FROM reserva r
        INNER JOIN viaje v ON v.id_viaje = r.id_viaje
        WHERE r.codigo_reserva = 'R-001'
      `)
      .get() as { estado: string; codigo: string; cupos: number } | undefined;

    expect(reserva?.estado).toBe('Pendiente de pago');
    expect(reserva?.cupos).toBe(16);

    const disponibles = new ReservaRepositorio(db).listarAsientosDisponibles(
      'V-001',
    );
    expect(disponibles.some((asiento) => asiento.numero === 1)).toBe(false);

    const notificacion = db
      .prepare(`
        SELECT sistema, mensaje, detalle
        FROM integraciones_log
      `)
      .get() as
      | { sistema: string; mensaje: string; detalle: string }
      | undefined;

    expect(notificacion?.sistema).toBe('Servicio de correo');
    expect(notificacion?.mensaje).toBe('Notificación de registro exitoso');
    expect(JSON.parse(notificacion?.detalle ?? '{}')).toMatchObject({
      destinatario: 'camila@ejemplo.cl',
      codigoReserva: 'R-001',
    });
  });

  it('HU-02 · Selección de cupo no disponible', async () => {
    const app = appConViaje();

    await reservar(app, 1).expect(201);

    const respuesta = await reservar(app, 1, {
      rut: '98.765.432-1',
      correoElectronico: 'otro@ejemplo.cl',
    }).expect(400);

    expect(respuesta.text).toContain(
      'No hay cupos disponibles para el asiento seleccionado.',
    );

    const totalReservas = db
      .prepare('SELECT COUNT(*) AS total FROM reserva')
      .get() as { total: number };
    expect(totalReservas.total).toBe(1);

    const formulario = await request(app)
      .get('/cartelera/V-001/reservar')
      .expect(200);
    expect(formulario.text).not.toContain(
      `value="${idAsiento(1)}" selected`,
    );
  });

  it('HU-02 · Viaje sin cupos disponibles', async () => {
    const app = appConViaje({ cuposDisponibles: 0 });

    const formulario = await request(app)
      .get('/cartelera/V-001/reservar')
      .expect(400);
    expect(formulario.text).toContain(
      'No hay cupos disponibles para el viaje seleccionado.',
    );

    const respuesta = await reservar(app, 1).expect(400);
    expect(respuesta.text).toContain(
      'No hay cupos disponibles para el asiento seleccionado.',
    );

    const totalReservas = db
      .prepare('SELECT COUNT(*) AS total FROM reserva')
      .get() as { total: number };
    expect(totalReservas.total).toBe(0);
  });

  it('HU-02 · Consultar estado de la reserva registrada', async () => {
    const app = appConViaje();

    await reservar(app, 1).expect(201);

    const consulta = await request(app).get('/reservas/R-001').expect(200);

    expect(consulta.text).toContain('Estado de la reserva');
    expect(consulta.text).toContain('R-001');
    expect(consulta.text).toContain('Camila Rojas');
    expect(consulta.text).toContain('Concierto Rock');
    expect(consulta.text).toContain('Asiento 1');
    expect(consulta.text).toContain('Pendiente de pago');

    const minusculas = await request(app).get('/reservas/r-001').expect(200);
    expect(minusculas.text).toContain('R-001');
  });

  it('HU-02 · Consultar una reserva inexistente', async () => {
    const app = appConViaje();

    const respuesta = await request(app)
      .get('/reservas/R-999')
      .expect(404);

    expect(respuesta.text).toContain('No se encontró la reserva solicitada.');
  });

  it('HU-02 · Pasajero existente reutilizado', async () => {
    const app = appConViaje();

    await reservar(app, 1, { rut: '12.345.678-5' }).expect(201);
    await reservar(app, 2, {
      rut: '123456785',
      nombres: 'Otro nombre',
      correoElectronico: 'otro@ejemplo.cl',
    }).expect(201);

    const pasajeros = db
      .prepare('SELECT COUNT(*) AS total FROM pasajero')
      .get() as { total: number };
    expect(pasajeros.total).toBe(1);

    const reservas = db
      .prepare(`
        SELECT id_pasajero AS idPasajero
        FROM reserva
        ORDER BY id_reserva ASC
      `)
      .all() as Array<{ idPasajero: number }>;

    expect(reservas).toHaveLength(2);
    expect(reservas[0]?.idPasajero).toBe(reservas[1]?.idPasajero);

    const pasajero = db
      .prepare('SELECT nombres FROM pasajero WHERE rut = ?')
      .get('123456785') as { nombres: string } | undefined;
    expect(pasajero?.nombres).toBe('Camila');
  });

  it('HU-02 · Datos obligatorios del pasajero', async () => {
    const app = appConViaje();

    const respuesta = await request(app)
      .post('/cartelera/V-001/reservar')
      .type('form')
      .send({
        idAsiento: String(idAsiento(1)),
        rut: '',
        nombres: '',
        apellidos: '',
        telefono: '',
        correoElectronico: '',
      })
      .expect(400);

    expect(respuesta.text).toContain('Completa los datos del pasajero');
    expect(respuesta.text).toContain('RUT');
    expect(respuesta.text).toContain('correo electrónico');
    expect(respuesta.text).toContain('name="rut"');
    expect(respuesta.text).toContain('aria-invalid="true"');

    const totalReservas = db
      .prepare('SELECT COUNT(*) AS total FROM reserva')
      .get() as { total: number };
    expect(totalReservas.total).toBe(0);
  });
});
