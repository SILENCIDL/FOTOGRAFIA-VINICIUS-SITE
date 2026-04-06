/* ============================================================
   LIGHTBOX.JS — Visualizador de imagens em tela cheia (v1.0)
   ============================================================
   Funcionalidades:
     • Abrir/fechar com overlay, botão e tecla Esc
     • Navegar com ← → (teclado) e swipe (touch)
     • Contador de posição (ex: 3 / 12)
     • Loader animado durante carregamento da imagem
   ============================================================ */

export const lightbox = {
  el:           null,
  imgEl:        null,
  allImgs:      [],
  currentIndex: 0,

  init() {
    const lb = document.createElement('div');
    lb.id = 'lightbox';
    lb.innerHTML = `
      <div id="lb-overlay"></div>
      <button id="lb-close" aria-label="Fechar">&#x2715;</button>
      <button id="lb-prev"  aria-label="Anterior">&#x2039;</button>
      <button id="lb-next"  aria-label="Próximo">&#x203A;</button>
      <div id="lb-img-wrap">
        <img id="lb-img" src="" alt="" class="lb-img-transition">
        <div id="lb-loader"></div>
      </div>
      <div id="lb-counter"></div>`;
    document.body.appendChild(lb);

    this.el    = lb;
    this.imgEl = lb.querySelector('#lb-img');

    lb.querySelector('#lb-overlay').addEventListener('click', () => this.close());
    lb.querySelector('#lb-close').addEventListener('click',   () => this.close());
    lb.querySelector('#lb-prev').addEventListener('click',    () => this.prev());
    lb.querySelector('#lb-next').addEventListener('click',    () => this.next());

    /* Navegação por teclado */
    document.addEventListener('keydown', e => {
      if (!lb.classList.contains('lb-active')) return;
      if (e.key === 'Escape')     this.close();
      if (e.key === 'ArrowLeft')  this.prev();
      if (e.key === 'ArrowRight') this.next();
    });

    /* Swipe touch */
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
    this.allImgs     = Array.from(gridEl.querySelectorAll('img'))
                            .filter(img => img.complete && img.naturalWidth > 0);
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
    const loader  = this.el.querySelector('#lb-loader');
    const counter = this.el.querySelector('#lb-counter');

    loader.style.display   = 'block';
    this.imgEl.style.opacity = '0';

    const tmp = new Image();
    tmp.src = src;
    tmp.onload  = () => {
      this.imgEl.src           = src;
      this.imgEl.style.opacity = '1';
      loader.style.display     = 'none';
    };
    tmp.onerror = () => { loader.style.display = 'none'; };

    counter.textContent = `${this.currentIndex + 1} / ${this.allImgs.length}`;
  },
};

export function initLightbox() {
  lightbox.init();
}
