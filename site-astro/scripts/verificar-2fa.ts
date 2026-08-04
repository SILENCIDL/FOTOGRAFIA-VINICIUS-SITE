/**
 * Verificação do TOTP — roda sem banco e sem servidor.
 *
 *   npm run test:2fa
 *
 * Inclui os vetores oficiais da RFC 6238: se a implementação bate com eles,
 * ela bate com Google Authenticator, Authy e 1Password, sem precisar testar
 * contra um celular.
 */
import { gerarCodigo, verificarCodigo, gerarSegredo, uriDeCadastro, gerarCodigosDeRecuperacao } from '../src/lib/totp';

let falhas = 0;
function checa(nome: string, real: unknown, esperado: unknown) {
  const ok = real === esperado;
  if (!ok) falhas++;
  console.log(`${ok ? '  ok  ' : ' FALHA'}  ${nome}${ok ? '' : `  (esperado ${esperado}, veio ${real})`}`);
}

// RFC 6238, Appendix B — segredo "12345678901234567890" em base32
const RFC_SEGREDO = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';

function main() {
  console.log('— vetores oficiais da RFC 6238 (SHA1, 6 dígitos) —');
  // valores conferidos contra a tabela da RFC, truncados para 6 dígitos
  checa('t=59s', gerarCodigo(RFC_SEGREDO, 59 * 1000), '287082');
  checa('t=1111111109s', gerarCodigo(RFC_SEGREDO, 1111111109 * 1000), '081804');
  checa('t=1111111111s', gerarCodigo(RFC_SEGREDO, 1111111111 * 1000), '050471');
  checa('t=1234567890s', gerarCodigo(RFC_SEGREDO, 1234567890 * 1000), '005924');
  checa('t=2000000000s', gerarCodigo(RFC_SEGREDO, 2000000000 * 1000), '279037');

  console.log('\n— verificação —');
  const agora = Date.now();
  const segredo = gerarSegredo();

  checa('código do momento é aceito',
    verificarCodigo(segredo, gerarCodigo(segredo, agora), agora), true);
  checa('código da janela anterior é aceito (relógio atrasado)',
    verificarCodigo(segredo, gerarCodigo(segredo, agora - 30_000), agora), true);
  checa('código da janela seguinte é aceito (relógio adiantado)',
    verificarCodigo(segredo, gerarCodigo(segredo, agora + 30_000), agora), true);
  checa('código de 5 janelas atrás é recusado',
    verificarCodigo(segredo, gerarCodigo(segredo, agora - 150_000), agora), false);
  checa('código de outro segredo é recusado',
    verificarCodigo(segredo, gerarCodigo(gerarSegredo(), agora), agora), false);
  checa('código vazio é recusado', verificarCodigo(segredo, '', agora), false);
  checa('texto no lugar do código é recusado', verificarCodigo(segredo, 'abcdef', agora), false);
  checa('código curto é recusado', verificarCodigo(segredo, '12345', agora), false);

  console.log('\n— segredo e cadastro —');
  checa('segredo tem 32 caracteres base32', /^[A-Z2-7]{32}$/.test(gerarSegredo()), true);
  checa('dois segredos seguidos são diferentes', gerarSegredo() === gerarSegredo(), false);
  const uri = uriDeCadastro('ABCDEFGHIJKLMNOP', 'foto@exemplo.com');
  checa('URI é otpauth válida', uri.startsWith('otpauth://totp/'), true);
  checa('URI carrega o segredo', uri.includes('secret=ABCDEFGHIJKLMNOP'), true);

  console.log('\n— códigos de recuperação —');
  const codigos = gerarCodigosDeRecuperacao();
  checa('gera 8 códigos', codigos.length, 8);
  checa('todos no formato XXXXX-XXXXX', codigos.every((c) => /^[0-9A-F]{5}-[0-9A-F]{5}$/.test(c)), true);
  checa('sem repetidos', new Set(codigos).size, 8);

  console.log(falhas === 0 ? '\ntodos passaram' : `\n${falhas} falha(s)`);
  process.exit(falhas === 0 ? 0 : 1);
}

main();
