/* Tela de cadastro do segundo fator (/admin/seguranca).
 *
 * Mora aqui, e não dentro do .astro, por causa da CSP (script-src 'self') —
 * script embutido no HTML é bloqueado. Não voltar a colocar no HTML. */
(function () {
  'use strict';

  var msg = document.getElementById('msg-2fa');
  var segredoAtual = null;

  function aviso(texto, ok) {
    if (!msg) return;
    msg.textContent = texto;
    msg.className = 'mt-4 text-sm ' + (ok ? 'text-green-400' : 'text-red-400');
    msg.classList.remove('hidden');
  }

  async function chamar(corpo) {
    var res = await fetch('/api/admin/2fa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(corpo),
    });
    var data = await res.json().catch(function () { return {}; });
    return { ok: res.ok && data.success, data: data };
  }

  var btnIniciar = document.getElementById('btn-iniciar');
  if (btnIniciar) {
    btnIniciar.addEventListener('click', async function () {
      btnIniciar.disabled = true;
      var r = await chamar({ acao: 'iniciar' });
      btnIniciar.disabled = false;

      if (!r.ok) return aviso(r.data.error || 'Erro ao iniciar.', false);

      segredoAtual = r.data.segredo;
      document.getElementById('segredo').textContent = r.data.segredo;
      document.getElementById('uri').textContent = r.data.uri;
      document.getElementById('passo-cadastro').classList.remove('hidden');
      btnIniciar.classList.add('hidden');
      if (msg) msg.classList.add('hidden');
    });
  }

  var formConfirmar = document.getElementById('form-confirmar');
  if (formConfirmar) {
    formConfirmar.addEventListener('submit', async function (e) {
      e.preventDefault();
      var codigo = new FormData(formConfirmar).get('codigo');

      var r = await chamar({ acao: 'confirmar', segredo: segredoAtual, codigo: codigo });
      if (!r.ok) return aviso(r.data.error || 'Código não confere.', false);

      // o segredo sai da memória assim que deixa de ser necessário
      segredoAtual = null;
      document.getElementById('passo-cadastro').classList.add('hidden');
      document.getElementById('codigos').textContent =
        (r.data.codigosDeRecuperacao || []).join('\n');
      document.getElementById('passo-recuperacao').classList.remove('hidden');
      if (msg) msg.classList.add('hidden');
    });
  }

  var formDesligar = document.getElementById('form-desligar');
  if (formDesligar) {
    formDesligar.addEventListener('submit', async function (e) {
      e.preventDefault();
      var senha = new FormData(formDesligar).get('senha');

      var r = await chamar({ acao: 'desligar', senha: senha });
      if (!r.ok) return aviso(r.data.error || 'Erro ao desligar.', false);

      aviso('Verificação em duas etapas desligada.', true);
      setTimeout(function () { window.location.reload(); }, 800);
    });
  }
})();
