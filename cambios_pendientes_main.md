# Lista de cambios pendientes — Rama `main`

**Proyecto:** Sistema de Reservas de Transporte Hacia Conciertos  
**Repositorio:** [IngReqGrupo2/Proyecto_TransporteHaciaConcierto](https://github.com/IngReqGrupo2/Proyecto_TransporteHaciaConcierto/tree/main)  
**Revisión:** 14 de noviembre de 2026  
**Alcance:** Documentación y diagramas de la Entrega 2, contrastados con la Entrega 1.  
**Importante:** Este documento es una lista de recomendaciones y hallazgos. No se han modificado archivos del repositorio. La conformidad final depende de la rúbrica del curso.

## 1. Cambios de prioridad alta

### 1.1. Corregir la referencia al caso de uso del pago

- [ ] **Archivo:** [`10-diagramas-secuencia.md`](https://github.com/IngReqGrupo2/Proyecto_TransporteHaciaConcierto/blob/main/10-diagramas-secuencia.md).
- **Problema:** DSS-02 («Pagar reserva») se enlaza a `CU-05`, que corresponde a «Ver listado de pasajeros».
- **Corrección:** Cambiar esa referencia a `CU-03` («Pagar reserva»), conforme a `09-casos-de-uso.md`.
- **Verificación:** DSS-02, HU-05, CU-03 y la matriz de trazabilidad deben referirse al mismo proceso.

### 1.2. Unificar quién controla la asistencia de los pasajeros

- [ ] **Archivos:** `03-requisitos.md`, `04-historias-usuario.md`, `07-criterios-aceptacion.md`, `09-casos-de-uso.md` y `12-trazabilidad.md` (además de los diagramas que correspondan).
- **Problema:** `RP-08` asigna la consulta de nómina al **asistente de viaje**, mientras que `HU-04` y `CU-05` la asignan al **administrador**. La asistencia de ida y regreso aparece asociada al administrador en las historias y criterios.
- **Corrección:** Acordar si la responsabilidad corresponde al asistente, al administrador o a ambos con permisos diferenciados; ajustar en consecuencia los requisitos, historias, actores, casos de uso, criterios y trazabilidad.
- **Verificación:** No debe haber contradicciones sobre quién puede consultar la lista, marcar asistencia de ida y verificar pasajeros en el regreso.

### 1.3. Aclarar la contabilización de cupos retenidos y pagados

- [ ] **Archivos:** `diagramas/dss-02.mmd`, `10-diagramas-secuencia.md`, `04-historias-usuario.md` y, si es necesario, `03-requisitos.md` y `07-criterios-aceptacion.md`.
- **Problema:** DSS-01 retiene temporalmente un asiento; DSS-02 indica después «descuenta definitivamente el cupo», lo que puede interpretarse como un **segundo descuento**. El diagrama de estados `EST-01` aclara correctamente que el cupo ya fue retenido.
- **Corrección propuesta:** Declarar expresamente que una retención vigente deja el cupo **no disponible para terceros**; cuando se aprueba el pago, la retención **se convierte en reserva confirmada sin reducir otra vez la disponibilidad**; si vencen los 8 minutos sin pago aprobado, se libera el cupo.
- **Verificación:** Alinear DSS-01, DSS-02, EST-01, HU-05, RP-03, RP-11 y RP-D01.

## 2. Cambios de prioridad media

### 2.1. Corregir el texto del modelo de dominio para que coincida con PlantUML

- [ ] **Archivo:** [`08-modelo-dominio.md`](https://github.com/IngReqGrupo2/Proyecto_TransporteHaciaConcierto/blob/main/08-modelo-dominio.md).
- **Problema A:** La tabla señala multiplicidades «incompletas en el diagrama» para las relaciones Vehículo–Viaje, Viaje–Reserva, Pasajero–Reserva y Reserva–Pago, pero `diagramas/modelo-dominio.puml` ya utiliza expresiones completas, como `1..*` y `0..*`.
- **Corrección A:** Actualizar la tabla y eliminar la afirmación de que estas multiplicidades están incompletas. Revisar aparte si las multiplicidades elegidas son adecuadas para el negocio, especialmente Evento–Viaje y Vehículo–Viaje.
- **Problema B:** El apartado «Decisiones de modelado» afirma que las siete relaciones son asociaciones simples y que no hay composición, aunque en `modelo-dominio.puml` aparece `Reserva "1" *-- "0..1" RegistroAsistencia` (**composición**).
- **Corrección B:** Describir esa composición correctamente o, si no es intencional, cambiarla a asociación simple en el archivo `.puml` y regenerar la imagen `.png`.
- **Verificación:** Que la descripción textual, el archivo `.puml` y la imagen `.png` representen el mismo modelo.

### 2.2. Completar escenarios Gherkin para criterios ya definidos

- [ ] **Archivo:** [`07-criterios-aceptacion.md`](https://github.com/IngReqGrupo2/Proyecto_TransporteHaciaConcierto/blob/main/07-criterios-aceptacion.md).
- **HU-02:** Añadir o precisar un escenario en que el pasajero consulta su reserva registrada, correspondiente a `CA3` en `04-historias-usuario.md`.
- **HU-04:** Añadir un escenario que cubra la comprobación de pasajeros a bordo en el **trayecto de regreso**, correspondiente a `CA3` de HU-04.
- **HU-05:** Incluir explícitamente que la retención expira a los **8 minutos** sin pago aprobado y que entonces se libera el cupo.
- **HU-05:** En el escenario de pago fallido, distinguir entre **pago no completado** y **reserva temporalmente pendiente**; actualmente el mensaje «la reserva no se ha realizado» puede contradecir el hecho de que el cupo sigue retenido.
- **Verificación:** Los escenarios deben permitir comprobar los criterios de aceptación sin introducir reglas contradictorias.

### 2.3. Actualizar las observaciones de trazabilidad

- [ ] **Archivo:** [`12-trazabilidad.md`](https://github.com/IngReqGrupo2/Proyecto_TransporteHaciaConcierto/blob/main/12-trazabilidad.md).
- **Problema A:** La observación 3 menciona `10-diagramas-secuencia-sistema.md`, pero el archivo existente se llama `10-diagramas-secuencia.md`.
- **Corrección A:** Reemplazar el nombre por la ruta correcta.
- **Problema B:** La misma observación advierte que DSS-02 todavía declara `CU-05`.
- **Corrección B:** Una vez corregido el documento de secuencia, actualizar la observación para no dejar un error ya resuelto descrito como pendiente.
- **Problema C:** Las observaciones 6, 7 y 10 reconocen contradicciones de responsables, cupos y modelo de dominio.
- **Corrección C:** Tras corregir los documentos de origen, revisar esas observaciones y mantener solo las discrepancias que realmente continúen presentes.
- **Verificación:** Que la matriz refleje exactamente los nombres e identificadores vigentes y no señale inconsistencias corregidas.

## 3. Ajustes de prioridad baja

### 3.1. Arreglar enlaces internos a historias y casos de uso

- [ ] **Archivos:** `09-casos-de-uso.md`, `10-diagramas-secuencia.md` y cualquier otro documento con vínculos similares.
- **Problema:** Algunos enlaces usan fragmentos como `#hu-01` o `#cu-02`, pero los títulos reales de las historias son más largos y `09-casos-de-uso.md` enumera los casos en una **tabla**, sin encabezados propios `CU-02`/`CU-03`.
- **Corrección:** Enlazar a los encabezados reales de GitHub cuando existan. Para casos de uso que solo están en una tabla, enlazar al archivo (sin fragmento) o crear anclas verificables, según permita el formato de la entrega.
- **Verificación:** Abrir todos los enlaces desde la vista renderizada de GitHub y confirmar que llevan al lugar correcto.

### 3.2. Revisar la funcionalidad de cambiar el nombre de un pasajero (solo si está dentro del alcance)

- [ ] **Archivos posibles:** `03-requisitos.md`, `04-historias-usuario.md`, `07-criterios-aceptacion.md`, `09-casos-de-uso.md` y `12-trazabilidad.md`.
- **Observación:** La funcionalidad «pasar lista» está representada, pero **editar/corregir el nombre de un pasajero** no está especificada claramente.
- **Acción:** Confirmar con el equipo si la opción de cambiar nombre es un requisito del proyecto. **Si lo es**, incorporarla a los artefactos pertinentes con reglas de autorización, validación y trazabilidad. **Si no lo es**, no añadirla solo por esta revisión.

### 3.3. Revisión editorial final

- [ ] Corregir tildes y errores menores de redacción (`pérdida`, `estén`, `revisión`, `actualización`, etc.).
- [ ] Unificar términos: «asiento», «cupo», «pasajero confirmado», «reserva pendiente» y «reserva pagada».
- [ ] Verificar que las imágenes `.png` correspondan a las versiones actuales de sus archivos fuente `.puml`, `.mmd`, `.drawio` y `.bpmn`.

## 4. Comprobaciones de cierre

- [ ] Revisar los cinco pares historia de usuario ↔ caso de uso: `HU-01/CU-01`, `HU-02/CU-02`, `HU-03/CU-04`, `HU-04/CU-05` y `HU-05/CU-03`.
- [ ] Confirmar que DSS-01 está vinculado a `HU-02/CU-02` y DSS-02 a `HU-05/CU-03`.
- [ ] Confirmar que ninguna operación descuenta dos veces un asiento ya retenido.
- [ ] Comprobar que el control de asistencia tenga responsables y permisos coherentes en todos los documentos.
- [ ] Comprobar consistencia entre modelo de dominio, imágenes, diagramas de estado y trazabilidad.
- [ ] Verificar los enlaces Markdown desde GitHub.
- [ ] Contrastar la versión final con la **rúbrica oficial** de la Entrega 2.

---

**Estado general de la revisión:** Los archivos principales de las entregas 1 y 2 están presentes. Se recomiendan principalmente **correcciones de consistencia**, no la creación de entregables adicionales. No se cambió ningún archivo del repositorio durante esta revisión.
