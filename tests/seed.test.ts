import { describe, expect, it } from 'vitest';
import { cargarDatosEjemplo } from '../src/db/seed';
import { ViajeRepositorio } from '../src/dominio/viaje';
import { crearBaseDePrueba } from './ayudas';

describe('Datos de ejemplo', () => {
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
