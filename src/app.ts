import express, {
  type Express,
  type NextFunction,
  type Request,
  type Response,
} from 'express';
import path from 'node:path';
import type { BaseDeDatos } from './db/conexion';
import { crearRutasCartelera } from './rutas/cartelera';
import { formatearMonto } from './util/formato';

export function crearApp(db: BaseDeDatos): Express {
  const app = express();

  app.disable('x-powered-by');
  app.set('view engine', 'ejs');
  app.set('views', path.join(process.cwd(), 'src', 'vistas'));
  app.locals.formatearMonto = formatearMonto;

  app.use(express.static(path.join(process.cwd(), 'public')));
  app.use(crearRutasCartelera(db));

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
