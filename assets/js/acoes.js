/* ===========================================================================
   acoes.js — delegação de eventos
   ---------------------------------------------------------------------------
   Substitui os antigos onclick="" e onerror="" inline, que o CSP
   (script-src 'self') bloqueia. Funciona sozinho: as páginas de casamento
   não carregam o main.js e mesmo assim têm menu e botões vivos.

   Atributos que este arquivo entende:

     data-action="whatsapp"      data-msg="texto opcional"
     data-action="scroll"        data-target="id-da-secao"
     data-action="rolar-ate"     data-target="id-do-elemento"
     data-action="section"       data-target="id-da-view"     (SPA da home)
     data-action="galeria"       data-target="tema"
     data-action="subgaleria"    data-target="weddings"
     data-action="rua" | "olhar"
     data-action="fechar-menu"
     data-fechar-menu            (modificador: fecha o menu junto)

     data-onerror="ocultar"                  esconde a própria imagem
     data-onerror="ocultar-pai"  data-onerror-sel=".galeria-item"
     data-onerror-src="url"                  troca por uma imagem de reserva
   =========================================================================== */
(function () {
  "use strict";

  /* Fonte única do número — main.js também lê daqui. */
  window.CONTATO = window.CONTATO || {
    whatsapp: "5512981771665",
    email: "contato@viniciusrafael.fot.br",
    mensagemPadrao: "Olá, Vinícius! Vim pelo site e gostaria de um orçamento."
  };

  var OFFSET_TOPO = 80;   // altura da navbar fixa

  /* ── helpers ────────────────────────────────────────────────────────── */
  function rolarPara(el, offset, aoTerminar) {
    if (!el) return;
    var y = el.getBoundingClientRect().top + window.scrollY - (offset || 0);
    window.scrollTo({ top: y, behavior: "smooth" });
    if (typeof aoTerminar === "function") aguardarFimDoScroll(aoTerminar);
  }

  /* Chama o callback quando a página parar de rolar (scroll suave não tem
     evento de término nativo, então observamos até a posição estabilizar). */
  function aguardarFimDoScroll(callback) {
    var ultimoY = window.scrollY;
    var parado = 0;
    function checar() {
      if (window.scrollY === ultimoY) {
        parado++;
        if (parado >= 3) { callback(); return; }
      } else {
        parado = 0;
        ultimoY = window.scrollY;
      }
      requestAnimationFrame(checar);
    }
    requestAnimationFrame(checar);
  }

  function fecharMenu() {
    var menu = document.getElementById("mobile-menu");
    var btn = document.getElementById("mobile-menu-btn");
    if (menu) menu.classList.add("hidden");
    if (btn) {
      btn.setAttribute("aria-expanded", "false");
      var i = btn.querySelector("i");
      if (i) i.className = "fas fa-bars text-xl";
    }
    document.body.style.overflow = "";
  }

  function abrirWhatsApp(msg) {
    var texto = msg || window.CONTATO.mensagemPadrao;
    window.open(
      "https://wa.me/" + window.CONTATO.whatsapp + "?text=" + encodeURIComponent(texto),
      "_blank", "noopener"
    );
  }

  /* Brilho suave no formulário de contato, ao chegar por clique do menu. */
  function destacarContato() {
    var form = document.getElementById("contact-form");
    if (!form) return;
    form.classList.remove("contato-destaque");
    void form.offsetWidth; // força reflow para reiniciar a animação
    form.classList.add("contato-destaque");
    setTimeout(function () {
      form.classList.remove("contato-destaque");
    }, 1500);
  }

  /* ── 1. cliques ─────────────────────────────────────────────────────── */
  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-action], [data-fechar-menu]");
    if (!el) return;

    var acao = el.getAttribute("data-action");
    var alvo = el.getAttribute("data-target");
    var temApp = typeof window.app !== "undefined";

    switch (acao) {
      case "whatsapp":
        e.preventDefault();
        abrirWhatsApp(el.getAttribute("data-msg"));
        break;

      case "scroll":
        e.preventDefault();
        rolarPara(
          document.getElementById(alvo),
          OFFSET_TOPO,
          alvo === "contato" ? destacarContato : null
        );
        break;

      case "rolar-ate":
        e.preventDefault();
        var d = document.getElementById(alvo);
        if (d) d.scrollIntoView({ behavior: "smooth" });
        break;

      case "section":
        e.preventDefault();
        if (temApp && app.showSection) app.showSection(alvo);
        break;

      case "galeria":
        e.preventDefault();
        if (temApp && app.openGallery) app.openGallery(alvo);
        break;

      case "subgaleria":
        e.preventDefault();
        if (temApp && app.showSubGallery) app.showSubGallery(alvo);
        break;

      case "rua":
        e.preventDefault(); if (temApp && app.openStreet) app.openStreet(); break;
      case "olhar":
        e.preventDefault(); if (temApp && app.openOlhar) app.openOlhar(); break;

      case "fechar-menu":
        fecharMenu();
        break;
    }

    if (el.hasAttribute("data-fechar-menu")) fecharMenu();
  });

  /* ── 2. imagens que falham ──────────────────────────────────────────── */
  /* 'error' não borbulha: precisa ser capturado na fase de captura. */
  document.addEventListener("error", function (e) {
    var img = e.target;
    if (!img || img.tagName !== "IMG") return;

    var reserva = img.getAttribute("data-onerror-src");
    if (reserva && img.src !== reserva) {
      img.removeAttribute("data-onerror-src");   // evita laço infinito
      img.src = reserva;
      return;
    }

    var modo = img.getAttribute("data-onerror");
    if (modo === "ocultar") {
      img.style.display = "none";
    } else if (modo === "ocultar-pai") {
      var sel = img.getAttribute("data-onerror-sel") || ".galeria-item";
      var pai = img.closest(sel);
      if (pai) pai.style.display = "none";
    }
  }, true);

  /* ── 2b. galerias sem foto não aparecem ─────────────────────────────
     Um elemento com data-requer-foto="caminho" fica escondido até que a
     foto exista no servidor. Basta subir os arquivos e ele volta sozinho —
     nenhuma edição de código necessária. */
  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("[data-requer-foto]").forEach(function (el) {
      var caminho = el.getAttribute("data-requer-foto");
      el.style.display = "none";
      var prova = new Image();
      prova.onload = function () { el.style.display = ""; };
      prova.src = encodeURI(caminho);
    });
  });

  /* ── 3. menu mobile (funciona em qualquer página) ───────────────────── */
  document.addEventListener("DOMContentLoaded", function () {
    var btn = document.getElementById("mobile-menu-btn");
    var menu = document.getElementById("mobile-menu");
    if (!btn || !menu) return;

    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-controls", "mobile-menu");

    btn.addEventListener("click", function () {
      var aberto = !menu.classList.contains("hidden");
      if (aberto) {
        fecharMenu();
      } else {
        menu.classList.remove("hidden");
        btn.setAttribute("aria-expanded", "true");
        var i = btn.querySelector("i");
        if (i) i.className = "fas fa-times text-xl";
        document.body.style.overflow = "hidden";
      }
    });

    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape" && !menu.classList.contains("hidden")) {
        fecharMenu();
        btn.focus();
      }
    });
  });

  /* ── 4. botão Voltar do navegador fecha a galeria ───────────────────── */
  window.addEventListener("popstate", function (e) {
    if (typeof window.app === "undefined" || !app.showSection) return;
    var view = (e.state && e.state.view) || "home";
    app.showSection(view, false);   // false = não empilhar de novo
  });
})();
