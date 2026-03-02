/* ============================================================
   MAIN.JS — Vinícius Rafael Fotografia (v3.0 Responsivo)
   ============================================================ */

const VIEWS = ['main-view', 'wedding-selector', 'gallery-view', 'olhar-view', 'street-view', 'prices-view', 'testimonials-view', 'blog-view'];

const app = {
  _streetLoaded: false,
  _olharLoaded: false,
  _olharSlideInterval: null,
  _streetSlideInterval: null,

  init() {
    this.renderChart();
    this.handleNav();
    this.initSlideshow();
    initRotatingPhrases();
    initScrollReveal();
    initMobileMenu();
    initLightbox();
    this.initContactForm();
  },

  showSection(id) {
    VIEWS.forEach(v => {
      const el = document.getElementById(v);
      if (el) { 
        el.classList.add('hidden-content'); 
        el.classList.remove('fade-in'); 
      }
    });
    const targetId = id === 'home' ? 'main-view' : id;
    const target = document.getElementById(targetId);
    if (target) {
      target.classList.remove('hidden-content');
      void target.offsetWidth;
      target.classList.add('fade-in');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  closeMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    const btn = document.getElementById('mobile-menu-btn');
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
        top: el.getBoundingClientRect().top + window.scrollY - 80,
        behavior: 'smooth'
      });
    }
  },

  showSubGallery(type) {
    if (type !== 'weddings') return;
    const WEDDINGS = [
      { name: 'Bianca & Donizete', path: 'assets/img/portfolio/casamentos/Bianca & Donizete/' },
      { name: 'Miellem & Aleft',   path: 'assets/img/portfolio/casamentos/Miellem & Aleft/' },
      { name: 'Pamela & Juliano',  path: 'assets/img/portfolio/casamentos/Pamela & Juliano/' },
      { name: 'Marcos & Patricia', path: 'assets/img/portfolio/casamentos/Patricia & Marcos/' },
    ];
    const container = document.getElementById('wedding-albums');
    container.innerHTML = '';
    WEDDINGS.forEach(w => {
      const card = document.createElement('div');
      card.className = 'group relative aspect-[4/3] overflow-hidden cursor-pointer bg-stone-900 shadow-xl reveal';
      card.onclick = () => app.openGallery('wedding-detail', w);
      card.innerHTML = `
        <img src="${encodeURI(w.path + 'capa.jpg')}" onerror="this.style.display='none'"
          class="w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-all duration-700" alt="${w.name}">
        <div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
        <div class="absolute bottom-4 md:bottom-6 left-4 md:left-6 text-left">
          <h4 class="font-serif text-lg md:text-2xl text-white uppercase tracking-tighter">${w.name}</h4>
        </div>`;
      container.appendChild(card);
    });
    this.showSection('wedding-selector');
  },

  _makeItem(src, gridRef) {
    const item = document.createElement('div');
    item.className = 'masonry-item overflow-hidden rounded-sm shadow-2xl loading-skeleton min-h-[150px] md:min-h-[200px] reveal';
    const img = document.createElement('img');
    img.src = src;
    img.alt = '';
    img.className = 'w-full h-auto object-cover transition-all duration-700 opacity-0 cursor-pointer';
    img.loading = 'lazy';
    img.onload = () => { 
      img.classList.replace('opacity-0', 'opacity-100'); 
      item.classList.remove('loading-skeleton'); 
    };
    img.onerror = () => item.remove();
    img.addEventListener('click', () => lightbox.open(img, gridRef));
    item.appendChild(img);
    return item;
  },

  loadImagesFromFolder(gridEl, basePath, folder, start = 1, max = 200) {
    const cleanFolder = folder.endsWith('/') ? folder.slice(0, -1) : folder;
    
    for (let i = start; i <= max; i++) {
      const fileName = `${folder}${cleanFolder} (${i}).jpg`;
      gridEl.appendChild(this._makeItem(encodeURI(`${basePath}${fileName}`), gridEl));
    }
  },

  openGallery(theme, customData = null) {
    ['gallery-grid', 'pre-wedding-grid', 'ceremony-grid'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = '';
    });
    
    const hide = id => {
      const el = document.getElementById(id);
      if (el) el.classList.add('hidden');
    };
    const show = id => {
      const el = document.getElementById(id);
      if (el) el.classList.remove('hidden');
    };
    
    hide('pre-wedding-section'); 
    hide('ceremony-section'); 
    hide('wedding-nav-buttons');
    
    const backBtn = document.getElementById('back-to-selector');
    let title = '', desc = '';

    if (theme === 'wedding-detail') {
      title = customData.name;
      desc = `Narrativa completa de ${customData.name}. Momentos capturados com alma na Mantiqueira.`;
      backBtn.onclick = () => app.showSection('wedding-selector');
      show('wedding-nav-buttons'); 
      show('pre-wedding-section'); 
      show('ceremony-section');
      const preGrid = document.getElementById('pre-wedding-grid');
      const cerGrid = document.getElementById('ceremony-grid');
      this.loadImagesFromFolder(preGrid, customData.path, 'Pre Wedding/');
      this.loadImagesFromFolder(cerGrid, customData.path, 'Cerimonia/');
    } else {
      const GALLERY_DATA = {
        adventure: { title: 'Aventura', desc: 'Registros verticais na Pedra do Baú e nas trilhas da Mantiqueira.', basePath: 'assets/img/portfolio/aventura/', prefix: 'aventura' },
        portraits: { title: 'Retratos', desc: 'Essência capturada na luz natural da serra.', basePath: 'assets/img/portfolio/retratos/', prefix: 'retratos' },
        street:    { title: 'Fotografia de Rua', desc: 'O cotidiano transformado em arte.', basePath: 'assets/img/portfolio/rua/', prefix: 'rua' },
      };
      const cfg = GALLERY_DATA[theme];
      title = cfg.title; 
      desc = cfg.desc;
      backBtn.onclick = () => app.showSection('home');
      const grid = document.getElementById('gallery-grid');
      for (let i = 1; i <= 60; i++) {
        const path = `${cfg.basePath}${cfg.prefix} (${i}).jpg`;
        grid.appendChild(this._makeItem(encodeURI(path), grid));
      }
    }
    
    const titleEl = document.getElementById('gallery-title');
    const descEl = document.getElementById('gallery-desc');
    if (titleEl) titleEl.innerText = title;
    if (descEl) descEl.innerText = desc;
    
    this.showSection('gallery-view');
  },

  openStreet() {
    if (!this._streetLoaded) {
      const grid = document.getElementById('street-grid');
      for (let i = 1; i <= 69; i++) {
        grid.appendChild(this._makeItem(encodeURI(`assets/img/portfolio/rua/galeria/rua (${i}).jpg`), grid));
      }
      this._streetLoaded = true;
    }
    this.showSection('street-view');
    this.initStreetSlideshow();
  },

  openOlhar() {
    if (!this._olharLoaded) {
      const grid = document.getElementById('olhar-grid');
      for (let i = 1; i <= 60; i++) {
        grid.appendChild(this._makeItem(encodeURI(`assets/img/portfolio/olhar/registros/olhar (${i}).jpg`), grid));
      }
      this._olharLoaded = true;
    }
    this.showSection('olhar-view');
    this.initOlharSlideshow();
  },

  initOlharSlideshow() {
    if (this._olharSlideInterval) {
      clearInterval(this._olharSlideInterval);
    }

    const slides = document.querySelectorAll('.olhar-slide');
    if (!slides.length) return;

    let current = 0;

    slides.forEach((slide, index) => {
      slide.classList.toggle('active', index === 0);
    });

    this._olharSlideInterval = setInterval(() => {
      slides[current].classList.remove('active');
      current = (current + 1) % slides.length;
      slides[current].classList.add('active');
    }, 3000);
  },

  initStreetSlideshow() {
    if (this._streetSlideInterval) {
      clearInterval(this._streetSlideInterval);
    }

    const slides = document.querySelectorAll('.street-slide');
    if (!slides.length) return;

    let current = 0;

    slides.forEach((slide, index) => {
      slide.classList.toggle('active', index === 0);
    });

    this._streetSlideInterval = setInterval(() => {
      slides[current].classList.remove('active');
      current = (current + 1) % slides.length;
      slides[current].classList.add('active');
    }, 3000);
  },

  openPrices() { this.showSection('prices-view'); },
  openTestimonials() { this.showSection('testimonials-view'); },
  openBlog() { this.showSection('blog-view'); },

  renderChart() {
    const ctx = document.getElementById('skillsChart');
    if (!ctx) return;
    
    const isMobile = window.innerWidth < 768;
    
    new Chart(ctx.getContext('2d'), {
      type: 'radar',
      data: {
        labels: ['História Local', 'Guiamento', 'Casamentos', 'Pós-Processo', 'Noturna', 'Aventura'],
        datasets: [{ 
          data: [100, 100, 95, 88, 98, 100], 
          backgroundColor: 'rgba(197, 163, 115, 0.2)', 
          borderColor: '#c5a373', 
          pointBackgroundColor: '#0a0c0a', 
          borderWidth: 2 
        }],
      },
      options: {
        responsive: true, 
        maintainAspectRatio: false,
        scales: { 
          r: { 
            grid: { color: 'rgba(0,0,0,0.08)' }, 
            ticks: { display: false }, 
            pointLabels: { 
              color: '#2c2f2e', 
              font: { size: isMobile ? 9 : 11, family: 'Montserrat' } 
            } 
          } 
        },
        plugins: { legend: { display: false } },
        animation: { duration: 1500, easing: 'easeInOutQuart' },
      },
    });
  },

  handleNav() {
    const nav = document.getElementById('navbar');
    if (!nav) return;
    window.addEventListener('scroll', () => { 
      nav.classList.toggle('scrolled', window.scrollY > 80); 
    }, { passive: true });
  },

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

  initContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const nome = document.getElementById('cf-nome')?.value || '';
      const servico = document.getElementById('cf-servico')?.value || '';
      const data = document.getElementById('cf-data')?.value || '';
      const mensagem = document.getElementById('cf-mensagem')?.value || '';
      let texto = `Olá Vinícius! Meu nome é ${nome}.`;
      if (servico) texto += ` Tenho interesse em: ${servico}.`;
      if (data) texto += ` Data prevista: ${data}.`;
      if (mensagem) texto += ` Mensagem: ${mensagem}`;
      window.open(`https://wa.me/5512981771665?text=${encodeURIComponent(texto)}`, '_blank');
    });
  },
};

const lightbox = {
  el: null, 
  imgEl: null, 
  allImgs: [], 
  currentIndex: 0,

  init() {
    const lb = document.createElement('div');
    lb.id = 'lightbox';
    lb.innerHTML = `
      <div id="lb-overlay"></div>
      <button id="lb-close" aria-label="Fechar">&#x2715;</button>
      <button id="lb-prev" aria-label="Anterior">&#x2039;</button>
      <button id="lb-next" aria-label="Próximo">&#x203A;</button>
      <div id="lb-img-wrap">
        <img id="lb-img" src="" alt="" class="lb-img-transition">
        <div id="lb-loader"></div>
      </div>
      <div id="lb-counter"></div>`;
    document.body.appendChild(lb);
    this.el = lb;
    this.imgEl = lb.querySelector('#lb-img');
    lb.querySelector('#lb-overlay').addEventListener('click', () => this.close());
    lb.querySelector('#lb-close').addEventListener('click', () => this.close());
    lb.querySelector('#lb-prev').addEventListener('click', () => this.prev());
    lb.querySelector('#lb-next').addEventListener('click', () => this.next());
    
    document.addEventListener('keydown', e => {
      if (!lb.classList.contains('lb-active')) return;
      if (e.key === 'Escape') this.close();
      if (e.key === 'ArrowLeft') this.prev();
      if (e.key === 'ArrowRight') this.next();
    });
    
    let touchStartX = 0;
    lb.addEventListener('touchstart', e => { 
      touchStartX = e.touches[0].clientX; 
    }, { passive: true });
    
    lb.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 50) dx < 0 ? this.next() : this.prev();
    });
  },

  open(clickedImg, gridEl) {
    this.allImgs = Array.from(gridEl.querySelectorAll('img')).filter(img => img.complete && img.naturalWidth > 0);
    this.currentIndex = this.allImgs.indexOf(clickedImg);
    if (this.currentIndex === -1) this.currentIndex = 0;
    this.el.classList.add('lb-active');
    document.body.style.overflow = 'hidden';
    this._load(this.allImgs[this.currentIndex].src);
  },

  close() { 
    this.el.classList.remove('lb-active'); 
    document.body.style.overflow = ''; 
    this.imgEl.src = ''; 
  },
  
  prev() { 
    this.currentIndex = (this.currentIndex - 1 + this.allImgs.length) % this.allImgs.length; 
    this._load(this.allImgs[this.currentIndex].src); 
  },
  
  next() { 
    this.currentIndex = (this.currentIndex + 1) % this.allImgs.length; 
    this._load(this.allImgs[this.currentIndex].src); 
  },

  _load(src) {
    const loader = this.el.querySelector('#lb-loader');
    const counter = this.el.querySelector('#lb-counter');
    loader.style.display = 'block';
    this.imgEl.style.opacity = '0';
    const tmp = new Image();
    tmp.src = src;
    tmp.onload = () => { 
      this.imgEl.src = src; 
      this.imgEl.style.opacity = '1'; 
      loader.style.display = 'none'; 
    };
    tmp.onerror = () => { loader.style.display = 'none'; };
    counter.textContent = `${this.currentIndex + 1} / ${this.allImgs.length}`;
  },
};

function initLightbox() { lightbox.init(); }

function initScrollReveal() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => { 
      if (e.isIntersecting) { 
        e.target.classList.add('revealed'); 
        obs.unobserve(e.target); 
      } 
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
  
  new MutationObserver(mutations => {
    mutations.forEach(m => m.addedNodes.forEach(node => {
      if (node.nodeType !== 1) return;
      if (node.classList?.contains('reveal')) obs.observe(node);
      node.querySelectorAll?.('.reveal').forEach(el => obs.observe(el));
    }));
  }).observe(document.body, { childList: true, subtree: true });
}

function initMobileMenu() {
  const btn = document.getElementById('mobile-menu-btn');
  const menu = document.getElementById('mobile-menu');
  if (!btn || !menu) return;

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isHidden = menu.classList.toggle('hidden');
    const icon = btn.querySelector('i');
    if (icon) { 
      icon.className = isHidden ? 'fas fa-bars text-xl' : 'fas fa-times text-xl'; 
    }
  });

  document.addEventListener('click', (e) => {
    if (!menu.contains(e.target) && e.target !== btn && !btn.contains(e.target)) {
      menu.classList.add('hidden');
      const icon = btn.querySelector('i');
      if (icon) icon.className = 'fas fa-bars text-xl';
    }
  });

  menu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      menu.classList.add('hidden');
      const icon = btn.querySelector('i');
      if (icon) icon.className = 'fas fa-bars text-xl';
    });
  });
}

function initRotatingPhrases() {
  const FRASES_FOOTER = [
    'Segue lá no Instagram pra não perder nenhum clique.',
    'Chama no WhatsApp. Sem formalidade, sem formulário.',
    'O próximo ensaio pode ser o seu. Fala comigo.',
    'Toda semana tem foto nova lá no Instagram.',
    'Prefere conversar? É só chamar no WhatsApp.',
    'Aparece lá no Instagram. Prometo que vale.',
    'Um clique no WhatsApp e a gente marca alguma coisa.',
    'A Mantiqueira tá esperando. Só falta você chamar.',
  ];
  const FRASES_CONTATO = [
    'Uma foto sua guarda mais do que você imagina. Bora fazer isso acontecer?',
    'A Mantiqueira tem história pra contar. E você, tem um momento pra eternizar?',
    'Não precisa ser uma grande ocasião. Só precisa ser real.',
    'A melhor foto da sua vida ainda não foi tirada.',
    'Luz, momento e a Mantiqueira como cenário. O resto a gente resolve junto.',
    'A memória falha. A foto não.',
    'Se tá esperando o momento certo, esse é ele.',
    'Fotografia é a única máquina do tempo que existe. Vamos usá-la?',
  ];
  
  const rand = arr => arr[Math.floor(Math.random() * arr.length)];
  
  try {
    const elF = document.getElementById('frase-footer');
    const elC = document.getElementById('frase-contato');
    if (elF) elF.textContent = rand(FRASES_FOOTER);
    if (elC) elC.textContent = rand(FRASES_CONTATO);
  } catch(e) { /* silencioso */ }
}

document.addEventListener('DOMContentLoaded', () => app.init());