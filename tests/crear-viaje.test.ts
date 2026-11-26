import { afterEach, describe, expect, it } from 'vitest';
import type { BaseDeDatos } from '../src/db/conexion';
import {
  ErrorValidacion,
  ViajeRepositorio,
  type DatosNuevoViaje,
  validarFechaCalendario,
} from '../src/dominio/viaje';
import {
  crearBaseDePrueba,
  insertarVehiculo,
  sembrarViaje,
} from './ayudas';

function datos(overrides: Partial<DatosNuevoViaje> = {}): DatosNuevoViaje {
  return {
    eventoNombre: 'Concierto de prueba',
    eventoFecha: '2027-01-15',
    fechaViaje: '2027-01-15',
    horaSalida: '18:30',
    horaRegreso: '02:00',
    lugarEncuentro: 'Plaza de la Ciudad',
    descripcion: 'Descripción de prueba',
    costo: '15000',
    conductor: 'Carlos Muñoz',
    asistente: 'Ana Torres',
    modeloVehiculo: 'Mercedes-Benz Sprinter',
    patente: 'LKPW42',
    tipoVehiculo: 'Minibús',
    ...overrides,
  };
}

function contar(db: BaseDeDatos, tabla: 'evento' | 'vehiculo' | 'viaje'): number {
  const fila = db
    .prepare(`SELECT COUNT(*) AS total FROM ${tabla}`)
    .get() as { total: number };
  return fila.total;
}

describe('ViajeRepositorio · crearViaje', () => {
  let db: BaseDeDatos;

  afterEach(() => {
    db.close();
  });

  it('crea el evento, el vehículo y el viaje publicado en una sola operación', () => {
    db = crearBaseDePrueba();

    const viaje = new ViajeRepositorio(db).crearViaje(
      datos({ patente: 'BJYR68' }),
    );

    expect(viaje.idViaje).toBe('V-001');
    expect(viaje.estado).toBe('Publicado');
    expect(viaje.capacidad).toBe(17);
    expect(viaje.cuposDisponibles).toBe(17);
    expect(viaje.vehiculoPatente).toBe('BJYR68');
    expect(contar(db, 'evento')).toBe(1);
    expect(contar(db, 'vehiculo')).toBe(2);
    expect(contar(db, 'viaje')).toBe(1);
  });

  it('genera los asientos del viaje según la capacidad del vehículo', () => {
    db = crearBaseDePrueba();

    const viaje = new ViajeRepositorio(db).crearViaje(
      datos({ patente: 'BJYR68' }),
    );

    const asientos = db
      .prepare(`
        SELECT numero
        FROM asiento
        WHERE id_viaje = ?
        ORDER BY numero ASC
      `)
      .all(viaje.idViaje) as Array<{ numero: number }>;

    expect(asientos.map((asiento) => asiento.numero)).toEqual(
      Array.from({ length: viaje.capacidad }, (_, indice) => indice + 1),
    );
  });

  it('no deja registros parciales al fallar la validación', () => {
    db = crearBaseDePrueba();
    const repositorio = new ViajeRepositorio(db);

    expect(() => repositorio.crearViaje(datos({ patente: 'AB1234' }))).toThrow(
      ErrorValidacion,
    );
    expect(() => repositorio.crearViaje(datos({ costo: 'abc' }))).toThrow(
      ErrorValidacion,
    );
    expect(() =>
      repositorio.crearViaje(datos({ eventoNombre: '', conductor: '' })),
    ).toThrow(ErrorValidacion);

    expect(contar(db, 'evento')).toBe(0);
    expect(contar(db, 'vehiculo')).toBe(1);
    expect(contar(db, 'viaje')).toBe(0);
  });

  it('reutiliza el vehículo cuando la patente ya existe', () => {
    db = crearBaseDePrueba();
    const repositorio = new ViajeRepositorio(db);

    const primero = repositorio.crearViaje(datos({ patente: 'BJYR68' }));
    const segundo = repositorio.crearViaje(
      datos({
        eventoNombre: 'Otro concierto',
        eventoFecha: '2027-05-01',
        fechaViaje: '2027-05-01',
        patente: 'bjyr-68',
      }),
    );

    expect(segundo.idVehiculo).toBe(primero.idVehiculo);
    expect(contar(db, 'vehiculo')).toBe(2);
    expect(contar(db, 'viaje')).toBe(2);
    expect(segundo.idViaje).toBe('V-002');
  });

  it('asigna la capacidad registrada del vehículo y sus cupos', () => {
    db = crearBaseDePrueba();
    insertarVehiculo(db, {
      idVehiculo: 2,
      modelo: 'Hyundai H1',
      patente: 'BJYR68',
      capacidadPasajeros: 17,
    });

    const viaje = new ViajeRepositorio(db).crearViaje(
      datos({ patente: 'BJYR68' }),
    );

    expect(viaje.capacidad).toBe(17);
    expect(viaje.cuposDisponibles).toBe(17);
  });

  it('rechaza una patente de minibús si se intenta registrar como megabús', () => {
    db = crearBaseDePrueba();
    insertarVehiculo(db, {
      idVehiculo: 2,
      modelo: 'Bus grande',
      patente: 'ZZZZ99',
      capacidadPasajeros: 17,
    });

    expect(() =>
      new ViajeRepositorio(db).crearViaje(datos({ patente: 'ZZZZ99', tipoVehiculo: 'Megabús' })),
    ).toThrow('La patente ya está registrada con otro tipo de vehículo.');
  });

  it('genera el identificador consecutivo a partir de los viajes existentes', () => {
    db = crearBaseDePrueba();
    sembrarViaje(db, { idViaje: 'V-001', idEvento: 1 }, 'Evento uno');
    sembrarViaje(db, { idViaje: 'V-002', idEvento: 2 }, 'Evento dos');

    const viaje = new ViajeRepositorio(db).crearViaje(
      datos({ patente: 'BJYR68' }),
    );

    expect(viaje.idViaje).toBe('V-003');
  });

  it('informa los campos faltantes', () => {
    db = crearBaseDePrueba();
    const repositorio = new ViajeRepositorio(db);

    try {
      repositorio.crearViaje(datos({ eventoNombre: '', patente: '' }));
      expect.unreachable('Debió lanzar ErrorValidacion');
    } catch (error) {
      expect(error).toBeInstanceOf(ErrorValidacion);
      const validacion = error as ErrorValidacion;
      expect(validacion.campos).toEqual(['eventoNombre', 'patente']);
      expect(validacion.message).toBe(
        'Completa los campos obligatorios: nombre del evento, patente.',
      );
    }
  });

  it('rechaza los nombres sin letras y no deja registros parciales', () => {
    db = crearBaseDePrueba();
    const repositorio = new ViajeRepositorio(db);
    const casos: Array<{
      valores: Partial<DatosNuevoViaje>;
      campo: string;
      mensaje: string;
    }> = [
      {
        valores: { conductor: '12345' },
        campo: 'conductor',
        mensaje: 'El nombre del conductor debe contener al menos una letra.',
      },
      {
        valores: { asistente: '98765' },
        campo: 'asistente',
        mensaje: 'El nombre del asistente debe contener al menos una letra.',
      },
    ];

    for (const caso of casos) {
      try {
        repositorio.crearViaje(datos(caso.valores));
        expect.unreachable('Debió lanzar ErrorValidacion');
      } catch (error) {
        expect(error).toBeInstanceOf(ErrorValidacion);
        const validacion = error as ErrorValidacion;
        expect(validacion.campos).toEqual([caso.campo]);
        expect(validacion.message).toBe(caso.mensaje);
      }
    }

    expect(contar(db, 'evento')).toBe(0);
    expect(contar(db, 'vehiculo')).toBe(1);
    expect(contar(db, 'viaje')).toBe(0);
  });

  it('rechaza una fecha del viaje posterior a la fecha del evento', () => {
    db = crearBaseDePrueba();

    try {
      new ViajeRepositorio(db).crearViaje(
        datos({ eventoFecha: '2027-01-10', fechaViaje: '2027-01-15' }),
      );
      expect.unreachable('Debió lanzar ErrorValidacion');
    } catch (error) {
      expect(error).toBeInstanceOf(ErrorValidacion);
      const validacion = error as ErrorValidacion;
      expect(validacion.campos).toEqual(['fechaViaje']);
      expect(validacion.message).toBe(
        'La fecha del viaje no puede ser posterior a la fecha del evento.',
      );
    }

    expect(contar(db, 'evento')).toBe(0);
    expect(contar(db, 'vehiculo')).toBe(1);
    expect(contar(db, 'viaje')).toBe(0);
  });

  it('acepta la fecha del viaje el mismo día del evento', () => {
    db = crearBaseDePrueba();

    const viaje = new ViajeRepositorio(db).crearViaje(
      datos({ eventoFecha: '2027-03-20', fechaViaje: '2027-03-20' }),
    );

    expect(viaje.eventoFecha).toBe('2027-03-20');
    expect(viaje.fechaViaje).toBe('2027-03-20');
  });

  it('guarda la descripción recortada y convierte la vacía en null', () => {
    db = crearBaseDePrueba();
    const repositorio = new ViajeRepositorio(db);

    const conDescripcion = repositorio.crearViaje(
      datos({ descripcion: '  Llevar agua y abrigo  ' }),
    );
    expect(conDescripcion.descripcion).toBe('Llevar agua y abrigo');

    const sinDescripcion = repositorio.crearViaje(
      datos({
        eventoNombre: 'Otro concierto',
        eventoFecha: '2027-02-20',
        fechaViaje: '2027-02-20',
        descripcion: '   ',
      }),
    );
    expect(sinDescripcion.descripcion).toBeNull();

    const fila = db
      .prepare('SELECT descripcion FROM viaje WHERE id_viaje = ?')
      .get(sinDescripcion.idViaje) as { descripcion: string | null };
    expect(fila.descripcion).toBeNull();
  });
});

describe('validarFechaCalendario', () => {
  const referencia = new Date(2026, 0, 15);

  it('acepta el 29 de febrero de un año bisiesto', () => {
    expect(validarFechaCalendario('2028-02-29', referencia)).toEqual({
      valida: true,
    });
  });

  it('rechaza el 29 de febrero de un año no bisiesto', () => {
    expect(validarFechaCalendario('2027-02-29', referencia)).toEqual({
      valida: false,
      motivo: 'calendario',
    });
  });

  it('acepta el límite exacto del 31 de diciembre del año actual más 100', () => {
    expect(validarFechaCalendario('2126-12-31', referencia)).toEqual({
      valida: true,
    });
  });

  it('rechaza el 1 de enero del año actual más 101', () => {
    expect(validarFechaCalendario('2127-01-01', referencia)).toEqual({
      valida: false,
      motivo: 'posterior',
    });
  });

  it('rechaza una fecha anterior a hoy', () => {
    expect(validarFechaCalendario('2026-01-14', referencia)).toEqual({
      valida: false,
      motivo: 'anterior',
    });
  });

  it('rechaza un formato distinto de AAAA-MM-DD', () => {
    expect(validarFechaCalendario('15/01/2026', referencia)).toEqual({
      valida: false,
      motivo: 'formato',
    });
  });
});
