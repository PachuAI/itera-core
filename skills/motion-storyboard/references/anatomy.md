# Anatomía del storyboard HTML

Estructura completa de un storyboard generado con este skill, bloque por bloque. Usar junto con `assets/template.html` que ya trae el shell armado.

---

## 1. Hero

Apertura del documento. Estructura:

```html
<header class="hero">
  <span class="kicker">STORYBOARD · {{PROJECT-ID}} · {{STAGE-LABEL}}</span>
  <h1>Motion <em>Plan</em></h1>
  <p class="lede">
    {{N}} beats verticales ({{RES}}, {{FPS}}fps), <strong>{{DUR}}s</strong> totales,
    sincronizados al audio narrado por {{NARRATOR}} y a los timestamps de
    <strong>{{TIMESTAMP-SOURCE}}</strong>. {{ONE-LINE DESCRIPTION}}.
    Marcalo libremente — cuando el plan esté lockeado lo construyo de
    una sola pasada en Remotion.
  </p>
  <div class="pills">
    <span class="pill"><strong>{{N}}</strong> BEATS</span>
    <span class="pill"><strong>{{M}}</strong> TRANSICIONES</span>
    <span class="pill"><strong>{{DUR}}S</strong> TOTAL</span>
    <span class="pill"><strong>{{RES}}</strong> · {{FPS}}FPS</span>
    <span class="pill purple"><strong>{{PROJECT-ID}}</strong> · {{LABEL}}</span>
  </div>
  <nav class="tabs">
    <a href="#intro">INTRO</a>
    <a href="#beat-1">BEAT 1 · {{LABEL}}</a>
    ...
    <a href="#outro">OUTRO</a>
  </nav>
</header>
```

**Cosas a llenar:**
- `{{PROJECT-ID}}`: ID corto y único del storyboard. Ej: `IL-001` para "iteralex highlight 1 (¿Qué es?)". Si el proyecto no tiene IDs, inventar uno legible.
- `{{STAGE-LABEL}}`: nombre human-readable. Ej: `¿QUÉ ES?`.
- `{{NARRATOR}}`: quién graba el audio. Si es genérico, omitir esa frase del lede.
- `{{TIMESTAMP-SOURCE}}`: típicamente `ElevenLabs Scribe`, `Whisper word-timestamps`, `Forced alignment`. Si no hay audio mapeado todavía, decir `TBD — sin audio mapeado` y dejar el lede más corto.

**El `<h1>`** usa la serif italic en una palabra para el efecto del youtuber del que sale este pattern. Default: italicizar la segunda palabra del título. Si el título es una sola palabra, italicizar una letra interna o no italicizar nada.

---

## 2. Timeline visual

Barra horizontal con un segmento por bloque (intro / beats / switches / outro). Cada segmento tiene `grid-template-columns` proporcional a su duración:

```html
<section class="timeline">
  <p class="timeline-label">Timeline · 0.0s → {{DUR}}s</p>
  <div class="timeline-bar" style="grid-template-columns: {{COL-RATIOS}};">
    <div class="tseg silence"><div class="tseg-name">Intro</div><div class="tseg-time">{{D}}s</div></div>
    <div class="tseg beat"><div class="tseg-name">B1 {{LABEL}}</div><div class="tseg-time">{{D}}s</div></div>
    <div class="tseg switch"><div class="tseg-name">SW</div><div class="tseg-time">{{D}}s</div></div>
    ...
  </div>
</section>
```

`{{COL-RATIOS}}` es una lista de fracciones proporcionales a la duración. Ej, si los segmentos duran `1.42 / 3.66 / 3.56 / 7.92 / 0.84`, el ratio es `1.42fr 3.66fr 3.56fr 7.92fr 0.84fr`.

Clases del segmento:
- `.tseg.silence` — gris, para tramos sin voz.
- `.tseg.beat` — naranja accent (`var(--accent-soft)`), para beats principales.
- `.tseg.switch` — púrpura (`var(--purple-soft)`), para frames intermedios.

---

## 3. Intro silence (opcional)

Solo incluir si el audio empieza después de `0.0s`. Sirve para describir el fade-in y la entrada inicial.

```html
<section class="beat silence" id="intro">
  <div class="beat-frame">
    <div class="beat-header">
      <div>
        <div class="beat-id">INTRO · SILENCE</div>
        <h2 class="beat-title">{{ONE-LINER}}</h2>
      </div>
      <span class="beat-time">0.00S → {{D}}S · {{D}}S</span>
    </div>
    <div class="beat-body">
      <div class="preview">
        <div class="preview-placeholder">
          <span class="preview-placeholder-label">FADE IN</span>
          <span class="preview-placeholder-sub">0.0s → {{D}}s</span>
        </div>
        <span class="preview-tag">SILENCIO</span>
      </div>
      <div class="panels">
        <div class="panel">
          <h3 class="panel-h">WHAT'S ON SCREEN</h3>
          <ul>
            <li>Frame totalmente negro (<code>#0a0a0a</code>). Sin elementos.</li>
            <li>Audio inicia con el primer "<strong>{{WORD}}</strong>" a los <code class="mono-time">{{T}}s</code>.</li>
          </ul>
        </div>
        <div class="panel">
          <h3 class="panel-h accent">MOTION</h3>
          <ul>
            <li>Slide 1 prepara entrada <strong>{{D}}s antes</strong> del primer fonema, para que el wordmark esté visible cuando arranca la voz.</li>
            <li>Curva <code>ease-out-cubic</code> en el fade.</li>
          </ul>
        </div>
      </div>
      <div class="beat-next">
        <span><span class="next-arrow">→</span> NEXT · BEAT 01 · {{LABEL}}</span>
        <span style="color: var(--fg-muted)">CUT @ {{T}}S</span>
      </div>
    </div>
  </div>
</section>
```

`preview-placeholder` reemplaza el `<img>` cuando no hay imagen fuente (silencios y switches por defecto). El `placeholder-label` describe la acción ("FADE IN", "FADE OUT", "CARDS COMPACT", etc.).

---

## 4. Beat principal

El bloque más rico. Estructura:

```html
<section class="beat" id="beat-{{N}}">
  <div class="beat-frame">
    <div class="beat-header">
      <div>
        <div class="beat-id">BEAT {{NN}} · {{LABEL}}</div>
        <h2 class="beat-title">"{{HEADLINE}}" <em>{{EM-WORD}}</em>"{{REST}}"</h2>
      </div>
      <span class="beat-time">{{START}}S → {{END}}S · {{DUR}}S</span>
    </div>
    <div class="beat-body">
      <div class="preview">
        <img src="{{PATH-TO-PNG}}" alt="Beat {{N}} · {{LABEL}}">
        <span class="preview-tag">{{FILENAME}}</span>
      </div>
      <div class="panels">
        {{WHAT-ON-SCREEN}}
        {{MOTION}}
        {{AUDIO-SYNC}}
        {{NOTE-OPCIONAL}}
      </div>
      <div class="beat-next">
        <span><span class="next-arrow">→</span> NEXT · {{TRANSITION-TYPE}} @ {{T}}S · {{D}}S</span>
        <span style="color: var(--fg-muted)">{{ANNOTATION}}</span>
      </div>
    </div>
  </div>
</section>
```

### 4.1 Preview

El `<img>` apunta al PNG renderizado del beat. Path relativo desde donde se guarda el storyboard (ej `out/01-que-es-cover.png` si el storyboard vive en `campañas/highlights/storyboard-que-es.html`).

`preview-tag` es el filename del PNG sin extensión (para identificarlo visualmente).

Aspect ratio del preview: 9:16, 1:1, 16:9 según el formato del video. El CSS por default es 9:16 (`aspect-ratio: 9/16` con `max-width: 320px`). Para 1:1 cambiar a `aspect-ratio: 1/1`; para 16:9 a `aspect-ratio: 16/9`.

### 4.2 Panel WHAT'S ON SCREEN

Lista de qué hay en pantalla en el estado **final** del beat (post-animaciones). No describe transiciones — solo el frame estable.

```html
<div class="panel">
  <h3 class="panel-h">WHAT'S ON SCREEN</h3>
  <ul>
    <li><strong>{{ELEMENT}}</strong> {{POSITION/SIZE}}.</li>
    <li>{{ELEMENT}} en <code>{{COLOR-CODE}}</code>.</li>
    <li>...</li>
  </ul>
</div>
```

Reglas:
- 3-6 bullets por beat. Más se vuelve denso.
- `<strong>` para nombres de elementos (wordmark, headline, dot, card, etc.).
- `<code>` para valores concretos (hex, fonts, sizes).
- Frases cortas. No oraciones largas.

### 4.3 Panel MOTION

El más importante. Describe **cómo entra, cómo se mueve, cómo sale** cada elemento.

```html
<div class="panel">
  <h3 class="panel-h accent">MOTION</h3>
  <ul>
    <li><strong>{{ELEMENT}}</strong> · <code>{{TYPE}}</code> {{FROM-TO}} (<code class="mono-time">{{T1}}s → {{T2}}s</code>, {{RELATIVE-OR-ABS}}).</li>
    <li><strong>{{ELEMENT}}</strong> · <code>{{TYPE}}</code> con <code>{{EASING}}</code>: {{FROM-TO}} (<code class="mono-time">{{T1}}s → {{T2}}s</code>).</li>
    <li><strong>Hold</strong> con <code>{{LOOP-TYPE}}</code> sutil hasta el fin del beat.</li>
  </ul>
</div>
```

**Reglas de calidad** — repaso del SKILL.md:

| Componente | Ejemplo |
|---|---|
| **Qué se anima** | `wordmark`, `cluster de cards`, `body fila 1` |
| **Tipo** | `slide-up-fade`, `spring`, `scale`, `color-shift`, `stroke-draw`, `node-pulse`, `glow-loop`, `bob` |
| **From → to** | `desde 20px abajo, opacity 0→1`, `scale 0.85 → 1.0`, `blur(8px → 0)` |
| **Timing** | `0.0s → 0.4s` con anotación `relativo al beat` o `absoluto al video` |
| **Easing** | `ease-out-cubic`, `back.out(1.4)`, `sine.inOut`, `cubic-bezier(0.65, 0, 0.35, 1)`, `spring` |

**Hold** — al final del bullet list, indicar qué pasa entre la última entrada animada y el cierre del beat. Por defecto: hold estático. Si hay loop (bob, glow, pulse), explicitarlo con `period` y si es `yoyo`.

### 4.4 Panel AUDIO SYNC

Mini-timeline con cada palabra del JSON dentro del beat y su cue de animación (si la hay).

```html
<div class="panel">
  <h3 class="panel-h cyan">AUDIO SYNC · {{N}} palabras</h3>
  <div class="audio-track">
    <div class="audio-row">
      <span class="audio-time">{{T}}s</span>
      <span class="audio-text">{{TEXT}} <span class="word">{{KEY-WORD}}</span> <span class="cue">{{CUE}}</span></span>
    </div>
    <div class="audio-row">
      <span class="audio-time">{{T}}s</span>
      <span class="audio-text">{{TEXT}}</span>
    </div>
    <div class="audio-row">
      <span class="audio-time">{{T-END}}s</span>
      <span class="audio-text" style="color:var(--fg-muted)"><em>fin del beat — {{NEXT-EVENT}}</em></span>
    </div>
  </div>
</div>
```

Reglas:
- Cada `.audio-row` es **una palabra o un grupo de palabras consecutivas** que comparten cue.
- `.word` resalta la palabra clave de la fila.
- `.cue` se agrega solo si esa palabra dispara una animación. Variantes de color:
  - `.cue` (default, naranja accent) — animación principal del beat.
  - `.cue.purple` — animación secundaria, motion graphic stagger.
  - `.cue.cyan` — animación de subtítulo o text reveal.
- La última fila marca el cierre del beat con `<em>fin del beat — {{NEXT}}</em>` en gris muted.

### 4.5 Note (opcional)

Bloque de anotación para decisiones que el user puede querer debatir.

```html
<div class="note">
  <strong>{{LABEL}}</strong> — {{REASONING}}.
</div>
```

Labels comunes:
- `Nota` — decisión menor.
- `Decisión clave` — algo que define la dirección del video.
- `Idea visual` — interpretación de cómo conectar audio con motion.
- `Trade-off` — propone alternativa explícitamente.
- `Reflexión` — observación post-hoc.

Variante `.note.purple` para notas relacionadas con switches/transiciones.

### 4.6 Beat next

Pointer al evento siguiente. Estructura:

```html
<div class="beat-next">
  <span><span class="next-arrow">→</span> {{EVENT-TYPE}} · {{LABEL}} @ {{T}}S · {{DUR}}S</span>
  <span style="color: var(--fg-muted)">{{ANNOTATION}}</span>
</div>
```

`{{EVENT-TYPE}}` típicos:
- `NEXT · BEAT NN · {{LABEL}}` — beat principal siguiente.
- `NEXT · CROSS-FADE` — transición corta sin sección propia.
- `SWITCH · {{TYPE}}` — switch (frame intermedio) con sección dedicada después.
- `OUTRO · FADE TO BLACK` — al final del último beat.

`{{ANNOTATION}}` es un detalle corto (en mono-time grey) tipo `SIN GAP DE AUDIO`, `MATCH-CUT`, `CLUSTER PERSISTE`, etc.

---

## 5. Switch (frame intermedio)

Misma estructura que un beat pero con clase `.beat.switch` y color tema púrpura.

```html
<section class="beat switch" id="switch-{{N}}-{{M}}">
  <div class="beat-frame">
    <div class="beat-header">
      <div>
        <div class="beat-id">SWITCH · {{TYPE}}</div>
        <h2 class="beat-title">{{ONE-LINER}}</h2>
      </div>
      <span class="beat-time">{{START}}S → {{END}}S · {{DUR}}S</span>
    </div>
    <div class="beat-body">
      <div class="preview">
        <div class="preview-placeholder">
          <span class="preview-placeholder-label" style="color:var(--purple)">{{LABEL}}</span>
          <span class="preview-placeholder-sub">{{SUB-LABEL}}</span>
        </div>
        <span class="preview-tag" style="color:var(--purple)">TRANSITION</span>
      </div>
      <div class="panels">
        <div class="panel">
          <h3 class="panel-h purple">WHAT'S HAPPENING</h3>
          <ul>...</ul>
        </div>
        <div class="panel">
          <h3 class="panel-h purple">MOTION TIMING</h3>
          <ul>
            <li><code class="mono-time">0.00s</code> — {{ACTION}}.</li>
            <li><code class="mono-time">0.20s</code> — {{ACTION}}.</li>
            ...
          </ul>
        </div>
        <div class="note purple">
          <strong>Idea</strong> — {{REASONING}}.
        </div>
      </div>
      <div class="beat-next">
        <span><span class="next-arrow">→</span> NEXT · BEAT {{NEXT}} · {{LABEL}} @ {{T}}S</span>
        <span style="color: var(--fg-muted)">{{ANNOTATION}}</span>
      </div>
    </div>
  </div>
</section>
```

**Diferencias con beat normal:**
- `panel-h` lleva clase `purple` en vez de default.
- Panel principal se llama `WHAT'S HAPPENING` (acción) en vez de `WHAT'S ON SCREEN` (estado).
- Panel `MOTION TIMING` reemplaza `MOTION` — más enfocado en el breakdown temporal porque el switch es 100% movimiento.
- Sin `AUDIO SYNC` por default (los switches viven en gaps de audio). Si la voz cae sobre un switch, sumar el panel `AUDIO SYNC` igual.
- `.note` usa variante `.purple`.

**Si el switch justifica un PNG de referencia visual** (ej: el estado intermedio es complejo y se quiere mostrar), reemplazar `preview-placeholder` por un `<img>` con un PNG generado en el proyecto. El skill no genera ese PNG — lo marca como TODO.

---

## 6. Outro silence

Igual que intro pero al final. Estructura idéntica al `intro` con `EXPORT` reemplazando `MOTION`:

```html
<section class="beat silence" id="outro">
  <div class="beat-frame">
    <div class="beat-header">
      <div>
        <div class="beat-id">OUTRO · FADE</div>
        <h2 class="beat-title">{{ONE-LINER}}</h2>
      </div>
      <span class="beat-time">{{START}}S → {{END}}S · {{DUR}}S</span>
    </div>
    <div class="beat-body">
      <div class="preview">
        <div class="preview-placeholder">
          <span class="preview-placeholder-label">FADE OUT</span>
          <span class="preview-placeholder-sub">→ negro</span>
        </div>
        <span class="preview-tag">FIN</span>
      </div>
      <div class="panels">
        <div class="panel">
          <h3 class="panel-h">WHAT'S ON SCREEN</h3>
          <ul>...</ul>
        </div>
        <div class="panel">
          <h3 class="panel-h accent">EXPORT</h3>
          <ul>
            <li><strong>Render</strong> · {{RES}} · {{FPS}}fps · H.264 · CRF 18.</li>
            <li><strong>Audio</strong> · {{SRC-FORMAT}} downmixed a AAC 192kbps embedded.</li>
            <li><strong>Duración final</strong> · <code class="mono-time">{{DUR}}s</code>.</li>
            <li><strong>Filename</strong> · <code>{{FILENAME}}.mp4</code> en <code>{{PATH}}</code>.</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</section>
```

---

## 7. Footer

```html
<footer class="outro">
  <h2>Plan listo. Esperando lock.</h2>
  <p>Marcá libremente este storyboard — cambios de timing, de motion, de copy, de orden. Una vez lockeado, lo construyo en Remotion siguiendo este doc al pie de la letra.</p>
  <div class="meta">
    <span>{{PROJECT-ID}} · {{LABEL}}</span>
    <span>v{{VERSION}} · {{DATE}}</span>
    <span>STORYBOARD</span>
  </div>
</footer>
```

`{{VERSION}}` arranca en `1`, se incrementa con cada cambio mayor (re-grabar audio, agregar/quitar beats). Cambios menores (rewording de motion, ajustes de timing chiquitos) no bumpean.

---

## Sistema visual completo

Variables CSS al inicio del `<style>`. Reemplazar el `--accent` por el del proyecto (lo demás se mantiene).

```css
:root {
  /* Backgrounds */
  --bg: #0a0a0a;
  --bg-soft: #121212;
  --bg-card: #161616;
  --bg-card-lift: #1c1c1c;
  --line: #232323;
  --line-strong: #2e3244;

  /* Foregrounds */
  --fg: #f5f5f5;
  --fg-mid: #c4c4c4;
  --fg-low: #8a8a8a;
  --fg-muted: #5a5a5a;

  /* Accents (--accent se sobrescribe por proyecto) */
  --accent: #F27A1A;             /* brand: iteralex / itera / shopear */
  --accent-soft: rgba(...);
  --accent-line: rgba(...);
  --purple: #8B6FF0;             /* switches/transitions */
  --purple-soft: rgba(...);
  --cyan: #4FD1C5;               /* audio sync */
  --cyan-soft: rgba(...);

  /* Typography */
  --sans: 'Plus Jakarta Sans', system-ui, sans-serif;
  --serif: 'Newsreader', Georgia, serif;
  --mono: 'JetBrains Mono', 'SF Mono', monospace;
}
```

El CSS completo está en `assets/template.html`. Si el proyecto define un sistema visual diferente, **mantener la familia tipográfica del proyecto en `--sans` y `--serif`** pero conservar `--mono` (JetBrains Mono o equivalente) y la paleta de switches/audio (`--purple`, `--cyan`) — esos son sistema del storyboard, no del proyecto.

---

## Checklist antes de cerrar un storyboard

1. ¿Tiene **un beat por PNG fuente**? Si hay un PNG sin beat, falta cubrirlo. Si hay un beat sin PNG, marcar como TODO.
2. ¿Cada bullet de **MOTION** tiene timing y curva concretos?
3. ¿Cada palabra del JSON aparece en algún **AUDIO SYNC** (al menos como contexto, no necesariamente con cue)?
4. ¿Los **gaps de audio ≥ 0.6s** tienen una sección `switch` que les corresponde?
5. ¿El **timeline visual** tiene proporciones correctas (suma de fr ≈ duración total)?
6. ¿El **footer** tiene `{{PROJECT-ID}}`, versión y fecha?
7. ¿El archivo está guardado en `projects/<slug>/campañas/<stage>/`, no dentro del skill?
8. ¿Los `<img src>` apuntan a paths **relativos** que funcionan con `file://` cuando se abre el HTML local?
