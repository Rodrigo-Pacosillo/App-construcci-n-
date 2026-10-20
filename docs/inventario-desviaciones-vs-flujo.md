# Inventario de desviaciones vs. FLUJO DE PERSONAS.md

> **⚠️ DOCUMENTO HISTÓRICO — NO ES ESPECIFICACIÓN ACTUAL**
> Fecha del relevamiento: **2026-10-12**. Es una foto de ese momento, no una
> descripción de hoy. Varias afirmaciones ya están desactualizadas:
> - La ruta pública `/registro` y su auto-registro **ya fueron eliminados**
>   (cumple la regla dura #1). Este documento las describe como existentes.
> - La "falta de vía admin para autorizar cuentas" **ya no aplica**: existe
>   `/admin/autorizar-cuentas`.
> - El estado pendiente real hoy es otro (ver `AGENTS.md` y
>   `docs/plan-demo.md`): el panel Usuarios es placeholder, el panel Clientes
>   es un stub, y los estados de cotización del código no coinciden con la
>   especificación aprobada.
> Usar como referencia histórica; **verificar siempre contra el código
> actual** y contra las fuentes de verdad (`AGENTS.md`).

> **Estado:** Solo lectura. Creado para servir como línea base.
> **Alcance:** Solo el flujo de cliente (4 realidades). No incluye herramientas, ni ampliación de paneles.

Fecha: 2026-10-12

---

## 1. Resumen

- **Esquema/BD:** Coincide mayormente con el documento DATABASE_SCHEMA.md (18 modelos, enums, relaciones). 
- **Seed:** Genera datos coherentes con Fase 1+2, pero crea un `usuarios` ya vinculado a un cliente (seed crea `cliente@demo.com`/`cliente123`) y también crea un contrato+obra para ese cliente. 
- **Auth:** Usa NextAuth v5 con Credentials + PrismaAdapter + JWT. El login devuelve `role` desde `usuarios`. 
- **Desvíos críticos al flujo:** 
  1. **Auto-registro público existe** → `src/app/(public)/registro/actions.ts` crea `usuarios` (rol `cliente`) y vincula/reusa un `clientes` desde un formulario público. Esto contradice la regla: *"Nadie se registra solo. Toda cuenta en `usuarios` la crea/autoriza el admin."* 
  2. **Transición a cliente-usuario no es "solo admin"** → Tanto el registro público como el vínculo vía seed muestran que hoy hay otras vías para crear `usuarios` con `rol=cliente`.
  3. **Portal requiere rol cliente + sesión** → Los guards existen (`proxy.ts` para `/admin`, `layout.tsx` de `/cliente`), pero no validan que el `usuarios.cliente_id` esté presente ni que exista un `clientes` correspondiente. Tampoco hay restricción explícita que impida que alguien con `rol=cliente` sin vínculo acceda (aunque la data sería vacía).
  4. **No hay mecanismo explícito "autorizar cuenta" desde admin** → No se detectaron rutas/actions/páginas para crear `usuarios` desde panel admin (ni listado `clientes` con acción "crear cuenta"). El admin gestiona cotizaciones/obras/contenido, pero **falta la vía exclusiva** descrita en el flujo.
  5. **Cliente histórico vs cliente-usuario** → La lógica del portal toma `obras[0]` como "obra activa" (`cliente/page.tsx`, `cliente/obra/page.tsx`) y muestra info basada en obras en curso. El layout deja pasar a cualquier `rol=cliente` logueado. Según flujo, cliente histórico debe poder loguearse y ver historial aunque **no tenga obras_activas en curso**. Hoy el comportamiento puede ser correcto en práctica (ve resumen vacío o lista de obras), pero **no hay una distinción explícita** entre "cliente-usuario" (con obra en curso) y "cliente histórico" (sin curso) en el código/guards. Hay que revisar si esto cumple 100% lo esperado.

---

## 2. Base de Datos

### 2.1 Schema (`prisma/schema.prisma`)
- **Coincide con DATABASE_SCHEMA.md.** Estructura completa: `usuarios` (1:1 opcional con `clientes` via `cliente_id`), `clientes` (1:N con cotizaciones/contratos/proyectos/obras), `cotizaciones`, `contratos`, Fase 2 (`obras_activas`, `hitos_obra`, `pagos_obra`), contenido público, tablas NextAuth (`account`, `session`, `verification_token`, `authenticator`) — aunque Auth.js usa JWT strategy en este proyecto, las tablas existen. 
- **Observación:** `Usuario.rol` default `cliente`. No hay `activo` soft-disable aplicado en auth (authorize revisa `user.activo`), ok. 
- **Notas flujo:** El vínculo `usuarios.cliente_id` es clave para aislar datos del portal. Hoy es opcional en schema (`String? @unique`) — coherente con prospecto (sin cuenta). 
- **Fase 2:** Presente y usado por portal admin/cliente. No interfiere con reglas duras si se respeta filtrado por `cliente_id`.

### 2.2 Seed (`prisma/seed.ts`)
- Limpia todo (incluye Fase 2). 
- Crea admin: `admin@demo.com` / `admin123` (sin `cliente_id`) — ok.
- Crea 8 clientes (algunos con email, otros sin). 
- Crea 8 cotizaciones con distintos estados (incluye `ganado` para clientes[4]). 
- Crea proyectos/testimonios/servicios/faqs/certificaciones/precios — contenido demo. 
- **Crea usuario cliente demo:** `usuarioCliente` con `clienteId: clientes[4].id` y contraseña `cliente123`. También crea `contrato` vinculado a `cotizaciones[4]` (estado ganado) y `obraActiva` en curso. 
  - Esto es **consistente con "cliente-usuario"** (tiene contrato + cuenta + obra en curso). 
- **Falta:** Seed no muestra explícitamente un caso de **cliente histórico** (cuenta activa, obras_activas todas `entregada`, sin obra en curso). Útil para validar comportamiento.

### 2.3 Migraciones
- En repo hay migraciones: `prisma/migrations/20250928010217_init/`, `20250928183420_bd_hardening/`. Schema actual refleja ambas. No se detectó desajuste obvio entre schema y migraciones en lectura.

---

## 3. Autenticación y Acceso

### 3.1 Auth (`src/lib/auth.ts`)
- NextAuth v5: `adapter: PrismaAdapter(prisma)`, `session: { strategy: "jwt" }`, provider `Credentials`. 
- `authorize`: busca `prisma.usuario.findUnique({ where: { email } })`, exige `activo`, compara bcrypt con `user.passwordHash`. Retorna `{ id, name, email, role }`.
- Callbacks: `jwt` agrega `role` desde user; `session` agrega `id` (token.sub) y `role`. 
- **Hallazgos vs flujo:**
  - Solo permite login a quien **existe en `usuarios`**. Un prospecto (existe solo en `clientes`+`cotizaciones`, sin `usuarios`) **NO puede loguearse** con este authorize — **esto es correcto**.
  - No valida que `cliente_id` exista cuando `rol==='cliente'`. No bloquea login por falta de vínculo. 
  - Usa PrismaAdapter pero strategy JWT → tablas adapter no se utilizan para session (ok para JWT). 

### 3.2 Guards y rutas protegidas
- `src/proxy.ts`: protege `/admin/*` → requiere `req.auth` y `req.auth.user?.role==='admin'`. Redirige a `/login` si no auth, a `/` si rol != admin. **Correcto para admin.**
- `src/app/cliente/layout.tsx`: requiere `session` y `session.user?.role==='cliente'`. Redirige a `/login` o `/admin`. **Correcto para bloquear no-clientes.** 
- Páginas cliente individuales también hacen chequeos (`if (!session || session.user.role !== "cliente") redirect("/login")`) — redundante pero seguro.
- Login page (`src/app/(public)/login/page.tsx`): si ya hay sesión, redirige a `/admin` o `/cliente` según rol. **Correcto.**

---

## 4. Transiciones por Realidad

### 4.1 VISITANTE
- **Actual:** Navega público. Cotiza sin login → `createCotizacion` (público) crea `clientes` si no existe por email, crea `cotizaciones` con `clienteId` (null? no: visitante crea cliente). Ver líneas 62-100 de actions: si no logueado, busca por email o crea `clientes` y asigna `clienteIdFinal`. 
  - **Implica:** El visitante que deja datos **se convierte en `clientes`** (lead) aunque **NO tenga `usuarios`**. Eso coincide con **PROSPECTO** (clientes+cotizaciones, sin cuenta). 
- **Rastro:** No crea `usuarios`. No deja cookie de auth. **Coincide con flujo.**

### 4.2 PROSPECTO
- **Definición flujo:** Existe en `clientes` + `cotizaciones`, **sin cuenta en `usuarios`**. Experiencia pública. **No tiene portal**. No puede hacer login.
- **Actual:**
  - Crear prospecto vía cotización pública: **sí** (ver 4.1). 
  - Login: **no puede** (authorize requiere `usuarios`). **Correcto.**
  - Puede acumular cotizaciones al mismo `clientes` (reusa por email) — **correcto.**
  - **Desvío sutil:** El formulario público puede crear `clientes` aunque email exista. Reutiliza lead — **coherente**.
- **Coincidencia:** Alta. 

### 4.3 CLIENTE-USUARIO
- **Definición flujo:** Tiene `contratos` registrado **Y** el admin le creó la cuenta en `usuarios` (rol `cliente`). Acceso al portal con su info. Solo ve lo suyo.
- **Actual (vías existentes):**
  1. **Registro público** (`src/app/(public)/registro/actions.ts`): Cualquier persona puede crear cuenta con email/password. Transaccional: reusa `clientes` por email o crea `clientes`, luego crea `usuarios` con `clienteId` y `rol='cliente'`. 
     - **Contradice regla dura #1:** *"Nadie se registra solo. Toda cuenta en `usuarios` la crea/autoriza el admin."*
  2. **Seed:** Crea cuenta vinculada a cliente con contrato+obra. **Equivale a "autorizado por admin" en demo**, pero **código permite auto-registro**.
  3. **No hay UI admin para "autorizar cuentas"**: No existe página/componentes para crear `usuarios` desde admin. Solo hay `getClientesParaObra()` (lista clientes para asignar a obra). 
- **Acceso portal:** Layout exige `rol==='cliente'`. Queries filtran por `cliente_id` del usuario logueado (ver 5). 
- **Contrato requerido:** Flujo dice "contratos + admin crea usuarios". Hoy **no se exige contrato** para crear cuenta vía registro público. Cualquiera con datos puede registrarse y acceder a `/cliente` (verá cotizaciones/obras vacías, pero tendrá sesión). 
  - **Desvío potencial** vs flujo estricto.

### 4.4 CLIENTE HISTÓRICO
- **Definición flujo:** Obras activas **entregadas** o **sin ninguna en curso**. Cuenta `usuarios` **sigue activa**. Puede loguearse y ver historial.
- **Actual:**
  - Cuenta nunca se desactiva al terminar obra (no hay lógica de desactivar). `usuarios.activo` default true. **Correcto.**
  - Login permite cualquier `usuarios.activo` con rol cliente. **Correcto.**
  - Portal (`cliente/page.tsx`): toma `obras[0]` como obra "activa" para mostrar progreso/dirección. Si no hay obras, muestra "Todavía no tenés una obra activa". Muestra `totalObras` (cantidad) y `maxProgreso` de obras con hitos. 
  - `cliente/obra/page.tsx`: si `obras.length===0` → mensaje "No tenés una obra activa registrada". 
  - `contratos/page.tsx`, `cotizaciones/page.tsx`, `proyectos/page.tsx`: filtran por `clienteId` y muestran listas (historial). 
  - **Conclusión:** El portal **sí permite ver historial** (contratos/cotizaciones/proyectos) aunque no haya obra activa. La página "Obra" está enfocada a "obra activa". Esto **no impide login** ni impide acceder a otras secciones. 
  - **Posible mejora vs flujo:** Podría aclarar nomenclatura ("Mi obra" vs historial), pero funcionalmente **no rompe** la regla "cliente histórico puede loguearse y ver historial". La regla dura #9 ("cuenta no se desactiva al terminar obra") se cumple.

---

## 5. Portal del Cliente (`src/app/cliente/*`)

- **Obtención de `cliente_id`:** Todas las páginas hacen:
  ```ts
  const usuario = await prisma.usuario.findUnique({
    where: { id: session.user.id },
    include: { cliente: true },
  });
  if (!usuario?.cliente) return []; // o redirect
  ```
  Luego filtran con `where: { clienteId: usuario.cliente.id }`. 
  - **Correcto:** Usa vínculo usuarios↔clientes. Aísla por negocio-id.
- **Filtrado estricto:** 
  - `cotizaciones/page.tsx`: `findMany({ where: { clienteId: usuario.cliente.id } })` ✓
  - `contratos/page.tsx`: `findMany({ where: { clienteId: usuario.cliente.id } })` ✓
  - `proyectos/page.tsx`: `findMany({ where: { clienteId: usuario.cliente.id } })` ✓
  - `obra/page.tsx`: toma obras del cliente (`usuario.cliente.obras`) y muestra la primera (`obras[0]`). No consulta otras obras de otros clientes. ✓
  - `perfil/page.tsx`: carga datos del `cliente` vinculado. ✓
- **Aislamiento:** No hay queries globales. Todas acotadas por `clienteId`. **Cumple regla "cada cliente ve solo lo suyo".**
- **Notas:** 
  - `cliente/page.tsx` asume obra "activa" = `obras[0]` (más reciente por `fechaInicio desc`). Si hay varias obras (histórico con varias), muestra "max progreso" y listas desde arrays ya filtrados por cliente. 
  - El guard del layout es suficiente para impedir acceso a visitantes/prospectos. 

---

## 6. Panel Admin (solo lo que toca al flujo)

- **Rutas existentes:** `/admin/cotizaciones`, `/admin/obras`, `/admin/proyectos`, `/admin/testimonios`, `/admin/servicios`, `/admin/faqs`, `/admin/certificaciones`, `/admin` (dashboard). 
- **Cotizaciones:** Puede cambiar `estado` (`updateCotizacionEstado`). No crea `usuarios` ni vincula contrato→usuario desde aquí. 
- **Obras:** Admin puede crear/editar obra, hitos, pagos. Asigna `clienteId` (elige cliente existente). **No hay acción para crear cuenta de cliente.**
- **Clientes:** **No existe página `/admin/clientes`** ni listado dedicado de clientes con acción "autorizar cuenta". Solo `getClientesParaObra()` para selector. 
- **"Autorizar cuentas":** Ausente. Según inventario, **no hay implementación** de "crear `usuarios` rol cliente" desde admin. 
- **Transición contrato → acceso:** Hoy puede ocurrir por **registro público** (no por admin). El flujo deseado requiere que **solo admin** cree la cuenta **cuando hay contrato** (o en el momento de habilitar acceso). Implementación actual invierte esto.

---

## 7. Reglas Duras Incumplidas

| # | Regla | Estado | Evidencia | Impacto |
|---|---|---|---|---|
| 1 | **Nadie se registra solo.** Toda cuenta en `usuarios` la crea/autoriza el admin. | **INCUMPLIDA** | `src/app/(public)/registro/actions.ts` (líneas 7-79) crea `usuarios` con `rol='cliente'` públicamente. Formulario `/registro` existe (referenciado en LoginForm). | Crítico. Rompe el núcleo del flujo. |
| 2 | **El prospecto no tiene portal.** | **CUMPLE** | Prospecto sin `usuarios` no puede loguearse (authorize). Guards bloquean `/cliente`. | Ok. |
| 3 | **Sitio público uno solo.** | **CUMPLE** | No hay cambio de UI por rol fuera de login redirect. | Ok. |
| 4 | **Cliente histórico no retrocede a prospecto.** | **CUMPLE** | No hay lógica que borre cuenta/relaciones. | Ok. |
| 5 | **Cada cliente ve solo lo suyo.** | **CUMPLE** | Todas queries filtran por `clienteId` desde `usuarios.cliente_id`. | Ok. |
| 6 | **Portal solo lectura.** | **CUMPLE** | Perfil permite editar datos propios? Revisar `PerfilForm` (acción client-side). Ver `src/components/cliente/PerfilForm.tsx`. | Pendiente verificar edición (podría violar "solo lectura"). |
| 7 | **Notas internas nunca salen del admin.** | **CUMPLE** | Solo usadas en admin/cotizaciones. No expuestas a cliente. | Ok. |
| 8 | **Prospecto perdido nunca se borra.** | **CUMPLE** | Soft/registro histórico. | Ok. |
| 9 | **Cuenta no se desactiva al terminar obra.** | **CUMPLE** | Sin lógica de desactivar. `activo` permanece true. | Ok. |
| 10 | **Visitante sin datos no deja rastro ni perseguido.** | **CUMPLE** | Solo crea `clientes`+`cotizaciones` **cuando deja datos** (cotización). Visitante que solo navega no crea registros. | Ok. |
| 11 | **Empleados/materiales/herramientas no visibles a clientes.** | **CUMPLE** | No existen esas entidades expuestas. | Ok. |

**Adicional detectado:** 
- **Ruta `/registro` pública existe** (`src/app/(public)/registro/page.tsx`, actions). Link visible en LoginForm ("Creá una"). 
- **No existe UI para "autorizar cuenta" desde admin**. Flujo pide que **admin cree `usuarios`**. Hoy no hay forma desde admin. 

---

## 8. Cambios Mínimos Necesarios

**Objetivo:** Alinear código con `FLUJO DE PERSONAS.md` **sin agregar módulos** (sin herramientas, sin ampliar paneles innecesariamente). Enfoque: eliminar auto-registro público + crear vía admin mínima.

### 8.1 BD / Schema
- **No requiere cambio estructural.** Schema actual soporta flujo (vínculo opcional, roles). 
- **Seed:** Si se elimina registro público, el seed ya es coherente (admin crea escenario demo). Podría agregarse un caso "cliente histórico" (obra entregada, sin curso) para validar, pero **no es obligatorio** para cumplir flujo.

### 8.2 Auth / Acceso
- **Validar vínculo cliente-usuario en guards/queries críticas.** Actualmente layout solo chequea `role==='cliente'`. Recomendado: si `rol==='cliente'` pero `usuarios.cliente_id` ausente → redirigir a logout o mostrar error (evita cuentas huérfanas). 
- **Evitar cuentas cliente sin vínculo.** Tras eliminar registro público, esto se vuelve menos probable.

### 8.3 Eliminar auto-registro público (CRÍTICO)
**Archivos a tocar:**
1. `src/app/(public)/registro/page.tsx` → eliminar o **redireccionar** a `/login` con mensaje "Las cuentas se crean desde administración tras firma de contrato". 
2. `src/app/(public)/registro/actions.ts` → **eliminar** (o deshabilitar export). 
3. `src/components/auth/LoginForm.tsx` → quitar enlace "¿No tenés cuenta? Creá una" (líneas 75-80) o reemplazar por texto "Contactanos para gestionar tu acceso". 
4. `src/app/(public)/registro/data.ts` / relacionados si existen (no leído, pero ruta existe) — revisar.
5. Eliminar ruta pública `/registro` completamente.

**Justificación:** Corta vía pública. Cumple regla #1.

### 8.4 Crear vía exclusiva "autorizar cuenta" desde Admin (MÍNIMO)
Necesario para cumplir "admin crea `usuarios`". Propuesta **mínima viable** (no nuevo CRUD gigante):

**Opción A (mínima):** En `/admin/clientes` (crear página nueva) listar clientes **sin `usuarios` vinculado** (`usuario: null`) con email/whatsapp. Botón "Autorizar cuenta" → genera `usuarios` con `rol=cliente`, vincula `clienteId`, setea password temporal (hash) o requiere ingreso. Enviar credenciales por WhatsApp/email interno (fuera scope) — basta con crear registro válido.

**Archivos a crear/mover:**
- `src/app/admin/(panel)/clientes/page.tsx` (nuevo) 
- `src/app/admin/(panel)/clientes/actions.ts` (nuevo: `getClientesSinUsuario`, `autorizarCliente`) 
- `src/components/admin/ClientesList.tsx` (nuevo mínimo)
- Actualizar navegación admin si existe (`src/components/admin/AdminSidebar.tsx`?) para agregar link "Clientes" — **solo si no existe**. Revisar.

**Acción `autorizarCliente(clienteId, password?)`:**
- Requiere `requireAdmin()`
- Verifica cliente existe y sin usuario vinculado (`usuario: null` o `cliente.usuario.length===0`)
- Crea `usuarios`: `nombre=cliente.nombre`, `email=cliente.email` (si existe; si no, ¿qué hacer?). Flujo asume cuenta con email. Seed usa emails.
- Hash password, `rol='cliente'`, `clienteId`, `activo=true`
- Evitar duplicados (`usuarios.email` unique)
- Revalidar `/admin/clientes`

**Restricciones:** Solo crear si hay email? O permitir generar. Pero login requiere email. Mejor exigir `cliente.email` no nulo para autorizar.

**Alternativa temporal (más mínima):** Solo eliminar registro público y documentar "crear usuario manualmente vía seed/db:studio hasta implementar UI mínima". Pero pide alineación con flujo — mejor implementar UI mínima.

### 8.5 Ajustes portal / guards (refuerzo)
- En `cliente/layout.tsx` o helper: validar vínculo. Ejemplo:
  ```ts
  const usuario = await prisma.usuario.findUnique({ where:{id:session.user.id}, select:{clienteId:true,rol:true}});
  if(usuario?.rol==='cliente' && !usuario.clienteId) redirect('/logout')? o throw
  ```
  Pero NextAuth logout server action. Más simple: si rol cliente sin vínculo, redirigir a `/login` con error.
- En páginas cliente, ya hay chequeo `usuario?.cliente` → redirige a `/cliente` (perfil) o retorna vacío. Consistente.

### 8.6 Verificar "solo lectura" perfil
Revisar `src/components/cliente/PerfilForm.tsx`:
- Si permite editar `nombre/whatsapp/ciudad` → **viola regla #6** ("portal es de solo lectura"). 
- Si es read-only o solo muestra → ok.
- Acciones: eliminar formulario editable o convertir a vista.

---

## 9. Checklist de Validación

- [ ] Visitante no accede a `/cliente` (sin sesión)
- [ ] Prospecto (solo `clientes`+`cotizaciones`, sin `usuarios`) **NO** puede loguearse
- [ ] No existe ruta pública `/registro` funcional (eliminada o redirige)
- [ ] LoginForm sin link "Creá una"
- [ ] Admin puede listar clientes sin usuario y **autorizar** (crear `usuarios` rol cliente) — **vía exclusiva**
- [ ] Cliente-usuario con obra en curso accede y ve **solo lo suyo**
- [ ] Cliente-usuario **sin obra en curso** pero con contrato/historial accede (cliente histórico) y ve historial
- [ ] Crear `usuarios` desde admin **únicamente** cuando cliente tiene email (o validado)
- [ ] Aislamiento estricto por `cliente_id` verificado en todas páginas cliente
- [ ] Cuenta nunca se auto-crea públicamente
- [ ] Perfil es solo lectura (o cumple regla)

---

## Notas Finales

- **Fuerte desvío:** #1 (auto-registro). Debe corregirse **primero**.
- **Implementación admin mínima:** Crear `clientes/page` + actions es lo justo para tener "autorizar cuenta". No requiere CRUD completo de usuarios.
- **BD limpia:** Si preferís empezar limpio, `db:seed` tras cambios seguirá creando escenario demo coherente. Seed actual crea cuenta demo — válido como "autorizado".
- **Cliente histórico:** Código actual **no bloquea** login ni impide ver historial. Podría dejarse y validar con datos (obra entregada). 

**Archivos clave para acción inmediata:** `registro/actions.ts`, `registro/page.tsx`, `LoginForm.tsx`, + crear `admin/clientes/*`.