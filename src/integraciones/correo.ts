import type { BaseDeDatos } from '../db/conexion';
import type { Reserva } from '../dominio/reserva';

export interface ServicioCorreo {
  solicitarNotificacionRegistroExitoso(
    destinatario: string,
    reserva: Reserva,
  ): void;
}

export class ServicioCorreoSimulado implements ServicioCorreo {
  constructor(private readonly db: BaseDeDatos) {}

  solicitarNotificacionRegistroExitoso(
    destinatario: string,
    reserva: Reserva,
  ): void {
    this.db
      .prepare(`
        INSERT INTO integraciones_log (sistema, mensaje, detalle, creada_en)
        VALUES (?, ?, ?, ?)
      `)
      .run(
        'Servicio de correo',
        'Notificación de registro exitoso',
        JSON.stringify({
          destinatario,
          codigoReserva: reserva.codigoReserva,
          idViaje: reserva.idViaje,
          idAsiento: reserva.idAsiento,
          estado: reserva.estado,
        }),
        new Date().toISOString(),
      );
  }
}
