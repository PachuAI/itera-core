---
name: skill-arquitectura-itera-tools
description: Diseñar, planificar, auditar o construir nuevas herramientas y buscadores en ÍTERA Lex Tools, especialmente arquitectura frontend Next.js server-driven, contratos FastAPI, tabs, query params, filtros, chips activos, navegación y prevención de deuda Fallow antes de implementar UX.
---

# Skill Arquitectura ÍTERA Lex Tools

Usar este skill antes de construir, rediseñar, auditar o mejorar una herramienta del portal público ÍTERA Lex Tools, en especial buscadores jurisprudenciales, índices persistentes, ingestas de datos oficiales o features que crucen frontend y API.

Objetivo: prevenir deuda estructural antes de codear. Este skill no reemplaza al skill de refactor; se usa en la fase de arquitectura y construcción inicial.

## Entrada Obligatoria

1. Determinar si el cambio toca `api/`, `web/` o ambos.
2. Leer `CLAUDE.md`, `.planning/STATE.md` y `.planning/CODEBASE-MAP.md` del repo afectado.
3. Revisar `git status --short` y no mezclar cambios ajenos.
4. Si cambia contrato frontend-backend, verificar ambos lados antes de proponer o editar.
5. Para cambios visuales, leer SSOT del SaaS antes de tocar tokens o patrones visuales.
6. Antes de escribir código, definir el presupuesto Fallow del corte: archivos nuevos/tocados deben apuntar a `crap_above=0`; funciones nuevas deben evitar más de 4 ramas/caminos salvo que tengan tests focales o se partan.

## Presupuesto Fallow Antes De Codear

Fallow no debe funcionar como corrector tardío. En features nuevas o cortes chicos, diseñar el primer draft para que nazca dentro del presupuesto:

- Cada función nueva debe intentar cerrar con complejidad ciclomática `<= 4`. Si una función pide más ramas, partirla antes de escribirla o convertir la decisión en mapa/tabla constante.
- Todo archivo nuevo de UI/auth/ruta/helper debe apuntar a `crap_above=0` en health focal. No aceptar "lo arreglamos después" salvo hotfix crítico documentado.
- No crear helpers defensivos genéricos sobre `unknown` (`readStringField`, `pick`, `coerceDate`, `normalizeAnything`) si el contrato local ya está tipado. Esos helpers suman ramas sin valor de producto.
- Si realmente hay que parsear `unknown` o normalizar datos externos, hacerlo en un módulo puro con tests focales antes de consumirlo en UI.
- Preferir código específico y tipado para el corte actual antes que abstracciones "preparadas para después". La flexibilidad especulativa cuenta como deuda si no tiene consumidor real.
- Usar mapas constantes para resolver variantes simples (`role -> label`, `status -> className`, `kind -> handler`) en vez de cadenas de `if`/`switch`.
- No mezclar en una sola función guard de sesión, autorización, normalización, view model y fallback visual. Elegir una responsabilidad por función.
- Antes de aplicar el patch, hacer una auto-pregunta concreta: "¿qué función nueva podría aparecer como `high-complexity`?". Si la respuesta no es "ninguna", partir el diseño primero.

### Cómo Cuenta Fallow (modelo mecánico — internalizar esto, no estimar a ojo)

La causa #1 de refactor tardío es razonar la complejidad **semánticamente** ("esto es una sola idea") mientras Fallow la cuenta **sintácticamente**. No coinciden. Contá así, literal:

- Una función arranca en `1`. Suma **+1 cada uno**: `if` / `else if`, ternario `?:`, `&&`, `||`, **`??`**, **optional chaining `?.`**, `case`, `for`/`while`, `catch`, y cada predicado de `.filter/.some/.every/.find(x => ...)`.
- Umbral observado de deuda nueva: ciclomática `>= 5` (crap `>= 30`) ya aparece como `high-complexity` en el gate `new-only`. **Techo duro real: 4 operadores de decisión TOTALES por función nueva**; las llamadas a otras funciones no suman.
- Lo no-obvio que más rompe: `obj?.campo ?? fallback` cuenta **2** (el `?.` y el `??`). Cuatro defaults así en una función = 8 → `critical`. Un componente con 3 `cond ? <X/> : null` en el JSX = 3 + base.

### Patrones Que Nacen Verdes (usar estos de entrada, no refactorizar después)

- **Defaults**: `a ?? b` cuenta. Si necesitás ≥2 en una función, o `if (!obj) return DEFAULT_CONST;` (un guard) y después acceso plano `obj.campo`, o UN helper de dominio `orFallback(v)`. No inventar 4 helpers casi iguales: uno por dominio.
- **Optional chaining**: cada `?.` suma. Guardá una vez (`if (!a) return ...`) y accedé plano. No encadenes opcionales en cálculos.
- **JSX condicional**: máximo **1** `cond ? <X/> : null` por componente. Con 2+, extraé sub-componentes (`<XHeader>`, `<XFooter>`, `<XSlot>` que hace el `if return null` adentro).
- **Listas con condicionales** (celdas, links, opciones, chips): armá el array en una función helper con `push` condicionales y devolvé `array.map(...)` en el JSX. Nunca ternarios inline dentro del `.map`.
- **Enums / search params**: `parseEnum(value, SET, fallback)` + `Set` por familia, nunca cadenas `=== || ===`.
- **Validación multi-condición**: guard-clause que valida y delega a otra función que recibe el valor ya narrowed. Una guard de 4 condiciones en una sola función ya es ciclomática 5.
- **Handlers gemelos** (check/bring, dry/real, save/skip): apenas aparece el segundo con la misma forma, extraé un runner compartido (`executeOp(task)`). Evita el clone de 50+ tokens que Fallow marca como `duplication`.

### Medir Por Archivo, No A Fin De Fase (comportamiento, no opcional)

`fallow:audit` a fin de corte llega tarde: descubrís 14 funciones juntas en vez de partir una de 5 al instante. **Después de escribir cada archivo nuevo, antes de pasar al siguiente**, correr `pnpm exec fallow --format compact health | rg "<archivo-nuevo>"` y confirmar `crap_above=0`. No estimar la ciclomática mentalmente (el modelo humano y el de Fallow divergen — ver arriba). Si da `crap_above>0`, partir antes de seguir; nunca acumular para el cierre de la fase.

Plantilla para cortes chicos de ruta privada/auth:

- `page.tsx`: Server Component que llama un guard, compone UI y delega piezas repetidas a componentes chicos locales si hace falta.
- `lib/auth/*.ts`: guard server-only mínimo; usar el contrato de BetterAuth/Prisma ya tipado. No normalizar campos opcionales que la pantalla no necesita.
- `user-menu`/navegación: sólo cambiar enlaces/acciones visibles; no mezclar lógica de permisos profunda.
- Sin schema nuevo salvo que el dato privado exista en el criterio de aceptación.
- Sin fechas, metadata, workspace, providers externos ni placeholders si no son necesarios para el corte.

Plantilla para primer dato privado:

- Definir owner explícito antes de schema: `userId` Tools como mínimo; `workspaceId` sólo si workspace ya existe como producto real.
- Server actions o route handlers deben llamar `requireToolsAccount()` antes de leer o mutar.
- Queries siempre filtran por owner en lectura, edición y borrado.
- Tests A/B obligatorios: Usuario A no lee, modifica ni borra datos de Usuario B.
- No agregar linkeo SaaS, subject externo ni tabla external link para justificar ownership local.

## Arquitectura Preventiva Para Buscadores

Para cualquier buscador nuevo o mejora grande, diseñar estos cortes desde el día 1:

- `page` server: parsea search params, ejecuta fetch inicial, arma metadata cuando corresponda.
- `shell` client: compone layout y render; no debe concentrar lógica de navegación/filtros.
- `controller`: orquesta hooks y expone estado/handlers mínimos.
- `navigation`: arma URL pública, `tab`, `replace`/`push`, corpus path si aplica.
- `search-params`: parse/build querystring; usar helpers compartidos antes de duplicar.
- `tabs`: usar primitivas compartidas de `src/lib/search-tabs/` si hay pestañas.
- `filter-params`: mutaciones puras de filtros/facets/chips.
- `active-filter-list`: builder puro de chips/labels, separado del render.
- `results/content state`: empty/error/loading/results/pagination separado del shell principal.

Si una fuente provincial tiene semántica propia, mantener modelos separados. Compartir sólo primitivas mecánicas.

## Arquitectura Para Índices Persistentes

Cuando una fuente deja de ser sólo búsqueda viva/cache y empieza a guardar documentos, extractos, consultas o backfill, tratarla como sub-app interna de dominio. No acumular esa lógica en el router público ni en el adapter oficial.

Estructura recomendada:

- `db.py`: schema, conexiones, init condicional y queries de bajo nivel. No llama upstream.
- `models.py`: modelos Pydantic internos/admin/públicos del índice. No parsea HTML.
- `service.py`: upsert único de documentos normalizados, merge defensivo y helpers de corrida. No hace requests HTTP.
- `ingest.py`: ingesta de recientes/backfill, dry-run, corridas y checkpoints. No renderiza respuestas públicas.
- `extracts.py`: seed, cola, estados y escritura de extractos. No genera extractos dentro de requests públicas.
- `capture.py`: captura pasiva post-respuesta detrás de flag. No bloquea respuestas ni guarda HTML crudo.
- `feed.py` o `router_public.py`: lectura pública desde índice. No ejecuta backfill ni mutaciones.
- `reports.py`: estado, cobertura, consultas capturadas y snapshots admin. Puede leer; no muta documentos.
- `recommendations.py` o capa equivalente: opcional; sólo si hace falta priorizar “qué conviene hacer ahora” combinando varios reportes. Debe ser read-only y no reemplaza al plan de ejecución.
- `router_admin.py`: endpoints operativos protegidos por `ADMIN_TOKEN`.

Orden sano de avance para mucha data:

1. Crear schema mínimo e init condicional sin romper si la DB no está configurada.
2. Implementar upsert idempotente desde resultados ya normalizados.
3. Crear endpoint admin de estado.
4. Crear ingesta admin con `dry_run=true` por default.
5. Validar una corrida real limitada antes de masificar.
6. Migrar extractos manuales a DB con seed idempotente.
7. Exponer lectura pública desde índice sin reemplazar todavía el feed vivo.
8. Activar captura pasiva sólo detrás de flag y con límite por query.
9. Agregar dashboard/reportes admin antes de backfill largo.
10. Recién después implementar backfill con checkpoints, límites y pausas.

Guardrails para índices:

- El adapter oficial normaliza; no escribe DB del índice.
- El router público responde; no contiene lógica documental.
- El egress worker conecta; no decide qué indexar.
- Todo proceso largo debe tener corrida, estado, error resumido y, si aplica, checkpoint.
- Toda mutación masiva debe tener `dry_run` y default conservador.
- La captura debe ejecutarse después de armar la respuesta y nunca cambiar la respuesta al usuario si falla.
- Usar flags para captura, feed indexado, búsqueda local y backfill.
- Limitar resultados capturados por query (`*_MAX_RESULTS_PER_QUERY`) para no convertir búsquedas amplias en crawls accidentales.
- No guardar PDFs, HTML crudo ni texto completo masivo en el primer corte.
- No pisar extractos `revisado`; usar estados y seed idempotente.
- El endpoint de estado debe responder aunque la DB no esté configurada.
- Si una capa decide prioridad operativa, mantenerla separada de reportes puros, planes ejecutables, ingestas mutantes y UI.
- Antes de activar producción, hacer smoke real limitado y revisar estado admin.

## Rediseño Sobre God-Component (evitar el carve-down churn)

Cuando se rediseña sobre un componente monolítico existente (un dashboard/shell de cientos de líneas con todo adentro):

- **Prohibido "reusar-luego-borrar" entre cortes.** Reusar el contenido viejo en el corte N y borrarlo en el corte N+2 genera dead-code intermedio (el gate `new-only` lo marca) y obliga a cirugía sobre el monolito (riesgo de `sed` off-by-one, imports/types huérfanos).
- **Cada corte crea su archivo destino real y borra el cluster viejo equivalente en el MISMO corte.** "Borrar las funciones/archivos viejos de X" es deliverable de primera clase del corte de X, con `fallow dead-code` como check de cierre.
- El corte 1 convierte el monolito en **router/shell fino** de una; las vistas viven en archivos propios desde el día 1, aunque arranquen mínimas. Así nunca queda un god-component que desarmar reactivamente.
- Al borrar un cluster, limpiar en el acto sus imports/types huérfanos (typecheck + lint lo confirman) y actualizar los contratos estáticos que lo referenciaban.

## Paneles Admin Para Índices

Cuando un índice persistente tenga panel operativo, tratar la UI admin como una consola de comandos acotada, no como lugar de lógica de dominio:

- El cliente admin del frontend debe ser server-only; nunca exponer bearer admin al navegador.
- La UI client sólo puede disparar server actions acotadas; esas actions llaman al cliente admin server-only.
- Antes de cualquier mutación desde UI, mostrar estado/preflight/límites efectivos y bloquear acciones si el backend informa que no están disponibles.
- Una acción real desde UI debe exigir simulación o lectura previa equivalente, confirmación explícita y límites visibles.
- Toda ejecución real debe mostrar trazabilidad operativa: `request_id`, `corrida_id` cuando exista, estado, resumen de cambios y ruta lógica al detalle.
- Después de una mutación real, ofrecer refresh del panel o recargar datos server-side; no dejar snapshot/corridas/auditoría visualmente stale.
- Si una acción desde panel llama un endpoint que ya audita backend, conservar `X-Request-ID` server-side para unir UI, auditoría y corrida.
- No habilitar acciones masivas con defaults amplios desde UI. Los defaults de panel deben ser conservadores aunque el endpoint soporte más.
- En cortes read-only, una acción sugerida puede mostrarse como ruta lógica/contexto operativo, pero no como botón, server action ni handler hasta que el roadmap habilite la mutación.
- Si el panel necesita una “próxima acción”, el backend debe devolver una recomendación tipada con motivo, severidad, bloqueantes/precondiciones, evidencia y acción sugerida. La UI sólo la presenta.
- No convertir cada regla en un documento nuevo. Si el roadmap/STATE ya trackea la fase actual, mantener la regla en la memoria viva y en el código.

## Guardrails De Complejidad

Estos guardrails aplican primero al diseño y después al cierre. No esperar a que Fallow marque el problema si la forma ya es previsible.

- Si un componente renderiza `empty`, `error`, `loading`, `results`, `pagination` y `rail`, partir render antes de commitear.
- Si un hook devuelve más de 15 campos/handlers, extraer navegación, estado derivado o acciones.
- Si un componente client admin acumula simulación, confirmación, ejecución, resultado y errores, extraer un hook local de operaciones y subcomponentes de secciones antes de commitear.
- Si un helper nuevo recibe `unknown`, lee campos dinámicos o convierte múltiples tipos, exigir tests focales o reemplazarlo por uso directo del contrato tipado.
- Si una función nueva acumula más de dos decisiones semánticas, partirla o convertir variantes en mapas constantes antes de correr checks.
- Si se copian `readSingle`, `readMulti`, `pick`, `setIf`, `setMulti`, usar `src/lib/search-params/query-params.ts`.
- Si se copian IDs/storage/transiciones de tabs, usar `src/lib/search-tabs/`.
- Si dos ramas `idle/error/success` duplican markup de error o resultado, extraer renderers compartidos antes de aceptar el corte.
- Si una sección read-only acumula badges, listas, evidencia y acción sugerida, extraer subcomponentes aunque no tenga estado client.
- Si un builder de chips mezcla labels, facets y JSX, separar builder puro y render.
- No dejar un archivo nuevo o tocado como `critical` en Fallow health salvo justificación explícita.
- No dejar archivos nuevos con `crap_above>0` salvo excepción explícita y temporal documentada en `STATE.md`.
- `pnpm fallow:audit` no alcanza: medir el área tocada con `pnpm exec fallow --format compact health | rg "<feature|archivo>"`.

## Reglas Aprendidas Transferibles

Aplicar estas reglas al construir o rediseñar buscadores para no reintroducir la deuda ya eliminada:

- Result cards: definir un view model antes del JSX. Metadata, resumen, clasificadores y acciones oficiales deben derivarse fuera del componente principal.
- Filtros avanzados: usar specs declarativas de campos desde el inicio. Incluir key, label, tipo de control, normalización y regla de contador activo; evitar cadenas largas de `if`/`OR`.
- Query params: ordenar parse/build por familias (`text`, `multi`, defaults omitidos, paginación, path canónico). Compartir sólo helpers mecánicos; no mezclar semántica RAULI, RN y SAIJ.
- Shells client: no concentrar estados complejos. Separar header, tabs, search surface, content state, results, pagination y rail antes de cerrar el corte.
- Acciones oficiales: separar derivación de acciones visibles, apertura/enlace oficial, proxy PDF/backend y render de botones. El frontend no debe inventar URLs oficiales salvo helper documentado.
- Índices propios: primero persistencia, upsert, ingesta admin y extractos DB; luego feed indexado; recién después captura pasiva y backfill. Si se invierte el orden, la metadata crece pero la capa editorial queda partida.
- Captura pasiva: guardar sólo resultados ya normalizados, hash estable de consulta/filtros, corpus, estado de cache, total y relación consulta-documento. No guardar IP completa, headers completos, HTML crudo ni datos personales innecesarios.
- Feed indexado: crear endpoint paralelo (`/indice/...`) antes de reemplazar el endpoint vivo. Mantener fallback oficial explícito hasta tener masa real.
- Extractos editoriales: migrar manuales hardcodeados a DB con seed idempotente y estados (`pendiente`, `manual`, `generado`, `revisado`, `rechazado`). No publicar generados con alerta sin revisión.
- Paneles admin de índices: el orden seguro observado fue snapshot/corridas/auditoría/cola operativa, luego panel read-only, luego plan/preflight, luego simulación, y recién después ejecución real limitada con confirmación y trazabilidad.
- Health Fallow: no cerrar una feature nueva si el archivo principal queda listado como `high-complexity`, aunque `fallow:audit` pase por modo incremental.
- Health Fallow preventivo: NO estimar la ciclomática mentalmente (diverge del conteo sintáctico de Fallow). Correr health focal real por archivo nuevo antes de seguir (ver "Cómo Cuenta Fallow" y "Medir Por Archivo"). Un helper "prolijo" pero genérico suele ser peor que código directo si agrega ramas no cubiertas.
- Deuda remanente: al cerrar una tanda, clasificar explícitamente lo que queda como bloqueante para UX, refactor útil pero postergable, o deuda aceptable/falso positivo.

## Cortes, Commits Y Autoauditoría

Para avances grandes de código, trabajar en cortes chicos y commiteables:

- Un commit documental/plan si se crea o corrige arquitectura.
- Un commit por capacidad runtime: schema/upsert, ingesta, extractos, feed, captura, reportes, backfill.
- No mezclar frontend y backend en el mismo commit salvo contrato cruzado inevitable.
- Después de cada corte: correr checks focales, revisar `git diff --stat`, actualizar `STATE.md` y `CODEBASE-MAP.md`, commitear.
- Cada 2-3 cortes: hacer una auditoría de rumbo. Preguntar si el siguiente paso sigue el orden del plan o si conviene reordenar para bajar riesgo.
- Antes de backfill o cambios que generan mucha data: correr checks completos y dejar explícitos límites, flags y plan de rollback.

Checklist de autoauditoría:

- ¿La nueva lógica quedó en el módulo correcto?
- ¿Hay una forma de apagarla por config si afecta producción?
- ¿El endpoint admin está protegido?
- ¿El endpoint público nuevo no rompe consumidores existentes?
- ¿Hay dry-run o modo lectura antes de mutar mucha data?
- ¿La operación es idempotente?
- ¿Los errores internos no se filtran al usuario?
- ¿La memoria `.planning/` refleja estado real y próximos pasos?

## Contrato Público

- No cambiar URLs públicas sin plan de migración.
- No romper `sessionStorage` existente sin normalización defensiva.
- No cambiar shape pública de hooks/componentes salvo que se actualicen todos los consumidores.
- No inventar URLs oficiales en frontend; usar backend o enlaces oficiales estables.
- No crear contrato paralelo por provincia si el contrato común V1 alcanza.
- Para reemplazar un flujo vivo por índice propio, crear primero endpoint paralelo, smoke real, flag/fallback y recién después migrar consumidores.

## Checks Recomendados

Para cortes chicos frontend:

```bash
pnpm typecheck && pnpm lint && pnpm fallow:audit
```

Para paneles admin o componentes operativos nuevos, sumar health focal del área tocada:

```bash
pnpm exec fallow --format compact health | rg "<admin-feature|api-client|actions>"
```

Para buscadores, navegación, tabs, query params o contrato visible:

```bash
pnpm release:check
pnpm exec fallow --format compact dead-code
pnpm exec fallow --format compact dupes
pnpm exec fallow --format compact health | sed -n '1,120p'
```

Si hay stack local disponible, sumar `pnpm test:smoke`.

Para cortes backend de índice/API:

```bash
ruff check app tests
pytest tests/ -v
```

Para cortes focales de índice RN, antes del completo:

```bash
ruff check app/jurisprudencia/rio_negro_index tests/test_rio_negro_index.py app/main.py
PYTHONPYCACHEPREFIX=/tmp/itera-lex-tools-pycache ./.venv/bin/pytest tests/test_rio_negro_index.py -v -p no:cacheprovider
```

## Criterio De Cierre

- La feature queda funcional con la misma superficie pública esperada.
- `release:check` pasa cuando el cambio toca rutas, navegación, tabs, filtros o API client.
- Fallow no introduce dead code ni duplicación nueva.
- Los archivos principales del feature no quedan como `high-complexity` y deberían cerrar con `crap_above=0`; cualquier excepción se documenta en `STATE.md`.
- `STATE.md` y `CODEBASE-MAP.md` se actualizan si se agregan rutas, componentes importantes, hooks, utils o contratos.
- Si se indexa mucha data, quedan documentados límites, flags, estado admin y próximo smoke real.
