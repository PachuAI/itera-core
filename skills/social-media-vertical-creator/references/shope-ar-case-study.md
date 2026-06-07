# Caso de uso validado: shope.ar

Pack de 37 piezas verticales 9:16 generadas en abril 2026. Este documento captura los parámetros exactos que funcionaron y cómo se armó.

---

## Contexto del proyecto

- **Producto**: Shopear (shope.ar) — catálogos online con checkout a WhatsApp
- **Público**: emprendedores argentinos LATAM
- **Mood**: friendly, cercano, mobile-first, no-fricción
- **Canal objetivo**: IG Stories + Reel covers (9:16)

---

## Branding ya resuelto antes de empezar

### Paleta (6 colores)

| Token | Hex | Rol |
|---|---|---|
| `--shope-accent` | `#25D366` | verde WhatsApp — CTA, glow, highlights |
| `--shope-accent-ink` | `#073019` | texto sobre verde (contraste AA) |
| `--shope-bg` | `#000000` | canvas dark |
| `--shope-surface` | `#0a0a0a` | card / panel |
| `--shope-cream` | `#F7F3EC` | fondo cálido alternativo |
| `--shope-navy` | `#0F172A` | fondo oscuro narrativo |

### Tipografía

- **Display**: Baloo 2 (weights 500/600/700/800) — redonda, latam-ready, wordmark y headings
- **UI**: Poppins (weights 400/500/600) — geométrica, body y chips
- **Handwritten**: Caveat — solo para el "papelito" de la pieza 04

### Voice

- Voseo rioplatense: `vos`, `tenés`, `armás`, `compartís`, `vendés`
- Minúsculas sistemáticas: headings, CTA, labels (mayúscula solo en nombres propios)
- Sin signos de exclamación en headlines
- Acentos obligatorios: está, salió, podés, después, catálogo

### Logo

Silueta de persona sentada en un sillón con celular (v7), procesada a PNG transparente negro y blanco en `logo-shope/final/` antes de empezar el pack.

### CTA canónico

- Primario: `entrá a shope.ar →` o `empezá gratis →`
- Pills de status: `gratis para empezar`, `online ahora`, `0 fricción`

---

## Estructura del workspace

```
logo-shope/social/
├── shared.css              (~14 KB, tokens + componentes)
├── index.html              (grid preview con iframes)
├── gallery.html            (viewer con filtros por categoría)
├── render-social.mjs       (~100 líneas, Playwright)
├── assets/
│   ├── logo-black.png
│   └── logo-white.png
├── pieces/
│   ├── 01-hero-punchline.html    ... 37-abuela.html  (37 piezas)
└── out/
    └── *.png                     (37 × 1080×1920)
```

---

## Distribución de las 37 piezas

### Por categoría (badge)

| Badge | Cant. | Piezas |
|---|---|---|
| brand | 2 | 01 hero punchline, 02 wordmark dramático |
| educativo | 2 | 03 tres pasos, 11 carrusel cover |
| hook | 6 | 04 papelito, 05 hola, 06 antes/después, 20 pdf-obsoleto, 24 link-no-clickeable, 25 captura-borrosa |
| producto | 3 | 07 admin mockup, 08 checkout wa, 09 multi-nicho |
| social proof | 1 | 10 contador 5 min |
| feature | 23 | 12 horarios, 13 dominio-propio, 14 sin-código, 15 foto-online, 16 precio-sync, 17 un-link, 18 multi-celu, 19 marca-2-clicks, 21 stock-x40, 22 comisión-13, 23 dólares-shopify, 26 venta-nocturna, 27 fuente-única, 28 abre-al-toque, 29 mobile-desktop, 30 marca-amateur, 31 tres-tocadas, 32 alcance-pulgar, 33 nada-instalar, 34 wifi-flojo, 35 categorías-boutique, 36 foto-zoom, 37 abuela |

### Por modo de fondo

| Modo | Cant. | % |
|---|---|---|
| `mode-dark` | 28 | 76% |
| `mode-cream` | 7 | 19% |
| `mode-navy` | 2 | 5% |
| `mode-wa` | 0 | 0% |

La dominancia de `mode-dark` refleja la identidad dark-first de Shopear. El 19% de cream da respiro sin romper la voz. Los 2 `mode-navy` son wordmarks dramáticos (02 y 07). `mode-wa` fullbleed se evitó por saturación visual.

### Por tipo de visual central

| Visual | Ejemplos |
|---|---|
| WhatsApp chat standalone | 05 hola, 06 antes (arriba) |
| iPhone con catálogo dentro | 18 multi-celu, 31 tres-tocadas |
| Product card zoom | 06 después, 08 checkout-wa |
| Browser/app mockup | 07 admin, 13 dominio-propio |
| Laptop + celu superpuesto | 29 mobile-desktop |
| SVG/HTML ilustrativo | 04 papelito, 10 contador, 20 pdf-obsoleto |
| Sólo tipografía gigante | 02 wordmark |
| Grid de tiles | 09 multi-nicho, 35 categorías-boutique |

---

## Pack inicial (12 piezas, primera tanda)

Estas 12 establecieron el sistema. El resto (25) son profundización temática sobre la base.

1. **01 hero-punchline** — "ponete a **shoppear** en tres simples pasos." + CTA
2. **02 wordmark** — navy, wordmark 340px centrado, tagline debajo
3. **03 tres-pasos** — cream, 1-2-3 con iconos (armá / compartí / vendé)
4. **04 papelito** — "¿cansado de anotar pedidos en **un papelito**?" + SVG papelito Caveat
5. **05 hola** — "¿te escribieron "hola" **14 veces hoy**?" + chat WA con 8 bubbles "hola..."
6. **06 before-after** — split horizontal: arriba desordenado, abajo producto card + CTA
7. **07 admin-mockup** — navy, iPhone con captura del admin
8. **08 checkout-wa** — cart zoomed con 3 items + botón big "pedir por whatsapp"
9. **09 multi-nicho** — grid de 6 tiles mostrando distintos nichos (ropa, joyería, etc.)
10. **10 contador** — cream, número gigante "5 min" + texto "lo que tardás en armar la tienda"
11. **11 carousel-cover** — "3 cosas que podés hacer con shope.ar →" (invitar al swipe)
12. **12 horarios** — feature: horarios de atención auto-publicados

---

## Profundización temática (tanda 2, piezas 13-37)

Cada pieza toca 1 feature o 1 dolor específico. Permite rotación semanal de contenido.

**Dolores abordados**: PDF obsoleto, captura borrosa, link no clickeable, dólares de Shopify, comisión 13%, stock crece x40, venta nocturna sin estar, tres tocadas para comprar, alcance del pulgar, WiFi flojo, fuente única de la verdad, marca amateur (canva), abuela puede usar.

**Features destacados**: dominio propio, sin código, foto online, precio sync, un link, multi-celu, marca 2 clicks, nada instalar, categorías boutique, foto zoom, abre al toque (mobile-first), mobile + desktop.

---

## Escalas tipográficas efectivamente usadas

| Rol | Tamaño usado | Font |
|---|---|---|
| Wordmark dramático (02) | 340px | Baloo 700 |
| H1 punchline hero (01) | 148px | Baloo 600 |
| H1 punchline estándar | 108-130px | Baloo 600 |
| H2 solución | 64-76px | Baloo 600 |
| Body lead | 26-34px | Poppins 400 |
| CTA primario | 26px | Poppins 600 |
| Eyebrow | 18-22px | Poppins 500 upper |
| Chat bubbles | 24-28px | -apple-system |

---

## Tiempos reales de producción

- Bootstrap workspace (templates + assets + shared.css): **~1 hora**
- 12 piezas iniciales (copy + HTML + preview iterativo): **~3 horas**
- 25 piezas de profundización (con el sistema ya aceitado): **~4 horas**
- Rasterizar todo con Playwright: **~40 segundos** (sin paralelismo)

Total: ~8 horas entre branding resuelto y 37 PNGs listos para publicar.

---

## Lessons learned

1. **Pack inicial chico es mejor**: 10-12 piezas te fuerzan a cubrir el arco completo (brand + hook + producto + educativo). Después ampliás con foco temático.
2. **`shared.css` es el leverage**: todo el valor del pipeline está en los tokens centralizados. Pieza por pieza solo cambia copy + visual central.
3. **Visual central es 60% del trabajo**: copy + layout lo resolvés rápido; lo que se lleva el tiempo es el mockup específico de cada pieza (chat, iPhone, laptop, SVG custom).
4. **Repetir mockups está bien**: 3-4 piezas con el mismo chat WA con distinto copy no se percibe como repetitivo en el feed (los usuarios las ven 1 a la vez, separadas por días).
5. **El `gallery.html` con filtros por categoría vale la pena**: al llegar a 30+ piezas, poder filtrar por `hook` vs `feature` ahorra tiempo al revisar con el cliente.
6. **Fuente handwritten (Caveat) uso muy puntual**: rompe la voz si se abusa. Limitar a 1-2 piezas del pack (en shope.ar solo la 04 papelito).
7. **Zona segura IG Story** no es negociable: los primeros ~250px verticales SIEMPRE los tapa el timer/avatar. Todo el pack respeta esa regla dejando esa franja con glow o atmósfera, nunca con texto clave.
8. **Los PNG no son definitivos**: publicar, medir engagement, y re-editar sólo las que no performan. El sistema permite cambios baratos.

---

## Qué hace que este caso sea replicable

Lo que vale la pena transferir a otro proyecto:

- **El esqueleto compositivo** (header + eyebrow + H1 + visual + footer) — funciona para cualquier marca
- **Los primitives reusables** (atmósfera, lockup, CTA, pill, chip, iPhone, WhatsApp chat, browser mock) — cambiando tokens funcionan idénticos
- **La distribución de categorías** (brand / hook / producto / social proof / educativo / feature) — aplica a cualquier producto SaaS
- **El balance de modos** (75% default / 20% alternativo cálido / 5% dramático)
- **La estrategia de 2 tandas** (pack inicial 10-12 + profundización temática 25+)

Lo que NO transfiere y hay que regenerar en cada proyecto:

- Copy específico (voz, dolores, features, nichos)
- Paleta y fuentes (obvio)
- Mockup del producto propio (admin de ese proyecto, no el de shope)
- Los "papelitos" y SVGs custom (son de cada historia)
- El CTA canónico
