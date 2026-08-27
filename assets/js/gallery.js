/* ============================================================
   GALLERY.JS — FOTOP v3.0
   Carregamento de galerias em batch via IntersectionObserver.
   Gerencia abertura de views e carregamento lazy das imagens.
   ============================================================ */

'use strict';

const gallery = (() => {

  /* ── Cria um item masonry ── */
  /* `descricao` vira o alt da foto. Para fotógrafo isso não é detalhe:
     o Google Imagens é tráfego gratuito e alt vazio joga fora essa busca. */
  function _makeItem(src, gridRef, descricao) {
    const item = document.createElement('div');
    item.className = 'masonry-item overflow-hidden rounded-sm shadow-2xl loading-skeleton min-h-[150px] md:min-h-[200px] reveal';

    const numero = (src.match(/\((\d+)\)\.jpg$/) || [])[1];
    const img = document.createElement('img');
    img.src       = src;
    img.alt       = descricao ? descricao + (numero ? ' — foto ' + numero : '') : '';
    img.decoding  = 'async';
    img.loading   = 'lazy';
    img.className = 'w-full h-auto object-cover transition-all duration-700 opacity-0 cursor-pointer';

    img.onload  = () => { img.classList.replace('opacity-0', 'opacity-100'); item.classList.remove('loading-skeleton'); };
    img.onerror = () => item.remove();
    img.addEventListener('click', () => lightbox.open(img, gridRef));

    item.appendChild(img);
    return item;
  }

  /* ── Batch load com sentinel IntersectionObserver ── */
  function _batchLoad(gridEl, paths, batchSize = 20, descricao = '') {
    if (!gridEl || !paths.length) return;

    let idx = 0;
    let consecutiveFails = 0;

    const sentinel = document.createElement('div');
    sentinel.style.cssText = 'height:1px;width:100%;pointer-events:none;';
    gridEl.appendChild(sentinel);

    const loadBatch = () => {
      if (idx >= paths.length || consecutiveFails >= 5) { sentinel.remove(); return; }

      const slice = paths.slice(idx, idx + batchSize);
      idx += batchSize;

      const frag = document.createDocumentFragment();
      slice.forEach(src => {
        const item = _makeItem(src, gridEl, descricao);
        const img  = item.querySelector('img');
        if (img) {
          const origLoad  = img.onload;
          const origError = img.onerror;
          img.onload  = function () { consecutiveFails = 0; origLoad?.call(this); };
          img.onerror = function () { consecutiveFails++;   origError?.call(this); };
        }
        frag.appendChild(item);
      });

      gridEl.insertBefore(frag, sentinel);
    };

    new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) loadBatch(); },
      { rootMargin: '500px' }
    ).observe(sentinel);

    loadBatch(); // Primeiro lote imediato
  }

  /* ── Carrega imagens numeradas de uma pasta ── */
  function loadFromFolder(gridEl, basePath, folder, start = 1, max = 200, descricao = '') {
    if (!gridEl) return;
    const paths = Array.from({ length: max - start + 1 },
      (_, i) => encodeURI(`${basePath}${folder}(${start + i}).jpg`));
    _batchLoad(gridEl, paths, 20, descricao);
  }

  /* ── Sub-galeria de casamentos ── */
  function showWeddingSelector() {
    /* `prova` = primeira foto real do álbum. Se ela não existir no servidor,
       o álbum inteiro não é exibido — álbum vazio frustra mais do que álbum
       ausente. Assim que as fotos forem enviadas, o card volta sozinho.
       Nada de foto de banco de imagens fazendo as vezes do trabalho dele. */
    const WEDDINGS = [
      { name: 'Bianca & Donizete', path: 'assets/img-web/portfolio/casamentos/Bianca & Donizete/', prova: 'Cerimonia/(1).jpg' },
      { name: 'Miellem & Aleft',   path: 'assets/img-web/portfolio/casamentos/Miellem & Aleft/',   prova: 'Cerimonia/(1).jpg' },
      { name: 'Pamela & Juliano',  path: 'assets/img-web/portfolio/casamentos/Pamela & Juliano/',  prova: 'Cerimonia/(1).jpg' },
      { name: 'Marcos & Patricia', path: 'assets/img-web/portfolio/casamentos/Patricia & Marcos/', prova: 'Cerimonia/(1).jpg' },
    ];

    const container = document.getElementById('wedding-albums');
    if (!container) return;
    container.innerHTML = '';

    WEDDINGS.forEach(w => {
      const card = document.createElement('div');
      card.className = 'group relative aspect-[4/3] overflow-hidden cursor-pointer bg-stone-900 shadow-xl reveal';
      card.onclick = () => openGallery('wedding-detail', w);
      card.innerHTML = '';
      
      /* esconde até provar que o álbum tem fotos */
      card.style.display = 'none';
      const prova = new Image();
      prova.onload = () => { card.style.display = ''; };
      prova.src = encodeURI(w.path + (w.prova || 'capa.jpg'));

      const img = document.createElement('img');
      img.src = encodeURI(w.path + 'capa.jpg');
      img.className = 'w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-all duration-700';
      img.alt = 'Capa do álbum de casamento ' + w.name;
      img.loading = 'lazy';
      img.onerror = function () { card.style.display = 'none'; };
      card.appendChild(img);

      const overlay = document.createElement('div');
      overlay.className = 'absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent';
      card.appendChild(overlay);

      const content = document.createElement('div');
      content.className = 'absolute bottom-4 md:bottom-6 left-4 md:left-6 text-left';
      const h4 = document.createElement('h4');
      h4.className = 'font-serif text-lg md:text-2xl text-white uppercase tracking-tighter';
      h4.textContent = w.name; // Safe against XSS
      content.appendChild(h4);
      card.appendChild(content);
      container.appendChild(card);
    });

    app.showSection('wedding-selector');
  }

  /* ── Abre uma galeria temática ── */
  function openGallery(theme, customData = null) {
    ['gallery-grid', 'pre-wedding-grid', 'ceremony-grid'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = '';
    });

    const _hide = id => { const e = document.getElementById(id); if (e) e.classList.add('hidden'); };
    const _show = id => { const e = document.getElementById(id); if (e) e.classList.remove('hidden'); };

    _hide('pre-wedding-section');
    _hide('ceremony-section');
    _hide('wedding-nav-buttons');

    const backBtn = document.getElementById('back-to-selector');
    let title = '', desc = '';

    if (theme === 'wedding-detail') {
      title = customData.name;
      desc  = `Narrativa completa de ${customData.name}. Momentos capturados com alma na Mantiqueira.`;
      if (backBtn) backBtn.onclick = () => app.showSection('wedding-selector');
      _show('wedding-nav-buttons');
      _show('pre-wedding-section');
      _show('ceremony-section');
      loadFromFolder(document.getElementById('pre-wedding-grid'), customData.path, 'Pre Wedding/',
                     1, 200, 'Ensaio pré-wedding de ' + customData.name + ' na Serra da Mantiqueira');
      loadFromFolder(document.getElementById('ceremony-grid'), customData.path, 'Cerimonia/',
                     1, 200, 'Casamento de ' + customData.name + ' — cerimônia fotografada por Vinícius Rafael');
    } else {
      const GALLERY_DATA = {
        adventure: { title: 'Aventura',          desc: 'Registros verticais na Pedra do Baú e nas trilhas da Mantiqueira.', basePath: 'assets/img-web/portfolio/aventura/', prefix: 'aventura',
                     alt: 'Fotografia de aventura na Pedra do Baú, São Bento do Sapucaí' },
      };
      const cfg = GALLERY_DATA[theme];
      title = cfg.title;
      desc  = cfg.desc;
      if (backBtn) backBtn.onclick = () => app.showSection('home');
      const grid  = document.getElementById('gallery-grid');
      const paths = Array.from({ length: 60 },
        (_, i) => encodeURI(`${cfg.basePath}${cfg.prefix} (${i + 1}).jpg`));
      _batchLoad(grid, paths, 20, cfg.alt);
    }

    const titleEl = document.getElementById('gallery-title');
    const descEl  = document.getElementById('gallery-desc');
    if (titleEl) titleEl.innerText = title;
    if (descEl)  descEl.innerText  = desc;

    app.showSection('gallery-view');
  }

  /* ── Abre view Street ── */
  let _streetLoaded = false;
  function openStreet() {
    if (!_streetLoaded) {
      const grid  = document.getElementById('street-grid');
      const paths = Array.from({ length: 138 },
        (_, i) => encodeURI(`assets/img-web/portfolio/rua/galeria/${i + 1}.jpg`));
      _batchLoad(grid, paths, 20, 'Fotografia de rua — cotidiano na Serra da Mantiqueira');
      _streetLoaded = true;
    }
    app.showSection('street-view');
    initStreetSlideshow();
  }

  /* ── Abre view Olhar ── */
  let _olharLoaded = false;
  function openOlhar() {
    if (!_olharLoaded) {
      const grid  = document.getElementById('olhar-grid');
      const paths = Array.from({ length: 31 },
        (_, i) => encodeURI(`assets/img-web/portfolio/olhar/registros/${i + 1}.jpg`));
      _batchLoad(grid, paths, 20, 'Ensaio autoral da série O Olhar, por Vinícius Rafael');
      _olharLoaded = true;
    }
    app.showSection('olhar-view');
    initOlharSlideshow();
  }

  return {
    loadFromFolder,
    showWeddingSelector,
    openGallery,
    openStreet,
    openOlhar,
  };
})();
