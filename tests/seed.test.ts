import { describe, expect, it } from 'vitest';
import { cargarDatosEjemplo } from '../src/db/seed';
import { ViajeRepositorio } from '../src/dominio/viaje';
import { crearBaseDePrueba } from './ayudas';
import { ReservaRepositorio } from '../src/dominio/reserva';

describe('Datos de ejemplo', () => {
  it('preserva retenciones y reservas al repetirse y regulariza vencimientos', () => {
    const db = crearBaseDePrueba();
    let fecha = new Date('2026-11-22T12:00:00.000Z');
    const ahora = () => fecha;
    try {
      cargarDatosEjemplo(db, ahora);
      const repo = new ReservaRepositorio(db, ahora);
      repo.retenerAsiento('V-001', '1', 'A');
      repo.retenerAsiento('V-001', '2', 'B');
      repo.registrarReserva('V-001', 'A', { pasajeros: [{ idAsiento: '1', rut: '123K', nombres: 'Ana',
        apellidos: 'Rojas', telefono: '123', correoElectronico: 'ana@ejemplo.cl' }], idaYVuelta: false, lugarRegreso: '' });
      const antes = db.prepare('SELECT * FROM asiento WHERE id_asiento IN (1,2)').all();
      cargarDatosEjemplo(db, ahora);
      cargarDatosEjemplo(db, ahora);
      expect(db.prepare('SELECT * FROM asiento WHERE id_asiento IN (1,2)').all()).toEqual(antes);
      expect(new ViajeRepositorio(db).buscarPublicadoPorId('V-001')?.cuposDisponibles).toBe(15);
      expect(repo.buscarPorCodigo('R-001')?.detalles).toHaveLength(1);
      fecha = new Date('2026-11-22T12:08:00.000Z');
      cargarDatosEjemplo(db, ahora);
      expect(repo.buscarPorCodigo('R-001')?.estado).toBe('Vencida');
      expect(new ViajeRepositorio(db).buscarPublicadoPorId('V-001')?.cuposDisponibles).toBe(17);
      expect(repo.listarRetenidos('V-001', 'B')).toHaveLength(0);
    } finally { db.close(); }
  });
  it('son idempotentes y dejan un viaje disponible', () => {
    const db = crearBaseDePrueba();

    cargarDatosEjemplo(db);
    const eventosPrimera = db
      .prepare('SELECT COUNT(*) AS total FROM evento')
      .get() as { total: number };
    const viajesPrimera = db
      .prepare('SELECT COUNT(*) AS total FROM viaje')
      .get() as { total: number };
    const vehiculosPrimera = db
      .prepare('SELECT COUNT(*) AS total FROM vehiculo')
      .get() as { total: number };

    cargarDatosEjemplo(db);
    const eventosSegunda = db
      .prepare('SELECT COUNT(*) AS total FROM evento')
      .get() as { total: number };
    const viajesSegunda = db
      .prepare('SELECT COUNT(*) AS total FROM viaje')
      .get() as { total: number };
    const vehiculosSegunda = db
      .prepare('SELECT COUNT(*) AS total FROM vehiculo')
      .get() as { total: number };

    expect(eventosPrimera.total).toBe(3);
    expect(viajesPrimera.total).toBe(3);
    expect(vehiculosPrimera.total).toBe(2);
    expect(eventosSegunda.total).toBe(eventosPrimera.total);
    expect(viajesSegunda.total).toBe(viajesPrimera.total);
    expect(vehiculosSegunda.total).toBe(vehiculosPrimera.total);

    const vehiculoV001 = db
      .prepare(`
        SELECT ve.patente AS patente, v.conductor_asignado AS conductor
        FROM viaje v
        INNER JOIN vehiculo ve ON ve.id_vehiculo = v.id_vehiculo
        WHERE v.id_viaje = 'V-001'
      `)
      .get() as { patente: string; conductor: string } | undefined;

    expect(vehiculoV001?.patente).toBe('LKPW42');
    expect(vehiculoV001?.conductor).toBe('Carlos Muñoz');

    const disponibles = new ViajeRepositorio(db).listarDisponibles();
    expect(disponibles).toHaveLength(1);
    expect(disponibles[0]?.idViaje).toBe('V-001');

    db.close();
  });
});
