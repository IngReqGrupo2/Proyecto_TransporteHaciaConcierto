import type { BaseDeDatos } from '../db/conexion';
import type { Asiento, Reserva } from '../dominio/reserva';

export interface ServicioCorreo {
  solicitarNotificacionRegistroExitoso(
    destinatario: string,
    reserva: Reserva,
    asientos: Asiento[],
  ): void;
}

export class ServicioCorreoSimulado implements ServicioCorreo {
  constructor(private readonly db: BaseDeDatos) {}

  solicitarNotificacionRegistroExitoso(
    destinatario: string,
    reserva: Reserva,
    asientos: Asiento[],
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
          asientos: asientos.map((asiento) => ({ idAsiento: asiento.idAsiento, numero: asiento.numero })),
          estado: reserva.estado,
        }),
        new Date().toISOString(),
      );
  }
}
