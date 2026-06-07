---
name: skill-refactorizacion-itera-lex
description: Diseñar, implementar o refactorizar modulos de ÍTERA Lex SaaS con arquitectura modular incremental, puntos de corte chicos, API publica estable, Fallow como medidor, separacion UI/server/actions/services/providers y guardrails multi-tenant antes de que la complejidad se concentre.
---

# Skill Refactorizacion Itera Lex

Usar este skill cuando un modulo del producto crecio mezclando UI, hooks, server actions, services e integraciones externas, y hace falta bajarle complejidad sin reescribirlo entero.

Tambien usarlo al planear o implementar features nuevas en el SaaS para que nazcan con fronteras modulares claras: page/server, shell/render, controller/hook, actions, services, providers, tipos compartidos, validaciones y tests. El objetivo no es solo corregir deuda, sino evitar que la siguiente feature cree el proximo concentrador.

## Bootstrap

1. Leer `CLAUDE.md` y `AGENTS.md` si existen.
2. Identificar package manager real, scripts de validacion y docs vivas del repo.
   - En ÍTERA Lex, UI tocada debe usar `pnpm fallow:ui-health`.
3. Mapear solo la superficie del modulo afectado:
   - rutas
   - tabs/pantallas
   - hooks
   - server actions
   - services
   - tipos compartidos
   - integraciones externas
   - medicion Fallow actual si el modulo ya existe
   - tests/gates que protegen la superficie
4. No abrir todo el repo. Usar `rg` para localizar la feature y leer solo los archivos implicados.

## Flujo

1. Elegir un punto de corte con alto retorno y bajo radio de ruptura.
2. Preservar la API publica del modulo siempre que el corte lo permita.
3. Extraer primero lo repetido o puramente visual antes de tocar la logica mas sensible.
4. Despues de cada corte, volver a medir donde quedo la concentracion de complejidad.
   - Si el corte toca UI, medir con `pnpm fallow:ui-health`.
5. Si el usuario pide una tanda larga, repetir cortes chicos y commitear uno por uno.
6. Frenar cuando el siguiente paso ya implique cambio de arquitectura, riesgo desproporcionado o baja real de retorno.

## Cuando La Feature Es Nueva

Antes de implementar una feature nueva, diseñar el primer corte con las mismas fronteras que se exigirian en un refactor:

1. Page/server: sesion, permisos, params/searchParams, queries iniciales y serializacion.
2. Shell/render: composicion visual sin reglas de negocio pesadas.
3. Controller/hook: estado client, handlers, optimistic UI y navegacion.
4. Actions/API: auth -> authorize -> validate -> service -> audit/revalidate.
5. Service: ownership, FK validation, transacciones y reglas de dominio.
6. Provider externo: adaptador dedicado, sin filtrar detalles del provider hacia UI o services de dominio.
7. Tipos/contratos: si cruzan 2+ archivos, nacen compartidos.
8. Tests: agregar protectores segun riesgo desde el primer corte, no como cierre cosmetico.

Si el primer archivo de la feature ya supera 300-400 lineas o Fallow lo marca high-complexity, partir antes de agregar mas comportamiento.

## Preflight Fallow-First Antes Del Patch

Antes de escribir codigo de una feature o refactor no trivial, hacer un presupuesto explicito de complejidad. Este paso evita implementar primero y refactorizar despues por Fallow.

1. Nombrar la fachada publica que debe quedar estable: page, route, action, CLI, service o hook exportado.
2. Dibujar la particion inicial en 3 a 7 archivos chicos, aunque algunos nazcan con poco codigo.
3. Asignar responsabilidades con una regla simple: un archivo puede orquestar, renderizar, parsear, validar, navegar, ejecutar side effects o formatear; no varias de esas cosas a la vez.
4. Identificar de antemano la funcion que podria crecer por ramas (`if/switch`, errores, env vars, estados UI, providers, permisos). Esa funcion no debe nacer como bloque imperativo largo; debe nacer como tabla de reglas, pipeline de pasos o helpers puros testeables.
5. Definir el contrato de test antes del refactor si se toca seguridad, env/deploy, auth, ownership, sync, storage, emails, integraciones oficiales o CLI de release.
6. Medir Fallow focal antes si el modulo existe; si el modulo es nuevo, medir apenas compila el primer corte y antes de sumar el segundo comportamiento.
7. Si el codigo nuevo necesita mas de un tipo de estado (`URL`, draft, server data, session, cache, optimistic), crear modulos separados para parse/build, controller y view-model desde el inicio.

Presupuesto orientativo:

- Page/server: chico; solo params, auth, data inicial y composicion.
- Shell/render: puede ser mediano, pero sin reglas de negocio ni ramas profundas.
- Controller/hook: si devuelve muchos handlers o mezcla URL + draft + efectos, partir en navigation/actions/view-state.
- Action/route: auth -> authorize -> validate -> service -> audit/revalidate; no parsear UI ni formatear copy.
- Service: ownership y dominio; provider externo por adaptador.
- Helpers: puros, nombrados por responsabilidad concreta y medidos. Si un helper nuevo queda con `crap_above>0`, el corte no termino.

Checklist de riesgo Fallow antes de codear:

- ¿Estoy por agregar un `switch`/cadena de `if` con 5+ casos? Convertir a reglas declarativas o predicados chicos con tests de comportamiento.
- ¿Estoy por parsear strings/env/URLs y reportar errores en la misma funcion? Separar parseo, validacion y reporter.
- ¿Estoy por mezclar labels, estados visuales y acciones en un componente? Crear view-model o config de estado.
- ¿Estoy por agregar fallback/default en env/deploy? Exigir valor explicito o error; nunca esconder fallos productivos.
- ¿Estoy por crear un helper "utils" generico? Rechazarlo salvo que tenga responsabilidad y caller claros.

## Reglas Preventivas Aprendidas

Aplicar estas reglas antes de escribir el patch. El objetivo es evitar crear el proximo refactor.

- Antes de agregar estado client, definir la fuente de verdad: URL, draft local, sessionStorage, server data u optimistic state. Si dos interacciones leen el mismo dato, crear una frontera minima para leer/escribir ese dato.
- No usar `useEffect` para sincronizar estado derivado si el dato puede resolverse en el evento, desde URL o desde storage acotado. Si React lint marca setState sincronico en effect, tratarlo como deuda real salvo caso muy justificado.
- Si una navegacion depende de texto tipeado pero todavia no confirmado, modelar ese draft como contrato del flujo. No asumir que `urlParams` representa la intencion actual del usuario.
- Cuando un cambio cruza cliente interno y servicio externo propio, validar ambos lados en el mismo corte, pero commitear por repo o capa. Ejemplo: API client + worker allowlisteado.
- Nunca resolver egress o integraciones oficiales con proxy generico. Cada endpoint auxiliar debe ser una operacion allowlisteada, con payload tipado y tests de rechazo.
- Si un fix resulta ser "no tocar codigo", documentar la decision en la respuesta y no crear commit vacio. La ausencia de cambio tambien es un resultado valido si los checks lo prueban.
- Para datos privados, implementar primero el dato minimo con owner explicito y tests A/B. No agregar workspace, linkeo SaaS, roles o metadata futura hasta que exista un caso real.
- En UI server-driven con tabs/search params, separar siempre: params URL, draft input, navegacion, acciones de busqueda y view state. Si el controller empieza a devolver demasiados handlers, el siguiente corte es navegacion o acciones.
- Fallow se mide sobre archivos tocados antes de cerrar. `crap_above=0` en archivos nuevos/tocados es el criterio; deuda heredada se nombra aparte y no se mezcla con el corte.
- Un helper nuevo solo vale si reduce complejidad real sin convertirse en nuevo hotspot. Helpers defensivos genericos para contratos ya tipados son deuda disfrazada.
- Para CLIs o gates de deploy, proteger primero el comportamiento black-box con temporales/env reales y recien despues extraer internals. El gate debe seguir siendo deterministico y fail-fast.
- Para mappers de errores o estados, preferir una lista ordenada de reglas testeadas sobre una funcion con ramas acumuladas. La prioridad de reglas es parte del contrato.
- Para providers/root client wrappers, aislar lectura de storage/media/env en helpers puros y dejar el componente como cableado minimo.
- Para tablas o paneles admin, sacar formateo/labels/acciones derivadas del render antes de agregar columnas o estados.
- Si una refactorizacion "limpia" el archivo original pero crea un archivo nuevo dificil de testear, seguir cortando en el mismo commit o volver atras; no registrar como deuda futura algo que nacio en este corte.

Pregunta obligatoria antes del patch: que estado o contrato puede quedar duplicado si este cambio crece? Si la respuesta es URL, draft, session, server o cache, crear primero la frontera minima que lo haga explicito.

## Modo Tanda De Cortes

Cuando el pedido sea avanzar "lo mas posible", "una buena tanda" o similar:

1. Mantener cada corte con una intencion unica y verificable.
2. Validar antes de cada commit segun el riesgo del corte.
3. Usar Conventional Commits en espanol.
4. No acumular refactors distintos en un commit grande.
5. Despues de cada commit, revisar `git status --short` y medir si queda otro punto de corte de alto retorno.
6. Al detectar meseta, cerrar docs vivas y parar o moverse a otro frente mas rentable.

## Puntos De Corte Priorizados

1. UI repetida entre pantallas hermanas -> componente compartido.
2. Pantalla gigante -> shell orquestador + piezas de render chicas.
   - Page server: params, sesion, data y serializacion.
   - Shell/render: layout y composicion visual.
   - Controller/hook: estado client y handlers.
   - Params/navigation: parse/build de URL fuera del JSX.
   - Estados: empty/loading/error/results/pagination separados si conviven.
   - Cards/actions: view models y acciones visibles derivadas antes del render.
3. Server actions duplicadas -> helper compartido sin cambiar la surface publica.
4. Tipos serializados repetidos -> modulo de tipos del feature.
5. Integracion externa dominando la UI -> separar `workspace` de `provider` antes de seguir puliendo esa integracion.
6. Service grande -> fachada publica estable + internals por responsabilidad.
7. Writes sensibles -> separar validacion, construccion de payload y efectos externos sin romper la transaccion.
8. Agregador read-only grande -> fachada publica estable + chunks por contexto.
   - Mantener `getXContext()`, `search()`, `buildDashboard()` o equivalente como fachada.
   - Extraer chunks por entidad, vista o responsabilidad: `causa`, `cliente`, `dashboard`, `related`, `summary`, etc.
   - Cada chunk devuelve un contrato simple y testeable, por ejemplo `{ parts, sourceIds, suggestedActions }` o `{ rows, totals, warnings }`.
   - No mezclar provider/modelo/prompt/budget con queries de dominio.
   - Preservar permisos por bloque: si falta permiso, no consultar ni exponer datos.
9. Upload/storage/security grande -> fachada publica estable + contratos + parser + validadores puros.
10. Feature con provider aun inestable -> posponer refactor profundo y cortar solo fronteras que reduzcan riesgo inmediato.

## Secuencia Para Services Grandes

Cuando un service mezcla lecturas, writes, validaciones, integraciones externas, emails, tracking o storage:

1. Mantener `fooService(...)` como fachada publica y conservar nombres/metodos exportados.
2. Extraer `foo/types.ts` con selects, tipos publicos/reexportados y helpers puros.
3. Extraer validaciones de ownership/FK/target en un modulo dedicado.
4. Extraer lecturas/listados sin side effects.
5. Extraer writes por responsabilidad de negocio.
6. Extraer integraciones externas o side effects post-transaccion si existen.
7. Recién despues, deduplicar builders/helpers internos que aparezcan repetidos.
8. Actualizar docs vivas cuando cambia la ubicacion real de la logica.

## Secuencia Para Agregadores Read-Only

Cuando un modulo arma contexto, busquedas, dashboards o resumenes combinando muchas entidades:

1. Mantener la funcion publica como fachada.
2. Definir un contrato interno minimo para los chunks.
3. Extraer primero el bloque mas grande o mas sensible, no el mas facil de nombrar.
4. Cada chunk debe contener sus permisos, queries acotadas con `take` y formateo local.
5. Evitar que un chunk conozca providers externos, prompts, modelos IA, budgets o UI.
6. Medir despues de cada extraccion; si la fachada queda chica y los chunks quedan sin `crap_above`, parar.

Ejemplos de responsabilidades utiles:

- `invitations`, `onboarding`, `trial-tenants` para CRM/leads.
- `biblioteca`, `linking`, `classification`, `deletion` para archivos.
- `target-validation` o `ownership` para validaciones compartidas.
- `causa-context`, `cliente-context`, `dashboard-context` para agregadores de contexto/read-only.

## Secuencia Para Upload/Storage/Security

Cuando un modulo mezcla request parsing, MIME/extensiones, firma binaria, storage, cuotas, ownership, cleanup o provider externo:

1. Mantener el modulo original como fachada publica y preservar exports, codigos de error, formatos aceptados y payloads.
2. Extraer contratos compartidos en un modulo chico: tipos de request/result, builders de respuesta y tipos serializados.
3. Extraer parser/request validation por pasos chicos: form data, archivo, size, metadata, schema y firma.
4. Extraer validadores puros para MIME, extension, magic bytes, sanitize o policy equivalente.
5. Mantener ownership, FK, cuota, storage keys, orden DB/storage y cleanup sin cambios en el primer corte salvo que el objetivo sea especificamente eso.
6. Agregar tests directos para los validadores puros y para el parser; no depender solo de route tests indirectos.
7. Medir la fachada y los nuevos internals. Si el hotspot solo se movio al helper nuevo, el corte todavia no esta cerrado.
8. Si se usa una tabla declarativa de reglas, preferir tests de comportamiento por categoria y documentar cualquier ajuste del ratchet de mutation.

## Heuristicas

- Si el modulo sigue funcionando con los mismos props, handlers y acciones publicas, el corte va bien.
- Si la mejora solo embellece una integracion externa limitada por negocio, no seguir por ahi.
- Si al dividir la UI aparece un hook que concentra todo, ese hook pasa a ser el siguiente candidato.
- Si hay duplicacion entre entidades hermanas, un wrapper/adaptador compartido suele dar retorno inmediato.
- Si la fachada queda chica y los internals estan entre tamanos razonables, seguir partiendo suele bajar el retorno.
- Si el siguiente corte obliga a partir una transaccion sensible, exigir una razon funcional clara.
- Si Prisma tenant extension exige campos inyectados en runtime, mantener casts acotados cerca del `create/update` y comentarlos.
- Si un builder interno elimina repeticion de storage/provider/email/tracking, suele rendir despues de extraer el modulo responsable.
- Si Fallow marca una integracion que todavia no tiene direccion funcional estable, no refactorizar por metrica sola. Posponerla o limitarse a una frontera que proteja seguridad/tests.
- Si un modulo nuevo puede nacer con fachada + internals sin costo real, hacerlo desde el inicio; no esperar a que Fallow lo marque.
- Si el cambio solo mueve codigo pero no baja `high-complexity`, `crap_above`, fan-in riesgoso o mezcla de responsabilidades, no cuenta como corte util.
- Si una extraccion limpia el archivo original pero Fallow marca el helper nuevo, seguir el corte o agregar tests antes de declararlo terminado.
- Si se mueve logica sensible a archivos nuevos, actualizar tambien los gates que miden esa logica; un check verde contra el archivo viejo no prueba el refactor.

## Medicion Despues De Cada Corte

Usar mediciones livianas para decidir si seguir:

1. `wc -l` del archivo principal y los internals del feature.
2. `rg` de imports/usos publicos para confirmar que la API no se movio accidentalmente.
3. `git diff -- <paths>` para revisar que el corte sea mecanico y acotado.
4. En UI, correr `pnpm fallow:ui-health`. Si falla, el siguiente punto de corte es obligatorio antes de entregar salvo hotfix minimo documentado.
5. Para foco manual: `pnpm exec fallow --format compact health | rg "<archivo|feature>"`.
6. Buscar el nuevo concentrador: archivo de 300-400+ lineas, hook orquestador grande, action o service que todavia mezcle responsabilidades.
7. Revisar si el archivo tocado sigue en `high-complexity` o con `crap_above>0`; bajar "bastante" no siempre alcanza.
8. Parar si el proximo cambio solo renombra/mueve codigo sin bajar complejidad real.
9. Si la fachada queda chica y los internals quedan con `crap_above=0`, parar aunque Fallow global siga reportando deuda heredada.
10. Si el hotspot aparece en un archivo nuevo creado por el corte, tratarlo como parte del mismo vertical y no como deuda futura cosmetica.
11. Confirmar que los tests agregados siguen apuntando al comportamiento publico, no a detalles privados del helper recien extraido.
12. Si Fallow global queda verde pero lista refactoring targets sin `crap_above`, documentarlos como oportunidades, no como bloqueo del corte.

## Validacion

1. Corte de service: correr test puntual del service si existe, typecheck y lint.
2. Corte UI simple: correr typecheck, lint y `pnpm fallow:ui-health`.
3. Cambio que toca 3+ archivos de feature o superficie sensible: correr quality/check equivalente del repo.
4. Corte read-only/agregador: tests focales del route/service consumidor, typecheck, lint y Fallow focal del feature.
5. Auth/upload/tenant/security: sumar `pnpm test:mutation` cuando aplique.
6. Flujo UI con escritura: sumar smoke E2E especifico y cleanup si crea datos.
7. Si el repo tiene docs vivas de arquitectura o estado, actualizarlas antes del commit de cierre.
8. Revisar diff puntual antes de cerrar o commitear.
9. Reportar warnings persistentes conocidos sin bloquear si el check termina OK.
10. UI nueva o tocada no debe quedar en `high-complexity`; cualquier excepcion se documenta en `.planning/STATE.md` con proximo corte.
11. Si auth/upload/tenant/security mueve logica a archivos nuevos, revisar y actualizar el scope de mutation para que mida la ubicacion real del riesgo.
12. Si mutation falla por ampliar honestamente el scope, reforzar tests o ajustar el ratchet de forma explicita; no reportar como verde una corrida que solo mide la superficie vieja.
13. En helpers declarativos con tablas de reglas, `ignoreStatic` puede ser aceptable solo si hay tests directos por comportamiento y el score queda sobre el umbral acordado.

## Guardrails

- No hacer reemplazos masivos ciegos.
- No mezclar cambios ajenos.
- No abrir un refactor transversal si todavia no agotaste los puntos de corte chicos del feature.
- No seguir dividiendo por inercia: cada extraccion tiene que bajar complejidad real o preparar una frontera util.
- No sacar `actividad.create()` de `$transaction`.
- No debilitar guards multi-tenant, ownership ni validaciones FK al mover codigo.
- No esconder efectos externos dentro de helpers genericos si eso vuelve opaco el orden transaccional.
- No dejar que UI, provider externo o prompt IA decidan scoping/ownership de dominio.
- No perseguir deuda de integraciones inestables si el producto todavia no definio el rumbo.

## Salida Esperada

- Explicar que punto de corte se aplico.
- Indicar que superficie publica se preservo.
- Señalar cual es el siguiente punto de corte recomendado.
- Indicar si se paro por meseta, por riesgo funcional o porque Fallow del feature quedo limpio.
- Enumerar commits cuando se haya trabajado en modo tanda.
- Reportar validaciones corridas y limites si existieron.

## Referencia

- Patrones y hallazgos concretos de este repo: `references/patrones-itera-lex.md`
