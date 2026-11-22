import type { BaseDeDatos } from '../db/conexion';
import {
  ErrorValidacion,
  type ViajeConEvento,
} from './viaje';

export interface Pasajero {
  idPasajero: number;
  rut: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  correoElectronico: string;
}

export interface Asiento {
  idAsiento: number;
  idViaje: string;
  numero: number;
}

export interface Reserva {
  idReserva: number;
  codigoReserva: string;
  idPasajero: number;
  idViaje: string;
  idAsiento: number;
  fechaRegistro: string;
  vencimientoRetencion: string;
  estado: string;
}

export interface ReservaDetalle extends Reserva {
  pasajero: Pasajero;
  asiento: Asiento;
  viaje: ViajeConEvento;
}

export interface DatosReserva {
  idAsiento: string;
  rut: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  correoElectronico: string;
}

export class ErrorViajeNoDisponible extends Error {
  constructor() {
    super('El viaje no existe o no está disponible.');
    this.name = 'ErrorViajeNoDisponible';
  }
}

export class ErrorSinDisponibilidad extends Error {
  constructor() {
    super('No hay cupos disponibles para el asiento seleccionado.');
    this.name = 'ErrorSinDisponibilidad';
  }
}

const ETIQUETAS: Record<
  'rut' | 'nombres' | 'apellidos' | 'telefono' | 'correoElectronico',
  string
> = {
  rut: 'RUT',
  nombres: 'nombres',
  apellidos: 'apellidos',
  telefono: 'teléfono',
  correoElectronico: 'correo electrónico',
};

const CAMPOS_PASAJERO = Object.keys(ETIQUETAS) as Array<
  keyof typeof ETIQUETAS
>;

const ESTADOS_VIGENTES = "'Pendiente de pago', 'Pagada'";

const RETENCION_MINUTOS = 8;

export function normalizarRut(rut: string): string {
  return rut.trim().toUpperCase().replace(/[.\-\s]/g, '');
}

function normalizarDatos(datos: DatosReserva): DatosReserva {
  return {
    idAsiento: datos.idAsiento.trim(),
    rut: normalizarRut(datos.rut),
    nombres: datos.nombres.trim(),
    apellidos: datos.apellidos.trim(),
    telefono: datos.telefono.trim(),
    correoElectronico: datos.correoElectronico.trim(),
  };
}

interface FilaReserva {
  idReserva: number;
  codigoReserva: string;
  idPasajero: number;
  idViaje: string;
  idAsiento: number;
  fechaRegistro: string;
  vencimientoRetencion: string;
  estado: string;
  rut: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  correoElectronico: string;
  asientoNumero: number;
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
  estadoViaje: string;
  conductorAsignado: string;
  asistenteAsignado: string;
  eventoNombre: string;
  eventoFecha: string;
  vehiculoModelo: string;
  vehiculoPatente: string;
}

function mapearDetalle(fila: FilaReserva): ReservaDetalle {
  return {
    idReserva: fila.idReserva,
    codigoReserva: fila.codigoReserva,
    idPasajero: fila.idPasajero,
    idViaje: fila.idViaje,
    idAsiento: fila.idAsiento,
    fechaRegistro: fila.fechaRegistro,
    vencimientoRetencion: fila.vencimientoRetencion,
    estado: fila.estado,
    pasajero: {
      idPasajero: fila.idPasajero,
      rut: fila.rut,
      nombres: fila.nombres,
      apellidos: fila.apellidos,
      telefono: fila.telefono,
      correoElectronico: fila.correoElectronico,
    },
    asiento: {
      idAsiento: fila.idAsiento,
      idViaje: fila.idViaje,
      numero: fila.asientoNumero,
    },
    viaje: {
      idViaje: fila.idViaje,
      idEvento: fila.idEvento,
      idVehiculo: fila.idVehiculo,
      descripcion: fila.descripcion,
      fechaViaje: fila.fechaViaje,
      horaSalida: fila.horaSalida,
      horaRegreso: fila.horaRegreso,
      lugarEncuentro: fila.lugarEncuentro,
      costo: fila.costo,
      capacidad: fila.capacidad,
      cuposDisponibles: fila.cuposDisponibles,
      estado: fila.estadoViaje,
      conductorAsignado: fila.conductorAsignado,
      asistenteAsignado: fila.asistenteAsignado,
      eventoNombre: fila.eventoNombre,
      eventoFecha: fila.eventoFecha,
      vehiculoModelo: fila.vehiculoModelo,
      vehiculoPatente: fila.vehiculoPatente,
    },
  };
}

export class ReservaRepositorio {
  constructor(
    private readonly db: BaseDeDatos,
    private readonly ahora: () => Date = () => new Date(),
  ) {}

  listarAsientosDisponibles(idViaje: string): Asiento[] {
    return this.db
      .prepare(`
        SELECT
          a.id_asiento AS idAsiento,
          a.id_viaje AS idViaje,
          a.numero AS numero
        FROM asiento a
        WHERE a.id_viaje = ?
          AND NOT EXISTS (
            SELECT 1
            FROM reserva r
            WHERE r.id_asiento = a.id_asiento
              AND r.estado IN (${ESTADOS_VIGENTES})
          )
        ORDER BY a.numero ASC
      `)
      .all(idViaje) as Asiento[];
  }

  buscarPorCodigo(codigoReserva: string): ReservaDetalle | undefined {
    const fila = this.db
      .prepare(`
        SELECT
          r.id_reserva AS idReserva,
          r.codigo_reserva AS codigoReserva,
          r.id_pasajero AS idPasajero,
          r.id_viaje AS idViaje,
          r.id_asiento AS idAsiento,
          r.fecha_registro AS fechaRegistro,
          r.vencimiento_retencion AS vencimientoRetencion,
          r.estado AS estado,
          p.rut AS rut,
          p.nombres AS nombres,
          p.apellidos AS apellidos,
          p.telefono AS telefono,
          p.correo_electronico AS correoElectronico,
          a.numero AS asientoNumero,
          v.id_evento AS idEvento,
          v.id_vehiculo AS idVehiculo,
          v.descripcion AS descripcion,
          v.fecha_viaje AS fechaViaje,
          v.hora_salida AS horaSalida,
          v.hora_regreso AS horaRegreso,
          v.lugar_encuentro AS lugarEncuentro,
          v.costo AS costo,
          v.capacidad AS capacidad,
          v.cupos_disponibles AS cuposDisponibles,
          v.estado AS estadoViaje,
          v.conductor_asignado AS conductorAsignado,
          v.asistente_asignado AS asistenteAsignado,
          e.nombre AS eventoNombre,
          e.fecha_evento AS eventoFecha,
          ve.modelo AS vehiculoModelo,
          ve.patente AS vehiculoPatente
        FROM reserva r
        INNER JOIN pasajero p ON p.id_pasajero = r.id_pasajero
        INNER JOIN asiento a ON a.id_asiento = r.id_asiento
        INNER JOIN viaje v ON v.id_viaje = r.id_viaje
        INNER JOIN evento e ON e.id_evento = v.id_evento
        INNER JOIN vehiculo ve ON ve.id_vehiculo = v.id_vehiculo
        WHERE r.codigo_reserva = ?
      `)
      .get(codigoReserva) as FilaReserva | undefined;

    return fila ? mapearDetalle(fila) : undefined;
  }

  registrarReserva(idViaje: string, datos: DatosReserva): ReservaDetalle {
    const limpios = normalizarDatos(datos);

    const faltantes = CAMPOS_PASAJERO.filter(
      (campo) => limpios[campo] === '',
    );
    if (faltantes.length > 0) {
      throw new ErrorValidacion(
        faltantes,
        `Completa los datos del pasajero: ${faltantes
          .map((campo) => ETIQUETAS[campo])
          .join(', ')}.`,
      );
    }

    const idAsiento = Number(limpios.idAsiento);
    if (!Number.isInteger(idAsiento) || idAsiento <= 0) {
      throw new ErrorValidacion(
        ['idAsiento'],
        'Selecciona un asiento válido para este viaje.',
      );
    }

    const registrar = this.db.transaction(() => {
      const viaje = this.db
        .prepare(`
          SELECT id_viaje AS idViaje, cupos_disponibles AS cuposDisponibles
          FROM viaje
          WHERE id_viaje = ? AND estado = 'Publicado'
        `)
        .get(idViaje) as
        | { idViaje: string; cuposDisponibles: number }
        | undefined;

      if (!viaje) {
        throw new ErrorViajeNoDisponible();
      }

      if (viaje.cuposDisponibles <= 0) {
        throw new ErrorSinDisponibilidad();
      }

      const asiento = this.db
        .prepare(`
          SELECT id_asiento AS idAsiento
          FROM asiento
          WHERE id_asiento = ? AND id_viaje = ?
        `)
        .get(idAsiento, idViaje) as { idAsiento: number } | undefined;

      if (!asiento) {
        throw new ErrorValidacion(
          ['idAsiento'],
          'Selecciona un asiento válido para este viaje.',
        );
      }

      const ocupado = this.db
        .prepare(`
          SELECT 1
          FROM reserva
          WHERE id_asiento = ? AND estado IN (${ESTADOS_VIGENTES})
        `)
        .get(idAsiento) as { 1: number } | undefined;

      if (ocupado) {
        throw new ErrorSinDisponibilidad();
      }

      let pasajero = this.db
        .prepare(`
          SELECT id_pasajero AS idPasajero
          FROM pasajero
          WHERE rut = ?
        `)
        .get(limpios.rut) as { idPasajero: number } | undefined;

      if (!pasajero) {
        const insertado = this.db
          .prepare(`
            INSERT INTO pasajero (
              rut, nombres, apellidos, telefono, correo_electronico
            )
            VALUES (?, ?, ?, ?, ?)
          `)
          .run(
            limpios.rut,
            limpios.nombres,
            limpios.apellidos,
            limpios.telefono,
            limpios.correoElectronico,
          );
        pasajero = { idPasajero: Number(insertado.lastInsertRowid) };
      }

      const fecha = this.ahora();
      const vencimiento = new Date(
        fecha.getTime() + RETENCION_MINUTOS * 60 * 1000,
      );
      const codigoReserva = this.siguienteCodigoReserva();

      this.db
        .prepare(`
          INSERT INTO reserva (
            codigo_reserva, id_pasajero, id_viaje, id_asiento,
            fecha_registro, vencimiento_retencion, estado
          )
          VALUES (?, ?, ?, ?, ?, ?, 'Pendiente de pago')
        `)
        .run(
          codigoReserva,
          pasajero.idPasajero,
          idViaje,
          idAsiento,
          fecha.toISOString(),
          vencimiento.toISOString(),
        );

      const actualizacion = this.db
        .prepare(`
          UPDATE viaje
          SET cupos_disponibles = cupos_disponibles - 1
          WHERE id_viaje = ? AND cupos_disponibles > 0
        `)
        .run(idViaje);

      if (actualizacion.changes === 0) {
        throw new ErrorSinDisponibilidad();
      }

      return codigoReserva;
    });

    const codigoReserva = registrar();
    return this.buscarPorCodigo(codigoReserva) as ReservaDetalle;
  }

  private siguienteCodigoReserva(): string {
    const filas = this.db
      .prepare(`
        SELECT codigo_reserva AS codigo
        FROM reserva
        WHERE codigo_reserva LIKE 'R-%'
      `)
      .all() as Array<{ codigo: string }>;

    const maximo = filas.reduce((max, fila) => {
      const coincidencia = /^R-(\d+)$/.exec(fila.codigo);
      return coincidencia ? Math.max(max, Number(coincidencia[1])) : max;
    }, 0);

    return `R-${String(maximo + 1).padStart(3, '0')}`;
  }
}
