-- HU-02 · MD-01: una reserva agrupa sus asientos y pasajeros mediante detalles.
CREATE TEMP TABLE reserva_anterior AS SELECT * FROM reserva;
DROP TABLE reserva;

CREATE TABLE reserva (
  id_reserva INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo_reserva TEXT NOT NULL UNIQUE,
  id_viaje TEXT NOT NULL REFERENCES viaje(id_viaje) ON DELETE RESTRICT,
  fecha_registro TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'Pendiente de pago' CHECK (
    estado IN ('Pendiente de pago', 'Pagada', 'Vencida')
  ),
  ida_y_vuelta INTEGER NOT NULL DEFAULT 0 CHECK (ida_y_vuelta IN (0, 1)),
  lugar_regreso TEXT,
  CHECK (ida_y_vuelta = 0 OR LENGTH(TRIM(COALESCE(lugar_regreso, ''))) > 0),
  UNIQUE (id_viaje, id_reserva)
);

INSERT INTO reserva (id_reserva, codigo_reserva, id_viaje, fecha_registro, estado)
SELECT id_reserva, codigo_reserva, id_viaje, fecha_registro, estado
FROM reserva_anterior;

CREATE TABLE detalle_reserva (
  id_detalle_reserva INTEGER PRIMARY KEY AUTOINCREMENT,
  id_reserva INTEGER NOT NULL,
  id_viaje TEXT NOT NULL,
  id_asiento INTEGER NOT NULL,
  id_pasajero INTEGER NOT NULL REFERENCES pasajero(id_pasajero) ON DELETE RESTRICT,
  UNIQUE (id_reserva, id_asiento),
  FOREIGN KEY (id_viaje, id_reserva)
    REFERENCES reserva (id_viaje, id_reserva) ON DELETE CASCADE,
  FOREIGN KEY (id_viaje, id_asiento)
    REFERENCES asiento (id_viaje, id_asiento) ON DELETE RESTRICT
);

CREATE INDEX idx_detalle_pasajero ON detalle_reserva (id_pasajero);
CREATE INDEX idx_detalle_asiento ON detalle_reserva (id_asiento);

INSERT INTO detalle_reserva (id_reserva, id_viaje, id_asiento, id_pasajero)
SELECT id_reserva, id_viaje, id_asiento, id_pasajero FROM reserva_anterior;

ALTER TABLE asiento ADD COLUMN vencimiento_retencion TEXT;
ALTER TABLE asiento ADD COLUMN cliente_retencion TEXT;
ALTER TABLE asiento ADD COLUMN id_reserva_vigente INTEGER
  REFERENCES reserva(id_reserva) ON DELETE RESTRICT;

-- El índice parcial de la versión 004 garantizaba una única asignación vigente.
-- Las reservas vencidas solo aportan historial, nunca sobrescriben la vigente.
UPDATE asiento
SET id_reserva_vigente = (
    SELECT r.id_reserva FROM reserva_anterior r
    WHERE r.id_asiento = asiento.id_asiento
      AND r.estado IN ('Pendiente de pago', 'Pagada')
  ),
  vencimiento_retencion = (
    SELECT r.vencimiento_retencion FROM reserva_anterior r
    WHERE r.id_asiento = asiento.id_asiento AND r.estado = 'Pendiente de pago'
  );

CREATE INDEX idx_asiento_vencimiento ON asiento (vencimiento_retencion);
CREATE INDEX idx_asiento_reserva_vigente ON asiento (id_reserva_vigente);
CREATE INDEX idx_asiento_cliente ON asiento (id_viaje, cliente_retencion);

UPDATE viaje
SET cupos_disponibles = capacidad - (
  SELECT COUNT(*) FROM asiento a
  WHERE a.id_viaje = viaje.id_viaje AND a.id_reserva_vigente IS NOT NULL
);

DROP TABLE reserva_anterior;
