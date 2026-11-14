import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { crearApp } from '../src/app';
import type { BaseDeDatos } from '../src/db/conexion';
import type { Viaje } from '../src/dominio/viaje';
import { crearBaseDePrueba, sembrarViaje } from './ayudas';

describe('HU-01 · Cartelera de viajes', () => {
  let db: BaseDeDatos;

  afterEach(() => {
    db.close();
  });

  function appConViaje(
    overrides: Partial<Viaje> = {},
    nombreEvento = 'Concierto de prueba',
  ) {
    db = crearBaseDePrueba();
    sembrarViaje(db, overrides, nombreEvento);
    return crearApp(db);
  }

  function appSinViajes() {
    db = crearBaseDePrueba();
    return crearApp(db);
  }

  it('HU-01 · Existen viajes disponibles', async () => {
    const app = appConViaje({ cuposDisponibles: 12 }, 'Concierto Rock');

    const respuesta = await request(app).get('/cartelera').expect(200);

    expect(respuesta.text).toContain('Concierto Rock');
    expect(respuesta.text).toContain('Cupos disponibles: 12');
    expect(respuesta.text).toContain('18:30');
    expect(respuesta.text).toContain('02:00');
    expect(respuesta.text).toContain('Plaza de la Ciudad');
    expect(respuesta.text).toContain('$15.000');
  });

  it('HU-01 · No hay viajes disponibles', async () => {
    const app = appSinViajes();

    const respuesta = await request(app).get('/cartelera').expect(200);

    expect(respuesta.text).toContain('No hay viajes disponibles');
  });

  it('HU-01 · Viaje publicado sin cupos', async () => {
    const app = appConViaje(
      { idViaje: 'V-LLENO', cuposDisponibles: 0 },
      'Concierto lleno',
    );

    const respuesta = await request(app).get('/cartelera').expect(200);

    expect(respuesta.text).not.toContain('Concierto lleno');
    expect(respuesta.text).toContain('No hay viajes disponibles');
  });

  it('HU-01 · Viaje no publicado', async () => {
    const app = appConViaje(
      { idViaje: 'V-OCULTO', estado: 'Borrador' },
      'Concierto oculto',
    );

    const respuesta = await request(app).get('/cartelera').expect(200);

    expect(respuesta.text).not.toContain('Concierto oculto');
    expect(respuesta.text).toContain('No hay viajes disponibles');
  });

  it('HU-01 · Verificar disponibilidad de un viaje', async () => {
    const app = appConViaje({ cuposDisponibles: 7 }, 'Concierto Jazz');

    const respuesta = await request(app)
      .get('/cartelera/V-001')
      .expect(200);

    expect(respuesta.text).toContain('Concierto Jazz');
    expect(respuesta.text).toContain('Cupos disponibles: 7');
    expect(respuesta.text).toContain('Plaza de la Ciudad');
  });

  it('HU-01 · Detalle de un viaje inexistente', async () => {
    const app = appSinViajes();

    const respuesta = await request(app)
      .get('/cartelera/NO-EXISTE')
      .expect(404);

    expect(respuesta.text).toContain('El viaje no existe o no está disponible.');
  });

  it('HU-01 · Detalle de un viaje no publicado', async () => {
    const app = appConViaje(
      { idViaje: 'V-OCULTO', estado: 'Borrador' },
      'Concierto oculto',
    );

    const respuesta = await request(app)
      .get('/cartelera/V-OCULTO')
      .expect(404);

    expect(respuesta.text).not.toContain('Concierto oculto');
  });

  it('HU-01 · Detalle de un viaje publicado con 0 cupos', async () => {
    const app = appConViaje({ cuposDisponibles: 0 }, 'Concierto lleno');

    const respuesta = await request(app)
      .get('/cartelera/V-001')
      .expect(200);

    expect(respuesta.text).toContain('Concierto lleno');
    expect(respuesta.text).toContain('Cupos disponibles: 0');
  });

  it('HU-01 · Redirección de la raíz a la cartelera', async () => {
    const app = appSinViajes();

    const respuesta = await request(app).get('/').expect(302);

    expect(respuesta.headers.location).toBe('/cartelera');
  });
});
