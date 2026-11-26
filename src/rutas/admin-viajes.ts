import { Router } from 'express';
import type { BaseDeDatos } from '../db/conexion';
import {
  ErrorValidacion,
  ViajeRepositorio,
  type DatosNuevoViaje,
} from '../dominio/viaje';

// HU-03 · CU-04 · Actividad TO-BE «Publicar viaje con su costo, hora de salida y lugar de encuentro»
const VALORES_VACIOS: DatosNuevoViaje = {
  eventoNombre: '',
  eventoFecha: '',
  fechaViaje: '',
  horaSalida: '',
  horaRegreso: '',
  lugarEncuentro: '',
  descripcion: '',
  costo: '',
  conductor: '',
  asistente: '',
  modeloVehiculo: '',
  patente: '',
  tipoVehiculo: '',
};

function extraerValores(cuerpo: Record<string, unknown>): DatosNuevoViaje {
  const valor = (campo: keyof DatosNuevoViaje): string => {
    const dato = cuerpo[campo];
    return typeof dato === 'string' ? dato : '';
  };

  return {
    eventoNombre: valor('eventoNombre'),
    eventoFecha: valor('eventoFecha'),
    fechaViaje: valor('fechaViaje'),
    horaSalida: valor('horaSalida'),
    horaRegreso: valor('horaRegreso'),
    lugarEncuentro: valor('lugarEncuentro'),
    descripcion: valor('descripcion'),
    costo: valor('costo'),
    conductor: valor('conductor'),
    asistente: valor('asistente'),
    modeloVehiculo: valor('modeloVehiculo'),
    patente: valor('patente'),
    tipoVehiculo: valor('tipoVehiculo'),
  };
}

export function crearRutasAdminViajes(db: BaseDeDatos): Router {
  const router = Router();
  const repositorio = new ViajeRepositorio(db);

  router.use('/admin', (_req, res, next) => {
    res.locals.rol = 'Administrador';
    next();
  });

  router.get('/admin/viajes/nuevo', (_req, res) => {
    res.render('admin/viaje-nuevo', {
      titulo: 'Crear viaje',
      valores: VALORES_VACIOS,
      error: null,
      errores: {},
    });
  });

  router.post('/admin/viajes', (req, res) => {
    const valores = extraerValores(req.body as Record<string, unknown>);

    try {
      const viaje = repositorio.crearViaje(valores);
      res.status(201).render('admin/viaje-creado', {
        titulo: 'Viaje creado',
        viaje,
      });
    } catch (error) {
      if (error instanceof ErrorValidacion) {
        const errores: Record<string, string> = {};
        for (const campo of error.campos) {
          errores[campo] = error.message;
        }

        res.status(400).render('admin/viaje-nuevo', {
          titulo: 'Crear viaje',
          valores,
          error: error.message,
          errores,
        });
        return;
      }
      throw error;
    }
  });

  router.get('/admin/viajes/:idViaje', (req, res) => {
    const viaje = repositorio.buscarPorId(req.params.idViaje);
    if (!viaje) { res.sendStatus(404); return; }
    res.render('admin/viaje-creado', { titulo: 'Estado del viaje', viaje });
  });
  return router;
}
