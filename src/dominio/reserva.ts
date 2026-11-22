import type { BaseDeDatos } from '../db/conexion';
import { ErrorValidacion, type ViajeConEvento } from './viaje';

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
  vencimientoRetencion: string | null;
}

interface AsientoActual extends Asiento {
  clienteRetencion: string | null;
  idReservaVigente: number | null;
}

export type EstadoReserva = 'Pendiente de pago' | 'Pagada' | 'Vencida';

export interface Reserva {
  idReserva: number;
  codigoReserva: string;
  idViaje: string;
  fechaRegistro: string;
  estado: EstadoReserva;
  idaYVuelta: boolean;
  lugarRegreso: string | null;
}

export interface DetalleReserva {
  idDetalleReserva: number;
  asiento: Asiento;
  pasajero: Pasajero;
}

export interface ReservaDetalle extends Reserva {
  viaje: ViajeConEvento;
  detalles: DetalleReserva[];
}

export interface DatosPasajero {
  idAsiento: string;
  rut: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  correoElectronico: string;
}

export interface DatosReserva {
  pasajeros: DatosPasajero[];
  idaYVuelta: boolean;
  lugarRegreso: string;
}

type EventoReserva =
  | { tipo: 'registrarReserva'; idViaje: string; cliente: string; datos: DatosReserva }
  | { tipo: 'vencerRetencion'; idReserva: number };

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

export class ErrorSeleccionVencida extends ErrorValidacion {
  constructor() {
    super(['pasajeros'], 'La selección ya no está disponible o alguna retención venció. Revisa tu selección.');
    this.name = 'ErrorSeleccionVencida';
  }
}

const ETIQUETAS = {
  rut: 'RUT', nombres: 'nombres', apellidos: 'apellidos',
  telefono: 'teléfono', correoElectronico: 'correo electrónico',
};
const CAMPOS_PASAJERO = Object.keys(ETIQUETAS) as Array<keyof typeof ETIQUETAS>;
const COLUMNAS_ASIENTO = `id_asiento AS idAsiento, id_viaje AS idViaje, numero,
  vencimiento_retencion AS vencimientoRetencion,
  cliente_retencion AS clienteRetencion, id_reserva_vigente AS idReservaVigente`;
const COLUMNAS_RESERVA = `id_reserva AS idReserva, codigo_reserva AS codigoReserva,
  id_viaje AS idViaje, fecha_registro AS fechaRegistro, estado,
  ida_y_vuelta AS idaYVuelta, lugar_regreso AS lugarRegreso`;

export function normalizarRut(rut: string): string {
  return rut.trim().toUpperCase().replace(/[.\-\s]/g, '');
}

function idAsientoValido(valor: string): number {
  const id = Number(valor);
  if (!/^\d+$/.test(valor) || !Number.isSafeInteger(id) || id <= 0) {
    throw new ErrorValidacion(['idAsiento'], 'Selecciona un asiento válido para este viaje.');
  }
  return id;
}

// HU-02 · CU-02 · DSS-01 · RP-03/RP-05/RP-D01.
export class ReservaRepositorio {
  constructor(
    private readonly db: BaseDeDatos,
    private readonly ahora: () => Date = () => new Date(),
  ) {}

  listarAsientosDisponibles(idViaje: string): Asiento[] {
    this.procesarVencimientos();
    return this.db.prepare(`SELECT ${COLUMNAS_ASIENTO} FROM asiento
      WHERE id_viaje = ? AND cliente_retencion IS NULL AND id_reserva_vigente IS NULL
      ORDER BY numero`).all(idViaje) as Asiento[];
  }

  listarRetenidos(idViaje: string, cliente: string): Asiento[] {
    this.procesarVencimientos();
    return this.db.prepare(`SELECT ${COLUMNAS_ASIENTO} FROM asiento
      WHERE id_viaje = ? AND cliente_retencion = ? AND id_reserva_vigente IS NULL
      ORDER BY numero`).all(idViaje, cliente) as Asiento[];
  }

  retenerAsiento(idViaje: string, valorAsiento: string, cliente: string): Asiento {
    const instante = this.ahora();
    this.procesarVencimientos(instante);
    const id = idAsientoValido(valorAsiento);
    return this.db.transaction(() => {
      const viaje = this.buscarViaje(idViaje);
      if (!viaje || viaje.estado !== 'Publicado') throw new ErrorViajeNoDisponible();
      const asiento = this.buscarAsiento(id);
      if (!asiento || asiento.idViaje !== idViaje) {
        throw new ErrorValidacion(['idAsiento'], 'Selecciona un asiento válido para este viaje.');
      }
      if (!cliente) throw new ErrorSeleccionVencida();
      if (asiento.idReservaVigente !== null) throw new ErrorSinDisponibilidad();
      if (asiento.clienteRetencion === cliente) return asiento;
      if (asiento.clienteRetencion !== null || viaje.cuposDisponibles <= 0) {
        throw new ErrorSinDisponibilidad();
      }
      const vencimiento = new Date(instante.getTime() + 8 * 60 * 1000).toISOString();
      this.db.prepare(`UPDATE asiento SET cliente_retencion = ?, vencimiento_retencion = ?
        WHERE id_asiento = ?`).run(cliente, vencimiento, id);
      this.db.prepare(`UPDATE viaje SET cupos_disponibles = cupos_disponibles - 1
        WHERE id_viaje = ?`).run(idViaje);
      return { ...asiento, clienteRetencion: cliente, vencimientoRetencion: vencimiento };
    }).immediate();
  }

  registrarReserva(idViaje: string, cliente: string, datos: DatosReserva): ReservaDetalle {
    const id = this.transicionarReserva({ tipo: 'registrarReserva', idViaje, cliente, datos });
    return this.cargarDetalle(id)!;
  }

  // EST-01: única función para crear una reserva o cambiar su estado en HU-02.
  transicionarReserva(evento: EventoReserva, instante: Date = this.ahora()): number {
    if (evento.tipo === 'registrarReserva') this.procesarVencimientos(instante);
    return this.db.transaction(() => {
      if (evento.tipo === 'registrarReserva') {
        const { idViaje, cliente } = evento;
        const viaje = this.buscarViaje(idViaje);
        if (!viaje || viaje.estado !== 'Publicado') throw new ErrorViajeNoDisponible();
        const datos = this.validarDatos(evento.datos);
        const ids = datos.pasajeros.map((p) => idAsientoValido(p.idAsiento));
        if (new Set(ids).size !== ids.length) throw new ErrorSeleccionVencida();
        for (const id of ids) {
          const asiento = this.buscarAsiento(id);
          if (!asiento || asiento.idViaje !== idViaje || !cliente ||
              asiento.clienteRetencion !== cliente || asiento.idReservaVigente !== null ||
              !asiento.vencimientoRetencion || asiento.vencimientoRetencion <= instante.toISOString()) {
            throw new ErrorSeleccionVencida();
          }
        }
        const codigo = this.siguienteCodigoReserva();
        const resultado = this.db.prepare(`INSERT INTO reserva
          (codigo_reserva, id_viaje, fecha_registro, estado, ida_y_vuelta, lugar_regreso)
          VALUES (?, ?, ?, 'Pendiente de pago', ?, ?)`)
          .run(codigo, idViaje, instante.toISOString(), Number(datos.idaYVuelta), datos.lugarRegreso || null);
        const idReserva = Number(resultado.lastInsertRowid);
        for (const pasajero of datos.pasajeros) {
          const idPasajero = this.obtenerPasajero(pasajero);
          const idAsiento = Number(pasajero.idAsiento);
          this.db.prepare(`INSERT INTO detalle_reserva
            (id_reserva, id_viaje, id_asiento, id_pasajero) VALUES (?, ?, ?, ?)`)
            .run(idReserva, idViaje, idAsiento, idPasajero);
          this.db.prepare(`UPDATE asiento SET id_reserva_vigente = ?, cliente_retencion = NULL
            WHERE id_asiento = ?`).run(idReserva, idAsiento);
        }
        return idReserva;
      }
      if (evento.tipo === 'vencerRetencion') {
        const reserva = this.db.prepare(`SELECT ${COLUMNAS_RESERVA} FROM reserva
          WHERE id_reserva = ?`).get(evento.idReserva) as Reserva | undefined;
        const vencido = this.db.prepare(`SELECT 1 FROM asiento WHERE id_reserva_vigente = ?
          AND vencimiento_retencion <= ? LIMIT 1`).get(evento.idReserva, instante.toISOString());
        if (!reserva || reserva.estado !== 'Pendiente de pago' || !vencido) {
          throw new ErrorValidacion(['estado'], 'La reserva no puede vencer desde su estado actual o antes de su plazo.');
        }
        this.db.prepare("UPDATE reserva SET estado = 'Vencida' WHERE id_reserva = ?").run(reserva.idReserva);
        const liberados = this.db.prepare(`UPDATE asiento SET id_reserva_vigente = NULL,
          cliente_retencion = NULL, vencimiento_retencion = NULL
          WHERE id_reserva_vigente = ?`).run(reserva.idReserva).changes;
        this.restituirCupos(reserva.idViaje, liberados);
        return reserva.idReserva;
      }
      throw new ErrorValidacion(['estado'], 'Evento de reserva no permitido.');
    }).immediate();
  }

  procesarVencimientos(instante: Date = this.ahora()): void {
    this.db.transaction(() => {
      const vencidas = this.db.prepare(`SELECT DISTINCT r.id_reserva AS idReserva
        FROM reserva r JOIN asiento a ON a.id_reserva_vigente = r.id_reserva
        WHERE r.estado = 'Pendiente de pago' AND a.vencimiento_retencion <= ?`)
        .all(instante.toISOString()) as Array<{ idReserva: number }>;
      for (const reserva of vencidas) {
        this.transicionarReserva({ tipo: 'vencerRetencion', idReserva: reserva.idReserva }, instante);
      }
      const libres = this.db.prepare(`SELECT id_viaje AS idViaje, COUNT(*) AS cantidad
        FROM asiento WHERE id_reserva_vigente IS NULL AND vencimiento_retencion <= ?
        GROUP BY id_viaje`).all(instante.toISOString()) as Array<{ idViaje: string; cantidad: number }>;
      this.db.prepare(`UPDATE asiento SET cliente_retencion = NULL, vencimiento_retencion = NULL
        WHERE id_reserva_vigente IS NULL AND vencimiento_retencion <= ?`).run(instante.toISOString());
      for (const grupo of libres) this.restituirCupos(grupo.idViaje, grupo.cantidad);
    }).immediate();
  }

  buscarPorCodigo(codigoReserva: string): ReservaDetalle | undefined {
    this.procesarVencimientos();
    const fila = this.db.prepare('SELECT id_reserva AS idReserva FROM reserva WHERE codigo_reserva = ?')
      .get(codigoReserva.trim().toUpperCase()) as { idReserva: number } | undefined;
    return fila ? this.cargarDetalle(fila.idReserva) : undefined;
  }

  private validarDatos(datos: DatosReserva): DatosReserva {
    if (!Array.isArray(datos.pasajeros) || datos.pasajeros.length === 0) {
      throw new ErrorValidacion(['pasajeros'], 'Selecciona al menos un asiento para registrar la reserva.');
    }
    if (datos.pasajeros.length > 17) throw new ErrorSeleccionVencida();
    const pasajeros = datos.pasajeros.map((p) => ({
      idAsiento: p.idAsiento.trim(), rut: normalizarRut(p.rut), nombres: p.nombres.trim(),
      apellidos: p.apellidos.trim(), telefono: p.telefono.trim(), correoElectronico: p.correoElectronico.trim(),
    }));
    const campos: string[] = [];
    for (const p of pasajeros) {
      for (const campo of CAMPOS_PASAJERO) {
        if (!p[campo]) campos.push(`pasajeros.${p.idAsiento}.${campo}`);
      }
    }
    if (campos.length) {
      throw new ErrorValidacion(campos, 'Completa los datos del pasajero: RUT, nombres, apellidos, teléfono y correo electrónico.');
    }
    const lugarRegreso = datos.lugarRegreso.trim();
    if (datos.idaYVuelta && !lugarRegreso) {
      throw new ErrorValidacion(['lugarRegreso'], 'El lugar de regreso es obligatorio para una reserva de ida y vuelta.');
    }
    return { pasajeros, idaYVuelta: datos.idaYVuelta, lugarRegreso };
  }

  private obtenerPasajero(datos: DatosPasajero): number {
    const existente = this.db.prepare('SELECT id_pasajero AS idPasajero FROM pasajero WHERE rut = ?')
      .get(datos.rut) as { idPasajero: number } | undefined;
    if (existente) return existente.idPasajero;
    return Number(this.db.prepare(`INSERT INTO pasajero
      (rut, nombres, apellidos, telefono, correo_electronico) VALUES (?, ?, ?, ?, ?)`)
      .run(datos.rut, datos.nombres, datos.apellidos, datos.telefono, datos.correoElectronico).lastInsertRowid);
  }

  private buscarAsiento(id: number): AsientoActual | undefined {
    return this.db.prepare(`SELECT ${COLUMNAS_ASIENTO} FROM asiento WHERE id_asiento = ?`)
      .get(id) as AsientoActual | undefined;
  }

  private restituirCupos(idViaje: string, cantidad: number): void {
    this.db.prepare('UPDATE viaje SET cupos_disponibles = cupos_disponibles + ? WHERE id_viaje = ?')
      .run(cantidad, idViaje);
  }

  private cargarDetalle(idReserva: number): ReservaDetalle | undefined {
    const reserva = this.db.prepare(`SELECT ${COLUMNAS_RESERVA} FROM reserva WHERE id_reserva = ?`)
      .get(idReserva) as (Omit<Reserva, 'idaYVuelta'> & { idaYVuelta: number }) | undefined;
    if (!reserva) return undefined;
    const filas = this.db.prepare(`SELECT d.id_detalle_reserva AS idDetalleReserva,
      a.id_asiento AS idAsiento, a.id_viaje AS idViaje, a.numero,
      CASE WHEN a.id_reserva_vigente = d.id_reserva THEN a.vencimiento_retencion ELSE NULL END AS vencimientoRetencion,
      p.id_pasajero AS idPasajero, p.rut, p.nombres, p.apellidos, p.telefono,
      p.correo_electronico AS correoElectronico
      FROM detalle_reserva d JOIN asiento a ON a.id_asiento = d.id_asiento
      JOIN pasajero p ON p.id_pasajero = d.id_pasajero
      WHERE d.id_reserva = ? ORDER BY a.numero`).all(idReserva) as Array<Asiento & Pasajero & { idDetalleReserva: number }>;
    return {
      ...reserva, idaYVuelta: Boolean(reserva.idaYVuelta), viaje: this.buscarViaje(reserva.idViaje)!,
      detalles: filas.map((f) => ({
        idDetalleReserva: f.idDetalleReserva,
        asiento: { idAsiento: f.idAsiento, idViaje: f.idViaje, numero: f.numero, vencimientoRetencion: f.vencimientoRetencion },
        pasajero: { idPasajero: f.idPasajero, rut: f.rut, nombres: f.nombres, apellidos: f.apellidos,
          telefono: f.telefono, correoElectronico: f.correoElectronico },
      })),
    };
  }

  private buscarViaje(idViaje: string): ViajeConEvento | undefined {
    return this.db.prepare(`SELECT v.id_viaje AS idViaje, v.id_evento AS idEvento,
      v.id_vehiculo AS idVehiculo, v.fecha_viaje AS fechaViaje, v.hora_salida AS horaSalida,
      v.hora_regreso AS horaRegreso, v.lugar_encuentro AS lugarEncuentro, v.costo,
      v.capacidad, v.cupos_disponibles AS cuposDisponibles, v.estado,
      v.conductor_asignado AS conductorAsignado, v.asistente_asignado AS asistenteAsignado,
      e.nombre AS eventoNombre, e.fecha_evento AS eventoFecha,
      ve.modelo AS vehiculoModelo, ve.patente AS vehiculoPatente
      FROM viaje v JOIN evento e ON e.id_evento = v.id_evento
      JOIN vehiculo ve ON ve.id_vehiculo = v.id_vehiculo WHERE v.id_viaje = ?`)
      .get(idViaje) as ViajeConEvento | undefined;
  }

  private siguienteCodigoReserva(): string {
    const filas = this.db.prepare("SELECT codigo_reserva AS codigo FROM reserva WHERE codigo_reserva LIKE 'R-%'")
      .all() as Array<{ codigo: string }>;
    const maximo = filas.reduce((max, fila) => {
      const coincidencia = /^R-(\d+)$/.exec(fila.codigo);
      return coincidencia ? Math.max(max, Number(coincidencia[1])) : max;
    }, 0);
    return `R-${String(maximo + 1).padStart(3, '0')}`;
  }
}
