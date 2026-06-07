# Anti-patrones — qué NO conviene hacer

Errores comunes al diseñar / migrar sistemas de color y temas. Si tentás uno de estos, releé esto antes de avanzar.

## 1. No usar inversión automática `100 - L` para construir dark mode

**Razón**: el video 06 (Whosajid) lo dice claro — restar lightness de 100 da un punto de partida, no un resultado. Las superficies altas son **más claras en dark** y **más oscuras en light** (depth invertida). Las sombras necesitan más alpha en dark. Los borders necesitan recalibrar opacidad. Una inversión ciega produce cards "amarronadas", sombras invisibles, muted text ilegible.

**Regla**: dark y light son pares calibrados. Cada token tiene valor propio en cada modo, decidido por física visual + contraste WCAG.

## 2. No usar utility classes Tailwind palette en lugar de tokens

```tsx
/* MAL */
<span className="text-emerald-500 bg-emerald-50">
  Activo
</span>

/* BIEN */
<span className="text-success bg-success/15">
  Activo
</span>
```

**Razón**: `emerald-500` está fijado al theme. NO cambia con dark/light. NO refleja la identidad de marca del proyecto. Acumular estos colores construye un sistema paralelo al de tokens.

**Regla**: cualquier color que comunique estado/jerarquía/rol debe venir de un token semántico. Tailwind palette solo en charts o donde la marca no aplica.

## 3. No mezclar `--primary` con semantic colors

**Razón**: el brand primary comunica **acción** ("hacé click acá"). Los semantic communican **estado** ("esto salió bien / esto falló"). Si ambos tienen hues cercanos (ej: brand naranja + warning amarillo), el usuario confunde botones con notificaciones.

**Regla**: si el brand es naranja, el warning va más al amarillo o al ámbar puro. Si el brand es azul, el info va al cyan o se reemplaza por gris azulado. Validar la paleta como conjunto.

## 4. No declarar `--text-on-X` sin nombrar contra qué `--X` se mide

**Razón**: un foreground es relativo a su background. Si declarás `--text-emphasis` sin decir "sobre qué", el componente no sabe qué contraste validar.

**Regla**: nombrar siempre el par. `--card-foreground` se mide contra `--card`. `--text-on-dark-strong` se mide contra superficies always-dark (overlays, footers). Si necesitás un texto que viva sobre dos bgs distintos, son dos tokens.

## 5. No usar `ring-2` o `ring-3` genérico de Tailwind para focus visible

**Razón**: el `ring-2` aplica un border outline al 100% del color brand. En dark, eso es un trazo naranja sólido que se ve agresivo. El video 04 y la calibración v4.4 prefieren un focus ring de 2 capas con alphas calibrados.

**Regla**: tokenizar `--focus-ring` con 2 capas (contact 1px alpha 35-40% + diffusion 4px alpha 12-16%). Aplicar via utility class `.focus-ring` o `focus-visible:shadow-focus-ring`.

## 6. No usar `bg-card` para info cards de contenido

**Razón**: en el patrón surfaces v4.4, `--card` es la capa más alta (popovers, dropdowns, dialogs). Si una info card de contenido genera con `bg-card` directo, queda "amarronada luminosa" en dark mode (color demasiado alto para una info card que debería sentirse "asentada en el grid").

**Regla**: info cards de contenido usan `bg-card-base/50 shadow-inset-top-highlight shadow-elevation-1`. `bg-card` se reserva para popovers/dropdowns/dialogs.

## 7. No copiar elevation entre dark y light

**Razón**: en dark, sombras necesitan alpha 40-50% para ser visibles. En light, alpha 10-22% es suficiente; más es agresivo. Si copiás los valores, en un modo se pierden y en el otro se sienten torpes.

**Regla**: cada `--elevation-N` tiene su par dark/light recalibrado por separado.

## 8. No deprecar HSL/HEX globalmente con find/replace

**Razón**: convertir HSL a OKLCH sin recalibrar los hues produce shifts visuales (HSL y OKLCH no son equivalentes mecánicos, especialmente en chroma). Una migración cruda rompe la paleta.

**Regla**: si el repo está en HSL/HEX y querés migrar a OKLCH, **Fase 6** (opcional) del plan. Hacerlo color por color, validando visualmente. NO en una sola pasada.

## 9. No tocar `--text-on-dark-*` con `.dark` override

**Razón**: estos tokens son **valores absolutos** sobre superficies que siempre son oscuras (overlays sobre imágenes, footers always-dark, hero sections). Si los redefinís en `.dark`, dejan de ser "absolutos" y el efecto deseado se pierde.

**Regla**: `--text-on-dark-strong`, `--text-on-dark`, `--text-on-dark-muted` se declaran SOLO en `:root` y NO se overridean en `.dark`. Documentar esta excepción en el reporte.

## 10. No agregar nuevos tokens semánticos "por las dudas"

**Razón**: cada token agregado es deuda visual a mantener. `--info-stronger`, `--warning-soft`, `--card-elevated` que no se usan en ningún lado solo confunden.

**Regla**: agregar un token solo cuando hay 2+ componentes que lo van a usar y la alternativa (override inline) es peor. Si surge la duda, NO agregarlo.

## 11. No usar `style={{ color }}` o `style={{ background }}` inline

**Razón**: bypass total del sistema de tokens. Imposible de mantener consistente entre modos. Imposible de auditar.

**Regla**: si necesitás color dinámico (ej: una card con color por categoría), usar CSS custom properties locales que apunten a tokens, no hardcodear hex/oklch.

## 12. No introducir gradients sin sistema

**Razón**: un gradient suelto en un componente no se puede recolorear a través del theme. Mezclar gradients hardcoded con tokens crea inconsistencia visual en theme toggle.

**Regla**: tokenizar gradients comunes (`--gradient-cta-from`, `--gradient-cta-to`) y reusar via utility class. Para casos one-off, declarar local variable que use tokens.

## 13. No combinar `border` y `shadow` fuerte en la misma card

**Razón**: si la card ya tiene border 1px que la delimita, una shadow-elevation-2 también encima la duplica visualmente. Termina pareciendo flotante demasiado.

**Regla**: border = "delimitación" (default state). Shadow = "elevación" (hover, popover, modal). Combinar solo cuando hay justificación clara (ej: card-base + elevation 1 + inset highlight para "grilla con relieve").

## 14. No alterar el `--ring` global para focus de marca

**Razón**: shadcn usa `--ring` para focus outline genérico. Si lo cambiás al brand color, todos los focus visible se vuelven naranjas (incluyendo donde no querés). Eso rompe la jerarquía: ya no se distingue focus en CTA primario vs focus en input secondary.

**Regla**: usar `--focus-ring` token específico para CTAs/inputs de marca. Mantener `--ring` como neutral. Aplicar `--focus-ring` selectivamente.

## 15. No olvidar `prefers-color-scheme` y `prefers-reduced-motion`

**Razón**: los toggles `class="dark"` son user-controlled, pero el primer paint depende del prefer-color-scheme del sistema. Si el primer paint es light pero el usuario tiene dark forzado, hay "flash" de tema incorrecto.

**Regla**: combinar `next-themes` (o equivalente) con `prefers-color-scheme` media query como fallback. Validar el flash en una vista al recargar.

## 16. No crear el reporte sin chequear si ya existe

**Razón**: sobrescribir un audit previo destruye el histórico.

**Regla**: si `.planning/COLOR-THEME-AUDIT.md` ya existe, preguntar al usuario. Default: usar suffix `-vN.md`.

## 17. No inferir valores de L desde el CSS declarado en lugar de medir

**Razón**: muchos componentes usan `bg-card-base/50`, `bg-itera-subtle` (12% alpha), gradients, overlays. El L renderizado en la pantalla es el resultado del **blending** entre la capa y lo que tiene debajo, NO el L del token absoluto. Si declarás "card-base = 0.18" porque el token dice 0.18 pero el componente lo aplica con `/50` sobre `bg 0.105`, el L real visible es ~0.14 — un error de 4 puntos sobre 25 = 16% de error. Hereda a todos los deltas y conclusiones.

Además: inferir es **decir que medís cuando no medís**. Rompe la confianza en el reporte completo. Si quien lo lee detecta que un valor es inventado, sospecha del resto.

**Regla**: para el inventario de capas perceptuales (§1 del checklist), usar `scripts/sample-layers.mjs` sobre las screenshots. Reportar las coordenadas muestreadas. Si no se puede medir, declarar `L no medido — razón concreta` por cada capa. NO inventar números intermedios.

## 18. No correr el audit en una sola resolución sin pensar

**Razón**: aunque para color basta UNA resolución (a diferencia de responsive), elegir 1366×768 te deja capturas chicas que esconden problemas de gradients largos, sombras de gran difusión, surfaces extendidas en 4K.

**Regla**: capturar en 1920×1080 por default. Esto exhibe shadows con su difusión completa y permite ver surfaces a tamaño real. Solo bajar a 1366 si el proyecto target lo tiene como base mandatoria.
