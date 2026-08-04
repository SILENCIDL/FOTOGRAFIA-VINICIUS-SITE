import { createHash, randomUUID } from 'crypto';
import { mkdir, writeFile, readFile, unlink, stat } from 'fs/promises';
import { join } from 'path';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

const ALLOWED_MIME_TYPES = new Set(
  (process.env.ALLOWED_MIME_TYPES ||
    'image/jpeg,image/png,image/webp,image/avif,application/pdf').split(','),
);

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE_MB || '50', 10) * 1024 * 1024;

/**
 * Extensão que cada tipo recebe no disco.
 *
 * O nome guardado é montado por NÓS a partir deste mapa, nunca a partir do
 * nome que veio junto do arquivo. Antes a extensão saía de
 * `extname(file.name)`, ou seja, de texto escolhido por quem envia: um
 * "foto.html" virava um arquivo .html dentro da pasta servida.
 */
const EXTENSAO: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/avif': '.avif',
  'application/pdf': '.pdf',
};

/** chave gerada por nós: 32 hex + extensão de um tipo conhecido */
const CHAVE_VALIDA = /^[a-f0-9]{32}\.(jpg|png|webp|avif|pdf)$/;

export interface StoredFile {
  storageKey: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  path: string;
}

export function isAllowedMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.has(mimeType);
}

export function getMaxFileSize(): number {
  return MAX_FILE_SIZE;
}

/**
 * Descobre o tipo pelos PRIMEIROS BYTES do arquivo, não pelo que o cliente
 * declarou.
 *
 * O `file.type` de um multipart é texto que o remetente escreve: mandar um
 * executável rotulado `image/jpeg` passava direto pela conferência antiga.
 * Assinatura de arquivo não se falsifica sem de fato virar aquele formato.
 */
export function detectarTipoReal(bytes: Uint8Array): string | null {
  const b = bytes;
  const casa = (offset: number, texto: string) =>
    [...texto].every((c, i) => b[offset + i] === c.charCodeAt(0));

  if (b.length < 12) return null;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b[0] === 0x89 && casa(1, 'PNG')) return 'image/png';
  if (casa(0, 'RIFF') && casa(8, 'WEBP')) return 'image/webp';
  if (casa(4, 'ftyp') && (casa(8, 'avif') || casa(8, 'avis'))) return 'image/avif';
  if (casa(0, '%PDF-')) return 'application/pdf';
  return null;
}

export function generateStorageKey(mimeType: string): string {
  const hash = createHash('sha256')
    .update(`${randomUUID()}-${Date.now()}`)
    .digest('hex');
  return `${hash.slice(0, 32)}${EXTENSAO[mimeType]}`;
}

/**
 * Caminho no disco a partir da chave.
 *
 * A conferência do formato existe para que nenhuma chave vinda de fora — de
 * um registro adulterado, de código futuro menos cuidadoso — vire `..` no
 * meio do caminho e leve a leitura para fora da pasta de uploads.
 */
function caminhoDe(storageKey: string): string {
  if (!CHAVE_VALIDA.test(storageKey)) {
    throw new Error('storageKey inválida');
  }
  return join(UPLOAD_DIR, storageKey.slice(0, 2), storageKey);
}

export async function saveFile(file: File): Promise<StoredFile> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`Arquivo excede o tamanho máximo de ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  const bytes = new Uint8Array(await file.arrayBuffer());

  // o tipo que vale é o dos bytes; o declarado é só uma sugestão
  const tipoReal = detectarTipoReal(bytes);
  if (!tipoReal) {
    throw new Error('Arquivo não reconhecido como imagem ou PDF.');
  }
  if (!isAllowedMimeType(tipoReal)) {
    throw new Error(`Tipo de arquivo não permitido: ${tipoReal}`);
  }

  const storageKey = generateStorageKey(tipoReal);
  const path = caminhoDe(storageKey);
  await mkdir(join(UPLOAD_DIR, storageKey.slice(0, 2)), { recursive: true });
  await writeFile(path, bytes);

  return {
    storageKey,
    originalName: file.name,
    mimeType: tipoReal,
    sizeBytes: file.size,
    path,
  };
}

export async function readStoredFile(
  storageKey: string,
): Promise<{ buffer: Buffer; mimeType: string }> {
  const path = caminhoDe(storageKey);
  const buffer = await readFile(path);

  // o tipo sai dos bytes de novo, não da extensão: assim o que é servido é
  // sempre o que o arquivo realmente é
  const tipo = detectarTipoReal(new Uint8Array(buffer.subarray(0, 16)));
  return { buffer, mimeType: tipo || 'application/octet-stream' };
}

export async function deleteStoredFile(storageKey: string): Promise<void> {
  try {
    await unlink(caminhoDe(storageKey));
  } catch {
    // ignore if not found
  }
}

export async function fileExists(storageKey: string): Promise<boolean> {
  try {
    await stat(caminhoDe(storageKey));
    return true;
  } catch {
    return false;
  }
}
