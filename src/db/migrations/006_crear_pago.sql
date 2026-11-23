-- HU-05 · MD-01 / EST-02. Aditiva: conserva reservas, asientos y plazos existentes.
CREATE TABLE pago (
  id_pago TEXT PRIMARY KEY NOT NULL,
  id_reserva INTEGER NOT NULL REFERENCES reserva(id_reserva) ON DELETE RESTRICT,
  monto REAL NOT NULL CHECK (monto > 0),
  medio_pago TEXT CHECK (medio_pago IN ('Tarjeta de crédito', 'Tarjeta de débito')),
  fecha_pago TEXT,
  estado TEXT NOT NULL DEFAULT 'Pendiente'
    CHECK (estado IN ('Pendiente', 'Aprobado', 'Rechazado', 'Cancelado', 'Devuelto')),
  creado_en TEXT NOT NULL,
  referencia_pasarela TEXT NOT NULL UNIQUE,
  clave_devolucion TEXT UNIQUE,
  solicitud_devolucion_en TEXT,
  devolucion_confirmada_en TEXT,
  CHECK ((clave_devolucion IS NULL) = (solicitud_devolucion_en IS NULL)),
  CHECK (clave_devolucion IS NULL OR clave_devolucion = 'devolucion:' || id_pago),
  CHECK (solicitud_devolucion_en IS NULL OR estado IN ('Aprobado', 'Devuelto')),
  CHECK ((estado = 'Devuelto') = (devolucion_confirmada_en IS NOT NULL)),
  CHECK (estado <> 'Devuelto' OR solicitud_devolucion_en IS NOT NULL),
  CHECK ((estado IN ('Aprobado', 'Devuelto')) = (fecha_pago IS NOT NULL)),
  CHECK (estado NOT IN ('Aprobado', 'Devuelto') OR medio_pago IS NOT NULL)
);

CREATE INDEX idx_pago_reserva ON pago (id_reserva, creado_en);
CREATE UNIQUE INDEX ux_pago_pendiente ON pago (id_reserva) WHERE estado = 'Pendiente';
