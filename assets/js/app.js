/* ============================================================
   APP.JS — Objeto principal FOTOP (v1.0)
   ============================================================
   Responsável por:
     • Navegação entre views da SPA
     • Carregamento lazy de galerias (batch + IntersectionObserver)
     • Slideshow hero, Olhar e Rua
     • Gráfico de habilidades (Chart.js)
     • Formulário de contato → WhatsApp
   ============================================================ */

import { CONTACT, IMAGES, WEDDINGS, GALLERY_DATA } from './config.js';
import { lightbox, initLightbox }                   from './lightbox.js';
import { initScrollReveal, initMobileMenu, initRotatingPhrases } from './utils.js';

/* IDs de todas as views da SPA */
const VIEWS = [
  'main-view',
  'wedding-selector',
  'gallery-view',
  'olhar-view',
  'street-view',
  'prices-view',
  'testimonials-view',
  'blog-view',
];

export const app = {
  _streetLoaded:      false,
  _olharLoaded:       false,
  _olharSlideInterval: null,
  _streetSlideInterval: null,

  /* ── Inicialização ─────────────────────────────────────── */

  init() {
    this.renderChart();
    this.handleNav();
    this.initSlideshow();
    this.initHeroParallax();
    initRotatingPhrases();
    initScrollReveal();
    initMobileMenu();
    initLightbox();
    this.initContactForm();
  },

  /* ── Parallax no hero (desativado em touch) ─────────────── */

  initHeroParallax() {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    const imgs = document.querySelectorAll('.hero-parallax');
    if (!imgs.length) return;
    window.addEventListener('scroll', () => {
      const y = window.scrollY * 0.32;
      imgs.forEach(img => { img.style.transform = `translateY(${y}px)`; });
    }, { passive: true });
  },

  /* ── Controle de Views ─────────────────────────────────── */

  showSection(id) {
    VIEWS.forEach(v => {
      const el = document.getElementById(v);
      if (el) {
        el.classList.add('hidden-content');
        el.classList.remove('fade-in');
      }
    });
    const targetId = id === 'home' ? 'main-view' : id;
    const target   = document.getElementById(targetId);
    if (target) {
      target.classList.remove('hidden-content');
      void target.offsetWidth; /* força reflow para reiniciar animação */
      target.classList.add('fade-in');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  closeMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    const btn  = document.getElementById('mobile-menu-btn');
    if (menu) menu.classList.add('hidden');
    if (btn) {
      const icon = btn.querySelector('i');
      if (icon) icon.className = 'fas fa-bars text-xl';
    }
  },

  scrollToSection(id) {
    const el = document.getElementById(id);
    if (el) {
      window.scrollTo({
        top:      el.getBoundingClientRect().top + window.scrollY - 80,
        behavior: 'smooth',
      });
    }
  },

  /* ── Galeria de Casamentos ─────────────────────────────── */

  showSubGallery(type) {
    if (type !== 'weddings') return;
    const container = document.getElementById('wedding-albums');
    if (!container) return;

    container.innerHTML = '';
    WEDDINGS.forEach(wedding => {
      const card = document.createElement('div');
      card.className = 'group relative aspect-[4/3] overflow-hidden cursor-pointer bg-stone-900 shadow-xl reveal';
      card.onclick   = () => app.openGallery('wedding-detail', wedding);
      card.innerHTML = `
        <img src="${encodeURI(wedding.path + 'capa.jpg')}"
             onerror="this.onerror=null; this.src='${wedding.fallback}'"
             class="w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-all duration-700"
             alt="${wedding.name}">
        <div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
        <div class="absolute bottom-4 md:bottom-6 left-4 md:left-6 text-left">
          <h4 class="font-serif text-lg md:text-2xl text-white uppercase tracking-tighter">${wedding.name}</h4>
        </div>`;
      container.appendChild(card);
    });

    this.showSection('wedding-selector');
  },

  /* ── Construção de item de galeria ─────────────────────── */

  _makeItem(src, gridRef) {
    const item = document.createElement('div');
    item.className = 'masonry-item overflow-hidden rounded-sm shadow-2xl loading-skeleton min-h-[150px] md:min-h-[200px] reveal';

    const img      = document.createElement('img');
    img.src        = src;
    img.alt        = '';
    img.decoding   = 'async';
    img.loading    = 'lazy';
    img.className  = 'w-full h-auto object-cover transition-all duration-700 opacity-0 cursor-pointer';
    img.onload     = () => { img.classList.replace('opacity-0', 'opacity-100'); item.classList.remove('loading-skeleton'); };
    img.onerror    = () => item.remove();
    img.addEventListener('click', () => lightbox.open(img, gridRef));

    item.appendChild(img);
    return item;
  },

  /* ── Carregamento em lote com IntersectionObserver ──────
     Busca o próximo lote somente ao se aproximar do final.
     Para após 5 falhas consecutivas (fim das imagens).      */

  _batchLoad(gridEl, paths, batchSize = 20) {
    if (!gridEl || !paths.length) return;
    let idx = 0, consecutiveFails = 0;

    const sentinel = document.createElement('div');
    sentinel.style.cssText = 'height:1px;width:100%;pointer-events:none;';
    gridEl.appendChild(sentinel);

    const loadBatch = () => {
      if (idx >= paths.length || consecutiveFails >= 5) { sentinel.remove(); return; }
      const slice = paths.slice(idx, idx + batchSize);
      idx += batchSize;

      const frag = document.createDocumentFragment();
      slice.forEach(src => {
        const item = this._makeItem(src, gridEl);
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
      ([entry]) => { if (entry.isIntersecting) loadBatch(); },
      { rootMargin: '500px' }
    ).observe(sentinel);

    loadBatch(); /* primeiro lote imediato */
  },

  loadImagesFromFolder(gridEl, basePath, folder, start = 1, max = 200) {
    if (!gridEl) return;
    const paths = Array.from(
      { length: max - start + 1 },
      (_, i) => encodeURI(`${basePath}${folder}(${start + i}).jpg`)
    );
    this._batchLoad(gridEl, paths);
  },

  /* ── Abertura de galeria ───────────────────────────────── */

  openGallery(theme, customData = null) {
    ['gallery-grid', 'pre-wedding-grid', 'ceremony-grid'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = '';
    });

    const hide = id => { const el = document.getElementById(id); if (el) el.classList.add('hidden'); };
    const show = id => { const el = document.getElementById(id); if (el) el.classList.remove('hidden'); };

    hide('pre-wedding-section');
    hide('ceremony-section');
    hide('wedding-nav-buttons');

    const backBtn = document.getElementById('back-to-selector');
    let title = '', desc = '';

    if (theme === 'wedding-detail') {
      title = customData.name;
      desc  = `Narrativa completa de ${customData.name}. Momentos capturados com alma na Mantiqueira.`;
      backBtn.onclick = () => app.showSection('wedding-selector');
      show('wedding-nav-buttons');
      show('pre-wedding-section');
      show('ceremony-section');
      this.loadImagesFromFolder(document.getElementById('pre-wedding-grid'), customData.path, 'Pre Wedding/');
      this.loadImagesFromFolder(document.getElementById('ceremony-grid'),    customData.path, 'Cerimonia/');
    } else {
      const cfg = GALLERY_DATA[theme];
      title = cfg.title;
      desc  = cfg.desc;
      backBtn.onclick = () => app.showSection('home');
      const grid = document.getElementById('gallery-grid');
      if (grid) {
        const paths = Array.from(
          { length: 60 },
          (_, i) => encodeURI(`${cfg.basePath}${cfg.prefix} (${i + 1}).jpg`)
        );
        this._batchLoad(grid, paths);
      }
    }

    const titleEl = document.getElementById('gallery-title');
    const descEl  = document.getElementById('gallery-desc');
    if (titleEl) titleEl.innerText = title;
    if (descEl)  descEl.innerText  = desc;

    this.showSection('gallery-view');
  },

  /* ── Seções específicas ────────────────────────────────── */

  openStreet() {
    if (!this._streetLoaded) {
      const grid = document.getElementById('street-grid');
      if (!grid) return;
      const paths = Array.from(
        { length: IMAGES.street.count },
        (_, i) => encodeURI(`assets/img/portfolio/rua/galeria/${i + 1}.jpg`)
      );
      this._batchLoad(grid, paths);
      this._streetLoaded = true;
    }
    this.showSection('street-view');
    this.initStreetSlideshow();
  },

  openOlhar() {
    if (!this._olharLoaded) {
      const grid = document.getElementById('olhar-grid');
      if (!grid) return;
      const paths = Array.from(
        { length: IMAGES.olhar.count },
        (_, i) => encodeURI(`assets/img/portfolio/olhar/registros/${i + 1}.jpg`)
      );
      this._batchLoad(grid, paths);
      this._olharLoaded = true;
    }
    this.showSection('olhar-view');
    this.initOlharSlideshow();
  },

  openPrices()       { this.showSection('prices-view'); },
  openTestimonials() { this.showSection('testimonials-view'); },
  openBlog()         { this.showSection('blog-view'); },

  /* ── Slideshows ────────────────────────────────────────── */

  initSlideshow() {
    const slides = document.querySelectorAll('.hero-slide');
    if (!slides.length) return;
    let current = 0;
    setInterval(() => {
      slides[current].classList.remove('active');
      current = (current + 1) % slides.length;
      slides[current].classList.add('active');
    }, 3500);
  },

  initOlharSlideshow() {
    if (this._olharSlideInterval) clearInterval(this._olharSlideInterval);
    const slides = document.querySelectorAll('.olhar-slide');
    if (!slides.length) return;
    let current = 0;
    slides.forEach((s, i) => s.classList.toggle('active', i === 0));
    this._olharSlideInterval = setInterval(() => {
      slides[current].classList.remove('active');
      current = (current + 1) % slides.length;
      slides[current].classList.add('active');
    }, 3000);
  },

  initStreetSlideshow() {
    if (this._streetSlideInterval) clearInterval(this._streetSlideInterval);
    const slides = document.querySelectorAll('.street-slide');
    if (!slides.length) return;
    let current = 0;
    slides.forEach((s, i) => s.classList.toggle('active', i === 0));
    this._streetSlideInterval = setInterval(() => {
      slides[current].classList.remove('active');
      current = (current + 1) % slides.length;
      slides[current].classList.add('active');
    }, 3000);
  },

  /* ── Gráfico de habilidades ─────────────────────────────── */

  renderChart() {
    const ctx = document.getElementById('skillsChart');
    if (!ctx) return;
    const isMobile = window.innerWidth < 768;
    new Chart(ctx.getContext('2d'), {
      type: 'radar',
      data: {
        labels:   ['História Local', 'Guiamento', 'Casamentos', 'Pós-Processo', 'Noturna', 'Aventura'],
        datasets: [{
          data:               [100, 100, 95, 88, 98, 100],
          backgroundColor:    'rgba(197, 163, 115, 0.2)',
          borderColor:        '#c5a373',
          pointBackgroundColor: '#0a0c0a',
          borderWidth:        2,
        }],
      },
      options: {
        responsive:          true,
        maintainAspectRatio: false,
        scales: {
          r: {
            grid:        { color: 'rgba(0,0,0,0.08)' },
            ticks:       { display: false },
            pointLabels: { color: '#2c2f2e', font: { size: isMobile ? 9 : 11, family: 'Montserrat' } },
          },
        },
        plugins:   { legend: { display: false } },
        animation: { duration: 1500, easing: 'easeInOutQuart' },
      },
    });
  },

  /* ── Navbar com efeito ao scroll ────────────────────────── */

  handleNav() {
    const nav = document.getElementById('navbar');
    if (!nav) return;
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 80);
    }, { passive: true });
  },

  /* ── Formulário de Contato → WhatsApp ───────────────────── */

  initContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;
    form.addEventListener('submit', e => {
      e.preventDefault();
      const nome     = document.getElementById('cf-nome')?.value     || '';
      const servico  = document.getElementById('cf-servico')?.value  || '';
      const data     = document.getElementById('cf-data')?.value     || '';
      const mensagem = document.getElementById('cf-mensagem')?.value || '';

      let texto = `Olá Vinícius! Meu nome é ${nome}.`;
      if (servico)  texto += ` Tenho interesse em: ${servico}.`;
      if (data)     texto += ` Data prevista: ${data}.`;
      if (mensagem) texto += ` Mensagem: ${mensagem}`;

      window.open(
        `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(texto)}`,
        '_blank'
      );
    });
  },
};
