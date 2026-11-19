CREATE TABLE pasajero (
  id_pasajero INTEGER PRIMARY KEY AUTOINCREMENT,
  rut TEXT NOT NULL UNIQUE,
  nombres TEXT NOT NULL,
  apellidos TEXT NOT NULL,
  telefono TEXT NOT NULL,
  correo_electronico TEXT NOT NULL
);

CREATE TABLE asiento (
  id_asiento INTEGER PRIMARY KEY AUTOINCREMENT,
  id_viaje TEXT NOT NULL REFERENCES viaje(id_viaje) ON DELETE CASCADE,
  numero INTEGER NOT NULL CHECK (numero BETWEEN 1 AND 17),
  UNIQUE (id_viaje, numero)
);

CREATE UNIQUE INDEX ux_asiento_viaje_id
  ON asiento (id_viaje, id_asiento);

CREATE TABLE reserva (
  id_reserva INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo_reserva TEXT NOT NULL UNIQUE,
  id_pasajero INTEGER NOT NULL REFERENCES pasajero(id_pasajero) ON DELETE RESTRICT,
  id_viaje TEXT NOT NULL REFERENCES viaje(id_viaje) ON DELETE RESTRICT,
  id_asiento INTEGER NOT NULL,
  fecha_registro TEXT NOT NULL,
  vencimiento_retencion TEXT NOT NULL,
  estado TEXT NOT NULL CHECK (
    estado IN ('Pendiente de pago', 'Pagada', 'Vencida')
  ),
  FOREIGN KEY (id_viaje, id_asiento)
    REFERENCES asiento (id_viaje, id_asiento) ON DELETE RESTRICT
);

CREATE UNIQUE INDEX ux_reserva_asiento_activa
  ON reserva (id_asiento)
  WHERE estado IN ('Pendiente de pago', 'Pagada');

CREATE INDEX idx_reserva_pasajero
  ON reserva (id_pasajero);

CREATE TABLE integraciones_log (
  id_log INTEGER PRIMARY KEY AUTOINCREMENT,
  sistema TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  detalle TEXT NOT NULL,
  creada_en TEXT NOT NULL
);

WITH RECURSIVE numeros(numero) AS (
  SELECT 1
  UNION ALL
  SELECT numero + 1 FROM numeros WHERE numero < 17
)
INSERT INTO asiento (id_viaje, numero)
SELECT v.id_viaje, n.numero
FROM viaje v
JOIN numeros n ON n.numero <= v.capacidad;

UPDATE viaje
SET cupos_disponibles = capacidad - (
  SELECT COUNT(*)
  FROM reserva r
  WHERE r.id_viaje = viaje.id_viaje
    AND r.estado IN ('Pendiente de pago', 'Pagada')
);
