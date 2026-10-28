/**
 * Checks local secret files and optionally pings Meta Model API.
 * Usage: node scripts/verify-meta-setup.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function readEnvFile(rel) {
  const p = path.join(root, rel);
  if (!fs.existsSync(p)) return {};
  const out = {};
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i === -1) continue;
    out[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return out;
}

const secrets = { ...readEnvFile('supabase/.env.local'), ...readEnvFile('supabase/.env.secrets') };
const appEnv = readEnvFile('.env');

const modelKey = secrets.MODEL_API_KEY;
const projectId = appEnv.EXPO_PUBLIC_META_AI_PROJECT_ID;
const teamId = appEnv.EXPO_PUBLIC_META_AI_TEAM_ID;
const businessSuiteId = appEnv.EXPO_PUBLIC_META_BUSINESS_SUITE_ID;
const waba = appEnv.EXPO_PUBLIC_META_WABA_ID;

console.log('Meta / hackathon setup check\n');
console.log(
  `  Meta AI Project ID (.env): ${projectId ? `${projectId.slice(0, 6)}…` : '(optional EXPO_PUBLIC_META_AI_PROJECT_ID)'}`
);
console.log(
  `  Meta AI Team ID (.env): ${teamId ? `${teamId.slice(0, 6)}…` : '(optional EXPO_PUBLIC_META_AI_TEAM_ID)'}`
);
console.log(
  `  Business Suite ID (.env): ${businessSuiteId ? `${businessSuiteId.slice(0, 6)}…` : '(optional EXPO_PUBLIC_META_BUSINESS_SUITE_ID)'}`
);
console.log(
  `  WhatsApp WABA ID (.env): ${waba ? `${waba.slice(0, 6)}…` : '(set EXPO_PUBLIC_META_WABA_ID from developers.facebook.com API Setup)'}`
);
console.log(`  MODEL_API_KEY in supabase secrets file: ${modelKey ? 'set' : 'MISSING — add to supabase/.env.secrets'}`);
console.log(`  META_ACCESS_TOKEN: ${secrets.META_ACCESS_TOKEN ? 'set' : 'missing (needed for webhook transcript download)'}`);
console.log(`  META_APP_SECRET: ${secrets.META_APP_SECRET ? 'set' : 'missing'}`);
console.log(`  META_VERIFY_TOKEN: ${secrets.META_VERIFY_TOKEN ? 'set' : 'missing'}`);

if (!modelKey) {
  console.log('\nSummaries use Muse Spark only after MODEL_API_KEY is on Supabase Edge (npm run supabase:secrets).');
  process.exit(0);
}

const body = JSON.stringify({
  model: 'muse-spark-1.3',
  max_tokens: 16,
  messages: [{ role: 'user', content: 'Reply with exactly: OK' }],
});

try {
  const res = await fetch('https://api.meta.ai/v1/messages', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${modelKey}`,
      'Content-Type': 'application/json',
    },
    body,
  });
  const text = await res.text();
  if (!res.ok) {
    console.log(`\nMeta Model API: HTTP ${res.status} — ${text.slice(0, 200)}`);
    process.exit(1);
  }
  console.log('\nMeta Model API (muse-spark-1.3): OK');
} catch (e) {
  console.log('\nMeta Model API request failed:', e.message);
  process.exit(1);
}
