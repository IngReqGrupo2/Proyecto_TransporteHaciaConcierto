export function formatearMonto(monto: number): string {
  return `$${new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 }).format(monto)}`;
}

export function formatearFechaHora(valor: string): string {
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) {
    return valor;
  }

  return new Intl.DateTimeFormat('es-CL', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(fecha);
}
