/* ═══════════════════════════════════════════════════════════════════════
 * story-kit.js — motor de reveal + escalera para stories 9:16
 *
 * Vanilla, sin módulos, file:// safe. Comparte globals top-level.
 * Lee location.search y SOLO en el browser muta el DOM:
 *   - sin query        → no-op. Queda la composición final (lo que rendea render.mjs).
 *   - ?view=ladder     → reemplaza el body por la escalera (clones acumulativos en filas).
 *   - ?step=N          → frame único hasta el paso N (para export PNG por paso).
 *
 * El JS es ADITIVO: si no carga o no hay query reconocida, la pieza final
 * igual se ve completa (el CSS solo oculta bajo .is-stepping, que pone el JS).
 * ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  function stepOf(el) {
    return parseInt(el.getAttribute('data-step'), 10) || 0;
  }

  function maxStep(root) {
    var declared = parseInt(root.getAttribute('data-max-step'), 10) || 0;
    var computed = 0;
    root.querySelectorAll('[data-step]').forEach(function (el) {
      var k = stepOf(el);
      if (k > computed) computed = k;
    });
    return Math.max(declared, computed);
  }

  // Muestra acumulativamente los elementos hasta `step` (k <= step visibles).
  function applyStep(root, step) {
    root.classList.add('is-stepping');
    root.querySelectorAll('[data-step]').forEach(function (el) {
      el.classList.toggle('is-on', stepOf(el) <= step);
    });
  }

  // "Qué entra en este paso": labels de los elementos que se activan en `step`.
  function enterLabels(root, step) {
    var labels = [];
    root.querySelectorAll('[data-step="' + step + '"]').forEach(function (el) {
      var lbl = el.getAttribute('data-enter-label');
      if (lbl) { labels.push(lbl); return; }
      var t = (el.textContent || '').trim().replace(/\s+/g, ' ');
      if (t) { labels.push(t.length > 52 ? t.slice(0, 52) + '…' : t); }
      else { labels.push((el.className || '').split(' ')[0] || 'elemento'); }
    });
    return labels;
  }

  function buildLadder(story) {
    var max = maxStep(story);

    var page = document.createElement('div');
    page.className = 'ladder-page';

    var head = document.createElement('header');
    head.className = 'ladder-head';
    var kicker = document.createElement('span');
    kicker.className = 'ladder-kicker';
    kicker.textContent = 'STORYBOARD · REVEAL';
    var title = document.createElement('h1');
    title.className = 'ladder-title';
    title.textContent = document.title || 'Story';
    var meta = document.createElement('p');
    meta.className = 'ladder-meta';
    meta.textContent = max + ' pasos · 1080×1920 · cada frame agrega un elemento';
    head.appendChild(kicker);
    head.appendChild(title);
    head.appendChild(meta);
    page.appendChild(head);

    var frames = document.createElement('div');
    frames.className = 'ladder-frames';

    for (var k = 1; k <= max; k++) {
      var isFinal = (k === max);

      var cell = document.createElement('div');
      cell.className = 'ladder-cell' + (isFinal ? ' is-final' : '');

      var thumb = document.createElement('div');
      thumb.className = 'ladder-thumb';
      var clone = story.cloneNode(true);
      applyStep(clone, k);
      thumb.appendChild(clone);
      cell.appendChild(thumb);

      var cap = document.createElement('div');
      cap.className = 'ladder-cap';
      var stepEl = document.createElement('span');
      stepEl.className = 'ladder-step';
      stepEl.textContent = 'Paso ' + k + (isFinal ? ' · pieza final' : '');
      var enterEl = document.createElement('span');
      enterEl.className = 'ladder-enter';
      var labels = enterLabels(story, k);
      enterEl.textContent = labels.length ? '+ ' + labels.join('  ·  ') : '— (pausa, sin elemento nuevo)';
      cap.appendChild(stepEl);
      cap.appendChild(enterEl);
      cell.appendChild(cap);

      frames.appendChild(cell);
    }

    page.appendChild(frames);
    document.body.innerHTML = '';
    document.body.classList.add('ladder-body');
    document.body.appendChild(page);
  }

  function init() {
    var story = document.querySelector('.story');
    if (!story) return;

    var params = new URLSearchParams(window.location.search);
    var view = params.get('view');
    var step = params.get('step');

    if (view === 'ladder') {
      buildLadder(story);
    } else if (step !== null) {
      var n = parseInt(step, 10);
      applyStep(story, isNaN(n) ? maxStep(story) : n);
    }
    // else: no-op → composición final intacta.
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
