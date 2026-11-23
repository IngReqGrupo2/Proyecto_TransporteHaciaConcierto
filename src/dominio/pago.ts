import { randomUUID } from 'node:crypto';
import type { BaseDeDatos } from '../db/conexion';
import type { PasarelaPago, ResultadoPasarela } from '../integraciones/pasarela-pago';
import { ReservaRepositorio } from './reserva';
import { ErrorValidacion } from './viaje';

export const MEDIOS_PAGO = ['Tarjeta de crédito', 'Tarjeta de débito'] as const;
export type MedioPago = typeof MEDIOS_PAGO[number];
export type EstadoPago = 'Pendiente' | 'Aprobado' | 'Rechazado' | 'Cancelado' | 'Devuelto';
export type ResultadoPago = 'Aprobado' | 'Rechazado' | 'Cancelado';

export interface Pago {
  idPago: string;
  idReserva: number;
  monto: number;
  medioPago: MedioPago | null;
  fechaPago: string | null;
  estado: EstadoPago;
  creadoEn: string;
  referenciaPasarela: string;
  claveDevolucion: string | null;
  solicitudDevolucionEn: string | null;
  devolucionConfirmadaEn: string | null;
}

const COLUMNAS_PAGO = `id_pago AS idPago, id_reserva AS idReserva, monto,
  medio_pago AS medioPago, fecha_pago AS fechaPago, estado, creado_en AS creadoEn,
  referencia_pasarela AS referenciaPasarela, clave_devolucion AS claveDevolucion,
  solicitud_devolucion_en AS solicitudDevolucionEn,
  devolucion_confirmada_en AS devolucionConfirmadaEn`;

// HU-05 · CU-03 · MD-01: Reserva 1 — 0..* Pago; se conserva cada intento.
export class PagoRepositorio {
  constructor(private readonly db: BaseDeDatos) {}

  buscar(idPago: string): Pago | undefined {
    return this.db.prepare(`SELECT ${COLUMNAS_PAGO} FROM pago WHERE id_pago = ?`).get(idPago) as Pago | undefined;
  }

  buscarPorReferencia(referencia: string): Pago | undefined {
    return this.db.prepare(`SELECT ${COLUMNAS_PAGO} FROM pago WHERE referencia_pasarela = ?`)
      .get(referencia) as Pago | undefined;
  }

  listarPorReserva(idReserva: number): Pago[] {
    return this.db.prepare(`SELECT ${COLUMNAS_PAGO} FROM pago WHERE id_reserva = ? ORDER BY creado_en, rowid`)
      .all(idReserva) as Pago[];
  }

  crearPendiente(idReserva: number, monto: number, instante: Date): Pago {
    const idPago = randomUUID();
    this.db.prepare(`INSERT INTO pago (id_pago,id_reserva,monto,creado_en,referencia_pasarela)
      VALUES (?, ?, ?, ?, ?)`).run(idPago, idReserva, monto, instante.toISOString(), randomUUID());
    return this.buscar(idPago)!;
  }
}

export class ErrorPagoNoEncontrado extends Error {}

type InicioPago = { tipo: 'iniciarPago'; codigoReserva: string };
type EventoResultado = { tipo: 'resultadoPasarela'; mensaje: ResultadoPasarela };
type EventoDevolucion = { tipo: 'confirmarDevolucion'; idPago: string; monto?: number; clave?: string };
type EventoPago = InicioPago | EventoResultado | EventoDevolucion;
export interface SesionPago { pago: Pago; ubicacion: string }

// HU-05 · CU-03 · DSS-02 · EST-01/02 · RP-06/RP-D01.
// TO-BE: rellenar/enviar datos de pago y verificar realización del pago.
export class ServicioPagos {
  readonly pagos: PagoRepositorio;
  private readonly reservas: ReservaRepositorio;

  constructor(private readonly db: BaseDeDatos, private readonly pasarela: PasarelaPago,
    private readonly ahora: () => Date = () => new Date()) {
    this.pagos = new PagoRepositorio(db);
    this.reservas = new ReservaRepositorio(db, ahora);
  }

  iniciarPago(codigoReserva: string): SesionPago {
    return this.transicionarPago({ tipo: 'iniciarPago', codigoReserva });
  }

  simularResultado(idPago: string, resultado: ResultadoPago, medioPago: MedioPago | null): Pago {
    const pago = this.pagos.buscar(idPago);
    if (!pago) throw new ErrorPagoNoEncontrado('No se encontró el pago solicitado.');
    return this.procesarResultado({ referenciaPasarela: pago.referenciaPasarela, monto: pago.monto, resultado, medioPago });
  }

  procesarResultado(mensaje: ResultadoPasarela): Pago {
    return this.transicionarPago({ tipo: 'resultadoPasarela', mensaje });
  }

  confirmarDevolucion(idPago: string, monto?: number, clave?: string): Pago {
    return this.transicionarPago({ tipo: 'confirmarDevolucion', idPago, monto, clave });
  }

  // EST-02: único punto de creación y transición de Pago. Todo efecto comparte el commit.
  private transicionarPago(evento: InicioPago): SesionPago;
  private transicionarPago(evento: EventoResultado): Pago;
  private transicionarPago(evento: EventoDevolucion): Pago;
  private transicionarPago(evento: EventoPago): SesionPago | Pago {
    const resultado = this.db.transaction(() => {
      const instante = this.ahora(); // BEGIN IMMEDIATE ya adquirió el bloqueo.
      if (evento.tipo === 'confirmarDevolucion') {
        const pago = this.pagos.buscar(evento.idPago);
        if (!pago) throw new ErrorPagoNoEncontrado('No se encontró el pago solicitado.');
        if (!pago.claveDevolucion || !pago.solicitudDevolucionEn ||
          (evento.monto ?? pago.monto) !== pago.monto || (evento.clave ?? pago.claveDevolucion) !== pago.claveDevolucion) {
          throw new ErrorValidacion(['pago'], 'No existe una solicitud de devolución completa para ese monto y clave.');
        }
        if (pago.estado === 'Devuelto') return pago;
        const cambio = this.db.prepare(`UPDATE pago SET estado='Devuelto',devolucion_confirmada_en=?
          WHERE id_pago=? AND estado='Aprobado' AND solicitud_devolucion_en IS NOT NULL
          AND devolucion_confirmada_en IS NULL AND clave_devolucion=?`)
          .run(instante.toISOString(), pago.idPago, pago.claveDevolucion);
        if (cambio.changes === 1) this.pasarela.confirmarDevolucion(this.pagos.buscar(pago.idPago)!);
        return this.pagos.buscar(pago.idPago)!;
      }
      if (evento.tipo === 'resultadoPasarela') {
        const { mensaje } = evento;
        const pago = this.pagos.buscarPorReferencia(mensaje.referenciaPasarela);
        if (!pago) throw new ErrorPagoNoEncontrado('No se encontró el pago solicitado.');
        if (mensaje.monto !== pago.monto || !['Aprobado', 'Rechazado', 'Cancelado'].includes(mensaje.resultado) ||
          (mensaje.medioPago !== null && !MEDIOS_PAGO.includes(mensaje.medioPago)) ||
          (mensaje.resultado !== 'Cancelado' && mensaje.medioPago === null)) {
          throw new ErrorValidacion(['pago'], 'El resultado, medio o monto del pago no es válido.');
        }
        // Una repetición devuelve lo persistido, incluso después de reiniciar o devolver.
        if (pago.estado !== 'Pendiente') {
          const original = pago.estado === 'Devuelto' ? 'Aprobado' : pago.estado;
          if (original !== mensaje.resultado || pago.medioPago !== mensaje.medioPago) {
            throw new ErrorValidacion(['pago'], 'El mensaje contradice un resultado ya registrado.');
          }
          return pago;
        }
        this.reservas.procesarVencimientos(instante);
        const cambio = this.db.prepare(`UPDATE pago SET estado=?,medio_pago=?,fecha_pago=?
          WHERE id_pago=? AND estado='Pendiente'`).run(mensaje.resultado, mensaje.medioPago,
            mensaje.resultado === 'Aprobado' ? instante.toISOString() : null, pago.idPago);
        if (cambio.changes !== 1) return this.pagos.buscar(pago.idPago)!;
        this.pasarela.notificarResultado(pago, mensaje.resultado, mensaje.medioPago);
        if (mensaje.resultado === 'Aprobado') {
          const reserva = this.db.prepare('SELECT estado FROM reserva WHERE id_reserva=?')
            .get(pago.idReserva) as { estado: string };
          if (reserva.estado === 'Pendiente de pago') {
            this.reservas.transicionarReserva({ tipo: 'pagoAprobado', idReserva: pago.idReserva }, instante);
          } else if (reserva.estado === 'Vencida') {
            const solicitud = this.db.prepare(`UPDATE pago SET clave_devolucion=?,solicitud_devolucion_en=?
              WHERE id_pago=? AND estado='Aprobado' AND solicitud_devolucion_en IS NULL`)
              .run(`devolucion:${pago.idPago}`, instante.toISOString(), pago.idPago);
            if (solicitud.changes === 1) this.pasarela.solicitarDevolucion(this.pagos.buscar(pago.idPago)!);
          } else {
            throw new ErrorValidacion(['pago'], 'La reserva ya está pagada.');
          }
        }
        return this.pagos.buscar(pago.idPago)!;
      }
      const reserva = this.reservas.buscarPorCodigo(evento.codigoReserva, instante);
      if (!reserva) return new ErrorPagoNoEncontrado('No se encontró la reserva solicitada.');
      if (reserva.estado !== 'Pendiente de pago') {
        return new ErrorValidacion(['pago'], reserva.estado === 'Vencida'
          ? 'La reserva está vencida. No se puede iniciar el pago.' : 'La reserva ya está pagada.');
      }
      if (!this.reservas.tieneRetencionesVigentes(reserva.idReserva, instante)) {
        return new ErrorValidacion(['pago'], 'No se puede iniciar el pago: las retenciones no tienen un plazo vigente.');
      }
      const pendiente = this.pagos.listarPorReserva(reserva.idReserva).find((p) => p.estado === 'Pendiente');
      const pago = pendiente ?? this.pagos.crearPendiente(reserva.idReserva,
        reserva.viaje.costo * reserva.detalles.length, instante);
      return { pago, ubicacion: this.pasarela.iniciarPago(pago, reserva.codigoReserva) };
    }).immediate();
    // Un inicio denegado no revierte el vencimiento que se acaba de regularizar.
    if (resultado instanceof Error) throw resultado;
    return resultado;
  }
}
