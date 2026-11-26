CREATE TABLE gerente (
  rut TEXT PRIMARY KEY NOT NULL,
  correo_electronico TEXT NOT NULL,
  fecha_contratacion TEXT NOT NULL
);
INSERT INTO gerente (rut, correo_electronico, fecha_contratacion)
VALUES ('11111111-1', 'gerente@ejemplo.cl', '2026-01-01');

CREATE TABLE vehiculo_nuevo (
  id_vehiculo INTEGER PRIMARY KEY AUTOINCREMENT,
  modelo TEXT NOT NULL,
  patente TEXT NOT NULL UNIQUE,
  capacidad_pasajeros INTEGER NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'Minibús',
  CHECK ((tipo = 'Minibús' AND capacidad_pasajeros = 17)
      OR (tipo = 'Megabús' AND capacidad_pasajeros = 45))
);
INSERT INTO vehiculo_nuevo (id_vehiculo, modelo, patente, capacidad_pasajeros)
SELECT id_vehiculo, modelo, patente, 17 FROM vehiculo;
DROP TABLE vehiculo;
ALTER TABLE vehiculo_nuevo RENAME TO vehiculo;

CREATE TABLE viaje_nuevo (
  id_viaje TEXT PRIMARY KEY,
  id_evento INTEGER NOT NULL UNIQUE REFERENCES evento(id_evento) ON DELETE RESTRICT,
  id_vehiculo INTEGER NOT NULL REFERENCES vehiculo(id_vehiculo) ON DELETE RESTRICT,
  fecha_viaje DATE NOT NULL,
  hora_salida TIME NOT NULL,
  hora_regreso TIME NOT NULL,
  lugar_encuentro TEXT NOT NULL,
  costo REAL NOT NULL CHECK (costo > 0),
  capacidad INTEGER NOT NULL CHECK (capacidad BETWEEN 1 AND 45),
  cupos_disponibles INTEGER NOT NULL,
  estado TEXT NOT NULL,
  conductor_asignado TEXT NOT NULL,
  asistente_asignado TEXT NOT NULL,
  descripcion TEXT,
  estado_aprobacion TEXT NOT NULL DEFAULT 'Aprobado'
    CHECK (estado_aprobacion IN ('Pendiente', 'Aprobado', 'Rechazado')),
  rut_gerente TEXT REFERENCES gerente(rut) ON DELETE RESTRICT,
  CHECK (cupos_disponibles BETWEEN 0 AND capacidad),
  CHECK (estado <> 'Publicado' OR estado_aprobacion = 'Aprobado')
);
INSERT INTO viaje_nuevo (
  id_viaje, id_evento, id_vehiculo, fecha_viaje, hora_salida, hora_regreso,
  lugar_encuentro, costo, capacidad, cupos_disponibles, estado,
  conductor_asignado, asistente_asignado, descripcion
)
SELECT id_viaje, id_evento, id_vehiculo, fecha_viaje, hora_salida, hora_regreso,
  lugar_encuentro, costo, capacidad, cupos_disponibles, estado,
  conductor_asignado, asistente_asignado, descripcion FROM viaje;
DROP TABLE viaje;
ALTER TABLE viaje_nuevo RENAME TO viaje;
CREATE INDEX idx_viaje_disponibles ON viaje (estado, fecha_viaje, hora_salida);

CREATE TABLE asiento_nuevo (
  id_asiento INTEGER PRIMARY KEY AUTOINCREMENT,
  id_viaje TEXT NOT NULL REFERENCES viaje(id_viaje) ON DELETE CASCADE,
  numero INTEGER NOT NULL CHECK (numero BETWEEN 1 AND 45),
  vencimiento_retencion TEXT,
  cliente_retencion TEXT,
  id_reserva_vigente INTEGER REFERENCES reserva(id_reserva) ON DELETE RESTRICT,
  UNIQUE (id_viaje, numero)
);
INSERT INTO asiento_nuevo SELECT * FROM asiento;
DROP TABLE asiento;
ALTER TABLE asiento_nuevo RENAME TO asiento;
CREATE UNIQUE INDEX ux_asiento_viaje_id ON asiento (id_viaje, id_asiento);
CREATE INDEX idx_asiento_vencimiento ON asiento (vencimiento_retencion);
CREATE INDEX idx_asiento_reserva_vigente ON asiento (id_reserva_vigente);
CREATE INDEX idx_asiento_cliente ON asiento (id_viaje, cliente_retencion);
