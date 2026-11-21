import { afterEach, describe, expect, it } from 'vitest';
import type { BaseDeDatos } from '../src/db/conexion';
import {
  ErrorSinDisponibilidad,
  ErrorViajeNoDisponible,
  ReservaRepositorio,
  normalizarRut,
  type DatosReserva,
} from '../src/dominio/reserva';
import { crearBaseDePrueba, sembrarViaje } from './ayudas';

function datos(overrides: Partial<DatosReserva> = {}): DatosReserva {
  return {
    idAsiento: '1',
    rut: '12.345.678-5',
    nombres: 'Camila',
    apellidos: 'Rojas',
    telefono: '+56912345678',
    correoElectronico: 'camila@ejemplo.cl',
    ...overrides,
  };
}

describe('ReservaRepositorio', () => {
  let db: BaseDeDatos;

  afterEach(() => {
    db.close();
  });

  function base() {
    db = crearBaseDePrueba();
    sembrarViaje(db, { capacidad: 17, cuposDisponibles: 17 });
    return db;
  }

  function asiento(numero: number): number {
    const fila = db
      .prepare(`
        SELECT id_asiento AS idAsiento
        FROM asiento
        WHERE id_viaje = 'V-001' AND numero = ?
      `)
      .get(numero) as { idAsiento: number } | undefined;
    return fila?.idAsiento ?? 0;
  }

  it('registra la reserva, descuenta el cupo y calcula la retención de 8 minutos', () => {
    base();
    const fecha = new Date('2026-11-19T12:00:00.000Z');
    const repositorio = new ReservaRepositorio(db, () => fecha);

    const reserva = repositorio.registrarReserva(
      'V-001',
      datos({ idAsiento: String(asiento(1)) }),
    );

    expect(reserva.codigoReserva).toBe('R-001');
    expect(reserva.estado).toBe('Pendiente de pago');
    expect(reserva.fechaRegistro).toBe(fecha.toISOString());
    expect(
      new Date(reserva.vencimientoRetencion).getTime() - fecha.getTime(),
    ).toBe(8 * 60 * 1000);
    expect(reserva.asiento.numero).toBe(1);
    expect(reserva.pasajero.rut).toBe('123456785');

    const viaje = db
      .prepare(`
        SELECT cupos_disponibles AS cupos
        FROM viaje
        WHERE id_viaje = 'V-001'
      `)
      .get() as { cupos: number };
    expect(viaje.cupos).toBe(16);

    expect(
      repositorio
        .listarAsientosDisponibles('V-001')
        .some((asiento) => asiento.numero === 1),
    ).toBe(false);
  });

  it('reutiliza el pasajero por RUT normalizado y genera códigos consecutivos', () => {
    base();
    const repositorio = new ReservaRepositorio(db);

    const primera = repositorio.registrarReserva(
      'V-001',
      datos({ idAsiento: String(asiento(1)), rut: '12.345.678-5' }),
    );
    const segunda = repositorio.registrarReserva(
      'V-001',
      datos({
        idAsiento: String(asiento(2)),
        rut: '123456785',
        nombres: 'Otro nombre',
      }),
    );

    expect(primera.codigoReserva).toBe('R-001');
    expect(segunda.codigoReserva).toBe('R-002');
    expect(primera.idPasajero).toBe(segunda.idPasajero);

    const pasajeros = db
      .prepare('SELECT COUNT(*) AS total FROM pasajero')
      .get() as { total: number };
    expect(pasajeros.total).toBe(1);
  });

  it('impide dos reservas vigentes del mismo asiento sin dejar registros parciales', () => {
    base();
    const repositorio = new ReservaRepositorio(db);

    repositorio.registrarReserva(
      'V-001',
      datos({ idAsiento: String(asiento(1)) }),
    );

    expect(() =>
      repositorio.registrarReserva(
        'V-001',
        datos({
          idAsiento: String(asiento(1)),
          rut: '98.765.432-1',
          correoElectronico: 'otro@ejemplo.cl',
        }),
      ),
    ).toThrow(ErrorSinDisponibilidad);

    const reservas = db
      .prepare('SELECT COUNT(*) AS total FROM reserva')
      .get() as { total: number };
    const pasajeros = db
      .prepare('SELECT COUNT(*) AS total FROM pasajero')
      .get() as { total: number };
    const viaje = db
      .prepare(`
        SELECT cupos_disponibles AS cupos
        FROM viaje
        WHERE id_viaje = 'V-001'
      `)
      .get() as { cupos: number };

    expect(reservas.total).toBe(1);
    expect(pasajeros.total).toBe(1);
    expect(viaje.cupos).toBe(16);
  });

  it('rechaza un viaje no publicado o inexistente', () => {
    base();
    const repositorio = new ReservaRepositorio(db);

    expect(() =>
      repositorio.registrarReserva(
        'NO-EXISTE',
        datos({ idAsiento: String(asiento(1)) }),
      ),
    ).toThrow(ErrorViajeNoDisponible);

    db.prepare("UPDATE viaje SET estado = 'Borrador' WHERE id_viaje = 'V-001'")
      .run();

    expect(() =>
      repositorio.registrarReserva(
        'V-001',
        datos({ idAsiento: String(asiento(1)) }),
      ),
    ).toThrow(ErrorViajeNoDisponible);
  });

  it('rechaza un asiento que no pertenece al viaje', () => {
    base();
    db.prepare(`
      INSERT INTO evento (id_evento, nombre, fecha_evento)
      VALUES (2, 'Otro evento', '2027-02-15')
    `).run();
    db.prepare(`
      INSERT INTO vehiculo (id_vehiculo, modelo, patente, capacidad_pasajeros)
      VALUES (2, 'Hyundai H1', 'BJYR68', 10)
    `).run();
    db.prepare(`
      INSERT INTO viaje (
        id_viaje, id_evento, id_vehiculo, fecha_viaje, hora_salida, hora_regreso,
        lugar_encuentro, costo, capacidad, cupos_disponibles, estado,
        conductor_asignado, asistente_asignado
      )
      VALUES (
        'V-002', 2, 2, '2027-02-15', '17:00', '01:30',
        'Terminal', 18000, 10, 10, 'Publicado',
        'Luis Pérez', 'María Soto'
      )
    `).run();
    db.prepare(`
      INSERT INTO asiento (id_viaje, numero) VALUES ('V-002', 1)
    `).run();

    const asientoAjeno = db
      .prepare(`
        SELECT id_asiento AS idAsiento
        FROM asiento
        WHERE id_viaje = 'V-002' AND numero = 1
      `)
      .get() as { idAsiento: number };

    expect(() =>
      new ReservaRepositorio(db).registrarReserva(
        'V-001',
        datos({ idAsiento: String(asientoAjeno.idAsiento) }),
      ),
    ).toThrow('Selecciona un asiento válido para este viaje.');
  });
});

describe('normalizarRut', () => {
  it('quita puntos, guiones y espacios y pasa a mayúsculas', () => {
    expect(normalizarRut(' 12.345.678-5 ')).toBe('123456785');
    expect(normalizarRut('12 345 678 k')).toBe('12345678K');
  });
});
