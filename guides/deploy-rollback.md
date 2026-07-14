# Rollback de deploy (Coolify)

> **Estado: validada en produccion** (2026-07-14). Se probo cancelacion, preset runtime off/API,
> revert Git sin force-push y deploy manual en Coolify 4.1.2 / CLI 1.6.2.

Qué hacer cuando un deploy dejó prod roto y hay que volver a la versión anterior YA. Los datos por repo (App UUID, contexto) viven en el CLAUDE.md del repo.

## Antes de nada: confirmar que es el deploy

30 segundos de `guides/prod-logs-debug.md`: si el error es una env var faltante o una migración de schema, el rollback de código NO lo arregla (y puede empeorarlo). Rollback aplica cuando el commit deployado es el problema.

## Camino canónico: revert + redeploy

Coolify buildea desde git → volver atrás = poner el código bueno en la branch que Coolify trackea y redeployar.

```bash
git log --oneline -5                  # identificar el commit malo
git revert <commit-malo> --no-edit    # o revert de un rango; NUNCA reset --hard + force push
git push
coolify deploy uuid <app-uuid>        # --force si quedó stuck
coolify deploy get <deployment-uuid> --format json
```

- Ventaja: historial limpio, el fix real después se aplica encima del revert.
- Con Next.js el rebuild tarda unos minutos — es el costo del camino seguro.

## Si la DB también cambió

Un revert de código NO revierte schema. Si el deploy malo incluyó DDL (carril `guides/db-schema-rollout.md`), ahí está el backup previo obligatorio de ese carril → evaluar restore (`guides/db-via-tunnel.md`, Procedimiento C) ANTES o junto con el revert, según si el código viejo puede convivir con el schema nuevo (columnas ADD suelen convivir; DROP/RENAME no).

## Cortar primero un runtime o canary riesgoso

Si el problema esta detras de un flag/runtime externo, el rollback mas rapido es deshabilitar el flag
del tenant y restaurar el preset documentado (`off` o `api`) antes del rebuild. No usar fallback
silencioso: el estado seguro debe ser explicito y verificable. Si hay riesgo de auth, exposicion o
costos, detener tambien el worker/runner privado y conservar DB/audit para diagnostico.

Luego verificar:

- ningun tenant no autorizado habilitado;
- flag del tenant en cero y filas del runtime en cero, leídos desde la DB o el control plane durable;
- app publica y container anterior saludables;
- imagen/commit realmente en ejecucion, no solo status cacheado del recurso;
- schema compatible (no intentar deshacer destructivamente tablas/enums en caliente).

Si se detuvo un runner Compose, `app stop` puede responder "queued" y conservar status
`running:healthy` durante varios segundos. Esperar que `docker ps` ya no muestre el container. Al
restaurar con `app start --instant-deploy`, observar el deployment hasta `finished`: un
`exited:unhealthy` intermedio puede ser metadata del periodo sin container, no un deploy fallido.
Reaplicar el egress IPv4+IPv6, validar auth/health y hacer smoke firmado antes de volver a habilitar
runtime/tenant.

Si existe un rollback automatizado, separar obligatoriamente dos caminos:

- `--check`: inventario read-only; no login que cree sesión, no Server Actions, no flags, no stop y
  ninguna contención desde el handler de error;
- apply: apagar primero flag/runtime por el control plane durable, detener el runner aun si una
  acción intermedia falla y verificar al final cero habilitados + runner fuera. Si son varios writes
  versionados, ante falla parcial releer el estado durable y reintentar una sola vez; no reutilizar
  versiones stale ni hacer un loop infinito.

No probar apply durante una observación para demostrar que está disponible: validar resolución de
env/DB/acciones con `--check` y apoyar el camino mutante en la prueba controlada registrada. Si un
check detuvo un servicio por error, restaurar, repetir health/auth/egress/smokes y reiniciar completa
la ventana; no descontar la interrupción.

## Si una credencial de Coolify apareció en la salida

`~/.config/coolify/config.json` contiene tokens reutilizables de todos los contextos. Nunca volcarlo
completo con `cat`, `sed`, un editor a stdout ni `set -x`. Una llamada directa debe extraer sólo el
contexto elegido con `jq`, guardar FQDN/token en variables de proceso y no imprimir token, header ni
payload sensible.

Si un token aparece en stdout/stderr, tratarlo como expuesto aunque la sesión sea privada:

1. detener el rollout sensible y aplicar el estado seguro del recurso (flag/runtime off; runner
   detenido si corresponde);
2. verificar cero tenants o servicios no autorizados activos;
3. preservar DB/audit para diagnóstico, sin copiar el valor expuesto a tickets o documentos;
4. rotar el token del contexto y actualizar las máquinas autorizadas;
5. validar la CLI con inventarios sin secretos antes de reanudar desde un nuevo preflight.

El default es no declarar GO antes de la rotación. En un entorno operado por una sola persona, el
operador puede aceptar explícitamente diferirla hasta el cierre para completar desarrollo o un canary
interno ya contenido. Registrar fecha/alcance, no ampliar tenants/servicios y mantener la rotación en
el checklist final.

## Cancelacion de un deploy en curso

```bash
coolify deploy cancel <deployment-uuid>
coolify deploy get <deployment-uuid> --format json
```

En Coolify 4.1.2 la cancelacion real puede quedar `cancelled` aunque la API/CLI termine en HTTP 500 con
`Undefined variable $application`. No lanzar otro deploy basandose solo en el exit code: consultar el
deployment, el helper y los containers. Del mismo modo, `app stop` puede quedar queued o con status
stale; verificar con Docker en el host.

## Evitar que el rollback se autodeploye antes de tiempo

Antes de pushear reverts que dependen de backup/DDL/config previa, desactivar auto-deploy y verificar
el setting reconsultando Coolify. Algunas respuestas de update muestran `null` aunque el valor haya
persistido. Despues:

1. aplicar backup/rollout autorizado;
2. push del revert acotado;
3. deploy manual unico;
4. validar commit efectivo, health y env del container;
5. reactivar auto-deploy solo si el runbook del proyecto lo exige.

## Alternativa rápida (no validada)

`coolify deploy uuid <app-uuid> --docker-tag <tag-anterior>` — redeployar una imagen ya buildeada, sin rebuild. Requiere que el registry conserve el tag anterior y saber cuál es. Probar en frío algún día; hasta entonces, el camino canónico es el revert.

## Guardrails

- NUNCA `git reset --hard` + force push como rollback en repos deployados — rompe el historial y el próximo deploy.
- Rollback ≠ fix: después del revert, el bug se arregla con calma y se deploya como commit nuevo.
- Si hay usuarios activos y el sitio está caído, el revert sale primero y las preguntas después; si está degradado pero usable, diagnóstico primero.
- No duplicar deploys durante capas largas. Si `docker build`/Buildx sigue activo y el container viejo
  atiende, esperar y observar memoria/swap/log timestamp.
- Si el executor corta con exit 255 despues de completar el build, verificar OOM, disco y Docker antes
  de tocar codigo. Un unico retry sin `--force` puede reutilizar cache; `--force` reconstruye sin cache.
