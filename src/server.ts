import path from 'node:path';
import { crearApp } from './app';
import { abrirBaseDeDatos } from './db/conexion';
import type { BaseDeDatos } from './db/conexion';
import { ReservaRepositorio } from './dominio/reserva';

export function iniciarServidor(db: BaseDeDatos, puerto = 3000, ahora: () => Date = () => new Date()) {
  const reservas = new ReservaRepositorio(db, ahora);
  // HU-02 · EST-01: regularizar antes de escuchar y liberar aun sin solicitudes.
  reservas.procesarVencimientos();
  const app = crearApp(db, { ahora });
  const temporizador = setInterval(() => {
    try {
      reservas.procesarVencimientos();
    } catch (error) {
      console.error('No se pudieron procesar los vencimientos.', error);
    }
  }, 1000);
  temporizador.unref();
  const servidor = app.listen(puerto);
  servidor.once('close', () => { clearInterval(temporizador); db.close(); });
  servidor.once('error', () => { clearInterval(temporizador); db.close(); });
  return servidor;
}

const rutaEjecutada = process.argv[1]?.replace(/\\/g, '/') ?? '';
if (rutaEjecutada.endsWith('/src/server.ts')) {
  const puerto = Number(process.env.PORT ?? 3000);
  const db = abrirBaseDeDatos(path.join(process.cwd(), 'data', 'app.db'));
  const servidor = iniciarServidor(db, puerto);
  servidor.once('listening', () => console.log(`Servidor iniciado en http://localhost:${puerto}`));
  const cerrar = () => servidor.close();
  process.once('SIGINT', cerrar);
  process.once('SIGTERM', cerrar);
}
