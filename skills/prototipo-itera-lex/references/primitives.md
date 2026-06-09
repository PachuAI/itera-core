# Primitivos — cheat-sheet de HTML

Copiá y adaptá. Todos consumen `tokens.css` + `primitives.css` (cambian solos light/dark).
NO hardcodear colores/sombras: usá las clases. SVGs inline con `stroke="currentColor"` (clases `.ic`/`.ic-sm`/`.ic-lg`).

## Índice
1. Esqueleto de página (arrancá siempre por acá)
2. Modal + header + step dots
3. Toggle segmentado
4. Campo line / Campo framed
5. Select custom (NUNCA `<select>` nativo)
6. Choice cards / Radios slim
7. Combobox (search async simulado)
8. Sugerencia inteligente
9. Checkbox / Filas / Review rows
10. Footer + chips de estado + iconos

---

## 1. Esqueleto de página

```html
<!doctype html>
<html lang="es-AR" data-theme="dark">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Mi vista · Mock ÍTERA Lex</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Geist+Mono:wght@400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="tokens.css">
  <link rel="stylesheet" href="primitives.css">
</head>
<body>
  <div class="proto-bar">
    <div class="pb-brand">ÍTERA <b>Lex</b> · Mi vista</div>
    <nav class="proto-nav">
      <a href="index.html">Comparar</a>
      <a href="variante-a.html" class="active">A · …</a>
    </nav>
    <div class="proto-spacer"></div>
    <button class="theme-toggle" data-theme-toggle aria-label="Cambiar tema">◑ <span data-theme-label>Light</span></button>
  </div>

  <div class="stage"><div class="stage-col">
    <!-- chips de estado opcionales (sección 10) -->
    <!-- TU CONTENIDO: un .modal, o una página suelta dentro de .stage-col -->
  </div></div>

  <script src="engine.js"></script>
</body>
</html>
```

`data-theme="dark"` por defecto (= la app). El botón de la barra conmuta a light. Para vistas no-modales (una página, un panel), usá `.stage-col` como contenedor y subí su `max-width` si hace falta.

## 2. Modal + header + step dots

```html
<div class="modal">
  <button class="modal-x" aria-label="Cerrar"><svg class="ic" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
  <div class="modal-head">
    <div class="head-row">
      <h2 class="modal-title">Importar expediente</h2>
      <div class="dots" data-dots>
        <span class="dot fill"></span><span class="seg-line"></span>
        <span class="dot"></span><span class="seg-line"></span>
        <span class="dot"></span>
      </div>
    </div>
    <a class="exp-link" href="#">CI-00013-P-2023 <svg viewBox="0 0 24 24" class="ic-sm"><path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg></a>
  </div>
  <div class="body"><!-- pasos / contenido --></div>
  <div class="modal-foot"><!-- sección 10 --></div>
</div>
```

Paneles por paso/modo: `<div data-panel data-step="1">…</div>` y `<div data-panel data-step="2" data-show="modo:nuevo">…</div>`. El engine los muestra/oculta.

## 3. Toggle segmentado (elegir 1 de 2-3 modos — hace VISIBLE la decisión)

```html
<div class="field">
  <label>¿Dónde cargás este expediente?</label>
  <div class="seg">
    <button data-set="destino:nueva">Crear causa nueva</button>
    <button data-set="destino:existente">Sumar a una existente</button>
  </div>
</div>
```
Activo = pill naranja saturado (`bg-itera`, ambos temas). El engine pone `.on`. Definí el default con `?destino=nueva` o seteá `.on` en el markup inicial.

## 4. Campos

**Line** (default en modales/forms simples — subrayado, sin frame, sin ring):
```html
<div class="field">
  <label>Carátula</label>
  <input class="line-input" value="…">
</div>
```
**Framed** (cuando el form en dialog necesita delimitar campos con caja — focus = glow naranja sutil):
```html
<div class="field">
  <label>Carátula</label>
  <input class="fr-input" value="…">
</div>
```
Grilla de 2: envolvé en `<div class="grid2">…</div>`. Label opcional muted: `<span class="sub">(opcional)</span>`.

## 5. Select custom (el `<select>` nativo abre un popup blanco feo — NO usar)

```html
<div class="xselect" data-options="rol" data-value="Otro"></div>
<div class="xselect compact" data-options="rol" data-value="Fiscal" style="width:130px"></div>
```
El engine lo construye desde `OPTION_SETS` (rol/jurisdiccion/tipodoc; agregá los tuyos en `engine.js`). `.compact` = popover alineado a la derecha (para selects angostos en filas).

## 6. Choice cards / Radios slim (elegir cliente, plan, etc.)

**Choice cards** (decisión guiada, con ícono + ayuda):
```html
<div class="choices">
  <button class="choice" data-set="cliente:detectado">
    <span class="ch-radio"></span>
    <span class="ch-ic"><svg class="ic-lg" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="m16 11 2 2 4-4"/></svg></span>
    <span class="ch-main"><span class="ch-title">Cargar a ARAYA, JULIO CESAR</span><span class="ch-sub">Detectado en el expediente.</span></span>
  </button>
</div>
```
**Radios slim** (lista liviana, minimal):
```html
<div class="opt-group">
  <button class="opt-slim" data-set="cliente:detectado"><span class="r"></span><span class="t">Cargar a <b>ARAYA, JULIO CESAR</b> <span class="d">· detectado</span></span></button>
  <button class="opt-slim" data-set="cliente:buscar"><span class="r"></span><span class="t">Elegir un cliente existente</span></button>
</div>
```

## 7. Combobox (un campo con lupa + resultados flat debajo — sin botón-lupa ni caja anidada)

```html
<div class="combo">
  <div class="ci-wrap">
    <span class="ci-ic"><svg class="ic-sm" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg></span>
    <input class="line-input" data-combo-input placeholder="Carátula o N° de expediente">
  </div>
  <div class="combo-results">
    <button class="combo-opt"><span class="co-title">Causa Test 1</span><span class="co-sub">Activa · CI-00188-P-2024</span></button>
    <p class="combo-empty" hidden>Sin coincidencias. Probá otro término.</p>
  </div>
</div>
```
Variante framed: input `class="fr-input"` + ícono `class="ci-ic framed"`.

## 8. Sugerencia inteligente (banner de detección — usalo con criterio, mejor como opción concreta)

```html
<div class="suggest">
  <span class="sg-ic"><svg class="ic" viewBox="0 0 24 24"><path d="m12 3 1.9 5.8H20l-4.9 3.6 1.9 5.8L12 14.6 7 18.2l1.9-5.8L4 8.8h6.1z"/></svg></span>
  <span class="sg-main">Desde el expediente, detectamos que tu cliente es <span class="sg-name">ARAYA, JULIO CESAR</span>.</span>
</div>
```

## 9. Checkbox / Filas / Review rows

```html
<label class="cbx on"><span class="box"><svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><path d="M20 6 9 17l-5-5"/></svg></span><span>Completar campos vacíos.</span></label>

<div class="list framed">
  <div class="prow">
    <label class="cbx on"><span class="box"><svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><path d="M20 6 9 17l-5-5"/></svg></span></label>
    <div class="p-main"><div class="p-name">SOSA LUKMAN, MARCOS</div><div class="p-meta"><span class="mono">DNI 33.658.560</span> · Fiscal</div></div>
    <div class="xselect compact" data-options="rol" data-value="Fiscal" style="width:130px"></div>
  </div>
</div>

<div class="rev">
  <div class="rev-row"><span class="rv-k">Carátula</span><span class="rv-v">PEREIRA…</span><button class="rv-edit" aria-label="Editar"><svg class="ic-sm" viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button></div>
  <div class="rev-row"><span class="rv-k">Fecha</span><span class="rv-v placeholder">Sin completar</span></div>
</div>
```

## 10. Footer + chips de estado + iconos

```html
<div class="modal-foot">
  <button class="btn btn-ghost" data-cancel>Cancelar</button>
  <button class="btn btn-ghost" data-back hidden>Atrás</button>
  <button class="btn btn-primary" data-next data-final-label="Crear causa"><span data-next-label>Siguiente</span></button>
</div>

<div class="states">
  <span class="st-label">Saltar a un estado</span>
  <button class="chip" data-jump="1;destino:nueva">P1 · Causa nueva</button>
  <button class="chip" data-jump="2;cliente:detectado">P2 · Cliente detectado</button>
</div>
```

Iconos: copiá paths de [lucide.dev](https://lucide.dev) en `<svg class="ic" viewBox="0 0 24 24">…</svg>`. Tamaños `.ic`(18) `.ic-sm`(15) `.ic-lg`(22). Color = `currentColor` (heredá del contenedor; ícono representativo de marca = `text` naranja vía clase del padre o `color: var(--itera)` inline solo si hace falta).
