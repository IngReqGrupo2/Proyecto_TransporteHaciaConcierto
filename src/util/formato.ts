export function formatearMonto(monto: number): string {
  return `$${new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 }).format(monto)}`;
}
