import { randomUUID } from 'node:crypto';
import { Router, type Request, type Response } from 'express';
import type { BaseDeDatos } from '../db/conexion';
import { ErrorSinDisponibilidad, ErrorViajeNoDisponible, ReservaRepositorio,
  type DatosPasajero, type DatosReserva } from '../dominio/reserva';
import { ErrorValidacion, ViajeRepositorio } from '../dominio/viaje';
import type { ServicioCorreo } from '../integraciones/correo';

const VACIOS: DatosReserva = { pasajeros: [], idaYVuelta: false, lugarRegreso: '' };

function clienteDe(req: Request, res: Response): string {
  const cookie = req.headers.cookie?.split(';').map((c) => c.trim())
    .find((c) => c.startsWith('clienteReserva='))?.slice('clienteReserva='.length);
  if (cookie && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(cookie)) return cookie;
  const cliente = randomUUID();
  res.cookie('clienteReserva', cliente, { httpOnly: true, sameSite: 'lax', path: '/' });
  return cliente;
}

function objeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function texto(valor: unknown, campo: string): string {
  if (valor === undefined) return '';
  if (typeof valor !== 'string') throw new ErrorValidacion([campo], 'Revisa los datos del formulario.');
  return valor;
}

function extraerValores(cuerpo: unknown): DatosReserva {
  if (!objeto(cuerpo)) throw new ErrorValidacion(['pasajeros'], 'Revisa los datos del formulario.');
  const modalidad = texto(cuerpo.idaYVuelta, 'idaYVuelta');
  if (!['', '0', '1'].includes(modalidad)) throw new ErrorValidacion(['idaYVuelta'], 'Selecciona una modalidad válida.');
  const bruto = cuerpo.pasajeros;
  if (bruto !== undefined && !objeto(bruto) && !Array.isArray(bruto)) {
    throw new ErrorValidacion(['pasajeros'], 'Revisa los datos de los pasajeros.');
  }
  const entradas = Object.entries(bruto ?? {});
  if (entradas.length > 17) throw new ErrorValidacion(['pasajeros'], 'Revisa la selección de asientos.');
  const pasajeros: DatosPasajero[] = entradas.map(([clave, valor]) => {
    if (!objeto(valor)) throw new ErrorValidacion(['pasajeros'], 'Revisa los datos de los pasajeros.');
    // qs puede compactar claves numéricas como un array; el campo oculto conserva el ID.
    const idAsiento = texto(valor.idAsiento ?? (Array.isArray(bruto) ? undefined : clave), 'idAsiento');
    if (!/^\d+$/.test(idAsiento) || (!Array.isArray(bruto) && Number(clave) !== Number(idAsiento))) {
      throw new ErrorValidacion(['pasajeros'], 'Revisa la selección de asientos.');
    }
    return { idAsiento, rut: texto(valor.rut, `pasajeros.${idAsiento}.rut`),
      nombres: texto(valor.nombres, `pasajeros.${idAsiento}.nombres`),
      apellidos: texto(valor.apellidos, `pasajeros.${idAsiento}.apellidos`),
      telefono: texto(valor.telefono, `pasajeros.${idAsiento}.telefono`),
      correoElectronico: texto(valor.correoElectronico, `pasajeros.${idAsiento}.correoElectronico`) };
  });
  return { pasajeros, idaYVuelta: modalidad === '1', lugarRegreso: texto(cuerpo.lugarRegreso, 'lugarRegreso') };
}

// HU-02 · CU-02 · DSS-01 · TO-BE: seleccionar, verificar y registrar cupos.
export function crearRutasReservas(
  db: BaseDeDatos, correo: ServicioCorreo, ahora: () => Date = () => new Date(),
): Router {
  const router = Router();
  const reservas = new ReservaRepositorio(db, ahora);
  const viajes = new ViajeRepositorio(db);

  function formulario(res: Response, idViaje: string, cliente: string,
    valores: DatosReserva = VACIOS, error: ErrorValidacion | ErrorSinDisponibilidad | null = null): void {
    reservas.procesarVencimientos();
    const viaje = viajes.buscarPublicadoPorId(idViaje);
    if (!viaje) {
      res.status(404).render('error', { titulo: 'Viaje no encontrado', mensaje: 'El viaje no existe o no está disponible.' });
      return;
    }
    const retenidos = reservas.listarRetenidos(idViaje, cliente);
    const errores: Record<string, string> = {};
    if (error instanceof ErrorValidacion) {
      for (const campo of error.campos) errores[campo] = error.message;
    }
    res.status(error || (viaje.cuposDisponibles <= 0 && retenidos.length === 0) ? 400 : 200)
      .render('reserva-nueva', { titulo: 'Reservar asientos', viaje,
        asientos: reservas.listarAsientosDisponibles(idViaje), retenidos, valores, errores,
        error: error?.message ?? (viaje.cuposDisponibles <= 0 && retenidos.length === 0
          ? 'No hay cupos disponibles para el viaje seleccionado.' : null) });
  }

  router.get('/cartelera/:idViaje/reservar', (req, res) => {
    formulario(res, req.params.idViaje, clienteDe(req, res));
  });

  router.post('/cartelera/:idViaje/retenciones', (req, res) => {
    const cliente = clienteDe(req, res);
    try {
      reservas.retenerAsiento(req.params.idViaje, texto(req.body?.idAsiento, 'idAsiento'), cliente);
      res.redirect(303, `/cartelera/${encodeURIComponent(req.params.idViaje)}/reservar`);
    } catch (error) {
      if (error instanceof ErrorValidacion || error instanceof ErrorSinDisponibilidad) {
        formulario(res, req.params.idViaje, cliente, VACIOS, error);
      } else if (error instanceof ErrorViajeNoDisponible) {
        res.status(404).render('error', { titulo: 'Viaje no encontrado', mensaje: error.message });
      } else throw error;
    }
  });

  router.post('/cartelera/:idViaje/reservar', (req, res) => {
    const cliente = clienteDe(req, res);
    let valores = VACIOS;
    try {
      valores = extraerValores(req.body);
      const reserva = reservas.registrarReserva(req.params.idViaje, cliente, valores);
      const pasajeros = new Map(reserva.detalles.map((d) => [d.pasajero.idPasajero, d.pasajero]));
      for (const pasajero of pasajeros.values()) {
        try {
          correo.solicitarNotificacionRegistroExitoso(pasajero.correoElectronico, reserva,
            reserva.detalles.filter((d) => d.pasajero.idPasajero === pasajero.idPasajero).map((d) => d.asiento));
        } catch (error) {
          console.error('No se pudo registrar la notificación simulada.', error);
        }
      }
      res.status(201).render('reserva-creada', { titulo: 'Reserva registrada', reserva });
    } catch (error) {
      if (error instanceof ErrorValidacion || error instanceof ErrorSinDisponibilidad) {
        formulario(res, req.params.idViaje, cliente, valores, error);
      } else if (error instanceof ErrorViajeNoDisponible) {
        res.status(404).render('error', { titulo: 'Viaje no encontrado', mensaje: error.message });
      } else throw error;
    }
  });

  router.get('/reservas/:codigoReserva', (req, res) => {
    const reserva = reservas.buscarPorCodigo(req.params.codigoReserva);
    if (!reserva) {
      res.status(404).render('error', { titulo: 'Reserva no encontrada', mensaje: 'No se encontró la reserva solicitada.' });
      return;
    }
    res.render('reserva-detalle', { titulo: `Reserva ${reserva.codigoReserva}`, reserva });
  });
  return router;
}
