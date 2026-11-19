import { abrirBaseDeDatos } from '../src/db/conexion';
import type { BaseDeDatos } from '../src/db/conexion';
import type { Vehiculo, Viaje } from '../src/dominio/viaje';

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

export function crearVehiculo(overrides: Partial<Vehiculo> = {}): Vehiculo {
  return {
    idVehiculo: 1,
    modelo: 'Mercedes-Benz Sprinter',
    patente: 'LKPW42',
    capacidadPasajeros: 17,
    ...overrides,
  };
}

export function insertarVehiculo(
  db: BaseDeDatos,
  vehiculo: Vehiculo = crearVehiculo(),
): void {
  db.prepare(`
    INSERT OR IGNORE INTO vehiculo (id_vehiculo, modelo, patente, capacidad_pasajeros)
    VALUES (?, ?, ?, ?)
  `).run(
    vehiculo.idVehiculo,
    vehiculo.modelo,
    vehiculo.patente,
    vehiculo.capacidadPasajeros,
  );
}

export function crearViaje(overrides: Partial<Viaje> = {}): Viaje {
  return {
    idViaje: 'V-001',
    idEvento: 1,
    idVehiculo: 1,
    fechaViaje: '2027-01-15',
    horaSalida: '18:30',
    horaRegreso: '02:00',
    lugarEncuentro: 'Plaza de la Ciudad',
    costo: 15000,
    capacidad: 17,
    cuposDisponibles: 12,
    estado: 'Publicado',
    conductorAsignado: 'Carlos Muñoz',
    asistenteAsignado: 'Ana Torres',
    ...overrides,
  };
}

export function insertarAsientos(
  db: BaseDeDatos,
  idViaje: string,
  capacidad: number,
): void {
  const insertar = db.prepare(`
    INSERT OR IGNORE INTO asiento (id_viaje, numero)
    VALUES (?, ?)
  `);

  for (let numero = 1; numero <= capacidad; numero += 1) {
    insertar.run(idViaje, numero);
  }
}

export function insertarViaje(db: BaseDeDatos, viaje: Viaje): void {
  insertarVehiculo(
    db,
    crearVehiculo({
      idVehiculo: viaje.idVehiculo,
      patente: `VEH${String(viaje.idVehiculo).padStart(4, '0')}`,
      capacidadPasajeros: viaje.capacidad,
    }),
  );

  db.prepare(`
    INSERT INTO viaje (
      id_viaje, id_evento, id_vehiculo, fecha_viaje, hora_salida, hora_regreso,
      lugar_encuentro, costo, capacidad, cupos_disponibles, estado,
      conductor_asignado, asistente_asignado
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    viaje.idViaje,
    viaje.idEvento,
    viaje.idVehiculo,
    viaje.fechaViaje,
    viaje.horaSalida,
    viaje.horaRegreso,
    viaje.lugarEncuentro,
    viaje.costo,
    viaje.capacidad,
    viaje.cuposDisponibles,
    viaje.estado,
    viaje.conductorAsignado,
    viaje.asistenteAsignado,
  );

  insertarAsientos(db, viaje.idViaje, viaje.capacidad);
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
