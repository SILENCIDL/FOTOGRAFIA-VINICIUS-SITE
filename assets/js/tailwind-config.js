/* Tailwind Play CDN — config deve ser aplicada APÓS o CDN carregar.
   Guard defensivo: funciona mesmo se a ordem dos scripts for alterada. */
(function applyTailwindConfig() {
  const config = {
    theme: {
      extend: {
        fontFamily: {
          sans:  ['Montserrat', 'sans-serif'],
          serif: ['Lora', 'serif'],
        },
        colors: {
          mantiqueira: {
            dark:  '#0a0c0a',
            green: '#1a241a',
            rock:  '#2c2f2e',
            earth: '#c5a373',
            light: '#fdfcf9',
          },
        },
      },
    },
  };

  if (typeof tailwind !== 'undefined') {
    /* CDN já carregou — aplica direto */
    tailwind.config = config;
  } else {
    /* CDN ainda não carregou — aguarda e aplica quando pronto */
    document.addEventListener('DOMContentLoaded', function () {
      if (typeof tailwind !== 'undefined') {
        tailwind.config = config;
      }
    });
    /* Fallback extra: tenta novamente após 200ms caso o CDN carregue tarde */
    setTimeout(function () {
      if (typeof tailwind !== 'undefined' && !tailwind.config) {
        tailwind.config = config;
      }
    }, 200);
  }
})();
