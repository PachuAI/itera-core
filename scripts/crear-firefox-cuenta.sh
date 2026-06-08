#!/usr/bin/env bash
# crear-firefox-cuenta.sh
#
# Crea una instancia aislada de Firefox para una cuenta de QA en Linux Mint Cinnamon.
# Genera: icono coloreado (via API ITERA) + perfil Firefox + .desktop launcher.
#
# Uso:
#   ./crear-firefox-cuenta.sh <slug> <color-hex> <display-name>
#
# Ejemplos:
#   ./crear-firefox-cuenta.sh vendedor-ml-prueba "#10b981" "Firefox - ML Vendedor"
#   ./crear-firefox-cuenta.sh comprador-ml-1     "#3b82f6" "Firefox - ML Comprador 1"
#
# Idempotente: si el icono / perfil / launcher ya existen, los respeta y solo regenera lo faltante.
#
# Ver guia completa: ~/projects/itera-core/guides/qa-firefox-multicuenta.md

set -euo pipefail

# --- Parsing args ----------------------------------------------------
SLUG="${1:?Falta slug. Uso: $0 <slug> <color-hex> <display-name>}"
COLOR_HEX="${2:?Falta color hex. Ej: '#10b981'}"
DISPLAY_NAME="${3:?Falta display name. Ej: 'Firefox - ML Vendedor'}"

# --- Validaciones ----------------------------------------------------
if [[ ! "$SLUG" =~ ^[a-z0-9-]+$ ]]; then
  echo "Error: slug debe ser kebab-case [a-z0-9-]. Recibido: $SLUG" >&2
  exit 1
fi
if [[ ! "$COLOR_HEX" =~ ^#[0-9A-Fa-f]{6}$ ]]; then
  echo "Error: color debe ser hex 6 digitos (ej: #10b981). Recibido: $COLOR_HEX" >&2
  exit 1
fi

# --- API key ---------------------------------------------------------
if [[ -z "${ITERA_API_KEY:-}" ]]; then
  if [[ -f "$HOME/projects/saas/linkea2/.env" ]]; then
    ITERA_API_KEY=$(grep "^ITERA_API_KEY" "$HOME/projects/saas/linkea2/.env" | cut -d'"' -f2)
  fi
fi
if [[ -z "${ITERA_API_KEY:-}" ]]; then
  echo "Error: ITERA_API_KEY no esta en el environment ni en ~/projects/saas/linkea2/.env" >&2
  exit 1
fi

# --- Firefox debe estar cerrado para crear perfil --------------------
if pgrep -x firefox >/dev/null; then
  echo "Error: Firefox esta abierto. Cerralo (todas las ventanas) y volve a correr." >&2
  exit 1
fi

# --- Paths -----------------------------------------------------------
ICON_DIR="$HOME/.local/share/icons"
APPS_DIR="$HOME/.local/share/applications"
ICON_PATH="$ICON_DIR/firefox-$SLUG.png"
PROFILE_DIR="$HOME/.mozilla/firefox/qa-$SLUG"
DESKTOP_FILE="$APPS_DIR/firefox-$SLUG.desktop"

mkdir -p "$ICON_DIR" "$APPS_DIR"

echo ">>> Creando setup para: $SLUG"
echo "    Color:     $COLOR_HEX"
echo "    Display:   $DISPLAY_NAME"
echo "    Icono:     $ICON_PATH"
echo "    Perfil:    $PROFILE_DIR"
echo "    Launcher:  $DESKTOP_FILE"
echo ""

# --- 1. Icono via API ITERA ------------------------------------------
if [[ -f "$ICON_PATH" ]]; then
  echo "[1/4] Icono ya existe (skip). Borralo si queres regenerar: rm $ICON_PATH"
else
  echo "[1/4] Generando icono via API ITERA..."
  RESPONSE=$(curl -sf -X POST https://app.iteraestudio.com/api/v1/generate \
    -H "Authorization: Bearer $ITERA_API_KEY" \
    -H "Content-Type: application/json" \
    -d "$(cat <<JSON
{
  "prompt": "Stylized circular browser app icon in solid color $COLOR_HEX, minimalist flat design, geometric, simple geometric shapes, clean lines, centered composition, vibrant saturated color, app launcher style icon, NO text",
  "modeOptions": { "mode": "asset-png", "options": { "assetType": "render", "intent": "create", "outputStyle": "flat" } },
  "customColors": ["$COLOR_HEX"],
  "negativePrompt": "text, letters, words, numbers, background, shadows, gradients, photorealistic, complex details, multiple objects, white background, transparent overlay"
}
JSON
)") || { echo "Error: la API respondio con error HTTP." >&2; exit 1; }

  IMG_URL=$(echo "$RESPONSE" | grep -oP '"url":\s*"\K[^"]+' | head -1)
  if [[ -z "$IMG_URL" ]]; then
    echo "Error: respuesta de la API no contiene url. Respuesta:" >&2
    echo "$RESPONSE" >&2
    exit 1
  fi

  curl -sL "$IMG_URL" -o "$ICON_PATH"
  echo "      OK. Icono guardado: $ICON_PATH"
fi

# --- 2. Perfil de Firefox --------------------------------------------
if [[ -d "$PROFILE_DIR" ]]; then
  echo "[2/4] Perfil ya existe (skip)."
else
  echo "[2/4] Creando perfil de Firefox..."
  firefox -no-remote -CreateProfile "$SLUG $PROFILE_DIR" >/dev/null 2>&1
  echo "      OK. Perfil creado: $PROFILE_DIR"
fi

# --- 3. .desktop launcher --------------------------------------------
echo "[3/4] Escribiendo launcher .desktop..."
cat > "$DESKTOP_FILE" <<EOF
[Desktop Entry]
Version=1.5
Type=Application
Name=$DISPLAY_NAME
Icon=$ICON_PATH
Exec=env MOZ_APP_REMOTINGNAME=firefox-$SLUG /usr/bin/firefox --class=firefox-$SLUG --no-remote -P $SLUG --new-window %u
StartupWMClass=firefox-$SLUG
StartupNotify=true
Categories=Network;WebBrowser;
EOF
chmod +x "$DESKTOP_FILE"
echo "      OK. Launcher: $DESKTOP_FILE"

# --- 4. Refresh cache --------------------------------------------------
echo "[4/4] Actualizando cache de desktop entries..."
update-desktop-database "$APPS_DIR" 2>/dev/null || true
echo "      OK."

echo ""
echo "==> Listo. Buscalo en el menu de Cinnamon como '$DISPLAY_NAME'."
echo "    O lanzalo desde terminal: gtk-launch firefox-$SLUG"
