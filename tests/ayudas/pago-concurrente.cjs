// Ejecuta el código real TypeScript fuera del hilo de Vitest.
require('tsx/cjs');
const { parentPort, workerData } = require('node:worker_threads');
const Database = require('better-sqlite3');
const { ServicioPagos } = require('../../src/dominio/pago.ts');
const { ReservaRepositorio } = require('../../src/dominio/reserva.ts');
const { PasarelaPagoSimulada } = require('../../src/integraciones/pasarela-pago.ts');

const { ruta, idPago, accion, barrera, ganador, fechaFija, indiceReloj } = workerData;
const control = new Int32Array(barrera);
const db = new Database(ruta, { timeout: 5000 });
db.pragma('foreign_keys = ON');
const ahora = () => {
  Atomics.add(control, indiceReloj, 1);
  return new Date(fechaFija || (Atomics.load(control, 4) === 0
    ? '2026-11-22T12:07:59.999Z' : '2026-11-22T12:08:00.000Z'));
};
const servicio = new ServicioPagos(db, new PasarelaPagoSimulada(db, ahora), ahora);
const ejecutar = () => {
  if (accion === 'vencer') new ReservaRepositorio(db, ahora).procesarVencimientos();
  else if (accion === 'devolver') servicio.confirmarDevolucion(idPago);
  else servicio.simularResultado(idPago, 'Aprobado', 'Tarjeta de débito');
};
try {
  if (ganador) {
    db.transaction(() => {
      parentPort.postMessage('bloqueado');
      if (Atomics.wait(control, 1, 0, 10000) === 'timed-out') throw new Error('Barrera agotada');
      ejecutar();
    }).immediate();
  } else {
    // Prueba observable de que otra conexión tiene realmente el bloqueo de escritura.
    db.pragma('busy_timeout = 0');
    try {
      db.exec('BEGIN IMMEDIATE');
      db.exec('ROLLBACK');
      throw new Error('No se produjo contención real');
    } catch (error) {
      if (error.code !== 'SQLITE_BUSY') throw error;
    }
    db.pragma('busy_timeout = 5000');
    parentPort.postMessage('contencion');
    ejecutar();
  }
  parentPort.postMessage('terminado');
} finally { db.close(); }
