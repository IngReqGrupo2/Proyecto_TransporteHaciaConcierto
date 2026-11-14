CREATE TABLE viaje (
  id_viaje TEXT PRIMARY KEY,
  id_evento INTEGER NOT NULL UNIQUE REFERENCES evento(id_evento) ON DELETE RESTRICT,
  fecha_viaje DATE NOT NULL,
  hora_salida TIME NOT NULL,
  hora_regreso TIME NOT NULL,
  lugar_encuentro TEXT NOT NULL,
  costo REAL NOT NULL,
  capacidad INTEGER NOT NULL,
  cupos_disponibles INTEGER NOT NULL CHECK (cupos_disponibles >= 0),
  estado TEXT NOT NULL
);

CREATE INDEX idx_viaje_disponibles
  ON viaje (estado, fecha_viaje, hora_salida);
