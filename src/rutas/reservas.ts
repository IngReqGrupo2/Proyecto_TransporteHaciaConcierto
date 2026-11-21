import { Router } from 'express';
import type { BaseDeDatos } from '../db/conexion';
import {
  ErrorSinDisponibilidad,
  ErrorViajeNoDisponible,
  ReservaRepositorio,
  type DatosReserva,
} from '../dominio/reserva';
import { ErrorValidacion, ViajeRepositorio } from '../dominio/viaje';
import type { ServicioCorreo } from '../integraciones/correo';

// HU-02 · CU-02 · Actividad TO-BE «Reservar cupos seleccionados y actualizar cupos»
const VALORES_VACIOS: DatosReserva = {
  idAsiento: '',
  rut: '',
  nombres: '',
  apellidos: '',
  telefono: '',
  correoElectronico: '',
};

function extraerValores(cuerpo: Record<string, unknown>): DatosReserva {
  const valor = (campo: keyof DatosReserva): string => {
    const dato = cuerpo[campo];
    return typeof dato === 'string' ? dato : '';
  };

  return {
    idAsiento: valor('idAsiento'),
    rut: valor('rut'),
    nombres: valor('nombres'),
    apellidos: valor('apellidos'),
    telefono: valor('telefono'),
    correoElectronico: valor('correoElectronico'),
  };
}

export function crearRutasReservas(
  db: BaseDeDatos,
  correo: ServicioCorreo,
): Router {
  const router = Router();
  const reservas = new ReservaRepositorio(db);
  const viajes = new ViajeRepositorio(db);

  router.get('/cartelera/:idViaje/reservar', (req, res) => {
    const viaje = viajes.buscarPublicadoPorId(req.params.idViaje);

    if (!viaje) {
      res.status(404).render('error', {
        titulo: 'Viaje no encontrado',
        mensaje: 'El viaje no existe o no está disponible.',
      });
      return;
    }

    if (viaje.cuposDisponibles <= 0) {
      res.status(400).render('error', {
        titulo: 'Sin cupos disponibles',
        mensaje: 'No hay cupos disponibles para el viaje seleccionado.',
      });
      return;
    }

    res.render('reserva-nueva', {
      titulo: 'Reservar asiento',
      viaje,
      asientos: reservas.listarAsientosDisponibles(viaje.idViaje),
      valores: VALORES_VACIOS,
      error: null,
      errores: {},
    });
  });

  router.post('/cartelera/:idViaje/reservar', (req, res) => {
    const valores = extraerValores(req.body as Record<string, unknown>);

    try {
      const reserva = reservas.registrarReserva(req.params.idViaje, valores);

      try {
        correo.solicitarNotificacionRegistroExitoso(
          reserva.pasajero.correoElectronico,
          reserva,
        );
      } catch (error) {
        console.error('No se pudo registrar la notificación simulada.', error);
      }

      res.status(201).render('reserva-creada', {
        titulo: 'Reserva registrada',
        reserva,
      });
    } catch (error) {
      if (error instanceof ErrorValidacion) {
        const viaje = viajes.buscarPublicadoPorId(req.params.idViaje);
        if (!viaje) {
          res.status(404).render('error', {
            titulo: 'Viaje no encontrado',
            mensaje: 'El viaje no existe o no está disponible.',
          });
          return;
        }

        const errores: Record<string, string> = {};
        for (const campo of error.campos) {
          errores[campo] = error.message;
        }

        res.status(400).render('reserva-nueva', {
          titulo: 'Reservar asiento',
          viaje,
          asientos: reservas.listarAsientosDisponibles(viaje.idViaje),
          valores,
          error: error.message,
          errores,
        });
        return;
      }

      if (error instanceof ErrorSinDisponibilidad) {
        const viaje = viajes.buscarPublicadoPorId(req.params.idViaje);
        if (!viaje) {
          res.status(404).render('error', {
            titulo: 'Viaje no encontrado',
            mensaje: 'El viaje no existe o no está disponible.',
          });
          return;
        }

        res.status(400).render('reserva-nueva', {
          titulo: 'Reservar asiento',
          viaje,
          asientos: reservas.listarAsientosDisponibles(viaje.idViaje),
          valores,
          error: error.message,
          errores: {},
        });
        return;
      }

      if (error instanceof ErrorViajeNoDisponible) {
        res.status(404).render('error', {
          titulo: 'Viaje no encontrado',
          mensaje: error.message,
        });
        return;
      }

      throw error;
    }
  });

  router.get('/reservas/:codigoReserva', (req, res) => {
    const codigo = req.params.codigoReserva.trim().toUpperCase();
    const reserva = reservas.buscarPorCodigo(codigo);

    if (!reserva) {
      res.status(404).render('error', {
        titulo: 'Reserva no encontrada',
        mensaje: 'No se encontró la reserva solicitada.',
      });
      return;
    }

    res.render('reserva-detalle', {
      titulo: `Reserva ${reserva.codigoReserva}`,
      reserva,
    });
  });

  return router;
}
