import express, {
  type Express,
  type NextFunction,
  type Request,
  type Response,
} from 'express';
import path from 'node:path';
import type { BaseDeDatos } from './db/conexion';
import { ServicioCorreoSimulado } from './integraciones/correo';
import { ReservaRepositorio } from './dominio/reserva';
import { crearRutasAdminViajes } from './rutas/admin-viajes';
import { crearRutasCartelera } from './rutas/cartelera';
import { crearRutasReservas } from './rutas/reservas';
import { formatearFechaHora, formatearMonto } from './util/formato';

export function crearApp(db: BaseDeDatos, opciones: { ahora?: () => Date } = {}): Express {
  const app = express();
  const ahora = opciones.ahora ?? (() => new Date());
  const reservas = new ReservaRepositorio(db, ahora);

  app.disable('x-powered-by');
  app.set('view engine', 'ejs');
  app.set('views', path.join(process.cwd(), 'src', 'vistas'));
  app.locals.formatearMonto = formatearMonto;
  app.locals.formatearFechaHora = formatearFechaHora;

  app.use(express.static(path.join(process.cwd(), 'public')));
  app.use(express.urlencoded({ extended: true }));
  app.use((_req, res, next) => {
    reservas.procesarVencimientos();
    res.locals.rol = 'Pasajero';
    next();
  });
  app.use(crearRutasCartelera(db));
  app.use(crearRutasReservas(db, new ServicioCorreoSimulado(db), ahora));
  app.use(crearRutasAdminViajes(db));

  app.use((_req, res) => {
    res.status(404).render('error', {
      titulo: 'Página no encontrada',
      mensaje: 'La página solicitada no existe.',
    });
  });

  app.use(
    (
      error: unknown,
      _req: Request,
      res: Response,
      _next: NextFunction,
    ) => {
      console.error(error);
      res.status(500).render('error', {
        titulo: 'Error inesperado',
        mensaje: 'Ocurrió un error inesperado. Intenta nuevamente.',
      });
    },
  );

  return app;
}
