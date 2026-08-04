/**
 * Segundo fator (TOTP, RFC 6238) — o código de 6 dígitos do Google
 * Authenticator, Authy, 1Password e afins.
 *
 * Sem biblioteca nova: TOTP é HMAC-SHA1 sobre o número da janela de 30
 * segundos, e o Node já traz HMAC. Menos dependência é menos superfície de
 * supply chain para uma coisa que fica no caminho do login.
 *
 * O segredo de cada conta é guardado CRIPTOGRAFADO no banco (encrypt/decrypt
 * de crypto.ts): quem levar um dump do Postgres leva o segredo inútil, sem a
 * APP_ENCRYPTION_KEY.
 */
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

const DIGITOS = 6;
const PASSO_S = 30;
/** aceita a janela anterior e a próxima: relógio de celular atrasa */
const TOLERANCIA_JANELAS = 1;

const ALFABETO_B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function gerarSegredo(): string {
  const buf = randomBytes(20); // 160 bits, o recomendado pela RFC 4226
  let bits = '';
  for (const b of buf) bits += b.toString(2).padStart(8, '0');
  let saida = '';
  for (let i = 0; i + 5 <= bits.length; i += 5) {
    saida += ALFABETO_B32[parseInt(bits.slice(i, i + 5), 2)];
  }
  return saida;
}

function base32ParaBytes(segredo: string): Buffer {
  const limpo = segredo.toUpperCase().replace(/=+$/, '').replace(/\s/g, '');
  let bits = '';
  for (const c of limpo) {
    const idx = ALFABETO_B32.indexOf(c);
    if (idx === -1) throw new Error('segredo TOTP inválido');
    bits += idx.toString(2).padStart(5, '0');
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

function codigoDaJanela(segredo: string, janela: number): string {
  const contador = Buffer.alloc(8);
  contador.writeBigUInt64BE(BigInt(janela));
  const hmac = createHmac('sha1', base32ParaBytes(segredo)).update(contador).digest();

  // truncamento dinâmico da RFC 4226
  const offset = hmac[hmac.length - 1] & 0x0f;
  const valor =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  return (valor % 10 ** DIGITOS).toString().padStart(DIGITOS, '0');
}

export function gerarCodigo(segredo: string, quando: number = Date.now()): string {
  return codigoDaJanela(segredo, Math.floor(quando / 1000 / PASSO_S));
}

/**
 * Confere o código.
 *
 * A comparação é em tempo constante: comparar com === vaza, pelo tempo de
 * resposta, quantos dígitos iniciais estavam certos, e isso transforma
 * adivinhar 6 dígitos em adivinhar um dígito seis vezes.
 */
export function verificarCodigo(
  segredo: string,
  informado: string,
  quando: number = Date.now(),
): boolean {
  const limpo = (informado || '').replace(/\s/g, '');
  if (!/^\d{6}$/.test(limpo)) return false;

  const janelaAtual = Math.floor(quando / 1000 / PASSO_S);
  let valido = false;
  for (let d = -TOLERANCIA_JANELAS; d <= TOLERANCIA_JANELAS; d++) {
    const esperado = Buffer.from(codigoDaJanela(segredo, janelaAtual + d));
    const recebido = Buffer.from(limpo);
    // sem short-circuit: percorre todas as janelas mesmo depois de acertar,
    // para o tempo de resposta não contar qual janela bateu
    if (esperado.length === recebido.length && timingSafeEqual(esperado, recebido)) {
      valido = true;
    }
  }
  return valido;
}

/** URI que vira o QR Code na hora de cadastrar o app autenticador. */
export function uriDeCadastro(segredo: string, email: string, emissor = 'Vinícius Rafael'): string {
  const rotulo = encodeURIComponent(`${emissor}:${email}`);
  const params = new URLSearchParams({
    secret: segredo,
    issuer: emissor,
    algorithm: 'SHA1',
    digits: String(DIGITOS),
    period: String(PASSO_S),
  });
  return `otpauth://totp/${rotulo}?${params.toString()}`;
}

/**
 * Códigos de recuperação — para o dia em que o celular quebrar ou for
 * trocado. Sem eles, perder o aparelho é perder o painel para sempre.
 * Guardados como hash, do mesmo jeito que senha; cada um serve uma vez só.
 */
export function gerarCodigosDeRecuperacao(quantos = 8): string[] {
  return Array.from({ length: quantos }, () =>
    randomBytes(5).toString('hex').toUpperCase().match(/.{1,5}/g)!.join('-'),
  );
}
