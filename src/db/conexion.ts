import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

export type BaseDeDatos = Database.Database;

function directorioMigraciones(): string {
  return path.join(process.cwd(), 'src', 'db', 'migrations');
}

export function abrirBaseDeDatos(rutaArchivo: string): BaseDeDatos {
  if (rutaArchivo !== ':memory:') {
    fs.mkdirSync(path.dirname(path.resolve(rutaArchivo)), { recursive: true });
  }

  const db = new Database(rutaArchivo);
  db.pragma('foreign_keys = ON');
  aplicarMigraciones(db);
  return db;
}

export function aplicarMigraciones(
  db: BaseDeDatos,
  directorio = directorioMigraciones(),
): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      nombre TEXT PRIMARY KEY,
      aplicada_en TEXT NOT NULL
    );
  `);

  const filas = db
    .prepare('SELECT nombre FROM schema_migrations')
    .all() as Array<{ nombre: string }>;
  const aplicadas = new Set(filas.map((fila) => fila.nombre));

  const archivos = fs
    .readdirSync(directorio)
    .filter((archivo) => archivo.endsWith('.sql'))
    .sort();
  const registrar = db.prepare(
    'INSERT INTO schema_migrations (nombre, aplicada_en) VALUES (?, ?)',
  );

  for (const archivo of archivos) {
    if (aplicadas.has(archivo)) {
      continue;
    }

    const sql = fs.readFileSync(path.join(directorio, archivo), 'utf8');
    const reconstruyeTablasReferenciadas = archivo === '007_aprobacion_viajes.sql';
    const clavesActivas = db.pragma('foreign_keys', { simple: true });
    if (reconstruyeTablasReferenciadas) db.pragma('foreign_keys = OFF');
    try {
      db.transaction(() => {
        db.exec(sql);
        if (reconstruyeTablasReferenciadas && db.prepare('PRAGMA foreign_key_check').all().length > 0) {
          throw new Error(`Referencias inválidas después de aplicar ${archivo}.`);
        }
        registrar.run(archivo, new Date().toISOString());
      })();
    } finally {
      if (reconstruyeTablasReferenciadas && clavesActivas) db.pragma('foreign_keys = ON');
    }
  }
}
