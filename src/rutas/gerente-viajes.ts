import { Router, type Response } from 'express';
import type { BaseDeDatos } from '../db/conexion';
import { RUT_GERENTE_DEMO } from '../db/seed';
import { ViajeRepositorio } from '../dominio/viaje';

export function crearRutasGerenteViajes(db: BaseDeDatos): Router {
  const router = Router();
  const viajes = new ViajeRepositorio(db);
  const renderizar = (res: Response, aviso: string | null) => res.render('gerente-viajes', {
    titulo: 'Viajes pendientes de aprobación', viajes: viajes.listarPendientesDeAprobacion(), aviso,
  });
  router.use('/gerente', (_req, res, next) => { res.locals.rol = 'Gerente'; next(); });
  router.get('/gerente/viajes/pendientes', (_req, res) => renderizar(res, null));
  router.post('/gerente/viajes/:idViaje/decision', (req, res) => {
    const decision: unknown = req.body?.decision;
    if (decision !== 'Aprobado' && decision !== 'Rechazado') {
      return renderizar(res.status(400), 'Selecciona aprobar o rechazar.');
    }
    const resultado = viajes.decidirAprobacion(req.params.idViaje, decision, RUT_GERENTE_DEMO);
    if (resultado === 'ya-resuelto') return renderizar(res.status(409), 'El viaje ya fue resuelto.');
    if (resultado === 'no-encontrado') return renderizar(res.status(404), 'No se encontró el viaje con megabús.');
    return renderizar(res, decision === 'Aprobado' ? 'Viaje aprobado y publicado.' : 'Viaje rechazado.');
  });
  return router;
}
