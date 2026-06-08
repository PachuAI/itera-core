# QA con multiples cuentas: Firefox aislado por instancia (Linux Mint Cinnamon)

> Guia operativa para tener varias instancias de Firefox totalmente aisladas en Linux Mint, una por cuenta de QA, cada una como app de primera clase en la barra de tareas (icono propio, ventana propia, cero riesgo de mezcla de sesiones).
>
> Pensada para el flujo de QA de SaaS ITERA (multiples cuentas vendedor/comprador en MercadoLibre, multiples tenants en Shope, cuentas de prueba de Linkea2, etc).

> **¿La QA toca integraciones de Google (Drive, Picker, OAuth de Calendar/Gmail)?** → usá el carril **Chrome**, que es el método vigente para ese caso: [`qa-chrome-perfiles-aislados.md`](./qa-chrome-perfiles-aislados.md). El Picker y el OAuth de Google funcionan más predecible en Chrome que con los containers de Firefox. Esta guía (Firefox) sigue siendo la canónica para QA masiva multi-cuenta **sin** Google.

---

## El problema

Cuando hacés QA seriamente sobre un SaaS multi-tenant o sobre integraciones tipo MercadoLibre, terminas necesitando **5, 10, 15 cuentas distintas abiertas al mismo tiempo**: vendedor test, comprador test, admin del tenant A, usuario standard del tenant A, mismo combo del tenant B, etc.

El requisito real es brutal:

1. **Aislamiento total**: si una cookie/sesion se filtra entre cuentas, el bug que estabas reproduciendo se contamina y perdes media hora.
2. **Cero fricción mental**: tenés que poder mirar la barra de tareas y saber de un vistazo cual ventana es cual cuenta. Si tenés que pensar "a ver, en cual estaba", ya perdiste.
3. **Doble click → ventana correcta**: sin pasos intermedios, sin abrir un menu, sin elegir un perfil.

## El viaje: que probamos antes (y por que no alcanza)

### Opción 1: Perfiles de Firefox (`firefox -P`)

El sistema nativo de Firefox. Crea perfiles separados, cada uno con su `~/.mozilla/firefox/<profile>/`.

**Por que no alcanza solo con esto**:
- Tenés que abrir el Profile Manager y elegir cada vez, o tener un script para cada uno.
- Por default, todos los perfiles **comparten un solo proceso de Firefox** (no abre ventanas separadas), entonces si abris dos perfiles, te los mete en pestañas del mismo proceso o te tira "Firefox is already running".
- Aunque logres abrir dos ventanas, **se agrupan bajo el mismo icono** en la barra de Cinnamon. Resultado: tenés que hacer hover, esperar el preview, elegir. Friccion alta.

### Opción 2: Multi-Account Containers (extension de Mozilla)

La extension oficial de Firefox para tener "tabs" con cookies aisladas (cada tab es su propio container de cookies, podés abrir 5 tabs con 5 cuentas distintas de Gmail, por ejemplo).

**Por que no alcanza**:
- Funciona perfecto con 2-3 cuentas. Con 10+, perdes la cabeza identificando cual tab es cual.
- El indicador visual es chico (un borde de color en el tab), facil de equivocarse cuando tenes muchos tabs abiertos.
- Todas las cuentas viven en una sola ventana: si cerrás Firefox por accidente, cerraste todas. No podés tener "ML Vendedor" en monitor 1 y "ML Comprador" en monitor 2 sin pelear con el window management.
- Logueo manual cada vez que se vencen sesiones (las extensiones de gestion de containers ayudan, pero no resuelven el tema visual).

### Opción 3 (descartada al investigarla): "Firefox Portable" estilo Windows

En Windows existe Firefox Portable de PortableApps, que es Firefox extraído a una carpeta autocontenida. La idea inicial fue replicar eso en Linux: descargar el tarball de Mozilla, extraerlo a `~/apps/firefox-mlseller/`, tener N copias autocontenidas.

**Por que no es necesario en Linux**:
- En Linux, **el aislamiento real lo da el directorio de perfil**, no el binario. Una sola instalacion de Firefox + N perfiles te da exactamente el mismo aislamiento que N tarballs separados.
- N tarballs significa N copias del binario (~80MB c/u), N updates manuales, N veces el riesgo de quedar con versiones desincronizadas.
- La unica razón legitima para tarballs separados es si necesitás **versiones distintas** de Firefox (ESR vs Beta vs Nightly) para testear compatibilidad. Para multi-cuenta en la misma version, es overhead puro.

## La solucion

**1 sola instalacion de Firefox** (la del sistema) + **N perfiles** + **N launchers `.desktop`** con un truco de `WM_CLASS` para que cada launcher aparezca como **app totalmente separada** en el panel de Cinnamon, con su propio icono custom.

Resultado:
- Doble click en "Firefox - ML Vendedor" → abre **una ventana** que SOLO tiene esa cuenta.
- Doble click en "Firefox - ML Comprador" → otra ventana, otro proceso, **otro icono separado** en la barra.
- Cero hover, cero dropdown, cero ambiguedad. Cada cuenta es un app distinta para Cinnamon.
- Podes pintar cada icono de un color distinto (verde = vendedores, azul = compradores, naranja = admins, etc).

---

## Receta paso a paso

### Pre-requisito: verificar que NO tenés Firefox de Snap o Flatpak

```bash
which firefox
```

Tiene que devolver `/usr/bin/firefox` o similar (paquete nativo del repo de Mint/Mozilla). Si te aparece `/snap/firefox/...` o un path de Flatpak, el sandbox **rompe los flags `--no-remote` y `--class`** que necesitamos. Mint por default no usa Snap, asi que en general estamos cubiertos, pero conviene chequear.

### Paso 1: Crear el perfil

Una vez por cuenta:

```bash
firefox -P
```

Se abre el Profile Manager. **Create Profile** → ponele un nombre sin espacios (ej: `MLSeller`, `ShopeAdmin`, `LinkeaQA1`). El nombre lo vas a usar despues en el launcher.

Cerrá Firefox.

### Paso 2: Conseguir el icono

Cualquier PNG cuadrado (ideal 256x256, minimo 128x128) en `~/.local/share/icons/`. Conviene nombrarlos descriptivos: `ff-mlseller.png`, `ff-mlcomprador.png`.

**Para colorear el icono base de Firefox**:
- Opcion rapida: descargar el SVG oficial de Firefox y usar GIMP con Hue/Saturation para tirarle un tono.
- Opcion ITERA: usar el [generador de imagenes ITERA](../reference_itera_image_api.md) con prompt tipo "Firefox logo recolored to emerald green, flat icon, transparent background, 256x256".
- Opcion futura: el script que vamos a armar generara los iconos automaticamente a partir de un color hex (ver "Roadmap" abajo).

Convencion de colores que estamos usando:
- Verde → vendedores
- Azul → compradores
- Naranja → admins de tenant
- Violeta → cuentas de prueba/sandbox
- Rojo → cuentas de produccion (ojo, no romper nada)

### Paso 3: Crear el launcher `.desktop`

Archivo en `~/.local/share/applications/firefox-mlseller.desktop`:

```ini
[Desktop Entry]
Version=1.5
Type=Application
Name=Firefox - ML Vendedor
Icon=/home/pachu/.local/share/icons/ff-mlseller.png
Exec=env MOZ_APP_REMOTINGNAME=firefox-mlseller /usr/bin/firefox --class=firefox-mlseller --no-remote -P MLSeller --new-window %u
StartupWMClass=firefox-mlseller
StartupNotify=true
Categories=Network;WebBrowser;
```

Las 3 piezas clave del `Exec` y por que cada una:

| Flag/Var | Para que sirve |
|---|---|
| `--no-remote` | Garantiza **proceso separado**. Sin esto, el segundo Firefox que abrís se enchufa al primero. |
| `--class=firefox-mlseller` | Setea `WM_CLASS` en X11 → Cinnamon trata esta ventana como una app distinta. |
| `MOZ_APP_REMOTINGNAME=firefox-mlseller` | Lo mismo pero para Wayland (desde Firefox 124). Cubris ambos casos. |
| `-P MLSeller` | El perfil que creaste en el paso 1. |
| `--new-window` | Evita focus raros si ya hay una ventana abierta de ese perfil. |

Y el `StartupWMClass=firefox-mlseller` le dice a Cinnamon: "esta ventana pertenece a este launcher".

> **CRITICO**: el nombre del archivo `.desktop` (sin extension), `--class`, `MOZ_APP_REMOTINGNAME` y `StartupWMClass` **deben coincidir exactamente entre si**. Si no, Cinnamon te muestra dos iconos en la barra (uno para el launcher, otro para la ventana huerfana). Es el bug mas comun.

### Paso 4: Verificar que el WM_CLASS quedo bien

Abrí el launcher (doble click desde el menu o desde Files). Despues:

```bash
xprop WM_CLASS
```

El cursor se vuelve cruz, click en la ventana de Firefox. Tiene que devolver:

```
WM_CLASS(STRING) = "firefox-mlseller", "firefox-mlseller"
```

Si te dice `"Navigator", "firefox"` (los valores default), el `--class` no se aplico. Causas tipicas:
- Estas usando Firefox de Snap/Flatpak (volve al pre-requisito).
- El env var `MOZ_APP_REMOTINGNAME` no llega al proceso (verificá la sintaxis del `Exec=`, debe ser `env VAR=valor /path/firefox ...`).

### Paso 5: Configurar el panel de Cinnamon para que NO agrupe

Aunque tengamos `WM_CLASS` distinto, el applet **"Grouped Window List"** de Cinnamon puede juntar ventanas igual si tiene activada la opcion "Group windows by application".

**Opcion A** (mantener Grouped Window List):
- Botón derecho en el applet → Configure → desactivar **"Group windows by application"**.

**Opcion B** (cambiar al applet clasico):
- Botón derecho en el panel → Add applets → quitar "Grouped Window List", agregar **"Window List"** (clasico, no agrupa nunca).

**Opcion C** (mas configurable, de Cinnamon Spices):
- Instalar el applet **"Cassia Window List"** desde el manager de applets, da mas control fino.

### Paso 6: Repetir para cada cuenta

Una vez que tenés el primero funcionando, duplicas el `.desktop`, cambias el nombre, el icono, el perfil, y los 4 valores que tienen que matchear. Listo.

---

## Gotchas conocidos

- **Snap/Flatpak Firefox**: rompe los flags. Usar siempre el del repo nativo.
- **`--new-instance`**: NO usar (bug abierto desde 2013, comportamiento inconsistente). Siempre `--no-remote`.
- **Grouped Window List con "group by application" activado**: junta ventanas aunque tengan WM_CLASS distinto. Apagar esa opcion.
- **Dos iconos en la barra (uno gris/incompleto, otro real)**: signo de que `StartupWMClass` no matchea con el `WM_CLASS` real. Verificar con `xprop` y corregir.
- **Cambios al `.desktop` que no se reflejan**: a veces Cinnamon cachea. Correr `update-desktop-database ~/.local/share/applications/` o cerrar/abrir sesion.
- **Firefox 124+ y Wayland**: el `MOZ_APP_REMOTINGNAME` debe coincidir con el filename del `.desktop` (sin extension). Convencion: archivo `firefox-mlseller.desktop` y var `MOZ_APP_REMOTINGNAME=firefox-mlseller`. (Cinnamon es X11 default, asi que esto es para futuro-proofing.)

## Bonus: dock estilo Mac (opcional)

Si queres una experiencia mas visual con iconos grandes, **Plank Reloaded** (fork moderno de Plank, mantenido en 2025 para Cinnamon) es la opcion canonica:

```bash
sudo add-apt-repository ppa:zquestz/plank-reloaded
sudo apt install plank-reloaded
```

- ~30MB RAM, no impacta coding pesado.
- Convive sin drama con el panel de Cinnamon (panel arriba con auto-hide, dock abajo, o al revés).
- Respeta perfecto los `.desktop` con icono custom: arrastras cada launcher al dock y queda como app de primera clase.
- Solo X11 (no Wayland). Cinnamon es X11 default, no es problema.

Alternativa mas liviana **sin dock extra**: agrandar los iconos del panel de Cinnamon (botón derecho → Panel settings → Panel height: 40-48px) y usar el applet **Cassia Window List**.

---

## Script de automatizacion

Disponible en `~/projects/itera-core/scripts/crear-firefox-cuenta.sh`.

Genera en un comando: icono coloreado (via API ITERA), perfil de Firefox, `.desktop` launcher con todos los flags correctos, y refresh del cache.

```bash
./crear-firefox-cuenta.sh <slug-kebab-case> <color-hex> <display-name>

# Ejemplos
./crear-firefox-cuenta.sh vendedor-ml-prueba "#10b981" "Firefox - ML Vendedor"
./crear-firefox-cuenta.sh comprador-ml-1     "#3b82f6" "Firefox - ML Comprador 1"
```

Pre-condiciones:
- Firefox debe estar **cerrado** (todas las ventanas) — si no, falla con mensaje claro.
- `ITERA_API_KEY` en environment, o el script lo lee de `~/projects/linkea2/.env` automaticamente.

Idempotente: si volves a correrlo con el mismo slug, respeta el icono y el perfil existentes y solo regenera el `.desktop`. Para regenerar el icono: `rm ~/.local/share/icons/firefox-<slug>.png` y volver a correr.

## Setup actual (estado de referencia 2026-04-27)

Configurado en desktop (`pachu-desktop-linux`) con 7 perfiles aislados.

**Estado al cierre de sesion 2026-04-27 (madrugada)**:
- [x] `profiles.ini` reseteado limpio (backup en `~/.mozilla/firefox/profiles.ini.corrupt-backup`).
- [x] Perfil `personal` operativo (renombrado desde `0kd715ww.default-release`, marcadores y extensions intactos).
- [x] 6 perfiles de QA creados con sus iconos coloreados y `.desktop` launchers.
- [x] Multi-Account Containers desinstalado del perfil `personal`.
- [x] Validado en panel de Cinnamon: 2 compradores abiertos al mismo tiempo aparecen como **iconos separados** con su color propio. **No requirio cambiar configuracion del applet** del panel (el default ya respeta `WM_CLASS` distinto).
- [ ] **Pendiente para proxima sesion**: loguear las 6 cuentas de MercadoLibre en sus perfiles correspondientes y arrancar el QA real.

Tabla de mapeo:

| Slug | Display | Color hex | Uso |
|---|---|---|---|
| `personal` | Firefox - Personal | (icono Firefox del sistema) | Navegacion personal/general, NO QA |
| `vendedor-ml-prueba` | Firefox - ML Vendedor | `#10b981` verde | Cuenta vendedor de prueba MercadoLibre |
| `comprador-ml-1` | Firefox - ML Comprador 1 | `#3b82f6` azul | Cuenta comprador 1 |
| `comprador-ml-2` | Firefox - ML Comprador 2 | `#8b5cf6` violeta | Cuenta comprador 2 |
| `comprador-ml-3` | Firefox - ML Comprador 3 | `#f97316` naranja | Cuenta comprador 3 |
| `comprador-ml-4` | Firefox - ML Comprador 4 | `#06b6d4` cian | Cuenta comprador 4 |
| `comprador-ml-5` | Firefox - ML Comprador 5 | `#ec4899` rosa | Cuenta comprador 5 |

Las credenciales de las 6 cuentas de prueba ML viven fuera de esta guia (no se persisten en docs). Cuando arranques el QA, logueas cada perfil una sola vez con "recordar" y queda persistente.

Convencion de colores: cada cuenta del mismo "tipo" (compradores) tiene un color distinto y bien diferenciable, NO variantes del mismo tono. Vas a tenerlas abiertas al mismo tiempo y necesitas distinguirlas de un vistazo en la barra.

## Gotcha encontrado en el setup real: `profiles.ini` corrupto

Si el usuario migra desde un setup viejo que mezclo perfiles creados desde la UI legacy + Firefox 124+ con "Profile Groups", el `profiles.ini` puede quedar con secciones duplicadas (`[Install...]` dos veces, `Version=` repetido, dos `[Profile3]` apuntando a paths distintos). Sintoma: cuando corres `firefox -no-remote -CreateProfile "name path"`, el nuevo perfil se mete **adentro** de una seccion existente sin abrir su propia seccion `[ProfileN]`. El parser lo ignora silenciosamente al arrancar.

**Reset limpio** (lo que hicimos en el setup real):

```bash
cd ~/.mozilla/firefox

# 1. Backup defensivo
cp profiles.ini profiles.ini.corrupt-backup
cp installs.ini installs.ini.corrupt-backup 2>/dev/null || true

# 2. Borrar perfiles QA viejos (los que no queres conservar) - solo las carpetas
rm -rf <hash>.PerfilN  # repetir para cada uno

# 3. Renombrar el perfil "personal" para que tenga un path predecible
mv 0kd715ww.default-release personal  # o el hash que tengas

# 4. Borrar artefactos del Profile Groups + installs.ini
rm -rf "Profile Groups"
rm -f installs.ini

# 5. Reescribir profiles.ini limpio con UN solo perfil registrado
cat > profiles.ini <<EOF
[Install4F96D1932A9F858E]
Default=personal
Locked=1

[Profile0]
Name=personal
IsRelative=1
Path=personal
Default=1

[General]
StartWithLastProfile=1
Version=2
EOF
```

El `Install4F96D1932A9F858E` es el ID de instalacion de Firefox del usuario — copialo del backup. Si arrancas desde cero, Firefox lo va a regenerar al primer arranque.

Despues del reset, el script `crear-firefox-cuenta.sh` agrega cada perfil nuevo correctamente con su `[ProfileN]` propia.

## Roadmap pendiente

- [x] **Script de generacion automatica** — listo en `scripts/crear-firefox-cuenta.sh`.
- [ ] **Set de iconos base ITERA**: los iconos generados via Gemini son aceptables pero inconsistentes (cada uno sale con un estilo levemente distinto: brujula vs globo vs paper plane). Para v2 conviene partir del SVG oficial de Firefox y aplicar filtro de color via ImageMagick — mas consistente y reconocible.
- [x] **Receta para Chrome/Chromium**: el mismo patron aplica con `--user-data-dir=` y `--class=`. Documentada y vigente como carril propio para QA con integraciones Google → [`qa-chrome-perfiles-aislados.md`](./qa-chrome-perfiles-aislados.md).
- [ ] **Sync entre desktop y notebook**: como replicar el setup de cuentas entre las dos maquinas (los perfiles tienen sesiones, hay tema con tokens — ver si se puede o si conviene re-loguear en cada una).

## Apendice: por que documentamos esto

El recorrido entero (perfiles → containers → portable → solucion real) tiene valor de contenido para QA y para gente que hace coding agentic con multiples sesiones de servicios online. La estructura "problema → opciones descartadas con razones → solucion → gotchas" es el formato que mejor funciona para guias tecnicas de este tipo. Cuando llegue el momento de armar el post de blog o el video, esta guia es el draft.

## Sources

- [Bug 1577056 - Profiles should use different program class (WM_CLASS)](https://bugzilla.mozilla.org/show_bug.cgi?id=1577056)
- [Bug 496653 - Command line option --class does not work, MOZ_WM_CLASS workaround](https://bugzilla.mozilla.org/show_bug.cgi?id=496653)
- [Bug 1107281 - StartupWMClass to fix double Firefox icon in docky/plank](https://bugzilla.mozilla.org/show_bug.cgi?id=1107281)
- [Tony Fernandez - Separate Firefox Panel Icons per Profile (Linux Mint, 2024)](https://tonyfernandeztech.wordpress.com/2024/02/28/separate-firefox-panel-icons-per-profile/)
- [Linux Mint Forums - Firefox Profiles New Instance (SOLVED)](https://forums.linuxmint.com/viewtopic.php?t=382925)
- [Linux Mint Forums - SHOW App labels AND do NOT group same app windows in Cinnamon](https://forums.linuxmint.com/viewtopic.php?t=403145)
- [Arch Linux Forums - Start firefox with different WM_CLASS](https://bbs.archlinux.org/viewtopic.php?id=221549)
- [Plank Reloaded - GitHub (zquestz/plank-reloaded)](https://github.com/zquestz/plank-reloaded)
- [OMG Ubuntu - Plank Reloaded Desktop Dock for Cinnamon (Feb 2025)](https://www.omgubuntu.co.uk/2025/02/plank-reloaded-linux-dock-cinnamon)
