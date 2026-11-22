import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { BaseDeDatos } from '../src/db/conexion';
import { ErrorSeleccionVencida, ErrorSinDisponibilidad, ErrorViajeNoDisponible,
  ReservaRepositorio, normalizarRut, type DatosPasajero, type DatosReserva } from '../src/dominio/reserva';
import { crearBaseDePrueba, sembrarViaje } from './ayudas';

export function datosPasajero(id: number, cambios: Partial<DatosPasajero> = {}): DatosPasajero {
  return { idAsiento: String(id), rut: `${id}.234.567-k`, nombres: `Persona ${id}`,
    apellidos: 'Rojas', telefono: '+56912345678', correoElectronico: `persona${id}@ejemplo.cl`, ...cambios };
}

describe('ReservaRepositorio · HU-02 múltiple', () => {
  let db: BaseDeDatos;
  let ahora: Date;
  let repo: ReservaRepositorio;
  beforeEach(() => {
    db = crearBaseDePrueba();
    sembrarViaje(db, { cuposDisponibles: 17 });
    ahora = new Date('2026-11-22T12:00:00.000Z');
    repo = new ReservaRepositorio(db, () => ahora);
  });
  afterEach(() => db.close());
  const avanzar = (minutos: number) => { ahora = new Date(ahora.getTime() + minutos * 60_000); };
  const datos = (ids: number[], cambios: Partial<DatosReserva> = {}): DatosReserva =>
    ({ pasajeros: ids.map((id) => datosPasajero(id)), idaYVuelta: false, lugarRegreso: '', ...cambios });
  const cupos = () => (db.prepare('SELECT cupos_disponibles AS cupos FROM viaje WHERE id_viaje = ?')
    .get('V-001') as { cupos: number }).cupos;
  const seleccionar = (ids: number[], cliente = 'cliente-A') => {
    for (const id of ids) repo.retenerAsiento('V-001', String(id), cliente);
  };
  const cantidad = (tabla: string) => (db.prepare(`SELECT COUNT(*) AS total FROM ${tabla}`).get() as { total: number }).total;

  it('consulta una reserva con todos sus detalles, modalidad y plazos individuales', () => {
    seleccionar([1]);
    avanzar(2);
    seleccionar([2]);
    avanzar(1);
    const reserva = repo.registrarReserva('V-001', 'cliente-A', datos([1, 2], { idaYVuelta: true, lugarRegreso: ' Plaza ' }));
    expect(reserva).toMatchObject({ codigoReserva: 'R-001', estado: 'Pendiente de pago',
      idaYVuelta: true, lugarRegreso: 'Plaza', fechaRegistro: '2026-11-22T12:03:00.000Z' });
    expect(reserva.detalles.map((d) => d.asiento.vencimientoRetencion))
      .toEqual(['2026-11-22T12:08:00.000Z', '2026-11-22T12:10:00.000Z']);
    expect(reserva.detalles[1]?.pasajero.rut).toBe('2234567K');
    expect(cupos()).toBe(15);
    expect(repo.buscarPorCodigo('r-001')).toEqual(reserva);
  });

  it('retiene una sola vez, conserva el plazo e impide que otro cliente adquiera el asiento', () => {
    const original = repo.retenerAsiento('V-001', '1', 'cliente-A');
    avanzar(3);
    expect(repo.retenerAsiento('V-001', '1', 'cliente-A').vencimientoRetencion).toBe(original.vencimientoRetencion);
    expect(() => repo.retenerAsiento('V-001', '1', 'cliente-B')).toThrow(ErrorSinDisponibilidad);
    expect(cupos()).toBe(16);
    expect(repo.listarRetenidos('V-001', 'cliente-B')).toEqual([]);
    expect(repo.listarAsientosDisponibles('V-001')).toHaveLength(16);
  });

  it('rechaza viajes inexistentes, borradores y asientos ajenos al viaje', () => {
    expect(() => repo.retenerAsiento('NO-EXISTE', '1', 'A')).toThrow(ErrorViajeNoDisponible);
    sembrarViaje(db, { idViaje: 'V-002', idEvento: 2, estado: 'Borrador' });
    expect(() => repo.retenerAsiento('V-002', '18', 'A')).toThrow(ErrorViajeNoDisponible);
    expect(() => repo.retenerAsiento('V-001', '18', 'A')).toThrow('Selecciona un asiento válido');
    expect(() => repo.registrarReserva('V-002', 'A', datos([18]))).toThrow(ErrorViajeNoDisponible);
  });

  it('libera al instante exacto sin crear reserva y otro cliente obtiene un plazo nuevo', () => {
    seleccionar([1]);
    avanzar(8);
    repo.procesarVencimientos();
    repo.procesarVencimientos();
    expect(cupos()).toBe(17);
    expect(cantidad('reserva')).toBe(0);
    expect(repo.retenerAsiento('V-001', '1', 'cliente-B').vencimientoRetencion).toBe('2026-11-22T12:16:00.000Z');
    expect(cupos()).toBe(16);
    expect(() => repo.registrarReserva('V-001', 'cliente-A', datos([1]))).toThrow(ErrorSeleccionVencida);
    expect(repo.listarRetenidos('V-001', 'cliente-B')).toHaveLength(1);
  });

  it('vence toda la reserva al primer vencimiento, libera una vez y no afecta reocupaciones', () => {
    seleccionar([1]);
    avanzar(2);
    seleccionar([2]);
    repo.registrarReserva('V-001', 'cliente-A', datos([1, 2]));
    avanzar(6);
    repo.procesarVencimientos();
    expect(repo.buscarPorCodigo('R-001')?.estado).toBe('Vencida');
    expect(cupos()).toBe(17);
    repo.procesarVencimientos();
    expect(cupos()).toBe(17);
    seleccionar([1], 'cliente-B');
    avanzar(1);
    repo.procesarVencimientos();
    expect(cupos()).toBe(16);
    expect(repo.listarRetenidos('V-001', 'cliente-B')).toHaveLength(1);
    expect(repo.buscarPorCodigo('R-001')?.detalles[0]?.asiento.vencimientoRetencion).toBeNull();
  });

  it('no vence reservas pagadas y rechaza transiciones sin guarda o desde estados inválidos', () => {
    seleccionar([1, 2]);
    const r = repo.registrarReserva('V-001', 'cliente-A', datos([1, 2]));
    expect(() => repo.transicionarReserva({ tipo: 'vencerRetencion', idReserva: r.idReserva })).toThrow('no puede vencer');
    db.prepare("UPDATE reserva SET estado = 'Pagada'").run();
    avanzar(20);
    repo.procesarVencimientos();
    expect(repo.buscarPorCodigo('R-001')?.estado).toBe('Pagada');
    expect(cupos()).toBe(15);
    expect(() => repo.transicionarReserva({ tipo: 'vencerRetencion', idReserva: r.idReserva })).toThrow('no puede vencer');
    expect(() => repo.transicionarReserva({ tipo: 'otro' } as never)).toThrow('Evento de reserva no permitido');
    expect(() => repo.retenerAsiento('V-001', '1', 'cliente-B')).toThrow(ErrorSinDisponibilidad);
  });

  it('rechaza selección vacía, repetida, no retenida, ajena y vencida sin registros parciales', () => {
    seleccionar([1]);
    avanzar(2);
    seleccionar([2], 'cliente-B');
    expect(() => repo.registrarReserva('V-001', 'cliente-A', datos([]))).toThrow('al menos un asiento');
    for (const ids of [[1, 1], [1, 2], [1, 3]]) {
      expect(() => repo.registrarReserva('V-001', 'cliente-A', datos(ids))).toThrow(ErrorSeleccionVencida);
    }
    avanzar(6);
    expect(() => repo.registrarReserva('V-001', 'cliente-A', datos([1]))).toThrow(ErrorSeleccionVencida);
    expect(cantidad('reserva')).toBe(0);
    expect(cantidad('detalle_reserva')).toBe(0);
    expect(cantidad('pasajero')).toBe(0);
    expect(cupos()).toBe(16); // La retención de B aún no venció; el rechazo no revierte la liberación de A.
  });

  it('valida todos los datos antes de insertar y revierte todo si falla la segunda inserción', () => {
    seleccionar([1, 2]);
    const incompletos = datos([1, 2]);
    incompletos.pasajeros[1]!.nombres = '';
    expect(() => repo.registrarReserva('V-001', 'cliente-A', incompletos)).toThrow('Completa los datos');
    expect(cantidad('pasajero')).toBe(0);
    db.exec(`CREATE TRIGGER falla_segundo BEFORE INSERT ON detalle_reserva
      WHEN NEW.id_asiento = 2 BEGIN SELECT RAISE(ABORT, 'fallo simulado'); END;`);
    expect(() => repo.registrarReserva('V-001', 'cliente-A', datos([1, 2]))).toThrow('fallo simulado');
    for (const tabla of ['reserva', 'detalle_reserva', 'pasajero']) expect(cantidad(tabla)).toBe(0);
    expect(repo.listarRetenidos('V-001', 'cliente-A')).toHaveLength(2);
    expect(cupos()).toBe(15);
  });

  it('exige lugar de regreso solo para ida y vuelta y conserva el lugar opcional', () => {
    seleccionar([1]);
    expect(() => repo.registrarReserva('V-001', 'cliente-A', datos([1], { idaYVuelta: true, lugarRegreso: ' ' })))
      .toThrow('El lugar de regreso es obligatorio');
    expect(cantidad('pasajero')).toBe(0);
    expect(repo.registrarReserva('V-001', 'cliente-A', datos([1], { lugarRegreso: 'Opcional' })))
      .toMatchObject({ idaYVuelta: false, lugarRegreso: 'Opcional' });
  });

  it('reutiliza pasajeros por RUT sin sobrescribir datos y rechaza confirmaciones reenviadas', () => {
    seleccionar([1, 2]);
    const compartidos = datos([1, 2]);
    compartidos.pasajeros[1]!.rut = compartidos.pasajeros[0]!.rut;
    const r = repo.registrarReserva('V-001', 'cliente-A', compartidos);
    expect(cantidad('pasajero')).toBe(1);
    expect(r.detalles[0]?.pasajero).toEqual(r.detalles[1]?.pasajero);
    expect(() => repo.registrarReserva('V-001', 'cliente-A', compartidos)).toThrow(ErrorSeleccionVencida);
    seleccionar([3]);
    const siguiente = datos([3]);
    siguiente.pasajeros[0]!.rut = '1234567k';
    const segunda = repo.registrarReserva('V-001', 'cliente-A', siguiente);
    expect(segunda.codigoReserva).toBe('R-002');
    expect(segunda.detalles[0]?.pasajero.nombres).toBe('Persona 1');
    expect(cantidad('pasajero')).toBe(1);
    expect(cantidad('reserva')).toBe(2);
  });
});

describe('normalizarRut', () => {
  it('quita puntos, guiones y espacios y pasa a mayúsculas', () => {
    expect(normalizarRut(' 12.345.678-5 ')).toBe('123456785');
    expect(normalizarRut('12 345 678 k')).toBe('12345678K');
  });
});
