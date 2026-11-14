import { afterEach, describe, expect, it } from 'vitest';
import type { BaseDeDatos } from '../src/db/conexion';
import { ViajeRepositorio } from '../src/dominio/viaje';
import { crearBaseDePrueba, insertarEvento, insertarViaje, crearViaje, sembrarViaje } from './ayudas';

describe('ViajeRepositorio', () => {
  let db: BaseDeDatos;

  afterEach(() => {
    db.close();
  });

  it('lista solo viajes publicados con cupos, ordenados por fecha y hora', () => {
    db = crearBaseDePrueba();
    sembrarViaje(
      db,
      { idViaje: 'V-003', idEvento: 3, fechaViaje: '2027-03-01', horaSalida: '10:00', cuposDisponibles: 5 },
      'Evento tres',
    );
    sembrarViaje(
      db,
      { idViaje: 'V-001', idEvento: 1, fechaViaje: '2027-01-10', horaSalida: '09:00', cuposDisponibles: 5 },
      'Evento uno',
    );
    sembrarViaje(
      db,
      { idViaje: 'V-002', idEvento: 2, cuposDisponibles: 0 },
      'Evento lleno',
    );
    sembrarViaje(
      db,
      { idViaje: 'V-004', idEvento: 4, estado: 'Borrador', cuposDisponibles: 5 },
      'Evento no publicado',
    );

    const disponibles = new ViajeRepositorio(db).listarDisponibles();

    expect(disponibles.map((viaje) => viaje.idViaje)).toEqual(['V-001', 'V-003']);
  });

  it('encuentra el detalle de un viaje publicado aunque tenga 0 cupos', () => {
    db = crearBaseDePrueba();
    sembrarViaje(db, { cuposDisponibles: 0 });

    const viaje = new ViajeRepositorio(db).buscarPublicadoPorId('V-001');

    expect(viaje?.cuposDisponibles).toBe(0);
    expect(viaje?.fechaViaje).toBe('2027-01-15');
  });

  it('no encuentra viajes no publicados ni inexistentes', () => {
    db = crearBaseDePrueba();
    sembrarViaje(db, { estado: 'Borrador' });
    const repositorio = new ViajeRepositorio(db);

    expect(repositorio.buscarPublicadoPorId('V-001')).toBeUndefined();
    expect(repositorio.buscarPublicadoPorId('NO-EXISTE')).toBeUndefined();
  });

  it('mantiene las fechas y horas como cadenas ISO', () => {
    db = crearBaseDePrueba();
    insertarEvento(db, 1, 'Evento ISO', '2027-01-15');
    insertarViaje(db, crearViaje());

    const viaje = new ViajeRepositorio(db).buscarPublicadoPorId('V-001');

    expect(viaje?.fechaViaje).toBe('2027-01-15');
    expect(viaje?.horaSalida).toBe('18:30');
    expect(viaje?.horaRegreso).toBe('02:00');
  });
});
