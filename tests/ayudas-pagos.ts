import type { DatosPasajero } from '../src/dominio/reserva';

// Datos de ejemplo compartidos por HTTP, recorridos temporales y pruebas de HU-05.
export function pasajeroEjemplo(id: number): DatosPasajero {
  return { idAsiento: String(id), rut: `${id}234567K`, nombres: id === 1 ? 'Camila' : 'José',
    apellidos: 'Rojas', telefono: '+56912345678', correoElectronico: `pasajero${id}@ejemplo.cl` };
}

export function formularioReserva(ids: number[], idaYVuelta = false): string {
  const datos = new URLSearchParams({ idaYVuelta: idaYVuelta ? '1' : '0', lugarRegreso: idaYVuelta ? 'Terminal Norte' : '' });
  for (const id of ids) {
    for (const [campo, valor] of Object.entries(pasajeroEjemplo(id))) datos.append(`pasajeros[${id}][${campo}]`, valor);
  }
  return datos.toString();
}
