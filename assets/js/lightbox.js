/* ============================================================
   LIGHTBOX.JS — FOTOP v3.0
   Lightbox isolado com suporte a teclado e swipe.
   Expõe o objeto `lightbox` globalmente para uso pelo gallery.js
   ============================================================ */

'use strict';

const lightbox = (() => {
  let el, imgEl;
  let allImgs = [];
  let currentIndex = 0;
  let touchStartX = 0;

  /* ── Init ── */
  function init() {
    const lb = document.createElement('div');
    lb.id = 'lightbox';
    lb.innerHTML = `
      <div id="lb-overlay"></div>
      <button id="lb-close" aria-label="Fechar">&#x2715;</button>
      <button id="lb-prev"  aria-label="Anterior">&#x2039;</button>
      <button id="lb-next"  aria-label="Próximo">&#x203A;</button>
      <div id="lb-img-wrap">
        <img id="lb-img" src="" alt="" class="lb-img-transition">
        <div id="lb-loader"></div>
      </div>
      <div id="lb-counter"></div>`;
    document.body.appendChild(lb);
    el    = lb;
    imgEl = lb.querySelector('#lb-img');

    // Eventos de UI
    lb.querySelector('#lb-overlay').addEventListener('click', close);
    lb.querySelector('#lb-close').addEventListener('click', close);
    lb.querySelector('#lb-prev').addEventListener('click', prev);
    lb.querySelector('#lb-next').addEventListener('click', next);

    // Teclado
    document.addEventListener('keydown', e => {
      if (!lb.classList.contains('lb-active')) return;
      if (e.key === 'Escape')      close();
      if (e.key === 'ArrowLeft')   prev();
      if (e.key === 'ArrowRight')  next();
    });

    // Swipe (touch)
    lb.addEventListener('touchstart', e => {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });

    lb.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 50) dx < 0 ? next() : prev();
    });
  }

  /* ── Open ── */
  function open(clickedImg, gridEl) {
    allImgs = Array.from(gridEl.querySelectorAll('img'))
      .filter(img => img.complete && img.naturalWidth > 0);
    currentIndex = allImgs.indexOf(clickedImg);
    if (currentIndex === -1) currentIndex = 0;
    el.classList.add('lb-active');
    document.body.style.overflow = 'hidden';
    _load(allImgs[currentIndex].src);
  }

  /* ── Close ── */
  function close() {
    el.classList.remove('lb-active');
    document.body.style.overflow = '';
    imgEl.src = '';
  }

  /* ── Navigation ── */
  function prev() {
    currentIndex = (currentIndex - 1 + allImgs.length) % allImgs.length;
    _load(allImgs[currentIndex].src);
  }

  function next() {
    currentIndex = (currentIndex + 1) % allImgs.length;
    _load(allImgs[currentIndex].src);
  }

  /* ── Load image ── */
  function _load(src) {
    const loader  = el.querySelector('#lb-loader');
    const counter = el.querySelector('#lb-counter');

    loader.style.display = 'block';
    imgEl.style.opacity  = '0';

    const tmp = new Image();
    tmp.src = src;
    tmp.onload  = () => { imgEl.src = src; imgEl.style.opacity = '1'; loader.style.display = 'none'; };
    tmp.onerror = () => { loader.style.display = 'none'; };

    counter.textContent = `${currentIndex + 1} / ${allImgs.length}`;
  }

  return { init, open, close, prev, next };
})();

/* Inicializa automaticamente ao carregar */
document.addEventListener('DOMContentLoaded', () => lightbox.init());
