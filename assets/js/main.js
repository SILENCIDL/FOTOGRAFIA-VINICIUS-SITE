/* ============================================================
   MAIN.JS — Vinícius Rafael Fotografia
   Módulos:
     1. SPA — navegação entre views
     2. Hero — slideshow
     3. Galeria — carregamento de imagens
     4. Chart — gráfico radar da seção Sobre
     5. Navbar — efeito ao rolar
     6. Frases rotativas
   ============================================================ */

/* ── 1. SPA — navegação entre views ────────────────────────── */

const VIEWS = ['main-view', 'wedding-selector', 'gallery-view', 'olhar-view', 'street-view'];

const app = {
  _streetLoaded: false,
  _olharLoaded:  false,

  init() {
    this.renderChart();
    this.handleNav();
    this.initSlideshow();
    initRotatingPhrases();
  },

  showSection(id) {
    VIEWS.forEach(v => {
      const el = document.getElementById(v);
      if (el) el.classList.add('hidden-content');
    });

    const targetId = id === 'home' ? 'main-view' : id;
    const target   = document.getElementById(targetId);
    if (target) {
      target.classList.remove('hidden-content');
      target.classList.add('fade-in');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  /* ── Casamentos ── */

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
      card.className = 'group relative aspect-[4/3] overflow-hidden cursor-pointer bg-stone-900 shadow-xl';
      card.onclick   = () => app.openGallery('wedding-detail', w);

      card.innerHTML = `
        <img
          src="${encodeURI(w.path + 'capa.jpg')}"
          onerror="this.style.display='none'"
          class="w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-all duration-700"
          alt="${w.name}">
        <div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
        <div class="absolute bottom-6 left-6 text-left">
          <h4 class="font-serif text-2xl text-white uppercase tracking-tighter">${w.name}</h4>
        </div>`;

      container.appendChild(card);
    });

    this.showSection('wedding-selector');
  },

  /* ── 3. Galeria — carregamento de imagens numeradas ── */

  loadImagesFromFolder(gridEl, basePath, folder, start = 1, max = 200) {
    for (let i = start; i <= max; i++) {
      const item = document.createElement('div');
      item.className = 'masonry-item overflow-hidden rounded-sm shadow-2xl loading-skeleton min-h-[200px]';

      const img  = document.createElement('img');
      img.src    = encodeURI(`${basePath}${folder}(${i}).jpg`);
      img.alt    = '';
      img.className = 'w-full h-auto object-cover transition-all duration-700 opacity-0';

      img.onload  = () => {
        img.classList.replace('opacity-0', 'opacity-100');
        item.classList.remove('loading-skeleton');
      };
      img.onerror = () => item.remove();

      item.appendChild(img);
      gridEl.appendChild(item);
    }
  },

  openGallery(theme, customData = null) {
    ['gallery-grid', 'pre-wedding-grid', 'ceremony-grid'].forEach(id => {
      document.getElementById(id).innerHTML = '';
    });

    const hide = id => document.getElementById(id)?.classList.add('hidden');
    const show = id => document.getElementById(id)?.classList.remove('hidden');

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
      const GALLERY_DATA = {
        adventure: {
          title:    'Aventura',
          desc:     'Registros verticais na Pedra do Baú e nas trilhas da Mantiqueira.',
          basePath: 'assets/img/portfolio/aventura/',
        },
        portraits: {
          title:    'Retratos',
          desc:     'Essência capturada na luz natural da serra.',
          basePath: 'assets/img/portfolio/retratos/',
        },
        street: {
          title:    'Fotografia de Rua',
          desc:     'O cotidiano transformado em arte. A vida pulsando nas ruas da serra.',
          basePath: 'assets/img/portfolio/rua/',
        },
      };

      const cfg = GALLERY_DATA[theme];
      title = cfg.title;
      desc  = cfg.desc;
      backBtn.onclick = () => app.showSection('home');

      const grid = document.getElementById('gallery-grid');
      for (let i = 1; i <= 60; i++) {
        const item = document.createElement('div');
        item.className = 'masonry-item overflow-hidden rounded-sm shadow-2xl loading-skeleton min-h-[200px]';

        const img     = document.createElement('img');
        img.src       = encodeURI(`${cfg.basePath}${i}.jpg`);
        img.alt       = '';
        img.className = 'w-full h-auto object-cover transition-all duration-700';
        img.onload    = () => item.classList.remove('loading-skeleton');
        img.onerror   = () => item.remove();

        item.appendChild(img);
        grid.appendChild(item);
      }
    }

    document.getElementById('gallery-title').innerText = title;
    document.getElementById('gallery-desc').innerText  = desc;
    this.showSection('gallery-view');
  },

  openStreet() {
    if (!this._streetLoaded) {
      const grid = document.getElementById('street-grid');
      for (let i = 1; i <= 69; i++) {
        const item = document.createElement('div');
        item.className = 'masonry-item overflow-hidden rounded-sm shadow-2xl loading-skeleton min-h-[200px]';

        const img     = document.createElement('img');
        img.src       = encodeURI(`assets/img/portfolio/rua/galeria/${i}.jpg`);
        img.alt       = '';
        img.className = 'w-full h-auto object-cover transition-all duration-700';
        img.onload    = () => item.classList.remove('loading-skeleton');
        img.onerror   = () => item.remove();

        item.appendChild(img);
        grid.appendChild(item);
      }
      this._streetLoaded = true;
    }
    this.showSection('street-view');
  },

  openOlhar() {
    if (!this._olharLoaded) {
      const grid = document.getElementById('olhar-grid');
      for (let i = 1; i <= 60; i++) {
        const item = document.createElement('div');
        item.className = 'masonry-item overflow-hidden rounded-sm shadow-2xl loading-skeleton min-h-[200px]';

        const img     = document.createElement('img');
        img.src       = encodeURI(`assets/img/portfolio/olhar/registros/${i}.jpg`);
        img.alt       = '';
        img.className = 'w-full h-auto object-cover transition-all duration-700';
        img.onload    = () => item.classList.remove('loading-skeleton');
        img.onerror   = () => item.remove();

        item.appendChild(img);
        grid.appendChild(item);
      }
      this._olharLoaded = true;
    }
    this.showSection('olhar-view');
  },

  /* ── 4. Chart — gráfico radar ── */

  renderChart() {
    const ctx = document.getElementById('skillsChart');
    if (!ctx) return;

    new Chart(ctx.getContext('2d'), {
      type: 'radar',
      data: {
        labels: ['História Local', 'Guiamento', 'Casamentos', 'Pós-Processo', 'Noturna', 'Aventura'],
        datasets: [{
          data: [100, 100, 95, 88, 98, 100],
          backgroundColor: 'rgba(197, 163, 115, 0.2)',
          borderColor:     '#c5a373',
          pointBackgroundColor: '#0a0c0a',
          borderWidth: 2,
        }],
      },
      options: {
        responsive:          true,
        maintainAspectRatio: false,
        scales: {
          r: {
            grid:        { color: 'rgba(0,0,0,0.08)' },
            ticks:       { display: false },
            pointLabels: { color: '#2c2f2e', font: { size: 11 } },
          },
        },
        plugins: { legend: { display: false } },
      },
    });
  },

  /* ── 5. Navbar — efeito ao rolar ── */

  handleNav() {
    const nav = document.getElementById('navbar');
    if (!nav) return;
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 80);
    }, { passive: true });
  },

  /* ── 2. Hero — slideshow ── */

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
};

/* ── 6. Frases rotativas ────────────────────────────────────── */

function sorteia(frases, chave) {
  const ultimo = parseInt(localStorage.getItem(chave) ?? '-1');
  let idx;
  do { idx = Math.floor(Math.random() * frases.length); }
  while (idx === ultimo && frases.length > 1);
  localStorage.setItem(chave, idx);
  return frases[idx];
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
    'Segue o @ e vem fazer parte dessa história.',
    'DM aberta. WhatsApp também. Escolhe o que preferir.',
    'A Mantiqueira tá esperando. Só falta você chamar.',
  ];

  const FRASES_CONTATO = [
    'Uma foto sua guarda mais do que você imagina. Bora fazer isso acontecer?',
    'A Mantiqueira tem história pra contar. E você, tem um momento pra eternizar?',
    'Não precisa ser uma grande ocasião. Só precisa ser real.',
    'A melhor foto da sua vida ainda não foi tirada.',
    'Você aparece na tela do celular todo dia. Uma vez na vida, apareça no quadro certo.',
    'Tem alguma coisa que vale a pena lembrar? Me conta.',
    'Luz, momento e a Mantiqueira como cenário. O resto a gente resolve junto.',
    'Não cobro pelo clique. Cobro pelo que fica depois que o momento vai embora.',
    'Cada história merece ser fotografada do jeito certo.',
    'A memória falha. A foto não.',
    'Se tá esperando o momento certo, esse é ele.',
    'Fotografia é a única máquina do tempo que existe. Vamos usá-la?',
  ];

  const elFooter  = document.getElementById('frase-footer');
  const elContato = document.getElementById('frase-contato');

  if (elFooter)  elFooter.textContent  = sorteia(FRASES_FOOTER,  'vc_footer_frase');
  if (elContato) elContato.textContent = sorteia(FRASES_CONTATO, 'vc_contato_frase');
}

/* ── Bootstrap ──────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => app.init());
