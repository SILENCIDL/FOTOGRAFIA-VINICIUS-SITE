/* Extraído de olhar.html para funcionar com o CSP (script-src 'self').
   Não voltar a colocar este código dentro do HTML. */

(function () {
    'use strict';

    /* ── Navbar scroll ─────────────────────── */
    var nav = document.getElementById('olhar-nav');
    window.addEventListener('scroll', function () {
        nav.classList.toggle('scrolled', window.scrollY > 60);
    }, { passive: true });

    /* ── Hero bg slow-zoom on load ─────────── */
    var heroBg = document.getElementById('hero-bg-img');
    if (heroBg.complete) { heroBg.classList.add('loaded'); }
    else { heroBg.addEventListener('load', function () { heroBg.classList.add('loaded'); }); }

    /* ── Scroll reveal ─────────────────────── */
    var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
            if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
        });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });

    /* ── Fotos registros 1–31 ──────────────── */
    var total = 31;
    var imgs  = [];
    for (var i = 1; i <= total; i++) {
        imgs.push('../assets/img-web/portfolio/olhar/registros/' + i + '.jpg');
    }

    /* ── Injeta galeria ────────────────────── */
    var grid = document.getElementById('olhar-grid');
    imgs.forEach(function (src, idx) {
        var item = document.createElement('div');
        item.className = 'galeria-item';
        item.dataset.index = idx;
        item.innerHTML =
            '<img src="' + src + '" alt="O Olhar · ' + (idx + 1) + '" loading="' + (idx < 6 ? 'eager' : 'lazy') + '" decoding="async" data-onerror="ocultar-pai" data-onerror-sel=".galeria-item">' +
            '<div class="galeria-item-overlay"><i class="fas fa-expand galeria-item-icon"></i></div>';
        grid.appendChild(item);
    });

    /* ── Lightbox ──────────────────────────── */
    var lb      = document.getElementById('lightbox');
    var lbImg   = document.getElementById('lb-img');
    var lbCnt   = document.getElementById('lb-counter');
    var current = 0;

    function open(idx) {
        current = idx;
        lbImg.src = imgs[idx];
        lbCnt.textContent = (idx + 1) + ' / ' + imgs.length;
        lb.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
    function close() {
        lb.classList.remove('open');
        document.body.style.overflow = '';
        lbImg.src = '';
    }
    function prev() {
        current = (current - 1 + imgs.length) % imgs.length;
        lbImg.src = imgs[current];
        lbCnt.textContent = (current + 1) + ' / ' + imgs.length;
    }
    function next() {
        current = (current + 1) % imgs.length;
        lbImg.src = imgs[current];
        lbCnt.textContent = (current + 1) + ' / ' + imgs.length;
    }

    grid.addEventListener('click', function (e) {
        var item = e.target.closest('.galeria-item');
        if (item) open(parseInt(item.dataset.index));
    });

    document.getElementById('lb-close').addEventListener('click', close);
    document.getElementById('lb-prev').addEventListener('click', prev);
    document.getElementById('lb-next').addEventListener('click', next);
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });

    document.addEventListener('keydown', function (e) {
        if (!lb.classList.contains('open')) return;
        if (e.key === 'ArrowLeft')  prev();
        if (e.key === 'ArrowRight') next();
        if (e.key === 'Escape')     close();
    });

    /* Swipe touch */
    var tx = null;
    lb.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend',   function (e) {
        if (tx === null) return;
        var d = tx - e.changedTouches[0].clientX;
        if (Math.abs(d) > 50) d > 0 ? next() : prev();
        tx = null;
    }, { passive: true });

})();
