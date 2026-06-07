# Flow step-by-step · brandboard-creator

Modo exploratorio: skill pausa en cada decisión clave para que el usuario elija comparando previews.

**Cuándo usarlo**: branding nuevo, sin paleta ni fuentes definidas todavía. El usuario quiere ver opciones antes de comprometerse.

## Pasos

### 1. Intake

Preguntar sin asumir nada:

- Path al isotipo. Si no hay → offer wordmark-only.
- `displayName` + `slug`.
- Split del wordmark + casing (lowercase / Capital / todo uppercase).
- Punchline inicial.

Al terminar: "OK. Vamos fase por fase. Primero paleta, después tipografía, después verificamos el lockup, después generamos el pack. Podés cortar y iterar en cualquier fase."

### 2. Setup + procesar isotipo

Como en `flow-all-in-one.md` pasos 2-3.

### 3. Fase paleta (checkpoint)

Preguntar: "¿Cómo querés elegir la paleta?"
- (a) Extraída del isotipo — skill analiza colores dominantes
- (b) Presets curados — 10 opciones por estilo
- (c) Ya la tengo — skill pide los 7 colores manualmente

**Si (a)**:
```bash
cd ~/projects/itera-social
node ~/projects/itera-social/scripts/extract-colors.mjs $TARGET/assets/logo-black.png
```
Toma los 3-5 colores devueltos, arma 3-4 propuestas de paleta usando cada dominante como `accent` y completando los otros 6 roles con presets adecuados (ej. cuando el accent es cálido, usar `warm-cream` como base; cuando es saturado frío, usar `saas-dark`).

**Si (b)**:
Leer `references/palette-presets.json`, tomar los 10. Offrecer todos.

**En cualquier caso, renderizar previews**:

Para cada candidata N:
1. Interpolar `templates/explore/palette-candidate.html.hbs` con los valores de esa paleta + metadata (label, rationale, index).
2. Escribir a `/tmp/brandboard-explore-<slug>/palette-<N>.html`.
3. `cd ~/projects/itera-social && node ~/projects/itera-social/scripts/render-previews.mjs /tmp/brandboard-explore-<slug>/`.
4. Leer cada PNG con `Read` tool y mostrar inline.

Presentar al usuario: "Estas son las opciones. Decime cuál te gusta más (número) o si querés que genere otras variantes."

Iterar hasta que elija.

### 4. Fase tipografía (checkpoint)

Preguntar: "¿Y la tipografía?"
- (a) Matching con el shape del logo — skill propone basado en si el logo es rounded / angular / editorial
- (b) Presets curados — 10 pares (display + UI)
- (c) Ya la tengo — skill pide las 2 Google Fonts manualmente

**Si (a)**: heurística simple sobre el isotipo (cantidad de curvas detectables). Proponer 3 pares coherentes. Implementación heurística pendiente — por ahora fallback a (b).

**Si (b)**: leer `references/font-pairs.json`, tomar los 10.

**Renderizar previews**: análogo al paso de paleta, pero usando `templates/explore/font-candidate.html.hbs` (con la paleta ya elegida como fondo, más el par de fuentes aplicado al wordmark y body).

### 5. Fase wordmark (checkpoint)

Ya tenemos paleta + fuente. Preguntar por casing y split final:

Renderizar 3-4 variantes del lockup horizontal con distintos casings/splits:
- `shopear` (lowercase sin dot)
- `shope.ar` (con dot en accent)
- `Shope.ar` (capital + dot)
- `SHOPE.AR` (uppercase)

Reusar `templates/pieces/52-lockup-h-on-ink.html.hbs` interpolado cada vez con distintos `wordmark-first` + `wordmark-accent`. Renderizar con `render-previews.mjs` y mostrar inline.

Elegir + confirmar.

### 6. Fase punchline (opcional)

Si el usuario no tiene un punchline definido, ofrecerse a proponer 3 opciones basadas en el nombre + descripción del producto. Skill genera 3 variantes de punchline (texto libre, estructura "verbo + beneficio"), las muestra como text, el usuario elige o aporta el suyo.

### 7. Fase voz (opcional)

Skill pregunta por:
- Tono: formal / informal / voseo argentino / tú / usted.
- Uso de mayúsculas.
- Ejemplos de palabras a destacar (highlights).

Si el usuario dice "usá defaults": skill pone voseo rioplatense + minúsculas sistemáticas + highlights neutros.

### 8. Materializar (checkpoint antes de render masivo)

Con todo elegido: construir el config JSON completo. Mostrar al usuario un resumen textual:

```
shope.ar
paleta: saas-dark
fuentes: Baloo 2 + Poppins
wordmark: shope + .ar (lowercase, .ar en accent)
punchline: "ponete a shoppear en tres simples pasos."

listo para generar. ¿procedo?
```

Si OK → materializar + render. Si no → iterar en la fase necesaria.

### 9. Render + build-favicons + verificación altura del brandboard + display de outputs

Como en `flow-all-in-one.md` pasos 7-11.

### 10. Review final (último checkpoint)

Mostrar al usuario los 3-4 outputs clave (lockup, OG, brandboard, apple-touch). Preguntar:

"¿Todo bien? Si querés ajustar algo puntual (proporción del symbol en el favicon, color del glow, tamaño del punchline), lo tocamos ahora. Si todo OK, listo."

Si hay ajustes mecánicos: modificar valores en el config JSON + re-materializar + re-render sólo las piezas afectadas. No re-renderizar todo el pack si el cambio fue local a un template.

## Principios del flow

- **Un checkpoint = una decisión**. No pedir 5 cosas de una.
- **Siempre preview antes de elegir**. Nunca "elegí entre estas 10 paletas" sin que vea las 10.
- **Output incrementales**: cada render que muestres es visible inline. El usuario aprende viendo.
- **Iteración barata**: si una elección no le gusta, revertir es cambiar un valor y re-materializar. No re-arrancar.
- **Separación de fases**: paleta primero, fuente después, wordmark tercero. Nunca pedir las 3 de una. Cada decisión condiciona la siguiente preview.
