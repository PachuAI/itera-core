# Keyframe Library

Biblioteca canónica de keyframes del skill `social-motion`. Los 6 primeros vienen incluidos en `piece.html.template` y no hace falta redefinirlos en la pieza.

## Los 6 keyframes base (siempre disponibles en el template)

### 1. `fade-slide-up` — el workhorse

Aparición vertical suave. Usado en el 80% de los elementos (líneas de texto, subtítulos, eyebrows, footer). Es el default.

```css
@keyframes fade-slide-up {
  from { opacity: 0; transform: translateY(28px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

**Cuándo usarlo:**
- Líneas de headline que entran secuenciales
- Subtitle debajo del headline
- Cualquier elemento secundario que necesita presencia pero no protagonismo

**Parámetros típicos:**
- `duration`: 0.55–0.75s (más corto para palabras, más largo para líneas enteras)
- `easing`: `ease-out` (siempre — nunca linear)

### 2. `pop-in` — el acento

Pop con overshoot para dar énfasis. Usado en palabras destacadas, CTAs, highlights.

```css
@keyframes pop-in {
  0%   { opacity: 0; transform: translateY(28px) scale(0.92); }
  70%  { opacity: 1; transform: translateY(0)    scale(1.06); }
  100% { opacity: 1; transform: translateY(0)    scale(1); }
}
```

**Cuándo usarlo:**
- La palabra clave del mensaje (ej: "un link" en el teaser 40)
- Logo/símbolo que aparece con fuerza
- Número/estadística destacada

**Parámetros típicos:**
- `duration`: 0.7–0.85s (el overshoot necesita tiempo)
- `easing`: `ease-out`

**Tip:** combinar con `hl-accent` class del template para que el color cambie al acento.

### 3. `fade-out` — salida simple

Para sacar elementos de escena (ej: fase intro antes de que entre el outro).

```css
@keyframes fade-out {
  from { opacity: 1; }
  to   { opacity: 0; }
}
```

**Cuándo usarlo:**
- Toda la fase intro antes del crossfade a dark
- Un elemento que cumplió su rol y debe dejar espacio

**Parámetros típicos:**
- `duration`: 0.7–1.0s
- `easing`: `ease-in`

### 4. `dark-in` — crossfade a dark

El overlay que tapa la escena cream y deja el terreno oscuro para el outro.

```css
@keyframes dark-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}
```

**Cuándo usarlo:**
- Solo en `.overlay-dark` (ya en el template)
- Cambio de "modo" visual (cream → dark)

**Parámetros típicos:**
- `duration`: 0.8–1.0s
- `easing`: `ease-out`
- `delay`: suele solaparse ~50ms con el final del `fade-out` del intro para evitar "pop" visible

### 5. `outro-in` — entrada del lockup

Scale + fade del bloque de marca final.

```css
@keyframes outro-in {
  from { opacity: 0; transform: scale(0.92); }
  to   { opacity: 1; transform: scale(1); }
}
```

**Cuándo usarlo:**
- Solo en `.phase-outro` (ya en el template)
- Momento hero del final de la pieza

**Parámetros típicos:**
- `duration`: 1.0–1.2s
- `easing`: `cubic-bezier(0.2, 0.8, 0.2, 1)` (más sofisticado que `ease-out`)
- `delay`: ~100–200ms después de que el `dark-in` está casi completo

### 6. `dot-pulse` — indicador loopeado

Pulso infinito. Para indicar "en vivo", "cargando", "esperando".

```css
@keyframes dot-pulse {
  0%, 100% {
    box-shadow: 0 0 14px var(--accent-glow), 0 0 0 0 var(--accent-ring);
    transform: scale(1);
  }
  50% {
    box-shadow: 0 0 24px var(--accent-glow), 0 0 0 10px rgba(0, 0, 0, 0);
    transform: scale(1.14);
  }
}
```

**Cuándo usarlo:**
- Puntito verde de "actividad" (top-right del teaser)
- Elemento decorativo que quiere atención sutil

**Parámetros típicos:**
- `duration`: 1.4s
- `easing`: `ease-in-out`
- `iteration-count`: `infinite`
- Combinar con entrada: `animation: fade-slide-up 0.6s ease-out 0.1s both, dot-pulse 1.4s ease-in-out 1.0s infinite;`

## Combinaciones recomendadas

### Línea dividida en palabras (reveal escalonado)

Para mensajes tipo "en un link ?" donde querés revelar palabra a palabra:

```html
<span class="line-3">
  <span class="l3-word-a">en&nbsp;</span>
  <span class="l3-word-b hl-accent">un link</span>
  <span class="l3-word-c">?</span>
</span>
```

```css
.l3-word-a { animation: fade-slide-up 0.55s ease-out 1.7s both;  opacity: 0; display: inline-block; }
.l3-word-b { animation: pop-in        0.75s ease-out 2.1s both;  opacity: 0; display: inline-block; }
.l3-word-c { animation: fade-slide-up 0.5s  ease-out 2.75s both; opacity: 0; display: inline-block; }
```

**Regla crítica**: cada `<span>` debe ser `display: inline-block` para que `transform: translateY()` funcione.

**Regla crítica 2**: `both` en la animation shorthand es necesario para que `opacity: 0` inicial persista hasta que arranque el delay.

### Crossfade cream → dark con outro

Este es el patrón del teaser 40. Timings relativos:

```css
.phase-intro  { animation: fade-out   0.9s ease-in  3.9s  both; }
.overlay-dark { animation: dark-in    0.9s ease-out 3.95s both; }
.phase-outro  { animation: outro-in   1.1s cubic-bezier(0.2,0.8,0.2,1) 4.75s both; }
```

Solapamiento planificado:
- 3.9–4.8s: intro fade out mientras dark-in crece
- 4.75–5.85s: outro aparece encima del fondo ya oscuro

## Reglas generales

1. **Siempre `both` en la shorthand** cuando uses `opacity: 0` como estado inicial en la clase. Sin `both`, la regla inicial no se aplica antes del delay y el elemento flashea visible al cargar.
2. **Siempre `ease-out` por default**, excepto salidas que usan `ease-in`.
3. **No mezclar `animation` con `transition`** en el mismo elemento para el mismo property — se pisan.
4. **`transform: translateY` requiere `display: inline-block`** en spans. En divs y elementos block no hace falta.
5. **Las animaciones que se solapan con crossfades**: dale 50ms de overlap para evitar frames con "gap" perceptible.

## Extensiones futuras (V2)

Keyframes planeados pero no en V1:

- `typewriter` — texto que aparece letra a letra
- `glitch` — distorsión breve con chromatic aberration
- `ken-burns` — scale + translate lento de fondo
- `wipe-in` — reveal por clip-path horizontal
- `countdown` — números que cuentan hacia abajo

Para usarlos ahora: definirlos inline en el `{{KEYFRAMES_BLOCK}}` de la pieza.
