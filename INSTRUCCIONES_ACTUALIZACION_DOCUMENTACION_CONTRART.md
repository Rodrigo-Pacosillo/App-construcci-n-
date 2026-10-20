# Instrucciones para reconciliar y actualizar la documentación de Contr-art

> **Objetivo para el agente CLI:** revisar y corregir la documentación antigua del repositorio para que no contradiga el flujo aprobado de personas, la base de datos real ni la nueva especificación del panel de administración. El resultado debe ser un conjunto pequeño, coherente y fácil de consultar, sin duplicaciones ni instrucciones incompatibles.

## 1. Antes de editar: identifica las fuentes de verdad

Lee estos archivos completos antes de cambiar cualquier documento:

1. `ESPECIFICACION_PANEL_ADMIN_CONTRART.md` — especificación aprobada del panel administrativo y sus reglas de UI/backend.
2. `FLUJO DE PERSONAS.md` — flujo aprobado de visitantes, clientes/prospectos, cotizaciones, contratos y cuentas.
3. `DATABASE.md` — descripción aprobada/documentada del modelo de datos.
4. `prisma/schema.prisma` — estructura real del esquema Prisma.
5. `AGENTS.md` y todos los documentos Markdown dentro de `docs/` — documentos que se deben auditar por antigüedad, contradicciones y duplicación.

Si alguno de los tres documentos aprobados contradice el esquema real o entre sí, **no elijas una versión en silencio**. Documenta la incoherencia, determina si es un error descriptivo o una decisión de negocio pendiente y pide confirmación cuando no se pueda resolver con seguridad.

### Jerarquía para resolver contradicciones

- **Reglas funcionales del panel admin:** `ESPECIFICACION_PANEL_ADMIN_CONTRART.md`.
- **Flujo de personas y etapas del negocio:** `FLUJO DE PERSONAS.md`.
- **Campos y relaciones que realmente existen:** `prisma/schema.prisma`; `DATABASE.md` debe reflejarlo con precisión.
- **Documentación general antigua:** `AGENTS.md` y `docs/*` se actualizan para que concuerden con los archivos anteriores; no deben inventar ni imponer reglas que los contradigan.

Esta jerarquía no autoriza a cambiar automáticamente la base de datos. Si el esquema necesita una modificación para cumplir una regla aprobada, describe el cambio propuesto y espera autorización cuando tenga impacto estructural o sobre datos existentes.

## 2. Qué se debe corregir

### 2.1 `AGENTS.md`: convertirlo en una guía breve y fiable para agentes

Revisa cada instrucción existente. Elimina o reescribe las que estén obsoletas, sean contradictorias, repitan reglas de otros documentos o describan como terminadas funciones que no lo están.

`AGENTS.md` debe decir claramente al agente que:

- Lea primero la especificación de administración, `FLUJO DE PERSONAS.md`, `DATABASE.md` y `prisma/schema.prisma`.
- Trate las instrucciones funcionales antiguas de `docs/` como referencias que deben verificarse, no como autoridad si contradicen las fuentes aprobadas.
- No haga cambios destructivos ni ejecute seeds que borren datos sin autorización.
- Respete autenticación, permisos, relaciones, validación de servidor y convenciones del proyecto.
- Inspeccione la implementación antes de editar, presente un plan cuando el cambio sea amplio y pruebe el resultado.
- No cambie silenciosamente las reglas del negocio ni cree campos/estados nuevos por iniciativa propia.
- Mantenga consistencia entre frontend, backend, esquema y documentación.

Evita convertir `AGENTS.md` en una copia extensa de todos los documentos. Debe funcionar como **índice de autoridad y reglas de trabajo**, enlazando a la documentación especializada.

### 2.2 `docs/`: auditar cada archivo y decidir su destino

Revisa, como mínimo, los documentos existentes, incluidos los siguientes si siguen presentes:

- `docs/arquitectura.md`
- `docs/modelo-datos.md`
- `docs/proyecto.md`
- `docs/diseno-ui.md`
- `docs/inventario-desviaciones-vs-flujo.md`
- `docs/plan-demo.md`
- `docs/deploy-constraints.md`

Para cada uno:

1. Identifica afirmaciones que ya no corresponden al código o a los flujos aprobados.
2. Corrige las incoherencias y actualiza ejemplos, nombres de rutas, roles y entidades.
3. Elimina instrucciones repetidas que ya se mantienen mejor en otro documento.
4. Si el contenido sigue siendo útil, actualízalo.
5. Si duplica totalmente otra fuente, conviértelo en un resumen con enlace o propón su eliminación.
6. Si describe un estado histórico, etiquétalo como histórico y deja claro que no es una especificación actual.
7. No borres archivos útiles sin dejar una referencia o explicar el motivo.

No supongas que un documento es correcto solo porque esté en `docs/`. Comprueba sus afirmaciones contra el esquema y el código actual.

### 2.3 `DATABASE.md`: mantenerlo alineado con el esquema real

No lo reemplaces por una descripción inventada. Compáralo entidad por entidad con `prisma/schema.prisma`:

- nombres de modelos, campos, tipos, valores por defecto y enums;
- campos opcionales y obligatorios;
- relaciones, cardinalidad y restricciones únicas;
- campos que se usan para autenticación;
- estados y sus valores reales;
- relaciones opcionales entre usuario, cliente, contrato, cotización y obra.

Documenta con precisión que `Usuario` representa una cuenta de acceso, mientras `Cliente` representa la ficha de persona/contacto. No uses ambas palabras como si fueran la misma tabla.

Comprueba específicamente las reglas ya identificadas:

- `Usuario.clienteId` es opcional y único.
- Una persona (`Cliente`) puede tener cotizaciones, contratos y obras sin tener todavía una cuenta (`Usuario`).
- `Contrato.cotizacionId` puede ser opcional.
- La relación de `Contrato.cotizacionId` no es única en el esquema actual, aunque la lógica de negocio debe impedir contratos duplicados para una misma cotización.
- `ObraActiva` se relaciona con un cliente y puede tener contrato asociado opcional.
- Los hitos de obra usan `visibleCliente` para publicación; no existe un campo de estado de hito y no debe documentarse como si existiera.
- El estado de obra es distinto del estado de cotización y del estado de cuenta.

Si encuentras diferencias, actualiza `DATABASE.md` para reflejar el esquema real o documenta explícitamente la propuesta necesaria. No alteres el esquema únicamente para que coincida con un documento antiguo.

### 2.4 `FLUJO DE PERSONAS.md`: conservar lo aprobado

Este archivo forma parte de las fuentes aprobadas. No lo reescribas por estilo ni lo reemplaces con un flujo antiguo de `docs/`.

Comprueba que los documentos restantes y las instrucciones de los agentes coincidan con él. Si una incoherencia exige cambiar una regla funcional de este archivo, informa la discrepancia y pide confirmación antes de cambiarla.

### 2.5 `ESPECIFICACION_PANEL_ADMIN_CONTRART.md`: preservar las decisiones aprobadas

Este documento define el flujo acordado de los cuatro paneles principales:

- Cotizaciones
- Contratos
- Usuarios
- Obras

No permitas que la documentación antigua reintroduzca estados de cotización innecesarios como `visita_tecnica` o `presupuestado`, ni un estado de hito que el usuario decidió no incorporar.

La documentación debe reflejar también que el panel principal no necesita una sección independiente de “Clientes”, pero la tabla `clientes` debe conservarse.

## 3. Terminología obligatoria: no confundir Cliente con Usuario

Esta distinción debe quedar explícita en `AGENTS.md` y en todos los documentos relevantes.

### `Cliente` / `clientes`

Es la ficha de persona o contacto que se vincula con cotizaciones, contratos y obras. Puede existir sin cuenta de acceso.

Usar términos como:

- “persona/contacto”
- “registro de cliente”
- “ficha del cliente”
- “cliente sin cuenta”

No afirmar que todo `Cliente` puede iniciar sesión.

### `Usuario` / `usuarios`

Es la cuenta de acceso a la aplicación. Tiene credenciales, rol y estado de cuenta, y puede estar relacionada con un `Cliente` mediante `Usuario.clienteId`.

Usar términos como:

- “usuario con cuenta”
- “cuenta de usuario”
- “usuario autenticado”
- “cuenta del cliente”

Cuando la documentación hable del login, debe decir **“iniciar sesión con una cuenta de usuario”** o **“el usuario inicia sesión”**, no “el cliente inicia sesión” si se refiere técnicamente a la entidad `Cliente`.

Se puede usar “el cliente inicia sesión” en lenguaje informal solo cuando se hable de la persona y no de una operación o relación de base de datos. En instrucciones técnicas, rutas, permisos, consultas y validaciones, usar los nombres precisos `Usuario` y `Cliente`.

### Regla para no duplicar personas

- La cotización se relaciona con un `Cliente`.
- La cuenta se guarda en `Usuario`.
- `Usuario.clienteId` vincula la cuenta con la ficha existente del cliente.
- Crear un contrato o una cuenta no debe crear otra ficha `Cliente` si ya existe la correcta.
- No asociar automáticamente personas distintas solo porque comparten nombre.
- El panel Usuarios lista cuentas de `usuarios`, no todos los registros de `clientes`.

Busca y corrige expresiones ambiguas como “crear cliente para login”, “los clientes registrados pueden entrar” o “eliminar usuario/cliente” cuando no quede claro qué entidad se está describiendo.

## 4. Reglas de negocio que toda la documentación debe compartir

### Cotizaciones

- Estado inicial: `nuevo` → etiqueta “Por revisar”.
- Tras confirmar manualmente que se hizo contacto: `contactado` → grupo pendiente/contactada.
- Resultado final: `contratado` o `no_concretado`.
- Abrir WhatsApp no significa que el mensaje se haya enviado; no cambia automáticamente el estado.
- No añadir pasos obligatorios de visita técnica o presupuesto.
- Las cotizaciones no concretadas se conservan y una persona puede enviar otra cotización más adelante.
- Crear contrato desde cotización debe evitar duplicados y marcar la cotización como contratada únicamente después de guardar correctamente.

### Contratos

- Pueden iniciarse desde una cotización o desde el panel Contratos.
- La cotización es opcional en el esquema.
- Si se crea desde una cotización, debe conservar la relación correcta con el cliente.
- Tras guardar, abrir la cuenta existente o continuar a crear una cuenta de usuario, sin duplicar cliente ni usuario.

### Usuarios

- El panel lista únicamente cuentas `Usuario`.
- Los clientes sin cuenta no aparecen como usuarios.
- Suspender una cuenta requiere confirmación y no elimina historial, contratos ni obras.
- La finalización de una obra no desactiva la cuenta.

### Obras e hitos

- Listar obras en curso y terminadas.
- Estados de obra actuales: `en_curso`, `pausada`, `finalizada`, `entregada`, con etiquetas coherentes.
- No confundir “Finalizada” con “Entregada”.
- Los hitos tienen datos de contenido/fecha/foto y `visibleCliente`; no añadir estado de hito.
- Hito no visible: queda guardado en administración, pero no aparece al cliente.
- Hito visible: se publica al usuario autenticado que corresponde a la obra.
- La visibilidad o una fecha pasada no deben presentarse como prueba de que el hito se completó.

### Seguridad

- Validar permisos en backend, no solo en frontend.
- Un usuario solo puede consultar sus propias obras y los hitos visibles de esas obras.
- No exponer notas internas, hashes de contraseña, datos de otros clientes ni información interna.
- No ejecutar operaciones destructivas sin autorización.

## 5. Cómo actualizar documentos sin crear más confusión

- Mantén una única fuente principal para cada tema.
- En documentos secundarios, resume y enlaza; no copies secciones enteras que se desactualizarán.
- Usa las mismas etiquetas de UI y los mismos valores internos en todos los documentos.
- Distingue explícitamente **nombre visible** y **valor guardado**. Ejemplo: `en_curso` → “En ejecución”.
- Distingue “cuenta suspendida” de “cliente sin cuenta”.
- Distingue “cotización no concretada” de “contrato cancelado” y de “obra finalizada”.
- No describas una función como implementada hasta comprobarla en el código.
- Si una tarea está pendiente, etiquétala como pendiente y no la presentes como comportamiento actual.
- No inventes rutas, comandos, servicios, variables de entorno ni capacidades.
- Evita frases ambiguas como “actualizar cliente” si no se especifica si se edita `Cliente`, `Usuario` o ambos.

## 6. Resultado que debe entregar el agente

Al terminar, el agente debe proporcionar:

1. **Inventario de documentos revisados:** ruta, propósito y acción tomada (actualizado, resumido, marcado como histórico o propuesto para retirar).
2. **Lista de incoherencias corregidas:** con las rutas y una explicación breve.
3. **Lista de decisiones que siguen pendientes:** solo si existe una contradicción real que no se pueda resolver con las fuentes aprobadas.
4. **Mapa final de fuentes de verdad:** qué documento gobierna cada tema.
5. **Validaciones ejecutadas:** por ejemplo, búsqueda de términos ambiguos, enlaces Markdown, verificación de nombres de modelos/estados contra Prisma.
6. Confirmación de que no se alteró la base de datos ni se ejecutaron seeds destructivos.

### Criterios de aceptación

- [ ] `AGENTS.md` es breve, claro y remite a las fuentes correctas.
- [ ] Todos los documentos actuales de `docs/` fueron revisados individualmente.
- [ ] No quedan instrucciones antiguas que contradigan los cuatro paneles aprobados.
- [ ] `DATABASE.md` coincide con `prisma/schema.prisma`.
- [ ] `FLUJO DE PERSONAS.md` y la especificación de administración no se contradicen con documentos secundarios.
- [ ] La diferencia entre `Cliente` y `Usuario` queda explicada de forma consistente.
- [ ] Las menciones a login, cuentas, permisos y datos se refieren a `Usuario` cuando corresponda.
- [ ] No se documenta un estado de hito inexistente ni pasos comerciales descartados.
- [ ] No se eliminan tablas ni datos.
- [ ] Se entrega el inventario de cambios y se indican claramente los puntos no resueltos.

**Importante:** esta tarea es una actualización documental. No autoriza por sí sola a refactorizar el código de la aplicación, cambiar el esquema, modificar reglas aprobadas ni borrar archivos/datos. Si la auditoría descubre que la implementación contradice la documentación, registra esa diferencia; no la “arregles” fuera del alcance sin autorización.
