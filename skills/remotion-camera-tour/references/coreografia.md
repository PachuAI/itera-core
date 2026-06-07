# Coreografía de motion — reglas detalladas

Patrones validados en producción para que el motion se sienta cinematográfico y no chocante. Cada regla viene con el **antipatrón** que la motiva (lo que hicimos mal y aprendimos).

---

## 1. Highlights aparecen al FINAL del zoom

**Por qué**: dar la sensación cinematográfica de "zoomeamos a algo, lo mostramos". Si el highlight aparece al inicio del zoom, el ojo lo registra antes de saber "qué" estamos viendo.

**Antipatrón** (incorrecto):

```ts
// Highlight activo desde el primer frame del beat — el ojo ve el ring naranja
// mientras la cámara todavía está moviéndose. Distrae del zoom.
const getHighlights = (frame: number): string[] => {
  if (frame >= F(BEAT.agenda.start) && frame < F(BEAT.agenda.end))
    return ["agenda"];
  return [];
};
```

**Patrón** (correcto):

```ts
// Highlight aparece cuando el zoom termina (~0.5-0.7s después del start del beat).
// La cámara llega quieta a su target, y JUSTO ahí se enciende el ring.
const ZOOM_LAND = 0.65; // duración aproximada del zoom

const getHighlights = (frame: number): string[] => {
  if (frame >= F(BEAT.agenda.start + ZOOM_LAND) && frame < F(BEAT.agenda.end))
    return ["agenda"];
  return [];
};
```

Práctica:
- Los zooms duran **0.5-0.7s** (rápido pero no abrupto).
- El highlight se enciende a la marca exacta donde el zoom termina (usar `useCurrentFrame` + `F(start + ZOOM_LAND)`).

---

## 2. Saltar views intermedias innecesarias

**Por qué**: la voz no se detiene a "respirar" entre dos puntos del UI. Si la cámara hace zoom-out + reorient cada vez que cambia el target, se siente burocrática y agrega tiempo muerto.

**Antipatrón**: Tareas → zoom out a vista completa → zoom in al sidebar item:

```
Beat 1 (3-6s): zoom a Agenda
Beat 2 (6-9s): zoom a Tareas
Beat 3 (9-11s): zoom out a vista completa     ← INNECESARIO
Beat 4 (11-13s): zoom al sidebar Escritorio    ← INNECESARIO
Beat 5 (13-15s): slide al sidebar Calendario
```

Resultado: el spectator percibe 2 saltos de cámara que no acompañan la voz.

**Patrón**: ir directo de Tareas → sidebar Calendario:

```
Beat 1: zoom a Agenda
Beat 2: pan a Tareas
Beat 3: pan DIRECTO al sidebar Calendario (sin pasar por full ni por escritorio)
Beat 4: zoom out a Calendario completo cuando se dice "calendario"
```

Regla práctica: **si el target nuevo no exige reorientarse, no reorientes**. Confiá en la interpolación cubic-bezier del Camera component — pasa fluidamente de un punto a otro aunque sean distantes.

Excepción: cuando hay un **cambio de vista lógica** (Escritorio → Calendario son componentes distintos). Ahí sí, hacer zoom out + render nueva vista + zoom in al nuevo target.

---

## 3. Sin overlap entre captions

**Por qué**: cuando dos captions se ven al mismo tiempo, el ojo no sabe cuál leer. Especialmente molesto cuando los chunks son cortos (1-2 palabras).

**Antipatrón**: fade-in del siguiente chunk antes de que termine el fade-out del anterior:

```ts
// Mal: fade vive FUERA del rango [from, to]
const opacity = interpolate(
  frame,
  [fromF - fadeFrames, fromF, toF, toF + fadeFrames],
  [0, 1, 1, 0]
);
```

Resultado: si `chunk1.to = chunk2.from`, ambos están a opacity > 0 durante `2 × fadeFrames`.

**Patrón**: el fade-in/fade-out vive **dentro** del rango:

```ts
// Bien: fade vive DENTRO del rango [from, to]
const opacity = interpolate(
  frame,
  [fromF, fromF + fadeFrames, toF - fadeFrames, toF],
  [0, 1, 1, 0]
);
```

Ahora el chunk arranca con opacity 0 en `from`, llega a 1 en `from + fadeFrames`, hold hasta `to - fadeFrames`, llega a 0 exactamente en `to`. Si `chunk1.to = chunk2.from`, ambos llegan a 0 / parten de 0 en el mismo frame.

Práctica: setear `chunk.to` igual al `chunk.from` del siguiente. Usar `fadeFrames=3` (100ms @ 30fps) para que el cross-fade sea suave pero no notorio.

---

## 4. Popover/Modal con CSS @keyframes en la lib

**Por qué**: en Remotion no hay "mount/unmount lifecycle" como en React DOM tradicional — todo es frame-driven. Pero las CSS @keyframes SÍ se ejecutan cuando un elemento aparece en el DOM (incluido en Remotion render frame-by-frame con Chromium headless).

**Antipatrón**: animar el mount con JS desde Remotion:

```tsx
// Mal: lógica de animación dispersa en cada caller, dependiente de frame matemática
const showModal = (frame: number) => frame >= F(13.5);
const modalProgress = interpolate(frame, [F(13.5), F(13.8)], [0, 1]);
<EventModal style={{ opacity: modalProgress, transform: `scale(${0.94 + modalProgress * 0.06})` }} />
```

Cada caller tiene que reescribir la animación. Frágil.

**Patrón**: la animación de mount-in **vive en el CSS del componente** de la biblioteca:

```css
/* Modal.module.css en la lib */
.modal {
  /* ... otros estilos ... */
  animation: modalAppear 0.36s cubic-bezier(0.22, 1, 0.36, 1) both;
  transform-origin: center top;
}

@keyframes modalAppear {
  from {
    opacity: 0;
    transform: translateY(14px) scale(0.94);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
```

Y en Remotion, simplemente decidís si mostrar el componente o no:

```tsx
<DashboardShell overlay={showModal(frame) ? <EventModal /> : undefined}>
  ...
</DashboardShell>
```

Cuando `showModal(frame)` pasa de false → true, React monta el componente, el browser ve el `<div>` aparecer en el DOM, dispara `animation: modalAppear`, se ve fade+scale. Sin código de animación en el caller.

Gotchas:
- **Funciona en Remotion render frame-by-frame** porque Chromium ejecuta CSS animations con mock-time, frame-accurate.
- **En Remotion Studio scrubbing** puede verse inconsistente (el browser interpreta tiempo real cuando scrubeás). No importa porque scrub es preview, no render.
- Si querés también animación de **mount-out** (fade-out cuando desaparece), necesitás un componente que detecte el unmount y delay el unmount. Más complejo. Para mocks de tour, usualmente alcanza con mount-in.

---

## 5. Fix del flash negro en captions

**Por qué**: cuando un texto pasa de un estilo con `background-clip: text` + `WebkitTextFillColor: transparent` (gradient) a un estilo con `color: white` + `text-shadow: black`, durante la transición el color del texto pasa por valores semi-transparentes pero la sombra negra está al 100%. Resultado: lo único visible es la sombra → flash negro perceptible.

**Antipatrón**:

```tsx
const wordStyle = isCurrent
  ? {
      background: "linear-gradient(...)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      color: "transparent",
      filter: "drop-shadow(naranja)",
    }
  : {
      color: "white",
      textShadow: "0 2px 14px rgba(0, 0, 0, 0.7)",  // ← problema
    };

<span style={{ transition: "color 0.08s ease-out", ...wordStyle }}>{word}</span>
```

Durante los 80ms de transition de color:
- color: transparent → white (transitioning)
- text-shadow black: aparece de golpe al 100%
- Resultado: ves la sombra negra del texto cuando el texto es casi invisible → flash

**Patrón** — tres ajustes coordinados:

```tsx
const wordStyle = isCurrent
  ? {
      background: "linear-gradient(...)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      color: "transparent",
      filter: "drop-shadow(0 2px 12px rgba(242, 122, 26, 0.45))", // sombra naranja
    }
  : {
      background: "none",                              // explícito: limpiar gradient
      WebkitBackgroundClip: "border-box",              // explícito: limpiar
      WebkitTextFillColor: "currentColor",             // explícito: limpiar transparent
      color: isPast ? "rgba(white, 0.62)" : "rgba(white, 0.34)",
      filter: "drop-shadow(0 2px 10px rgba(0, 0, 0, 0.55))", // sombra negra MISMO mecanismo
    };

// Sin transition — el cambio es instantáneo
<span style={wordStyle}>{word}</span>
```

Tres cosas combinadas:
1. **Sin `transition: color`** — el cambio es instantáneo, no hay 80ms intermedios.
2. **Sombra siempre como `filter: drop-shadow`** — consistente entre estados, no text-shadow + drop-shadow mezclados.
3. **`WebkitTextFillColor: currentColor` + `background: none` explícitos** en past/future — resetean los residuos del estado current.

---

## 6. Animaciones de cámara con ease-out-cubic

**Por qué**: ease-out-cubic da la sensación de "movimiento natural" — la cámara desacelera al acercarse al target, como un humano que apunta una cámara y la asienta. Linear (sin easing) se siente robótico; ease-in se siente raro (acelera al final). Ease-in-out es OK pero más "blando".

**Patrón** en el `Camera.tsx`:

```ts
const ease = (t: number): number => 1 - Math.pow(1 - t, 3); // ease-out-cubic

const interpTarget = (frame, keyframes) => {
  // ... encontrar par de keyframes que enmarcan el frame ...
  const t = (frame - a.at) / (b.at - a.at);
  const e = ease(t);
  return {
    x: a.x + (b.x - a.x) * e,
    y: a.y + (b.y - a.y) * e,
    scale: a.scale + (b.scale - a.scale) * e,
  };
};
```

Práctica:
- Zoom in / pan: ease-out-cubic (asienta suave)
- Zoom out: también ease-out-cubic (sale suave)
- Hold: no hay interpolación (a.at == b.at)
- Para movimientos especiales (whip pan rápido), considerar otras curvas, pero **default = ease-out-cubic**

---

## 7. Sistema de coordenadas del "stage"

**Por qué**: el dashboard mock vive dentro de un "stage" (área 16:10 o 9:16) que es solo una parte del frame total. Los targets de cámara se expresan en coordenadas del stage (0,0 = top-left del dashboard), no del frame total. Eso hace los keyframes interpretables y portables.

Convención:

```ts
const STAGE_W = 1504; // ancho del stage (1504 en 16:9 con padding 208 cada lado)
const STAGE_H = 940;  // alto del stage

// Target en coords del stage
const VIEW_AGENDA = { x: 540, y: 700, scale: 1.55 };
```

El componente Camera internamente convierte estas coords al frame total + aplica scale + translate.

---

## 8. Lecciones que no funcionaron

**Cosa que probamos y no salió**:

1. **Importar componentes de la lib directamente del source** (`../../../components/src/lib/...`). Falla por CSS Modules cross-project que webpack de Remotion no resuelve. **Solución**: build:lib + import del dist (ver `lib-bridge.md`).

2. **`Config.overrideWebpackConfig` con style-loader + css-loader manual** en Remotion. Genera doble loader chain y rompe el bundle. **Solución**: dejar el webpack de Remotion default y resolver CSS pre-buildeando la lib.

3. **`transition: color 0.08s`** en captions. Causa flash negro al cambiar background-clip text + text-shadow. **Solución**: sin transition + filter:drop-shadow consistente (ver regla 5).

4. **fadeFrames del caption FUERA del rango [from, to]**. Causa overlap entre chunks. **Solución**: fade vive dentro del rango (ver regla 3).

5. **VIEW_SIDEBAR_ESCRITORIO + VIEW_SIDEBAR_CALENDARIO** como dos keyframes secuenciales. Hace que la cámara pase por escritorio antes del calendario item, gastando tiempo de motion sin acompañar la voz. **Solución**: ir directo al item destino (ver regla 2).

---

## 9. Cross-fade entre Phases sin "negro suave"

**Por qué**: cuando dos `PhaseWrap` hacen cross-fade simultáneo (ambas con `opacity < 1`), el fondo `colors.bg` (negro) se cuela y se ve un dim de 25-50% del pixel durante el overlap. La voz no se "apaga", pero el cuadro sí.

Cálculo del antipatrón (ambas con `fade=0.45` y opacity multiplicativa):

```
A t=mitad-del-overlap:
  D1 opacity = 0.33
  D2 opacity = 0.22 (D2 sobre D1)
  visible bg = (1 - 0.22) * (1 - 0.33) = 0.52 → 52% negro filtrándose
```

**Patrón** — `fadeIn` y `fadeOut` separados, saliente queda al 100% hasta que entrante terminó, después desaparece de golpe (~50ms):

```tsx
const PhaseWrap: React.FC<{
  t: number; from: number; to: number;
  fadeIn?: number; fadeOut?: number;
  children: React.ReactNode;
}> = ({ t, from, to, fadeIn = 0.45, fadeOut = 0.05, children }) => {
  // Guard para fadeIn=0 (step function, evita inputRange [0,0] de Remotion)
  const enter = fadeIn <= 0
    ? (t >= from ? 1 : 0)
    : progress(t, from, from + fadeIn);
  const exit = fadeOut <= 0
    ? (t < to ? 1 : 0)
    : 1 - progress(t, to - fadeOut, to);
  const op = Math.min(enter, exit);
  if (op === 0) return null;
  return <AbsoluteFill style={{ opacity: op }}>{children}</AbsoluteFill>;
};
```

**Regla de timing**: `prevPhase.to = nextPhase.from + nextPhase.fadeIn`. La saliente sobrevive hasta que la entrante alcanza opacity 1. Después la saliente desaparece en 50ms — pero ya no se ve porque la entrante la cubre completamente.

Ejemplo de cadena de phases (test5 audio, 45.4s):

```tsx
<PhaseWrap t={t} from={0}     to={4.68}  fadeIn={0}><PhasePain t={t} /></PhaseWrap>
<PhaseWrap t={t} from={4.23}  to={10.30}><PhaseSync t={t} /></PhaseWrap>
<PhaseWrap t={t} from={9.37}  to={14.17}><PhaseUpload t={t} /></PhaseWrap>
<PhaseWrap t={t} from={13.27} to={17.31}><PhaseDrive t={t} /></PhaseWrap>
<PhaseWrap t={t} from={16.41} to={26.09}><PhaseClasificar t={t} /></PhaseWrap>
<PhaseWrap t={t} from={25.19} to={34.45}><PhaseFichaCliente t={t} /></PhaseWrap>
```

`fadeIn={0}` en la primera phase porque no hay anterior que la cubra durante el fade-in — debe arrancar a opacity 1 directo.

---

## 10. Click → zoom out → modal: orden secuencial, NO paralelo

**Por qué**: la sensación cinematográfica de "hago click, la cámara se aleja para mostrar el resultado, aparece la consecuencia" requiere los tres beats SECUENCIALES, separados por al menos 200-300ms cada uno. Si zoom out y modal pasan a la par, el ojo no logra cerrar el loop "yo cliqueé esto → ahora pasa esto".

**Antipatrón** (lo apurado):

```ts
// Click ripple 12.30-12.55 mientras la cámara YA hace zoom out
const KF_DRIVE = [
  { at: F(12.3), target: VIEW_DRIVE_BTN },
  { at: F(12.55), target: VIEW_CENTER_OVERLAY }, // zoom out simultáneo al ripple
];
// Modal aparece en el mismo instante en que termina el zoom out
const showModal = t >= 12.55;
```

Resultado: el viewer no ve el highlight del botón porque la cámara ya se está alejando, y el modal "aparece de la nada".

**Patrón** (lo correcto):

```ts
// Click pasa zoomed in. Después zoom out. Después modal con un beat de espera.
const KF_DRIVE = [
  { at: F(13.27), target: VIEW_DRIVE_BTN }, // arranca zoomed in
  { at: F(14.80), target: VIEW_DRIVE_BTN }, // hold durante el click
  // Zoom out empieza 100ms después de que terminó el ripple
  { at: F(15.20), target: VIEW_CENTER_OVERLAY },
];

// Ripple click sobre el btn (zoom in mantenido)
const rippleDrive = progress(t, 14.50, 14.80);

// Highlight del btn persiste durante el zoom out (viewer ve "esto es lo que acabás de tocar")
if (t >= 13.27 && t < 15.30) highlights.push("drive");

// Modal aparece 300ms+ después de que el zoom out terminó
const showModal = t >= 16.41; // beat de aire visual antes
```

Secuencia visible: cursor llega → ripple → highlight queda visible → zoom out → highlight sigue → beat → modal aparece.

**Regla práctica**: separar las 3 acciones (click ripple, zoom out, modal mount) por al menos 200-300ms cada una. El VO ayuda: las 3 acciones se pueden cubrir con 3 palabras consecutivas del audio.

---

## 11. Cámaras DEBEN coincidir en target durante el cross-fade

**Por qué**: cada `<Camera>` tiene su propia transformación scale + translate. Durante el overlap del cross-fade entre dos PhaseWraps, ambas Cameras se renderizan superpuestas. Si sus `target` son distintos, vemos dos imágenes desplazadas al mismo tiempo (doble visión).

**Antipatrón**:

```tsx
// KF_UPLOAD termina en VIEW_UPLOAD_BTN (zoom right)
const KF_UPLOAD = [
  { at: F(10.4), target: VIEW_UPLOAD_BTN },
  { at: F(12.5), target: VIEW_UPLOAD_BTN }, // hold acá
];

// KF_DRIVE arranca panneando a VIEW_DRIVE_BTN durante el overlap
const KF_DRIVE = [
  { at: F(12.3), target: VIEW_UPLOAD_BTN },
  { at: F(12.45), target: VIEW_DRIVE_BTN }, // ya empezó a mover dentro del overlap
];

// Overlap 12.30-12.55: D1 cámara en UPLOAD_BTN, D2 cámara entre UPLOAD y DRIVE.
// Resultado: imagen fantasma de la D1 con D2 desplazada arriba → doble visión.
```

**Patrón**:

```tsx
// Las dos KF terminan/empiezan en el MISMO target durante el overlap
const KF_UPLOAD = [
  { at: F(10.3), target: VIEW_UPLOAD_BTN },
  { at: F(13.0), target: VIEW_UPLOAD_BTN },
  { at: F(13.65), target: VIEW_DRIVE_BTN },  // pan a Drive antes del cross-fade
  { at: F(14.17), target: VIEW_DRIVE_BTN },  // hold final coincide con start de D2
];

const KF_DRIVE = [
  { at: F(13.27), target: VIEW_DRIVE_BTN },  // arranca alineada con final de D1
  { at: F(14.80), target: VIEW_DRIVE_BTN },
  { at: F(15.20), target: VIEW_CENTER_OVERLAY }, // movement pasa DESPUÉS del overlap
];
```

**Regla práctica**: durante el overlap `[nextPhase.from, prevPhase.to]`, ambas Cameras renderizan el **mismo target**. Cualquier movimiento de cámara debe ocurrir ANTES o DESPUÉS del overlap, nunca durante.

---

## 12. Cards fade-in temprano + highlights cronometrados (pattern Phase A)

**Por qué**: cuando una fase introduce N elementos visuales (cards, íconos, badges) que después el VO nombra uno a uno, el patrón natural sería hacerlos aparecer cuando se los nombra. **Es peor**. Mejor que estén todos visibles ANTES de que arranque la nominación — densidad visual desde el primer segundo, y cuando el VO empieza a nombrar, el ojo ya conoce la composición.

**Patrón** — cards entran escalonadas 0-1s independiente del VO. Después cada palabra del VO dispara un `highlight` (0-1) que aplica lift + glow + bordes color marca:

```tsx
const PhasePain: React.FC<{ t: number }> = ({ t }) => {
  // Cards aparecen apenas arranca el video (escalonadas 150ms entre sí)
  const carpShow  = progress(t, 0.05, 0.65);
  const mailShow  = progress(t, 0.20, 0.80);
  const driveShow = progress(t, 0.35, 0.95);

  // Highlights cronometrados con palabras del VO
  // Cortamos el hold un poco antes de la palabra siguiente para que el
  // cross-fade entre highlights sea natural
  const carpHl  = highlightFor(t, T.carpetas,    T.emails - 0.10);
  const mailHl  = highlightFor(t, T.emails,      T.googleDrive - 0.10);
  const driveHl = highlightFor(t, T.googleDrive, T.driveEnd);

  return (
    <AbsoluteFill style={{ background: colors.bg, ... }}>
      <div style={{ display: "flex", gap: 48 }}>
        <PainCard label="Carpetas"     show={carpShow}  highlight={carpHl}  />
        <PainCard label="E-mails"      show={mailShow}  highlight={mailHl}  />
        <PainCard label="Google Drive" show={driveShow} highlight={driveHl} />
      </div>
    </AbsoluteFill>
  );
};

// Helper reutilizable: highlight con ramp-in/hold/ramp-out alrededor de una palabra
const highlightFor = (
  t: number,
  peakStart: number,
  peakEnd: number,
  fadeIn = 0.22,
  fadeOut = 0.22
): number => {
  const ramp = progress(t, peakStart - fadeIn, peakStart);
  const fade = 1 - progress(t, peakEnd, peakEnd + fadeOut);
  return Math.min(ramp, fade);
};
```

La card `PainCard` recibe `show` (0-1, fade-in inicial) y `highlight` (0-1, intensidad de la palabra activa). Internamente interpola estilos:

```tsx
const PainCard: React.FC<{
  show: number;
  highlight: number;
  /* ... */
}> = ({ show, highlight }) => {
  const h = clamp01(highlight);
  const liftY = h * 14;             // sube hasta -14px en peak
  const liftScale = 1 + h * 0.035;
  const borderOp = 0.08 + h * 0.58;
  const glowOp = h * 0.42;
  // ... interpola color de label, ícono, borde, glow, shadow
  return (
    <div style={{
      opacity: show,
      transform: `translateY(${(1 - show) * 30 - liftY}px) scale(${(0.94 + show * 0.06) * liftScale})`,
      boxShadow: `0 0 ${20 + h * 60}px rgba(brandAccent, ${glowOp}), ...`,
      border: `${h > 0.5 ? 2 : 1}px solid rgba(brandAccent, ${borderOp})`,
      // ...
    }}>...</div>
  );
};
```

**Regla práctica**: si los highlights de palabras consecutivas se overlapean ligeramente (~150-200ms), el cross-fade entre cards se siente fluido, no un toggle.

---

## 13. Iconos del producto: reutilizar de la lib antes de inventar

**Por qué**: el SaaS ya tiene un sistema de íconos (`IconArchivos`, `IconCausas`, `IconGoogleDrive`, etc) buildeado y exportado en el dist. Inventar SVGs nuevos dentro del proyecto Remotion para el mismo concepto crea inconsistencia visual con el producto real — el viewer ve "Google Drive" con un dibujo distinto al que ve después en la app.

**Antipatrón**: SVG custom hardcodeado en el proyecto Remotion para "Google Drive":

```tsx
// En Tour.tsx — outline pentagon raro que no se parece al ícono real de la lib
const IconDrive: React.FC<{ size?: number }> = ({ size = 72 }) => (
  <svg viewBox="0 0 24 24" fill="none">
    <path d="M8.5 4h7l5.5 9.5L17.5 21h-11L3 13.5z" stroke="currentColor" />
    {/* ... */}
  </svg>
);
```

**Patrón** — importar el ícono del dist de la lib:

```tsx
import {
  DashboardShell,
  // ...
  IconGoogleDrive,    // ← ya viene buildeado
  IconArchivos,
} from "../../../../../components/dist/index.js";

// Usarlo igual que cualquier otro ícono
<PainCard
  icon={<IconGoogleDrive size={84} />}
  label="Google Drive"
  ...
/>
```

**Excepción**: si necesitás un ícono que **no existe en la lib** (ej: pictogramas auxiliares de un popover — "computadora", "teléfono"), crearlo inline simple con `currentColor` y forma reconocible:

```tsx
const IconComputer: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={1.6}
    strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="12" rx="2" />
    <path d="M8 20h8" /><path d="M12 16v4" />
  </svg>
);
```

Si ese ícono empieza a usarse en más de un video, promoverlo al component library (`components/src/lib/icons/index.tsx`) y rebuildear.

---

## 14. Cursor fade durante cambios de vista

**Por qué**: dentro de una misma Phase, la vista renderizada cambia (ej: lista de clientes → ficha del cliente). El cursor que estaba en coordenadas válidas de la vista anterior queda "en el aire" en la vista nueva (apunta a un row de tabla que ya no existe). Snap brusco a la nueva posición se siente teleport.

**Patrón** — cursor fade out 100ms durante la transición de vista, fade in 100-200ms después en la posición coherente:

```tsx
type FichaStage = "archivos-view" | "clientes-list" | "ficha";

const PhaseFichaCliente: React.FC<{ t: number }> = ({ t }) => {
  // Stage de vista cambia en momentos discretos
  const stage: FichaStage =
    t < 26.30 ? "archivos-view"
    : t < 27.30 ? "clientes-list"
    : "ficha";

  let cursorX = 700;
  let cursorY = 500;
  let cursorOpacity = 1;

  if (t < 27.25) {
    // ... cursor sobre la row Ana de la lista
    cursorX = POS_LIST_ANA.x;
    cursorY = POS_LIST_ANA.y;
  } else if (t < 27.45) {
    // Fade out cursor durante el cambio list → ficha
    cursorX = POS_LIST_ANA.x;
    cursorY = POS_LIST_ANA.y;
    cursorOpacity = 1 - progress(t, 27.25, 27.45);
  } else if (t < 28.30) {
    // Pausa sin cursor (~800ms) para que el viewer absorba la ficha nueva
    cursorOpacity = 0;
  } else if (t < 28.55) {
    // Fade in en la posición de entrada natural a la nueva vista
    // (acá: zona de tabs, izquierda — punto donde un usuario real moverá)
    cursorX = 329;
    cursorY = POS_FICHA_TAB_ARCHIVOS.y;
    cursorOpacity = progress(t, 28.30, 28.55);
  } else if (t < 29.40) {
    // Recorrido por las tabs hacia el target real
    const p = progress(t, 28.55, 29.40);
    cursorX = lerp(329, POS_FICHA_TAB_ARCHIVOS.x, p);
    cursorY = POS_FICHA_TAB_ARCHIVOS.y;
  }
  // ...

  return (
    <Camera keyframes={KF_FICHA}>
      <DashboardShell /* vista según `stage` */>{shellChildren}</DashboardShell>
      {cursorOpacity > 0.005 && <CursorOverlay x={cursorX} y={cursorY} opacity={cursorOpacity} />}
    </Camera>
  );
};
```

**Regla práctica**: cualquier cambio de vista interno a una Phase tiene 3 sub-beats: (1) cursor fade out 100-200ms, (2) pausa visual sin cursor 300-800ms para que el viewer registre la nueva pantalla, (3) cursor fade in en la posición de entrada natural y empieza el recorrido hacia el target.

---

## 15. Modal con doble (o N) selección acumulativa

**Por qué**: muchos modales de SaaS permiten varias selecciones simultáneas (ej: clasificar un archivo por causa Y por cliente). Mostrar el flow completo en video requiere que el viewer vea "primero se eligió esto, después también esto, ambas quedan al pie".

**Patrón** — el widget del modal recibe:
- `activeKind`: qué tab/kindGrid está activa visualmente (rota con el cursor)
- `selectedX`, `selectedY`, ...: cada selección guardada (todas se renderizan como chips/pills al pie)
- Compat opcional con un único `selectedKind`/`selectedName` para usos simples

```tsx
export interface ClasificarArchivoModalWidgetProps {
  open?: boolean;
  /** Tab activa (kind seleccionado en la grilla). Default "causa". */
  activeKind?: "biblioteca" | "causa" | "cliente";
  /** Nombre de la causa seleccionada (chip al pie). */
  selectedCausa?: string;
  /** Nombre del cliente seleccionado (chip al pie). */
  selectedCliente?: string;
  onClose?: () => void;
}

export const ClasificarArchivoModalWidget: React.FC<Props> = ({
  activeKind = "causa",
  selectedCausa,
  selectedCliente,
}) => {
  const list = activeKind === "cliente" ? CLIENTES : CAUSAS;
  const activeName = activeKind === "cliente" ? selectedCliente : selectedCausa;
  const searchLabel = activeKind === "cliente" ? "Buscar cliente..." : "Buscar causa...";

  return (
    <Modal /* ... */>
      <div className={styles.kindGrid}>
        <KindOption label="Biblioteca" active={activeKind === "biblioteca"} />
        <KindOption label="Causa"      active={activeKind === "causa"} />
        <KindOption label="Cliente"    active={activeKind === "cliente"} />
      </div>
      <div className={styles.search}>{searchLabel}</div>
      <div className={styles.results}>
        {list.map(row => (
          <div className={[styles.result, row.title === activeName && styles.resultActive].filter(Boolean).join(" ")}>
            <strong>{row.title}</strong>
          </div>
        ))}
      </div>
      {/* Chips acumulativas — todas las selecciones presentes se renderizan */}
      <div className={styles.selectionList}>
        {selectedCausa && (
          <div className={styles.selection}>
            <span>Causa: {selectedCausa}</span><button>×</button>
          </div>
        )}
        {selectedCliente && (
          <div className={styles.selection}>
            <span>Cliente: {selectedCliente}</span><button>×</button>
          </div>
        )}
      </div>
    </Modal>
  );
};
```

Y desde Remotion, el activeKind y los selected rotan con el tiempo:

```tsx
// Phase D3 (modal de clasificación)
const modalActiveKind: "causa" | "cliente" =
  t < 24.10 ? "causa" : "cliente";
const modalSelectedCliente = t >= 24.10 ? DEMO.CLIENT_NAME : undefined;

const overlay = showModal ? (
  <ClasificarArchivoModalWidget
    activeKind={modalActiveKind}
    selectedCausa={DEMO.CAUSA_NAME}      // siempre presente desde t=16.86
    selectedCliente={modalSelectedCliente} // se suma a partir de t=24.10
  />
) : undefined;
```

Cuando el cursor "clickea" la pestaña Cliente del kindGrid a t=24.10, `activeKind` cambia + `selectedCliente` aparece + chip Cliente se suma al pie sin perder el chip Causa que ya estaba.

**Regla práctica**: las chips/pills del pie deben ser una lista (`flex-direction: column; gap: 6px`) que crece, no un single slot que se reemplaza. Si la lib del SaaS tiene el widget con single-slot legacy, agregar props nuevas opcionales `selectedX`/`selectedY` y mantener `selectedKind`/`selectedName` como compat.

---

## 16. Phase placeholder cuando falta un componente

**Por qué**: en sesiones paralelas (un agente en Codex armando un componente nuevo mientras vos iterás el video), el video necesita renderizar **sin** ese componente para validar el resto del flow. Romper el render por una phase que aún no tiene su widget bloquea todo el feedback loop.

**Patrón** — la Phase de la sección pendiente es un `AbsoluteFill` standalone con texto "TODO" + los datos clave visibles:

```tsx
const PhaseFichaCausa: React.FC<{ t: number }> = ({ t }) => {
  void t;
  return (
    <AbsoluteFill style={{
      background: colors.bg,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 80,
    }}>
      <div style={{ textAlign: "center", maxWidth: 1400 }}>
        <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: "0.22em",
            textTransform: "uppercase", color: colors.fgDim, marginBottom: 24 }}>
          TODO · Ficha de causa
        </div>
        <div style={{ fontSize: 56, fontWeight: 800, color: colors.fg, lineHeight: 1.2 }}>
          {DEMO.CAUSA_NAME}
        </div>
        <div style={{ marginTop: 18, fontSize: 16, color: colors.accent }}>
          {DEMO.CAUSA_EXP}
        </div>
        <div style={{ marginTop: 32, fontSize: 16, color: colors.fgDim }}>
          Pestaña "Archivos" — sincronizada con el archivo subido en el cliente
        </div>
      </div>
    </AbsoluteFill>
  );
};
```

Cuando el componente real está integrado al dist, se reemplaza la implementación. El timing y los `T.*` de los keyframes no cambian.

**Regla práctica**: si una phase está pendiente, NO comentar la `PhaseWrap` en el JSX raíz (rompe los `to=` calculados de las phases vecinas). Dejar la PhaseWrap activa con el placeholder dentro.
