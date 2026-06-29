import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.dirname(__filename);
const fontsDir = path.join(repoRoot, '..', 'public', 'fonts');

const candidates = [
  'NotoSans-Regular.ttf', 'NotoSans-Bold.ttf',
  'DejaVuSans.ttf', 'DejaVuSans-Bold.ttf',
  'Roboto-Regular.ttf', 'Roboto-Bold.ttf',
  'Arial.ttf', 'Arial-Bold.ttf', 'arial.ttf', 'arialbd.ttf'
];

async function main() {
  try {
    const stat = await fs.stat(fontsDir).catch(() => null);
    if (!stat || !stat.isDirectory()) {
      console.error('verify-unicode-fonts: public/fonts directory not found at', fontsDir);
      process.exit(2);
    }

    let found = [];
    for (const f of candidates) {
      try {
        const p = path.join(fontsDir, f);
        const s = await fs.stat(p).catch(() => null);
        if (s && s.isFile()) found.push(f);
      } catch {}
    }

    if (found.length === 0) {
      console.error('verify-unicode-fonts: No recommended Unicode TTF fonts found in public/fonts.');
      console.error('Please add NotoSans or DejaVu/Roboto/Arial TTF files to public/fonts.');
      process.exit(3);
    }

    console.log('verify-unicode-fonts: Found fonts:', found.join(', '));
    process.exit(0);
  } catch (err) {
    console.error('verify-unicode-fonts: unexpected error', err);
    process.exit(4);
  }
}

main();
