# Sistema de color — roles canónicos y construcción dark/light

Basado en el método del video 06 (Whosajid) + patrón surfaces v4.4 validado en ÍTERA Lex (proyecto SaaS).

## Tabla de contenidos

1. Principios
2. Familias funcionales: neutrales / brand / semantic
3. Roles canónicos completos
4. Dark + light como pares calibrados (no inversión)
5. Lightness como eje operativo
6. HSL vs OKLCH — cuándo cada uno
7. Mapeo Tailwind v4 `@theme inline`
8. Foreground siempre con su background
9. Hover / focus / active states

---

## 1. Principios

1. **Color funcional, no decorativo**. Cada color cumple un rol: lectura, acción, jerarquía, estado, profundidad. Si un color no nombra su rol, no entra al sistema.
2. **Tres familias bastan** (video 06): neutrales (estructura), brand primary (acción / identidad), semantic (estado). Todo lo demás es derivado.
3. **Dark y light como pares calibrados**, NO inversión automática `100 - L`. Cada modo se construye con su propia física visual.
4. **Lightness es el eje principal** para construir capas y jerarquía. Hue y saturation viene después.
5. **OKLCH preferido sobre HSL** en escalas perceptuales. HEX/RGB solo en legacy o cuando no hay alternativa.
6. **Foreground siempre con su background**. Nunca declarar `--text-on-X` sin nombrar contra qué `--X` se mide contraste.

## 2. Familias funcionales

### Neutrales

Estructuran la interfaz: fondos, superficies, texto, bordes. Son la mayoría visible.

### Brand primary (acción / identidad)

Un color (a veces 2: primary + accent). Aplica a CTAs, links principales, focus rings, marca. NO es semántico — no comunica éxito o error.

### Semantic colors

Comunican estado: éxito, warning, error/destructive, info. Tienen foreground propio para el badge/pill. NO mezclar con brand primary aunque visualmente sean parecidos.

## 3. Roles canónicos completos

El sistema mínimo de roles que un proyecto profesional necesita. No todos van a aplicar en todos los proyectos; estos son los nombres canónicos.

```css
:root {
  /* --- Background layers --- */
  --background: ...;         /* Bg principal de la app */
  --foreground: ...;         /* Texto principal sobre background */

  /* --- Surface (interactivas o destacadas sobre background) --- */
  --card: ...;               /* Cards genéricas, popovers, dropdowns */
  --card-foreground: ...;
  --card-base: ...;          /* Contenedor de grilla de cards (capa intermedia) */
  --dialog: ...;             /* Surface de modales */
  --popover: ...;            /* Popovers, tooltips, menus */
  --popover-foreground: ...;

  /* --- Secondary / muted (apoyos) --- */
  --secondary: ...;          /* Botones secondary, badges neutros */
  --secondary-foreground: ...;
  --muted: ...;              /* Surface de menor jerarquía */
  --muted-foreground: ...;   /* Texto secundario (fechas, metadata) */
  --accent: ...;             /* Hover de items, sub-acentos neutros */
  --accent-foreground: ...;

  /* --- Borders & inputs --- */
  --border: ...;             /* Separadores, bordes de cards */
  --input: ...;              /* Borde de inputs */
  --ring: ...;               /* Focus ring outline */

  /* --- Brand primary --- */
  --primary: ...;             /* Brand color para CTAs y acciones */
  --primary-foreground: ...;  /* Texto sobre primary */

  /* --- Semantic states --- */
  --success: ...;
  --success-foreground: ...;
  --warning: ...;
  --warning-foreground: ...;
  --destructive: ...;
  --destructive-foreground: ...;
  --info: ...;
  --info-foreground: ...;

  /* --- App shell específicos (caso multi-pane) --- */
  --sidebar: ...;             /* Surface del shell sidebar */
  --sidebar-foreground: ...;
  --sidebar-border: ...;
  --sidebar-accent: ...;       /* Item activo del sidebar */
  --sidebar-accent-foreground: ...;

  /* --- Texto sobre superficies SIEMPRE oscuras (overlays, hero, footer) --- */
  --text-on-dark-strong: ...; /* Texto principal sobre fondo always-dark */
  --text-on-dark: ...;
  --text-on-dark-muted: ...;
}
```

Cada uno **debe nombrar su rol** (background, surface, foreground, border, accent) y NO repetir nombres por apariencia (`--gray-100`, `--gray-200`).

## 4. Dark + light como pares calibrados

El video 06 lo nombra explícito: "restar L de 100 es punto de partida, no resultado".

### Filosofía: depth invertida

En **dark mode**, las superficies más altas (cards, popovers) son **más claras** que el fondo.

En **light mode**, las superficies más altas son **más oscuras** que el fondo (papel cálido / blanco roto), excepto las cards que siguen siendo más claras (porque "popean" hacia adelante).

Esto NO es inversión automática. Es física visual: en dark, la luz viene de arriba (las cosas que reciben más luz parecen más cercanas); en light, la luz también viene de arriba, pero el papel base ya es claro, así que las superficies superiores se diferencian con sombra + leve tinte.

### Patrón surfaces v4.4 (ÍTERA Lex, calibración 2026-05)

```css
/* Dark mode — shell receding pattern */
.dark {
  --background:   oklch(0.105 0 0);   /* near black */
  --sidebar:      oklch(0.075 0 0);   /* -3 vs bg — recede */
  --card-base:    oklch(0.18 0 0);    /* +7.5 vs bg — contenedor de grilla */
  --card:         oklch(0.235 0 0);   /* +13 vs bg — popover, dropdown, dialog */
  --foreground:   oklch(0.985 0 0);   /* near white */
  --muted-foreground: oklch(0.75 0 0); /* ~8:1 sobre bg */
}

/* Light mode — papel cálido pattern */
:root {
  --background:   oklch(0.96 0.004 85);   /* papel cálido (no blanco puro) */
  --sidebar:      oklch(0.92 0.006 85);   /* -4 vs bg — shell recede */
  --card-base:    oklch(0.91 0.004 85);   /* +5 vs sidebar, +5 vs bg — contenedor */
  --card:         oklch(1 0 0);           /* blanco puro — POP máximo */
  --foreground:   oklch(0.145 0 0);       /* near black */
  --muted-foreground: oklch(0.45 0 0);    /* ~7:1 sobre bg cálido */
}
```

Observar:
- **Dark**: card es +13 vs bg, dirección "subir L".
- **Light**: card es **más claro** que bg (1.0 vs 0.96), dirección "subir L también" — pero el sidebar **baja** L (0.92 vs 0.96) para recede.
- Los deltas NO son simétricos. La calibración se hace **por ojo + contraste medido**, no por fórmula.

## 5. Lightness como eje operativo

Cuando el contraste del texto principal ya está al máximo (cerca de 0 en dark o cerca de 1 en light), **se crea jerarquía bajando lo secundario**, no subiendo el principal (video 11).

Aplicaciones:

- `muted-foreground` en dark suele estar en L `0.65-0.75`. Por debajo de 0.65 pierde legibilidad.
- `muted-foreground` en light suele estar en L `0.42-0.50`. Por encima de 0.55 se vuelve pálido sobre papel cálido.
- Surface deltas: cards 7-15 puntos arriba de bg en dark; -3 a -5 en light para shell receding.

## 6. HSL vs OKLCH

| Formato | Cuándo usar |
|---|---|
| HEX | Solo legacy. NO empezar con HEX. |
| RGB | Idem HEX. |
| HSL | Aceptable para razonar rápido y para legacy alignment. Lightness operativa. |
| **OKLCH** | **Preferido** para escalas perceptuales (cards en grilla, neutrales por L), brand colors con chroma estable, y dark+light pares calibrados. Tailwind v4 / shadcn lo usa nativo. |

El video 06 lo señala: HSL pierde saturación en extremos; OKLCH mantiene incrementos perceptualmente naturales.

Si el proyecto está en HSL y migrar a OKLCH es scope grande, **Fase 6** (opcional) del plan; el resto del audit no depende de la migración.

## 7. Mapeo Tailwind v4 `@theme inline`

Patrón canónico:

```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);

  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-card-base: var(--card-base);
  --color-dialog: var(--dialog);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);

  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);

  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);

  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);

  --color-success: var(--success);
  --color-success-foreground: var(--success-foreground);
  --color-warning: var(--warning);
  --color-warning-foreground: var(--warning-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-info: var(--info);
  --color-info-foreground: var(--info-foreground);

  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);

  --color-text-on-dark-strong: var(--text-on-dark-strong);
  --color-text-on-dark: var(--text-on-dark);
  --color-text-on-dark-muted: var(--text-on-dark-muted);
}
```

Después se consumen como `bg-card`, `text-muted-foreground`, `border-border`, etc.

## 8. Foreground siempre con su background

Cada `*-foreground` se mide contra su `*` correspondiente. Pares mínimos a validar WCAG AA (4.5:1 para body, 3:1 para large text):

| Background | Foreground | Mínimo WCAG |
|---|---|---|
| `--background` | `--foreground` | 4.5:1 |
| `--background` | `--muted-foreground` | 4.5:1 |
| `--card` | `--card-foreground` | 4.5:1 |
| `--popover` | `--popover-foreground` | 4.5:1 |
| `--primary` | `--primary-foreground` | 4.5:1 (4.5 si es body, 3:1 si solo es UI) |
| `--success` | `--success-foreground` | 4.5:1 |
| `--warning` | `--warning-foreground` | 4.5:1 |
| `--destructive` | `--destructive-foreground` | 4.5:1 |
| `--sidebar` | `--sidebar-foreground` | 4.5:1 |
| `--sidebar-accent` | `--sidebar-accent-foreground` | 4.5:1 |

NO declarar foregrounds sin medir contraste.

## 9. Hover / focus / active states

Cada role interactivo necesita estados que comuniquen affordance:

- **Hover**: cambio sutil de L (±5%) o aplicación de `--accent` / `--muted` como overlay.
- **Focus visible**: aplicar `--ring` con offset. Usar `box-shadow` token (`--focus-ring`) que sea consistente, no `ring-2` genérico.
- **Active**: presionado, cambio leve (filter brightness 0.95 o L -3%).
- **Disabled**: `opacity-50` con cursor adecuado.

Para CTAs brand:

```css
--itera-hover: oklch(0.55 0.17 55); /* L -3 vs base */
--itera-subtle: oklch(0.62 0.18 55 / 12%); /* fondo subtle: brand al 12% alpha */
```

NO replicar a mano estos cálculos en cada componente. Tokenizar.
