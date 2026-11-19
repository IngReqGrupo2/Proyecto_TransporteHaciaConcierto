import type { BaseDeDatos } from '../db/conexion';

export interface Evento {
  idEvento: number;
  nombre: string;
  fechaEvento: string;
}

export interface Vehiculo {
  idVehiculo: number;
  modelo: string;
  patente: string;
  capacidadPasajeros: number;
}

export interface Viaje {
  idViaje: string;
  idEvento: number;
  idVehiculo: number;
  fechaViaje: string;
  horaSalida: string;
  horaRegreso: string;
  lugarEncuentro: string;
  costo: number;
  capacidad: number;
  cuposDisponibles: number;
  estado: string;
  conductorAsignado: string;
  asistenteAsignado: string;
}

export interface ViajeConEvento extends Viaje {
  eventoNombre: string;
  eventoFecha: string;
  vehiculoModelo: string;
  vehiculoPatente: string;
}

export interface DatosNuevoViaje {
  eventoNombre: string;
  eventoFecha: string;
  fechaViaje: string;
  horaSalida: string;
  horaRegreso: string;
  lugarEncuentro: string;
  costo: string;
  conductor: string;
  asistente: string;
  modeloVehiculo: string;
  patente: string;
}

export class ErrorValidacion extends Error {
  constructor(
    public readonly campos: string[],
    mensaje: string,
  ) {
    super(mensaje);
    this.name = 'ErrorValidacion';
  }
}

export const CAPACIDAD_MAXIMA = 17;

const ETIQUETAS: Record<keyof DatosNuevoViaje, string> = {
  eventoNombre: 'nombre del evento',
  eventoFecha: 'fecha del evento',
  fechaViaje: 'fecha del viaje',
  horaSalida: 'hora de salida',
  horaRegreso: 'hora de regreso',
  lugarEncuentro: 'lugar de encuentro',
  costo: 'costo',
  conductor: 'conductor',
  asistente: 'asistente',
  modeloVehiculo: 'modelo del vehículo',
  patente: 'patente',
};

const CAMPOS_OBLIGATORIOS = Object.keys(ETIQUETAS) as Array<
  keyof DatosNuevoViaje
>;

const PATENTE_ACTUAL = /^[A-Z]{4}[0-9]{2}$/;

const NOMBRE_CON_LETRA = /[a-záéíóúüñ]/i;

const FORMATO_FECHA = /^(\d{4})-(\d{2})-(\d{2})$/;

const ANIOS_LIMITE = 100;

export interface ResultadoFechaCalendario {
  valida: boolean;
  motivo?: 'formato' | 'calendario' | 'anterior' | 'posterior';
}

export function validarFechaCalendario(
  valor: string,
  referencia: Date = new Date(),
): ResultadoFechaCalendario {
  const partes = FORMATO_FECHA.exec(valor);
  if (!partes) {
    return { valida: false, motivo: 'formato' };
  }

  const anio = Number(partes[1]);
  const mes = Number(partes[2]);
  const dia = Number(partes[3]);
  const fecha = new Date(anio, mes - 1, dia);

  if (
    !Number.isFinite(fecha.getTime()) ||
    fecha.getFullYear() !== anio ||
    fecha.getMonth() !== mes - 1 ||
    fecha.getDate() !== dia
  ) {
    return { valida: false, motivo: 'calendario' };
  }

  const hoy = new Date(
    referencia.getFullYear(),
    referencia.getMonth(),
    referencia.getDate(),
  );

  if (fecha < hoy) {
    return { valida: false, motivo: 'anterior' };
  }

  const limite = new Date(hoy.getFullYear() + ANIOS_LIMITE, 11, 31);
  if (fecha > limite) {
    return { valida: false, motivo: 'posterior' };
  }

  return { valida: true };
}

function mensajeFechaInvalida(
  etiqueta: 'del evento' | 'del viaje',
  referencia: Date,
): string {
  const anioLimite = referencia.getFullYear() + ANIOS_LIMITE;
  return `La fecha ${etiqueta} debe ser una fecha real del calendario, no anterior a hoy y no posterior al 31 de diciembre de ${anioLimite}.`;
}

function normalizarPatente(patente: string): string {
  return patente.trim().toUpperCase().replace(/[\s-]/g, '');
}

export function normalizarDatosNuevoViaje(
  datos: DatosNuevoViaje,
): DatosNuevoViaje {
  return {
    ...datos,
    eventoNombre: datos.eventoNombre.trim(),
    eventoFecha: datos.eventoFecha.trim(),
    fechaViaje: datos.fechaViaje.trim(),
    horaSalida: datos.horaSalida.trim(),
    horaRegreso: datos.horaRegreso.trim(),
    lugarEncuentro: datos.lugarEncuentro.trim(),
    costo: datos.costo.trim(),
    conductor: datos.conductor.trim(),
    asistente: datos.asistente.trim(),
    modeloVehiculo: datos.modeloVehiculo.trim(),
    patente: normalizarPatente(datos.patente),
  };
}

const COLUMNAS_VIAJE = `
  v.id_viaje AS idViaje,
  v.id_evento AS idEvento,
  v.id_vehiculo AS idVehiculo,
  v.fecha_viaje AS fechaViaje,
  v.hora_salida AS horaSalida,
  v.hora_regreso AS horaRegreso,
  v.lugar_encuentro AS lugarEncuentro,
  v.costo AS costo,
  v.capacidad AS capacidad,
  v.cupos_disponibles AS cuposDisponibles,
  v.estado AS estado,
  v.conductor_asignado AS conductorAsignado,
  v.asistente_asignado AS asistenteAsignado,
  e.nombre AS eventoNombre,
  e.fecha_evento AS eventoFecha,
  ve.modelo AS vehiculoModelo,
  ve.patente AS vehiculoPatente
`;

export class ViajeRepositorio {
  constructor(private readonly db: BaseDeDatos) {}

  listarDisponibles(): ViajeConEvento[] {
    return this.db
      .prepare(`
        SELECT ${COLUMNAS_VIAJE}
        FROM viaje v
        INNER JOIN evento e ON e.id_evento = v.id_evento
        INNER JOIN vehiculo ve ON ve.id_vehiculo = v.id_vehiculo
        WHERE v.estado = 'Publicado' AND v.cupos_disponibles > 0
        ORDER BY v.fecha_viaje ASC, v.hora_salida ASC
      `)
      .all() as ViajeConEvento[];
  }

  buscarPublicadoPorId(idViaje: string): ViajeConEvento | undefined {
    return this.db
      .prepare(`
        SELECT ${COLUMNAS_VIAJE}
        FROM viaje v
        INNER JOIN evento e ON e.id_evento = v.id_evento
        INNER JOIN vehiculo ve ON ve.id_vehiculo = v.id_vehiculo
        WHERE v.id_viaje = ? AND v.estado = 'Publicado'
      `)
      .get(idViaje) as ViajeConEvento | undefined;
  }

  crearViaje(datos: DatosNuevoViaje): ViajeConEvento {
    const limpios = normalizarDatosNuevoViaje(datos);

    const faltantes = CAMPOS_OBLIGATORIOS.filter(
      (campo) => limpios[campo] === '',
    );
    if (faltantes.length > 0) {
      throw new ErrorValidacion(
        faltantes,
        `Completa los campos obligatorios: ${faltantes
          .map((campo) => ETIQUETAS[campo])
          .join(', ')}.`,
      );
    }

    const ahora = new Date();
    const eventoFechaValida = validarFechaCalendario(
      limpios.eventoFecha,
      ahora,
    ).valida;
    const fechaViajeValida = validarFechaCalendario(
      limpios.fechaViaje,
      ahora,
    ).valida;

    if (!eventoFechaValida && !fechaViajeValida) {
      const anioLimite = ahora.getFullYear() + ANIOS_LIMITE;
      throw new ErrorValidacion(
        ['eventoFecha', 'fechaViaje'],
        `Las fechas del evento y del viaje deben ser fechas reales del calendario, no anteriores a hoy y no posteriores al 31 de diciembre de ${anioLimite}.`,
      );
    }

    if (!eventoFechaValida) {
      throw new ErrorValidacion(
        ['eventoFecha'],
        mensajeFechaInvalida('del evento', ahora),
      );
    }

    if (!fechaViajeValida) {
      throw new ErrorValidacion(
        ['fechaViaje'],
        mensajeFechaInvalida('del viaje', ahora),
      );
    }

    if (limpios.fechaViaje > limpios.eventoFecha) {
      throw new ErrorValidacion(
        ['fechaViaje'],
        'La fecha del viaje no puede ser posterior a la fecha del evento.',
      );
    }

    if (!NOMBRE_CON_LETRA.test(limpios.conductor)) {
      throw new ErrorValidacion(
        ['conductor'],
        'El nombre del conductor debe contener al menos una letra.',
      );
    }

    if (!NOMBRE_CON_LETRA.test(limpios.asistente)) {
      throw new ErrorValidacion(
        ['asistente'],
        'El nombre del asistente debe contener al menos una letra.',
      );
    }

    const costo = Number(limpios.costo);
    if (!Number.isFinite(costo) || costo <= 0) {
      throw new ErrorValidacion(
        ['costo'],
        'El costo debe ser un monto mayor que cero.',
      );
    }

    if (!PATENTE_ACTUAL.test(limpios.patente)) {
      throw new ErrorValidacion(
        ['patente'],
        'La patente debe tener el formato chileno actual: cuatro letras y dos dígitos (AABB11).',
      );
    }

    const crear = this.db.transaction(() => {
      const evento = this.db
        .prepare('INSERT INTO evento (nombre, fecha_evento) VALUES (?, ?)')
        .run(limpios.eventoNombre, limpios.eventoFecha);
      const idEvento = Number(evento.lastInsertRowid);

      let vehiculo = this.buscarVehiculoPorPatente(limpios.patente);

      if (!vehiculo) {
        const insertado = this.db
          .prepare(
            'INSERT INTO vehiculo (modelo, patente, capacidad_pasajeros) VALUES (?, ?, ?)',
          )
          .run(limpios.modeloVehiculo, limpios.patente, CAPACIDAD_MAXIMA);
        vehiculo = {
          idVehiculo: Number(insertado.lastInsertRowid),
          modelo: limpios.modeloVehiculo,
          patente: limpios.patente,
          capacidadPasajeros: CAPACIDAD_MAXIMA,
        };
      }

      if (vehiculo.capacidadPasajeros > CAPACIDAD_MAXIMA) {
        throw new ErrorValidacion(
          ['patente'],
          'La capacidad del vehículo no puede superar los 17 pasajeros.',
        );
      }

      const idViaje = this.siguienteIdViaje();
      this.db
        .prepare(`
          INSERT INTO viaje (
            id_viaje, id_evento, id_vehiculo, fecha_viaje, hora_salida,
            hora_regreso, lugar_encuentro, costo, capacidad,
            cupos_disponibles, estado, conductor_asignado, asistente_asignado
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Publicado', ?, ?)
        `)
        .run(
          idViaje,
          idEvento,
          vehiculo.idVehiculo,
          limpios.fechaViaje,
          limpios.horaSalida,
          limpios.horaRegreso,
          limpios.lugarEncuentro,
          costo,
          vehiculo.capacidadPasajeros,
          vehiculo.capacidadPasajeros,
          limpios.conductor,
          limpios.asistente,
        );

      return idViaje;
    });

    const idViaje = crear();
    return this.buscarPublicadoPorId(idViaje) as ViajeConEvento;
  }

  private buscarVehiculoPorPatente(patente: string): Vehiculo | undefined {
    return this.db
      .prepare(`
        SELECT
          id_vehiculo AS idVehiculo,
          modelo,
          patente,
          capacidad_pasajeros AS capacidadPasajeros
        FROM vehiculo
        WHERE patente = ?
      `)
      .get(patente) as Vehiculo | undefined;
  }

  private siguienteIdViaje(): string {
    const filas = this.db
      .prepare("SELECT id_viaje AS id FROM viaje WHERE id_viaje LIKE 'V-%'")
      .all() as Array<{ id: string }>;

    const maximo = filas.reduce((max, fila) => {
      const coincidencia = /^V-(\d+)$/.exec(fila.id);
      return coincidencia ? Math.max(max, Number(coincidencia[1])) : max;
    }, 0);

    return `V-${String(maximo + 1).padStart(3, '0')}`;
  }
}
