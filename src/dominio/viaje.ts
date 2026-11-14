import type { BaseDeDatos } from '../db/conexion';

export interface Evento {
  idEvento: number;
  nombre: string;
  fechaEvento: string;
}

export interface Viaje {
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

export interface ViajeConEvento extends Viaje {
  eventoNombre: string;
  eventoFecha: string;
}

const COLUMNAS_VIAJE = `
  v.id_viaje AS idViaje,
  v.id_evento AS idEvento,
  v.fecha_viaje AS fechaViaje,
  v.hora_salida AS horaSalida,
  v.hora_regreso AS horaRegreso,
  v.lugar_encuentro AS lugarEncuentro,
  v.costo AS costo,
  v.capacidad AS capacidad,
  v.cupos_disponibles AS cuposDisponibles,
  v.estado AS estado,
  e.nombre AS eventoNombre,
  e.fecha_evento AS eventoFecha
`;

export class ViajeRepositorio {
  constructor(private readonly db: BaseDeDatos) {}

  listarDisponibles(): ViajeConEvento[] {
    return this.db
      .prepare(`
        SELECT ${COLUMNAS_VIAJE}
        FROM viaje v
        INNER JOIN evento e ON e.id_evento = v.id_evento
        WHERE v.estado = 'Publicado' AND v.cupos_disponibles > 0
        ORDER BY v.fecha_viaje ASC, v.hora_salida ASC
      `)
      .all() as ViajeConEvento[];
  }

  buscarPublicadoPorId(idViaje: string): ViajeConEvento | undefined {
    return this.db
      .prepare(`
        SELECT ${COLUMNAS_VIAJE}
        FROM viaje v
        INNER JOIN evento e ON e.id_evento = v.id_evento
        WHERE v.id_viaje = ? AND v.estado = 'Publicado'
      `)
      .get(idViaje) as ViajeConEvento | undefined;
  }
}
