 Atributos de calidad (ISO 25010)

## Priorización de los 9 atributos de primer nivel:
1. Seguridad
2. Fiabilidad
3. Capacidad de interacción
4. Adecuación funcional
5. Eficiencia de desempeño
6. Compatibilidad
7. Mantenibilidad
8. Flexibilidad
9. Safety
 
## Métricas de los 3 atributos más importantes

### Seguridad
- **Métrica:** Porcentaje de operaciones sensibles realizadas únicamente por usuarios autorizados.
- **Cómo se mide:** Se prueban funciones restringidas, como la gestión de viajes y la consulta administrativa de reservas, con usuarios autorizados y no autorizados. Se calcula: `(operaciones sensibles correctamente protegidas / total de operaciones sensibles probadas) × 100`.
- **Meta:** 100 % de las operaciones sensibles probadas deben impedir el acceso a usuarios no autorizados.

### Fiabilidad
- **Métrica:** Porcentaje de operaciones críticas completadas manteniendo datos consistentes.
- **Cómo se mide:** Se prueban la reserva de cupos, actualización de disponibilidad, registro de pasajeros y confirmación de pagos. Se calcula: `(operaciones críticas completadas sin inconsistencias / total de operaciones críticas probadas) × 100`.
- **Meta:** 100 % de las operaciones críticas probadas deben finalizar sin sobrepasar la capacidad del viaje, duplicar reservas ni dejar estados de pago inconsistentes.

### Capacidad de interacción
- **Métrica:** Porcentaje de tareas principales que un usuario puede completar correctamente desde un dispositivo móvil.
- **Cómo se mide:** Se prueban las tareas de consultar la cartelera, seleccionar un viaje y completar una reserva desde dispositivos móviles. Se calcula: `(tareas completadas correctamente / total de tareas principales probadas) × 100`.
- **Meta:** 100 % de las tareas principales definidas deben poder completarse correctamente desde un dispositivo móvil.
