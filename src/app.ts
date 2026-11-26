import express, {
  type Express,
  type NextFunction,
  type Request,
  type Response,
} from 'express';
import path from 'node:path';
import type { BaseDeDatos } from './db/conexion';
import { ServicioCorreoSimulado } from './integraciones/correo';
import { PasarelaPagoSimulada, type PasarelaPago } from './integraciones/pasarela-pago';
import { ServicioPagos } from './dominio/pago';
import { ReservaRepositorio } from './dominio/reserva';
import { crearRutasAdminViajes } from './rutas/admin-viajes';
import { crearRutasGerenteViajes } from './rutas/gerente-viajes';
import { crearRutasCartelera } from './rutas/cartelera';
import { crearRutasReservas } from './rutas/reservas';
import { crearRutasPagos } from './rutas/pagos';
import { formatearFechaHora, formatearMonto } from './util/formato';

export function crearApp(db: BaseDeDatos, opciones: { ahora?: () => Date; pasarela?: PasarelaPago } = {}): Express {
  const app = express();
  const ahora = opciones.ahora ?? (() => new Date());
  const reservas = new ReservaRepositorio(db, ahora);
  const pagos = new ServicioPagos(db, opciones.pasarela ?? new PasarelaPagoSimulada(db, ahora), ahora);

  app.disable('x-powered-by');
  app.set('view engine', 'ejs');
  app.set('views', path.join(process.cwd(), 'src', 'vistas'));
  app.locals.formatearMonto = formatearMonto;
  app.locals.formatearFechaHora = formatearFechaHora;

  app.use(express.static(path.join(process.cwd(), 'public')));
  app.use(express.urlencoded({ extended: true }));
  app.use((_req, res, next) => {
    res.locals.rol = 'Pasajero';
    reservas.procesarVencimientos();
    next();
  });
  app.use(crearRutasCartelera(db));
  app.use(crearRutasReservas(db, new ServicioCorreoSimulado(db), ahora, pagos));
  app.use(crearRutasPagos(db, pagos, ahora));
  app.use(crearRutasAdminViajes(db));
  app.use(crearRutasGerenteViajes(db));

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
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'SQLITE_BUSY') {
        res.set('Retry-After', '1').status(503).render('error', { titulo: 'Operación temporalmente ocupada',
          mensaje: 'La base de datos está ocupada. Vuelve a intentar la misma operación.' });
        return;
      }
      console.error(error);
      res.status(500).render('error', {
        titulo: 'Error inesperado',
        mensaje: 'Ocurrió un error inesperado. Intenta nuevamente.',
      });
    },
  );

  return app;
}
