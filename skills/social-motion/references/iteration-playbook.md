# Iteration Playbook

Feedback común del usuario mapeado a acción concreta sobre el HTML. La lógica es: escuchar → identificar qué clase CSS tocar → re-render esa pieza sola (no todas) → mostrar el frame relevante.

## Regla de oro

**Una iteración = un cambio, un re-render, una verificación**. No toques 3 cosas a la vez "de una": si falla el resultado, no sabés qué revertir.

## Mapa de feedback → acción

### "Muy rápido / no se alcanza a leer"

**Síntoma**: un elemento entra y sale tan rápido que el usuario no lo lee.

**Causas posibles**:
- `animation-duration` bajo (< 0.5s para una línea)
- Hold insuficiente entre entrada y siguiente evento (< 0.8s)
- Próximo elemento empieza antes de que este termine

**Acción**:
1. Si es entrada: subir duration 0.5s → 0.7–0.8s
2. Si es hold: el elemento que le sigue debe arrancar mínimo 0.8s después de que este entre
3. Re-render, verificar con frame a t = (entrada + 0.3s) que ya es legible

### "Se superponen / aparecen al mismo tiempo"

**Síntoma**: dos elementos que deberían ser secuenciales aparecen juntos.

**Causa típica**: ambos tienen `animation-delay` con valores muy cercanos, o uno está animado a nivel padre mientras su hijo también tiene su propio delay.

**Acción**:
1. Confirmar el delay de cada uno por separado
2. Si el padre tiene animation, verificar que no tape al hijo (padre `fade-slide-up` aplica a todos los hijos aunque tengan su propia animation — ver teaser 40 donde `.line-3` NO se anima entera, solo los spans hijos)
3. Separar en 3 spans si querés stagger interno de palabras
4. Regla: entre elemento N y N+1 → mínimo `0.3s` de offset si son palabras, `0.9s` si son líneas

### "Falta ritmo / todo es plano"

**Síntoma**: la pieza es monotónica, no hay picos de energía.

**Causa**: todas las entradas usan `fade-slide-up` con la misma duration.

**Acción**:
1. Identificar el elemento **hero** del mensaje (la palabra clave)
2. Cambiar ese a `pop-in` + `hl-accent`
3. Para las líneas secundarias, mantener `fade-slide-up` pero con durations ligeramente distintas (0.6s / 0.7s / 0.75s)
4. Agregar un `dot-pulse` infinito en algún elemento secundario para dar "vida"

### "El pop es muy chiquito / no hace énfasis"

**Síntoma**: el `pop-in` se ve casi igual que un `fade-slide-up`.

**Causa**: overshoot muy suave.

**Acción** — editar el keyframe inline en la pieza (no tocar el base):
```css
@keyframes pop-in-strong {
  0%   { opacity: 0; transform: translateY(40px) scale(0.85); }
  60%  { opacity: 1; transform: translateY(0)    scale(1.12); }
  100% { opacity: 1; transform: translateY(0)    scale(1); }
}
.l3-hl { animation: pop-in-strong 0.85s ease-out 2.1s both; }
```

### "El outro entra muy tarde / muy temprano"

**Síntoma**: hay pantalla negra muerta antes del outro, o el outro se superpone feo con el intro.

**Causa**: delay del `outro-in` mal calibrado respecto al `dark-in`.

**Acción**:
- **Muy tarde (pantalla negra muerta)**: restar 0.3s al delay del `.phase-outro` (ej: 4.75s → 4.45s)
- **Muy temprano (se ve encima del cream)**: sumar 0.2s al delay, y también subir el delay del `dark-in` para que el fondo oscuro esté casi completo cuando entre el outro
- **Regla**: el outro debe arrancar cuando el `dark-in` lleva ~80% de su duration

### "La última frase queda muy poco tiempo"

**Síntoma**: la fecha o CTA del outro aparece y al segundo corta.

**Causa**: `delay + duration` del último elemento supera la duración total de la pieza.

**Acción**:
1. Calcular: `delay + duration` debe dar **máximo 95% de la duración total**
2. Ejemplo en pieza de 6s: último elemento → delay 5.4s + duration 0.7s = 6.1s ❌ (se corta)
3. Arreglar: bajar delay a 5.2s → 5.2s + 0.7s = 5.9s ✅ (queda 0.1s de hold)
4. Si no hay más margen: extender la pieza a 7s

### "No me convence cómo termina"

**Síntoma**: el end-state no cierra bien la idea.

**Acción** — cambiar la receta del outro:
- **Lockup marca** (default): silueta + wordmark + fecha
- **CTA texto**: reemplazar silueta por texto grande tipo "seguinos en @shope.ar"
- **Sin outro**: borrar `.phase-outro` + `.overlay-dark` y extender el hold del intro

### "Se ve lag / tirones"

**Si estás viendo el HTML directo en el browser**: es normal, Chrome no es determinístico. Renderizá con `render-motion.mjs` y revisá el MP4 — ese sí es smooth.

**Si está en el MP4 también**:
- Verificar que el MP4 tiene los 180 frames (6s × 30fps)
- `ffprobe motion-out/<piece>.mp4` debe mostrar `duration: 6.00`
- Si el MP4 está corto: error del renderer, revisar logs

### "Quiero que una palabra se destaque de otra forma"

**Opciones**:

1. **Color distinto**: clase `hl-accent` (ya definida, usa `var(--accent)`)
2. **Tamaño más grande**: agregar `font-size: 1.1em` a la clase específica
3. **Background highlight**: agregar CSS custom:
   ```css
   .word-highlight {
     background: linear-gradient(transparent 60%, var(--accent-soft) 60%);
     padding: 0 0.15em;
   }
   ```
4. **Underline animado**: más complejo, usar pseudo-element `::after`

## Workflow de iteración (el loop operativo)

```
1. Usuario da feedback →
2. Identificar qué cambio CSS aplica →
3. Editar la pieza HTML (no el template del skill) →
4. Re-render: `node <skill>/assets/render-motion.mjs <piece-name>` →
5. Regenerar viewer (se hace auto al renderizar si el skill lo invoca) →
6. Sugerir al usuario refrescar el viewer →
7. Preguntar feedback →
8. Si aprueba, pasar a siguiente pieza; si no, volver a paso 1.
```

**Tiempo típico por iteración**: ~45s de render + review del usuario. Si en 3 iteraciones no converge → probablemente el problema es de concepto, no de timing. Conviene volver a la fase de "preguntas de diseño" y re-pensar.

## Cosas que NO son iteraciones de timing

Si el usuario dice cualquiera de estas cosas, el fix no es ajustar timing:

- "Quiero otra paleta" → editar `motion.config.json`
- "Quiero otra fuente" → editar `motion.config.json`
- "Quiero que diga otro texto" → editar el HTML
- "Cambiemos la idea del mensaje" → volver a fase de diseño desde cero
- "Que sea horizontal" → cambiar viewport (y probablemente re-hacer el layout)

En esos casos: pausar el loop de iteración, hacer el cambio más estructural, recién ahí volver a iterar timing.
