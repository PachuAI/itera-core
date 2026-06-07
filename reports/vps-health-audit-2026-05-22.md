# VPS Health Audit — 2026-05-22

- **VPS**: `itera-modern` (`65.108.148.79`) — Hetzner CX32, Ubuntu 24.04.3 LTS
- **Stack**: Coolify v4.0.0, Docker 27.0.3, Traefik v3.6, 13 apps + 8 DBs gestionadas
- **Auditor**: Claude Code (read-only, sin cambios destructivos)
- **Handoff previo**: `itera-lex-tools/egress/docs/vps-health-handoff-2026-05-22.md`

---

## Executive Summary

El VPS está operativo y la API ÍTERA Lex Tools quedó healthy con el deploy `17263f8` (release de hoy, post-handoff). Smokes públicos OK: `api.iteralex.com/health=200`, `herramientas.iteralex.com=200`, `app.iteralex.com=307` (redirect normal), tunnel egress `200` desde host y desde contenedor API, ciclo cache SAIJ `live→cached` validado contra `itera-lex-tools-postgresql` (UUID `cvc8gi5ws0c5gff9r574gy0g`, 8 filas en `search_cache`, DB ~7.8MB).

Pero el host arrastra dos problemas serios que requieren ventana de mantenimiento. **Hallazgo P0**: el contenedor `itera-modern-mysql-databases` (`mysql:8`) está publicando `0.0.0.0:3306` con DNAT directo a la red Docker; UFW no protege ese puerto porque `DOCKER-USER` es pass-through (`RETURN` total). MySQL acepta `root@%`, `mysql@%` y `sistema_juridico_db_user@%`, sin restricción por host. **P1**: el kernel activo es `6.8.0-71` y hay 46 versiones de kernel acumuladas hasta `6.8.0-117`; el VPS tiene 106 días de uptime, 54 updates pendientes y `/var/run/reboot-required` activo. **P1**: 430 zombies (429 cosechables vía restart de Shopear, 1 vía Presskit-AR). **P1**: SSHD con `PermitRootLogin yes` + `PasswordAuthentication yes` (mitigado por `fail2ban` activo desde abril, pero 143 intentos fallidos/h).

Confirmaciones positivas: Docker limpio (28 running, 0 unhealthy, 0 exited, 0 restarting), fail2ban activo, unattended-upgrades activo, 50GB libres de disco (32% uso), tunnel egress `10.0.1.1:18767` correctamente aislado en bridge `coolify` con UFW restringido a `10.0.1.0/24`.

Recomendación: agendar ventana corta esta semana para (1) restringir MySQL 3306 a localhost o eliminar publicación, (2) `apt full-upgrade` + reboot, (3) cosechar zombies con restart controlado de Shopear y Presskit-AR.

---

## Severity Matrix

| # | Sev | Titulo | Area | Requiere ventana | Requiere confirmacion |
|---|-----|--------|------|------------------|----------------------|
| 1 | **P0** | MySQL `3306/tcp` publicado a internet via Docker bypass de UFW | Networking / DB | NO (solo cambio de portbinding) | SI |
| 2 | **P1** | Kernel 46 versiones atrasado + reboot pendiente + 106d uptime | OS | SI | SI |
| 3 | **P1** | 430 zombies — 429 de Shopear (`t1ect6gnjp8068ccu7lah6n8`), 1 de Presskit-AR (`w65hufobtzbem2fjxp9jpdyg`) | Processes | NO (restart por app) | SI |
| 4 | **P1** | SSH con root + password auth habilitados; 143 intentos brute/h | SSH | NO | SI |
| 5 | **P2** | 54 updates pendientes incl. mayor de Docker (27→29) | Packages | SI (ventana) | SI |
| 6 | **P2** | Swap a 61% (2.4G/4G), mysqld con 1.5GB swapped | Memory | NO (resuelve con reboot/restart) | NO |
| 7 | **P2** | `rsyslogd` action `omfile` flappeando suspended/resumed | Logging | NO | NO |
| 8 | **P2** | Docker engine major bump 27.0.3 → 29.5.2 | Docker | SI | SI |
| 9 | **P2** | Endpoint `/jurisprudencia/neuquen/rauli/buscar` devuelve 404 (otros endpoints Neuquén OK) | API Tools | NO | SI |
| 10 | **P3** | Coolify panel `:8000/tcp` publicado al mundo (sin TLS propio) | Coolify | NO | NO |
| 11 | **P3** | `coolify` (3 weeks uptime) y `dockerd` (Feb 4) corren con valor altos de NET I/O; sin restart desde inicio | Coolify | NO | NO |
| 12 | **P3** | API Tools tag `17263f8` recien deployado pero docker images conserva 5 tags previos del mismo repo | Docker | NO | NO |

---

## Findings

### F1 — P0 — MySQL 3306 expuesto a internet (Docker bypass de UFW)

**Evidencia:**

```text
docker ps -> fow0gsgw4cgksogc40ogsg4o (mysql:8)
            0.0.0.0:3306->3306/tcp, :::3306->3306/tcp

iptables -L DOCKER-USER -n -v
  Chain DOCKER-USER (1 references)
  1042M pkts 437G bytes RETURN 0.0.0.0/0 0.0.0.0/0     # <- pass-through

iptables -t nat -L DOCKER -n -v | grep 3306
  33854 pkts 1923K bytes DNAT tcp dpt:3306 to:10.0.1.7:3306

ufw status verbose -> 3306 NO esta en la allow list (22, 80, 443, 8000 si)

mysql.user (MySQL container):
  root @ %
  mysql @ %
  sistema_juridico_db_user @ %
  + tres cuentas mysql.* solo en localhost
```

**Riesgo:**
- `0.0.0.0:3306` está accesible públicamente: Docker inserta DNAT en `nat:PREROUTING` que se ejecuta antes que el filtro `INPUT` donde UFW aplica, y `DOCKER-USER` (chain pensada para overrides de UFW+Docker) está en pass-through total.
- MySQL admite `root@%` con password sin restricción de host. Único factor protector es la fortaleza del password.
- Esta DB MySQL es compartida (la dual contexto: contexto Static la usa via `phpmyadmin`; el contexto Modern tiene este contenedor con tres bases legacy del `sistema-gestion-juridico-rer`).

**Acción recomendada (no ejecutada):**
1. Cambiar el port-binding del recurso `itera-modern-mysql-databases` en Coolify a **no público** (o atar a `127.0.0.1:3306`). El UUID del recurso es `fow0gsgw4cgksogc40ogsg4o`.
2. Si requieren acceso desde host puntual: dejar binding `127.0.0.1:3306` y conectar via `ssh -L` desde la PC local (mismo patrón que `db-via-tunnel.md`).
3. Como defensa-en-profundidad adicional (no sustituye al cambio anterior): editar `/etc/ufw/after.rules` para meter DROP de 3306 en `ufw-user-forward`, o configurar `DOCKER-USER` con reglas explícitas. Documentar en `itera-claude-system/guides/`.
4. Mientras tanto, confirmar que el password de `root@%` es fuerte (no inspeccionado en esta auditoría) y rotarlo si quedó algo legacy.

**Confirmación previa requerida:** ¿el endpoint expuesto se usa hoy desde fuera del VPS? Si no, restringir a localhost no rompe nada.

---

### F2 — P1 — Kernel 46 versiones atrasado + reboot pendiente

**Evidencia:**

```text
uptime -> up 106 days, 20:50
uname -r -> 6.8.0-71-generic   # corriendo
dpkg -l linux-image-*:
  6.8.0-71  (instalado, en uso)
  6.8.0-117 (instalado, requiere reboot para activarse)

/var/run/reboot-required -> "*** System restart required ***"
/var/run/reboot-required.pkgs -> libc6, linux-image-94..117, linux-base
apt list --upgradable | wc -l -> 54
```

**Riesgo:**
- El host corre kernel viejo: vulnerabilidades CVE acumuladas 4+ meses, libc desactualizada.
- Reboot no planificado deja servicios systemd y tunnels sin smoke; ya hay un servicio user `pachu` con `Linger=yes` y `itera-egress-tunnel.service` que necesita validación tras reboot.
- 106 días sin reboot = riesgo creciente de "drift" de estado en memoria.

**Acción recomendada:**
- Ventana de ~15-25min. Plan completo en sección "Maintenance Window Plan" abajo.

---

### F3 — P1 — 430 zombies (concentrados en 2 containers)

**Evidencia:**

```text
ps -eo stat | awk '$1~/Z/{n++} END{print n}' -> 430

grouped by PPID:
  429 ppid=1799305
    1 ppid=1014573

ps -p 1799305 -> next-server (v ...) etime=17-03:20:22 user=1001
  cgroup: /system.slice/docker-da83e0615ca1...
  container: /t1ect6gnjp8068ccu7lah6n8-001518054873   <- Shopear (shope.ar)
  started 2026-05-05 03:23 UTC, uptime ~17 dias

ps -p 1014573 -> next-server (v ...) etime=36-10:30:41
  cgroup: /system.slice/docker-6df5a7e38252...
  container: /w65hufobtzbem2fjxp9jpdyg-170526645349  <- presskit-ar
  started 2026-04-15 17:13 UTC, uptime ~36 dias

zombie children: TODOS son procesos `ssl_client` (BusyBox de Alpine).
```

**Diagnostico:**
- El binario `ssl_client` viene del paquete `busybox` de Alpine y se ejecuta cuando `wget` BusyBox (no `wget` GNU) hace una request HTTPS dentro del contenedor Next.js. Cada llamada deja un proceso hijo que el proceso `next-server` no reapropia (no hace `waitpid()` ni tiene un `init` PID 1 que coseche).
- El ratio brutal (429 vs 1) sugiere que **Shopear ejecuta un script periódico** (probable healthcheck, cron-in-container, build-time fetch, o algún `next/image` con remote loader) que dispara `wget` HTTPS por minuto / hora.
- Presskit-AR tiene la misma fuente pero con frecuencia mucho menor.
- No es bloqueante todavía (Linux corta a 32k procesos por usuario), pero crece monotónicamente.

**Acción recomendada:**
1. **Cosechar inmediato sin riesgo de producción**: `docker restart t1ect6gnjp8068ccu7lah6n8-001518054873` (Shopear) y `docker restart w65hufobtzbem2fjxp9jpdyg-170526645349` (presskit-ar). Reboot completo del VPS también los cosecha.
2. **Causa raíz (Shopear, prioritario)**: revisar `t1ect6gnjp8068ccu7lah6n8` Dockerfile/Entrypoint:
   - ¿Está corriendo el server con `node` directo (PID 1 no cosecha)? Usar `--init` en Coolify o `dumb-init`/`tini` como entrypoint.
   - Buscar healthchecks que disparen `wget` o cron-in-container que llame URLs HTTPS.
   - Reemplazar BusyBox `wget` por `curl` (binario distinto, no usa `ssl_client`).
3. Documentar la causa identificada en `shopear` CLAUDE.md como guardrail.

**Confirmación previa requerida:** Restart de Shopear interrumpe servicio ~5-15s. ¿OK ejecutar fuera de ventana, o aprovechar la ventana de update/reboot?

---

### F4 — P1 — SSH expuesto con root + password auth

**Evidencia:**

```text
sshd -T:
  port 22                          # IPv4 0.0.0.0 + IPv6 :: ambos
  permitrootlogin yes
  passwordauthentication yes
  pubkeyauthentication yes
  x11forwarding yes
  allowtcpforwarding yes
  gatewayports clientspecified     # OK, requerido por egress tunnel
  clientaliveinterval 0            # sin keepalive

journalctl _COMM=sshd "1 hour ago" | failed_attempts -> 143
Top atacantes 24h:
  136 attempts from 103.219.170.37
   48 from 93.123.109.114
   37 from 85.215.175.242
   34 from 45.148.10.121

fail2ban.service: active (running) since 2026-04-23 (~4 semanas)
```

**Riesgo:**
- `fail2ban` mitiga la fuerza bruta, pero la superficie sigue siendo grande: root login + password auth + IPs sin restricción.
- Una rotación de claves del operador no quita el riesgo de un password débil de root.

**Acción recomendada (no ejecutada, requiere confirmación):**
1. Verificar que tu `~/.ssh/authorized_keys` en el VPS funciona desde ambas máquinas (desktop + notebook) sin pedirte password.
2. Setear `PasswordAuthentication no` en `/etc/ssh/sshd_config` (o drop-in en `/etc/ssh/sshd_config.d/`) y `systemctl reload ssh`. **Probar en sesión paralela antes de cerrar la actual.**
3. Setear `ClientAliveInterval 60` + `ClientAliveCountMax 3` para liberar tunnels muertos.
4. Considerar `PermitRootLogin prohibit-password` (mantiene root via key, bloquea root via password). No cambiar a `no` mientras el tunnel egress autentique como root.
5. Auditar `fail2ban-client status sshd` y subir `bantime` si está corto (no auditado aquí).

**Confirmación previa requerida:** que estés OK con pubkey-only y que tengas backup de la key en ambas máquinas.

---

### F5 — P2 — 54 updates pendientes (incluye mayor de Docker)

**Evidencia:**

```text
apt list --upgradable | wc -l -> 54

Notables:
  containerd.io   2.2.1 -> 2.2.4
  docker-buildx-plugin 0.31.1 -> 0.34.0
  docker-ce       5:27.0.3 -> 5:29.5.2     <- MAJOR bump (27 -> 29)
  docker-ce-cli   5:27.0.3 -> 5:29.5.2
  docker-ce-rootless-extras 5:27.0.3 -> 5:29.5.2
  docker-compose-plugin 5.0.2 -> 5.1.4
  libc6, libsystemd*, libapparmor1
  linux-base, initramfs-tools-*
  iproute2, libldap2, libgnutls30t64, ssl-cert/openssl
```

**Riesgo:**
- Docker mayor 27→29: posibles breaking changes en API/CLI. Revisar release notes (`docker/docker`) antes de aplicar.
- Library updates (libc6, libsystemd, openssl) son las que disparan `reboot-required`.

**Acción recomendada:** aplicar en ventana, con backup/snapshot previo (ver plan abajo).

---

### F6 — P2 — Swap 61%, mysqld con 1.5GB swapped

**Evidencia:**

```text
free -h:
  Mem:  7.6Gi total, 3.5Gi used, 842Mi free, 187Mi shared, 3.7Gi buff/cache, 4.1Gi available
  Swap: 4.0Gi total, 2.4Gi used, 1.6Gi free

vm.swappiness = 10  (OK, conservador)

Top swap por PID:
  1497720 kB  PID=1009958  mysqld           # 1.5 GB
   119328 kB  PID=346709   next-server
    60156 kB  PID=959650   next-server
    54288 kB  PID=1799305  next-server      # Shopear (el zombie parent)
    40208 kB  PID=1461305  next-server
    39836 kB  PID=18201    dockerd
    39024 kB  PID=214205   next-server
    38400 kB  PID=1091944  postgres
    38400 kB  PID=1091943  postgres
    38400 kB  PID=1091937  postgres

docker stats: mysqld container memoria activa 117 MiB (RSS), el resto esta en swap
```

**Diagnostico:**
- El uso de swap es histórico (carga acumulada desde reboot hace 106 días) y no operativo (la memoria RSS actual cabe holgada en 4.1 GB available).
- `mysqld` swapeado 1.5 GB sugiere que en algún momento hubo presión de memoria y MySQL fue empujado a swap; ahora ya no se reactiva porque es legacy con poco tráfico.

**Acción recomendada:**
- Reboot resuelve sin intervención.
- Post-reboot, evaluar tunear `innodb_buffer_pool_size` del recurso `itera-modern-mysql-databases` si lo seguís usando (legacy `sistema-gestion-juridico-rer`).

---

### F7 — P2 — rsyslogd `omfile` flappeando

**Evidencia:**

```text
journalctl -p warning --since "24h ago" top patterns:
  21156x  rsyslogd: action 'action-0-builtin:omfile' suspended ... retry N
   2046x  rsyslogd: action ... next retry is ...
     ... y multiples "resumed"

systemctl status rsyslog -> active (running) since 2026-04-23
```

**Diagnostico:**
- `action-0-builtin:omfile` es la salida típica a `/var/log/syslog`. La suspensión/recuperación constante implica que el archivo destino se está marcando temporalmente inescribible (rotación agresiva, permisos, inotify, o disco lleno momentáneo).
- `/var/log` está en `/` con 50GB libres → no es problema de disco.
- Hipótesis: logrotate o algún script renombra/rota el archivo más rápido de lo que rsyslog reopen.

**Acción recomendada:**
- No bloqueante. Investigar postergable: `journalctl -u rsyslog --since "7 days ago" | grep -v resumed | grep -v suspended | head -50` para encontrar el primer error real.
- Considerar deshabilitar `rsyslog` y usar solo `journald` si nada lo necesita (Coolify lee de Docker logs, no de syslog).

---

### F8 — P2 — Docker engine major bump (27 → 29)

**Evidencia:** (incluido en F5)

**Riesgo:**
- En major bump puede cambiar formato de logs, default storage driver, comportamiento de `--init`, semántica de healthchecks o iptables chains.
- Coolify v4.0.0 es estable con Docker 27.x; probar Docker 29.x en pre-prod no es opción aquí.

**Acción recomendada:**
- Antes del upgrade leer release notes de Docker 28 y 29.
- Snapshot de Hetzner antes del bump.
- Validar Coolify post-upgrade (ver Post-Reboot Checklist).
- Fallback: pinear `docker-ce=5:27.0.3...` en `apt-mark hold` si no estamos listos para 29.x.

---

### F9 — P2 — `/jurisprudencia/neuquen/rauli/buscar` devuelve 404

**Evidencia:**

```text
curl -m 12 https://api.iteralex.com/jurisprudencia/buscar?q=test&limit=1               -> 200
curl -m 12 https://api.iteralex.com/jurisprudencia/neuquen/rauli/buscar?q=test&limit=1 -> 404
curl -m 12 https://api.iteralex.com/jurisprudencia/rio-negro/buscar?q=test&limit=1     -> 200
```

**Riesgo:**
- Inconsistente con el handoff previo que reporta "RAULI público: 200". O cambió el path en el último deploy `17263f8`, o el path correcto es distinto al asumido.
- Si lo consume el frontend, podría romper la vista de Neuquén.

**Acción recomendada:**
1. Verificar en `api/app/jurisprudencia/neuquen_router.py` el path real de `buscar`.
2. Si cambió: actualizar `web/src/lib/api/itera-api.ts` y el handoff.
3. Si es path correcto y devuelve 404 por params requeridos, ajustar el smoke en `egress/scripts/smoke_production.sh`.

---

### F10 — P3 — Coolify panel `:8000/tcp` público sin TLS propio

**Evidencia:**

```text
ufw -> 8000/tcp ALLOW IN Anywhere
docker-proxy -> 0.0.0.0:8000 mapeado a 10.0.1.5:8080 (coolify container)

curl http://65.108.148.79:8000/        # accesible plano (sin TLS)
curl https://coolify-modern.itera.world # acceso via Traefik con TLS
```

**Riesgo:**
- El panel se sirve también en HTTP plano por `:8000`. Aunque Coolify requiere login, no hay TLS en esa ruta → posible MITM de sesión si alguien lo usa por IP.
- El acceso por CLI funciona vía 8000 (token Bearer), por lo que cerrar UFW 8000 rompería `coolify` CLI.

**Acción recomendada (post-ventana):**
- Setear el container Coolify para escuchar solo en localhost o exigir TLS también en `:8000`.
- Alternativa baja fricción: configurar `coolify context use modern-linux-desktop` con `fqdn` HTTPS si el CLI lo soporta (revisar `coolify-modern.itera.world:443`).

---

### F11 — P3 — `dockerd` y `coolify` con mucha NET I/O acumulado

**Evidencia:**

```text
docker stats coolify -> NET I/O: 27GB / 32GB (3 weeks)
docker stats coolify-redis -> 29GB / 11.4GB (3 weeks)
docker stats coolify-proxy -> 28GB / 25GB (3 months)

dockerd CPU TIME = 7128:38 (Feb 4 start)
```

**Diagnostico:**
- Volumen normal para un host con varios apps; sin anomalías evidentes.
- Lo dejo como nota informativa: el Coolify realtime/Soketi tiene NET I/O notable; útil para baseline futuro.

---

### F12 — P3 — Imágenes Docker viejas del repo API Tools

**Evidencia:**

```text
docker images:
  d0osocwkwc8gkcw88gww4ck4: 6 tags distintos (17263f8 actual + 5 anteriores)
  rmfj4cm2d1e328s34f0f09eh: 2 tags
  r40kockgo40wowg4w84soc4s: 2 tags
  k119747l80uslvruti9h3kxm: 2 tags

docker system df:
  Images TOTAL=36 ACTIVE=25 SIZE=9.368GB RECLAIMABLE=1.818GB (19%)
  Build Cache TOTAL=39 ACTIVE=0 SIZE=18.92MB RECLAIMABLE=18.92MB
```

**Riesgo:** ninguno; queda como housekeeping.

**Acción recomendada (post-ventana, opcional):** `docker image prune --filter "until=240h"` (libera ~1.8GB sin tocar nada activo). **No** ejecutar `docker system prune -a` (eliminaría imágenes etiquetadas no activas → rebuilds caros si Coolify quiere rollback).

---

## Immediate Safe Actions

Acciones de bajo riesgo que se pueden ejecutar **fuera** de ventana de mantenimiento. No las ejecuté; las dejo listadas para que apruebes una por una.

| # | Accion | Riesgo | Tiempo | Resultado esperado |
|---|--------|--------|--------|--------------------|
| A1 | `docker restart t1ect6gnjp8068ccu7lah6n8-001518054873` (Shopear) | ~10s de downtime de shope.ar | 30s | Cosecha los 429 zombies de Shopear |
| A2 | `docker restart w65hufobtzbem2fjxp9jpdyg-170526645349` (presskit-ar) | ~10s de downtime de presskit.ar | 30s | Cosecha el 1 zombie restante |
| A3 | Coolify UI: `itera-modern-mysql-databases` → setear "Is publicly available" = false (o portbinding `127.0.0.1:3306`), apply, redeploy del recurso | ~30s downtime de MySQL legacy; impacta `gestion.rerestudiojuridico.com` y `phpmyadmin` | 2-3min | MySQL deja de aceptar conexiones desde internet |
| A4 | Investigar fail2ban: `fail2ban-client status sshd` y subir bantime si es bajo | nulo | 5min | Mejora resiliencia SSH |
| A5 | Verificar el endpoint RAULI buscar correcto en `api/app/jurisprudencia/neuquen_router.py` y actualizar smokes | nulo | 10min | Smoke production fix |
| A6 | `docker image prune --filter "until=240h"` | nulo (no toca activas) | 1min | ~1.8GB recuperados |

**No ejecutar A1/A2 antes de A3** si vas a hacer ventana corta: aprovechar la misma ventana cosecha todo de una.

---

## Maintenance Window Plan

Estimado total: 30-45 minutos con buffer. Necesita confirmación tuya para cada paso.

### Paso 0 — Pre-ventana (sin downtime, 5 min antes)

```bash
# Avisar en redes/clientes si aplica
# Confirmar acceso a la consola web de Hetzner (rescate KVM si algo se rompe)
# Snapshot Hetzner del VPS via panel web (no via CLI, ~3-5min)
```

### Paso 1 — Cerrar exposición MySQL (P0, primero, antes que cualquier cosa)

```bash
# Via Coolify UI, en el recurso fow0gsgw4cgksogc40ogsg4o:
#   - Networks > Public Port Forwarding: OFF
#   - Save -> Redeploy del recurso (no del proyecto entero)
# Validar:
ssh root@65.108.148.79 'ss -ltnp | grep 3306 || echo "OK: 3306 no listening on 0.0.0.0"'
# Validar que phpmyadmin y gestion.rerestudiojuridico.com siguen funcionando (acceden via red docker, no via 0.0.0.0)
```

### Paso 2 — Apt full upgrade (10-15 min)

```bash
ssh root@65.108.148.79 '
  apt update
  apt list --upgradable 2>/dev/null | wc -l       # confirmar count
  DEBIAN_FRONTEND=noninteractive apt -y full-upgrade
  apt -y autoremove
  echo "--- post upgrade ---"
  cat /var/run/reboot-required.pkgs 2>/dev/null
'
```

### Paso 3 — Cosechar zombies opcional (no necesario si vamos a reboot)

Skippeable: el reboot cosecha todo. Solo ejecutar si querés posponer reboot.

### Paso 4 — Reboot

```bash
ssh root@65.108.148.79 'systemctl reboot'
# esperar 60-90s
sleep 90
ssh root@65.108.148.79 'uptime; uname -r'
# debe decir uptime nuevo y kernel 6.8.0-117
```

### Paso 5 — Post-reboot smoke (ver checklist abajo)

### Paso 6 — Limpieza housekeeping (opcional)

```bash
ssh root@65.108.148.79 'docker image prune --filter "until=240h" -f'
ssh root@65.108.148.79 'journalctl --vacuum-time=14d'
```

---

## Post-Reboot Checklist

Comandos exactos para validar después del reboot. Correr en orden.

### A. Host

```bash
ssh root@65.108.148.79 '
  echo "=== UPTIME ==="; uptime
  echo "=== KERNEL ==="; uname -r          # esperado: 6.8.0-117-generic o superior
  echo "=== REBOOT REQUIRED ==="; test -f /var/run/reboot-required && echo PENDING || echo OK
  echo "=== ZOMBIES ==="; ps -eo stat | awk "\$1~/Z/{n++} END{print n+0}"   # esperado: 0
  echo "=== SWAP ==="; free -h | grep Swap
  echo "=== DISK ==="; df -h / | tail -1
'
```

### B. Docker / Coolify

```bash
ssh root@65.108.148.79 '
  echo "=== DOCKER VERSION ==="; docker version --format "{{.Server.Version}}"   # 27.0.3 o 29.5.2 segun decision
  echo "=== COUNT UP ==="; docker ps --format "{{.Status}}" | grep -c "^Up"     # esperado: 28 (o ajustado si hay cambios)
  echo "=== UNHEALTHY ==="; docker ps -a --filter health=unhealthy --format "{{.Names}}"
  echo "=== RESTARTING ==="; docker ps -a --filter status=restarting --format "{{.Names}}"
  echo "=== COOLIFY ==="; docker inspect coolify --format "{{.State.Status}} health={{.State.Health.Status}}"
  echo "=== TRAEFIK ==="; docker inspect coolify-proxy --format "{{.State.Status}} health={{.State.Health.Status}}"
'
```

### C. ÍTERA Lex Tools

```bash
ssh root@65.108.148.79 '
  api_cid=$(docker ps --filter name=d0osocwkwc8gkcw88gww4ck4 --format "{{.ID}}" | head -1)
  echo "api cid: $api_cid"
  docker inspect "$api_cid" --format "{{.State.Status}} health={{.State.Health.Status}}"
  docker exec "$api_cid" sh -lc "curl -sS -o /dev/null -w \"tunnel %{http_code}\n\" http://10.0.1.1:18767/health"
  docker exec "$api_cid" sh -lc "python -c \"from app.config import settings; print(bool(settings.JURIS_DATABASE_URL))\""  # True
'
echo "=== PUBLIC SMOKES ==="
curl -sS -o /dev/null -w "api.iteralex.com %{http_code}\n" https://api.iteralex.com/health
curl -sS -o /dev/null -w "herramientas %{http_code}\n"   https://herramientas.iteralex.com
curl -sS -o /dev/null -w "app.iteralex %{http_code}\n"   https://app.iteralex.com
echo "=== CACHE SMOKE ==="
Q="post-reboot-$(date +%s)"
curl -sS -G --data-urlencode "q=$Q" --data-urlencode "limit=1" https://api.iteralex.com/jurisprudencia/buscar | python3 -c 'import json,sys; print("1st:",json.load(sys.stdin).get("cache"))'
curl -sS -G --data-urlencode "q=$Q" --data-urlencode "limit=1" https://api.iteralex.com/jurisprudencia/buscar | python3 -c 'import json,sys; print("2nd:",json.load(sys.stdin).get("cache"))'
```

### D. Tools DB

```bash
ssh root@65.108.148.79 '
  db_cid=$(docker ps --filter name=cvc8gi5ws0c5gff9r574gy0g --format "{{.ID}}" | head -1)
  docker exec "$db_cid" sh -lc "psql -U itera_lex_tools -d itera_lex_tools -tAc \"SELECT \\\"search_cache\\\", count(*) FROM search_cache UNION ALL SELECT \\\"resource_cache\\\", count(*) FROM resource_cache UNION ALL SELECT \\\"documents\\\", count(*) FROM documents;\""
'
```

### E. Egress tunnel (desde tu PC local)

```bash
systemctl --user status itera-egress-worker.service itera-egress-tunnel.service --no-pager
cd /home/pachu/projects/saas/iteralex/itera-lex-tools/egress
scripts/smoke_vps_tunnel.sh
scripts/smoke_production.sh
```

### F. MySQL ya no expuesto

```bash
# Desde la PC local (no desde el VPS):
nc -zv -w 5 65.108.148.79 3306 2>&1 | head -2    # esperado: refused / timeout
```

---

## Open Questions

1. **MySQL `root@%` password**: no inspeccioné el valor por seguridad. ¿Está rotado/strong, o quedó débil desde la migración del legacy cPanel? Si va a quedar expuesto temporalmente, rotar antes de la ventana.
2. **Shopear next-server zombie origin**: necesito mirar el Dockerfile/Entrypoint del repo Shopear (`t1ect6gnjp8068ccu7lah6n8`) para confirmar si falta `--init`/`tini`. Está fuera del scope de esta auditoría VPS-level.
3. **Docker 27→29 compat con Coolify v4.0.0**: ¿está validado por Coollabs? Por seguridad, sugiero `apt-mark hold docker-ce docker-ce-cli` antes del upgrade, hacer el resto, y bumpear Docker en otra ventana.
4. **fail2ban config**: no audité jails activas, bantime ni findtime. Worth a quick check.
5. **¿Hay snapshot/backup de Hetzner automático configurado?** No verifiqué. Si no, el primer paso de la ventana debería ser tomar uno manual.
6. **`presskit-ar` no aparece en Coolify CLI**: el handoff INFRA.md ya nota esto. Curioso: el contenedor está running y healthy, pero CLI no lo lista. Algún día revisar.

---

## Raw Evidence Appendix

### A1. OS / Memoria / Disco

```text
Distributor ID: Ubuntu
Description:    Ubuntu 24.04.3 LTS
Release:        24.04
Codename:       noble

Linux itera-modern 6.8.0-71-generic #71-Ubuntu SMP PREEMPT_DYNAMIC Tue Jul 22 16:52:38 UTC 2025 x86_64

uptime: 00:43:00 up 106 days, 20:50, load 1.53 1.05 0.95

Mem:  7.6Gi total, 3.5Gi used, 842Mi free, 187Mi shared, 3.7Gi buff/cache, 4.1Gi available
Swap: 4.0Gi total, 2.4Gi used, 1.6Gi free  (61% used)
vm.swappiness = 10

/dev/sda1   75G  23G  50G  32%  /
/dev/sda15  253M 146K 252M 1%   /boot/efi
inodes: 11% usado en /

/var/run/reboot-required: YES
  pkgs: libc6, linux-image-{94,100,101,106,107,110,111,117}, linux-base

apt list --upgradable | wc -l -> 54
```

### A2. Procesos

```text
ps -eo stat | zombies -> 430

Grouped by PPID:
  429  ppid=1799305
    1  ppid=1014573

PID 1799305:
  next-server (v ...) uptime=17-03:20
  container=/t1ect6gnjp8068ccu7lah6n8-001518054873 (Shopear)
  started=2026-05-05 03:23 UTC

PID 1014573:
  next-server (v ...) uptime=36-10:30
  container=/w65hufobtzbem2fjxp9jpdyg-170526645349 (presskit-ar)
  started=2026-04-15 17:13 UTC

Zombie comm pattern: 100% ssl_client (BusyBox Alpine)

Top MEM: dockerd 7.0%, next-server (lex) 3.3%, next-server (iteralex) 3.0%,
         containerd 2.9%, next-server (Shopear) 2.5%
Top CPU (instant): horizon:work php (alquimica origin?) 22.3%, dockerd 4.6%, containerd 2.7%
```

### A3. Docker

```text
docker ps -a | up -> 28
docker ps -a | unhealthy -> 0
docker ps -a | exited    -> 0
docker ps -a | restarting -> 0

docker system df:
  Images          36 total / 25 active / 9.368GB / reclaimable 1.818GB (19%)
  Containers      28 total / 28 active / 4.272GB / 0B
  Local Volumes   13 total / 13 active / 858.4MB / 0B
  Build Cache     39 total /  0 active / 18.92MB / 18.92MB

docker networks:
  bridge (default)
  coolify (br-9543db3b28c1)    <- bridge interno usado por todos los apps Coolify
  host
  n40844csgw4scww4ksgc40cw     <- bridge phpmyadmin
  none

du -sh /var/lib/docker/overlay2  -> 29G
du -sh /var/lib/docker/containers -> 142M
du -sh /var/lib/docker/volumes    -> 826M

docker version (server) -> 27.0.3   (upgrade pendiente a 29.5.2)
```

### A4. Networking

```text
Listening ports:
  10.0.1.1:18767  sshd      # egress tunnel, bridge-only
  0.0.0.0:22      sshd
  0.0.0.0:80      docker-proxy (Traefik)
  0.0.0.0:443     docker-proxy (Traefik)
  0.0.0.0:8000    docker-proxy (Coolify panel)
  0.0.0.0:8080    docker-proxy (Traefik dashboard, si habilitado)
  0.0.0.0:3306    docker-proxy (mysql:8)   <-- P0
  0.0.0.0:6001    docker-proxy (Soketi)
  0.0.0.0:6002    docker-proxy (Soketi)
  127.0.0.53:53   systemd-resolve

UFW rules:
  22, 80, 443, 8000  /tcp  ALLOW Anywhere (v4+v6)
  10.0.1.1 18767/tcp on br-9543db3b28c1  ALLOW from 10.0.1.0/24
  (3306 NO esta en allow list, pero pasa por Docker DNAT bypass)

iptables DOCKER-USER: 1042M pkts -> RETURN (pass-through)
iptables nat DOCKER: DNAT entries para 80, 443, 443/udp, 8080, 3306, 6001, 6002, 8000
  -> 3306 to 10.0.1.7:3306 (mysql:8)
```

### A5. SSHD effective

```text
port 22
listenaddress [::]:22, 0.0.0.0:22
permitrootlogin yes
passwordauthentication yes
pubkeyauthentication yes
x11forwarding yes
allowtcpforwarding yes
gatewayports clientspecified
clientaliveinterval 0
clientalivecountmax 3

journalctl _COMM=sshd "1h ago" | failed -> 143
24h top atackers IPs (sanitizado, primer octeto):
  136 from 103.xxx.xxx.37
   48 from 93.xxx.xxx.114
   37 from 85.xxx.xxx.242
   34 from 45.xxx.xxx.121

fail2ban.service: active running since 2026-04-23
```

### A6. Coolify inventario (modern context)

Apps (13): Abundancia Hogar, ITERA Estudio - App, ITERA LAT - Web, ITERA LEX Docs, **ITERA Lex Tools API** (`d0osocwkwc8gkcw88gww4ck4`, healthy), **ITERA Lex Tools Web** (`rmfj4cm2d1e328s34f0f09eh`, healthy), Linkea2, Racca Web, Shopear, iteralex, pachu.dev, presskit-ar, sistema-gestion-juridico-rer.

Databases (8, todas `is_public: false` según Coolify):
- `fow0gsgw4cgksogc40ogsg4o` itera-modern-mysql-databases mysql:8 (running:healthy, **pero portbinding 0.0.0.0:3306 en Docker → ver F1**)
- `jcsokwcw0ks08k8wwwk4wwc0` iteralex-db postgres:17 (healthy)
- `cvc8gi5ws0c5gff9r574gy0g` itera-lex-tools-postgresql postgres:17 (healthy, started 2026-05-22 03:20 UTC)
- `m84wg4kggsgksssg8k0wc000` ITERA Estudio - PG (healthy)
- `qvyp1mdigluu25eu1aekpsho` Abundancia Hogar - PG (healthy)
- `sbs5tj7872hl82u51niqbtp2` presskit-ar-db (healthy)
- `uxoszayiqygjp8rib3kdddvg` Shopear - PG (healthy, public_port configurado a 55432 pero no bound)
- `wn5vq32bwbgdpfkamb72ajce` Linkea2 - PG (healthy, public_port configurado a 5433 pero no bound)

### A7. Egress tunnel verificación

```text
ss -ltnp | grep 18767:
  LISTEN 10.0.1.1:18767  sshd pid=2903941

curl from host       http://10.0.1.1:18767/health -> 200, total=0.7s
curl from API container http://10.0.1.1:18767/health -> 200

API env (API container `9084633ecec5`, image tag `17263f8`):
  EGRESS_MODE=worker
  EGRESS_WORKER_BASE_URL=http://10.0.1.1:18767
  EGRESS_WORKER_TIMEOUT=20.0
  EGRESS_WORKER_TOKEN=SET (43 chars, no impreso)
  JURIS_DATABASE_URL=SET (123 chars, no impreso)
  ADMIN_TOKEN=SET (43 chars, no impreso)
  CORS_ORIGINS=https://app.iteralex.com,https://iteralex.com

Cache smoke:
  1st call (unique q): cache={status: live, fetched_at: None}
  2nd call (same q):   cache={status: cached, fetched_at: 2026-05-22T03:44:49Z}

Tools DB (itera_lex_tools):
  Tables: documents, resource_cache, search_cache
  Counts: search_cache=8, resource_cache=0, documents=3
  Size:   7806 kB
```

### A8. Servicios complementarios

```text
rsyslog.service: active running since 2026-04-23
  -> action-0-builtin:omfile flap pattern: suspended+resumed cada ~minutos (no critico)

fail2ban.service: active running since 2026-04-23
  -> CPU acumulado 59min 56s; jails no inspeccionadas

unattended-upgrades.service: active running since 2026-02-04
  APT::Periodic::Update-Package-Lists "1"
  APT::Periodic::Unattended-Upgrade "1"
  -> Funciona, pero no toca kernel ni libc en Ubuntu por default; por eso updates apilan

journalctl --disk-usage -> 913.8M (sano)

net.ipv4.ip_forward = 1 (requerido por Docker)
```

---

## Cierre

Reporte generado por Claude (sesion read-only) el 2026-05-22.
Ninguna acción ejecutada: ningún proceso matado, ningún servicio reiniciado, ningún paquete instalado, ningún archivo de configuración modificado.

Próximo paso sugerido: revisar este reporte, decidir si se ejecuta la ventana esta semana, y confirmarme los pasos uno por uno antes de tocar el VPS.
