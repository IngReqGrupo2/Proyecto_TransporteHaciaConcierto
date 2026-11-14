import path from 'node:path';
import { abrirBaseDeDatos } from './conexion';
import type { BaseDeDatos } from './conexion';

interface EventoEjemplo {
  idEvento: number;
  nombre: string;
  fechaEvento: string;
}

interface ViajeEjemplo {
  idViaje: string;
  idEvento: number;
  fechaViaje: string;
  horaSalida: string;
  horaRegreso: string;
  lugarEncuentro: string;
  costo: number;
  capacidad: number;
  cuposDisponibles: number;
  estado: string;
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

const VIAJES: ViajeEjemplo[] = [
  {
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
  },
  {
    idViaje: 'V-002',
    idEvento: 2,
    fechaViaje: '2027-02-20',
    horaSalida: '17:00',
    horaRegreso: '01:30',
    lugarEncuentro: 'Terminal de Buses',
    costo: 18000,
    capacidad: 17,
    cuposDisponibles: 0,
    estado: 'Publicado',
  },
  {
    idViaje: 'V-003',
    idEvento: 3,
    fechaViaje: '2027-03-05',
    horaSalida: '19:00',
    horaRegreso: '23:30',
    lugarEncuentro: 'Estación Central',
    costo: 12000,
    capacidad: 17,
    cuposDisponibles: 17,
    estado: 'Borrador',
  },
];

export function cargarDatosEjemplo(db: BaseDeDatos): void {
  const guardarEvento = db.prepare(`
    INSERT INTO evento (id_evento, nombre, fecha_evento)
    VALUES (?, ?, ?)
    ON CONFLICT(id_evento) DO UPDATE SET
      nombre = excluded.nombre,
      fecha_evento = excluded.fecha_evento
  `);
  const guardarViaje = db.prepare(`
    INSERT INTO viaje (
      id_viaje, id_evento, fecha_viaje, hora_salida, hora_regreso,
      lugar_encuentro, costo, capacidad, cupos_disponibles, estado
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id_viaje) DO UPDATE SET
      id_evento = excluded.id_evento,
      fecha_viaje = excluded.fecha_viaje,
      hora_salida = excluded.hora_salida,
      hora_regreso = excluded.hora_regreso,
      lugar_encuentro = excluded.lugar_encuentro,
      costo = excluded.costo,
      capacidad = excluded.capacidad,
      cupos_disponibles = excluded.cupos_disponibles,
      estado = excluded.estado
  `);

  db.transaction(() => {
    for (const evento of EVENTOS) {
      guardarEvento.run(evento.idEvento, evento.nombre, evento.fechaEvento);
    }
    for (const viaje of VIAJES) {
      guardarViaje.run(
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
