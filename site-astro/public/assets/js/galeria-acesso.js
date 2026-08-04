/* Formulário de senha da galeria do cliente.
 *
 * Mora aqui, e não dentro do .astro, de propósito: o Astro EMBUTE script
 * pequeno de página direto no HTML, e a CSP (script-src 'self') bloqueia
 * script inline. Com o código lá dentro, este botão simplesmente não fazia
 * nada em produção. Não voltar a colocar no HTML. */
(function () {
  'use strict';

  var form = document.getElementById('gallery-form');
  if (!form) return;

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    var botao = form.querySelector('button[type="submit"]');
    if (botao) botao.disabled = true;

    var payload = Object.fromEntries(new FormData(form).entries());

    try {
      var res = await fetch('/api/gallery/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        window.location.reload();
        return;
      }

      var data = await res.json().catch(function () {
        return { error: 'Erro ao acessar.' };
      });
      var url = new URL(window.location.href);
      url.searchParams.set('error', data.error || 'Senha incorreta.');
      window.location.href = url.toString();
    } catch {
      var u = new URL(window.location.href);
      u.searchParams.set('error', 'Erro de conexão.');
      window.location.href = u.toString();
    } finally {
      if (botao) botao.disabled = false;
    }
  });
})();
