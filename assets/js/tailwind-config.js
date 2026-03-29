/* Tailwind Play CDN — FOTOP v2.0
   Atualiza paleta para cobre/terra (warm dark) + tipografia editorial.
   Guard defensivo mantido: funciona mesmo se CDN carregar tarde. */
(function applyTailwindConfig() {
  const config = {
    theme: {
      extend: {
        fontFamily: {
          sans:    ['DM Sans',          'sans-serif'],
          serif:   ['Playfair Display', 'serif'],
          mono:    ['DM Mono',          'monospace'],
          display: ['Playfair Display', 'serif'],
        },
        colors: {
          mantiqueira: {
            dark:  '#0d0d0b',   /* bg-primary  */
            green: '#1a1915',   /* bg-secondary */
            rock:  '#2e2b25',   /* bg-tertiary  */
            earth: '#8B6F47',   /* accent       */
            light: '#f0ede6',   /* text-primary */
            muted: '#7a7870',   /* text-muted   */
          },
        },
      },
    },
  };

  if (typeof tailwind !== 'undefined') {
    tailwind.config = config;
  } else {
    document.addEventListener('DOMContentLoaded', function () {
      if (typeof tailwind !== 'undefined') tailwind.config = config;
    });
    setTimeout(function () {
      if (typeof tailwind !== 'undefined' && !tailwind.config) tailwind.config = config;
    }, 200);
  }
})();
