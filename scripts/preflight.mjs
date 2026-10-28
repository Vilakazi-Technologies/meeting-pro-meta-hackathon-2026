/**
 * Run before `npm run web` — catches wrong folder / missing install (common on Windows).
 * Usage: npm run preflight
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const warnings = [];

function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
if (pkg.name !== 'whatsapp-transcriber') {
  errors.push('Wrong folder: open a terminal in meeting-pro-hackathon (package name whatsapp-transcriber).');
}

const entry = pkg.main || 'node_modules/expo/AppEntry.js';
if (!exists(entry)) {
  errors.push(
    `Expo entry missing: ${entry}\n` +
      '  Fix: cd to the repo root, then run: npm install',
  );
}

if (!exists('node_modules')) {
  errors.push('node_modules/ missing — run: npm install');
}

if (!exists('.env')) {
  warnings.push(
    '.env missing — copy .env.example to .env and add Clerk + Supabase keys.\n' +
      '  Or use production: https://meeting-pro-rho.vercel.app',
  );
}

if (!exists('supabase/.env.local')) {
  warnings.push('supabase/.env.local missing — MODEL_API_KEY for Edge Functions (or set in Supabase Dashboard).');
}

if (!exists('supabase/functions/summarize-transcript/index.ts')) {
  errors.push('supabase/functions/summarize-transcript/index.ts not found — are you in the hackathon clone?');
}

console.log(`Meeting Pro preflight — ${root}\n`);

if (warnings.length) {
  console.log('Warnings:');
  for (const w of warnings) console.log(`  • ${w.replace(/\n/g, '\n    ')}`);
  console.log('');
}

if (errors.length) {
  console.log('Errors (fix these first):');
  for (const e of errors) console.log(`  • ${e.replace(/\n/g, '\n    ')}`);
  process.exit(1);
}

console.log('OK — run: npm run web:clear');
console.log('Then open: http://localhost:8081');
