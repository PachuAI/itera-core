# ElevenLabs flow — guion → TTS → JSON timestamps

Cómo generar el audio narrativo + el JSON de timestamps que el método consume.

## Flujo end-to-end

```
1. Escribir guion          (skill iteralex-copy-voice / equivalente)
2. ElevenLabs Text-to-Speech (panel web)        → MP3
3. ElevenLabs Scribe (panel web o API)          → JSON [{text, start, end}]
4. Corregir JSON manualmente                     (nombre del producto, palabras mal transcritas)
5. Mapear timestamps a keyframes en Tour.tsx
```

## 1. Guion

Antes de generar audio, escribir el guion pasando por el skill de voz del SaaS (`iteralex-copy-voice` u otro). Validaciones críticas:

- ~150-160 wpm para ritmo conversacional reposado
- 22-25s de audio cubre típicamente 55-65 palabras
- Marcar pausas con comas y puntos para que el TTS respire naturalmente
- Evitar palabras con pronunciación rara que el TTS lea mal (probar el guion completo antes)

Output esperado: bloque de texto listo para copiar al panel de ElevenLabs.

## 2. ElevenLabs Text-to-Speech

En el panel web de ElevenLabs (`elevenlabs.io/app`):

1. Elegir una voz que matchee con la "voz oficial" del SaaS. Voces rioplatenses recomendadas (cuando aplican): "Lucas — Solemn and calm", "Valentina", o clonadas propias. La voz debe sonar **calma y explicativa**, no "locutor de tanda".
2. Configuración recomendada:
   - Stability: 50 (default)
   - Similarity: 75
   - Style exaggeration: 0
   - Speed: 1.0
3. Generar y descargar el MP3.

## 3. ElevenLabs Scribe (word-level timestamps)

Mismo panel, sección Speech-to-Text / Scribe:

1. Subir el MP3 generado.
2. Idioma: español (auto-detect funciona en general).
3. Exportar como **JSON** con timestamps por palabra. Formato esperado:

```json
[
  { "text": "Entrás", "start": 0.079, "end": 0.439 },
  { "text": "a", "start": 0.439, "end": 0.519 },
  ...
]
```

## 4. Corregir el JSON manualmente

Scribe transcribe lo que oye, no lo que esperás. Especialmente:

### Nombre del producto

Casi siempre lo transcribe mal. Ejemplo recurrente: "ÍTERA Lex" → "Iteralex" o "Iteralegis". Editar el JSON antes de usarlo:

```jsonc
{
  "text": "ÍTERA Lex",   // ← editado manualmente, era "Iteralex"
  "start": 0.519,
  "end": 1.339
}
```

Mantener los `start` y `end` originales — esos sí son correctos (los detecta por audio, no por texto).

### Palabras mal transcritas

Cualquier término técnico o nombre propio puede llegar mal. Buscar en el JSON y reemplazar. Si una palabra que esperabas en el guion no está en el JSON (Scribe la fundió con la anterior), agregar manualmente con timestamps estimados (start del bloque combinado, end del bloque combinado).

## 5. Mapear timestamps a keyframes

En `Tour.tsx`, anotar los timestamps clave al inicio:

```ts
const T = {
  intro: 0.079,         // primera palabra "Entrás"
  introEnd: 3.319,      // fin de "vistazo,"
  beat1Start: 3.319,    // primera palabra del beat siguiente
  beat1End: 4.96,       // fin del beat siguiente
  ...
};
```

Y los keyframes de cámara se calculan con anticipación:

```ts
const CAMERA_KEYFRAMES = [
  { at: F(0),                 target: VIEW_FULL },
  { at: F(T.beat1Start + 0.5), target: VIEW_TARGET_1 },  // llega 0.5s antes de la palabra clave
  ...
];
```

La **anticipación de 0.5-0.7s** es para que la cámara esté quieta cuando la voz dice la palabra que disparó el zoom. Más anticipación = motion más calmo; menos anticipación = más urgente.

## Convenciones del audio file

- **Nombre**: copiarlo a `public/audio.mp3` del proyecto Remotion (nombre simple). El archivo original de ElevenLabs tiene nombre largo con timestamp — no usarlo directo.
- **Formato**: MP3 mono 44.1kHz es suficiente. ElevenLabs default está bien.
- **Tamaño**: ~150-300 KB para 20s. Negligible para Remotion.

## Iteración: regrabar la voz

Si al ver el video decidís cambiar el guion (palabra que sonó mal, frase muy larga, etc.):

1. Regenerar TTS con el nuevo guion.
2. Regenerar JSON con Scribe.
3. Volver a corregir el JSON (nombre del producto, etc.).
4. Copiar el nuevo MP3 a `public/audio.mp3` (sobreescribir).
5. Actualizar los `T.*` en `Tour.tsx` con los nuevos timestamps.
6. Ajustar los `at` de los `CAMERA_KEYFRAMES` con las nuevas anticipaciones.
7. Actualizar los `CAPTIONS` chunks con las nuevas palabras y timestamps.

El último paso es el más tedioso — los chunks dependen del JSON entero. Si la voz cambió poco (mismo guion, otro toma), copy-paste de las words desde el nuevo JSON. Si el guion cambió, reorganizar chunks desde cero.

## Voces clonadas

Si tenés voz clonada propia en ElevenLabs, usarla para todos los videos del SaaS — da consistencia. Configurar la voz una vez en el panel y reutilizar.

Si la voz oficial del SaaS es femenina, masculina, joven, mayor, formal, calma — eso es decisión de branding. El skill aplica a cualquier voz; el método no cambia.

---

## El VO debe darle SPACE al motion (regla operativa)

**Aprendizaje validado** en producción: cuando el motion se siente apurado (cursor saltando de un lado a otro, vistas cambiando antes de que el ojo registre, modal apareciendo antes que el zoom out termine), la solución NO es acelerar el motion. Es **re-grabar el VO con más palabras y/o pausas**.

### Por qué este orden

El motion calmo es el norte estético del método. Cada acción del cursor + cambio de vista + modal/popover ocupa **600-800ms mínimo** para sentirse natural (cursor llega → ripple → vista se asienta → viewer asimila). Si una phase del VO tiene menos tiempo que la cantidad de acciones necesarias × 700ms, el motion va a sentirse frenético sí o sí.

**Heurística**: una phase del video debe tener mínimo `~0.7s × cantidad_de_clicks` de duración. Ejemplos:
- 4 clicks → mínimo 2.8s de VO en esa phase
- 8 clicks → mínimo 5.6s de VO
- 12 clicks → mínimo 8.4s de VO (probablemente partir en dos phases)

Si el guion original no respeta esto, re-escribirlo agregando palabras de relleno descriptivo + comas para que el TTS respire. **No** sumar pausas largas vacías — el TTS las acorta automáticamente y queda raro.

### Patrón: "describir lo que va a pasar antes que pase"

Agregar al guion una **frase introductoria** antes de la acción que da tiempo al cursor para llegar.

**Antipatrón** (apurado, 3.2s para 6 clicks):

> "Queda sincronizado con la ficha del cliente y con la causa,"

A los 3.2s tenés que hacer: cursor → sidebar Clientes (click) → row Ana (click) → ficha Información → tab Archivos (click) → tab Causas (click) → ver causa. Imposible sin saltar pasos.

**Patrón** (mismo mensaje, expandido para dar aire al motion, 8.4s):

> "Luego, con el archivo subido al sistema, este aparecerá en la pestaña 'Archivos' de la ficha del cliente que seleccionaste."

Ahora cabe: "Luego" → cursor empieza viaje, "con el archivo subido al sistema" → cursor llega a sidebar y clickea, "este aparecerá en la pestaña Archivos" → vista cambia y cursor va a la tab, "de la ficha del cliente que seleccionaste" → tab Archivos se activa y vemos el archivo. Cada palabra cubre una micro-acción.

### Patrón: separar phases que antes eran una sola

Cuando una phase tenía "click → modal → 2 selecciones → click footer" todo en 4s, partirlo en:
1. **Phase D2**: el click que abre el modal (1-2s)
2. **Phase D3**: el modal abierto + selecciones + cierre (6-8s)

El audio nuevo debe tener una **frase puente** que justifique la pausa visual entre los dos beats:

> "También podés vincularlos desde tu Google Drive."   ← Phase D2 (click)
>
> "Antes de cada subida, el sistema te pide clasificar a dónde debería ir el archivo. Allí seleccionás la causa y el cliente deseado."   ← Phase D3 (modal completo)

El "Antes de cada subida, el sistema te pide" funciona como narración meta (describe lo que pasa) y le da 2 segundos al modal para fade-in completo antes de cualquier click adentro.

### Cuándo NO acelerar el motion

Cuando ves que la phase tiene N clicks y el VO solo da `< 0.5s × N`, parar. Antes de tocar el código del Phase:

1. **Marcar la frase exacta del VO que falta espacio**.
2. **Proponer una expansión** del VO que mantiene el mensaje pero con más palabras/pausas.
3. **Pedirle al usuario que re-grabe** con ese script expandido.

Re-grabar audio + re-mapear `T.*` toma ~10-20 min. Ajustar timing del motion para que entre todo en un audio insuficiente toma horas y queda mal igual.

### Heurística rápida: contar clicks vs segundos

Antes de escribir el código de una Phase:

| Audio disponible | Clicks viables | Recomendación |
|---|---|---|
| < 2s | 1-2 | OK para "el VO menciona algo y vemos un highlight" sin click real |
| 2-4s | 2-3 | OK para una acción concreta (click + reacción) |
| 4-7s | 3-5 | Cómodo para un mini-flow (cursor llega, click, vista cambia, viewer absorbe) |
| 7-10s | 5-8 | Holgado para flow medio (sidebar → list → ficha → tab → archivo) |
| > 10s | 8+ | Considerar partir en dos phases |

Si el número de clicks que querés mostrar supera la columna "Clicks viables" del audio, **expandir el VO antes de codear**.
