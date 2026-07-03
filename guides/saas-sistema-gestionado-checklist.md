# Checklist De SaaS Y Sistemas Gestionados ITERA

Checklist canonico para construir productos ITERA desde cero o extraerlos de un
producto cliente existente. Aplica tanto a SaaS multi-tenant como a sistemas
instalables en dominio propio gestionados por nosotros, como IteraDesk.

No es un roadmap de features. Es una lista de decisiones, invariantes y gates
que deben existir temprano para no corregir arquitectura, datos o operacion en
produccion.

## Como Usarlo

- Marcar cada item como `base`, `diferible` o `no aplica` antes de empezar.
- Si algo es `base`, debe tener modelo, flujo de escritura, UI, tests y operacion
  minima. No alcanza con "lo soporta el schema".
- Corregir el documento canonico que corresponda antes de crear anexos. Los docs
  complementarios son utiles solo cuando tienen otro nivel de detalle o otra
  audiencia.
- Cada bug estructural arreglado en produccion debe volver a este checklist con
  la leccion generalizada.
- Separar reglas universales de decisiones del producto. Este doc define el
  estandar; el roadmap de cada producto define que entra o no entra al MVP.

## 1. Superficie Del Producto

- [ ] Definir si el producto es SaaS multi-tenant, single-tenant gestionado,
  instalacion por dominio, on-premise parcial o mezcla.
- [ ] Definir superficies: app privada, admin tecnico, admin de negocio,
  marketing, endpoints publicos, APIs, jobs/cron, webhooks y herramientas de
  soporte.
- [ ] Separar rutas protegidas, publicas, admin, cron y API con boundaries claros.
- [ ] Documentar que capacidades son core y cuales son vertical packs. Ejemplo:
  repartos/flota puede ser pack logistico, no core comercial.
- [ ] Definir navegacion primaria y secundaria antes de saturar la sidebar.
- [ ] Mantener un source of truth tecnico vivo: arquitectura, modulos, schema,
  user flows, invariantes y roadmap.

## 2. Dominio Y Alcance MVP

- [ ] Escribir el contrato de dominio antes del schema: entidades, estados,
  transiciones, invariantes y operaciones prohibidas.
- [ ] Definir el "camino feliz" operativo diario del negocio.
- [ ] Definir que pasa con borrados, anulaciones, reaperturas y correcciones.
- [ ] Separar configuracion futura de hechos historicos. Cambiar una categoria,
  precio o medio de pago no debe alterar ventas ya emitidas si esas ventas
  requieren snapshot.
- [ ] Identificar datos contables o de stock que no pueden reconstruirse desde UI.
- [ ] Identificar desde el principio los modulos evergreen: usuarios, permisos,
  clientes, catalogo, ventas, pagos, cuenta corriente, stock, configuracion,
  auditoria, backups y soporte.

## 3. Arquitectura Modular

- [ ] Cada modulo debe tener ownership claro: schema, queries, actions/routes,
  services, UI, tests y docs.
- [ ] Controllers, route handlers y server actions deben ser delgados. La logica
  de dominio vive en services/use cases.
- [ ] Separar server, client, schemas, mappers, view models, componentes leaf y
  shell.
- [ ] Evitar modulos "cajon" como `configuracion` con CRUDs heterogeneos sin
  ownership. Configuracion puede ser hub, no deposito de dominio.
- [ ] Definir API publica interna por modulo. Otros modulos importan esa API, no
  archivos profundos.
- [ ] Gatear ciclos de dependencia con tooling cuando el repo crezca.
- [ ] Usar cortes chicos por seam: primero mover responsabilidad, despues mejorar
  comportamiento.

## 4. Datos, Schema Y Migraciones

- [ ] Toda entidad critica debe tener responsable, estado, timestamps e indices
  coherentes con sus listados.
- [ ] Toda lista debe tener limite (`take`, paginacion o equivalente) y orden
  estable.
- [ ] Toda columna usada en `WHERE`/`ORDER BY` frecuente debe tener indice.
- [ ] Resolver unicidad con constraints + manejo de error, no con check-then-write.
- [ ] Definir nombres fisicos y convenciones antes de acumular migraciones.
- [ ] Las migraciones productivas deben ser revisables y reversibles cuando sea
  posible. No depender de push automatico sin verificacion.
- [ ] Verificar schema aplicado contra DB real antes de deployar codigo que lo
  asume.
- [ ] Backups antes de cambios destructivos o rollouts de datos.

## 5. Auth, Sesion Y Ownership

- [ ] Validar sesion en boundaries server: server components, actions, route
  handlers y jobs admin. No confiar solo en middleware.
- [ ] Validar usuario activo y cuenta/tenant/instalacion activa contra DB en
  acciones privilegiadas.
- [ ] Al desactivar usuario, revocar sesiones activas.
- [ ] Definir roles por accion, no solo por pantalla.
- [ ] Validar ownership de cada FK recibida del cliente antes de escribir.
- [ ] Para tablas join sin ownership directo, validar ownership del parent.
- [ ] API sensible debe arrancar con guard antes del primer read/write.
- [ ] UI oculta acciones sin permiso, pero service/API revalida siempre.

## 6. Sistemas Comerciales: Modelo Base

Para productos como IteraDesk, estos invariantes son core, no extras.

- [ ] `Producto` debe separar datos editables de snapshots usados en operaciones
  historicas.
- [ ] Catalogo debe contemplar categorias, unidades, proveedores opcionales,
  precio base, listas/precios promocionales y estado activo/inactivo.
- [ ] Combos/kits deben decidir si descuentan stock de componentes, si tienen
  precio propio, y como se snapshottean en pedidos.
- [ ] Stock debe manejar movimientos, no solo cantidad actual.
- [ ] Todo cambio de stock debe tener origen: venta, ajuste, devolucion,
  anulacion, carga inicial, compra o migracion.
- [ ] Pedido/venta debe tener estados explicitos y transiciones permitidas.
- [ ] Cotizacion, pedido y venta deben tener contrato de conversion definido:
  que se copia, que queda vinculado y que puede cambiar.
- [ ] Venta mostrador debe ser un cliente/actor operativo modelado con claridad,
  no un null ambiguo que rompa reportes.
- [ ] Cliente con cuenta corriente debe tener limite/reglas, saldo visible,
  movimientos auditables y recibos/cobros vinculados.
- [ ] Caja/cobros debe registrar medio de pago, caja/cuenta, fecha operativa,
  actor, origen y anulacion.
- [ ] Los reportes no deben mezclar cobros de cuenta corriente con ventas contado
  salvo que el origen este modelado.
- [ ] Repartos/flota, rutas y vehiculos deben ser modulo opcional si el mercado
  objetivo no los necesita comunmente.

## 7. Escrituras Criticas Y Transacciones

- [ ] Toda operacion con 2+ writes relacionados va en transaccion.
- [ ] Audit trail o actividad va dentro de la misma transaccion que el write
  auditado.
- [ ] Crear pedido desde cotizacion debe escribir cabecera, items, snapshots y
  vinculos de forma atomica.
- [ ] Confirmar venta con stock debe validar disponibilidad y crear movimientos
  de stock atomicos.
- [ ] Cobrar venta o cuenta corriente debe crear pago, movimiento financiero,
  aplicacion y actividad en la misma transaccion.
- [ ] Anulaciones deben revertir por movimientos compensatorios, no borrando
  historia critica.
- [ ] Si una operacion toca DB y recurso externo, definir orden, rollback y cleanup
  antes de implementar.

## 8. Ledgers, Proyecciones Y Sincronizacion

- [ ] Definir source of truth por dominio. Ejemplo: saldo de cuenta corriente
  sale del ledger, no de un campo editable.
- [ ] Toda proyeccion/materializacion debe poder reconstruirse o reconciliarse.
- [ ] No duplicar semantica entre tablas sin contrato. Si hay ledger y tabla
  auxiliar, documentar cual manda.
- [ ] Pagos/cobros deben tener `origen` o equivalente para evitar doble conteo.
- [ ] Usar snapshots en items de venta/pedido para precio, nombre, unidad,
  descuento e impuestos si aplican.
- [ ] El saldo actual puede cachearse/materializarse, pero debe tener prueba de
  consistencia contra movimientos.
- [ ] Todo flujo que borra y recrea items debe usar lock o estrategia de version
  para evitar carreras.
- [ ] Agregar reconciliadores admin para detectar desfasajes: stock actual vs
  movimientos, saldo cliente vs ledger, caja vs cobros.

## 9. Idempotencia, Concurrencia Y Carreras

- [ ] Mutaciones que pueden repetirse por retry, doble click, webhook o red deben
  tener idempotency key.
- [ ] Webhooks y callbacks externos deben guardar provider event id unico.
- [ ] Operaciones de caja, stock y cuenta corriente deben bloquear o versionar la
  entidad afectada.
- [ ] No confiar en "la UI deshabilita el boton" como defensa contra duplicados.
- [ ] Procesos batch deben ser reanudables y registrar progreso.
- [ ] Jobs deben tener estado, intentos, lock con expiracion, `nextRunAt`, error y
  reaper.

## 10. Cache, Revalidacion Y Consistencia UI

- [ ] Cada write debe declarar que pantallas, tags o queries invalida.
- [ ] Centralizar helpers de invalidacion por dominio.
- [ ] No cachear datos sensibles o altamente cambiantes sin contrato explicito.
- [ ] APIs de estado operativo deben usar `no-store` o equivalente cuando
  corresponda.
- [ ] Search/filtros deben vivir en query params si son parte de la navegacion.
- [ ] Evitar loops de query params, effects y router.
- [ ] UI optimista solo cuando exista rollback o refetch confiable.

## 11. Rate Limits, Cuotas Y Costos

- [ ] Rate limit local solo como fallback. Para multi-instancia usar DB/Redis.
- [ ] Separar limites por superficie: publico anonimo, usuario autenticado,
  admin, cron, login, upload, IA e integraciones.
- [ ] Cuotas con consumo deben reservar atomica y revertir o ajustar si falla el
  procesamiento.
- [ ] IA necesita limite por requests y budget por tokens/costo.
- [ ] Los limites comerciales deben vivir en plan/configuracion, no hardcodeados
  en componentes.
- [ ] Los excesos deben tener respuesta estable y UI comprensible.

## 12. Configuracion Y Feature Flags

- [ ] Configuracion debe dividirse por dominio: catalogo, comercial, sistema,
  seguridad, integraciones y vertical packs.
- [ ] Las categorias de productos pertenecen a catalogo, no a una pantalla
  generica mezclada con parametros del sistema.
- [ ] Medios de pago, cajas y reglas comerciales pertenecen a comercial/finanzas.
- [ ] Usuarios, roles, sesiones y politicas pertenecen a seguridad.
- [ ] Backups, branding, datos del negocio y toggles globales pertenecen a
  sistema.
- [ ] Cada flag debe tener owner, default, efecto, rollback y visibilidad admin.
- [ ] Cambiar configuracion no debe dejar datos existentes en estado imposible.
- [ ] Defaults propagables deben tener version/key, dry-run y no pisar
  customizaciones.

## 13. UI, Design System Y Accesibilidad

- [ ] Crear primitivas antes de construir muchas pantallas: shell, page header,
  toolbar, filters, table/list, empty state, confirm dialog, status badge,
  metric card y form layout.
- [ ] Tokens de marca y componentes compartidos son SSOT. No hardcodear variantes
  visuales por modulo.
- [ ] Admin operativo debe ser denso, escaneable y predecible. No construirlo como
  landing.
- [ ] Listados criticos deben tener mobile real, estados vacios, loading, error,
  permisos y acciones bulk si aplica.
- [ ] Botones icono siempre con `aria-label`.
- [ ] No usar `window.confirm`; usar dialog consistente.
- [ ] Validar visualmente pantallas nuevas en browser antes de cerrar.
- [ ] Medir complejidad UI con Fallow o herramienta equivalente cuando el repo lo
  tenga.

## 14. APIs, Errores Y Contratos

- [ ] Toda entrada externa debe validarse con schema y usar el resultado parseado,
  no el body original.
- [ ] Errores de dominio deben exponer codigo estable y mensaje de usuario.
- [ ] No filtrar errores internos, SQL, tokens, headers ni datos sensibles.
- [ ] Endpoints Bearer-only usan secretos dedicados, no sesion.
- [ ] Operaciones peligrosas admin siguen flujo `preflight -> dry-run -> confirm
  -> apply -> audit`.
- [ ] Operaciones largas devuelven `request_id`, job id o corrida visible para
  soporte.

## 15. Observabilidad, Auditoria Y Soporte

- [ ] Logs estructurados con scope, instalacion/tenant, actor, entidad y error
  serializado.
- [ ] Auditar cambios de usuarios, permisos, configuracion, ventas, pagos, stock,
  cuenta corriente, anulaciones e integraciones.
- [ ] No loguear secretos, tokens, URLs firmadas, prompts sensibles ni datos
  personales innecesarios.
- [ ] Admin/soporte debe poder ver actividades recientes, jobs, errores, cuotas,
  storage, backups y estado de integraciones sin tocar DB.
- [ ] Alertar backlog de jobs, dead letters, cleanup fallido, crons caidos y
  desfasajes de reconciliacion.
- [ ] Cada bug productivo relevante debe dejar evento o diagnostico reproducible.

## 16. Backups, Deploy Y Operacion

- [ ] Documentar fuente unica de credenciales y no pedir secretos por chat.
- [ ] Separar env de runtime, CLI, deploy y servicios externos si aplica.
- [ ] Backups automaticos y backup manual antes de migraciones destructivas.
- [ ] Definir restore drill: donde esta el backup, como se restaura y como se
  valida.
- [ ] Smoke post-deploy: login, dashboard, venta/pedido critico, cobro, stock,
  API critica, job/cron, email/storage si aplica.
- [ ] Timezone productiva explicita en sistemas con fechas operativas.
- [ ] Si hay Cloudflare/CDN, documentar cache, purge y DNS.
- [ ] Para instalacion por dominio, documentar onboarding tecnico del cliente:
  dominio, SSL, env, DB, backups, admin inicial y smoke.

## 17. Testing Y Gates

- [ ] `typecheck`, `lint`, `test:run`, `build`, `quality:check` y
  `release:check` deben existir o tener equivalente documentado.
- [ ] `release:check` debe agregar typecheck, lint, tests, build y quality checks.
- [ ] Tests de dominio para happy path, errores, permisos, anulaciones y edge
  cases.
- [ ] Tests de API para sin sesion, sin permiso, input invalido y caso feliz.
- [ ] Tests de services para ownership, transacciones, errores del ORM y limites.
- [ ] Tests de ledgers para evitar doble conteo y saldos desfasados.
- [ ] Tests de stock para movimientos, anulaciones, combos y concurrencia.
- [ ] Tests de seeds para idempotencia y no pisar customizaciones.
- [ ] Auditoria de seguridad tras tocar auth, routes, services con writes o
  modelos nuevos.
- [ ] Auditoria operacional tras tocar IA, integraciones, jobs, uploads, pagos o
  acciones sensibles.

## 18. Agent Readiness: Decisiones Antes De Soltar Agentes

Esta seccion existe para evitar que varios agentes escriban el mismo sistema en
estilos distintos. Antes de construir rapido, el repo debe tener "hogares"
claros para datos, tipos, rutas, validacion, UI y comunicacion client-server.

- [ ] Escribir el shape de datos antes del ORM final: entidades, relaciones,
  estados, ownership, campos snapshot, campos derivados y campos prohibidos.
- [ ] Usar al agente para criticar o completar el modelo, no para inventar la
  primera estructura sin contrato humano.
- [ ] Definir donde viven los tipos: dominio, DTO/API, view models, formularios,
  componentes y tipos compartidos.
- [ ] Elegir una estrategia unica de validacion y documentar donde se declaran
  schemas, donde se parsea input y como se comparten reglas entre cliente/server
  si aplica.
- [ ] Escribir el mapa inicial de rutas antes de implementar: publicas, privadas,
  admin, API, cron, webhooks, marketing y soporte.
- [ ] Auth y access control deben estar presentes desde los primeros flujos si el
  producto tiene usuarios. No agregar ownership tarde como migracion masiva.
- [ ] Definir la estrategia client-server: Server Components, Server Actions, API
  routes, RPC, services directos o combinacion permitida por caso.
- [ ] Prohibir patrones alternativos no aprobados. Ejemplo: no crear una API
  route nueva si el contrato del repo dice que ese write va por service/action.
- [ ] Definir CSS methodology, tokens, base styles y libreria de componentes
  antes de multiplicar pantallas.
- [ ] Documentar estructura de carpetas con ejemplos concretos: que es local al
  modulo, que es shared, que va en `lib`, que va en `components`, que va en
  `server`, y que imports profundos estan prohibidos.
- [ ] Crear ejemplos canonicos chicos antes de escalar: un listado, un form, una
  accion/write, una query, un dialog, un filtro y un test.
- [ ] Alimentar estas decisiones a `CLAUDE.md`, `AGENTS.md`, skills o reglas de
  repo. Si solo vive en una conversacion, el agente no tiene contrato estable.
- [ ] Convertir las reglas repetibles en tooling: lint, quality checks,
  dependency/cycle checks, tests de guardrails o scripts de release.
- [ ] Si se decide cambiar una eleccion base, migrar de A a B de forma deliberada.
  No dejar A, B, C y D conviviendo porque distintos agentes eligieron distinto.

## 19. Documentacion Y Trabajo De Agentes

- [ ] `CLAUDE.md` y `AGENTS.md` deben apuntar a las fuentes canonicas y comandos
  reales del repo.
- [ ] Los docs tecnicos deben describir estado actual, no intenciones viejas.
- [ ] Cada modulo critico debe tener invariantes, write flows y tests esperados.
- [ ] Mapear rutas/actions/API cuando se agregan o cambian mutaciones.
- [ ] Registrar guardrails descubiertos por bugs reales.
- [ ] Leer commits recientes del area antes de refactorizar: suelen contener
  decisiones ganadas por debug.
- [ ] No crear docs paralelos para evitar corregir el doc principal.

## 20. Checklist Inicial Para Producto Nuevo

Responder antes de codear:

- [ ] Cual es el modelo de despliegue: SaaS multi-tenant o instalacion gestionada?
- [ ] Cual es el boundary de datos: tenant, instalacion, sucursal, usuario?
- [ ] Que modelos son globales, privados o publicos?
- [ ] Quien administra usuarios, roles, invitaciones y reset de password?
- [ ] Que pasa si se desactiva usuario, tenant o instalacion?
- [ ] Que write flows son contables o irreversibles?
- [ ] Cuales son los ledgers canonicos?
- [ ] Que proyecciones pueden reconstruirse?
- [ ] Que operaciones requieren idempotencia?
- [ ] Que operaciones requieren transaccion?
- [ ] Que endpoints son publicos y como se rate-limitean?
- [ ] Que datos deben auditarse?
- [ ] Que configuraciones son core y cuales pertenecen a vertical packs?
- [ ] Que necesita soporte para resolver problemas sin tocar DB?
- [ ] Que backups y restore drills existen?
- [ ] Que scripts forman el gate de release?

## 21. Gate Por Modulo Antes De Implementar

- [ ] Invariantes del modulo escritos.
- [ ] Estados y transiciones escritos.
- [ ] Modelo de permisos escrito.
- [ ] Write flows escritos.
- [ ] Contrato de cache/revalidacion escrito.
- [ ] Tests minimos definidos.
- [ ] Pantallas y primitivas UI definidas.
- [ ] Configuracion relacionada ubicada en el dominio correcto.
- [ ] Observabilidad y auditoria definidas.
- [ ] Operacion de soporte definida.

## 22. Lecciones Pagadas

Estas lecciones vienen de Alquimica CRM, ITERA Lex, Shopear e ITERA Lex Tools.
No son teoricas: aparecieron al corregir bugs o deuda estructural.

- [ ] No construir ventas, pagos, stock y cuenta corriente como CRUDs aislados.
  Son un sistema transaccional con ledgers, snapshots, anulaciones y reportes.
- [ ] No usar campos nulos ambiguos para representar actores operativos. Venta
  mostrador debe ser concepto explicito.
- [ ] No mezclar pagos de cuenta corriente, pagos de venta y estadisticas sin
  origen modelado.
- [ ] No calcular saldos desde multiples fuentes sin reconciliacion.
- [ ] No dejar observers/eventos fuera de transacciones cuando forman parte de la
  consistencia.
- [ ] No poner todos los ajustes en una sola pantalla de configuracion.
- [ ] No sumar features verticales al core si no son comunes al nicho base.
- [ ] No depender de UI para evitar duplicados, permisos o estados invalidos.
- [ ] No hacer refactors grandes sin seams y contratos estables.
- [ ] No cerrar una feature visual sin verificar responsive, estados y accesibilidad.
- [ ] No publicar cambios sensibles sin security/operational audit proporcional.
- [ ] No confiar en memoria del equipo: cada arreglo estructural debe volver al
  checklist, guardrail o doc canonico.
