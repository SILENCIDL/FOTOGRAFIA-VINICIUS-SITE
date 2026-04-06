/* ============================================================
   MAIN.JS — Entry Point FOTOP (v2.0 — ES Modules)
   ============================================================
   Este arquivo é o único carregado diretamente pelo HTML
   (type="module"). Ele importa e inicia todos os módulos.

   Estrutura de módulos:
     config.js   → dados de contato, caminhos, contagens
     lightbox.js → visualizador de imagens em tela cheia
     utils.js    → scrollReveal, mobileMenu, frases
     app.js      → objeto principal da SPA (usa todos acima)
     main.js     → este arquivo (entry point)

   Por usar type="module", o script é carregado de forma
   diferida (deferred) automaticamente pelo navegador.
   ============================================================ */

import { app } from './app.js';

/*
 * Expõe `app` no escopo global para que os handlers inline
 * no HTML (onclick="app.showSection(...)") continuem funcionando
 * sem necessidade de reescrever o HTML.
 */
window.app = app;

document.addEventListener('DOMContentLoaded', () => app.init());
