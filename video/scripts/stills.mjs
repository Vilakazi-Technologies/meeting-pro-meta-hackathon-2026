// Bundle once, render a still per key frame into out/stills/ for review.
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import { mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const frames = process.argv.slice(2).map(Number);
const outDir = join(root, 'out', 'stills');
mkdirSync(outDir, { recursive: true });

const serveUrl = await bundle({ entryPoint: join(root, 'src', 'index.ts') });
const composition = await selectComposition({ serveUrl, id: 'MeetingProDemo', inputProps: { music: false } });

for (const frame of frames) {
  const output = join(outDir, `f${String(frame).padStart(4, '0')}.png`);
  await renderStill({ composition, serveUrl, frame, output, inputProps: { music: false }, scale: 0.5 });
  console.log('rendered', output);
}
