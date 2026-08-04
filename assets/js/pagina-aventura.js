/* Extraído de aventura.html para funcionar com o CSP (script-src 'self').
   Não voltar a colocar este código dentro do HTML. */

(function () {
    'use strict';

    /* ── Navbar scroll ─────────────────────── */
    var nav = document.getElementById('av-nav');
    window.addEventListener('scroll', function () {
        nav.classList.toggle('scrolled', window.scrollY > 60);
    }, { passive: true });

    /* ── Scroll reveal ─────────────────────── */
    var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
            if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
        });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });

    /* ── Fotos do carrossel principal ───────── */
    var imgs = [
        '../assets/img-web/hero/hero(1).jpg',
        '../assets/img-web/hero/hero(2).jpg',
        '../assets/img-web/hero/hero(3).jpg',
        '../assets/img-web/hero/hero(4).jpg'
    ];

    /* ── Fotos "recentes" ───────────────────── */
    var imgsRecentes = [
        '../assets/img-web/hero/hero(4).jpg',
        '../assets/img-web/hero/hero(3).jpg',
        '../assets/img-web/hero/hero(2).jpg',
        '../assets/img-web/hero/hero(1).jpg'
    ];

    var allImgs = imgs.concat(imgsRecentes); /* índice global para o lightbox */

    /* ── Injeta galeria principal (carrossel) ─ */
    var grid = document.getElementById('galeria-grid');
    imgs.forEach(function (src, idx) {
        var item = document.createElement('div');
        item.className = 'galeria-item carousel-item';
        item.dataset.index = idx;
        item.innerHTML =
            '<img src="' + src + '" alt="Aventura ' + (idx + 1) + '" loading="' + (idx < 4 ? 'eager' : 'lazy') + '" decoding="async" data-onerror="ocultar-pai" data-onerror-sel=".carousel-item">' +
            '<div class="galeria-item-overlay"><i class="fas fa-expand galeria-item-icon"></i></div>';
        grid.appendChild(item);
    });

    /* -- Duplica itens para o scroll infinito -- */
    var gridItems = Array.from(grid.children);
    gridItems.forEach(function (item) {
        grid.appendChild(item.cloneNode(true));
    });

    /* ── Injeta galeria recentes (masonry) ──── */
    var gridR = document.getElementById('galeria-recentes');
    imgsRecentes.forEach(function (src, idx) {
        var item = document.createElement('div');
        item.className = 'galeria-item';
        item.dataset.index = imgs.length + idx;
        item.innerHTML =
            '<img src="' + src + '" alt="Aventura recente ' + (idx + 1) + '" loading="lazy" decoding="async" data-onerror="ocultar-pai" data-onerror-sel=".galeria-item">' +
            '<div class="galeria-item-overlay"><i class="fas fa-expand galeria-item-icon"></i></div>';
        gridR.appendChild(item);
    });

    /* ── Lightbox ──────────────────────────── */
    var lb      = document.getElementById('lightbox');
    var lbImg   = document.getElementById('lb-img');
    var lbCnt   = document.getElementById('lb-counter');
    var current = 0;

    function openLb(idx) {
        current = idx;
        lbImg.src = allImgs[idx];
        lbCnt.textContent = (idx + 1) + ' / ' + allImgs.length;
        lb.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
    function closeLb() { lb.classList.remove('open'); document.body.style.overflow = ''; lbImg.src = ''; }
    function prevLb() { current = (current - 1 + allImgs.length) % allImgs.length; lbImg.src = allImgs[current]; lbCnt.textContent = (current + 1) + ' / ' + allImgs.length; }
    function nextLb() { current = (current + 1) % allImgs.length; lbImg.src = allImgs[current]; lbCnt.textContent = (current + 1) + ' / ' + allImgs.length; }

    document.getElementById('galeria-grid').addEventListener('click', function (e) {
        var item = e.target.closest('.galeria-item');
        if (item) openLb(parseInt(item.dataset.index));
    });
    document.getElementById('galeria-recentes').addEventListener('click', function (e) {
        var item = e.target.closest('.galeria-item');
        if (item) openLb(parseInt(item.dataset.index));
    });
    document.getElementById('lb-close').addEventListener('click', closeLb);
    document.getElementById('lb-prev').addEventListener('click', prevLb);
    document.getElementById('lb-next').addEventListener('click', nextLb);
    lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });
    document.addEventListener('keydown', function (e) {
        if (!lb.classList.contains('open')) return;
        if (e.key === 'ArrowLeft')  prevLb();
        if (e.key === 'ArrowRight') nextLb();
        if (e.key === 'Escape')     closeLb();
    });

    var touchX = null;
    lb.addEventListener('touchstart', function (e) { touchX = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
        if (touchX === null) return;
        var diff = touchX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) diff > 0 ? nextLb() : prevLb();
        touchX = null;
    }, { passive: true });

})();
