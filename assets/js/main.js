/* ============================================================
   MAIN.JS — FOTOP v3.0
   Orquestrador principal. Inicializa todos os módulos e
   gerencia navegação SPA, navbar, parallax, formulário, etc.
   Depende (carregados antes):
     slideshow.js · lightbox.js · gallery.js · animations.js
   ============================================================ */

'use strict';

const VIEWS = [
  'main-view', 'wedding-selector', 'gallery-view',
  'olhar-view', 'street-view', 'prices-view',
  'testimonials-view', 'blog-view',
];

/* ── App ─────────────────────────────────────────────────── */

const app = {

  init() {
    /* Cada módulo é opcional: portfolio.html e casamentos.html não carregam
       slideshow.js/animations.js. Antes, a ausência lançava ReferenceError e
       matava tudo que vinha depois — inclusive o menu mobile. */
    const talvez = (fn, nome) => {
      try {
        if (typeof fn === 'function') fn();
      } catch (e) {
        console.warn('[init] falhou em ' + nome + ':', e.message);
      }
    };

    talvez(() => this.handleNav(), 'handleNav');
    talvez(() => this.initHeroParallax(), 'initHeroParallax');
    talvez(() => this.initContactForm(), 'initContactForm');
    talvez(() => this.initWAFab(), 'initWAFab');
    talvez(typeof initHeroSlideshow !== 'undefined' && initHeroSlideshow, 'initHeroSlideshow');
    talvez(typeof initScrollReveal !== 'undefined' && initScrollReveal, 'initScrollReveal');
    talvez(typeof initRotatingPhrases !== 'undefined' && initRotatingPhrases, 'initRotatingPhrases');
    talvez(() => this.renderChart(), 'renderChart');
    talvez(() => this.initButtonHovers(), 'initButtonHovers');
    /* O menu mobile agora vive em acoes.js e funciona em todas as páginas. */
  },

  /* ── Segurança ─────────────────────────────────────────── */

  openWhatsapp(text = '') {
    /* Número vem de acoes.js (window.CONTATO) — fonte única no site inteiro. */
    const phone = (window.CONTATO && window.CONTATO.whatsapp) || '5512981771665';
    window.open(`https://wa.me/${phone}${text ? '?text=' + encodeURIComponent(text) : ''}`, '_blank');
  },

  initButtonHovers() {
    const buttons = document.querySelectorAll('[data-hover-color="true"]');
    buttons.forEach(btn => {
      btn.addEventListener('mouseenter', (e) => {
        e.target.style.color = '#8B6F47';
        e.target.style.borderColor = '#8B6F47';
      });
      btn.addEventListener('mouseleave', (e) => {
        e.target.style.color = 'rgba(240,237,230,0.6)';
        e.target.style.borderColor = 'transparent';
      });
    });
  },

  /* ── Navegação SPA ─────────────────────────────────────── */

  showSection(id, registrarHistorico = true) {
    VIEWS.forEach(v => {
      const el = document.getElementById(v);
      if (el) { el.classList.add('hidden-content'); el.classList.remove('fade-in'); }
    });
    const targetId = id === 'home' ? 'main-view' : id;
    const target   = document.getElementById(targetId);
    if (target) {
      target.classList.remove('hidden-content');
      void target.offsetWidth; // force reflow
      target.classList.add('fade-in');
    }

    /* Botão Voltar do navegador fecha a galeria em vez de sair do site.
       O popstate em acoes.js chama com registrarHistorico = false. */
    if (registrarHistorico && window.history && history.pushState) {
      const atual = history.state && history.state.view;
      if (atual !== id) history.pushState({ view: id }, '', id === 'home' ? '#' : '#' + id);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  scrollToSection(id) {
    const el = document.getElementById(id);
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
  },

  closeMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    const btn  = document.getElementById('mobile-menu-btn');
    if (menu) menu.classList.add('hidden');
    if (btn)  { const i = btn.querySelector('i'); if (i) i.className = 'fas fa-bars text-xl'; }
  },

  /* ── Delegação para gallery.js ─────────────────────────── */

  showSubGallery(type) { if (type === 'weddings') gallery.showWeddingSelector(); },
  openGallery(theme, data)   { gallery.openGallery(theme, data); },
  openStreet()               { gallery.openStreet(); },
  openOlhar()                { gallery.openOlhar(); },
  openPrices()               { this.showSection('prices-view'); },
  openTestimonials()         { this.showSection('testimonials-view'); },
  openBlog()                 { this.showSection('blog-view'); },

  /* ── Navbar scroll ─────────────────────────────────────── */

  handleNav() {
    const nav = document.getElementById('navbar');
    if (!nav) return;
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 80);
    }, { passive: true });
  },

  /* ── Hero parallax (desktop only) ─────────────────────── */

  initHeroParallax() {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    const imgs = document.querySelectorAll('.hero-parallax');
    if (!imgs.length) return;
    window.addEventListener('scroll', () => {
      const y = window.scrollY * 0.32;
      imgs.forEach(img => { img.style.transform = `translateY(${y}px)`; });
    }, { passive: true });
  },

  /* ── WhatsApp FAB ──────────────────────────────────────── */

  initWAFab() {
    const fab = document.querySelector('.whatsapp-fab');
    if (!fab) return;

    const show = () => fab.classList.add('visible');

    // Aparece após 3s
    setTimeout(show, 3000);

    // Ou após 30% do scroll
    window.addEventListener('scroll', () => {
      if (window.scrollY / document.documentElement.scrollHeight > 0.3) show();
    }, { passive: true });
  },

  /* ── Formulário de contato → WhatsApp ─────────────────── */

  initContactForm() {
    let lastSubmitTime = 0;
    const SUBMIT_COOLDOWN = 2000;

    const form = document.getElementById('contact-form');
    if (!form) return;
    form.addEventListener('submit', e => {
      e.preventDefault();

      const now = Date.now();
      if (now - lastSubmitTime < SUBMIT_COOLDOWN) {
        alert('Aguarde alguns segundos antes de enviar novamente.');
        return;
      }
      lastSubmitTime = now;

      const nome     = document.getElementById('cf-nome')?.value?.trim() || '';
      const servico  = document.getElementById('cf-servico')?.value  || '';
      const data     = document.getElementById('cf-data')?.value     || '';
      const mensagem = document.getElementById('cf-mensagem')?.value?.trim() || '';

      if (!nome || nome.length < 3 || nome.length > 100) {
        alert('Nome inválido (3-100 caracteres)');
        return;
      }
      if (mensagem && mensagem.length > 500) {
        alert('Mensagem muito longa (máx 500 caracteres)');
        return;
      }

      const sanitize = (str) => str.replace(/[<>]/g, '');

      let texto = `Olá Vinícius! Meu nome é ${sanitize(nome)}.`;
      if (servico)  texto += ` Tenho interesse em: ${servico}.`;
      if (data)     texto += ` Data prevista: ${data}.`;
      if (mensagem) texto += ` Mensagem: ${sanitize(mensagem)}`;
      
      this.openWhatsapp(texto);
    });
  },

  /* ── Radar chart (habilidades) ─────────────────────────── */

  renderChart() {
    const ctx = document.getElementById('skillsChart');
    if (!ctx || typeof Chart === 'undefined') return;
    const isMobile = window.innerWidth < 768;
    new Chart(ctx.getContext('2d'), {
      type: 'radar',
      data: {
        labels: ['História Local', 'Guiamento', 'Casamentos', 'Pós-Processo', 'Noturna', 'Aventura'],
        datasets: [{
          data: [100, 100, 95, 88, 98, 100],
          backgroundColor: 'rgba(139, 111, 71, 0.2)',
          borderColor: 'var(--accent)',
          pointBackgroundColor: '#0d0d0b',
          borderWidth: 2,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            grid: { color: 'rgba(0,0,0,0.08)' },
            ticks: { display: false },
            pointLabels: { color: '#c4b89a', font: { size: isMobile ? 9 : 11, family: 'DM Mono' } },
          },
        },
        plugins: { legend: { display: false } },
        animation: { duration: 1500, easing: 'easeInOutQuart' },
      },
    });
  },
};

/* ── Helpers globais ─────────────────────────────────────── */

function initScrollReveal() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('revealed'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));

  // Observa elementos adicionados dinamicamente
  new MutationObserver(mutations => {
    mutations.forEach(m => m.addedNodes.forEach(node => {
      if (node.nodeType !== 1) return;
      if (node.classList?.contains('reveal')) obs.observe(node);
      node.querySelectorAll?.('.reveal').forEach(el => obs.observe(el));
    }));
  }).observe(document.body, { childList: true, subtree: true });
}

function initMobileMenu() {
  const btn  = document.getElementById('mobile-menu-btn');
  const menu = document.getElementById('mobile-menu');
  if (!btn || !menu) return;

  btn.addEventListener('click', e => {
    e.stopPropagation();
    const isHidden = menu.classList.toggle('hidden');
    const icon = btn.querySelector('i');
    if (icon) icon.className = isHidden ? 'fas fa-bars text-xl' : 'fas fa-times text-xl';
  });

  document.addEventListener('click', e => {
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
  } catch (e) { /* silencioso */ }
}

/* ── Bootstrap ───────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => app.init());
