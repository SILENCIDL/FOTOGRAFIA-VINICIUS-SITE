/* Extraído de rua.html para funcionar com o CSP (script-src 'self').
   Não voltar a colocar este código dentro do HTML. */

(function () {
    'use strict';

    /* ── Navbar scroll ─────────────────────── */
    var nav = document.getElementById('rua-nav');
    window.addEventListener('scroll', function () {
        nav.classList.toggle('scrolled', window.scrollY > 60);
    }, { passive: true });

    /* ── Scroll reveal ─────────────────────── */
    var revealEls = document.querySelectorAll('.reveal');
    var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
            if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
        });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });

    /* ── Fotos numeradas 1–69 ──────────────── */
    var imgs = [];
    for (var i = 1; i <= 69; i++) {
        imgs.push('../assets/img-web/portfolio/rua/galeria/' + i + '.jpg');
    }

    /* ── Fotos "ultimas" ───────────────────── */
    var ultimas = [178,179,180,181,182,183,184,185,186,187,188,189,190,
                   191,192,193,194,195,196,197,198,199,200,201,202,203,204,
                   205,206,207,208,209,210,211,212,213,214,215,216,217,218,
                   219,220,221,222,223,224,225,226,227,228,229,230,231,232,
                   233,234,236,244,247,256,259,286,288,319,320,324,330,331];
    var imgsRecentes = ultimas.map(function(n) {
        return '../assets/img-web/portfolio/rua/galeria/fotos  card atual ultimas-' + n + '.jpg';
    });

    var allImgs = imgs.concat(imgsRecentes);  /* índice global para o lightbox */

    /* ── Injeta galeria principal ──────────── */
    var grid = document.getElementById('galeria-grid');
    imgs.forEach(function (src, idx) {
        var a = document.createElement('div');
        a.className = 'galeria-item carousel-item';
        a.setAttribute('data-index', idx);
        a.innerHTML =
            '<img src="' + src + '" alt="Fotografia de rua ' + (idx + 1) + '" loading="' + (idx < 8 ? 'eager' : 'lazy') + '" decoding="async" data-onerror="ocultar-pai" data-onerror-sel=".carousel-item">' +
            '<div class="galeria-item-overlay"><i class="fas fa-expand galeria-item-icon"></i></div>';
        grid.appendChild(a);
    });

    /* -- Duplica itens para o scroll infinito -- */
    var gridItems = Array.from(grid.children);
    gridItems.forEach(function (item) {
        grid.appendChild(item.cloneNode(true));
    });

    /* ── Injeta galeria recentes ───────────── */
    var gridR = document.getElementById('galeria-recentes');
    imgsRecentes.forEach(function (src, idx) {
        var a = document.createElement('div');
        a.className = 'galeria-item';
        a.setAttribute('data-index', imgs.length + idx);
        var encodedSrc = src.replace(/ /g, '%20');
        a.innerHTML =
            '<img src="' + encodedSrc + '" alt="Fotografia de rua recente ' + (idx + 1) + '" loading="lazy" decoding="async" data-onerror="ocultar-pai" data-onerror-sel=".galeria-item">' +
            '<div class="galeria-item-overlay"><i class="fas fa-expand galeria-item-icon"></i></div>';
        gridR.appendChild(a);
    });

    /* ── Lightbox ──────────────────────────── */
    var lb      = document.getElementById('lightbox');
    var lbImg   = document.getElementById('lb-img');
    var lbCnt   = document.getElementById('lb-counter');
    var current = 0;

    function openLightbox(idx) {
        current = idx;
        var src = allImgs[idx];
        lbImg.src = src.replace(/ /g, '%20');
        lbCnt.textContent = (idx + 1) + ' / ' + allImgs.length;
        lb.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        lb.classList.remove('open');
        document.body.style.overflow = '';
        lbImg.src = '';
    }

    function prevImg() {
        current = (current - 1 + allImgs.length) % allImgs.length;
        var src = allImgs[current];
        lbImg.src = src.replace(/ /g, '%20');
        lbCnt.textContent = (current + 1) + ' / ' + allImgs.length;
    }

    function nextImg() {
        current = (current + 1) % allImgs.length;
        var src = allImgs[current];
        lbImg.src = src.replace(/ /g, '%20');
        lbCnt.textContent = (current + 1) + ' / ' + allImgs.length;
    }

    /* Clique nas fotos */
    document.getElementById('galeria-grid').addEventListener('click', function (e) {
        var item = e.target.closest('.galeria-item');
        if (item) openLightbox(parseInt(item.dataset.index));
    });
    document.getElementById('galeria-recentes').addEventListener('click', function (e) {
        var item = e.target.closest('.galeria-item');
        if (item) openLightbox(parseInt(item.dataset.index));
    });

    document.getElementById('lb-close').addEventListener('click', closeLightbox);
    document.getElementById('lb-prev').addEventListener('click', prevImg);
    document.getElementById('lb-next').addEventListener('click', nextImg);

    /* Clique no fundo fecha */
    lb.addEventListener('click', function (e) {
        if (e.target === lb) closeLightbox();
    });

    /* Teclado */
    document.addEventListener('keydown', function (e) {
        if (!lb.classList.contains('open')) return;
        if (e.key === 'ArrowLeft')  prevImg();
        if (e.key === 'ArrowRight') nextImg();
        if (e.key === 'Escape')     closeLightbox();
    });

    /* Swipe touch */
    var touchX = null;
    lb.addEventListener('touchstart', function (e) { touchX = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend',   function (e) {
        if (touchX === null) return;
        var diff = touchX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) diff > 0 ? nextImg() : prevImg();
        touchX = null;
    }, { passive: true });

})();
