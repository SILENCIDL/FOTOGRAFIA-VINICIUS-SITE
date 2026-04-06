/* ============================================================
   UTILS.JS — Funções utilitárias FOTOP (v1.0)
   ============================================================
   Módulos independentes sem estado global:
     • initScrollReveal  — anima elementos ao entrar na viewport
     • initMobileMenu    — controla abertura/fechamento do menu
     • initRotatingPhrases — frases aleatórias no footer e contato
   ============================================================ */

/* --- Scroll Reveal ----------------------------------------- */

/**
 * Observa elementos com classe `.reveal` e adiciona `.revealed`
 * ao entrarem na viewport. Também observa nós adicionados
 * dinamicamente (ex: imagens carregadas em lote).
 */
export function initScrollReveal() {
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px -30px 0px' }
  );

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  /* Observa elementos `.reveal` adicionados via JS (galeria lazy) */
  new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType !== 1) return;
        if (node.classList?.contains('reveal')) observer.observe(node);
        node.querySelectorAll?.('.reveal').forEach(el => observer.observe(el));
      });
    });
  }).observe(document.body, { childList: true, subtree: true });
}

/* --- Mobile Menu ------------------------------------------- */

/**
 * Controla o hamburger/menu mobile.
 * Fecha ao clicar fora, ao pressionar um link interno
 * e alterna ícone bars ↔ times.
 */
export function initMobileMenu() {
  const btn  = document.getElementById('mobile-menu-btn');
  const menu = document.getElementById('mobile-menu');
  if (!btn || !menu) return;

  const setIcon = open => {
    const icon = btn.querySelector('i');
    if (icon) icon.className = open ? 'fas fa-times text-xl' : 'fas fa-bars text-xl';
  };

  btn.addEventListener('click', e => {
    e.stopPropagation();
    const isHidden = menu.classList.toggle('hidden');
    setIcon(!isHidden);
  });

  /* Fechar ao clicar fora */
  document.addEventListener('click', e => {
    if (!menu.contains(e.target) && e.target !== btn && !btn.contains(e.target)) {
      menu.classList.add('hidden');
      setIcon(false);
    }
  });

  /* Fechar ao clicar em link interno */
  menu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      menu.classList.add('hidden');
      setIcon(false);
    });
  });
}

/* --- Frases Rotativas -------------------------------------- */

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

const randomFrom = arr => arr[Math.floor(Math.random() * arr.length)];

/**
 * Preenche #frase-footer e #frase-contato com frases aleatórias.
 */
export function initRotatingPhrases() {
  try {
    const elFooter  = document.getElementById('frase-footer');
    const elContato = document.getElementById('frase-contato');
    if (elFooter)  elFooter.textContent  = randomFrom(FRASES_FOOTER);
    if (elContato) elContato.textContent = randomFrom(FRASES_CONTATO);
  } catch (_) { /* silencioso */ }
}
