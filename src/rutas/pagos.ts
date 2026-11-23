import { Router, type Response } from 'express';
import type { BaseDeDatos } from '../db/conexion';
import { ErrorPagoNoEncontrado, MEDIOS_PAGO, ServicioPagos, type MedioPago, type ResultadoPago } from '../dominio/pago';
import { ReservaRepositorio } from '../dominio/reserva';
import { ErrorValidacion } from '../dominio/viaje';

// HU-05 · CU-03 · DSS-02: la pasarela externa se representa con páginas locales de simulación.
export function crearRutasPagos(db: BaseDeDatos, servicio: ServicioPagos, ahora: () => Date): Router {
  const router = Router();
  const reservas = new ReservaRepositorio(db, ahora);
  function codigoDe(idReserva: number): string {
    return (db.prepare('SELECT codigo_reserva AS codigo FROM reserva WHERE id_reserva=?')
      .get(idReserva) as { codigo: string }).codigo;
  }
  function errorDePago(res: Response, error: unknown): void {
    if (error instanceof ErrorValidacion || error instanceof ErrorPagoNoEncontrado) {
      res.status(error instanceof ErrorPagoNoEncontrado ? 404 : 400)
        .render('error', { titulo: 'No se pudo procesar el pago', mensaje: error.message });
    } else throw error;
  }
  router.get('/simulacion/pasarela/:idPago', (req, res) => {
    const pago = servicio.pagos.buscar(req.params.idPago);
    if (!pago) {
      res.status(404).render('error', { titulo: 'Pago no encontrado', mensaje: 'No se encontró el pago solicitado.' });
      return;
    }
    const reserva = reservas.buscarPorCodigo(codigoDe(pago.idReserva))!;
    res.render('pasarela-pago', { titulo: 'Pasarela de pago simulada', pago, reserva, medios: MEDIOS_PAGO });
  });

  router.post('/simulacion/pasarela/:idPago/resultado', (req, res) => {
    try {
      const resultado: unknown = req.body?.resultado;
      const bruto: unknown = req.body?.medioPago;
      const medio = bruto === undefined || bruto === '' ? null : bruto;
      if (typeof resultado !== 'string' || !['Aprobado', 'Rechazado', 'Cancelado'].includes(resultado) ||
        (medio !== null && (typeof medio !== 'string' || !MEDIOS_PAGO.includes(medio as MedioPago)))) {
        throw new ErrorValidacion(['pago'], 'El resultado o el medio de pago no es válido.');
      }
      const pago = servicio.simularResultado(req.params.idPago, resultado as ResultadoPago, medio as MedioPago | null);
      res.redirect(303, `/reservas/${encodeURIComponent(codigoDe(pago.idReserva))}`);
    } catch (error) { errorDePago(res, error); }
  });

  router.post('/reservas/:codigoReserva/pagos', (req, res) => {
    try {
      res.redirect(303, servicio.iniciarPago(req.params.codigoReserva).ubicacion);
    } catch (error) { errorDePago(res, error); }
  });

  router.post('/simulacion/pasarela/:idPago/confirmar-devolucion', (req, res) => {
    try {
      const pago = servicio.confirmarDevolucion(req.params.idPago);
      res.redirect(303, `/reservas/${encodeURIComponent(codigoDe(pago.idReserva))}`);
    } catch (error) { errorDePago(res, error); }
  });
  return router;
}
