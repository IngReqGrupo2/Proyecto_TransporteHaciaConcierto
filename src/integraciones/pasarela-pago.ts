import type { BaseDeDatos } from '../db/conexion';
import type { MedioPago, Pago, ResultadoPago } from '../dominio/pago';
import { ErrorValidacion } from '../dominio/viaje';

export interface ResultadoPasarela {
  referenciaPasarela: string;
  monto: number;
  resultado: ResultadoPago;
  medioPago: MedioPago | null;
}

// HU-05 · DSS-02. Mensajes de una pasarela externa; esta implementación no usa tarjetas reales.
export interface PasarelaPago {
  iniciarPago(pago: Pago, codigoReserva: string): string;
  notificarResultado(pago: Pago, resultado: ResultadoPago, medio: MedioPago | null): ResultadoPasarela;
  solicitarDevolucion(pago: Pago): void;
  confirmarDevolucion(pago: Pago): void;
}

export class PasarelaPagoSimulada implements PasarelaPago {
  constructor(private readonly db: BaseDeDatos, private readonly ahora: () => Date = () => new Date()) {}

  iniciarPago(pago: Pago, codigoReserva: string): string {
    this.registrarUnaVez('Inicio de pago', pago, { codigoReserva });
    return `/simulacion/pasarela/${encodeURIComponent(pago.idPago)}`;
  }

  notificarResultado(pago: Pago, resultado: ResultadoPago, medio: MedioPago | null): ResultadoPasarela {
    this.registrarUnaVez('Resultado de pago', pago, { resultado, medioPago: medio });
    return { referenciaPasarela: pago.referenciaPasarela, monto: pago.monto, resultado, medioPago: medio };
  }

  solicitarDevolucion(pago: Pago): void {
    if (!pago.claveDevolucion || !pago.solicitudDevolucionEn) {
      throw new ErrorValidacion(['pago'], 'No existe una solicitud de devolución para este pago.');
    }
    this.registrarUnaVez('Solicitud de devolución completa', pago, { claveDevolucion: pago.claveDevolucion });
  }

  confirmarDevolucion(pago: Pago): void {
    if (!pago.claveDevolucion || !pago.solicitudDevolucionEn) {
      throw new ErrorValidacion(['pago'], 'No existe una solicitud de devolución para este pago.');
    }
    this.registrarUnaVez('Confirmación de devolución completa', pago, { claveDevolucion: pago.claveDevolucion });
  }

  // El log es la aceptación persistida del simulador. El bloqueo y el commit son los del coordinador.
  private registrarUnaVez(mensaje: string, pago: Pago, extra: Record<string, unknown>): void {
    this.db.transaction(() => {
      const actual = this.db.prepare('SELECT referencia_pasarela, monto FROM pago WHERE id_pago = ?')
        .get(pago.idPago) as { referencia_pasarela: string; monto: number } | undefined;
      if (!actual || actual.referencia_pasarela !== pago.referenciaPasarela || actual.monto !== pago.monto) {
        throw new ErrorValidacion(['pago'], 'La referencia o el monto no corresponde al pago.');
      }
      const detalle = JSON.stringify({ idPago: pago.idPago, referenciaPasarela: pago.referenciaPasarela,
        monto: pago.monto, ...extra });
      const existente = this.db.prepare(`SELECT detalle FROM integraciones_log WHERE sistema = 'Pasarela de pago'
        AND mensaje = ? AND json_extract(detalle, '$.idPago') = ?`).get(mensaje, pago.idPago) as { detalle: string } | undefined;
      if (existente) {
        if (existente.detalle !== detalle) throw new ErrorValidacion(['pago'], 'El mensaje contradice un resultado ya registrado.');
        return;
      }
      this.db.prepare(`INSERT INTO integraciones_log (sistema,mensaje,detalle,creada_en)
        VALUES ('Pasarela de pago', ?, ?, ?)`).run(mensaje, detalle, this.ahora().toISOString());
    }).immediate();
  }
}
