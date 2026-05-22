/* ============================================================
   ANIMATIONS.JS — FOTOP v3.0
   GSAP + ScrollTrigger:
     • Entrada do hero (coords, linha, título, CTA, scroll)
     • Scroll reveal genérico (.gsap-reveal + data-reveal)
     • Stagger de grupos (.gsap-stagger-group / item)
     • Image reveal com zoom sutil (.gsap-img-reveal)
   Requer GSAP 3 e ScrollTrigger carregados antes deste arquivo.
   ============================================================ */

'use strict';

(function initGSAPAnimations() {
  // Aguarda GSAP estar disponível
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    console.warn('[animations.js] GSAP ou ScrollTrigger não encontrado.');
    // Fallback: mostra tudo sem animação
    document.querySelectorAll(
      '.gsap-hero-coords,.gsap-hero-line,.gsap-hero-title,.gsap-hero-cta,.gsap-hero-scroll,.gsap-reveal,.gsap-stagger-item'
    ).forEach(el => { el.style.opacity = '1'; el.style.transform = 'none'; });
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* ── 1. Hero entrance ───────────────────────────────────── */

  const heroTL = gsap.timeline({ defaults: { ease: 'power3.out' } });

  const coords = document.querySelector('.gsap-hero-coords');
  const line   = document.querySelector('.gsap-hero-line');
  const title  = document.querySelector('.gsap-hero-title');
  const cta    = document.querySelector('.gsap-hero-cta');
  const scroll = document.querySelector('.gsap-hero-scroll');

  if (coords) heroTL.to(coords, { opacity: 1, y: 0, duration: 0.7 }, 0.3);
  if (line)   heroTL.to(line,   { opacity: 1, scaleX: 1, duration: 0.5, transformOrigin: 'left center' }, 0.55);
  if (title)  heroTL.to(title,  { opacity: 1, y: 0, duration: 1.0 }, 0.7);
  if (cta)    heroTL.to(cta,    { opacity: 1, y: 0, duration: 0.7 }, 1.0);
  if (scroll) heroTL.to(scroll, { opacity: 1, y: 0, duration: 0.6 }, 1.1);

  /* ── 2. Scroll reveal genérico (.gsap-reveal) ───────────── */

  document.querySelectorAll('.gsap-reveal').forEach(el => {
    const dir     = el.dataset.reveal || 'up';
    const fromMap = {
      up:    { opacity: 0, y: 40 },
      left:  { opacity: 0, x: -40 },
      right: { opacity: 0, x: 40 },
      fade:  { opacity: 0 },
    };
    const from = fromMap[dir] || fromMap.up;

    gsap.set(el, from);

    ScrollTrigger.create({
      trigger: el,
      start: 'top 88%',
      once: true,
      onEnter: () => {
        gsap.to(el, {
          opacity: 1,
          x: 0,
          y: 0,
          duration: 0.85,
          ease: 'power3.out',
          onComplete: () => el.classList.add('gsap-done'),
        });
      },
    });
  });

  /* ── 3. Stagger groups ──────────────────────────────────── */

  document.querySelectorAll('.gsap-stagger-group').forEach(group => {
    const items = group.querySelectorAll('.gsap-stagger-item');
    if (!items.length) return;

    gsap.set(items, { opacity: 0, y: 24 });

    ScrollTrigger.create({
      trigger: group,
      start: 'top 85%',
      once: true,
      onEnter: () => {
        gsap.to(items, {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: 'power2.out',
          stagger: 0.12,
        });
      },
    });
  });

  /* ── 4. Image reveal com zoom sutil ─────────────────────── */

  document.querySelectorAll('.gsap-img-reveal').forEach(wrapper => {
    const img = wrapper.querySelector('img');
    if (!img) return;

    // Wrapper precisa de overflow:hidden (definido no HTML ou CSS)
    gsap.set(wrapper, { overflow: 'hidden' });
    gsap.set(img,     { scale: 1.08, opacity: 0 });

    ScrollTrigger.create({
      trigger: wrapper,
      start: 'top 90%',
      once: true,
      onEnter: () => {
        gsap.to(img, {
          scale: 1,
          opacity: 1,
          duration: 1.1,
          ease: 'power2.out',
        });
      },
    });
  });

})();
