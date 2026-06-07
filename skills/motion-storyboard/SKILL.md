---
name: motion-storyboard
description: Armar un storyboard HTML como paso intermedio entre frames finales rendereados de un video corto (stills 9:16, 1:1, 4:5) y la implementación en Remotion. El doc resultante describe beat por beat qué hay en pantalla, cómo entra/sale cada elemento con timings concretos, cómo se sincroniza al audio narrado (timestamps word-level de ElevenLabs Scribe o Whisper), y dónde meter frames intermedios entre los beats principales. Usar SIEMPRE antes de codear animación de un video corto cuando hay audio sincronizado y frames estáticos como base, y se quiere planificar el motion completo de una sola pasada en vez de iterar a ciegas dentro de Remotion. Cubre stories/reels de Instagram con narración, covers de YouTube animadas, hooks/teasers cortos, highlights de Instagram, intros/outros de YouTube. Triggers: "armame un storyboard", "plan de motion antes de animar", "storyboard de este video", "antes de Remotion quiero un plan", "cómo animo entre estos frames", "qué frames intermedios necesito", "storyboard del video", "/motion-storyboard". También usar cuando el user describa un video corto que tiene frames listos pero no sabe cómo animar entre ellos, o cuando pida "ver el plan antes de codear".
---

# Motion Storyboard

Storyboard HTML como puente entre **frames estáticos finales** (los slides ya rendereados de cada beat clave del video) y la **implementación en Remotion**. Resuelve el problema de "saltar del PNG al código sin un plan visible" — el storyboard hace el plan visualizable, anotable, debatible antes de codear.

## Cuándo invocar

Invocar siempre que:
- Se va a animar un video corto (5-60s) con frames estáticos como punto de partida.
- Hay audio narrado disponible o planeado.
- El video tiene 3+ "puntos de descanso" (slides finales) que se quieren conectar con motion.
- Se quiere validar el plan completo antes de codear Remotion.

Casos típicos del taller `itera-social`:
- Story/Reel de Instagram con narración (highlights, teasers, hooks).
- Cover de YouTube con animación corta.
- Intros/outros de video.

**Out of scope** (no usar para):
- Video largo con producción cinematográfica (ahí va un storyboard tradicional con sketches).
- Live-action o video con cámara — esto es para motion graphics derivados de stills.
- Animar un solo frame sin audio ni progresión (ahí basta con animar el HTML directo, ver `social-motion`).

## Workflow

### 0. Verificar inputs

**Mínimo:**
- **Frames finales**: PNGs rendereados de cada "punto de descanso" del video. Pueden vivir en `pieces/`, `out/`, `stages/<stage>/out/` o donde el proyecto los tenga.
- **Brand tokens** mínimos: paleta base (background, foreground, accent), tipografía display, tipografía mono. Si el proyecto vive en `itera-social/projects/<slug>/` los tokens están en `shared.css`.

**Opcional pero recomendado:**
- **Audio narrado** (MP3/WAV) con duración conocida.
- **JSON de timestamps word-level** (de ElevenLabs Scribe, Whisper word-timestamps, o similar). Formato esperado:
  ```json
  [
    { "text": "palabra", "start": 1.42, "end": 2.10 },
    ...
  ]
  ```
- **Guion / copy** definitivo (qué dice cada beat).

Si falta el audio + JSON: el storyboard se arma igual pero las secciones `AUDIO SYNC` quedan vacías o con notas tipo "TBD — falta grabar".

### 1. Identificar los beats principales

Un **beat** es cada "punto de descanso" del video — un frame estable donde la composición se completa antes de transicionar al próximo. Mapean 1:1 con los PNGs finales.

Antes de armar el storyboard, listar los beats con:
- ID y label (`BEAT 01 · COVER`, `BEAT 02 · TÉCNICA`, ...).
- Frame fuente (path al PNG).
- Heading conceptual (qué dice este beat).
- Timing aproximado (si hay audio mapeado).

### 2. Mapear los beats al audio

Si hay JSON de timestamps:
- Para cada beat, identificar la palabra/frase que abre y la que cierra.
- Anotar `start_at` y `end_at` absolutos.
- Calcular duración (`end - start`).
- Identificar los **gaps** entre beats (silencios en el audio entre la última palabra de un beat y la primera del siguiente).

Los gaps son material crítico: ahí van las transiciones más ricas. Un gap de 0.0-0.2s pide cross-fade simple; uno de 0.8s+ pide una transición narrativa con motion propio (eso justifica un **switch** en el storyboard).

### 3. Detectar frames intermedios (switches)

**Esta es la sección que el user del taller pide explícitamente cada vez.** Entre dos beats principales puede haber estados in-between que justifican una sección propia.

Detectar candidatos a **switch** (frame intermedio) cuando:
- Hay un **gap de audio ≥ 0.6s** entre dos beats (espacio para que pase algo visualmente sin que la voz lo pise).
- La transición entre dos beats requiere un movimiento que **literaliza** lo que dice la voz inmediatamente después (ej: la voz dice "centralizado" → motion graphics convergen al centro en el switch previo).
- Hay un cambio fuerte de composición entre dos beats consecutivos que necesita un puente para no leerse como "salto duro".
- El user en review pide explícitamente "acá falta algo en el medio".

Cuando se identifica un switch, agregar al storyboard una sección de tipo `switch` ENTRE los beats correspondientes (con la clase `.beat.switch`, ver `references/anatomy.md`). Si el switch justifica su propio PNG (porque se quiere animar contra un estado intermedio concreto), marcarlo como TODO de render en el outro o en una `note` — el skill **no** genera PNGs nuevos, solo el plan.

**Por defecto, los switches no son frames sino transiciones descriptas.** Solo se vuelven frames cuando la complejidad lo justifica (ej: 6 cards que convergen a un cluster que después se transforma — vale la pena un PNG del cluster como referencia visual).

### 4. Generar el storyboard HTML

Ver `references/anatomy.md` para la estructura completa y el HTML de cada bloque. Resumen del orden:

1. **Hero** con kicker, título, lede, pills de metadata, tabs de navegación.
2. **Timeline visual** horizontal con segmentos proporcionales a la duración de cada beat/switch/silence.
3. **Intro silence** (si el audio empieza después de 0s).
4. **Sección por beat** con preview del PNG + 3 paneles (`WHAT'S ON SCREEN` / `MOTION` / `AUDIO SYNC`) + `note` opcional + `beat-next` pointer.
5. **Sección por switch** entre beats con descripción del motion de transición + timing breakdown.
6. **Outro silence** (si el audio termina antes del fin del clip).
7. **Footer** con specs de export (resolución, fps, codec, filename target) + versión.

Para el HTML usar `assets/template.html` como base. Tokens visuales (colores de marca, tipografías) se reemplazan al inicio del `<style>` con los del proyecto (leer del `shared.css` del proyecto si existe).

**Path de output**: por defecto, guardar dentro del proyecto al que pertenece. Patrón:
```
projects/<slug>/stages/<stage>/storyboard-<beat-id>.html
```
Ej: `projects/iteralex/stages/highlights/storyboard-que-es.html`.

El skill **no** guarda outputs dentro de `~/.claude/skills/motion-storyboard/`. Los storyboards viven con el proyecto.

### 5. Iterar

El storyboard es **iterativo, no oneshot**. Cada sesión de review puede:
- Agregar/quitar beats principales (si el user re-graba con más/menos pausas).
- Agregar/quitar switches (frames intermedios) entre beats.
- Cambiar timings cuando el user re-grabe el audio o reordene el guion.
- Refinar las descripciones de `MOTION` (más concreto, menos elaborado, sumar curvas).
- Actualizar las imágenes preview cuando los PNGs se re-rendereen.

Marcar el archivo con `v1` / `v2` en el footer (ver `assets/template.html`). Si los cambios son grandes y vale la pena dejar histórico, anotar en el footer con un comentario.

## Reglas de calidad

### MOTION debe ser concreto, no vibras

**Mal**: "el wordmark entra con un fade lindo"
**Bien**: "wordmark · `slide-up-fade` desde 20px abajo, opacity 0→1 (`0.0s → 0.4s` relativo al beat)"

Cada bullet de `MOTION` tiene que tener:
- **Qué** se anima (elemento específico).
- **Qué tipo** de movimiento (slide, fade, scale, spring, color-shift, stroke-draw, etc.).
- **Desde dónde** y **hacia dónde** (valores concretos).
- **Cuándo** arranca y termina (timestamp relativo al beat o absoluto al video, marcar cuál).
- **Curva de easing** si no es lineal o default (`ease-out-cubic`, `spring`, `back.out(1.4)`, `sine.inOut`, etc.).

### AUDIO SYNC referencia el JSON, no inventa

Cada fila del `.audio-track` tiene un **timestamp del JSON real**, no aproximado. Si una palabra del JSON no necesita cue de animación, dejarla en blanco — no inventar cues solo para llenar.

### Notes sirven para decisiones, no para descripciones

El bloque `.note` es para anotar **decisiones específicas** que el user puede querer debatir:
- "este motion literaliza la palabra X, alternativa más sobria sería Y"
- "el silencio de N segundos es deliberado para Z"
- "este beat es el frame que sobrevive como thumbnail estático del video"
- "trade-off: motion literal vs sobrio — pendiente review"

**No** usar `.note` para repetir lo que ya está en `MOTION` o `WHAT'S ON SCREEN`. Si la nota describe el motion, va en `MOTION`.

### El storyboard se queda con el proyecto

Guardar el HTML generado dentro del proyecto (`projects/<slug>/stages/<stage>/storyboard-*.html`). El skill solo provee la receta — los outputs viven con el proyecto.

### Beat principal vs switch vs silence

| Tipo | Class | Cuándo | Color tema |
|---|---|---|---|
| **Beat principal** | `.beat` | Punto de descanso con composición estable, con PNG fuente | Naranja brand |
| **Switch** (frame intermedio) | `.beat.switch` | Transición rica entre dos beats — motion graphics propio o estado in-between | Púrpura `#8B6FF0` |
| **Silence** | `.beat.silence` | Tramo de audio sin voz (intro fade-in, outro fade-out, pausas largas) | Gris fg-low |

## Color coding (cross-project)

| Color | Hex | Para qué |
|---|---|---|
| **Brand accent** | Toma el del proyecto (ej `#F27A1A` para iteralex) | Beats principales, IDs, MOTION header, brand emphasis |
| **Púrpura** | `#8B6FF0` | Switches (transiciones / frames intermedios), motion graphics secondary |
| **Cyan** | `#4FD1C5` | `AUDIO SYNC` header, timestamps, cues de audio |
| **Gris** | `#8a8a8a` | Silencios, metadata, helpers |

El **brand accent** se sobrescribe por el del proyecto. Los otros 3 son sistema cross-project — no cambiarlos a menos que entren en conflicto con el accent (ej: si un proyecto usa púrpura como brand, mover switches a otro color).

## Pointers

- `references/anatomy.md` — estructura HTML detallada por bloque, con classes y ejemplos de cada panel.
- `assets/template.html` — shell del HTML con CSS completo y placeholders para llenar.
- **Ejemplo real validado** — `projects/iteralex/stages/highlights/storyboard-que-es.html` en el repo `itera-social`. Fue el primer storyboard armado con este skill (2026-05-13) — leer para ver cómo quedan las decisiones concretas (frames intermedios literales como "cards compact", silencios deliberados, audio sync con 52 palabras del JSON).

## Idioma

Storyboards en **español rioplatense** cuando el proyecto está en español (default del taller `itera-social`). Tokens técnicos (CSS classes, codecs, curvas de easing) quedan en inglés porque son el lenguaje de la herramienta destino (Remotion / CSS / motion design en general).
