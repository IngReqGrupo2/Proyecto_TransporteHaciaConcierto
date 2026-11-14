import path from 'node:path';
import { crearApp } from './app';
import { abrirBaseDeDatos } from './db/conexion';

const PUERTO = Number(process.env.PORT ?? 3000);
const rutaBase = path.join(process.cwd(), 'data', 'app.db');

const db = abrirBaseDeDatos(rutaBase);
const app = crearApp(db);

app.listen(PUERTO, () => {
  console.log(`Servidor iniciado en http://localhost:${PUERTO}`);
});
