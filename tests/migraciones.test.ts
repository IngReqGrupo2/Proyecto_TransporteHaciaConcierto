import { describe, expect, it } from 'vitest';
import { aplicarMigraciones } from '../src/db/conexion';
import { crearBaseDePrueba } from './ayudas';

interface Columna {
  name: string;
  type: string;
}

describe('Migraciones de base de datos', () => {
  it('crea las tablas con tipos DATE y TIME y no reaplica migraciones', () => {
    const db = crearBaseDePrueba();

    const tablas = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
      .all() as Array<{ name: string }>;
    const nombres = tablas.map((tabla) => tabla.name);

    expect(nombres).toEqual(
      expect.arrayContaining([
        'evento',
        'viaje',
        'vehiculo',
        'schema_migrations',
      ]),
    );

    const columnasEvento = db
      .prepare('PRAGMA table_info(evento)')
      .all() as Columna[];
    expect(
      columnasEvento.find((columna) => columna.name === 'fecha_evento')?.type,
    ).toBe('DATE');

    const columnasViaje = db
      .prepare('PRAGMA table_info(viaje)')
      .all() as Columna[];
    expect(
      columnasViaje.find((columna) => columna.name === 'fecha_viaje')?.type,
    ).toBe('DATE');
    expect(
      columnasViaje.find((columna) => columna.name === 'hora_salida')?.type,
    ).toBe('TIME');

    const nombresColumnasViaje = columnasViaje.map((columna) => columna.name);
    expect(nombresColumnasViaje).toEqual(
      expect.arrayContaining([
        'id_vehiculo',
        'conductor_asignado',
        'asistente_asignado',
      ]),
    );

    const columnasVehiculo = db
      .prepare('PRAGMA table_info(vehiculo)')
      .all() as Columna[];
    expect(columnasVehiculo.map((columna) => columna.name)).toEqual(
      expect.arrayContaining([
        'id_vehiculo',
        'modelo',
        'patente',
        'capacidad_pasajeros',
      ]),
    );

    const vehiculoPorDefecto = db
      .prepare('SELECT patente FROM vehiculo WHERE id_vehiculo = 1')
      .get() as { patente: string } | undefined;
    expect(vehiculoPorDefecto?.patente).toBe('LKPW42');

    const rechazaCapacidadMayor = db
      .prepare(`
        INSERT INTO vehiculo (modelo, patente, capacidad_pasajeros)
        VALUES ('Bus grande', 'ZZZZ99', 18)
      `);
    expect(() => rechazaCapacidadMayor.run()).toThrow();

    const migracionesAntes = db
      .prepare('SELECT COUNT(*) AS total FROM schema_migrations')
      .get() as { total: number };

    aplicarMigraciones(db);

    const migracionesDespues = db
      .prepare('SELECT COUNT(*) AS total FROM schema_migrations')
      .get() as { total: number };
    expect(migracionesDespues.total).toBe(migracionesAntes.total);

    db.close();
  });
});
