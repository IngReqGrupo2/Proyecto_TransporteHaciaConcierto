import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { crearApp } from '../src/app';
import type { BaseDeDatos } from '../src/db/conexion';
import {
  crearBaseDePrueba,
  insertarVehiculo,
  sembrarViaje,
} from './ayudas';

function datos(overrides: Record<string, string> = {}) {
  return {
    eventoNombre: 'Concierto Rock en el Parque',
    eventoFecha: '2027-01-15',
    fechaViaje: '2027-01-15',
    horaSalida: '18:30',
    horaRegreso: '02:00',
    lugarEncuentro: 'Plaza de la Ciudad',
    descripcion: 'Descripción de prueba',
    costo: '15000',
    conductor: 'Carlos Muñoz',
    asistente: 'Ana Torres',
    modeloVehiculo: 'Hyundai H1',
    patente: 'BJYR68',
    ...overrides,
  };
}

function contar(db: BaseDeDatos, tabla: 'evento' | 'vehiculo' | 'viaje'): number {
  const fila = db
    .prepare(`SELECT COUNT(*) AS total FROM ${tabla}`)
    .get() as { total: number };
  return fila.total;
}

function formatearFecha(fecha: Date): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

function siguienteAnioNoBisiesto(anio: number): number {
  let candidato = anio + 1;
  while (
    (candidato % 4 === 0 && candidato % 100 !== 0) ||
    candidato % 400 === 0
  ) {
    candidato += 1;
  }
  return candidato;
}

function fechaDeHoy(desplazamientoDias: number): string {
  const hoy = new Date();
  return formatearFecha(
    new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + desplazamientoDias),
  );
}

function campoMarcado(html: string, campo: string): boolean {
  return new RegExp(`name="${campo}"[^>]*aria-invalid="true"`).test(html);
}

describe('HU-03 · Crear viaje', () => {
  let db: BaseDeDatos;

  afterEach(() => {
    db.close();
  });

  function app() {
    db = crearBaseDePrueba();
    return crearApp(db);
  }

  it('HU-03 · Creación exitosa de un viaje', async () => {
    const aplicacion = app();

    const respuesta = await request(aplicacion)
      .post('/admin/viajes')
      .type('form')
      .send(datos())
      .expect(201);

    expect(respuesta.text).toContain('Viaje creado');
    expect(respuesta.text).toContain(
      'El viaje V-001 quedó publicado en la cartelera.',
    );
    expect(respuesta.text).toContain('Cupos disponibles: 17 de 17');
    expect(respuesta.text).toContain('Publicado');
    expect(respuesta.text).toContain('Administrador');

    const cartelera = await request(aplicacion).get('/cartelera').expect(200);
    expect(cartelera.text).toContain('Concierto Rock en el Parque');
    expect(cartelera.text).toContain('Cupos disponibles: 17');
  });

  it('HU-03 · Descripción ingresada al crear el viaje', async () => {
    const aplicacion = app();

    const respuesta = await request(aplicacion)
      .post('/admin/viajes')
      .type('form')
      .send(datos({ descripcion: '  Llevar agua y abrigo  ' }))
      .expect(201);

    expect(respuesta.text).toContain('Viaje creado');
    const fila = db
      .prepare('SELECT descripcion FROM viaje WHERE id_viaje = ?')
      .get('V-001') as { descripcion: string | null } | undefined;
    expect(fila?.descripcion).toBe('Llevar agua y abrigo');
  });

  it('HU-03 · Descripción vacía al crear el viaje', async () => {
    const aplicacion = app();

    const sinDescripcion: Record<string, string> = datos();
    delete sinDescripcion.descripcion;

    await request(aplicacion)
      .post('/admin/viajes')
      .type('form')
      .send(sinDescripcion)
      .expect(201);

    await request(aplicacion)
      .post('/admin/viajes')
      .type('form')
      .send(datos({ descripcion: '   ' }))
      .expect(201);

    const filas = db
      .prepare('SELECT descripcion FROM viaje ORDER BY id_viaje')
      .all() as Array<{ descripcion: string | null }>;
    expect(filas.map((fila) => fila.descripcion)).toEqual([null, null]);
  });

  it('HU-03 · Faltan campos para crear el viaje', async () => {
    const aplicacion = app();

    const respuesta = await request(aplicacion)
      .post('/admin/viajes')
      .type('form')
      .send(datos({ eventoNombre: '', patente: '' }))
      .expect(400);

    expect(respuesta.text).toContain('Completa los campos obligatorios');
    expect(respuesta.text).toContain('nombre del evento');
    expect(respuesta.text).toContain('patente');
    expect(contar(db, 'evento')).toBe(0);
    expect(contar(db, 'viaje')).toBe(0);
  });

  it('HU-03 · Fecha inexistente en el calendario', async () => {
    const aplicacion = app();
    const anio = siguienteAnioNoBisiesto(new Date().getFullYear());
    const fechaInexistente = `${anio}-02-29`;

    const respuesta = await request(aplicacion)
      .post('/admin/viajes')
      .type('form')
      .send(
        datos({
          eventoFecha: fechaInexistente,
          fechaViaje: fechaInexistente,
        }),
      )
      .expect(400);

    expect(respuesta.text).toContain(
      'Las fechas del evento y del viaje deben ser fechas reales del calendario',
    );
    expect(contar(db, 'evento')).toBe(0);
    expect(contar(db, 'vehiculo')).toBe(1);
    expect(contar(db, 'viaje')).toBe(0);
  });

  it('HU-03 · Fecha anterior a hoy', async () => {
    const aplicacion = app();
    const ayer = fechaDeHoy(-1);

    const respuesta = await request(aplicacion)
      .post('/admin/viajes')
      .type('form')
      .send(datos({ eventoFecha: ayer }))
      .expect(400);

    expect(respuesta.text).toContain(
      'La fecha del evento debe ser una fecha real del calendario, no anterior a hoy',
    );
    expect(respuesta.text).toContain(`value="${ayer}"`);
    expect(contar(db, 'evento')).toBe(0);
    expect(contar(db, 'viaje')).toBe(0);
  });

  it('HU-03 · Fecha posterior al límite de 100 años', async () => {
    const aplicacion = app();
    const anioActual = new Date().getFullYear();
    const fueraDelLimite = `${anioActual + 101}-01-01`;

    const respuesta = await request(aplicacion)
      .post('/admin/viajes')
      .type('form')
      .send(datos({ fechaViaje: fueraDelLimite }))
      .expect(400);

    expect(respuesta.text).toContain(
      'La fecha del viaje debe ser una fecha real del calendario, no anterior a hoy',
    );
    expect(respuesta.text).toContain(
      `31 de diciembre de ${anioActual + 100}`,
    );
    expect(contar(db, 'evento')).toBe(0);
    expect(contar(db, 'viaje')).toBe(0);
  });

  it('HU-03 · Patente con formato válido', async () => {
    const aplicacion = app();

    const respuesta = await request(aplicacion)
      .post('/admin/viajes')
      .type('form')
      .send(datos({ patente: ' bjyr-68 ' }))
      .expect(201);

    expect(respuesta.text).toContain('BJYR68');
    const vehiculo = db
      .prepare("SELECT patente FROM vehiculo WHERE patente = 'BJYR68'")
      .get() as { patente: string } | undefined;
    expect(vehiculo?.patente).toBe('BJYR68');
  });

  it('HU-03 · Patente con formato inválido', async () => {
    const aplicacion = app();

    const respuesta = await request(aplicacion)
      .post('/admin/viajes')
      .type('form')
      .send(datos({ patente: 'AB1234' }))
      .expect(400);

    expect(respuesta.text).toContain('AABB11');
    expect(respuesta.text).toContain(
      'La patente debe tener el formato chileno actual',
    );
    expect(campoMarcado(respuesta.text, 'patente')).toBe(true);
    expect(contar(db, 'evento')).toBe(0);
    expect(contar(db, 'vehiculo')).toBe(1);
    expect(contar(db, 'viaje')).toBe(0);
  });

  it('HU-03 · Nombre del conductor o del asistente inválido', async () => {
    const aplicacion = app();
    const casos = [
      {
        campo: 'conductor',
        valor: '12345',
        mensaje: 'El nombre del conductor debe contener al menos una letra.',
      },
      {
        campo: 'asistente',
        valor: '98765',
        mensaje: 'El nombre del asistente debe contener al menos una letra.',
      },
    ];

    for (const caso of casos) {
      const respuesta = await request(aplicacion)
        .post('/admin/viajes')
        .type('form')
        .send(datos({ [caso.campo]: caso.valor }))
        .expect(400);

      expect(respuesta.text).toContain(caso.mensaje);
      expect(respuesta.text).toContain(
        '<span class="mensaje-campo" role="alert">',
      );
      expect(campoMarcado(respuesta.text, caso.campo)).toBe(true);
    }

    expect(contar(db, 'evento')).toBe(0);
    expect(contar(db, 'viaje')).toBe(0);
  });

  it('HU-03 · Fecha del viaje posterior a la fecha del evento', async () => {
    const aplicacion = app();

    const respuesta = await request(aplicacion)
      .post('/admin/viajes')
      .type('form')
      .send(datos({ eventoFecha: '2027-01-10', fechaViaje: '2027-01-15' }))
      .expect(400);

    expect(respuesta.text).toContain(
      'La fecha del viaje no puede ser posterior a la fecha del evento.',
    );
    expect(campoMarcado(respuesta.text, 'fechaViaje')).toBe(true);
    expect(contar(db, 'evento')).toBe(0);
    expect(contar(db, 'viaje')).toBe(0);
  });

  it('HU-03 · Fecha del viaje el mismo día del evento', async () => {
    const aplicacion = app();

    const respuesta = await request(aplicacion)
      .post('/admin/viajes')
      .type('form')
      .send(datos({ eventoFecha: '2027-03-20', fechaViaje: '2027-03-20' }))
      .expect(201);

    expect(respuesta.text).toContain(
      'El viaje V-001 quedó publicado en la cartelera.',
    );
    expect(contar(db, 'viaje')).toBe(1);
  });

  it('HU-03 · Campos faltantes señalados en el formulario', async () => {
    const aplicacion = app();

    const respuesta = await request(aplicacion)
      .post('/admin/viajes')
      .type('form')
      .send(datos({ eventoNombre: '', patente: '' }))
      .expect(400);

    expect(respuesta.text).toContain('Completa los campos obligatorios');
    expect(campoMarcado(respuesta.text, 'eventoNombre')).toBe(true);
    expect(campoMarcado(respuesta.text, 'patente')).toBe(true);
    expect(contar(db, 'viaje')).toBe(0);
  });

  it('HU-03 · Costo inválido', async () => {
    const aplicacion = app();

    for (const costo of ['0', 'no-numerico']) {
      const respuesta = await request(aplicacion)
        .post('/admin/viajes')
        .type('form')
        .send(datos({ costo }))
        .expect(400);

      expect(respuesta.text).toContain(
        'El costo debe ser un monto mayor que cero.',
      );
    }

    expect(contar(db, 'evento')).toBe(0);
    expect(contar(db, 'viaje')).toBe(0);
  });

  it('HU-03 · Viaje con la capacidad máxima permitida', async () => {
    const aplicacion = app();

    const respuesta = await request(aplicacion)
      .post('/admin/viajes')
      .type('form')
      .send(datos({ modeloVehiculo: 'Mercedes-Benz Sprinter' }))
      .expect(201);

    expect(respuesta.text).toContain('Cupos disponibles: 17 de 17');
  });

  it('HU-03 · Vehículo de menor capacidad', async () => {
    const aplicacion = app();
    insertarVehiculo(db, {
      idVehiculo: 2,
      modelo: 'Hyundai H1',
      patente: 'BJYR68',
      capacidadPasajeros: 10,
    });

    const respuesta = await request(aplicacion)
      .post('/admin/viajes')
      .type('form')
      .send(datos())
      .expect(201);

    expect(respuesta.text).toContain('Cupos disponibles: 10 de 10');
  });

  it('HU-03 · Vehículo que supera la capacidad máxima', async () => {
    const aplicacion = app();
    db.pragma('ignore_check_constraints = ON');
    insertarVehiculo(db, {
      idVehiculo: 2,
      modelo: 'Bus grande',
      patente: 'ZZZZ99',
      capacidadPasajeros: 18,
    });

    const respuesta = await request(aplicacion)
      .post('/admin/viajes')
      .type('form')
      .send(datos({ patente: 'ZZZZ99' }))
      .expect(400);

    expect(respuesta.text).toContain(
      'La capacidad del vehículo no puede superar los 17 pasajeros.',
    );
    expect(contar(db, 'viaje')).toBe(0);
  });

  it('HU-03 · Vehículo reutilizado por patente', async () => {
    const aplicacion = app();

    await request(aplicacion)
      .post('/admin/viajes')
      .type('form')
      .send(datos())
      .expect(201);

    const respuesta = await request(aplicacion)
      .post('/admin/viajes')
      .type('form')
      .send(datos({ eventoNombre: 'Festival de Verano' }))
      .expect(201);

    expect(respuesta.text).toContain(
      'El viaje V-002 quedó publicado en la cartelera.',
    );
    expect(contar(db, 'vehiculo')).toBe(2);
    expect(contar(db, 'viaje')).toBe(2);
  });

  it('HU-03 · Identificador consecutivo', async () => {
    const aplicacion = app();
    sembrarViaje(db, { idViaje: 'V-001', idEvento: 1 }, 'Evento uno');
    sembrarViaje(db, { idViaje: 'V-002', idEvento: 2 }, 'Evento dos');

    const respuesta = await request(aplicacion)
      .post('/admin/viajes')
      .type('form')
      .send(datos())
      .expect(201);

    expect(respuesta.text).toContain(
      'El viaje V-003 quedó publicado en la cartelera.',
    );
  });

  it('HU-03 · Muestra el formulario de creación con el rol de administrador', async () => {
    const aplicacion = app();

    const respuesta = await request(aplicacion)
      .get('/admin/viajes/nuevo')
      .expect(200);

    expect(respuesta.text).toContain('Crear viaje');
    expect(respuesta.text).toContain('Administrador');
    expect(respuesta.text).toContain('name="eventoNombre"');
    expect(respuesta.text).toContain('name="patente"');
    expect(respuesta.text).toContain('AABB11');
  });

  it('HU-03 · Conserva los datos ingresados cuando hay errores', async () => {
    const aplicacion = app();

    const respuesta = await request(aplicacion)
      .post('/admin/viajes')
      .type('form')
      .send(datos({ eventoNombre: 'Mi evento', patente: '' }))
      .expect(400);

    expect(respuesta.text).toContain('value="Mi evento"');
  });
});
