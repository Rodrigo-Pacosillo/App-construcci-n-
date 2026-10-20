# Especificación funcional y técnica del panel de administración — Contr-art

> Documento de referencia para un agente CLI que implemente el panel administrativo.
> **Objetivo:** adaptar la aplicación existente a los flujos descritos aquí, sin rehacer el proyecto ni cambiar reglas de negocio por cuenta propia.
> **Estado:** especificación acordada para los cuatro paneles principales. Antes de tocar código, inspeccionar el estado real del repositorio y elaborar un plan breve.

---

## 0. Instrucciones obligatorias para el agente CLI

1. **Lee primero** `DATABASE.md`, `FLUJO DE PERSONAS.md`, `prisma/schema.prisma`, `README.md`, `package.json` y el código actual de los cuatro paneles. Este documento es la especificación funcional para administración; el esquema Prisma es la referencia estructural de la base de datos.
2. No asumas que `AGENTS.md` ni los documentos de `docs/` describen la lógica aprobada si contradicen este archivo o `FLUJO DE PERSONAS.md`. Identifica las contradicciones y sigue la especificación actual.
3. **No borres ni reemplaces la base de datos, tablas, datos reales, migraciones o contenido existente.** No ejecutes `prisma db push`, migraciones destructivas, `seed` ni scripts que limpien datos sin autorización expresa.
4. Antes de editar, presenta un plan breve con los archivos que cambiarás, el comportamiento que corregirás y los posibles cambios de esquema. Implementa en pasos pequeños.
5. Reutiliza la arquitectura, componentes, estilos, autenticación, validaciones y server actions existentes cuando sea razonable. No crees un segundo sistema paralelo.
6. No muestres identificadores internos (`id`, `clienteId`, `cotizacionId`, etc.) en tablas, tarjetas, encabezados ni fichas de detalle. Los identificadores se pueden usar internamente para relaciones, URLs y acciones.
7. No inventes estados, campos o reglas de negocio que no figuran aquí. Si encuentras un requisito que no puede resolverse con el esquema actual, informa por qué y propone el cambio mínimo antes de aplicarlo.
8. Mantén la aplicación en español, con textos claros y consistentes, formularios accesibles, estados de carga, mensajes de error/éxito y confirmaciones para acciones delicadas.
9. No declares una tarea terminada solo porque compile. Prueba los flujos y relaciones importantes, ejecuta los scripts de validación disponibles y reporta qué se verificó y qué quedó pendiente.
10. Este documento **no autoriza a modificar automáticamente** la base de datos de producción ni a ejecutar operaciones destructivas.

## 1. Objetivo y alcance

El panel administrativo debe organizar el trabajo diario en **cuatro paneles principales**:

1. **Cotizaciones**
2. **Contratos**
3. **Usuarios**
4. **Obras**

Debe mantener una interfaz administrativa moderna, clara y coherente con la interfaz actual: navegación lateral (sidebar) y área principal de trabajo, jerarquía visual limpia, tablas/listas legibles, filtros útiles y fichas de detalle. El dashboard puede seguir siendo un resumen sencillo.

No debe existir un panel principal separado llamado **Clientes**. La tabla `clientes` sí se conserva y es central para vincular personas con cotizaciones, contratos, proyectos y obras. La eliminación de un menú no implica eliminar la tabla ni los registros.

Otros módulos existentes (proyectos, servicios, testimonios, FAQ, certificaciones, empleados, materiales, herramientas, pagos, etc.) no se deben borrar. Si todavía no están integrados en la navegación principal, su entrada debe explicar claramente para qué sirven o indicar que son un módulo secundario/en preparación; nunca debe aparecer un mensaje genérico como «panel no habilitado» sin explicación.

## 2. Modelo mental: distinguir cuatro conceptos

No mezclar estos estados:

- **Estado de cotización:** resultado del contacto y de la decisión comercial.
- **Estado de cuenta:** si un usuario puede iniciar sesión (`Usuario.activo`).
- **Contrato:** registro formal del acuerdo, con monto y documentos opcionales.
- **Estado de obra:** situación de ejecución (`EstadoObra`).

Un cliente puede tener varias cotizaciones a lo largo del tiempo, más de un contrato, varias obras y una sola cuenta de usuario asociada al registro de cliente. Que una obra termine no implica desactivar la cuenta.

## 3. Relaciones de datos que deben respetarse

Según el esquema Prisma actual:

- `Cliente` se relaciona con varias `Cotizacion`, varios `Contrato`, varias `ObraActiva` y, opcionalmente, un `Usuario`.
- `Usuario.clienteId` es opcional y único: como máximo una cuenta asociada a un registro de cliente, y un cliente puede no tener cuenta todavía.
- `Cotizacion.clienteId` es obligatorio.
- `Contrato.clienteId` es obligatorio; `Contrato.cotizacionId` es opcional. Por eso se permiten contratos creados excepcionalmente sin cotización previa.
- `Contrato.cotizacionId` **no es único** en el esquema actual. El backend debe impedir que se cree más de un contrato para una misma cotización, salvo que el propietario del sistema apruebe explícitamente otra regla. No basta con ocultar el botón en el frontend.
- `ObraActiva.clienteId` es obligatorio; `ObraActiva.contratoId` es opcional.
- `HitosObra.obraId` es obligatorio. `HitosObra.visibleCliente` controla la publicación al portal del cliente.
- No duplicar `Cliente` ni `Usuario` por recorrer varias pantallas del flujo. Reutilizar los registros existentes.

Si se detectan diferencias entre este resumen y el esquema presente en el repositorio, confirmar el estado real antes de editar.

---

## 4. Navegación y diseño compartido

### 4.1 Navegación principal

Mostrar como opciones principales:

- Cotizaciones
- Contratos
- Usuarios
- Obras

El dashboard/resumen puede seguir como página de inicio, pero no sustituye a los cuatro paneles.

### 4.2 Comportamiento común de listas

Las cuatro listas deben tener, cuando corresponda:

- Título y breve descripción.
- Búsqueda que funcione realmente.
- Filtros relevantes al módulo.
- Estados visuales claros, sin depender únicamente del color.
- Acción principal visible y acciones secundarias por registro.
- Estado vacío útil (explica qué aparecerá o cómo iniciar).
- Indicadores de carga y mensajes de error.
- Diseño adaptable a móvil y escritorio.
- Ningún ID/código técnico visible.
- Formato coherente de fechas, importes y teléfonos.

La búsqueda debe consultar datos pertinentes del servidor o filtrar el conjunto completo disponible, no solo las filas de la página visible. Si hay paginación, mantener búsqueda y filtros al cambiar de página.

### 4.3 Navegación contextual

Desde un registro relacionado se debe poder ir a los demás sin volver a buscar desde cero. Ejemplos:

- Cotización → contrato relacionado o creación de contrato.
- Contrato → cliente, cotización de origen y obras asociadas.
- Usuario → ficha completa del cliente y sus obras.
- Obra → ficha del cliente y contrato relacionado.
- “Ver obras” desde Usuario → abrir el panel Obras filtrado por ese cliente.

Al volver desde un formulario, preservar en lo posible el contexto (filtro/búsqueda) para evitar repetir trabajo.

---

## 5. Panel Cotizaciones

### 5.1 Objetivo

Gestionar las solicitudes que llegan desde el formulario público y hacer seguimiento mínimo del resultado comercial. La negociación real se realiza fuera del sistema, normalmente por WhatsApp. **No se necesitan estados intermedios de visita técnica o presupuesto.**

### 5.2 Agrupación visual acordada

Organizar las cotizaciones en tres grupos, pestañas o filtros principales:

1. **Por revisar:** solicitudes nuevas que aún no se han marcado como contactadas.
2. **Pendientes:** el administrador confirmó que realizó el contacto; la decisión todavía no se registra.
3. **Finalizadas:** separar claramente:
   - **Contratadas**
   - **No concretadas**

Se puede implementar como pestañas con contadores o filtros equivalentes, siempre que las cuatro categorías se entiendan fácilmente. Los contadores deben derivarse de datos reales.

### 5.3 Estados persistidos

El esquema tiene `Cotizacion.estado` como `String`, actualmente con default `"nuevo"`. Usar un conjunto pequeño y estable de valores internos:

- `nuevo`
- `contactado`
- `contratado`
- `no_concretado`

Las etiquetas de UI serán: “Por revisar”, “Pendiente”/“Contactada”, “Contratada” y “No concretada”. No guardar `visita_tecnica` ni `presupuestado`. No depender de valores antiguos `ganado`/`perdido` sin hacer una migración lógica compatible: inspeccionar los datos actuales y crear un mapeo seguro de estados antiguos a los nuevos. No cambiar masivamente datos sin confirmar si existen datos reales.

### 5.4 Tabla/lista de cotizaciones

Mostrar información útil para decidir a quién contactar, por ejemplo:

- Nombre completo del cliente.
- Teléfono.
- Tipo de obra.
- Tipo de construcción.
- Rango de metros cuadrados.
- Ubicación de la obra, si existe.
- Plazo de inicio.
- Fecha de solicitud.
- Estado visible.
- Acciones.

No mostrar el ID de cotización ni el ID del cliente.

Permitir buscar por nombre y teléfono y filtrar por grupo/estado y, si ya hay un origen útil en el producto, por origen. No inventar filtros que compliquen la operación.

### 5.5 Detalle de cotización

Mostrar:

- Datos de contacto de `Cliente`.
- Todos los campos enviados en la solicitud (`tipoObra`, `tipoConstruccion`, `rangoM2`, `ubicacionObra`, `plazoInicio`, `origen`, `requerimiento`).
- Fecha de creación y actualización.
- Notas internas editables, visibles solo para administración.
- Monto estimado/cerrado si se usan en el sistema.
- Contrato asociado, si existe.
- Historial de otras cotizaciones del mismo cliente, si puede añadirse sin duplicar complejidad.

Nunca enviar `notasInternas` al portal público o cliente.

### 5.6 Contacto por WhatsApp

- El botón debe abrir WhatsApp usando el teléfono del cliente asociado a **esa cotización** (no un número genérico).
- Construir un enlace válido con número normalizado para WhatsApp y un mensaje inicial prellenado, editable por el administrador antes de enviarlo si la interfaz lo permite.
- El mensaje puede saludar por nombre y hacer referencia al tipo de solicitud, sin incluir datos sensibles innecesarios.
- Abrir WhatsApp **no prueba que el mensaje se haya enviado**. No cambiar el estado automáticamente al hacer clic.
- Al volver, el administrador usa una acción explícita, por ejemplo “Confirmar contacto”. Solo esa acción cambia `estado` a `contactado`.
- Si el contacto no se realizó, el administrador puede dejar la cotización en “Por revisar”.
- Si ya está contratada o no concretada, no mostrar acciones que la devuelvan accidentalmente al flujo inicial.

### 5.7 Resultado comercial

Desde una cotización contactada:

- Acción principal: **Hacer contrato** / **Ir al contrato**.
- Acción alternativa: **Marcar como no concretada**, con confirmación si la acción pudiera ejecutarse por error.
- No exigir que el administrador rellene estados de visita técnica, presupuesto u otras fases.
- Una cotización no concretada se conserva. No se borra. El mismo cliente puede enviar futuras cotizaciones; cada solicitud nueva debe crear un nuevo registro y quedar relacionada con el mismo `Cliente` cuando se pueda identificar de forma fiable.

Al marcar como no concretada, establecer `estado = "no_concretado"`. Si ya existe un contrato asociado, no permitir cambiarla a no concretada sin una decisión explícita de negocio; en la UI normal, una cotización contratada no se puede marcar como perdida.

### 5.8 Crear contrato desde cotización

- Si no existe contrato para la cotización, abrir el formulario de creación con la cotización y el cliente ya vinculados.
- Si ya existe un contrato, la acción debe llamarse **Ir al contrato** y abrir el contrato existente.
- Tras crear con éxito el contrato, marcar la cotización como `contratado` en la misma operación lógica/transaction del servidor.
- No marcarla como contratada si falla el guardado del contrato.
- Evitar duplicados en el backend mediante una comprobación de la relación `cotizacionId`; manejar también dos intentos concurrentes lo mejor posible sin asumir que la validación del cliente es suficiente.
- Si hay varios contratos antiguos asociados a una misma cotización, no elegir uno al azar: reportar el conflicto y dejar que el administrador resuelva.

---

## 6. Panel Contratos

### 6.1 Objetivo

Consultar contratos y registrar un nuevo acuerdo formal. La ruta normal es desde una cotización, pero el panel también permite iniciar la creación de un contrato independientemente.

### 6.2 Lista

Mostrar, como mínimo:

- Nombre completo del cliente.
- Fecha de firma, si existe.
- Monto total.
- Estado de existencia del PDF/documento (sin inventar un estado legal que no esté en el esquema).
- Cotización de origen si existe.
- Cantidad o acceso a obras relacionadas.
- Fecha de registro.
- Acciones “Ver contrato” y “Ver cliente” o equivalentes.

No mostrar IDs.

Búsqueda por nombre/teléfono y filtros sencillos que tengan sentido con los campos disponibles. No inferir que `creadoEn` equivale a fecha de firma: son conceptos distintos.

### 6.3 Formulario de contrato

Campos a capturar según el esquema actual:

- Cliente (obligatorio).
- Cotización de origen (opcional si se crea desde el panel).
- Monto total (obligatorio, decimal válido y mayor que cero, salvo que una regla actual aprobada diga otra cosa).
- Fecha de firma (opcional).
- URL o referencia del PDF firmado (opcional; validar formato si se espera URL).
- Observaciones (opcional).

Si se inicia desde una cotización, precargar el cliente, la cotización y la información de contacto existente. Evitar que se vincule por accidente la cotización de un cliente a otro. Si se crea independientemente, permitir elegir una cotización elegible y mantener la posibilidad de contrato sin cotización.

### 6.4 Después de guardar

Después de crear un contrato correctamente:

1. Si el cliente ya tiene un `Usuario` asociado, no crear otra cuenta. Llevar al administrador a la ficha de ese usuario o mostrar la acción **Ver usuario**.
2. Si el cliente no tiene cuenta, llevar a la pantalla de creación de usuario con nombre, apellidos, email y cliente preseleccionados.
3. No crear automáticamente una contraseña pública ni permitir auto-registro del cliente.
4. No se debe crear una obra automáticamente, salvo que el flujo actual tenga esa acción expresamente aprobada. La obra se administra desde el panel Obras.
5. Si la creación del contrato vino de una cotización, actualizar la cotización a `contratado` solo tras guardar exitosamente.

### 6.5 Consistencia

- Validar en servidor que el cliente existe.
- Si hay cotización, validar que corresponde al mismo cliente.
- Impedir contrato duplicado para una cotización.
- Manejar errores sin perder el formulario ni duplicar registros.
- Evitar crear de nuevo el mismo `Cliente` por haber entrado desde una cotización.

---

## 7. Panel Usuarios

### 7.1 Qué representa

Este panel lista **solo las cuentas de `usuarios`**, no todos los registros de `clientes` ni todos los prospectos. Un prospecto sin cuenta no debe aparecer como usuario.

El alta de cuentas es controlada por el administrador. No habilitar auto-registro público.

### 7.2 Orden y búsqueda

- Orden principal: cuentas asociadas a clientes que tienen obras en curso/activas primero.
- Después, el resto de usuarios por actividad reciente disponible (si no existe una marca de actividad real, usar un criterio transparente como fecha de creación y no inventar “última actividad”).
- Búsqueda por nombre/apellidos y teléfono del cliente relacionado.
- No hacer del estado activo/suspendido el filtro más prominente; la mayoría de las cuentas estarán activas.
- No mostrar IDs.

Cada fila debe tener dos acciones claras:

1. **Ver información**
2. **Ver obras**

### 7.3 “Ver información”

Abrir una ficha de la cuenta y su cliente asociado. Mostrar, según disponibilidad:

- Nombre, apellidos, teléfono, email y ciudad.
- Estado de la cuenta (activa/suspendida).
- Fecha de creación de la cuenta.
- Historial completo de cotizaciones.
- Contratos relacionados.
- Obras relacionadas y su estado/progreso.
- Enlaces para navegar a cada registro relacionado.

No exponer hashes de contraseñas, secretos de autenticación ni información interna que no sea útil para administración.

Si un `Usuario` no tiene `clienteId`, mostrar la situación de forma clara y permitir resolverla desde la administración sin asociar un cliente incorrecto. La relación es opcional en el esquema, por lo que no asumir que siempre existe.

### 7.4 “Ver obras”

- Navegar al panel Obras con un filtro de cliente aplicado.
- Si tiene varias obras, mostrar la lista filtrada para que el administrador elija.
- Si tiene exactamente una obra y el comportamiento es coherente con la navegación actual, se puede abrir directamente su detalle.
- El filtro debe seguir visible y poder quitarse para volver a todas las obras.

### 7.5 Suspender/reactivar una cuenta

La suspensión no debe ser una acción fácil de pulsar por accidente:

- Ubicarla dentro de “Ver información”, no como acción primaria en la tabla.
- Requerir diálogo de confirmación con texto explícito: suspender impide iniciar sesión, pero **no elimina** el historial, contratos, cotizaciones ni obras.
- Mostrar el estado actual y cambiar el texto del botón según corresponda (“Suspender cuenta” / “Reactivar cuenta”).
- Validar autorización y cambio en el servidor.
- No desactivar automáticamente una cuenta al finalizar/entregar una obra.
- No borrar cuentas de clientes históricos.

### 7.6 Crear cuenta después del contrato

Formulario para crear `Usuario` con rol cliente, usando el `Cliente` existente. Precargar nombre, apellidos y email. Solicitar los datos de acceso que realmente use el sistema actual (por ejemplo, una contraseña inicial segura o un flujo de establecimiento de contraseña que ya exista). Nunca mostrar ni guardar contraseñas en texto plano.

Antes de crear:

- Verificar si ya hay usuario vinculado por `clienteId`.
- Verificar email único.
- Si ya existe cuenta para el cliente, abrir esa cuenta en lugar de crear otra.
- No asociar la cuenta a otro cliente solo porque coincide un nombre. Usar el cliente seleccionado/relación explícita y validar duplicados de email.
- No crear un segundo `Cliente`.

---

## 8. Panel Obras

### 8.1 Lista principal

Mostrar todas las obras registradas, independientemente de si están en curso o terminadas. No limitar el listado solo a obras activas.

Campos útiles:

- Nombre del cliente.
- Dirección de la obra.
- Estado de la obra.
- Progreso (%).
- Fecha de inicio.
- Fecha fin estimada si existe.
- Contrato relacionado si existe.
- Acción para abrir detalle.

No mostrar IDs. El estado debe ser distinguible visualmente antes de entrar en el detalle, con texto y estilo accesible.

Valores de `EstadoObra` existentes:

- `en_curso` → etiqueta UI “En ejecución” (o una etiqueta equivalente coherente en toda la aplicación).
- `pausada` → “Pausada”.
- `finalizada` → “Finalizada”.
- `entregada` → “Entregada”.

No confundir “Finalizada” con “Entregada”. No añadir estados de obra nuevos sin autorización.

### 8.2 Búsqueda y filtros

- Buscar por cliente y dirección.
- Filtrar por estado.
- Admitir filtro por cliente mediante query param o mecanismo equivalente para que “Ver obras” desde Usuario funcione.
- El filtro de cliente debe ser removible y el usuario debe entender por qué ve una lista reducida.
- Ordenar de forma útil (por ejemplo, obras en curso primero y después las restantes) sin esconder obras finalizadas.

### 8.3 Detalle/edición de obra

El administrador debe poder ver y mantener los datos que consume el portal del cliente, no solo inspeccionarlos.

Permitir consultar y editar, según campos existentes:

- Cliente asociado.
- Contrato asociado, si existe.
- Dirección.
- Fecha de inicio.
- Fecha estimada de finalización.
- Estado.
- Progreso entre 0 y 100.
- Hitos de la obra.
- Pagos, si ya existe una interfaz implementada para ello.

Validar en servidor que el progreso sea entero entre 0 y 100. Validar fechas y relaciones. No permitir que un cambio de estado o progreso desasocie el cliente o contrato.

### 8.4 Hitos de obra: mantener el modelo actual

**No añadir un campo de estado a los hitos.** El esquema actual es suficiente para el comportamiento solicitado:

- `titulo`
- `descripcion`
- `fecha`
- `fotoUrl` (opcional)
- `visibleCliente` (booleano)

El administrador puede crear un hito, editarlo después y preparar contenido para más tarde. Puede guardarlo como no visible y hacerlo visible cuando esté listo.

Comportamiento esperado:

1. Crear/editar hito con los campos existentes.
2. Si `visibleCliente = false`, el hito queda guardado en administración pero no aparece en el portal.
3. Si el administrador decide publicarlo, cambiar `visibleCliente = true`; debe aparecer al cliente correspondiente.
4. Poder volver a ocultarlo si se publicó por error o necesita corrección.
5. No borrar un hito solo para ocultarlo.
6. Validar que el hito pertenece a la obra que se está editando.
7. El portal solo puede consultar hitos de las obras del usuario autenticado y solo aquellos con `visibleCliente = true`.

**Corrección semántica importante:** la visibilidad no significa que un hito esté completado. Revisar `src/app/cliente/avance/page.tsx` y componentes relacionados: si la UI llama “cumplido” a todo hito cuya fecha ya pasó y está visible, no afirmar que el trabajo está completado por esa condición. Mantener el modelo de hitos como actual, pero presentar los hitos como actualizaciones publicadas con fecha, descripción y foto, sin inferir un estado de finalización que la base de datos no guarda. No añadir estados de hitos sin una nueva decisión explícita.

### 8.5 Seguridad del portal de cliente

El backend debe comprobar siempre la identidad del usuario y su relación con el cliente antes de devolver datos. No confiar en un `clienteId` o `obraId` enviado por el navegador sin verificar propiedad.

- Un cliente solo puede leer sus propias obras.
- Solo puede leer hitos visibles de esas obras.
- No puede leer notas internas, cotizaciones internas, registros de otros clientes, empleados, materiales ni herramientas.
- El portal es de solo lectura.
- La finalización de una obra no desactiva la cuenta.

---

## 9. Datos iniciales: qué se captura y qué se conserva

### 9.1 Datos que llegan del formulario público de cotización

Cuando una persona envía una solicitud:

- Crear o reutilizar un registro de `Cliente` solo si la identificación es razonablemente segura.
- Guardar nombre, apellidos, teléfono y email/ciudad cuando se proporcionen.
- Crear siempre una **nueva Cotizacion** por cada solicitud nueva; no sobrescribir la anterior.
- Guardar los campos de la solicitud: tipo de obra, tipo de construcción, rango m², ubicación de obra, plazo de inicio, origen y requerimiento.
- Inicializar estado como `nuevo`.
- No crear `Usuario` en esta etapa.
- No crear contrato ni obra en esta etapa.

No fusionar personas solo porque comparten un nombre. Si el email único entra en conflicto o hay dudas sobre la identidad, manejar el caso con un error comprensible o una resolución administrativa; no reasignar datos automáticamente.

### 9.2 Datos que el administrador captura al formalizar el acuerdo

Al crear un contrato:

- Reutilizar el `Cliente` de la cotización si el flujo viene de una cotización.
- Capturar monto total.
- Opcionalmente fecha de firma, URL del PDF y observaciones.
- Asociar la cotización correcta si existe.
- No duplicar contrato para la misma cotización.

Luego crear o abrir la cuenta de usuario existente. La creación de cuenta no debe inventar datos de contacto que el cliente no proporcionó.

### 9.3 Datos iniciales de usuario

- Nombre y apellidos (prellenados desde `Cliente`).
- Email válido y único (prellenado si existe).
- Cliente relacionado.
- Rol `cliente`.
- Estado activo por defecto.
- Credenciales iniciales según el mecanismo de autenticación actual, con hash seguro.

El administrador es quien crea la cuenta. No generar un admin desde un formulario público ni usar `Rol.admin` como valor por defecto.

### 9.4 Datos iniciales de obra

Una obra se crea desde el panel Obras cuando corresponda, sin crearla implícitamente por cada contrato:

- Cliente.
- Contrato relacionado opcional.
- Dirección de obra.
- Fecha de inicio.
- Fecha fin estimada opcional.
- Estado inicial según el esquema (`en_curso` por defecto), salvo que el administrador elija otro estado válido.
- Progreso inicial dentro de 0–100.
- Hitos y publicaciones según se vayan preparando.

No asumir que cada contrato requiere automáticamente una obra; el administrador puede registrar el inicio real de la obra cuando corresponda.

### 9.5 Contenido del sitio y datos de demostración

Conservar el contenido existente del sitio público (servicios, proyectos, fotos, testimonios, FAQ y certificaciones) salvo que una tarea concreta autorice cambios. Distinguir datos demo de datos reales. No ejecutar el `prisma/seed.ts` actual en un entorno con datos reales sin autorización: el script contiene operaciones `deleteMany()` que eliminan registros antes de sembrar datos de demostración.

---

## 10. Backend, validación y seguridad

### 10.1 Principio general

Toda regla de negocio crítica debe validarse en servidor, aunque la UI oculte botones o deshabilite campos. Reutilizar Server Actions o el mecanismo actual de Next.js del proyecto, respetando autenticación y autorización.

### 10.2 Validaciones mínimas

- Confirmar sesión y rol `admin` en toda mutación administrativa.
- Validar IDs de relaciones en servidor.
- Validar campos obligatorios, longitudes, fechas, importes y rangos.
- Validar email y unicidad.
- Evitar crear dos usuarios para el mismo `clienteId`.
- Evitar contratos duplicados para una misma cotización.
- Asegurar que una cotización y un contrato referencien al mismo cliente.
- Asegurar que hitos y pagos pertenezcan a la obra correspondiente.
- Restringir datos del portal al cliente autenticado.
- No devolver hashes, notas internas ni datos administrativos al cliente.
- Manejar fallos de forma segura y mostrar mensajes claros sin filtrar stack traces ni secretos.

### 10.3 Transacciones

Usar transacciones Prisma para operaciones que deban quedar consistentes, especialmente:

- Crear contrato desde cotización + marcar cotización como contratada.
- Crear o vincular registros relacionados cuando una operación incluye varias escrituras.

Si el paso posterior a crear contrato (por ejemplo, abrir formulario de usuario) falla, el contrato ya guardado debe permanecer; no borrar el contrato automáticamente. Mostrar un enlace para continuar.

### 10.4 Revalidación y navegación

Tras mutaciones correctas, refrescar/revalidar rutas y datos relevantes con el patrón del proyecto. Evitar que la UI muestre estados antiguos tras guardar. Al mostrar error, conservar datos del formulario siempre que sea posible.

### 10.5 Cambios de esquema

Preferir resolver el alcance con el esquema actual. No añadir campos de estado de hito. `Cotizacion.estado` es texto, así que se puede usar el conjunto reducido definido arriba, pero hay que considerar los registros con valores anteriores.

Si se concluye que hace falta una migración:

1. Explicar la necesidad y el impacto.
2. Proponer una migración compatible con datos existentes.
3. No ejecutarla en producción ni hacer cambios destructivos sin autorización.
4. Actualizar `DATABASE.md` si se aprueba un cambio estructural.
5. Añadir/actualizar pruebas para la nueva regla.

---

## 11. Paneles secundarios

No son parte de los cuatro paneles principales, pero el sistema puede conservar las interfaces de:

- Proyectos / fotos de proyecto.
- Servicios.
- Testimonios.
- FAQ.
- Certificaciones.
- Pagos.
- Empleados.
- Materiales.
- Herramientas.

No eliminarlos. Mantener sus permisos y reglas de publicación. Empleados, materiales y herramientas son datos internos de administración y nunca deben exponerse al portal del cliente. Si no se van a rediseñar en esta tarea, dejarlos funcionando como están y no ampliar su alcance sin necesidad.

---

## 12. Criterios de aceptación

La implementación no se considera terminada hasta verificar los siguientes escenarios.

### Cotizaciones
- [ ] Una nueva solicitud aparece en “Por revisar”.
- [ ] La búsqueda encuentra por nombre y teléfono.
- [ ] WhatsApp usa el teléfono del cliente correcto y un mensaje prellenado.
- [ ] Abrir WhatsApp no cambia el estado automáticamente.
- [ ] “Confirmar contacto” cambia la cotización a contactada/pendiente.
- [ ] No hay estados `visita_tecnica` ni `presupuestado` en el flujo nuevo.
- [ ] Se puede marcar una cotización como no concretada y permanece guardada.
- [ ] “Hacer contrato” crea un contrato con el cliente/cotización correctos.
- [ ] Tras el guardado, la cotización queda contratada.
- [ ] No se pueden crear dos contratos para la misma cotización desde UI ni backend.
- [ ] Una cotización contratada abre el contrato existente.

### Contratos
- [ ] Se puede crear contrato desde cotización y desde el panel.
- [ ] El cliente y cotización se precargan correctamente al venir desde cotización.
- [ ] El servidor rechaza cotización perteneciente a otro cliente.
- [ ] Se puede crear un contrato excepcional sin cotización.
- [ ] Tras guardar, se abre la cuenta existente o el formulario de creación de usuario.
- [ ] Los importes y fechas se validan.

### Usuarios
- [ ] La lista contiene únicamente registros de `usuarios`.
- [ ] Los clientes con obras en curso aparecen primero.
- [ ] La búsqueda contempla nombre/apellidos y teléfono relacionado.
- [ ] “Ver información” muestra cotizaciones, contratos y obras del cliente.
- [ ] “Ver obras” filtra correctamente el panel Obras.
- [ ] Suspender requiere confirmación y no borra datos.
- [ ] Terminar una obra no desactiva la cuenta.
- [ ] No se crean usuarios duplicados para el mismo cliente.

### Obras e hitos
- [ ] El panel lista obras activas y terminadas.
- [ ] Se puede buscar por cliente/dirección y filtrar por estado.
- [ ] “Ver obras” desde un usuario mantiene el filtro.
- [ ] El progreso solo acepta valores de 0 a 100.
- [ ] Se puede crear/editar un hito y guardarlo no visible.
- [ ] Un hito no visible no aparece en el portal del cliente.
- [ ] Al hacerlo visible, aparece únicamente al cliente propietario de la obra.
- [ ] Visibilidad y fecha no se interpretan como un estado de completado.
- [ ] El cliente no puede acceder a obras/hitos de otra persona.

### Calidad general
- [ ] No aparecen IDs internos en tablas ni detalles.
- [ ] No se han borrado tablas ni contenido público existente.
- [ ] Las acciones administrativas verifican rol en servidor.
- [ ] Se ejecutan los scripts disponibles de lint/build/pruebas, documentando cualquier fallo preexistente.
- [ ] Se prueba al menos un flujo completo: cotización → contacto confirmado → contrato → creación/consulta de usuario → obra.
- [ ] No se ejecutó seed destructivo ni se alteró una base real sin autorización.

---

## 13. Forma de trabajo recomendada para el agente

1. **Auditoría sin editar:** revisar componentes, rutas, acciones, autenticación, esquema, pruebas y diferencias frente a esta especificación.
2. **Informe corto:** listar lo que ya cumple, lo que falta y riesgos de datos existentes.
3. **Plan por fases:** empezar por cotizaciones y contratos; continuar con usuarios; después obras e hitos; finalmente navegación, pruebas y limpieza de entradas de menú.
4. **Implementación incremental:** hacer cambios pequeños, validar tras cada fase y no reformatear/reconstruir archivos no relacionados.
5. **Pruebas y reporte final:** enumerar archivos modificados, comportamientos verificados, comandos ejecutados, resultados y tareas pendientes.

Si una decisión no está definida aquí o hay contradicción real entre el repositorio y el documento, no inventar una solución silenciosa: documentar la duda y pedir confirmación antes de hacer un cambio irreversible.
