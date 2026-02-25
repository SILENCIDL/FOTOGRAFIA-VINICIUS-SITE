/**
 * main.js — Lógica de interação do portfólio
 *
 * Módulos:
 *  1. Header scroll behavior
 *  2. Menu hambúrguer (mobile)
 *  3. Active nav link via IntersectionObserver
 *  4. Animações de entrada (reveal)
 *  5. Formulário de contato — validação client-side
 *  6. Footer — ano dinâmico
 */

(function () {
  'use strict';

  /* ──────────────────────────────────────────────
     1. HEADER — Efeito ao rolar
  ────────────────────────────────────────────── */

  const header = document.querySelector('.header');

  if (header) {
    const onScroll = () => {
      header.classList.toggle('is-scrolled', window.scrollY > 40);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // estado inicial
  }

  /* ──────────────────────────────────────────────
     2. MENU HAMBÚRGUER
  ────────────────────────────────────────────── */

  const navToggle = document.querySelector('.nav__toggle');
  const navMenu   = document.querySelector('.nav__menu');
  const navLinks  = document.querySelectorAll('.nav__link');

  if (navToggle && navMenu) {
    const openMenu = () => {
      navMenu.classList.add('is-open');
      navToggle.setAttribute('aria-expanded', 'true');
      navToggle.setAttribute('aria-label', 'Fechar menu de navegação');
      document.body.style.overflow = 'hidden';
    };

    const closeMenu = () => {
      navMenu.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.setAttribute('aria-label', 'Abrir menu de navegação');
      document.body.style.overflow = '';
    };

    navToggle.addEventListener('click', () => {
      const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
      isOpen ? closeMenu() : openMenu();
    });

    // Fechar ao clicar em um link
    navLinks.forEach((link) => {
      link.addEventListener('click', closeMenu);
    });

    // Fechar com ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navToggle.getAttribute('aria-expanded') === 'true') {
        closeMenu();
        navToggle.focus();
      }
    });

    // Fechar ao redimensionar para desktop
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    mediaQuery.addEventListener('change', (e) => {
      if (e.matches) closeMenu();
    });
  }

  /* ──────────────────────────────────────────────
     3. ACTIVE NAV LINK via IntersectionObserver
  ────────────────────────────────────────────── */

  const sections = document.querySelectorAll('section[id]');

  if (sections.length && navLinks.length) {
    const activateLink = (id) => {
      navLinks.forEach((link) => {
        const isCurrent = link.getAttribute('href') === `#${id}`;
        link.setAttribute('aria-current', isCurrent ? 'true' : 'false');
      });
    };

    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            activateLink(entry.target.id);
          }
        });
      },
      {
        rootMargin: `-${getComputedStyle(document.documentElement)
          .getPropertyValue('--nav-height')
          .trim()} 0px -60% 0px`,
        threshold: 0,
      }
    );

    sections.forEach((section) => sectionObserver.observe(section));
  }

  /* ──────────────────────────────────────────────
     4. ANIMAÇÕES DE ENTRADA (reveal)
  ────────────────────────────────────────────── */

  const revealTargets = document.querySelectorAll(
    '.section-header, .sobre__text, .sobre__stats, .stat-card, ' +
    '.skill-category, .project-card, .contato__info, .contato__form'
  );

  if (revealTargets.length) {
    // Adiciona a classe .reveal dinamicamente (não depende de HTML manual)
    revealTargets.forEach((el, index) => {
      el.classList.add('reveal');

      // Escalonamento por grupo de elementos irmãos
      const siblings = el.parentElement
        ? Array.from(el.parentElement.children).filter((c) =>
            c.classList.contains(el.classList[0])
          )
        : [];
      const siblingIndex = siblings.indexOf(el);
      if (siblingIndex > 0 && siblingIndex <= 4) {
        el.classList.add(`reveal-delay-${siblingIndex}`);
      }
    });

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target); // anima só uma vez
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    revealTargets.forEach((el) => revealObserver.observe(el));
  }

  /* ──────────────────────────────────────────────
     5. FORMULÁRIO DE CONTATO — Validação
  ────────────────────────────────────────────── */

  const form       = document.getElementById('contact-form');
  const formStatus = document.getElementById('form-status');
  const formSubmit = document.getElementById('form-submit');

  if (form) {
    // Validadores individuais
    const validators = {
      name: (value) => {
        if (!value.trim())           return 'Nome é obrigatório.';
        if (value.trim().length < 2) return 'Nome deve ter ao menos 2 caracteres.';
        return '';
      },
      email: (value) => {
        if (!value.trim())              return 'E-mail é obrigatório.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()))
                                        return 'Informe um e-mail válido.';
        return '';
      },
      message: (value) => {
        if (!value.trim())            return 'Mensagem é obrigatória.';
        if (value.trim().length < 10) return 'Mensagem deve ter ao menos 10 caracteres.';
        return '';
      },
    };

    const getField = (name) => form.querySelector(`[name="${name}"]`);
    const getError = (name) => form.querySelector(`[name="${name}"]`)
      ?.closest('.form-group')
      ?.querySelector('.form-error');

    const validateField = (name, value) => {
      const error   = validators[name]?.(value) ?? '';
      const input   = getField(name);
      const errorEl = getError(name);

      if (input)   input.classList.toggle('is-invalid', !!error);
      if (errorEl) errorEl.textContent = error;

      return error === '';
    };

    // Validação em tempo real (blur + input)
    ['name', 'email', 'message'].forEach((fieldName) => {
      const input = getField(fieldName);
      if (!input) return;

      input.addEventListener('blur', () => validateField(fieldName, input.value));
      input.addEventListener('input', () => {
        // Só revalida ao digitar se o campo já estava inválido
        if (input.classList.contains('is-invalid')) {
          validateField(fieldName, input.value);
        }
      });
    });

    // Submit
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const nameVal    = getField('name')?.value    ?? '';
      const emailVal   = getField('email')?.value   ?? '';
      const messageVal = getField('message')?.value ?? '';

      const isValid = [
        validateField('name',    nameVal),
        validateField('email',   emailVal),
        validateField('message', messageVal),
      ].every(Boolean);

      if (!isValid) {
        // Foca o primeiro campo inválido
        form.querySelector('.is-invalid')?.focus();
        return;
      }

      // Simula envio (substituir por fetch real quando integrar backend/serviço)
      setSubmitLoading(true);
      simulateSend({ name: nameVal, email: emailVal, message: messageVal })
        .then(() => {
          showStatus('Mensagem enviada com sucesso! Retornarei em breve.', 'success');
          form.reset();
        })
        .catch(() => {
          showStatus('Falha ao enviar. Tente novamente ou use o e-mail diretamente.', 'error');
        })
        .finally(() => setSubmitLoading(false));
    });

    const setSubmitLoading = (loading) => {
      if (!formSubmit) return;
      formSubmit.disabled = loading;
      const textEl = formSubmit.querySelector('.btn__text');
      if (textEl) textEl.textContent = loading ? 'Enviando...' : 'Enviar mensagem';
    };

    const showStatus = (message, type) => {
      if (!formStatus) return;
      formStatus.textContent = message;
      formStatus.className   = `form-status is-${type}`;
      setTimeout(() => {
        formStatus.textContent = '';
        formStatus.className   = 'form-status';
      }, 6000);
    };

    // Stub de envio — substituir por integração real (EmailJS, Formspree, etc.)
    const simulateSend = (_data) =>
      new Promise((resolve, reject) => {
        setTimeout(() => {
          // Simula 90% de sucesso durante desenvolvimento
          Math.random() > 0.1 ? resolve() : reject(new Error('Network error'));
        }, 1200);
      });
  }

  /* ──────────────────────────────────────────────
     6. FOOTER — Ano dinâmico
  ────────────────────────────────────────────── */

  const yearEl = document.getElementById('footer-year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

})();
