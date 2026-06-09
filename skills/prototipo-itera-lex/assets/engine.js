/* ===========================================================================
   ÍTERA Lex — motor de prototipos (genérico, sin dependencias).
   Conmuta visibilidad por data-attributes y maneja dots/footer/theme/selects.

   Estado: { step, g:{<grupo>:<valor>} }.  render() sincroniza todo.

   Contratos (todo opcional — usá solo lo que el prototipo necesite):
   - Paso:   [data-panel][data-step="N"]                  visible si step===N
   - Modo:   [data-panel][data-show="grupo:valor"]        visible si g[grupo]===valor
             (combinable: data-show="paso? + grupo:valor"; varios con coma)
   - Toggle: [data-set="grupo:valor"]                      setea g[grupo]; .on si activo
   - Dots:   [data-dots] con .dot y .seg-line intercalados
   - Footer: [data-next]>[data-next-label], [data-back], [data-cancel]
             [data-next][data-final-label="Crear causa"] → label en el último paso
   - Saltos: [data-jump="2;grupo:valor"]                   (chips de estado)
   - Theme:  [data-theme-toggle]                           flip light/dark
   - Select: .xselect[data-options="rol"] (ver OPTION_SETS) → popover estilizado
   - Combo:  [data-combo-input] + .combo-results/.combo-opt
   - Deep-link / screenshots: ?step=2&grupo=valor&theme=light&open=0
   =========================================================================== */
(function () {
  const state = { step: 1, g: {} }

  // ---- option sets para .xselect[data-options="..."] (editá/extendé a gusto) ----
  const OPTION_SETS = {
    rol: ['Parte actora', 'Parte demandada', 'Imputado', 'Víctima', 'Querellante', 'Denunciante', 'Fiscal', 'Tercero', 'Otro'],
    jurisdiccion: ['Río Negro', 'Neuquén', 'Federal'],
    tipodoc: ['DNI', 'CUIT', 'CUIL'],
  }
  const CHEV = '<svg class="chev ic-sm" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>'
  const CK = '<svg class="ck ic-sm" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>'

  const pairs = (str) => (str || '').split(',').map((s) => s.trim()).filter(Boolean)
  const maxStep = () =>
    Math.max(1, ...[...document.querySelectorAll('[data-step]')].map((e) => Number(e.dataset.step) || 1))

  function visible(el) {
    if (el.dataset.step && Number(el.dataset.step) !== state.step) return false
    for (const p of pairs(el.dataset.show)) {
      const [grp, val] = p.split(':')
      if (state.g[grp] !== val) return false
    }
    return true
  }

  function buildSelects() {
    document.querySelectorAll('.xselect[data-options]').forEach((xs) => {
      const opts = OPTION_SETS[xs.dataset.options] || []
      const val = xs.dataset.value || opts[0] || ''
      const items = opts
        .map((o) => `<button type="button" class="xselect-opt${o === val ? ' on' : ''}"><span class="lbl">${o}</span>${CK}</button>`)
        .join('')
      xs.innerHTML =
        `<button type="button" class="xselect-trigger"><span class="xselect-value">${val}</span>${CHEV}</button>` +
        `<div class="xselect-pop">${items}</div>`
    })
  }

  function render() {
    document.querySelectorAll('[data-panel]').forEach((el) => {
      const show = visible(el)
      el.hidden = !show
      if (show && !el.classList.contains('fade')) {
        el.classList.add('fade')
        el.addEventListener('animationend', () => el.classList.remove('fade'), { once: true })
      }
    })
    document.querySelectorAll('[data-set]').forEach((b) => {
      const [grp, val] = b.dataset.set.split(':')
      b.classList.toggle('on', state.g[grp] === val)
    })
    const dots = document.querySelector('[data-dots]')
    if (dots) {
      dots.querySelectorAll('.dot').forEach((d, i) => d.classList.toggle('fill', i + 1 <= state.step))
      dots.querySelectorAll('.seg-line').forEach((l, i) => l.classList.toggle('fill', i + 2 <= state.step))
    }
    const back = document.querySelector('[data-back]')
    const cancel = document.querySelector('[data-cancel]')
    if (back) back.hidden = state.step === 1
    if (cancel) cancel.hidden = state.step !== 1
    const next = document.querySelector('[data-next]')
    const nextLabel = document.querySelector('[data-next-label]')
    if (nextLabel) nextLabel.textContent = state.step < maxStep() ? 'Siguiente' : (next?.dataset.finalLabel || 'Confirmar')
    document.querySelectorAll('[data-jump]').forEach((c) => {
      const [st, ...mods] = c.dataset.jump.split(';')
      let on = Number(st) === state.step
      for (const m of mods) { const [grp, val] = m.split(':'); on = on && state.g[grp] === val }
      c.classList.toggle('on', on)
    })
  }

  function go(step) { state.step = Math.max(1, Math.min(maxStep(), step)); render() }

  document.addEventListener('click', (e) => {
    const trig = e.target.closest('.xselect-trigger')
    if (trig) {
      const xs = trig.closest('.xselect'); const wasOpen = xs.classList.contains('open')
      document.querySelectorAll('.xselect.open').forEach((x) => x.classList.remove('open'))
      xs.classList.toggle('open', !wasOpen); return
    }
    const xopt = e.target.closest('.xselect-opt')
    if (xopt) {
      const xs = xopt.closest('.xselect')
      xs.querySelectorAll('.xselect-opt').forEach((o) => o.classList.remove('on'))
      xopt.classList.add('on')
      xs.querySelector('.xselect-value').textContent = xopt.querySelector('.lbl').textContent
      xs.classList.remove('open'); return
    }
    document.querySelectorAll('.xselect.open').forEach((x) => x.classList.remove('open'))

    const setBtn = e.target.closest('[data-set]')
    if (setBtn) { const [grp, val] = setBtn.dataset.set.split(':'); state.g[grp] = val; render(); return }
    if (e.target.closest('[data-theme-toggle]')) { toggleTheme(); return }
    if (e.target.closest('[data-next]')) { go(state.step + 1); return }
    if (e.target.closest('[data-back]')) { go(state.step - 1); return }
    if (e.target.closest('[data-cancel]')) return

    const opt = e.target.closest('.combo-opt')
    if (opt) {
      const wrap = opt.closest('.combo-results')
      wrap.querySelectorAll('.combo-opt').forEach((o) => o.classList.remove('on'))
      opt.classList.add('on')
      const sel = wrap.parentElement.querySelector('[data-combo-selected]')
      if (sel) { sel.textContent = opt.querySelector('.co-title').textContent; sel.hidden = false }
      return
    }
    const cbx = e.target.closest('.cbx')
    if (cbx) { cbx.classList.toggle('on'); return }
    const jump = e.target.closest('[data-jump]')
    if (jump) {
      const [st, ...mods] = jump.dataset.jump.split(';')
      state.step = Number(st) || 1
      for (const m of mods) { const [grp, val] = m.split(':'); state.g[grp] = val }
      render(); return
    }
  })

  // filtrado naïve del combo al tipear (cosmético)
  document.addEventListener('input', (e) => {
    if (!e.target.matches('[data-combo-input]')) return
    const results = e.target.closest('.combo').querySelector('.combo-results')
    const q = e.target.value.trim().toLowerCase()
    let any = false
    results.querySelectorAll('.combo-opt').forEach((o) => {
      const hit = o.textContent.toLowerCase().includes(q)
      o.hidden = q.length > 0 && !hit
      if (!o.hidden) any = true
    })
    const empty = results.querySelector('.combo-empty')
    if (empty) empty.hidden = !(q.length > 0 && !any)
  })

  function toggleTheme() {
    const root = document.documentElement
    const dark = root.dataset.theme !== 'dark'
    root.dataset.theme = dark ? 'dark' : 'light'
    document.querySelectorAll('[data-theme-label]').forEach((l) => (l.textContent = dark ? 'Light' : 'Dark'))
  }

  function applyQuery() {
    const p = new URLSearchParams(location.search)
    if (p.has('step')) state.step = Math.max(1, Math.min(maxStep(), Number(p.get('step')) || 1))
    if (p.has('theme')) { document.documentElement.dataset.theme = p.get('theme'); }
    // cualquier otro param se interpreta como grupo=valor (ej: ?cliente=detectado)
    for (const [k, v] of p) { if (!['step', 'theme', 'open'].includes(k)) state.g[k] = v }
    if (p.has('open')) {
      const xs = document.querySelectorAll('.xselect')[Number(p.get('open')) || 0]
      if (xs) xs.classList.add('open')
    }
  }

  window.addEventListener('DOMContentLoaded', () => { buildSelects(); applyQuery(); render() })
})()
