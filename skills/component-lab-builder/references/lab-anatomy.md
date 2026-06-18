# Anatomía del UI-Lab (CORE — agnóstico de stack)

Esta arquitectura es el **ancestro común** de nuestras bibliotecas: Alquímica UI-Lab la **portó de itera-ui**. Sirve igual con shadcn+Tailwind o con base-ui+CSS-Modules — lo que cambia (estilo) está en los adapters.

Implementación de referencia (shadcn): `resources/js/components/ui-lab/`. itera-ui (base-ui) tiene la equivalente en `src/gallery/` + `src/lib/`.

## Archivos clave (referencia Alquímica)

```
components/ui-lab/
├── registry.tsx          # registro plano de STORIES + categorías (orden + labels)
├── types.ts              # Story, Variant, StoryCategory, canvas modes, Viewport
├── gallery-shell.tsx     # el visor: sidebar de categorías + ThemeSwitcher + canvas
├── iframe-host.tsx       # monta cada story con createPortal al body del iframe
├── responsive-canvas.tsx # el iframe + resize de resoluciones + zoom
├── shell/                # primitivas de layout (PageBody, PageWidth, AppShellFrame)
├── composition/          # piezas que combinan primitivas (DataTable, FormDialog, Select…)
│   ├── iframe-portal.tsx # IframePortalProvider + useIframePortalContainer (CORE, ver abajo)
│   └── …
└── stories/              # una story-file por pantalla/grupo (productos.tsx, clientes.tsx…)
```

itera-ui (forma equivalente): `src/gallery/{registry,canvas,stories,shell}` + `src/lib/{primitives,domain,tokens}`.

## El modelo de Story

```ts
type StoryCategory = 'shell' | 'screens' | 'foundations' | 'primitives' | 'states' | 'a11y' | 'compositions';

interface Story {
  id: string;            // único, kebab (ej: 'screen-productos')
  title: string;
  category: StoryCategory;
  description?: string;
  canvas?: 'responsive' | 'flat' | 'shell';   // default 'responsive'
  variants: Variant[];   // cada una: { id, label, description?, render: () => ReactNode }
}
```

Una story = metadata + N variantes. Las pantallas reales suelen ser **una sola variante** que renderiza la vista completa.

## Modos de canvas (decisión crítica)

- **`responsive`** (default): iframe con resize de resoluciones; `@media`/`clamp`/container queries disparan contra el ancho real. Cada variante en el VariantBoard (chrome por variante). Para primitivas/composiciones que NO portalean fuera.
- **`flat`**: render directo en el documento (SIN iframe). **Para componentes con portal** si NO se usa el espejo iframe-aware (portalean a `document.body` y se escaparían). Útil para demos sueltas de overlays.
- **`shell`**: iframe full-bleed (como responsive) pero SIN VariantBoard: la story ocupa todo el alto. Para el App Shell y las **pantallas completas**. Una sola variante. Acá los overlays DEBEN usar el espejo iframe-aware (ver footgun).

Regla rápida: pantalla real con modales/selects/menús → `shell` + `IframePortalProvider` + overlays iframe-aware. Demo suelta de una primitiva con portal → `flat`.

## Registry

`registry.tsx`: `STORIES: Story[]` (spread de cada `xStories`), `CATEGORY_ORDER` + `CATEGORY_LABELS`, helpers (`groupByCategory`, `getStory`, `FIRST_STORY_ID`).

**Agregar una story = sumar su `xStories` al spread.** Categoría nueva = tocar `StoryCategory` (types.ts) + `CATEGORY_ORDER` + `CATEGORY_LABELS`.

## Provider de portal del iframe + EL footgun (AGNÓSTICO)

El visor monta cada story con `createPortal` al `body` del **iframe**: el DOM vive DENTRO del iframe, pero el JS corre en la ventana **padre**. Toda primitiva con `<Portal>` (Dialog/Select/Menu/Popover/Tooltip — **sea Radix o base-ui**) portalea por default al `document.body` del **padre** → se **escapa del iframe**:

- queda FUERA del scope de estilo del lab → **sin tematizar**.
- se posiciona contra el viewport del padre → **mal ubicada**.

Síntoma: abrís un select/menú/modal en una story `shell`/`responsive` y aparece sin estilo y/o descolocado.

**Solución agnóstica (el provider es core; el espejo concreto es del adapter):**

```tsx
// composition/iframe-portal.tsx  (CORE)
const PortalContainerContext = createContext<HTMLElement | null>(null);

export function IframePortalProvider({ children }) {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const ref = useCallback((node) => { if (node) setContainer(node.ownerDocument.body); }, []);
  return <div ref={ref} style={{ display: 'contents' }}>
    <PortalContainerContext.Provider value={container}>{children}</PortalContainerContext.Provider>
  </div>;
}
export function useIframePortalContainer() { return useContext(PortalContainerContext); }
```

- La **story** (canvas `shell`/`responsive`) se envuelve en `<IframePortalProvider>`.
- Cada primitiva con portal se usa vía un **espejo** que pasa `container={useIframePortalContainer()}` a su `<Portal>`. El código del espejo es **stack-specific** → está en el adapter (Radix en el de shadcn; base-ui en el suyo).
