import sharp from 'sharp';
import { readdir, stat } from 'fs/promises';
import { join, basename, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TAROT_DIR = join(__dirname, '..', 'public', 'tarot');

const files = await readdir(TAROT_DIR);
const jpgs = files.filter(f => extname(f).toLowerCase() === '.jpg');

let totalBefore = 0;
let totalAfter = 0;

for (const file of jpgs) {
  const src = join(TAROT_DIR, file);
  const dest = join(TAROT_DIR, basename(file, '.jpg') + '.webp');

  const before = (await stat(src)).size;
  await sharp(src)
    .webp({ quality: 82, effort: 5 })
    .toFile(dest);
  const after = (await stat(dest)).size;

  totalBefore += before;
  totalAfter += after;
  console.log(`${file} → ${basename(dest)}  ${(before / 1024).toFixed(0)}KB → ${(after / 1024).toFixed(0)}KB (-${Math.round((1 - after / before) * 100)}%)`);
}

console.log(`\n합계: ${(totalBefore / 1024 / 1024).toFixed(1)}MB → ${(totalAfter / 1024 / 1024).toFixed(1)}MB (-${Math.round((1 - totalAfter / totalBefore) * 100)}%)`);
