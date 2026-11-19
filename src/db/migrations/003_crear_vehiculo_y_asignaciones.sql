CREATE TABLE vehiculo (
  id_vehiculo INTEGER PRIMARY KEY AUTOINCREMENT,
  modelo TEXT NOT NULL,
  patente TEXT NOT NULL UNIQUE,
  capacidad_pasajeros INTEGER NOT NULL CHECK (capacidad_pasajeros BETWEEN 1 AND 17)
);

INSERT INTO vehiculo (id_vehiculo, modelo, patente, capacidad_pasajeros)
VALUES (1, 'Mercedes-Benz Sprinter', 'LKPW42', 17);

CREATE TABLE viaje_nuevo (
  id_viaje TEXT PRIMARY KEY,
  id_evento INTEGER NOT NULL UNIQUE REFERENCES evento(id_evento) ON DELETE RESTRICT,
  id_vehiculo INTEGER NOT NULL REFERENCES vehiculo(id_vehiculo) ON DELETE RESTRICT,
  fecha_viaje DATE NOT NULL,
  hora_salida TIME NOT NULL,
  hora_regreso TIME NOT NULL,
  lugar_encuentro TEXT NOT NULL,
  costo REAL NOT NULL CHECK (costo > 0),
  capacidad INTEGER NOT NULL CHECK (capacidad BETWEEN 1 AND 17),
  cupos_disponibles INTEGER NOT NULL,
  estado TEXT NOT NULL,
  conductor_asignado TEXT NOT NULL,
  asistente_asignado TEXT NOT NULL,
  CHECK (cupos_disponibles >= 0 AND cupos_disponibles <= capacidad)
);

INSERT INTO viaje_nuevo (
  id_viaje, id_evento, id_vehiculo, fecha_viaje, hora_salida, hora_regreso,
  lugar_encuentro, costo, capacidad, cupos_disponibles, estado,
  conductor_asignado, asistente_asignado
)
SELECT
  id_viaje, id_evento, 1, fecha_viaje, hora_salida, hora_regreso,
  lugar_encuentro, costo, capacidad, cupos_disponibles, estado,
  '', ''
FROM viaje;

DROP TABLE viaje;

ALTER TABLE viaje_nuevo RENAME TO viaje;

CREATE INDEX idx_viaje_disponibles
  ON viaje (estado, fecha_viaje, hora_salida);
