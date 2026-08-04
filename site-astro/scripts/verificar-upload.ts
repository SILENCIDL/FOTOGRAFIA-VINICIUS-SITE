/**
 * Verificação das defesas do upload — roda sem banco e sem servidor.
 *
 *   npm run test:upload
 *
 * Cobre as duas perguntas que importam:
 *   1. um arquivo mentindo sobre o próprio tipo passa?
 *   2. uma chave de armazenamento adulterada consegue apontar para fora da
 *      pasta de uploads?
 */
import { detectarTipoReal, generateStorageKey, readStoredFile } from '../src/lib/storage';

let falhas = 0;
function checa(nome: string, real: unknown, esperado: unknown) {
  const ok = real === esperado;
  if (!ok) falhas++;
  console.log(`${ok ? '  ok  ' : ' FALHA'}  ${nome}${ok ? '' : `  (esperado ${esperado}, veio ${real})`}`);
}

function bytes(...partes: (number | string)[]): Uint8Array {
  const out: number[] = [];
  for (const p of partes) {
    if (typeof p === 'number') out.push(p);
    else for (const c of p) out.push(c.charCodeAt(0));
  }
  while (out.length < 16) out.push(0);
  return new Uint8Array(out);
}

async function main() {
  console.log('— tipo real pelos bytes —');
  checa('JPEG reconhecido', detectarTipoReal(bytes(0xff, 0xd8, 0xff, 0xe0)), 'image/jpeg');
  checa('PNG reconhecido', detectarTipoReal(bytes(0x89, 'PNG', 0x0d, 0x0a)), 'image/png');
  checa('WebP reconhecido', detectarTipoReal(bytes('RIFF', 0, 0, 0, 0, 'WEBP')), 'image/webp');
  checa('AVIF reconhecido', detectarTipoReal(bytes(0, 0, 0, 0, 'ftypavif')), 'image/avif');
  checa('PDF reconhecido', detectarTipoReal(bytes('%PDF-1.7')), 'application/pdf');

  // este é o furo antigo: bastava rotular o multipart como image/jpeg
  checa('executável (MZ) rotulado de imagem é recusado',
    detectarTipoReal(bytes('MZ', 0x90, 0x00, 0x03)), null);
  checa('HTML disfarçado de imagem é recusado',
    detectarTipoReal(bytes('<html><script>')), null);
  checa('SVG (permite script) é recusado',
    detectarTipoReal(bytes('<svg xmlns="http')), null);
  checa('arquivo curto demais é recusado',
    detectarTipoReal(new Uint8Array([0xff, 0xd8])), null);

  console.log('\n— chave de armazenamento —');
  const chave = generateStorageKey('image/jpeg');
  checa('chave gerada tem o formato esperado',
    /^[a-f0-9]{32}\.jpg$/.test(chave), true);
  checa('extensão vem do tipo real, não do nome enviado',
    generateStorageKey('application/pdf').endsWith('.pdf'), true);

  console.log('\n— travessia de caminho —');
  for (const ruim of [
    '../../../../etc/passwd',
    '..\\..\\windows\\win.ini',
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.html',
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.jpg/../../x',
    '/etc/shadow',
  ]) {
    let recusou = false;
    try {
      await readStoredFile(ruim);
    } catch (e) {
      recusou = e instanceof Error && e.message === 'storageKey inválida';
    }
    checa(`chave "${ruim}" é recusada`, recusou, true);
  }

  console.log(falhas === 0 ? '\ntodos passaram' : `\n${falhas} falha(s)`);
  process.exit(falhas === 0 ? 0 : 1);
}

main();
