/* ============================================================
   CONFIG.JS — FOTOP Configuração Central (v1.0)
   ============================================================
   ÚNICO lugar para alterar:
     • Número de WhatsApp
     • Handles de redes sociais
     • Caminhos de imagens
     • Contagem de fotos por coleção
     • Dados dos álbuns de casamento

   NUNCA coloque este arquivo em logs públicos ou repositórios
   públicos sem rever os dados de contato aqui contidos.
   ============================================================ */

/* --- Contato ------------------------------------------------ */
export const CONTACT = {
  /**
   * Número WhatsApp no formato internacional sem "+" nem espaços.
   * Exemplo: Brasil (55) + DDD (12) + número (981771665)
   */
  whatsapp: '5512981771665',

  /** Handle do Instagram (sem @) */
  instagram: 'fotopvinicius',
};

/* --- Imagens ------------------------------------------------ */
export const IMAGES = {
  hero:   { count: 4 },
  olhar:  { count: 31 },
  street: { count: 138 },
};

/* --- Álbuns de Casamento ------------------------------------ */
export const WEDDINGS = [
  {
    name:     'Bianca & Donizete',
    path:     'assets/img/portfolio/casamentos/Bianca & Donizete/',
    fallback: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2070&auto=format&fit=crop',
  },
  {
    name:     'Miellem & Aleft',
    path:     'assets/img/portfolio/casamentos/Miellem & Aleft/',
    fallback: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=2069&auto=format&fit=crop',
  },
  {
    name:     'Pamela & Juliano',
    path:     'assets/img/portfolio/casamentos/Pamela & Juliano/',
    fallback: 'https://images.unsplash.com/photo-1464093515883-ec948246accb?q=80&w=2069&auto=format&fit=crop',
  },
  {
    name:     'Marcos & Patricia',
    path:     'assets/img/portfolio/casamentos/Patricia & Marcos/',
    fallback: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?q=80&w=2070&auto=format&fit=crop',
  },
];

/* --- Dados das Galerias ------------------------------------- */
export const GALLERY_DATA = {
  adventure: {
    title:    'Aventura',
    desc:     'Registros verticais na Pedra do Baú e nas trilhas da Mantiqueira.',
    basePath: 'assets/img/portfolio/aventura/',
    prefix:   'aventura',
  },
  portraits: {
    title:    'Retratos',
    desc:     'Essência capturada na luz natural da serra.',
    basePath: 'assets/img/portfolio/retratos/',
    prefix:   'retratos',
  },
  street: {
    title:    'Fotografia de Rua',
    desc:     'O cotidiano transformado em arte.',
    basePath: 'assets/img/portfolio/rua/',
    prefix:   'rua',
  },
};
