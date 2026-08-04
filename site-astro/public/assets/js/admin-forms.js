/* Formulários do painel admin: cadastro de cliente, de sessão e upload.
 *
 * Mora aqui, e não dentro dos .astro, de propósito: o Astro EMBUTE script
 * pequeno de página direto no HTML, e a CSP (script-src 'self') bloqueia
 * script inline — os três formulários ficariam mudos em produção.
 * Não voltar a colocar no HTML.
 *
 * Um arquivo só serve as três páginas: cada uma liga o que existe nela.
 * O que muda de página para página vem do HTML, em data-*:
 *
 *   data-endpoint="/api/..."   para onde enviar
 *   data-msg="id-do-<p>"       onde escrever o retorno
 *   data-ok="texto"            mensagem de sucesso
 *   data-envio="json|form"     JSON ou multipart (upload de arquivo)
 *   data-reload="800"          recarregar a página depois de N ms (opcional)
 */
(function () {
  'use strict';

  function ligar(form) {
    var msgEl = document.getElementById(form.dataset.msg || '');
    var endpoint = form.dataset.endpoint;
    if (!endpoint) return;

    function escrever(texto, ok) {
      if (!msgEl) return;
      msgEl.textContent = texto;
      msgEl.className = 'mt-3 text-sm ' + (ok ? 'text-green-400' : 'text-red-400');
      msgEl.classList.remove('hidden');
    }

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      if (msgEl) msgEl.classList.add('hidden');

      var botao = form.querySelector('button[type="submit"]');
      if (botao) botao.disabled = true;

      try {
        var dados = new FormData(form);
        var req = form.dataset.envio === 'form'
          ? { method: 'POST', body: dados }
          : {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(Object.fromEntries(dados.entries())),
            };

        var res = await fetch(endpoint, req);
        var data = await res.json().catch(function () {
          return {};
        });

        if (res.ok && data.success) {
          escrever(form.dataset.ok || 'Salvo!', true);
          form.reset();
          var espera = parseInt(form.dataset.reload || '0', 10);
          if (espera > 0) setTimeout(function () { window.location.reload(); }, espera);
        } else {
          escrever(data.error || 'Erro ao salvar.', false);
        }
      } catch {
        escrever('Erro de conexão.', false);
      } finally {
        if (botao) botao.disabled = false;
      }
    });
  }

  document.querySelectorAll('form[data-endpoint]').forEach(ligar);
})();
