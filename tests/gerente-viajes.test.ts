import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { crearApp } from '../src/app';
import { crearBaseDePrueba } from './ayudas';

describe('HU-06 · Aprobación de viajes con megabús', () => {
  let db: ReturnType<typeof crearBaseDePrueba>;
  let app: ReturnType<typeof crearApp>;
  beforeEach(() => { db = crearBaseDePrueba(); app = crearApp(db); });
  afterEach(() => db.close());

  function registrar(tipoVehiculo: 'Minibús' | 'Megabús', patente: string, eventoNombre: string) {
    return request(app).post('/admin/viajes').type('form').send({
      tipoVehiculo, patente, eventoNombre, eventoFecha: '2030-01-16', fechaViaje: '2030-01-15',
      horaSalida: '18:30', horaRegreso: '23:00', lugarEncuentro: 'Terminal de prueba',
      costo: '12000', conductor: 'Carlos', asistente: 'Ana', modeloVehiculo: 'Bus de prueba',
    }).expect(201);
  }

  function decidir(id: string, decision: 'Aprobado' | 'Rechazado') {
    return request(app).post(`/gerente/viajes/${id}/decision`).type('form').send({ decision });
  }

  function estado(id: string) {
    return db.prepare('SELECT estado_aprobacion, estado, capacidad, cupos_disponibles, rut_gerente FROM viaje WHERE id_viaje = ?').get(id);
  }

  it('muestra al Gerente los datos de la solicitud pendiente y al Administrador su estado', async () => {
    const registrado = await registrar('Megabús', 'MGBS45', 'Concierto pendiente');
    expect(registrado.text).toContain('Cupos disponibles: 45 de 45');
    expect(registrado.text).toContain('href="/admin/viajes/V-001"');
    expect(estado('V-001')).toMatchObject({ estado_aprobacion: 'Pendiente', estado: 'Borrador', capacidad: 45, cupos_disponibles: 45 });
    const bandeja = await request(app).get('/gerente/viajes/pendientes').expect(200);
    expect(bandeja.text).toContain('Concierto pendiente');
    expect(bandeja.text).toContain('Terminal de prueba');
    expect(bandeja.text).toContain('Estado de aprobación: Pendiente');
    const administrador = await request(app).get('/admin/viajes/V-001').expect(200);
    expect(administrador.text).toContain('<dd>Pendiente</dd>');
    await request(app).get('/cartelera/V-001').expect(404);
    await request(app).get('/cartelera/V-001/reservar').expect(404);
  });

  it('publica el minibús con 17 asientos y lo excluye de la revisión junto a los viajes resueltos', async () => {
    await registrar('Minibús', 'MNBS17', 'Concierto minibús');
    await registrar('Megabús', 'MGBS45', 'Concierto pendiente');
    await registrar('Megabús', 'BUSS45', 'Concierto resuelto');
    await decidir('V-003', 'Aprobado').expect(200);
    const bandeja = await request(app).get('/gerente/viajes/pendientes').expect(200);
    expect(bandeja.text).toContain('Concierto pendiente');
    expect(bandeja.text).not.toContain('Concierto minibús');
    expect(bandeja.text).not.toContain('Concierto resuelto');
    expect(estado('V-001')).toMatchObject({ estado_aprobacion: 'Aprobado', capacidad: 17, estado: 'Publicado', rut_gerente: null });
  });

  it('publica un megabús aprobado y permite retener el asiento 45', async () => {
    await registrar('Megabús', 'MGBS45', 'Concierto aprobado');
    await decidir('V-001', 'Aprobado').expect(200);
    expect(estado('V-001')).toMatchObject({ estado_aprobacion: 'Aprobado', estado: 'Publicado', rut_gerente: '11111111-1' });
    const cartelera = await request(app).get('/cartelera').expect(200);
    expect(cartelera.text).toContain('Concierto aprobado');
    expect((await request(app).get('/admin/viajes/V-001').expect(200)).text).toContain('<dd>Aprobado</dd>');
    await request(app).get('/cartelera/V-001/reservar').expect(200);
    const asiento = db.prepare("SELECT id_asiento FROM asiento WHERE id_viaje = 'V-001' AND numero = 45").get() as { id_asiento: number };
    await request(app).post('/cartelera/V-001/retenciones').type('form').send({ idAsiento: asiento.id_asiento })
      .expect(303).expect('Location', '/cartelera/V-001/reservar');
    expect(estado('V-001')).toMatchObject({ cupos_disponibles: 44 });
  });

  it('conserva el megabús rechazado fuera de la cartelera', async () => {
    await registrar('Megabús', 'MGBS45', 'Concierto rechazado');
    await decidir('V-001', 'Rechazado').expect(200);
    expect(estado('V-001')).toMatchObject({ estado_aprobacion: 'Rechazado', estado: 'Borrador' });
    expect((await request(app).get('/admin/viajes/V-001').expect(200)).text).toContain('<dd>Rechazado</dd>');
    expect((await request(app).get('/cartelera')).text).not.toContain('Concierto rechazado');
    await request(app).get('/cartelera/V-001').expect(404);
    await request(app).get('/cartelera/V-001/reservar').expect(404);
  });

  it.each(['Aprobado', 'Rechazado'] as const)('impide volver a decidir un viaje %s', async (decision) => {
    await registrar('Megabús', 'MGBS45', 'Concierto resuelto');
    await decidir('V-001', decision).expect(200);
    const antes = estado('V-001');
    const respuesta = await decidir('V-001', decision === 'Aprobado' ? 'Rechazado' : 'Aprobado').expect(409);
    expect(respuesta.text).toContain('El viaje ya fue resuelto.');
    expect(estado('V-001')).toEqual(antes);
  });

  it('acepta una sola de dos decisiones simultáneas', async () => {
    await registrar('Megabús', 'MGBS45', 'Concierto concurrente');
    const decisiones = ['Aprobado', 'Rechazado'] as const;
    const respuestas = await Promise.all(decisiones.map((decision) => decidir('V-001', decision)));
    expect(respuestas.map((respuesta) => respuesta.status).sort()).toEqual([200, 409]);
    const aceptada = decisiones[respuestas.findIndex((respuesta) => respuesta.status === 200)];
    expect(estado('V-001')).toMatchObject({ estado_aprobacion: aceptada, estado: aceptada === 'Aprobado' ? 'Publicado' : 'Borrador' });
  });
});
