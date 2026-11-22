import path from 'node:path';
import { abrirBaseDeDatos } from './conexion';
import type { BaseDeDatos } from './conexion';
import { ReservaRepositorio } from '../dominio/reserva';

interface EventoEjemplo {
  idEvento: number;
  nombre: string;
  fechaEvento: string;
}

interface VehiculoEjemplo {
  idVehiculo: number;
  modelo: string;
  patente: string;
  capacidadPasajeros: number;
}

interface ViajeEjemplo {
  idViaje: string;
  idEvento: number;
  idVehiculo: number;
  descripcion: string | null;
  fechaViaje: string;
  horaSalida: string;
  horaRegreso: string;
  lugarEncuentro: string;
  costo: number;
  capacidad: number;
  cuposDisponibles: number;
  estado: string;
  conductorAsignado: string;
  asistenteAsignado: string;
}

const EVENTOS: EventoEjemplo[] = [
  {
    idEvento: 1,
    nombre: 'Concierto Rock en el Parque',
    fechaEvento: '2027-01-15',
  },
  {
    idEvento: 2,
    nombre: 'Festival de Verano',
    fechaEvento: '2027-02-20',
  },
  {
    idEvento: 3,
    nombre: 'Noche de Jazz',
    fechaEvento: '2027-03-05',
  },
];

const VEHICULOS: VehiculoEjemplo[] = [
  {
    idVehiculo: 1,
    modelo: 'Mercedes-Benz Sprinter',
    patente: 'LKPW42',
    capacidadPasajeros: 17,
  },
  {
    idVehiculo: 2,
    modelo: 'Hyundai H1',
    patente: 'BJYR68',
    capacidadPasajeros: 10,
  },
];

const VIAJES: ViajeEjemplo[] = [
  {
    idViaje: 'V-001',
    idEvento: 1,
    idVehiculo: 1,
    descripcion:
      'Traslado al Concierto Rock en el Parque con encuentro en la Plaza de la Ciudad.',
    fechaViaje: '2027-01-15',
    horaSalida: '18:30',
    horaRegreso: '02:00',
    lugarEncuentro: 'Plaza de la Ciudad',
    costo: 15000,
    capacidad: 17,
    cuposDisponibles: 17,
    estado: 'Publicado',
    conductorAsignado: 'Carlos Muñoz',
    asistenteAsignado: 'Ana Torres',
  },
  {
    idViaje: 'V-002',
    idEvento: 2,
    idVehiculo: 2,
    descripcion:
      'Viaje al Festival de Verano con salida desde el Terminal de Buses.',
    fechaViaje: '2027-02-20',
    horaSalida: '17:00',
    horaRegreso: '01:30',
    lugarEncuentro: 'Terminal de Buses',
    costo: 18000,
    capacidad: 10,
    cuposDisponibles: 10,
    estado: 'Borrador',
    conductorAsignado: 'Luis Pérez',
    asistenteAsignado: 'María Soto',
  },
  {
    idViaje: 'V-003',
    idEvento: 3,
    idVehiculo: 1,
    descripcion: 'Traslado a la Noche de Jazz desde la Estación Central.',
    fechaViaje: '2027-03-05',
    horaSalida: '19:00',
    horaRegreso: '23:30',
    lugarEncuentro: 'Estación Central',
    costo: 12000,
    capacidad: 17,
    cuposDisponibles: 17,
    estado: 'Borrador',
    conductorAsignado: 'Carlos Muñoz',
    asistenteAsignado: 'Ana Torres',
  },
];

export function cargarDatosEjemplo(db: BaseDeDatos, ahora: () => Date = () => new Date()): void {
  const guardarEvento = db.prepare(`
    INSERT INTO evento (id_evento, nombre, fecha_evento)
    VALUES (?, ?, ?)
    ON CONFLICT(id_evento) DO UPDATE SET
      nombre = excluded.nombre,
      fecha_evento = excluded.fecha_evento
  `);
  const guardarVehiculo = db.prepare(`
    INSERT INTO vehiculo (id_vehiculo, modelo, patente, capacidad_pasajeros)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(id_vehiculo) DO UPDATE SET
      modelo = excluded.modelo,
      patente = excluded.patente,
      capacidad_pasajeros = excluded.capacidad_pasajeros
  `);
  const guardarViaje = db.prepare(`
    INSERT INTO viaje (
      id_viaje, id_evento, id_vehiculo, descripcion, fecha_viaje, hora_salida,
      hora_regreso, lugar_encuentro, costo, capacidad, cupos_disponibles,
      estado, conductor_asignado, asistente_asignado
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id_viaje) DO UPDATE SET
      id_evento = excluded.id_evento,
      id_vehiculo = excluded.id_vehiculo,
      descripcion = excluded.descripcion,
      fecha_viaje = excluded.fecha_viaje,
      hora_salida = excluded.hora_salida,
      hora_regreso = excluded.hora_regreso,
      lugar_encuentro = excluded.lugar_encuentro,
      costo = excluded.costo,
      capacidad = excluded.capacidad,
      estado = excluded.estado,
      conductor_asignado = excluded.conductor_asignado,
      asistente_asignado = excluded.asistente_asignado
  `);
  const guardarAsiento = db.prepare(`
    INSERT OR IGNORE INTO asiento (id_viaje, numero)
    VALUES (?, ?)
  `);

  db.transaction(() => {
    for (const evento of EVENTOS) {
      guardarEvento.run(evento.idEvento, evento.nombre, evento.fechaEvento);
    }
    for (const vehiculo of VEHICULOS) {
      guardarVehiculo.run(
        vehiculo.idVehiculo,
        vehiculo.modelo,
        vehiculo.patente,
        vehiculo.capacidadPasajeros,
      );
    }
    for (const viaje of VIAJES) {
      guardarViaje.run(
        viaje.idViaje,
        viaje.idEvento,
        viaje.idVehiculo,
        viaje.descripcion,
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

      for (let numero = 1; numero <= viaje.capacidad; numero += 1) {
        guardarAsiento.run(viaje.idViaje, numero);
      }
    }
    // HU-02: sembrar de nuevo no repone cupos retenidos ni reservados.
    new ReservaRepositorio(db, ahora).procesarVencimientos();
    const recalcularCupos = db.prepare(`UPDATE viaje SET cupos_disponibles = capacidad - (
      SELECT COUNT(*) FROM asiento a WHERE a.id_viaje = viaje.id_viaje
        AND (a.cliente_retencion IS NOT NULL OR a.id_reserva_vigente IS NOT NULL)
    ) WHERE id_viaje = ?`);
    for (const viaje of VIAJES) recalcularCupos.run(viaje.idViaje);
  })();
}

const rutaEjecutada = process.argv[1]?.replace(/\\/g, '/') ?? '';
if (rutaEjecutada.endsWith('/src/db/seed.ts')) {
  const rutaBase = path.join(process.cwd(), 'data', 'app.db');
  const db = abrirBaseDeDatos(rutaBase);
  cargarDatosEjemplo(db);
  db.close();
  console.log(`Datos de ejemplo cargados en ${rutaBase}`);
}
