# QA con Chrome: perfiles aislados por `--user-data-dir` (Linux)

> Método canónico para correr QA manual de los SaaS ITERA con cuentas/tenants **totalmente aislados** en Google Chrome — cada uno como app de primera clase en la barra (icono propio, ventana propia, sesión propia, sin mezcla de cookies).
>
> **Reemplaza el flujo de Firefox (`qa-firefox-multicuenta.md`) cuando la QA toca integraciones de Google: Drive, Google Picker, OAuth (Calendar/Gmail).** Para QA que no toca Google, cualquiera de los dos sirve; Chrome es el default nuevo por tener un solo flujo.

---

## Cuándo usar este carril

- **QA de cualquier feature que dispara OAuth de Google o el Google Picker / Drive.** En itera-lex: adjuntar archivos desde Drive, conectar Google Calendar. Firefox con Multi-Account Containers da fricción y a veces rompe el `postMessage` del Picker o pierde el popup de OAuth.
- **Multi-tenant / multi-cuenta**: necesitás 2+ sesiones simultáneas sin que se pisen las cookies (superadmin + estudio demo + abogado demo, varios tenants, etc).
- Querés que cada cuenta sea una **ventana/app separada** en la barra, sin hover ni dropdown.

No hace falta para: navegación rápida de una sola sesión (usá tu Chrome normal).

---

## El aislamiento real: `--user-data-dir`, NUNCA `--profile-directory`

Chrome tiene dos mecanismos que parecen lo mismo y **no lo son**:

| Flag | Qué hace | Sirve para QA aislada |
| --- | --- | --- |
| `--profile-directory="Profile 2"` | Un "perfil" **dentro** del mismo `User Data` global. Comparten proceso de browser y estado; Chrome puede colapsar ventanas y mezclar sesión. | ❌ NO |
| `--user-data-dir=<path>` | Un dir de datos **completamente separado**: cookies, localStorage, IndexedDB, service workers, extensiones, tokens OAuth. Es un Chrome paralelo, proceso propio. | ✅ SÍ |

**Regla: siempre `--user-data-dir`, jamás `--profile-directory` para QA.**

A diferencia de Firefox, Chrome **no necesita `--no-remote`** (es un concepto de Firefox): cada `--user-data-dir` distinto ya arranca su propio proceso aislado.

---

## Convención de nombres (slug)

El slug codifica **tres cosas, en orden: SaaS + tipo de QA + cuenta/tenant**.

```
<saas>-<tipo-qa>-<cuenta>
```

Ejemplos reales:

| Slug | SaaS | Tipo QA | Cuenta/Tenant |
| --- | --- | --- | --- |
| `itera-lex-qa-estudio-demo` | itera-lex | qa | estudio-demo |
| `itera-lex-qa-superadmin` | itera-lex | qa | superadmin |
| `shopear-tenant-demo-1` | shopear | tenant | demo-1 |

Reglas del slug:

- **kebab-case, sin espacios.**
- El **mismo slug se reusa en cuatro lugares y deben coincidir exactamente**: el subdir del data dir, `--class` (con prefijo `chrome-`), `StartupWMClass`, y el filename `chrome-<slug>.desktop`.

---

## Comando canónico

```bash
google-chrome \
  --user-data-dir="$HOME/.config/google-chrome-qa/<saas>-<tipo-qa>-<cuenta>" \
  --class=chrome-<saas>-<tipo-qa>-<cuenta> \
  --no-first-run \
  --no-default-browser-check \
  --new-window <url>
```

| Flag | Para qué |
| --- | --- |
| `--user-data-dir=...` | **El aislamiento real**: dir de datos propio. Proceso separado garantizado. |
| `--class=chrome-<slug>` | Setea `WM_CLASS` en X11 → el WM (Cinnamon) trata la ventana como app distinta, icono propio. |
| `--no-first-run` | Salta el wizard de bienvenida en el primer arranque del dir nuevo. |
| `--no-default-browser-check` | No pregunta "¿Chrome como navegador default?" cada vez. |
| `--new-window <url>` | Abre la URL en ventana nueva del perfil. |

Convención de paths:

- **Data dir**: `~/.config/google-chrome-qa/<slug>` (todos los perfiles QA juntos bajo `google-chrome-qa/`, **fuera** del `~/.config/google-chrome` productivo).
- **Launcher** (opcional, para doble-click): `~/.local/share/applications/chrome-<slug>.desktop`.

---

## Launcher `.desktop` (app de primera clase en la barra)

Para no tipear el comando cada vez, un `.desktop` por cuenta. Ejemplo real (itera-lex, estudio demo):

```ini
[Desktop Entry]
Version=1.5
Type=Application
Name=Chrome - Itera Lex QA Estudio Demo
Icon=/usr/share/icons/Papirus/64x64/apps/google-chrome.svg
Exec=/usr/bin/google-chrome --user-data-dir=/home/pachu/.config/google-chrome-qa/itera-lex-qa-estudio-demo --class=chrome-itera-lex-qa-estudio-demo --no-first-run --no-default-browser-check --new-window http://localhost:3000/login
StartupWMClass=chrome-itera-lex-qa-estudio-demo
StartupNotify=true
Categories=Network;WebBrowser;
```

> **CRÍTICO**: estos cuatro deben coincidir **exactamente** entre sí:
> el `<slug>` del `--user-data-dir`, el `--class=chrome-<slug>`, el `StartupWMClass=chrome-<slug>` y el filename `chrome-<slug>.desktop`.
> Si `StartupWMClass` no matchea el `--class`, Cinnamon muestra **dos iconos** en la barra (el del launcher + la ventana huérfana). Es el bug más común (idéntico al de Firefox).

Tras crear/editar un `.desktop`:

```bash
update-desktop-database ~/.local/share/applications/
```

---

## Verificar aislamiento + `WM_CLASS`

```bash
xprop WM_CLASS
# (click en la ventana de Chrome) → debe devolver:
# WM_CLASS(STRING) = "chrome-<slug>", "chrome-<slug>"
```

Si devuelve `"google-chrome", "Google-chrome"` (los defaults), el `--class` no se aplicó — chequear que no sea Chrome de Snap/Flatpak (ver gotchas).

Para confirmar que la sesión está aislada: logueate con una cuenta en un perfil, abrí otro perfil con otra cuenta, y verificá que la primera **no** quedó logueada en la segunda.

---

## Por qué Chrome y no Firefox para Google

- El **Google Picker** (selector de archivos de Drive) y el **OAuth de Google** funcionan más predeciblemente en Chrome. Firefox con containers a veces rompe el `postMessage` del Picker o pierde el popup de OAuth.
- itera-lex integra **Drive** (adjuntar archivos) + **Google Calendar** → la QA de esos flujos va por Chrome.
- Para QA que NO toca Google (CRUD, presupuestos, directorio), cualquiera sirve.

---

## Inventario actual (referencia 2026-05-26)

| Slug | SaaS | URL de arranque |
| --- | --- | --- |
| `itera-lex-qa-estudio-demo` | itera-lex | `http://localhost:3000/login` |
| `shopear-tenant-demo-1` | shopear | `http://tenant-demo-1.shope.localhost:3016/admin` |

Cada uno con su data dir en `~/.config/google-chrome-qa/<slug>` y su launcher `chrome-<slug>.desktop`.

---

## Gotchas

- **`--profile-directory` NO aísla** (comparten `User Data`). Siempre `--user-data-dir`.
- **Chrome de Snap/Flatpak** puede romper `--class` por el sandbox (igual que Firefox). Usar el `.deb` oficial (`/usr/bin/google-chrome`).
- El data dir crece (cada uno es un Chrome completo). Para **resetear** una cuenta: `rm -rf ~/.config/google-chrome-qa/<slug>` y volver a abrir.
- **Credenciales NO se persisten en esta guía.** Logueás una vez con "recordar" y queda en el data dir del perfil.
- `StartupWMClass` ≠ `--class` → doble icono en la barra.

---

## Relación con la guía de Firefox

`qa-firefox-multicuenta.md` sigue válida para QA masiva multi-cuenta **sin Google** (ej: 6 cuentas de MercadoLibre con iconos de colores y dock estilo Mac). El patrón conceptual es el mismo (aislamiento por dir de perfil + `WM_CLASS` + `.desktop`), solo cambia el browser y los flags. No hace falta migrar lo que ya funciona en Firefox; **este carril (Chrome) es el vigente para los flujos nuevos con Drive / Picker / OAuth de Google.**
