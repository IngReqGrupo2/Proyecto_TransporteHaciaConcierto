import { abrirBaseDeDatos } from '../src/db/conexion';
import type { BaseDeDatos } from '../src/db/conexion';
import type { Viaje } from '../src/dominio/viaje';

export function crearBaseDePrueba(): BaseDeDatos {
  return abrirBaseDeDatos(':memory:');
}

export function insertarEvento(
  db: BaseDeDatos,
  idEvento: number,
  nombre = 'Concierto de prueba',
  fechaEvento = '2027-01-15',
): void {
  db.prepare(
    'INSERT INTO evento (id_evento, nombre, fecha_evento) VALUES (?, ?, ?)',
  ).run(idEvento, nombre, fechaEvento);
}

export function crearViaje(overrides: Partial<Viaje> = {}): Viaje {
  return {
    idViaje: 'V-001',
    idEvento: 1,
    fechaViaje: '2027-01-15',
    horaSalida: '18:30',
    horaRegreso: '02:00',
    lugarEncuentro: 'Plaza de la Ciudad',
    costo: 15000,
    capacidad: 17,
    cuposDisponibles: 12,
    estado: 'Publicado',
    ...overrides,
  };
}

export function insertarViaje(db: BaseDeDatos, viaje: Viaje): void {
  db.prepare(`
    INSERT INTO viaje (
      id_viaje, id_evento, fecha_viaje, hora_salida, hora_regreso,
      lugar_encuentro, costo, capacidad, cupos_disponibles, estado
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    viaje.idViaje,
    viaje.idEvento,
    viaje.fechaViaje,
    viaje.horaSalida,
    viaje.horaRegreso,
    viaje.lugarEncuentro,
    viaje.costo,
    viaje.capacidad,
    viaje.cuposDisponibles,
    viaje.estado,
  );
}

export function sembrarViaje(
  db: BaseDeDatos,
  overrides: Partial<Viaje> = {},
  nombreEvento = 'Concierto de prueba',
): Viaje {
  const viaje = crearViaje(overrides);
  insertarEvento(db, viaje.idEvento, nombreEvento, viaje.fechaViaje);
  insertarViaje(db, viaje);
  return viaje;
}
