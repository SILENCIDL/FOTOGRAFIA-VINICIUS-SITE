/**
 * Pipeline de otimização de imagens
 * --------------------------------------------------------------
 * Gera uma versão .webp ao lado de cada .jpg/.jpeg/.png em assets/img,
 * sem apagar os originais. Não toca em arquivos que já têm .webp atualizado.
 *
 * Uso:
 *   npm i -D sharp        (uma vez)
 *   node scripts/optimize-images.mjs
 *
 * Para gerar também versões responsivas (srcset), preencha WIDTHS abaixo,
 * ex.: const WIDTHS = [480, 960, 1600];
 */

import { readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve('assets/img');
const EXT = new Set(['.jpg', '.jpeg', '.png']);
const QUALITY = 80;
const WIDTHS = []; // vazio = só o tamanho original. Ex.: [480, 960, 1600]

let count = 0;
let savedBytes = 0;

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) { await walk(full); continue; }
    if (EXT.has(path.extname(e.name).toLowerCase())) await convert(full);
  }
}

async function convert(file) {
  const base = file.slice(0, -path.extname(file).length);
  const targets = WIDTHS.length ? WIDTHS : [null];
  for (const w of targets) {
    const out = w ? `${base}-${w}.webp` : `${base}.webp`;
    if (existsSync(out)) continue;
    const img = sharp(file);
    if (w) img.resize({ width: w, withoutEnlargement: true });
    await img.webp({ quality: QUALITY }).toFile(out);
    try {
      const [a, b] = await Promise.all([stat(file), stat(out)]);
      if (!w) savedBytes += a.size - b.size;
    } catch { /* ignore */ }
    count++;
    console.log(`✓ ${path.relative('.', out)}`);
  }
}

if (!existsSync(ROOT)) {
  console.error(`Pasta não encontrada: ${ROOT}. Rode a partir da raiz do projeto.`);
  process.exit(1);
}

await walk(ROOT);
console.log(`\n${count} arquivo(s) .webp gerado(s). Economia aproximada: ${(savedBytes / 1024 / 1024).toFixed(1)} MB.`);
