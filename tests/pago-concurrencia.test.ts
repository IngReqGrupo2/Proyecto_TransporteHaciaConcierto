import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Worker } from 'node:worker_threads';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { abrirBaseDeDatos, type BaseDeDatos } from '../src/db/conexion';
import { ServicioPagos } from '../src/dominio/pago';
import { ReservaRepositorio } from '../src/dominio/reserva';
import { PasarelaPagoSimulada } from '../src/integraciones/pasarela-pago';
import { sembrarViaje } from './ayudas';
import { crearApp } from '../src/app';

function preparar() {
  const directorio = fs.mkdtempSync(path.join(os.tmpdir(), 'hu05-concurrencia-'));
  const ruta = path.join(directorio, 'app.db');
  const db = abrirBaseDeDatos(ruta);
  const ahora = () => new Date('2026-11-22T12:00:00Z');
  sembrarViaje(db, { cuposDisponibles: 17 });
  const reservas = new ReservaRepositorio(db, ahora);
  for (const id of [1, 2]) reservas.retenerAsiento('V-001', String(id), 'A');
  reservas.registrarReserva('V-001', 'A', { idaYVuelta: false, lugarRegreso: '', pasajeros: [1, 2].map((id) => ({
    idAsiento: String(id), rut: `${id}23K`, nombres: 'Ana', apellidos: 'Rojas', telefono: '123', correoElectronico: 'ana@ejemplo.cl',
  })) });
  const servicio = new ServicioPagos(db, new PasarelaPagoSimulada(db, ahora), ahora);
  const { pago } = servicio.iniciarPago('R-001');
  return { db, ruta, directorio, pago };
}

function lanzar(datos: Record<string, unknown>) {
  const worker = new Worker(path.join(process.cwd(), 'tests/ayudas/pago-concurrente.cjs'), { workerData: datos });
  const recibidos = new Set<string>();
  const pendientes = new Map<string, { resolve: () => void; reject: (e: Error) => void }>();
  worker.on('message', (tipo: string) => { recibidos.add(tipo); pendientes.get(tipo)?.resolve(); });
  worker.on('error', (e) => { for (const p of pendientes.values()) p.reject(e instanceof Error ? e : new Error(String(e))); });
  const salida = new Promise<void>((resolve, reject) => {
    worker.once('error', reject);
    worker.once('exit', (codigo) => codigo === 0 ? resolve() : reject(new Error(`Worker terminó con ${codigo}`)));
  });
  // Evita rechazos sin consumidor mientras se está esperando otra barrera.
  void salida.catch(() => {});
  return { worker, salida, esperar: (tipo: string) => recibidos.has(tipo) ? Promise.resolve()
    : new Promise<void>((resolve, reject) => pendientes.set(tipo, { resolve, reject })) };
}

async function competir(ruta: string, idPago: string, primera: string, segunda: string, fechaPrimera: string) {
  const barrera = new SharedArrayBuffer(5 * Int32Array.BYTES_PER_ELEMENT);
  const control = new Int32Array(barrera);
  const a = lanzar({ ruta, idPago, accion: primera, barrera, ganador: true, fechaFija: fechaPrimera, indiceReloj: 2 });
  let b: ReturnType<typeof lanzar> | undefined;
  try {
    await a.esperar('bloqueado');
    b = lanzar({ ruta, idPago, accion: segunda, barrera, ganador: false, indiceReloj: 3 });
    await b.esperar('contencion');
    expect(Atomics.load(control, 3)).toBe(0); // No se leyó el reloj antes de obtener el bloqueo.
    Atomics.store(control, 4, 1); // Mientras esperaba se alcanza el vencimiento.
    Atomics.store(control, 1, 1);
    Atomics.notify(control, 1);
    await Promise.all([a.salida, b.salida]);
    expect(Atomics.load(control, 2)).toBeGreaterThan(0);
    expect(Atomics.load(control, 3)).toBeGreaterThan(0);
  } finally {
    Atomics.store(control, 1, 1);
    Atomics.notify(control, 1);
    await a.worker.terminate();
    if (b) await b.worker.terminate();
  }
}

function comprobar(db: BaseDeDatos, estado: 'Pagada' | 'Vencida') {
  expect(db.prepare('SELECT estado FROM reserva').get()).toEqual({ estado });
  expect(db.prepare('SELECT * FROM asiento WHERE id_reserva_vigente IS NOT NULL').all())
    .toHaveLength(estado === 'Pagada' ? 2 : 0);
  expect(db.prepare('SELECT cupos_disponibles FROM viaje').get())
    .toEqual({ cupos_disponibles: estado === 'Pagada' ? 15 : 17 });
  expect(db.prepare("SELECT * FROM integraciones_log WHERE mensaje='Resultado de pago'").all()).toHaveLength(1);
  expect(db.prepare("SELECT * FROM integraciones_log WHERE mensaje='Solicitud de devolución completa'").all())
    .toHaveLength(estado === 'Pagada' ? 0 : 1);
}

describe('HU-05 · Concurrencia real entre conexiones SQLite', () => {
  it('responde 503 recuperable cuando se agota la espera del bloqueo, sin efectos parciales', async () => {
    const { db, ruta, directorio, pago } = preparar();
    const barrera = new SharedArrayBuffer(5 * Int32Array.BYTES_PER_ELEMENT);
    const control = new Int32Array(barrera);
    const a = lanzar({ ruta, idPago: pago.idPago, accion: 'vencer', barrera, ganador: true,
      fechaFija: '2026-11-22T12:00:00Z', indiceReloj: 2 });
    try {
      await a.esperar('bloqueado');
      db.pragma('busy_timeout = 25');
      const app = crearApp(db, { ahora: () => new Date('2026-11-22T12:00:00Z') });
      const respuesta = await request(app).get('/reservas/R-001').expect(503).expect('Retry-After', '1');
      expect(respuesta.text).toContain('Vuelve a intentar la misma operación');
      Atomics.store(control, 1, 1);
      Atomics.notify(control, 1);
      await a.salida;
      await request(app).get('/reservas/R-001').expect(200);
      expect(db.prepare('SELECT estado FROM pago').get()).toEqual({ estado: 'Pendiente' });
    } finally {
      Atomics.store(control, 1, 1); Atomics.notify(control, 1);
      await a.worker.terminate(); db.close(); fs.rmSync(directorio, { recursive: true, force: true });
    }
  }, 20000);

  it('HU-05 · Aprobación vigente completada antes de procesar el vencimiento concurrente', async () => {
    const { db, ruta, directorio, pago } = preparar();
    db.close();
    try {
      await competir(ruta, pago.idPago, 'aprobar', 'vencer', '2026-11-22T12:07:59.999Z');
      const nueva = abrirBaseDeDatos(ruta);
      try { comprobar(nueva, 'Pagada'); } finally { nueva.close(); }
    } finally { fs.rmSync(directorio, { recursive: true, force: true }); }
  }, 20000);

  it('HU-05 · Vencimiento completado antes de procesar la aprobación concurrente', async () => {
    const { db, ruta, directorio, pago } = preparar();
    db.close();
    try {
      await competir(ruta, pago.idPago, 'vencer', 'aprobar', '2026-11-22T12:08:00.000Z');
      const nueva = abrirBaseDeDatos(ruta);
      try { comprobar(nueva, 'Vencida'); } finally { nueva.close(); }
    } finally { fs.rmSync(directorio, { recursive: true, force: true }); }
  }, 20000);

  it.each([
    { nombre: 'Aprobación repetida de un pago que confirmó la reserva', accion: 'aprobar', tarde: false, devolver: false },
    { nombre: 'Aprobación tardía duplicada sin otra devolución', accion: 'aprobar', tarde: true, devolver: false },
    { nombre: 'Confirmación de devolución repetida', accion: 'devolver', tarde: true, devolver: true },
    { nombre: 'Aprobación repetida después de la devolución completa', accion: 'aprobar', tarde: true, devolver: true },
  ])('HU-05 · $nombre', async ({ accion, tarde, devolver }) => {
    const { db, ruta, directorio, pago } = preparar();
    const ahora = () => new Date('2026-11-22T12:08:00.000Z');
    const inicial = new ServicioPagos(db, new PasarelaPagoSimulada(db, ahora), ahora);
    if (devolver) {
      inicial.simularResultado(pago.idPago, 'Aprobado', 'Tarjeta de débito');
      inicial.confirmarDevolucion(pago.idPago);
    }
    db.close();
    try {
      await competir(ruta, pago.idPago, accion, accion, tarde
        ? '2026-11-22T12:08:00.000Z' : '2026-11-22T12:07:59.999Z');
      const nueva = abrirBaseDeDatos(ruta);
      try {
        comprobar(nueva, tarde ? 'Vencida' : 'Pagada');
        const servicio = new ServicioPagos(nueva, new PasarelaPagoSimulada(nueva, ahora), ahora);
        const antes = nueva.prepare('SELECT * FROM pago').all();
        const logs = nueva.prepare('SELECT * FROM integraciones_log').all();
        if (accion === 'devolver') servicio.confirmarDevolucion(pago.idPago);
        else servicio.simularResultado(pago.idPago, 'Aprobado', 'Tarjeta de débito');
        expect(nueva.prepare('SELECT * FROM pago').all()).toEqual(antes);
        expect(nueva.prepare('SELECT * FROM integraciones_log').all()).toEqual(logs);
        expect(servicio.pagos.buscar(pago.idPago)).toMatchObject({
          estado: devolver ? 'Devuelto' : 'Aprobado',
          claveDevolucion: tarde ? `devolucion:${pago.idPago}` : null,
        });
        expect(nueva.prepare("SELECT * FROM integraciones_log WHERE mensaje='Confirmación de devolución completa'").all())
          .toHaveLength(devolver ? 1 : 0);
      } finally { nueva.close(); }
    } finally { fs.rmSync(directorio, { recursive: true, force: true }); }
  }, 20000);
});
