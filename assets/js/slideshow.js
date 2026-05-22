/* ============================================================
   SLIDESHOW.JS — FOTOP v3.0
   Lógica dos slideshows isolada: hero principal, olhar, street.
   Exporta funções para uso pelo main.js (orquestrador).
   ============================================================ */

'use strict';

/* ── Hero Slideshow ──────────────────────────────────────── */

function initHeroSlideshow() {
  const slides = document.querySelectorAll('.hero-slide');
  if (!slides.length) return;

  let current = 0;

  // Garante que o primeiro está ativo
  slides[0].classList.add('active');

  setInterval(() => {
    slides[current].classList.remove('active');
    current = (current + 1) % slides.length;
    slides[current].classList.add('active');
  }, 3500);
}

/* ── Olhar Slideshow ─────────────────────────────────────── */

let _olharInterval = null;

function initOlharSlideshow() {
  if (_olharInterval) clearInterval(_olharInterval);

  const slides = document.querySelectorAll('.olhar-slide');
  if (!slides.length) return;

  let current = 0;
  slides.forEach((s, i) => s.classList.toggle('active', i === 0));

  _olharInterval = setInterval(() => {
    slides[current].classList.remove('active');
    current = (current + 1) % slides.length;
    slides[current].classList.add('active');
  }, 3000);
}

/* ── Street Slideshow ────────────────────────────────────── */

let _streetInterval = null;

function initStreetSlideshow() {
  if (_streetInterval) clearInterval(_streetInterval);

  const slides = document.querySelectorAll('.street-slide');
  if (!slides.length) return;

  let current = 0;
  slides.forEach((s, i) => s.classList.toggle('active', i === 0));

  _streetInterval = setInterval(() => {
    slides[current].classList.remove('active');
    current = (current + 1) % slides.length;
    slides[current].classList.add('active');
  }, 3000);
}
