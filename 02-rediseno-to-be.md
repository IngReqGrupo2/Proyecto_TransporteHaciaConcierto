# Análisis de rediseño y propuesta TO-BE
 
## Mejoras identificadas por participante
| Participante | Objetivo | Problema | Mejora deseada |
|----------------|----------|----------|-----------------|
| Cliente/Pasajero | Reservar un asiento rápido y asegurar su viaje al concierto. | Debe esperar respuesta manual para saber si queda cupo y pagar presencial el día del viaje. | Poder ver los cupos, reservar de forma autónoma y usar pago rápido en línea. |
| Administrador | Crear viajes, llenarlos sin sobrepasar los cupos limitados. | Perdida de tiempo respondiendo mensajes cuando ya no hay cupos y anota en libretas con riesgo de error o inasistencia. | Sistema para crear el viaje (cartelera), que maneje los cupos de forma automatizada y genere planillas de pasajeros, ademas de bloquear reservas si se llena la capacidad. |
| Asistente de viajes | Pasar lista y controlar el abordaje y realizar cobro sin demoras ni errores. | Depende de una libreta física con borrones o listas manuales en papel. | Visualizar la lista digital de pasajeros confirmados en tiempo real. |
 
## Iniciativas de rediseño
### Iniciativa 1
- **Actividad(es) del AS-IS que afecta:** Revisar disponibilidad de asientos, Avisar que no hay disponibilidad, Reserva de los asientos solicitados.
- **Heurística aplicada:** Autoservicio y Automatización de tareas.
- **Objetivo o mejora que resuelve:** Evitar que el administrador deba gestionar manualmente la disponibilidad y anotar pasajeros.
- **Efecto esperado (tiempo/costo/calidad/flexibilidad):** Reducción del tiempo de atención al cliente y mejora en la calidad de la información al no depender de una libreta física.

### Iniciativa 2
- **Actividad(es) del AS-IS que afecta:** Solicitar cobro, Realizar pago.
- **Heurística aplicada:** Integración (pasarela de pagos).
- **Objetivo o mejora que resuelve:** Asegurar el pago por adelantado mediante opciones en línea (débito, crédito, transferencia) antes del día del evento.
- **Efecto esperado (tiempo/costo/calidad/flexibilidad):** Disminución del riesgo económico por cancelaciones sin abono y reducción de cuellos de botella al abordar el furgón.

### Iniciativa 3
- **Actividad(es) del AS-IS que afecta:** Crear afiche con información del viaje, Crear publicación en RRSS del viaje.
- **Heurística aplicada:** Tecnología Integral (Integral technology) / Estandarización.
- **Objetivo o mejora que resuelve:** Centralizar la oferta en una cartelera virtual dentro de la nueva plataforma, eliminando el trabajo operativo de diseñar afiches en aplicaciones externas y publicarlos uno por uno en redes sociales.
- **Efecto esperado (tiempo/costo/calidad/flexibilidad):** Ahorro de tiempo del administrador al publicar los viajes de forma estandarizada y mejora en la calidad de la información entregada al cliente (oferta centralizada y actualizada en tiempo real).
 
## Diagrama TO-BE
![Proceso TO-BE](./diagramas/to-be.png)
 
Archivo fuente: [`./diagramas/to-be.bpmn`](./diagramas/to-be.bpmn)
 
 
## Actividades que cambian del AS-IS al TO-BE

| Actividad en el AS-IS | Actividad en el TO-BE | Qué cambia |
| :--- | :--- | :--- |
| Crear afiche con información del viaje / Crear publicación en RRSS del viaje | Publicar viaje (fecha, hora de salida y lugar de encuentro) | El administrador registra el viaje en la plataforma y el sistema genera la cartelera estandarizada automáticamente. |
| Enviar solicitud para reserva | Seleccionar viaje / Seleccionar cupos e ingresar datos de pasajeros | El cliente consulta y escoge los viajes disponibles directamente en la aplicación, sin enviar mensajes al administrador. |
| Revisar disponibilidad de asientos | Verificar cupo | El sistema (mediante tarea de servicio) consulta automáticamente los cupos disponibles y evita que se supere la capacidad máxima. |
| Avisar que no hay disponibilidad | Notificar que no hay cupos disponibles | El sistema informa automáticamente cuando no existen cupos y bloquea nuevas reservas para el viaje. |
| Se reserva los asientos solicitados | Reservar cupos seleccionados y actualizar cupos | Los datos del pasajero y su reserva quedan registrados automáticamente en el sistema al concretar la transacción. |
| Realizar pago / Solicitar cobro | Rellenar y enviar datos de pago / Verificar realización del pago | El pasajero realiza el pago en la plataforma al momento de la reserva, eliminando el cobro manual presencial el día del viaje. |
|  Pasar lista de pasajeros y decir indicaciones | Recibir lista de pasajeros y pasar lista | El asistente de viaje revisa una lista digital generada automáticamente con los pasajeros autorizados. |
