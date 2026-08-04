import { createHash } from 'crypto';
import { mkdir, writeFile, readFile, unlink, stat } from 'fs/promises';
import { join, extname } from 'path';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

const ALLOWED_MIME_TYPES = new Set(
  (process.env.ALLOWED_MIME_TYPES || 'image/jpeg,image/png,image/webp,image/avif,application/pdf').split(',')
);

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE_MB || '50', 10) * 1024 * 1024;

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

export function generateStorageKey(originalName: string): string {
  const hash = createHash('sha256').update(`${originalName}-${Date.now()}-${Math.random()}`).digest('hex');
  const ext = extname(originalName).toLowerCase();
  return `${hash.slice(0, 32)}${ext}`;
}

export async function saveFile(file: File): Promise<StoredFile> {
  if (!isAllowedMimeType(file.type)) {
    throw new Error(`Tipo de arquivo não permitido: ${file.type}`);
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`Arquivo excede o tamanho máximo de ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const storageKey = generateStorageKey(file.name);
  const dir = join(UPLOAD_DIR, storageKey.slice(0, 2));
  await mkdir(dir, { recursive: true });
  const path = join(dir, storageKey);
  await writeFile(path, bytes);

  return {
    storageKey,
    originalName: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
    path,
  };
}

export async function readStoredFile(storageKey: string): Promise<{ buffer: Buffer; mimeType: string }> {
  const dir = join(UPLOAD_DIR, storageKey.slice(0, 2));
  const path = join(dir, storageKey);
  const buffer = await readFile(path);
  // infer mime from extension fallback
  const ext = extname(storageKey).toLowerCase();
  const mimeType =
    ext === '.pdf'
      ? 'application/pdf'
      : ext === '.png'
      ? 'image/png'
      : ext === '.webp'
      ? 'image/webp'
      : ext === '.avif'
      ? 'image/avif'
      : 'image/jpeg';
  return { buffer, mimeType };
}

export async function deleteStoredFile(storageKey: string): Promise<void> {
  const dir = join(UPLOAD_DIR, storageKey.slice(0, 2));
  const path = join(dir, storageKey);
  try {
    await unlink(path);
  } catch {
    // ignore if not found
  }
}

export async function fileExists(storageKey: string): Promise<boolean> {
  const dir = join(UPLOAD_DIR, storageKey.slice(0, 2));
  const path = join(dir, storageKey);
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}
