import { Router } from 'express';
import type { BaseDeDatos } from '../db/conexion';
import { ViajeRepositorio } from '../dominio/viaje';

// HU-01 · CU-01 · Actividad TO-BE «Seleccionar viaje»
export function crearRutasCartelera(db: BaseDeDatos): Router {
  const router = Router();
  const repositorio = new ViajeRepositorio(db);

  router.get('/', (_req, res) => {
    res.redirect(302, '/cartelera');
  });

  router.get('/cartelera', (_req, res) => {
    const viajes = repositorio.listarDisponibles();
    res.render('cartelera', { titulo: 'Cartelera de viajes', viajes });
  });

  router.get('/cartelera/:idViaje', (req, res) => {
    const viaje = repositorio.buscarPublicadoPorId(req.params.idViaje);

    if (!viaje) {
      res.status(404).render('error', {
        titulo: 'Viaje no encontrado',
        mensaje: 'El viaje no existe o no está disponible.',
      });
      return;
    }

    res.render('detalle', { titulo: viaje.eventoNombre, viaje });
  });

  return router;
}
