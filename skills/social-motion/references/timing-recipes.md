# Timing Recipes

Recetas de timing por tipo de pieza. Son puntos de partida, no reglas fijas — iterar siempre.

Notación: `[inicio – fin]s` · `evento` (duración aproximada del evento)

---

## Teaser 6s (default para story/reel intrigante)

**Intención**: generar curiosidad, abrir una pregunta o afirmación, cerrar con marca.

```
0.0–1.2s   línea 1 entra (fade-slide-up 0.7s @ 0.2s delay)
1.2–1.9s   línea 2 entra (fade-slide-up 0.7s @ 1.2s delay)
1.7–2.85s  línea 3 staggered:
             · word-a  @ 1.7s  (fade-slide-up 0.55s)
             · word-b  @ 2.1s  (pop-in 0.75s, highlight)
             · word-c  @ 2.75s (fade-slide-up 0.5s)
3.1–3.8s   subtitle entra (fade-slide-up 0.7s @ 3.1s delay)
3.9–4.8s   intro fade-out (fade-out 0.9s @ 3.9s)
3.95–4.85s dark overlay in (dark-in 0.9s @ 3.95s, solapado)
4.75–5.85s outro lockup in (outro-in 1.1s @ 4.75s)
5.4–6.1s   outro-date fade-in (fade-slide-up 0.7s @ 5.4s)
```

**Pieza base**: top eyebrow + dot-pulse (entra en 0.0–0.5s) + pregunta grande + subtitle + footer con logo chico + fecha.

**Validado en**: `examples/teaser-40-pregunta/` (shope.ar, abril 2026).

---

## Hook 3s (impacto rápido para grab attention)

**Intención**: los primeros segundos para retener al usuario que hace swipe. No hay outro — todo es hook.

```
0.0–0.4s   elemento 1 (pop-in 0.5s @ 0s) — palabra/imagen fuerte
0.4–0.9s   elemento 2 (fade-slide-up 0.5s @ 0.4s) — contexto
0.9–1.8s   elemento 3 (pop-in 0.8s @ 0.9s) — payoff/curiosidad
1.8–2.8s   hold (elementos quedan visibles)
2.8–3.0s   micro-fade del conjunto (fade-out 0.2s @ 2.8s, opcional si loopea)
```

**Tip**: como es corto, conviene que el frame final sea "pregunta abierta" o imagen fuerte — el reel va a loopear y eso es el gancho para que el user mire 2 veces.

---

## Anuncio 8s (mensaje + beneficio + CTA)

**Intención**: explicar algo concreto (lanzamiento, feature, evento) y cerrar con CTA.

```
0.0–1.2s   hook (fade-slide-up 0.8s @ 0.2s) — titular
1.2–3.2s   mensaje principal (pop-in 0.7s @ 1.5s + fade-slide-up 0.6s @ 2.3s)
3.2–5.2s   beneficios (3 bullets con stagger 0.3s entre cada uno)
5.2–6.2s   intro fade-out + dark-in
6.2–7.8s   outro lockup + CTA
7.8–8.0s   hold en CTA
```

**Regla**: el CTA debe quedar visible mínimo 1.5s al final para que se pueda leer y memorizar.

---

## Outro puro 4s (lockup de marca aislado)

**Intención**: usar como cierre de video más largo (editable en Premiere), intro/outro de podcast, separador entre escenas.

```
0.0–0.3s   fondo dark in (fade-in 0.3s)
0.3–1.4s   silueta + wordmark (outro-in 1.1s @ 0.3s)
1.4–2.2s   fecha/claim (fade-slide-up 0.8s @ 1.4s)
2.2–3.5s   hold
3.5–4.0s   micro-fade-out (opcional, 0.5s @ 3.5s)
```

---

## Reveal de producto 8s (showcase)

**Intención**: mostrar un producto/feature con captura, zoom, detalles.

```
0.0–1.0s   fondo entra (dark-in 1.0s)
1.0–2.5s   imagen del producto aparece (pop-in 1.5s @ 1.0s, scale más suave: 0.88 → 1)
2.5–4.5s   etiquetas de features aparecen (3 con stagger 0.5s entre sí)
4.5–6.5s   hold + subtle ken-burns (scale 1 → 1.05 en 2s)
6.5–7.5s   CTA aparece (fade-slide-up 0.8s @ 6.5s)
7.5–8.0s   hold
```

**Nota**: `ken-burns` no está en la librería base V1. Definirlo inline.

---

## Pregunta + revelación 10s (hooked storytelling)

**Intención**: abrir con pregunta, dejar beat, revelar respuesta, cerrar con marca.

```
0.0–1.5s   setup: pregunta entra (fade-slide-up stagger por línea)
1.5–3.5s   dramática pausa (solo eyebrow pulsando, resto estático)
3.5–5.5s   respuesta aparece (pop-in palabra clave 0.8s + línea complementaria 0.6s)
5.5–7.0s   beneficio o expansión (fade-slide-up)
7.0–8.5s   intro fade-out + dark-in
8.5–10s    outro lockup
```

---

## Reglas generales de timing

### Duraciones típicas por evento

| Elemento | Duración |
|---|---|
| Entrada de palabra suelta | 0.4–0.6s |
| Entrada de línea de texto | 0.6–0.8s |
| Pop-in con énfasis | 0.7–0.85s |
| Fade-out de una fase | 0.7–1.0s |
| Dark-in overlay | 0.8–1.0s |
| Outro lockup entrada | 1.0–1.2s |

### Delays entre elementos secuenciales

- **Staggered líneas de texto**: 0.9–1.0s entre inicio de línea N y N+1
- **Staggered palabras en una línea**: 0.3–0.5s entre palabras
- **Staggered bullets en lista**: 0.3s entre cada bullet

### Solapamientos críticos

- **Fade-out + dark-in**: deben solaparse 50ms mínimo, sino hay "flash" visible
- **Dark-in + outro-in**: delay del outro debe ser ~80% del duration del dark-in (ej: dark-in 0.9s @ 3.95s → outro @ 4.75s)

### Duración mínima de "hold"

Todo elemento importante debe quedar visible mínimo **0.8s** antes de que algo lo tape. Más corto que eso = "no se alcanza a leer".

### Loopeabilidad

Si la pieza va a loopear (default en reels/stories):

- El último frame debe ser "cerrable": el outro o un frame con la marca legible
- Evitar terminar en fade-out completo a negro, porque el loop mostraría "pantalla negra → pregunta" y se ve como glitch
- Preferir que el outro quede fijo en el último frame 0.3s antes del cut
