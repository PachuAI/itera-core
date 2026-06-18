# Patrones de inspección — qué buscar en el código

Patterns concretos para inventariar el motion del proyecto. Usar `Grep` con `output_mode: "count"` para tener el mapa de magnitud antes de leer archivos, o correr `scripts/motion-inventory.mjs` que automatiza todo esto.

## Orden de inspección sugerido

1. Inventario cuantitativo (counts por pattern → mapa de fragmentación).
2. Inspección dirigida (leer los archivos top-N de cada categoría).
3. Verificación del FEEL interactuando (no por screenshot — el motion es temporal).

---

## A. Duraciones

**Tailwind utilities**:

```regex
\bduration-(\d+|\[[^\]]+\])
```

Glob: `**/*.{tsx,jsx,ts}`. Counts por valor → revela la dispersión (`duration-150`, `duration-200`, `duration-300`…).

**Duraciones inline en ms/s** (CSS y JS):

```regex
\b\d+(?:\.\d+)?m?s\b
```

Glob: `**/*.{css,tsx,jsx,ts}`. Filtrar ruido (no toda `Ns` es animación); foco en las que están dentro de `transition`/`animation`/`cubic-bezier`/constantes tipo `ANIM`, `*_MS`, `DURATION`.

**Constantes JS de timing**:

```regex
(?:ANIM|DURATION|DELAY|MS|TRANSITION)[A-Z_]*\s*=\s*\d+
```

Sospechosos: `const ANIM = 200`, `OVERLAY_EXIT_MS = 220`. Las de route-transition son legítimas (co-locadas); las ad-hoc en componentes son candidatas a token.

## B. Easings

**Keyword easings**:

```regex
\bease-(in|out|in-out|linear)\b
```

**cubic-bezier sueltos**:

```regex
cubic-bezier\([^)]+\)
```

Glob: `**/*.{css,tsx,jsx,ts}`. Listar cada uno distinto. Flag los que tienen Y > 1 o Y < 0 (bounce/overshoot).

## C. Propiedades animadas

**`transition: all` (debería ser cero)**:

```regex
transition-all\b|transition:\s*all
```

**Transition properties enumeradas**:

```regex
transition-\[[^\]]+\]|transition-(colors|opacity|transform|shadow)
```

**Layout props animadas (caro)** — buscar en `transition-[...]` y en CSS `transition:`:

```regex
transition[^;{]*\b(width|height|top|left|right|bottom|margin)\b
```

## D. Keyframes y animaciones

**Keyframes propios**:

```regex
@keyframes\s+[\w-]+
```

Glob: `**/*.css`. Listar cada uno; ver si reinventan algo que `tw-animate-css` ya da.

**Utilities de tw-animate-css**:

```regex
\banimate-(in|out|spin|pulse|bounce|ping)\b|\b(fade|zoom|slide)-(in|out)
```

`animate-bounce` / `animate-ping` en admin panel = sospechoso (decorativo).

## E. reduced-motion

```regex
prefers-reduced-motion|motion-reduce:|motion-safe:
```

Glob: `**/*.{css,tsx,jsx,ts}`. **Si el count es 0 o muy bajo → hallazgo crítico** (§9 del checklist). Ver dónde SÍ está para medir cobertura.

## F. Lib de animación JS

```regex
framer-motion|react-spring|@react-spring|gsap|animejs|motion/react
```

Glob: `package.json`, `**/*.{tsx,jsx,ts}`. Si aparece, ver qué resuelve y si CSS + tw-animate-css alcanzarían.

## G. Tokens de motion existentes

```regex
--(?:duration|ease|transition|motion)-[\w-]+
```

Glob: `**/*.css`. Si existen, mapear; si no, declararlos es Fase 1.

## H. will-change

```regex
will-change
```

Flag los `will-change` globales o sobre muchos elementos (consume memoria sin animar).

---

## Cómo reportar findings

Por cada inconsistencia, registrar con `archivo:línea`:

```
- `resources/css/app.css:26` — `page-enter` 250ms (> moderate 220; debería bajar).
- `resources/css/app.css:36` — `dropdown-in` 150ms ease-out (= base).
- `resources/js/components/ui-lab/stories/app-shell.tsx:47` — `const ANIM = 200` ad-hoc (candidato a token).
```

**Evidencia o descarte**. Si no podés apuntar a `archivo:línea`, el finding no entra.

---

## Checks semánticos (no grep simple)

### S1. Ciclo de vida de cada superficie de motion

Antes de proponer tokens, describir la secuencia temporal de las superficies críticas (route transition, overlays, reveals). No es grep — es lectura del provider/componente + el orden de los efectos.

Para cada superficie:
1. **Disparador**: qué evento la inicia (click, `router.on('start')`, `open` state).
2. **Entrada**: qué se monta/aparece, en qué opacity/transform inicial, con qué duración+easing.
3. **Salida**: qué se desmonta/oculta, ¿animado o corte seco?, ¿hay flash?
4. **Coordinación**: ¿hay min-visible, doble-rAF, delays escalonados?

Ejemplo (route-transition Inertia):
```
start (no preserveState) → begin(): overlay mount opacity-0 → doble-rAF → opacity-100; viewport → opacity-0
finish → respeta max(0, 420 - elapsed) → viewport opacity-100 + overlay opacity-0 → tras 220ms unmount
```

Esto va al reporte §1.1.

### S2. Duplicación de fades

**Heurística**: si hay route/section transition (el viewport fade ES la entrada), NO debería haber `<FadeIn>` ni `animate-in fade-in` por página encima. Buscar páginas que monten dentro del viewport Y traigan su propio fade de entrada → doble fade.

### S3. Flash de form vacío al cerrar dialog

**Heurística**: buscar `{open && <...Form/>}` o `{isOpen && (` dentro de `<Dialog>`/`<DialogContent>`. Si el form se renderiza condicional al `open`, al cerrar React lo desmonta mientras Radix anima el fade-out → flash vacío. El patrón correcto es `key={formKey}` que incrementa solo al abrir.

```regex
\{\s*open\s*&&|\{\s*isOpen\s*&&
```

### S4. Cortes secos (cambio de estado sin transition)

**Heurística**: elementos con clases condicionales de color/opacity/visibility (`open ? 'opacity-100' : 'opacity-0'`, toggles de `bg-*`) que NO tienen `transition-*` en la misma className → el cambio corta en seco. Leer el componente y verificar que el toggle tenga su `transition`.

### S5. Escala fragmentada → escala canónica

**Heurística**: con el inventario de §A, armar la tabla "valor actual → escalón canónico (fast/base/moderate/slow)". Si hay 5+ valores distintos, el sistema está fragmentado y el snap a 4 escalones es el corazón de la propuesta. Documentar el mapeo explícito en el reporte §4.
