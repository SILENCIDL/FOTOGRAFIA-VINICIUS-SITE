/* Login do admin — e-mail, senha e, quando exigido, o código de 6 dígitos.
 *
 * Mora aqui, e não dentro do .astro, de propósito: o Astro EMBUTE script
 * pequeno de página direto no HTML, e a CSP (script-src 'self') bloqueia
 * script inline. Com o código lá dentro, este formulário não enviava nada em
 * produção. Não voltar a colocar no HTML. */
(function () {
  'use strict';

  var form = document.getElementById('login-form');
  var erroEl = document.getElementById('login-error');
  var campoTotp = document.getElementById('campo-totp');
  if (!form) return;

  function mostrarErro(msg) {
    if (!erroEl) return;
    erroEl.textContent = msg;
    erroEl.classList.remove('hidden');
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (erroEl) erroEl.classList.add('hidden');

    var botao = form.querySelector('button[type="submit"]');
    if (botao) botao.disabled = true;

    var dados = new FormData(form);
    var payload = {
      email: dados.get('email'),
      password: dados.get('password'),
    };
    var totp = dados.get('totp');
    if (totp) payload.totp = String(totp).trim();

    try {
      var res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      var data = await res.json();

      if (res.ok && data.success) {
        window.location.href = '/admin';
        return;
      }

      // senha certa, falta o segundo fator: revela o campo em vez de
      // devolver "credenciais inválidas", que confundiria quem acertou tudo
      if (data.code === 'TOTP_REQUERIDO') {
        if (campoTotp) {
          campoTotp.classList.remove('hidden');
          var input = campoTotp.querySelector('input');
          if (input) {
            input.required = true;
            input.focus();
          }
        }
        mostrarErro(data.error || 'Digite o código do aplicativo autenticador.');
        return;
      }

      mostrarErro(data.error || 'Erro ao entrar.');
    } catch {
      mostrarErro('Erro de conexão.');
    } finally {
      if (botao) botao.disabled = false;
    }
  });
})();
