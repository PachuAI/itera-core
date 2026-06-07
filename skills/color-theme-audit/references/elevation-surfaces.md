# Elevation y surfaces — sistema de profundidad

Basado en el video 04 (Whosajid) + patrón surfaces v4.4 ÍTERA Lex. Cubre **profundidad perceptual**, no sombras decorativas.

## Tabla de contenidos

1. Principios
2. Capas canónicas (shell-receding pattern)
3. Tokens de elevation 1/2/3
4. Inset highlight (luz desde arriba)
5. Sombras dark vs light
6. Glow CTA + focus-ring
7. Anti-patrones de elevation
8. Mapeo Tailwind `@theme`

---

## 1. Principios

1. **Depth es jerarquía, no adorno** (video 04). Elevar = importancia o acción. Hundir = contenedor, track, info secundaria.
2. **Tonos reemplazan bordes innecesarios**. Si cada capa tiene su lightness, no hace falta dibujar lines por todos lados.
3. **Sistema antes que efecto suelto**. Las sombras viven en variables. Si cada card inventa su sombra, el sistema se vuelve frágil.
4. **Luz desde arriba**. Inset highlight superior (claro) + sombra inferior (oscura) simulan iluminación natural. Funciona en dark; en light se invierte sutilmente.
5. **Elevation TIENE rangos discretos** (1, 2, 3), no continuos. Cada nivel tiene función:
   - **1**: cards interactivos en grilla (estado default).
   - **2**: hover de cards, popovers, dropdowns.
   - **3**: modales, dialogs, tooltips destacados.

## 2. Capas canónicas (shell-receding pattern)

Patrón validado en producción (ÍTERA Lex, calibrado tras 4 smoke tests). En dark:

```
Layer 0: sidebar/header (recede)        L = 0.075
Layer 1: background (papel)             L = 0.105
Layer 2: card-base (grid container)     L = 0.18   inset top highlight
Layer 3: dialog                         L = 0.135  +3 vs bg
Layer 4: card (popover, dropdown)       L = 0.235  +13 vs bg
Layer 5: brand glow (CTA, accent)       — efecto, no layer
```

En light:

```
Layer 0: sidebar/header (recede)        L = 0.92   papel oscurecido
Layer 1: background (papel cálido)      L = 0.96   bg neutro
Layer 2: card-base (grid container)     L = 0.91   más oscuro que bg
Layer 3: card                           L = 1.0    blanco puro — POP máximo
Layer 4: dialog                         L = 1.0    igual que card
```

**Observación crítica**: en light, `card-base` es **más oscuro** que `background`, mientras `card` es **más claro**. El usuario percibe el `card-base` como "el contenedor que abraza las cards", y las cards "popean" del contenedor hacia el lector. Sin esta inversión sutil, las cards se "amarronan" en light mode.

## 3. Tokens de elevation 1/2/3

Reemplazan `shadow-sm` / `shadow-md` / `shadow-lg` defaults de Tailwind con control por theme.

### Light mode

```css
:root {
  --elevation-1:
    0 2px 4px -1px oklch(0 0 0 / 0.10),
    0 8px 20px -4px oklch(0 0 0 / 0.12);

  --elevation-2:
    0 4px 8px -2px oklch(0 0 0 / 0.12),
    0 16px 32px -8px oklch(0 0 0 / 0.16);

  --elevation-3:
    0 8px 16px -4px oklch(0 0 0 / 0.16),
    0 24px 48px -12px oklch(0 0 0 / 0.22);
}
```

Las sombras tienen **dos capas**: contact (cerca del elemento, 2-8px) + diffusion (lejos, 16-48px). Esto simula luz natural mejor que una sola sombra.

Alpha más alto que dark (10-22%) porque el papel cálido del bg requiere más fuerza para que la sombra se vea.

### Dark mode

```css
.dark {
  --elevation-1:
    0 2px 4px -1px oklch(0 0 0 / 0.4),
    0 8px 20px -4px oklch(0 0 0 / 0.35);

  --elevation-2:
    0 4px 8px -2px oklch(0 0 0 / 0.45),
    0 16px 32px -8px oklch(0 0 0 / 0.4);

  --elevation-3:
    0 8px 16px -4px oklch(0 0 0 / 0.5),
    0 24px 48px -12px oklch(0 0 0 / 0.45);
}
```

Alpha mucho más alto (40-50%) porque negro sobre negro pierde definición sin alpha alto.

## 4. Inset highlight (luz desde arriba)

Token específico para simular relieve sutil en contenedores de grilla. Se aplica a `<section>` que envuelve cards.

```css
/* Dark — 5% blanco superior simula "luz desde arriba" */
.dark {
  --inset-top-highlight: inset 0 1px 0 oklch(1 0 0 / 0.05);
  --folder-card-inset:   inset 0 1px 0 oklch(1 0 0 / 0.05);
}

/* Light — transparent porque el border 1px ya cumple la función */
:root {
  --inset-top-highlight: inset 0 1px 0 transparent;
  --folder-card-inset:   inset 0 1px 0 transparent;
}
```

Uso: `shadow-inset-top-highlight` en Tailwind sobre `<section>` que es contenedor de grid de cards.

## 5. Sombras dark vs light

Resumen comparativo:

| Eje | Light | Dark |
|---|---|---|
| Capas de sombra | 2 (contact + diffusion) | 2 (idem) |
| Alpha contact | 10-16% | 40-50% |
| Alpha diffusion | 12-22% | 35-45% |
| Inset highlight | transparent | 5% blanco |
| Borde de cards | 1px sólido (visible) | 1px sólido (más opaco) |

**Por qué importa la diferenciación**: dark NO es "light pero negro". La física visual cambia (sombras pierden contraste sobre fondo oscuro, inset highlights ganan presencia, borders necesitan más alpha). Migrar sin recalibrar produce el efecto "todo plano en dark".

## 6. Glow CTA + focus-ring

Capa de **decoración funcional** del brand color sobre CTAs y focus states.

### Glow CTA (brand emphasis)

```css
/* Light — alpha más alto porque sobre papel cálido el halo de 30% se perdía */
:root {
  --glow-itera-cta:        0 0 24px oklch(0.65 0.18 55 / 0.42);
  --glow-itera-cta-strong: 0 0 30px oklch(0.65 0.18 55 / 0.62);
}

/* Dark — alpha más bajo, el fondo oscuro ya hace contraste */
.dark {
  --glow-itera-cta:        0 0 24px oklch(0.7 0.18 55 / 0.35);
  --glow-itera-cta-strong: 0 0 30px oklch(0.7 0.18 55 / 0.55);
}
```

Aplicación: utility `.btn-gradient-itera-glow` que aplica `box-shadow: var(--glow-itera-cta)` en estado base y `var(--glow-itera-cta-strong)` en hover.

### Glow soft (borde de marca discreto)

Para superficies que quedan poco delimitadas sobre su bg y necesitan firma de marca sutil sin volverse CTA.

```css
:root {
  --glow-itera-soft:
    0 1px 2px 0 oklch(0 0 0 / 0.06),
    0 4px 16px -4px oklch(0.65 0.18 55 / 0.14);
}

.dark {
  --glow-itera-soft:
    0 0 0 1px oklch(0.78 0.16 55 / 0.14),
    0 4px 20px -4px oklch(0.78 0.16 55 / 0.22);
}
```

### Focus ring (input/textarea/select)

Reemplaza el `ring-2` genérico de shadcn que en dark renderizaba naranja sólido al 100%.

```css
/* Light — 2 capas: contact 1px naranja 35% + diffusion 4px 12% */
:root {
  --focus-ring:
    0 0 0 1px oklch(0.65 0.18 55 / 0.35),
    0 0 0 4px oklch(0.65 0.18 55 / 0.12);
}

/* Dark — luminosity 0.78, alphas 40/16% */
.dark {
  --focus-ring:
    0 0 0 1px oklch(0.78 0.16 55 / 0.4),
    0 0 0 4px oklch(0.78 0.16 55 / 0.16);
}
```

Uso: aplicar a inputs/textareas/selects sobre `focus-visible:`. NO usar `ring-2` genérico de Tailwind sobre brand colors.

## 7. Anti-patrones de elevation

1. **Una sola sombra plana** (ej: `shadow: 0 4px 8px rgba(0,0,0,0.1)`). Sin sistema. Se rompe en dark, en hover, en print.

2. **Usar `bg-card` para info cards de contenido**. En el patrón v4.4, `--card` es la capa más alta (popovers, dialogs). Si la info card de contenido usa `bg-card` directo, queda "amarronada luminosa" en dark. Usar `bg-card-base/50` + `shadow-inset-top-highlight + shadow-elevation-1`.

3. **Sombras sin inset highlight en dark**. Sin la "luz desde arriba" de 5% blanco, las cards se ven empotradas en vez de elevadas.

4. **Borders y sombras compitiendo**. Si el border ya define la card, sombra fuerte la duplica visualmente. Reservar sombra para "elevación" (hover, popover); border para "delimitación" (default).

5. **Mismo alpha en dark y light**. En dark, alpha 10% es invisible; en light, alpha 50% es agresivo. NO copiar valores entre temas.

6. **Glow CTA en elementos no-CTA**. El glow naranja es decoración funcional del brand. Si lo aplicás a una card random, ya no significa "acción primaria".

## 8. Mapeo Tailwind `@theme`

```css
@theme inline {
  --shadow-elevation-1: var(--elevation-1);
  --shadow-elevation-2: var(--elevation-2);
  --shadow-elevation-3: var(--elevation-3);
  --shadow-inset-1:     var(--inset-1);
  --shadow-inset-top-highlight: var(--inset-top-highlight);
  --shadow-folder-card-inset:   var(--folder-card-inset);
  --shadow-glow-itera-soft:        var(--glow-itera-soft);
  --shadow-glow-itera-cta:         var(--glow-itera-cta);
  --shadow-glow-itera-cta-strong:  var(--glow-itera-cta-strong);
  --shadow-focus-ring: var(--focus-ring);
}
```

Uso en componentes:
- `shadow-elevation-1` reemplaza `shadow-sm` o `shadow`.
- `shadow-elevation-2` reemplaza `shadow-md`.
- `shadow-elevation-3` reemplaza `shadow-lg` o `shadow-xl`.
- `shadow-inset-top-highlight` en contenedores de grilla.
- `shadow-glow-itera-cta` en CTAs primarios (o via utility class `.btn-gradient-itera-glow`).
- `shadow-focus-ring` aplicado en `focus-visible:` de inputs.

## 9. Surfaces específicas opcionales (caso-por-caso)

Cada proyecto puede tener surfaces propias bien justificadas. Ejemplos del caso ÍTERA Lex Tools:

- `--folder-card` — surface específica de `<FolderCard>` en grilla tipo Drive.
- `--marketing-hero-bg` — hook dedicado para divergencia futura de marketing.
- `--marketing-glass` — surface "vidrio" sobre fondos always-dark.

**Regla**: estas surfaces no son canónicas. Documentar en el `CLAUDE.md` del proyecto la razón de existencia. Si la razón cae, deprecar la surface.
