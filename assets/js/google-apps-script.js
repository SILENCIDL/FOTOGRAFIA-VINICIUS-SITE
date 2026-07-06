/**
 * FOTOP — Google Apps Script para captura de leads
 * ================================================
 * INSTRUÇÕES DE USO:
 *
 * 1. Acesse: https://script.google.com
 * 2. Clique em "Novo projeto"
 * 3. Apague o código que aparece e cole TODO o conteúdo deste arquivo
 * 4. No menu superior, clique em "Implantar" → "Nova implantação"
 * 5. Em "Tipo", escolha "Aplicativo da Web"
 * 6. Configure:
 *    - Descrição: ArquivosVinicius
 *    - Executar como: EU MESMO (viniciusrafaelgoncalvessilva@gmail.com)
 *    - Quem tem acesso: QUALQUER PESSOA
 * 7. Clique em "Implantar" e autorize quando pedir
 * 8. Copie a URL gerada (começa com https://script.google.com/macros/s/...)
 * 9. Cole essa URL no arquivo assets/js/config.js no campo appsScriptUrl
 *
 * Após isso, cada envio do formulário do site:
 *  ✓ Salva uma linha na planilha "ArquivosVinicius" no seu Google Drive
 *  ✓ Envia um email de notificação para viniciusrafaelgoncalvessilva@gmail.com
 */

const EMAIL_NOTIFICACAO = 'viniciusrafaelgoncalvessilva@gmail.com';
const NOME_PLANILHA     = 'ArquivosVinicius';

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    /* Lê os dados enviados pelo formulário do site */
    const p        = e.parameter || {};
    const nome     = p.nome     || '(não informado)';
    const servico  = p.servico  || '(não informado)';
    const data     = p.data     || '(não informada)';
    const mensagem = p.mensagem || '(sem mensagem)';
    const origem   = p.origem   || 'direto';
    const horario  = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

    /* Abre ou cria a planilha no Google Drive */
    let planilha;
    const arquivos = DriveApp.getFilesByName(NOME_PLANILHA);
    if (arquivos.hasNext()) {
      planilha = SpreadsheetApp.open(arquivos.next());
    } else {
      planilha = SpreadsheetApp.create(NOME_PLANILHA);
      const cabecalho = planilha.getActiveSheet();
      cabecalho.appendRow(['Horário', 'Nome', 'Serviço', 'Data Prevista', 'Mensagem', 'Origem']);
      cabecalho.getRange(1, 1, 1, 6).setFontWeight('bold');
    }

    /* Adiciona a nova linha com os dados do lead */
    planilha.getActiveSheet().appendRow([horario, nome, servico, data, mensagem, origem]);

    /* Envia email de notificação */
    MailApp.sendEmail({
      to:      EMAIL_NOTIFICACAO,
      subject: '📸 Novo lead FOTOP — ' + nome,
      body:    [
        'Novo contato recebido pelo site FOTOP!',
        '',
        'Nome:           ' + nome,
        'Serviço:        ' + servico,
        'Data prevista:  ' + data,
        'Mensagem:       ' + mensagem,
        'Origem:         ' + origem,
        'Horário:        ' + horario,
        '',
        'Ver todos os leads: https://drive.google.com',
      ].join('\n'),
    });

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);

  } finally {
    lock.releaseLock();
  }
}

/* Responde ao teste manual via navegador (GET) */
function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'online', projeto: 'ArquivosVinicius' }))
    .setMimeType(ContentService.MimeType.JSON);
}
