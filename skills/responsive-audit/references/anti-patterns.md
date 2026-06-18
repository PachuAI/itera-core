# Anti-patrones — qué NO conviene hacer

Lista canónica de errores comunes al diseñar sistemas responsive desktop-first. Cada uno tiene su razón. Si el usuario o tu razonamiento te lleva a uno de estos, releé esto antes de avanzar.

## 1. No escalar TODO con `vw`/`clamp()`

**Razón**: convierte la interfaz en un acordeón continuo. Rompe ritmos verticales, descalibra ergonomía de click (controles que crecen con el viewport pero el cursor del SO sigue siendo del mismo tamaño físico) y deshace la previsibilidad que la marca ya ganó.

**Regla**: reservar `clamp()` para los 6 protagonistas (header, sidebar, main-max-w, main-pad-x/y, h1, body). El resto, `rem` fijo.

## 2. No usar zoom global

```css
/* MAL */
html { font-size: clamp(0.875rem, 0.5vw + 0.7rem, 1.25rem); }
```

**Razón**: es la solución barata; rompe todo lo que use `px` arbitrary, descalibra los `oklch` color stops que dependen del rendering exacto, y produce el problema "todo grande" sin resolver el "espacio muerto" (que es de layout, no de tipografía).

**Regla**: mantener `html { font-size: 16px }` (o sin override). Escalar tipografía con tokens específicos.

## 3. No mover `--sidebar-width` a `vw` puro

```css
/* MAL */
--sidebar-width: 12vw;
```

**Razón**: el sidebar pasa a 5% del viewport en 4K (~190px) o 8% en 1366 (~110px). Su contenido es texto con labels finitos → tiene un mínimo natural ≈ 240px. En 4K sí puede crecer un poco para no parecer un hilo.

**Regla**: `clamp(15rem, 12rem + 4vw, 18rem)`. Cap inferior protege la legibilidad del label más largo; cap superior evita que se coma el main.

## 4. No agregar container queries por defecto

**Razón**: `container-type: inline-size` afecta performance de render y rompe `position: sticky` en algunos descendientes (Safari < 16, comportamientos inconsistentes con `overflow: hidden`). Crear un contenedor cuando no se va a usar es complejidad sin retorno.

**Regla**: opt-in donde la decisión sea "el componente cambia de forma según su padre directo", no "por las dudas".

## 5. No introducir density mode (compact/comfortable) sin validar

**Razón**: es complejidad cara. Un toggle de density duplica las decisiones de spacing y obliga a mantener dos sets paralelos. Difícil de cubrir en QA.

**Regla**: aplicar Fases 1-5 primero. Si después de la 5 el cliente sigue pidiendo "más compacto", evaluar como Fase 6 opcional con scope acotado (un solo set de tokens variant, no un sistema dual).

## 6. No cambiar paleta ni tokens semánticos existentes

**Razón**: los tokens de color, surfaces y elevation están calibrados con WCAG AA. Mezclar la auditoría responsive con cambios de color triplica el riesgo de regresión y desalinea del SSOT si lo hay.

**Regla**: la auditoría es **dimensional** (typography, spacing, layout). Color, contrast, elevation se tratan en su propia auditoría aparte.

## 7. No tocar el theme system

**Razón**: `next-themes` / theme transition / oklch color stops son sistemas ortogonales al problema dimensional. Tocarlos sin necesidad expone a regresiones de dark mode.

**Regla**: si el reporte propone un cambio de color/elevation/theme, fue scope creep — sacarlo.

## 8. No subir `max-w` del main sin escalar grids

```css
/* MAL: subir el cap sin tocar las grids */
--main-max-w: 95vw;
/* las cards quedan estiradísimas en 4K */
```

**Razón**: si el cap crece pero la grid sigue siendo `lg:grid-cols-3`, las 3 cards se estiran sin límite y pierden proporción.

**Regla**: `max-w` y grid se ajustan en conjunto en la misma fase. Si subís el cap, sumá un breakpoint superior a la grid.

## 9. No reemplazar `text-sm` global por un solo número

**Razón**: `text-sm` (14px) está bien para 1366/1440. Sólo es chico para 2K/4K. Si hacés un find/replace ciego a un tamaño fijo más grande, rompés el target dulce.

**Regla**: introducir `--text-body` fluido con `min = 0.875rem` (= 14px actual) y `max = ~1.0625rem`. Migrar `text-sm` body-level → `text-body` caso por caso revisando que el contexto sea body (no metadata, que va a `text-meta`).

## 10. No deprecar `text-[10px]`/`text-[11px]` con find/replace ciego

**Razón**: muchos de estos son labels `font-mono uppercase tracking-wider` donde el tracking necesita ese tamaño chico para no chocar. Otros son metadata que sí están bien en 11-12px. Reemplazar ciego rompe casos legítimos.

**Regla**: pasar por cada ocurrencia, decidir si es:
- Eyebrow / label mono → `text-mono-xs`.
- Meta / fecha / count → `text-meta`.
- Body chico en sidebar → `text-label`.
- Otro caso justificable → comentar el porqué.

## 11. No matar procesos del dev server

**Razón**: el usuario puede tener trabajo activo en el dev server. Matarlo le tira sesiones de búsqueda, estados de tabs, hot module replacement en curso.

**Regla**: detectar si hay server. Si no, pedirle al usuario que lo levante o usar uno alternativo.

## 12. No correr Playwright en headed mode

**Razón**: hace que ventanas se abran arriba de lo que el usuario esté haciendo, lo distrae y no aporta a la captura.

**Regla**: `chromium.launch({ headless: true })` siempre.

## 13. No tomar full-page screenshots por default

**Razón**: para auditoría de density y "first fold", el viewport es lo importante. Full-page produce PNGs gigantes (3840×N donde N puede ser >5000px) que saturan disco y contexto.

**Regla**: `fullPage: false` default. Activar `FULL_PAGE=true` sólo si el usuario lo pide o si la vista necesita verificarse en su totalidad (ej: detalle largo de un documento).

## 14. No agregar resoluciones sin razón

**Razón**: más resoluciones = más capturas = más context, sin mejor cobertura. Las 5 canónicas (1366/1440/1920/2560/3840) cubren el 99% de los displays profesionales modernos.

**Regla**: agregar UNA específica solo si el cliente del proyecto usa un display exótico documentado.

## 15. No crear el reporte sin chequear si ya existe

**Razón**: sobrescribir un audit previo destruye el histórico. El usuario puede haber estado iterando sobre él.

**Regla**: si `.planning/RESPONSIVE-AUDIT.md` ya existe, preguntar al usuario antes. Default: usar suffix `-v2.md`, `-v3.md`, etc. y mantener el anterior.

## 16. No proponer breakpoints sin nombrar la condición que resuelven

**Razón**: el video 07 (Whosajid) lo señala explícitamente — un breakpoint debe responder a una decisión observable: "el header pierde la search bar", "la sidebar empuja el main", "una columna no sostiene su contenido", "el texto se vuelve ilegible". Cuando se justifican como "tablet" o "desktop" sin contenido, el sistema acumula media queries que después nadie entiende.

**Regla**: para cada breakpoint custom propuesto en el reporte (incluyendo `3xl`/`4xl`), nombrar la **condición observable** que resuelve. Si no se puede nombrar, el breakpoint no entra.

```markdown
/* MAL */
@media (min-width: 1920px) { ... }  /* "para pantallas grandes" */

/* BIEN */
@media (min-width: 1920px) {
  /* el main sobra y las 3 cards quedan estiradas → habilitar 4ta columna */
  ...
}
```

## 17. No validar tipografía sólo con texto ideal

**Razón**: el video 11 (Whosajid) insiste — la jerarquía visual no sirve si ignora datos reales. Un título de 200 caracteres rompe la composición; un número de 9 dígitos en una card desborda; una lista de 50 items revela que el `space-y` elegido era demasiado generoso.

**Regla**: además de las capturas baseline en 5 resoluciones, validar al menos una vista con **contenido dinámico extremo**: título largo, número grande, lista densa, label del sidebar más largo. Si rompe, el sistema de tokens propuesto debe ajustarse antes de cerrar el reporte.

## 18. No subir el tamaño del texto principal para mejorar jerarquía

**Razón**: video 11 — cuando el body ya está en contraste alto y tamaño cómodo, "destacar más" subiendo el principal genera tensión. La jerarquía se construye **bajando lo secundario** (lightness, peso, tamaño) sin volverlo ilegible.

**Regla**: si en una vista falta jerarquía, antes de subir `--text-display` o engrosar pesos, revisar:
- ¿El `--muted-foreground` está suficientemente bajo en lightness?
- ¿La metadata usa `text-meta` con `font-medium` o `font-normal`?
- ¿El eyebrow usa `text-mono-xs` real, no `text-sm`?

Subir el principal es el último recurso, no el primero.

## 19. No ignorar el árbol parent-child al diagnosticar

**Razón**: video 07 — cualquier propuesta de tokens responsive opera sobre componentes que pertenecen a un árbol (parent-child). Si el agente diagnostica sin nombrar el árbol, queda proponiendo `clamp()` y `grid-cols` sin entender quién controla qué.

**Regla**: antes de catalogar inconsistencias, dibujar el árbol parent-child de las secciones críticas (header, sidebar, main, search panel, results). Documentar como bullets en el reporte. Es paso obligatorio del workflow, no opcional.

## 20. No asumir flex donde corresponde grid (ni viceversa)

**Razón**: video 07 — flex sirve cuando los hijos negocian espacio; grid sirve cuando el padre impone estructura. Forzar uno para hacer el trabajo del otro acumula `flex-wrap` con espacios vacíos donde un `grid-cols` resolvía sin esfuerzo. El skill no propone migrar flex→grid masivamente, pero **debe flaggear** componentes donde la elección está claramente mal.

**Regla**: si en el inspection-grep aparece `flex flex-wrap` con `gap-X` y los hijos son cards/widgets de ancho similar, sospechar grid. Documentar como deuda visual en la categoría F del reporte. NO migrar como parte del audit; sólo señalar.

## 21. No confiar en los coeficientes de ejemplo del `clamp()` sin verificar el valor en el anchor

**Razón**: los coeficientes de `token-system.md §2` fueron afinados para ÍTERA Lex. Copiarlos a otra banda (o ajustar `min`/`max` sin recalcular la pendiente) suele dejar la transición en zona *mobile* → el token satura a `max` antes del anchor desktop: queda constante en 1366→2560 (no escala) y puede salir más grande que el baseline en el anchor (regresión). El `min` NO fija el anchor — es el piso de pantallas chicas. Caso real (Alquímica): un `body` "13→15" daba 15px ya en 1366 y 15px en 2560.

**Regla**: re-derivar por proyecto con el anclaje por 2 puntos (`token-system.md §2.1`) y **computar `preferred` en cada anchor** para confirmar que da el valor buscado, antes de aceptar la fórmula.

## 22. No asumir que `@theme` genera utilities desde un CSS satélite (ni tokenizar el chrome del lab)

**Razón**: `@theme inline` solo emite utilities en el stylesheet root de Tailwind (el que importa `tailwindcss`). En un design system aislado (tokens scopeados en un archivo importado desde un componente, para no tocar la app viva) ese `@theme` queda inerte → `text-body`/`max-w-main`/`3xl:` no existen. Y los breakpoints custom no se pueden scopear a una clase.

**Regla**: si los tokens viven en un CSS satélite, consumir por arbitrary value (`text-[length:var(--x)]`, `h-[var(--x)]`, `min-[1920px]:`) — ver `token-system.md §6.1`. Además, no aplicar los tokens del sistema a la navegación propia del lab/galería: es andamiaje, no entregable; el shell real es una story dentro del visor.
