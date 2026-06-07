# Ejemplo canónico · Teaser 40 "pregunta" (shope.ar)

**Pieza**: `piece.html` (copia exacta de `logo-shope/social/pieces/40-teaser-pregunta-motion.html`)

**Validado**: 2026-04-22 con el pipeline del skill. Output 336 KB, 6s exactos, 30fps, 1080×1920.

## Por qué este ejemplo

Es la pieza sobre la que se refinó el pipeline. Cubre los casos típicos:

- Reveal escalonado con 3 palabras (`.l3-en` / `.l3-hl` / `.l3-q`) — spans con animation independientes
- Highlight verde en una palabra central (`.hl-accent` + `pop-in`)
- `dot-pulse` infinito en el punto verde del header
- Crossfade cream → dark (`fade-out` + `dark-in` solapados)
- Outro lockup con silueta + wordmark + fecha (staggered con `outro-in` + `fade-slide-up` tardío para la fecha)

## Estructura a imitar

1. **Una `.phase-intro`** envuelve todo el contenido cream. Se le aplica `fade-out` al final.
2. **Un `.overlay-dark`** absolute positioned que se activa en la fase 4.
3. **Una `.phase-outro`** absolute positioned con el lockup. Entra con `outro-in`.
4. **Timings coordinados**:
   - Intro: `animation: fade-out 0.9s ease-in 3.9s both;`
   - Dark: `animation: dark-in 0.9s ease-out 3.95s both;` (50ms overlap)
   - Outro: `animation: outro-in 1.1s cubic-bezier(...) 4.75s both;`

## Fix aplicado durante iteración

**Problema original**: `.line-3` se animaba como un bloque → "en" y "?" aparecían juntos.

**Solución**: dividir en 3 spans `inline-block` con animaciones propias:

```html
<span class="line-3" style="display: block">
  <span class="l3-en">en&nbsp;</span>
  <span class="l3-hl hl-accent">un link</span>
  <span class="l3-q">?</span>
</span>
```

```css
.l3-en { animation: fade-slide-up 0.55s ease-out 1.7s both;  opacity: 0; display: inline-block; }
.l3-hl { animation: pop-in        0.75s ease-out 2.1s both;  opacity: 0; display: inline-block; }
.l3-q  { animation: fade-slide-up 0.5s  ease-out 2.75s both; opacity: 0; display: inline-block; }
```

Esto es **el patrón** para cualquier reveal palabra-a-palabra en este skill.

## Referencia externa

Para ver el MP4 rendered y la galería: `logo-shope/social/motion-out/40-teaser-pregunta-motion.mp4` en el repo shope-ar.
