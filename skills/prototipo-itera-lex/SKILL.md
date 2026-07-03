---
name: prototipo-itera-lex
description: >-
  Prototipar partes de la UI del SaaS ÍTERA Lex como mocks HTML standalone, fieles a la marca
  (tokens dark+light de docs/brand.md, patrones anti-slop, naranja ÍTERA, tipografía Plus Jakarta,
  tono para abogados) SIN tener que reexplicar nada de eso. Trae bundleados los tokens, los
  primitivos (modal, inputs line/framed, segmented, choice cards, combobox, select custom estilizado,
  review rows, listas) y un motor de estados por data-attributes, más un checklist anti-slop. Usalo
  SIEMPRE que el usuario quiera explorar, rediseñar o iterar UX de ÍTERA Lex antes de tocar el código
  React: "prototipá el wizard de X", "armame un mock de la pantalla de Y", "quiero ver 3 opciones de
  UI para Z", "rediseñemos el modal de W", "maquetá esto en HTML antes de implementar", "cómo quedaría
  la vista de …", "/prototipo-itera-lex". También cuando una feature nueva necesita diseñarse visualmente
  primero. NO uses este skill para implementar en la app real (eso es arch-itera-lex /
  frontend en Next), ni para piezas de marketing/redes/video (esos son otros skills iteralex-*).
---

# Prototipo ÍTERA Lex (HTML)

Convierte "quiero ver cómo quedaría X" en un mock HTML clickeable, fiel a la marca, en minutos —
sin reexplicar tokens, anti-slop ni tono. El output es para **decidir dirección de diseño**, no
producción: HTML/CSS standalone que abre en el browser y se compara/itera rápido.

## Cuándo 1 variante vs 3
- **Iteración / arreglo puntual** (rediseñar algo que ya existe, con dirección clara) → 1 prototipo.
- **Exploración** ("no sé cómo encararlo", "mostrame opciones") → **3 variantes distintas** que testeen
  hipótesis de UX diferentes (ej: minimal/segmentado vs guiado/cards vs denso/revisión) + un `index.html`
  comparador con diagnóstico del problema, tabla de copy antes→ahora, y tu **recomendación con criterio**
  (no complaciente: pros/contras reales de cada camino).

## Workflow

1. **Entendé qué prototipar.** Si rediseñás algo existente, leé el componente real para respetar el
   contenido/data y los flujos. Identificá los problemas de UX concretos a resolver.

2. **Creá la carpeta** `prototipo-<tema>-itera-lex/` en la raíz del repo `itera-lex` (misma convención que
   `prototipo-escritorio-itera-lex/`, `prototipo-configuracion-itera-lex/`). Es committeable como los otros.

3. **Copiá los assets** de este skill a esa carpeta (así los `href` relativos funcionan y el prototipo es
   autocontenido): `assets/tokens.css`, `assets/primitives.css`, `assets/engine.js`.

4. **Cross-check de drift** (rápido): grepeá `:root` / `.dark` en `src/app/globals.css` del repo. Si algún
   token de marca cambió desde el snapshot, actualizá `tokens.css` en la carpeta del prototipo. Si tocás
   color/tono fino, mirá `docs/brand.md` y el skill `iteralex-copy-voice`.

5. **Construí el/los HTML** copiando y adaptando de `references/primitives.md` (TIENE el esqueleto de página
   + el HTML de cada primitivo). Linkeá `tokens.css` y `primitives.css` en el `<head>` y `engine.js` antes
   de `</body>`. `<html data-theme="dark">` por defecto; la barra trae el toggle a light.

6. **Respetá `references/anti-slop.md`** — es el checklist que separa "se ve ÍTERA" de "se ve IA". Lo más
   olvidado: en **light** el naranja va casi solo en las acciones (`--itera-ink` adapta a gris); nada de
   box-in-box; nada de ring de focus; `<select>` nativo prohibido (usá `.xselect`); buscadores como `.combo`.

7. **Si hay flujo multi-estado** (wizard, modos, tabs), usá el motor: paneles `data-panel` con `data-step`/
   `data-show="grupo:valor"`, toggles `data-set="grupo:valor"`, dots `data-dots`, footer `data-next`/`data-back`,
   y chips `data-jump` para saltar a cualquier estado. El engine también da deep-link por query
   (`?step=2&grupo=valor&theme=light`) — útil para screenshots. Contrato completo en el header de `engine.js`.

8. **Verificá con screenshots headless en AMBOS temas** y mirá las imágenes con criterio (no asumas que
   está bien). Iterá hasta que se vea fiel:
   ```bash
   D="prototipo-<tema>-itera-lex/<archivo>.html"
   for t in dark light; do
     google-chrome --headless=new --disable-gpu --hide-scrollbars --window-size=900,1300 \
       --virtual-time-budget=2500 --screenshot="/tmp/proto-$t.png" "file://$PWD/$D?theme=$t"
   done
   ```
   (fallback: `chromium`/`chromium-browser`). Para capturar un select abierto: `&open=0`.

9. **Presentá**: link a abrir en el browser + qué probar (pasos/modos/chips) + tu recomendación. Si fueron
   3 variantes, abrí por el `index.html` comparador.

## Recursos del skill
- `assets/tokens.css` — tokens de marca light+light (snapshot de globals.css). Copiar al prototipo.
- `assets/primitives.css` — chrome + todos los primitivos. Copiar al prototipo.
- `assets/engine.js` — motor de estados / theme toggle / select custom / combo. Copiar al prototipo.
- `references/primitives.md` — **leelo siempre**: esqueleto de página + HTML de cada primitivo (copy-paste).
- `references/anti-slop.md` — **leelo siempre antes de entregar**: checklist de marca / anti-slop / copy.

## Notas
- Es maqueta, no app: data hardcodeada de ejemplo (realista del dominio jurídico: carátulas, expedientes,
  DNI, roles procesales). Estética pixel-fiel, no data-fiel.
- Cuando el usuario elige una dirección, el paso siguiente (implementar en React) NO es este skill — pasá a
  planificar la implementación sobre los componentes reales.
