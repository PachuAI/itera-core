# Screenshot Specs — ÍTERA Lex device mockups

Resoluciones exactas y procedimientos para capturar screenshots que entren bien en los frames del skill.

---

## Laptop

### Área del screenshot dentro del frame

Cuando el `.laptop` se renderiza al ancho default (740px), el screen interno mide:

| Zona | Tamaño en pixels (al render 1080×1350) |
|---|---|
| Frame completo (chassis + bezel) | 740 × 462 px |
| Área visible del screen (descontando bezel 14px) | 712 × 434 px |
| Área del screenshot (descontando topbar simulado de 28px) | **712 × 406 px** |
| Aspect ratio del screen | **16 : 10** |

### Resolución a capturar

Para que se vea nítido sin pixelado, capturar a **2x el tamaño visible**:

| Calidad | Resolución | Cuándo usar |
|---|---|---|
| **Recomendada** | **1440 × 900 px** | Estándar laptop nativo (MacBook Air 13"). Encaja perfecto con `object-fit: cover` y queda nítido a 2x. |
| Retina máxima | 2880 × 1800 px | Cuando la pieza va a verse en Retina o se va a usar como activo de print. |
| Mínima aceptable | 712 × 406 px | Lo justo para llenar el área. NO recomendado — pierde nitidez si IG comprime. |

### Cómo capturar

1. Abrir Chrome en `app.iteralex.com` (o la URL del producto).
2. **Resize la ventana del browser a 1440 × 900** (Window > Resize en herramientas tipo Rectangle, o ajustar manual).
3. Tomar screenshot con la herramienta del sistema:
   - macOS: `Cmd+Shift+4` y arrastrar sobre la ventana
   - Linux: `gnome-screenshot --window` o `Print Screen`
4. Capturá **incluyendo la barra de URL** del browser. El topbar simulado del frame del skill no la reemplaza — la complementa.

### Dónde guardar

```
projects/iteralex/campañas/<stage>/recursos/dashboard-screenshot.png
projects/iteralex/campañas/<stage>/recursos/<feature>-screenshot.png  (otras pantallas)
```

---

## Mobile

### Área del screenshot dentro del frame

Cuando el `.phone` se renderiza al ancho default (360px), el screen interno mide:

| Zona | Tamaño en pixels (al render 1080×1350) |
|---|---|
| Frame completo (chassis + bezel) | 360 × 757 px |
| Área visible del screen (descontando bezel 10px) | 340 × 737 px |
| Aspect ratio del screen | **9 : 19.5** (iPhone 13/14/15) |

> El dynamic island se superpone al área del screen. Si el screenshot tiene contenido importante en los primeros ~30px superiores, queda parcialmente cubierto. Es comportamiento esperable y se lee como "browser real".

### Resolución a capturar

| Calidad | Resolución | Cuándo usar |
|---|---|---|
| **Recomendada** | **1170 × 2532 px** | iPhone 14 Pro Retina (DPR 3x). Máxima nitidez, aguanta bien la compresión de IG. |
| Aceptable | 780 × 1688 px | iPhone Retina 2x. Suficiente para feed Instagram, máquina más liviana al renderizar. |
| Mínima | 393 × 852 px | CSS pixels nativos. Pierde definición al ampliarse. |

### Cómo capturar (Chrome DevTools)

1. Abrir DevTools (F12 o `Cmd/Ctrl+Option+I`).
2. Click en el ícono de **"Toggle device toolbar"** (`Ctrl+Shift+M` o el ícono de móvil).
3. Seleccionar dispositivo: **"iPhone 14 Pro"** (o iPhone 13/15 Pro — todos comparten 9:19.5 ratio).
4. Confirmar zoom al 100%.
5. Cargar la URL (`app.iteralex.com` o la pantalla del producto).
6. Esperar que cargue completo.
7. Capturar:
   - `Ctrl+Shift+P` (o `Cmd+Shift+P`) → tipear `screenshot` → elegir **"Capture screenshot"** (visible) o **"Capture full size screenshot"** (toda la página, scrolleada).

### Dónde guardar

```
projects/iteralex/campañas/<stage>/recursos/dashboard-screenshot-mobile.png
projects/iteralex/campañas/<stage>/recursos/<feature>-screenshot-mobile.png
```

Convención: si el desktop se llama `<feature>-screenshot.png`, el mobile se llama `<feature>-screenshot-mobile.png`. Nada de "tablet" intermedio (no hay frame).

---

## Multi-screenshot por feature

Si querés mostrar varios estados de la misma pantalla (ej: panel vacío vs panel con datos), nombrar:

```
dashboard-screenshot.png
dashboard-screenshot--empty.png
dashboard-screenshot-mobile.png
dashboard-screenshot-mobile--empty.png
```

Doble guion `--` separa el modificador del nombre principal. Esto facilita filtros y animaciones donde cycleás entre estados.

---

## Reglas de captura no-negociables

- **Modo dark obligatorio**. La app debe estar en su tema oscuro al capturar (no light, no auto). Si capturás en light, el contraste con el chassis dark del frame falla y se ve mal.
- **Zoom 100%**. Cualquier otro zoom rompe la grilla nativa de la app.
- **Sin extensiones del browser visibles** que pinten contenido (ad-blockers que muestren counter, dark-reader si la app ya tiene su propio modo dark, etc.).
- **Sesión real**, no demo desordenada. Idealmente con datos coherentes (ej: causas reales del tenant `RER` o de las vitrinas demo).
- **Sin badges de notificación rojos** cubriendo iconos importantes — si hace falta, vaciar las notificaciones antes de capturar.
- **Hora del sistema**: si la app muestra fecha/hora en el header, asegurate que sea coherente con el timeline del posteo (idealmente 7-30 días futuros del momento de publicación).
