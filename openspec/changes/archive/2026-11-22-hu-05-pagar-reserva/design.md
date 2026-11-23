# Diseño — HU-05: Pagar reserva

## Context

La motivación y el alcance están en `proposal.md`; el contrato observable está en `specs/pagos-reservas/spec.md`. La ficha aprobada `.cin324/historias/HU-05.md` resuelve las diferencias con los documentos del curso.

### Estado observado

- La aplicación usa Express/EJS, `better-sqlite3`, repositorios de dominio, migraciones SQL transaccionales y Vitest/supertest. `crearApp` ya recibe un reloj `ahora` para probar plazos.
- `ReservaRepositorio` gestiona retenciones de 8 minutos por asiento y vencimiento completo, pero sus únicos eventos actuales son `registrarReserva` y `vencerRetencion`. La aprobación de pago aún no existe.
- En `registrarReserva`, el `UPDATE asiento` asigna `id_reserva_vigente` y deja `vencimiento_retencion = NULL`. Eso contradice la ficha vigente y las expectativas de `tests/reserva-repositorio.test.ts` y `tests/reservas.test.ts`. No hay un trigger que restaure el vencimiento en la migración 005.
- `crearRutasReservas` registra la reserva, solicita correo simulado y responde `201` con `reserva-creada`. La consulta por código solo presenta la reserva.
- Existen `integraciones_log` y el patrón `ServicioCorreo` / `ServicioCorreoSimulado`, pero no tabla, repositorio, adaptador ni rutas de pago.
- Hay dos archivos con prefijo `005`, diferenciados por nombre completo. El migrador ordena por nombre y registra cada archivo en `schema_migrations`; ambos se deben conservar y la nueva migración será `006_crear_pago.sql`.
- No hay capacidades principales en `openspec/specs/`. Los deltas anteriores de `registro-reservas` continúan sin archivar y no se reescriben.

## Goals / Non-Goals

**Goals:**
- Extender el patrón de repositorio y adaptador existente con un coordinador de pagos y un reloj común.
- Serializar aprobación y vencimiento en SQLite para impedir confirmaciones parciales, estados terminales sobrescritos y descuentos duplicados.
- Separar la solicitud automática de devolución de la confirmación externa, conservando ambas después de reiniciar.
- Hacer verificables los diez escenarios de la ficha y los siete escenarios adicionales de atomicidad e idempotencia sin dinero real, esperas de 8 minutos en pruebas ni cambios manuales sobre `data/app.db`.

**Non-Goals:**
- Crear un framework de integración, proceso separado, cola de mensajes o servidor para la pasarela simulada.
- Introducir un proveedor, credenciales, autenticación o almacenamiento de datos reales de tarjetas.
- Reconstruir vencimientos ya borrados mediante un nuevo plazo desde el registro, pues alteraría la regla aprobada.

## Decisions

### 1. Mantener los vencimientos de HU-02 y centralizar la transición de aprobación

**Decisión:** al registrar la reserva, conservar `asiento.vencimiento_retencion`, asignar `id_reserva_vigente` y limpiar solamente `cliente_retencion`. Agregar el evento `pagoAprobado` a la transición de `ReservaRepositorio`, con una guarda que verifique estado pendiente, todos los detalles, pertenencia de los asientos a la reserva y vencimientos no nulos y estrictamente posteriores al instante recibido. Una reserva Pagada conserva su asignación y no vence por sus antiguos plazos.

Un servicio coordinador de pagos ejecutará la actualización de Pago y la transición de Reserva dentro de una misma transacción inmediata (`BEGIN IMMEDIATE`, mediante `db.transaction(...).immediate()`), usando la misma conexión e instante. Todos los puntos de entrada del vencimiento, incluido el temporizador, deben usar la misma disciplina. El instante se obtiene después de adquirir el bloqueo de escritura; no se usa una lectura de estado o del reloj tomada antes de esperar por otra transacción para decidir si aún puede pagar.

Las actualizaciones de estado de Reserva se condicionan a `WHERE id_reserva = ? AND estado = 'Pendiente de pago'`, además de comprobar dentro de la transacción las guardas de vigencia o vencimiento. Solo si el resultado indica `changes === 1` se aplican los efectos de esa transición. Si no cambió ninguna fila, se vuelve al estado persistido sin confirmar ni liberar asientos por esa operación. Ninguna de estas rutas transforma Pagada en Vencida ni Vencida en Pagada.

Si al procesar una aprobación se alcanzó un vencimiento, reutilizar el vencimiento completo antes de registrar la solicitud de devolución. Las liberaciones solo operan sobre asientos cuyo `id_reserva_vigente` coincide con la reserva que vence, y solo se restituyen los cupos efectivamente liberados. Si falla cualquier parte del resultado o de sus efectos, la transacción revierte todos sus cambios. Los métodos de repositorio anidados usan la misma conexión y puntos de guardado, sin confirmar independientemente de la transacción exterior.

**Motivo:** la aprobación debe competir con el vencimiento sobre el mismo estado, no depender de una comprobación anterior al retorno del navegador. En el instante exacto del vencimiento la retención ya expiró.

**Alternativa descartada:** actualizar `reserva.estado` desde la ruta o crear otro temporizador; duplicaría las guardas de EST-01 y permitiría divergencias con el temporizador existente del servidor.

### 2. Persistir Pago mediante una migración aditiva

`006_crear_pago.sql` creará la tabla `pago`, derivada de `Pago` y `Reserva 1 – 0..* Pago` del modelo de dominio:

| Columna | Regla y uso |
|---------|-------------|
| `id_pago` | Texto, clave primaria generada por el servidor; no depende de un identificador que envíe el pasajero |
| `id_reserva` | Clave foránea obligatoria a `reserva`, con borrado restringido |
| `monto` | Número mayor que cero; total calculado en el servidor y conservado para ese intento y su eventual devolución |
| `medio_pago` | Nulo mientras no se eligió un medio; al elegir, únicamente `Tarjeta de crédito` o `Tarjeta de débito` |
| `fecha_pago` | Nula hasta la aprobación; fecha/hora de procesamiento de la aprobación por el sistema, también si llega tarde |
| `estado` | `Pendiente`, `Aprobado`, `Rechazado`, `Cancelado` o `Devuelto` |
| `creado_en` | Fecha/hora técnica de inicio del intento, para ordenar el historial |
| `referencia_pasarela` | Referencia técnica única de la sesión simulada, para correlacionar sus mensajes |
| `clave_devolucion` | Texto opcional único, derivado de forma estable como `devolucion:<id_pago>` al solicitar la devolución; permanece igual al repetir mensajes y después de reiniciar |
| `solicitud_devolucion_en` | Fecha/hora de solicitud completa; nula si no se solicitó |
| `devolucion_confirmada_en` | Fecha/hora de confirmación completa; nula hasta entonces |

Agregar índice por reserva y creación, unicidad de referencia de pasarela y de clave de devolución, y un índice parcial para admitir **un solo intento Pendiente por reserva**. La clave de devolución y `solicitud_devolucion_en` deben estar ambas nulas o ambas informadas; Devuelto exige además la confirmación registrada. Reenviar el inicio mientras ese intento siga pendiente reutiliza su sesión; un reintento posterior a rechazo/cancelación crea otro Pago. Esto evita pagos paralelos innecesarios sin impedir los reintentos confirmados.

Las columnas técnicas no agregan entidades de negocio ni un nuevo estado «Devolución pendiente». La aprobación y la devolución quedan correlacionadas en el mismo pago; `integraciones_log` audita los mensajes del simulador, no sustituye el estado persistente.

**Alternativa descartada:** guardar solamente el último resultado en Reserva; perdería la multiplicidad de pagos, el historial y la distinción entre solicitud y devolución confirmada. No hace falta una tabla independiente de devoluciones para una devolución completa por pago.

### 3. Crear un módulo de pagos con adaptador inyectable

Introducir `src/dominio/pago.ts` para tipos, repositorio de Pago y coordinación de inicio/resultado/devolución. Introducir la interfaz `PasarelaPago` y `PasarelaPagoSimulada` en `src/integraciones/pasarela-pago.ts`, siguiendo el patrón de correo. El coordinador usa `ReservaRepositorio`, no duplica su lógica de vencimiento.

Extender las opciones de `crearApp` con inyección opcional de pasarela y mantener `ahora` para dominio y simulador. El adaptador predeterminado será el simulado y usará la misma SQLite. No se agrega ninguna dependencia npm.

Mensajes del adaptador:
- **Iniciar pago:** recibe la referencia del intento, código de reserva y monto calculado; devuelve una sesión/localización local de la pasarela simulada.
- **Resultado de pago:** correlaciona una sesión existente con aprobación, rechazo o cancelación y el medio cuando corresponda. Un retorno de navegador a la consulta no es una aprobación por sí solo.
- **Solicitar devolución completa:** recibe referencia, monto y `clave_devolucion`; registra una única aceptación por esa clave y reutiliza la aceptación persistida si se repite; no implica todavía confirmación.
- **Confirmar devolución completa:** comunica una confirmación separada para una solicitud existente por el mismo monto y la misma clave; una repetición devuelve la confirmación persistida sin otro efecto.

Los mensajes quedarán en `integraciones_log` con `sistema = 'Pasarela de pago'`. No se mezclan con las notificaciones de correo ni contienen números de tarjeta. La pantalla representa la pasarela con elección de medio y de resultado simulado; no solicita datos bancarios reales.

**Alternativa descartada:** integración HTTP real o campo de aprobación en la consulta de reserva. La primera excede el supuesto confirmado; la segunda confunde consultar con ejecutar un resultado externo.

### 4. Separar transacción de resultado y entrega de devolución

Al recibir un resultado, el coordinador ejecuta una transacción inmediata:

1. Adquiere el bloqueo de escritura, captura un único instante y lee de nuevo el Pago por su referencia persistida. Valida la correlación del intento, el monto y el medio cuando corresponda.
2. Si ese resultado ya fue aplicado, devuelve el estado actual sin ejecutar sus efectos otra vez. Una aprobación repetida sobre un pago Devuelto devuelve Devuelto; no lo cambia a Aprobado. Un resultado contradictorio se rechaza sin mutación.
3. Para un intento aún Pendiente, procesa los vencimientos pertinentes y registra el resultado con una actualización condicionada a `WHERE id_pago = ? AND estado = 'Pendiente'`. Solo la operación que obtiene `changes === 1` puede confirmar la reserva o solicitar la devolución por esa aprobación.
4. Si la aprobación llega con todas las retenciones vigentes, aplica `pagoAprobado` de EST-01 dentro de la misma transacción y condicionado al estado pendiente de Reserva. No actualiza `cupos_disponibles`.
5. Si la reserva ya está Vencida, registra la aprobación y solicita una única devolución completa usando `clave_devolucion = 'devolucion:' + id_pago`, sin tocar las asignaciones actuales de sus asientos. La solicitud se registra condicionada a `estado = 'Aprobado' AND solicitud_devolucion_en IS NULL`; solamente `changes === 1` habilita el efecto de solicitud.
6. Persiste los mensajes de simulación y la solicitud en la misma transacción antes de presentar el resultado. Si falla un paso, hace rollback de resultado, transición, asientos, cupos y mensajes de esa operación.

En la implementación local, la solicitud al adaptador y su registro comparten conexión y transacción, sin operaciones de red. La clave estable y el marcador persistido de solicitud identifican la misma devolución en cada repetición; no se genera una clave distinta al reintentar ni se usa una colección en memoria como fuente de verdad. El adaptador devuelve solo la aceptación de solicitud.

La confirmación llega después por una acción distinta del simulador. En otra transacción inmediata, valida la solicitud, su clave y el monto completo y cambia **Aprobado → Devuelto** condicionado a que exista solicitud y aún no haya confirmación. Solo `changes === 1` registra el primer efecto de confirmación; si ya está Devuelto, devuelve el resultado guardado sin otra devolución ni restitución de cupos. No se abre otro intento si la reserva está Pagada o Vencida.

La garantía abarca los efectos persistidos del simulador local, que comparten la transacción SQLite. Una eventual pasarela real deberá aceptar la misma clave idempotente; no se atribuye a una transacción local la capacidad de revertir una operación de red de otro sistema.

**Alternativa descartada:** marcar Devuelto en cuanto se solicita. No permitiría mostrar ni verificar el escenario «Devolución solicitada aún no confirmada».

### 5. Derivar las rutas de los intercambios de DSS-02 y la ficha

| Ruta propuesta | Respuesta y propósito |
|----------------|---------------------|
| `POST /cartelera/:idViaje/reservar` | Mantiene validaciones y correo de HU-02; después de registrar, inicia pago y responde `303` a la sesión simulada en lugar de `201` con `reserva-creada` |
| `POST /reservas/:codigoReserva/pagos` | Inicio o reintento explícito; verifica reserva y retenciones, reutiliza el Pendiente si existe y responde `303` a la sesión; `404` si no existe la reserva y `400` si no admite un nuevo pago |
| `GET /simulacion/pasarela/:idPago` | Muestra la sesión existente, monto, código, medio a elegir y acciones simuladas; `404` si no existe. No crea un intento ni modifica un resultado |
| `POST /simulacion/pasarela/:idPago/resultado` | El adaptador simula el resultado para esa sesión, el coordinador lo procesa y responde `303` a la consulta de reserva; datos de resultado o medio inválidos producen `400` |
| `POST /simulacion/pasarela/:idPago/confirmar-devolucion` | Simula la confirmación externa de una devolución previamente solicitada por el total; responde `303` a la consulta o `400` si no corresponde |
| `GET /reservas/:codigoReserva` | Conserva todos los datos de HU-02 y agrega historial, total, resultado y situación de devolución; ofrece reintentar solo tras rechazo/cancelación con todos los plazos vigentes |

La sesión de un intento **ya existente** puede comunicar su resultado aunque la reserva venciera durante la permanencia en la pasarela; eso es distinto de iniciar un pago nuevo y permite probar la aprobación tardía. El middleware actual puede regularizar primero los vencimientos y el coordinador igualmente debe volver a comprobarlos.

Las redirecciones usan localizaciones construidas por el servidor a partir del adaptador local, no una URL de retorno suministrada por el formulario. Son `303` para evitar reenviar el formulario al recargar. En el entorno de desarrollo continúan usando el origen local de la aplicación; no se añade HTTPS ni una certificación de pasarela real.

Si, entre el registro y el inicio, se alcanza un vencimiento, conservar la reserva creada, aplicar el vencimiento completo y llevar a su consulta con el resultado; no mostrar un formulario de registro como si no se hubiera creado. Las validaciones fallidas **anteriores** al registro siguen siendo las de HU-02, sin reserva parcial.

**Alternativa descartada:** conservar la confirmación `201` y requerir otro clic obligatorio para el primer pago. No cumple la redirección al confirmar aprobada en la ficha.

### 6. Mantener pantallas simples y datos reproducibles

- Crear una plantilla EJS de **Pasarela de pago simulada** con código, asientos, total y elección de crédito/débito; controles explícitos para simular aprobación, rechazo o cancelación.
- Ampliar `reserva-detalle.ejs` con el historial. Usar los textos de la ficha para diferenciar «El pago no fue completado», reserva confirmada, devolución solicitada y monto devuelto.
- Cuando exista una devolución solicitada, presentar una acción claramente identificada de **simulación de confirmación externa**; no es una autorización del pasajero para solicitarla, pues la solicitud ya se ejecutó automáticamente.
- Reutilizar parciales y formatos de moneda/fecha existentes. Los campos de modalidad y lugar de regreso siguen perteneciendo a Reserva.
- Reutilizar V-001 a $15.000 por asiento: dos asientos totalizan $30.000 tanto con ida y vuelta como sin ella. Los pasajeros de ejemplo y los intentos para pruebas se crean con ayudas sobre SQLite aislada. El seed no inserta pagos de prueba en reservas reales ni reinicia reservas existentes.

**Alternativa descartada:** sembrar pagos pendientes con vencimientos fijos en `data/app.db`; pronto quedarían obsoletos y alterarían datos del usuario.

### 7. Verificar escenarios e integración con las historias existentes

Una prueba HTTP identificada por cada uno de los diez escenarios de la ficha en `tests/pagos.test.ts`, parametrizando los medios de pago y los dos resultados no exitosos. Usar reloj controlado para comprobar plazos originales distintos por asiento, aprobación antes y exactamente al vencimiento, y aprobación después de que otro cliente retuvo el asiento liberado.

Agregar pruebas para los siete escenarios adicionales de la especificación: aprobación repetida, fallo con rollback, aprobación que se confirma antes de que el vencimiento obtenga el bloqueo, vencimiento que se confirma antes de la aprobación, aprobación tardía duplicada, confirmación de devolución repetida y aprobación repetida después de Devuelto.

Las pruebas de competencia usarán **dos conexiones a una misma SQLite temporal en disco**, con ejecutores independientes (por ejemplo, trabajadores) y barreras explícitas para controlar quién adquiere primero el bloqueo. Comprobar ambos órdenes, incluida la lectura del reloj tras adquirir el bloqueo, y el resultado desde una conexión nueva: o Pagada con todos sus asientos asignados, o Vencida con una única solicitud de devolución por pago aprobado. No usar dos bases `:memory:` separadas ni asumir que `Promise.all` sobre llamadas síncronas de una sola conexión produce concurrencia real.

Para duplicados, enviar la misma aprobación simultáneamente desde dos conexiones y volver a enviarla después de cerrar y reabrir la base; comprobar una sola confirmación o solicitud usando filas y mensajes persistidos. Repetir la confirmación de devolución y la aprobación sobre Devuelto y verificar que no hay regresión de estado, efectos ni cambios de cupos. Inyectar un fallo después de cambiar Pago o Reserva y antes del commit y comprobar desde otra conexión que no queda ningún cambio parcial; al reintentar, los efectos se registran una sola vez.

Complementar con pruebas de resultados contradictorios y unicidad de intento Pendiente, migración sobre reservas, retenciones e historial existentes y restricciones de clave de devolución. No afirmar que una migración puede recuperar vencimientos que el código anterior ya dejó en NULL.

Actualizar las pruebas HTTP de HU-02 que esperan `201` para comprobar `303`, seguir la sesión y consultar la misma reserva, manteniendo las aserciones de pasajeros, correo, modalidad, cupos y vencimientos. Ejecutar `npm.cmd test` y `npm.cmd run typecheck` al aplicar el cambio. Esta fase de propuesta no ejecuta ni afirma esos resultados.

## Risks / Trade-offs

- **Vencimientos previamente perdidos:** una reserva pendiente antigua podría tener plazos nulos por la implementación observada → conservar esos registros, impedir considerar válida una retención sin plazo e informar que no es posible iniciar su pago; no inventar otros 8 minutos. Su recuperación histórica queda fuera del cambio.
- **Cruce entre vencimiento y aprobación:** una comprobación temprana puede quedar obsoleta → reloj obtenido después del bloqueo, transacción inmediata en ambas rutas, actualizaciones condicionadas y efectos solo cuando `changes === 1`.
- **Mensajes repetidos o regreso a una pantalla antigua:** podrían duplicar una solicitud o alterar asientos reasignados → correlación por intento, clave de devolución estable y única, marcadores persistidos, estados terminales sin reprocesamiento y liberación restringida a `id_reserva_vigente`.
- **Contención de escritura:** otra conexión puede mantener el bloqueo → configurar un tiempo de espera acotado; si se agota, devolver un error recuperable y permitir repetir la operación usando la misma referencia. No ejecutar efectos fuera de transacción ni devolver éxito sin commit.
- **Cambio de contrato HTTP:** las pruebas y cualquier consumidor que esperen `201` deberán adaptarse → cambio señalado en la propuesta y regresión de HU-02 preservando su resultado de negocio.
- **Simulación local:** no demuestra conectividad, TLS ni procesamiento financiero real → documentar de forma visible la pasarela simulada y mantener el adaptador intercambiable.
- **Documentos aún desalineados:** el BPMN y EST-02 publicados omiten reglas aprobadas → citar la ficha como resolución aceptada, mantener la trazabilidad en las especificaciones y no editar los documentos sin solicitud.

## Migration Plan

1. Al implementar, agregar `006_crear_pago.sql` sin modificar las migraciones aplicadas. El mecanismo existente la ejecuta en transacción al arrancar, tanto en base nueva como en una existente.
2. Verificar que códigos, detalles, pasajeros, asignaciones, cupos y plazos conocidos se mantienen; la tabla Pago empieza vacía y no se inventan cobros para reservas Pagadas antiguas.
3. Desplegar el módulo, adaptador, rutas y vistas junto con la corrección de preservación de vencimientos. Validar el recorrido con una reserva nueva, un rechazo/reintento y una aprobación tardía con devolución separada.
4. Para revertir, volver al código anterior dejando la tabla aditiva y sus datos. No borrar `pago`, mensajes ni archivos `005`, ni reconstruir la base de uso. Si hay fallos al crear la tabla, la transacción del migrador revierte la migración completa.
